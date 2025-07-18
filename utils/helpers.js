const db = require('../services/database');
const { fetchLastRaceResults, fetchCarInfo, fetchMemberInfo } = require('../services/iracing');
const { buildRaceResultsEmbed, buildErrorEmbed } = require('./embedBuilder');
const discordService = require('../services/discord');
const { INTERVALS, CONCURRENCY, LOG_MESSAGES } = require('./performance');
const { ActivityType } = require('discord.js');

// Optimisation : Limiter le nombre de traitements simultanés
const MAX_CONCURRENT_DRIVERS = CONCURRENCY.MAX_CONCURRENT_DRIVERS;
let currentProcessingCount = 0;

// Fonction pour mettre à jour le statut Discord
async function updateDiscordStatus() {
  try {
    const client = discordService.getClient();
    if (!client) {
      console.error('[STATUS] Discord client not initialized');
      return;
    }

    // Compter le nombre total de pilotes trackés
    const trackedDrivers = await db.getTrackedDrivers();
    const driverCount = trackedDrivers.length;
    
    // Mettre à jour le statut avec un type Custom (pas de préfixe ajouté par Discord)
    await client.user.setActivity(`Watching ${driverCount} drivers racing.`, { 
      type: ActivityType.Custom 
    });
    
    console.log(`${LOG_MESSAGES.STATUS_UPDATED}: Watching ${driverCount} drivers racing.`);
    return driverCount;
  } catch (error) {
    console.error('[STATUS] Error updating Discord status:', error);
    return 0;
  }
}

// Fonction pour nettoyer les channels invalides de la base de données
async function cleanupInvalidChannels() {
  try {
    const client = discordService.getClient();
    if (!client) {
      console.error('[CLEANUP] Discord client not initialized');
      return;
    }

    console.log(LOG_MESSAGES.CLEANUP_STARTED);
    
    // Récupérer tous les paramètres de guildes
    const allGuildSettings = await db.getAllGuildSettings();
    let cleanedCount = 0;

    for (const settings of allGuildSettings) {
      const { guild_id, channel_id } = settings;
      
      // Vérifier si la guilde existe encore
      const guild = client.guilds.cache.get(guild_id);
      if (!guild) {
        console.log(`${LOG_MESSAGES.INVALID_GUILD}: ${guild_id}`);
        await db.removeGuild(guild_id);
        cleanedCount++;
        continue;
      }

      // Vérifier si le channel existe encore dans la guilde
      const channel = guild.channels.cache.get(channel_id);
      if (!channel) {
        console.log(`${LOG_MESSAGES.INVALID_CHANNEL}: ${channel_id} in guild ${guild.name} (${guild_id})`);
        await db.removeGuild(guild_id);
        cleanedCount++;
        continue;
      }

      // Vérifier les permissions du bot sur le channel
      const permissions = channel.permissionsFor(client.user);
      if (!permissions?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
        console.log(`${LOG_MESSAGES.MISSING_PERMISSIONS}: ${channel.name} (${channel_id}) in guild ${guild.name}`);
        await db.removeGuild(guild_id);
        cleanedCount++;
      }
    }

    console.log(`${LOG_MESSAGES.CLEANUP_COMPLETED}. Removed ${cleanedCount} invalid entries`);
    return cleanedCount;
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
    return 0;
  }
}

const processDriverResults = async (guild_id, driver_id, last_race_id) => {
  // Limiter le nombre de traitements simultanés pour réduire la charge CPU
  if (currentProcessingCount >= MAX_CONCURRENT_DRIVERS) {
    console.log(`${LOG_MESSAGES.RACE_RESULTS_SKIPPED}: driver ${driver_id}`);
    return;
  }

  currentProcessingCount++;
  
  try {
    const results = await fetchLastRaceResults(driver_id);
    const carData = await fetchCarInfo();
    const displayName = await fetchMemberInfo(driver_id);
    const client = discordService.getClient();

    if (!client) {
      console.error('Discord client not initialized');
      return;
    }

    if (results?.races?.length > 0) {
      const lastRace = results.races[0];

      if (lastRace.subsession_id != last_race_id) {
        const carInfo = carData.find(car => car.car_id === lastRace.car_id);
        const carName = carInfo?.car_name || 'Unknown Car';
        const iRatingChange = lastRace.newi_rating - lastRace.oldi_rating;
        const iRatingChangeFormatted = iRatingChange > 0 ? `+${iRatingChange}` : `${iRatingChange}`;

        const embed = buildRaceResultsEmbed(lastRace, displayName, carName, iRatingChangeFormatted, client, driver_id);

        const settings = await db.getGuildSettings(guild_id);
        const channelId = settings?.channel_id;

        if (channelId) {
          const channel = client.channels.cache.get(channelId);
          if (!channel) {
            console.error(`Channel ${channelId} not found in guild ${guild_id}`);
            // Supprimer automatiquement l'entrée si le channel n'existe plus
            await db.removeGuild(guild_id);
            return;
          }

          const permissions = channel.permissionsFor(client.user);
          if (!permissions?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
            console.error(`Missing required permissions in channel ${channelId} (${channel.name}) in guild ${guild_id}`);
            
            // Remove tracking entry due to permission issues
            await db.removeGuild(guild_id);
            return;
          }

          try {
            await channel.send({ embeds: [embed] });
            await db.updateLastRaceId(driver_id, lastRace.subsession_id);
          } catch (error) {
            console.error(`Failed to send message in channel ${channelId}: ${error.message}`);
            return;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing results for driver ${driver_id}:`, error);
  } finally {
    currentProcessingCount--;
  }
};

async function publishRaceResults() {
  try {
    const rows = await db.getTrackedDrivers();
    
    // Optimisation : Traiter les pilotes par petits groupes pour éviter la surcharge
    const batchSize = CONCURRENCY.DRIVER_BATCH_SIZE;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      // Traiter le batch avec un délai pour réduire la charge CPU
      const promises = batch.map(async (row, index) => {
        // Ajouter un délai progressif pour étaler la charge
        await new Promise(resolve => setTimeout(resolve, index * CONCURRENCY.BATCH_ITEM_DELAY));
        const { guild_id, driver_id, last_race_id } = row;
        return processDriverResults(guild_id, driver_id, last_race_id);
      });
      
      await Promise.all(promises);
      
      // Pause entre les batches pour éviter la surcharge
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, CONCURRENCY.BATCH_DELAY));
      }
    }
  } catch (error) {
    console.error('Error publishing race results:', error);
  }
}

// Fonction pour exécuter le nettoyage périodique
async function scheduleCleanup() {
  // Exécuter le nettoyage immédiatement au démarrage
  await cleanupInvalidChannels();
  
  // Programmer le nettoyage selon la fréquence définie dans performance.js
  setInterval(async () => {
    await cleanupInvalidChannels();
  }, INTERVALS.CLEANUP_INVALID_CHANNELS);
}

// Fonction pour programmer la mise à jour du statut Discord
async function scheduleStatusUpdate() {
  // Mettre à jour le statut immédiatement
  await updateDiscordStatus();
  
  // Programmer la mise à jour du statut toutes les 10 minutes
  setInterval(async () => {
    await updateDiscordStatus();
  }, INTERVALS.STATUS_UPDATE);
}

module.exports = {
  processDriverResults,
  publishRaceResults,
  cleanupInvalidChannels,
  scheduleCleanup,
  updateDiscordStatus,
  scheduleStatusUpdate
};