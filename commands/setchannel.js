const { PermissionsBitField } = require('discord.js');
const db = require('../services/database');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: 'setchannel',
  description: 'Set this channel for automatic race result publication.',
  options: [
    {
      name: 'channel',
      description: 'The channel to set for automatic race result publication.',
      type: 7,
      required: true,
    },
  ],
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({
        embeds: [buildErrorEmbed(
          'Missing Permissions',
          'You need Administrator permissions to use this command.',
          interaction.client
        )],
        ephemeral: true
      });
      return;
    }

    const guildId = interaction.guildId;
    const channel = interaction.options.getChannel('channel');

    // Check bot permissions in the selected channel
    const permissions = channel.permissionsFor(interaction.client.user);
    const missingPermissions = [];

    if (!permissions.has(PermissionsBitField.Flags.ViewChannel)) {
      missingPermissions.push('View Channel');
    }
    if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
      missingPermissions.push('Send Messages');
    }
    if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
      missingPermissions.push('Embed Links');
    }

    if (missingPermissions.length > 0) {
      await interaction.reply({
        embeds: [buildErrorEmbed(
          'Missing Bot Permissions',
          `The bot is missing the following permissions in ${channel}:\n• ${missingPermissions.join('\n• ')}\n\nPlease grant these permissions and try again.`,
          interaction.client
        )],
        ephemeral: true
      });
      return;
    }

    try {
      await db.setGuildChannel(guildId, channel.id);

      await interaction.reply({
        embeds: [buildSuccessEmbed(
          'Channel Set',
          `${channel} is now set for automatic publication of race results.`,
          interaction.client
        )]
      });
    } catch (error) {
      console.error('Error saving channel settings:', error);
      await interaction.reply({
        embeds: [buildErrorEmbed(
          'Error',
          'Failed to save channel settings.',
          interaction.client
        )],
        ephemeral: true
      });
    }
  },
};