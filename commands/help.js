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
        { 
          name: '/lastrace', 
          value: '`/lastrace customer_id:<id>`\nFetches the last race results for a specific iRacing customer.', 
          inline: false 
        },
        { 
          name: '/setchannel', 
          value: '`/setchannel channel:<#channel>`\nSets the specified channel for automatic race result publication.\n*Requires Administrator permissions*', 
          inline: false 
        },
        { 
          name: '/trackmember', 
          value: '`/trackmember customer_id:<id>`\nTracks race results for a specified iRacing customer ID.', 
          inline: false 
        },
        { 
          name: '/untrackmember', 
          value: '`/untrackmember customer_id:<id>`\nStops tracking race results for a specified iRacing customer ID.', 
          inline: false 
        },
        { 
          name: '/help', 
          value: 'Displays this help message.', 
          inline: false 
        }
      )
      .addFields(
        {
          name: 'Finding your Customer ID',
          value: '1. Log in to iRacing\n2. Click your helmet (top-right)\n3. Look for `Customer ID #123456` at the top',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'iResults', iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  },
};