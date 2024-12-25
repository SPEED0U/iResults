const { fetchLastRaceResults, fetchCarInfo, fetchMemberInfo } = require('../services/iracing');
const { buildRaceResultsEmbed } = require('../utils/embedBuilder');

module.exports = {
  name: 'lastrace',
  description: 'Get the last race results of a driver.',
  options: [
    {
      name: 'customer_id',
      description: 'The iRacing customer ID of the player.',
      type: 3,
      required: true,
    },
  ],
  async execute(interaction) {
    const customer_id = interaction.options.getString('customer_id');
    
    if (!customer_id) {
      await interaction.reply('Please provide a member ID.');
      return;
    }
    
    await interaction.deferReply();
    
    try {
      const displayName = await fetchMemberInfo(customer_id);
      const results = await fetchLastRaceResults(customer_id);
      const carData = await fetchCarInfo();
    
      if (results?.races?.length > 0) {
        const lastRace = results.races[0];
        const carInfo = carData.find(car => car.car_id === lastRace.car_id);
        const carName = carInfo?.car_name || 'Unknown Car';
        const iRatingChange = lastRace.newi_rating - lastRace.oldi_rating;
        const iRatingChangeFormatted = iRatingChange > 0 ? `+${iRatingChange}` : `${iRatingChange}`;
    
        const embed = buildRaceResultsEmbed(lastRace, displayName, carName, iRatingChangeFormatted, interaction.client, customer_id);
    
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('No recent race results found for this member ID.');
      }
    } catch (error) {
      console.error('Error executing lastrace command:', error);
      await interaction.editReply('An error occurred while fetching race results.');
    }
  },
};