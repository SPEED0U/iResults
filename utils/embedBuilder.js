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

// Helper function to create empty field spacer
function spacer() {
  return { name: '** **', value: '** **', inline: false };
}

function buildRaceResultsEmbed(lastRace, displayName, carName, iRatingChangeFormatted, client, driver_id) {
  // Calculate safety rating changes
  const newSubLevel = (lastRace.new_sub_level / 100).toFixed(2);
  const subLevelChange = ((lastRace.new_sub_level - lastRace.old_sub_level) / 100).toFixed(2);
  const subLevelChangeFormatted = subLevelChange >= 0 ? `+${subLevelChange}` : subLevelChange;
  
  // Calculate position change
  const positionChange = lastRace.finish_position - lastRace.start_position;
  const positionChangeText = positionChange > 0 ? `Lost pos. » **\`${positionChange}\`**` : 
                            positionChange < 0 ? `Gained pos. » **\`${Math.abs(positionChange)}\`**` : 
                            `No position change`;

  // Calculate color based on iRating change
  const iRatingChange = lastRace.newi_rating - lastRace.oldi_rating;
  const embedColor = lastRace.newi_rating === -1 ? "#22bb33" : // Green for unranked
                    iRatingChange >= 0 ? "#22bb33" : // Green for positive/no change
                    "#bb2222"; // Red for negative change

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `• ${displayName}'s race results`,
      iconURL: "https://cdn.discordapp.com/attachments/954001140519944193/1327010280336523406/helmet.png?ex=67818221&is=678030a1&hm=f90ea5b9acc18736062aaaebae61a6041de3c09af7bcedcc918c3036e9b60dce&",
    })
    .setDescription("** **")
    .addFields([
      {
        name: "📋 • __Details__",
        value: `Series » **\`${lastRace.series_name}\`**\nTrack » **\`${lastRace.track.track_name}\`**\nCar » **\`${carName}\`**\n** **`,
        inline: false
      },
      spacer(),
      {
        name: "📊 • __Position__",
        value: `Start » **\`${getOrdinalSuffix(lastRace.start_position)}\`**\nFinish » **\`${getOrdinalSuffix(lastRace.finish_position)}\`**\n${positionChangeText}\n** **`,
        inline: false
      },
      spacer(),
      {
        name: "📈 • __Statistics__",
        value: `Laps » **\`${lastRace.laps}\`**\nIncidents » **\`${lastRace.incidents}\`**\nSOF » **\`${lastRace.strength_of_field}\`**\n** **`,
        inline: false
      },
      spacer(),
      {
        name: "🏆 • __Ratings__",
        value: `iRating » **\`${lastRace.newi_rating === -1 ? 'Unranked' : `${lastRace.newi_rating} (${iRatingChangeFormatted})`}\`**\nSafety » **\`${newSubLevel} (${subLevelChangeFormatted})\`**\nLicense » **\`${getGroupNameByLicenseId(lastRace.license_level)}\`**\n** **`,
        inline: false
      },
      spacer(),
      {
        name: "🔗 • __Link__",
        value: `[View on iRacing.com](https://members.iracing.com/membersite/member/EventResult.do?&subsessionid=${lastRace.subsession_id}&custid=${driver_id})\n** **`,
        inline: false
      }
    ])
    .setImage("https://media.discordapp.net/attachments/954001140519944193/1327009050394755173/banner.png?ex=678180fc&is=67802f7c&hm=02ccf801b2f2732302919404dba5955707194686f807b82c1a8f7a4e18befe1d&=&format=webp&quality=lossless")
    .setColor(embedColor)
    .setFooter({
      text: "iResults • Race completed",
    })
    .setTimestamp(new Date(lastRace.session_start_time));

  return embed;
}

// Rest of the code remains the same...
function buildErrorEmbed(title, description, client) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor("#ff3333")
    .setFooter({
      text: "iResults • Error",
    })
    .setTimestamp();
}

function buildSuccessEmbed(title, description, client) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor("#00b0f4")
    .setFooter({
      text: "iResults • Success",
    })
    .setTimestamp();
}

function buildLoadingEmbed(message, client) {
  return new EmbedBuilder()
    .setTitle("Processing request...")
    .setDescription(message)
    .setColor("#00b0f4")
    .setFooter({
      text: "iResults • Loading",
    })
    .setTimestamp();
}

function buildHelpEmbed(client) {
  return new EmbedBuilder()
    .setTitle("iResults Command Guide")
    .addFields([
      {
        name: "📋• __Available Commands__",
        value: "**/lastrace** `customer_id:<id>`\nView race results for a specific driver\n** **",
        inline: false
      },
      spacer(),
      {
        name: "📊• __Track Commands__",
        value: "**/trackmember** `customer_id:<id>`\nStart tracking a driver's race results\n\n**/untrackmember** `customer_id:<id>`\nStop tracking a driver's results\n** **",
        inline: false
      },
      spacer(),
      {
        name: "⚙️• __Settings__",
        value: "**/setchannel** `channel:<#channel>`\nSet channel for race updates (Admin only)\n** **",
        inline: false
      },
      spacer(),
      {
        name: "❓• __Finding Your Customer ID__",
        value: "1. Log into iRacing\n2. Click your helmet icon (top-right)\n3. Find your Customer ID (#123456)\n** **",
        inline: false
      }
    ])
    .setColor("#00b0f4")
    .setFooter({
      text: "iResults • Help",
    })
    .setTimestamp();
}

module.exports = {
  buildRaceResultsEmbed,
  buildErrorEmbed,
  buildSuccessEmbed,
  buildLoadingEmbed,
  buildHelpEmbed
};