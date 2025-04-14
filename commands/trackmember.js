const db = require('../services/database');
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
      const existingEntry = await db.query(
        'SELECT * FROM tracked_data WHERE guild_id = ? AND driver_id = ?',
        [guildId, customer_id]
      );

      if (existingEntry.length > 0) {
        const embed = buildErrorEmbed(
          'Already Tracked',
          `Member ID \`${customer_id}\` is already being tracked in this server.`,
          interaction.client
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Add new tracking entry
      await db.addTrackedDriver(guildId, channelId, customer_id);

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