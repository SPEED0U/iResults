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

      await interaction.reply(`${channel} is now set for automatic publication of race results.`);
    } catch (error) {
      console.error('Error saving channel settings:', error);
      await interaction.reply('Failed to save channel settings.');
    }
  },
};