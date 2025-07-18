const { PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../services/database');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: 'setchannel',
  description: 'Set this channel for automatic race result publication.',
  options: [
    {
      name: 'channel',
      description: 'The channel to set for automatic race result publication.',
      type: 7, // Channel
      required: true,
    },
  ],
  async execute(interaction) {
    // Vérifie que l'interaction est dans un serveur
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        embeds: [buildErrorEmbed(
          'Not in a Server',
          'This command can only be used in a server.',
          interaction.client
        )],
        ephemeral: true
      });
      return;
    }

    // Vérifier les permissions administrateur
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
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
    const selectedChannel = interaction.options.getChannel('channel');

    // Fetch complet du salon pour éviter les objets partiels
    let channel;
    try {
      channel = await interaction.guild.channels.fetch(selectedChannel.id);
    } catch (error) {
      console.error('Failed to fetch channel:', error);
      await interaction.reply({
        embeds: [buildErrorEmbed(
          'Channel Error',
          'Could not fetch the selected channel. Please try again.',
          interaction.client
        )],
        ephemeral: true
      });
      return;
    }

    // Vérifier que c'est un salon texte approprié
    if (
      ![
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement
      ].includes(channel.type)
    ) {
      await interaction.reply({
        embeds: [buildErrorEmbed(
          'Invalid Channel Type',
          'Please select a text or announcement channel.',
          interaction.client
        )],
        ephemeral: true
      });
      return;
    }

    // Vérifie les permissions du bot dans ce salon
    const permissions = channel.permissionsFor(interaction.client.user);
    const missingPermissions = [];

    if (!permissions || !permissions.has(PermissionsBitField.Flags.ViewChannel)) {
      missingPermissions.push('View Channel');
    }
    if (!permissions || !permissions.has(PermissionsBitField.Flags.SendMessages)) {
      missingPermissions.push('Send Messages');
    }
    if (!permissions || !permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
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

    // Enregistrement dans la base de données
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
