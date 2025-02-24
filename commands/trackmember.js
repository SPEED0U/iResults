const { getDb } = require('../services/database');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedBuilder');

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
      const embed = buildErrorEmbed(
        'Invalid Input',
        'Please provide a valid member ID to track.',
        interaction.client
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      // Check if member is already tracked in this guild
      const existingEntry = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM tracked_data WHERE guild_id = ? AND driver_id = ?',
          [guildId, customer_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingEntry) {
        const embed = buildErrorEmbed(
          'Already Tracked',
          `Member ID \`${customer_id}\` is already being tracked in this server.`,
          interaction.client
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Add new tracking entry
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO tracked_data (guild_id, channel_id, driver_id) VALUES (?, ?, ?)`,
          [guildId, channelId, customer_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const embed = buildSuccessEmbed(
        'Member Tracked',
        `Successfully started tracking member ID \`${customer_id}\`.\nRace results will be automatically posted in this channel.`,
        interaction.client
      );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error saving tracking data:', error);
      const embed = buildErrorEmbed(
        'Error',
        'Failed to add tracking for the member ID.',
        interaction.client
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};