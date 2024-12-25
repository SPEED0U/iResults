const { getDb } = require('../services/database');
const { fetchLastRaceResults, fetchCarInfo, fetchMemberInfo } = require('../services/iracing');
const { buildRaceResultsEmbed } = require('./embedBuilder');
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

        const db = getDb();
        const channelId = await new Promise((resolve, reject) => {
          db.get(`SELECT channel_id FROM guild_settings WHERE guild_id = ?`, [guild_id], (err, row) => {
            if (err) reject(err);
            else resolve(row?.channel_id);
          });
        });

        if (channelId) {
          const channel = client.channels.cache.get(channelId);
          if (channel) {
            await channel.send({ embeds: [embed] });

            await new Promise((resolve, reject) => {
              db.run(
                `UPDATE tracked_data SET last_race_id = ? WHERE driver_id = ?`,
                [lastRace.subsession_id, driver_id],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
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
    const db = getDb();
    const rows = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM tracked_data`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

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