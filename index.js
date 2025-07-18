const { Client, GatewayIntentBits } = require('discord.js');
const db = require('./services/database');  // This now imports the MySQL service
const { authenticateIRacing, fetchLicenseData } = require('./services/iracing');
const { registerCommands } = require('./utils/commandsConfig');
const { publishRaceResults, scheduleCleanup, scheduleStatusUpdate } = require('./utils/helpers');
const discordService = require('./services/discord');
const config = require('./data/config.json');
const { INTERVALS, LOG_MESSAGES } = require('./utils/performance');

// Check if this process is being run as a shard
if (!process.env.SHARDING_MANAGER) {
  console.log('[SHD] Starting bot with sharding...');
  require('./services/shardManager.js');
  return;
}

console.log(LOG_MESSAGES.PERFORMANCE_OPTIMIZED);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  shards: 'auto'
});

discordService.setClient(client);

// Add guild deletion handler
client.on('guildDelete', async (guild) => {
  try {
    await db.removeGuild(guild.id);
    console.log(`[BOT] Cleaned up data for guild ${guild.id}`);
  } catch (error) {
    console.error(`[BOT] Error cleaning up guild ${guild.id} data:`, error);
  }
});

// Rest of the code remains the same...
async function getMemberCount() {
  let totalMembers = 0;
  
  try {
    const guilds = client.guilds.cache;
    for (const guild of guilds.values()) {
      try {
        totalMembers += guild.memberCount;
        console.log(`[SHD] Guild ${guild.name}: ${guild.memberCount} members`);
      } catch (err) {
        console.error(`[SHD] Error counting guild ${guild.name}:`, err);
      }
    }
  } catch (err) {
    console.error('[SHD] Error counting members:', err);
  }
  
  return totalMembers;
}

async function logShardStats() {
  const shardId = client.shard?.ids[0] ?? 0;
  const guildCount = client.guilds.cache.size;
  const memberCount = await getMemberCount();

  console.log(`[SHD] Shard ${shardId} stats:
    • Guilds: ${guildCount}
    • Members: ${memberCount}
    • Shard: ${shardId}/${client.shard?.count ?? 1}`
  );

  if (client.shard) {
    try {
      const guildCounts = await client.shard.fetchClientValues('guilds.cache.size');
      const totalGuilds = guildCounts.reduce((acc, count) => acc + count, 0);

      const memberCounts = await client.shard.broadcastEval(async (c) => {
        return c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      });
      const totalMembers = memberCounts.reduce((acc, count) => acc + count, 0);

      console.log(`[SHD] Total:
        • Guilds: ${totalGuilds}
        • Members: ${totalMembers}
        • Shards: ${client.shard.count}`
      );
    } catch (err) {
      console.error('[SHD] Error fetching total stats:', err);
    }
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const command = require(`./commands/${interaction.commandName}.js`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`[SHD] Command error ${interaction.commandName}:`, error);
    await interaction.reply({
      content: 'There was an error executing this command.',
      ephemeral: true
    });
  }
});

client.once('ready', async () => {
  const shardId = client.shard?.ids[0] ?? 0;
  console.log(`[SHD] Ready as ${client.user.tag} on Shard ${shardId}`);

  await registerCommands(client);
  await fetchLicenseData();

  // Démarrer le nettoyage automatique des channels invalides
  setTimeout(async () => {
    await scheduleCleanup();
  }, 5000); // Attendre 5 secondes après le démarrage

  // Démarrer la mise à jour du statut Discord
  setTimeout(async () => {
    await scheduleStatusUpdate();
  }, 10000); // Attendre 10 secondes après le démarrage

  // Réduire la fréquence des logs de stats de 5 minutes à 30 minutes
  setTimeout(async () => {
    await logShardStats();
    
    setInterval(async () => {
      await logShardStats();
    }, INTERVALS.SHARD_STATS_LOG);
  }, 1000);
});

// Optimisation : Augmenter l'intervalle de vérification des résultats de course
// de 1 minute à 5 minutes pour réduire la charge CPU
const shardCount = client.shard?.count ?? 1;
setInterval(publishRaceResults, INTERVALS.RACE_RESULTS_CHECK * shardCount);

client.login(config.token);