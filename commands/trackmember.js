const { getDb } = require('../services/database');

module.exports = {
  name: 'trackmember',
  description: 'Track race results for a specific member ID.',
  options: [
    {
      name: 'customer_id',
      description: 'The iRacing customer ID of the player.',
      type: 3,
      required: true,
    },
  ],
  async execute(interaction) {
    const guildId = interaction.guildId;
    const channelId = interaction.channelId;
    const customer_id = interaction.options.getString('customer_id');
    const db = getDb();

    if (!customer_id) {
      await interaction.reply('Please provide a valid member ID to track.');
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO tracked_data (guild_id, channel_id, driver_id) VALUES (?, ?, ?)
           ON CONFLICT(driver_id) DO NOTHING`,
          [guildId, channelId, customer_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await interaction.reply(`Tracking started for member ID \`${customer_id}\`.`);
    } catch (error) {
      console.error('Error saving tracking data:', error);
      await interaction.reply('Failed to add tracking for the member ID.');
    }
  },
};