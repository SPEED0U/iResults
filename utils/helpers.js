const db = require('../services/database');
const { fetchLastRaceResults, fetchCarInfo, fetchMemberInfo } = require('../services/iracing');
const { buildRaceResultsEmbed, buildErrorEmbed } = require('./embedBuilder');
const discordService = require('../services/discord');

const processDriverResults = async (guild_id, driver_id, last_race_id) => {
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
            return;
          }

          const permissions = channel.permissionsFor(client.user);
          if (!permissions?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
            console.error(`Missing required permissions in channel ${channelId} (${channel.name}) in guild ${guild_id}`);
            
            // Remove tracking entry due to permission issues
            await db.removeTrackedDriver(guild_id, driver_id);
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
  }
};

async function publishRaceResults() {
  try {
    const rows = await db.getTrackedDrivers();

    for (const row of rows) {
      const { guild_id, driver_id, last_race_id } = row;
      await processDriverResults(guild_id, driver_id, last_race_id);
    }
  } catch (error) {
    console.error('Error publishing race results:', error);
  }
}

module.exports = {
  processDriverResults,
  publishRaceResults
};