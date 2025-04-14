const db = require('../services/database');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: 'untrackmember',
  description: 'Stop tracking race results for a specific member ID.',
  options: [
    {
      name: 'customer_id',
      description: 'The iRacing customer ID of the player to untrack.',
      type: 3,
      required: true,
    },
  ],
  async execute(interaction) {
    const guildId = interaction.guildId;
    const customer_id = interaction.options.getString('customer_id');

    if (!customer_id) {
      const embed = buildErrorEmbed(
        'Invalid Input',
        'Please provide a valid member ID to untrack.',
        interaction.client
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      // Check if member is being tracked
      const existingEntry = await db.query(
        'SELECT * FROM tracked_data WHERE guild_id = ? AND driver_id = ?',
        [guildId, customer_id]
      );

      if (existingEntry.length === 0) {
        const embed = buildErrorEmbed(
          'Not Tracked',
          `Member ID \`${customer_id}\` is not being tracked in this server.`,
          interaction.client
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      // Remove tracking entry
      await db.removeTrackedDriver(guildId, customer_id);

      const embed = buildSuccessEmbed(
        'Member Untracked',
        `Successfully stopped tracking member ID \`${customer_id}\`.\nRace results will no longer be posted for this member.`,
        interaction.client
      );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error removing tracking data:', error);
      const embed = buildErrorEmbed(
        'Error',
        'Failed to remove tracking for the member ID.',
        interaction.client
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};