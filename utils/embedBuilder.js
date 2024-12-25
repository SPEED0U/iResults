const { EmbedBuilder } = require('discord.js');
const { getGroupNameByLicenseId } = require('../services/iracing');

/**
 * Converts a number to its ordinal form (1st, 2nd, 3rd, etc.)
 * @param {number} position - The position number to convert
 * @returns {string} The position with its ordinal suffix
 */
function getOrdinalSuffix(position) {
  const j = position % 10;
  const k = position % 100;
  if (j === 1 && k !== 11) return `${position}st`;
  if (j === 2 && k !== 12) return `${position}nd`;
  if (j === 3 && k !== 13) return `${position}rd`;
  return `${position}th`;
}

/**
 * Formats a value for embed display by wrapping it in double backticks
 * @param {string} value - The value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
  return `\`\`${value}\`\``;
}

/**
 * Builds an embed for race results
 * @param {Object} lastRace - The race data object
 * @param {string} displayName - Driver's display name
 * @param {string} carName - Name of the car used
 * @param {string} iRatingChangeFormatted - Formatted iRating change
 * @param {Object} client - Discord client object
 * @param {string} driver_id - Driver's iRacing ID
 * @returns {EmbedBuilder} Formatted embed for race results
 */
function buildRaceResultsEmbed(lastRace, displayName, carName, iRatingChangeFormatted, client, driver_id) {
  const newSubLevel = (lastRace.new_sub_level / 100).toFixed(2);
  const subLevelChange = ((lastRace.new_sub_level - lastRace.old_sub_level) / 100).toFixed(2);
  const subLevelChangeFormatted = subLevelChange > 0 ? `+${subLevelChange}` : `${subLevelChange}`;
  const licenseGroupName = getGroupNameByLicenseId(lastRace.license_level);

  return new EmbedBuilder()
    .setTitle(`${displayName || 'Unknown Driver'} just finished a race`)
    .setColor('#c93838')
    .addFields(
      { name: 'Series', value: formatValue(lastRace.series_name), inline: false },
      { name: '\t', value: '\t' }, // Spacer
      { name: 'Track', value: formatValue(lastRace.track.track_name), inline: true },
      { name: 'Car', value: formatValue(carName), inline: true },
      { name: '\t', value: '\t' }, // Spacer
      { name: 'Start pos.', value: formatValue(getOrdinalSuffix(lastRace.start_position)), inline: true },
      { name: 'Finish pos.', value: formatValue(getOrdinalSuffix(lastRace.finish_position)), inline: true },
      { name: '\t', value: '\t' }, // Spacer
      { name: 'Laps completed', value: formatValue(lastRace.laps.toString()), inline: true },
      { name: 'Incidents', value: formatValue(lastRace.incidents.toString()), inline: true },
      { name: '\t', value: '\t' }, // Spacer
      { name: 'Strength of field', value: formatValue(lastRace.strength_of_field.toString()), inline: true },
      {
        name: 'iRating',
        value: formatValue(lastRace.newi_rating === -1 
          ? 'Unranked' 
          : `${lastRace.newi_rating.toString()} (${iRatingChangeFormatted})`),
        inline: true
      },
      { name: '\t', value: '\t' }, // Spacer
      { name: 'Safety rating', value: formatValue(`${newSubLevel} (${subLevelChangeFormatted})`), inline: true },
      { name: 'License', value: formatValue(licenseGroupName), inline: true },
      { name: '\t', value: '\t' }, // Spacer
      { name: '\t', value: '\t' }, // Spacer
      { 
        name: '\t', 
        value: `[View on iRacing.com](https://members.iracing.com/membersite/member/EventResult.do?&subsessionid=${lastRace.subsession_id}&custid=${driver_id})`, 
        inline: true 
      }
    )
    .setTimestamp(new Date(lastRace.session_start_time))
    .setFooter({ text: 'iResults', iconURL: client.user.displayAvatarURL() });
}

/**
 * Builds an error embed
 * @param {string} title - Error title
 * @param {string} description - Error description
 * @param {Object} client - Discord client object
 * @returns {EmbedBuilder} Formatted error embed
 */
function buildErrorEmbed(title, description, client) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('#ff0000')
    .setTimestamp()
    .setFooter({ text: 'iResults', iconURL: client.user.displayAvatarURL() });
}

/**
 * Builds a success embed
 * @param {string} title - Success title
 * @param {string} description - Success description
 * @param {Object} client - Discord client object
 * @returns {EmbedBuilder} Formatted success embed
 */
function buildSuccessEmbed(title, description, client) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('#00ff00')
    .setTimestamp()
    .setFooter({ text: 'iResults', iconURL: client.user.displayAvatarURL() });
}

/**
 * Builds a loading embed
 * @param {string} message - Loading message
 * @param {Object} client - Discord client object
 * @returns {EmbedBuilder} Formatted loading embed
 */
function buildLoadingEmbed(message, client) {
  return new EmbedBuilder()
    .setTitle('Loading...')
    .setDescription(message)
    .setColor('#ffff00')
    .setTimestamp()
    .setFooter({ text: 'iResults', iconURL: client.user.displayAvatarURL() });
}

/**
 * Builds a help embed
 * @param {Object} client - Discord client object
 * @returns {EmbedBuilder} Formatted help embed
 */
function buildHelpEmbed(client) {
  return new EmbedBuilder()
    .setTitle('Command help')
    .setColor('#3498db')
    .setDescription('Here is a list of available commands and how to use them.')
    .addFields(
      { 
        name: '/lastrace', 
        value: '`/lastrace customer_id:<id>`\nFetches the last race results for a specific iRacing member.', 
        inline: false 
      },
      { 
        name: '/setchannel', 
        value: '`/setchannel channel:<#channel>`\nSets the specified channel for automatic race result publication.', 
        inline: false 
      },
      { 
        name: '/trackmember', 
        value: '`/trackmember customer_id:<id>`\nTracks race results for a specified iRacing member ID.', 
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
        name: 'How to find your Customer ID on iRacing',
        value: '1. Log in to your iRacing account.\n2. Click on the helmet at top-right.\n3. The Customer ID is displayed at the top of the window like `My Account: Customer ID #123456`.',
        inline: false,
      }
    )
    .setTimestamp()
    .setFooter({ text: 'iResults', iconURL: client.user.displayAvatarURL() });
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