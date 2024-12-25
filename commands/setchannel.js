const { PermissionsBitField } = require('discord.js');
const { getDb } = require('../services/database');

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
    // Check if the user has administrator permissions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({
        content: 'You need Administrator permissions to use this command.',
        ephemeral: true
      });
      return;
    }

    const guildId = interaction.guildId;
    const channel = interaction.options.getChannel('channel');
    const db = getDb();

    try {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO guild_settings (guild_id, channel_id) VALUES (?, ?)
           ON CONFLICT(guild_id) DO UPDATE SET channel_id=excluded.channel_id`,
          [guildId, channel.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      await interaction.reply({
        content: `${channel} is now set for automatic publication of race results.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error saving channel settings:', error);
      await interaction.reply({
        content: 'Failed to save channel settings.',
        ephemeral: true
      });
    }
  },
};