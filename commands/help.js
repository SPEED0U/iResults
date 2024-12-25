const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Provides information on how to use the commands.',
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Command help')
      .setColor('#3498db')
      .setDescription('Here is a list of available commands and how to use them.')
      .addFields(
        { name: '/lastrace', value: '`/lastrace customer_id:<id>`\nFetches the last race results for a specific iRacing member.', inline: false },
        { name: '/setchannel', value: '`/setchannel channel:<#channel>`\nSets the specified channel for automatic race result publication.', inline: false },
        { name: '/trackmember', value: '`/trackmember customer_id:<id>`\nTracks race results for a specified iRacing member ID.', inline: false },
        { name: '/help', value: 'Displays this help message.', inline: false }
      )
      .addFields(
        {
          name: 'How to find your Customer ID on iRacing',
          value: '1. Log in to your iRacing account.\n2. Click on the helmet at top-right.\n3. The Customer ID is displayed at the top of the window like `My Account: Customer ID #123456`.',
          inline: false,
        }
      )
      .setFooter({ text: 'iResults', iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  },
};