const { EmbedBuilder } = require('discord.js');
const { getGroupNameByLicenseId } = require('../services/iracing');

function getOrdinalSuffix(position) {
  const j = position % 10;
  const k = position % 100;
  if (j === 1 && k !== 11) return `${position}st`;
  if (j === 2 && k !== 12) return `${position}nd`;
  if (j === 3 && k !== 13) return `${position}rd`;
  return `${position}th`;
}

// Enhanced value formatting with emojis and better styling
function formatValue(value, type = 'default') {
  switch (type) {
    case 'position':
      return `🏁 ${value}`;
    case 'track':
      return `🏎️ ${value}`;
    case 'car':
      return `🚗 ${value}`;
    case 'time':
      return `⏱️ ${value}`;
    case 'rating':
      return `📊 ${value}`;
    case 'license':
      return `📜 ${value}`;
    case 'incidents':
      return `⚠️ ${value}`;
    default:
      return value;
  }
}

function buildRaceResultsEmbed(lastRace, displayName, carName, iRatingChangeFormatted, client, driver_id) {
  const newSubLevel = (lastRace.new_sub_level / 100).toFixed(2);
  const subLevelChange = ((lastRace.new_sub_level - lastRace.old_sub_level) / 100).toFixed(2);
  const subLevelChangeFormatted = subLevelChange > 0 ? `+${subLevelChange}` : `${subLevelChange}`;
  const licenseGroupName = getGroupNameByLicenseId(lastRace.license_level);

  // Create sections with visual separators
  const mainSection = [
    { name: '🏆 Series', value: lastRace.series_name, inline: false },
    { name: '\u200B', value: '\u200B', inline: false }
  ];

  const raceDetails = [
    { name: '🏁 Track', value: formatValue(lastRace.track.track_name, 'track'), inline: true },
    { name: '🚗 Car', value: formatValue(carName, 'car'), inline: true },
    { name: '\u200B', value: '\u200B', inline: true }
  ];

  const positionInfo = [
    { name: '📊 Starting Position', value: formatValue(getOrdinalSuffix(lastRace.start_position), 'position'), inline: true },
    { name: '🏁 Finish Position', value: formatValue(getOrdinalSuffix(lastRace.finish_position), 'position'), inline: true },
    { name: '\u200B', value: '\u200B', inline: true }
  ];

  const raceStats = [
    { name: '⏱️ Laps Completed', value: formatValue(lastRace.laps.toString(), 'time'), inline: true },
    { name: '⚠️ Incidents', value: formatValue(lastRace.incidents.toString(), 'incidents'), inline: true },
    { name: '\u200B', value: '\u200B', inline: true }
  ];

  const ratings = [
    { name: '📈 Strength of Field', value: formatValue(lastRace.strength_of_field.toString(), 'rating'), inline: true },
    { 
      name: '📊 iRating', 
      value: formatValue(
        lastRace.newi_rating === -1 
          ? 'Unranked' 
          : `${lastRace.newi_rating} (${iRatingChangeFormatted})`, 
        'rating'
      ), 
      inline: true 
    },
    { name: '\u200B', value: '\u200B', inline: true }
  ];

  const safetyInfo = [
    { name: '🛡️ Safety Rating', value: formatValue(`${newSubLevel} (${subLevelChangeFormatted})`, 'rating'), inline: true },
    { name: '📜 License', value: formatValue(licenseGroupName, 'license'), inline: true },
    { name: '\u200B', value: '\u200B', inline: true }
  ];

  // Dynamic color based on position change
  const positionImprovement = lastRace.start_position - lastRace.finish_position;
  const embedColor = positionImprovement > 0 ? '#00ff00' : positionImprovement < 0 ? '#ff0000' : '#ffaa00';

  return new EmbedBuilder()
    .setTitle(`🏎️ Race Results: ${displayName || 'Unknown Driver'}`)
    .setColor(embedColor)
    .setDescription(`**Race Summary**\nParticipated in a race at ${lastRace.track.track_name}`)
    .addFields([
      ...mainSection,
      ...raceDetails,
      ...positionInfo,
      ...raceStats,
      ...ratings,
      ...safetyInfo,
      { 
        name: '🔗 View on iRacing', 
        value: `[Click to see detailed results](https://members.iracing.com/membersite/member/EventResult.do?&subsessionid=${lastRace.subsession_id}&custid=${driver_id})`,
        inline: false 
      }
    ])
    .setTimestamp(new Date(lastRace.session_start_time))
    .setFooter({ 
      text: `iResults • ${new Date(lastRace.session_start_time).toLocaleDateString()}`, 
      iconURL: client.user.displayAvatarURL() 
    });
}

function buildErrorEmbed(title, description, client) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor('#ff3333')
    .setTimestamp()
    .setFooter({ 
      text: 'iResults • Error', 
      iconURL: client.user.displayAvatarURL() 
    });
}

function buildSuccessEmbed(title, description, client) {
  return new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor('#33cc33')
    .setTimestamp()
    .setFooter({ 
      text: 'iResults • Success', 
      iconURL: client.user.displayAvatarURL() 
    });
}

function buildLoadingEmbed(message, client) {
  return new EmbedBuilder()
    .setTitle('⏳ Loading...')
    .setDescription(message)
    .setColor('#ffcc00')
    .setTimestamp()
    .setFooter({ 
      text: 'iResults • Processing', 
      iconURL: client.user.displayAvatarURL() 
    });
}

function buildHelpEmbed(client) {
  return new EmbedBuilder()
    .setTitle('📚 iResults Command Guide')
    .setColor('#3498db')
    .setDescription('Welcome to iResults! Here are all the available commands:')
    .addFields([
      { 
        name: '🔍 View Last Race', 
        value: '`/lastrace customer_id:<id>`\nGet detailed results from a driver\'s most recent race.', 
        inline: false 
      },
      { 
        name: '⚙️ Set Results Channel', 
        value: '`/setchannel channel:<#channel>`\nConfigure where race results should be posted.\n*Requires Administrator permissions*', 
        inline: false 
      },
      { 
        name: '📊 Track Member', 
        value: '`/trackmember customer_id:<id>`\nStart tracking a driver\'s race results.', 
        inline: false 
      },
      { 
        name: '🚫 Untrack Member', 
        value: '`/untrackmember customer_id:<id>`\nStop tracking a driver\'s results.', 
        inline: false 
      },
      { 
        name: '❓ Help', 
        value: '`/help`\nDisplay this help message.', 
        inline: false 
      },
      {
        name: '🔑 Finding Your Customer ID',
        value: '1. Log into iRacing\n2. Click your helmet icon (top-right)\n3. Look for `Customer ID #123456` at the top',
        inline: false
      }
    ])
    .setTimestamp()
    .setFooter({ 
      text: 'iResults • Help Guide', 
      iconURL: client.user.displayAvatarURL() 
    });
}

module.exports = {
  buildRaceResultsEmbed,
  buildErrorEmbed,
  buildSuccessEmbed,
  buildLoadingEmbed,
  buildHelpEmbed,
  formatValue,
  getOrdinalSuffix
};