const { Client, GatewayIntentBits } = require('discord.js');
const { initializeDatabase } = require('./services/database');
const { authenticateIRacing, fetchLicenseData } = require('./services/iracing');
const { registerCommands } = require('./utils/commandsConfig');
const { publishRaceResults } = require('./utils/helpers');
const discordService = require('./services/discord');
const config = require('./data/config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
discordService.setClient(client);

// Initialize services
initializeDatabase();

// Command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const command = require(`./commands/${interaction.commandName}.js`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    await interaction.reply({ 
      content: 'There was an error executing this command.',
      ephemeral: true 
    });
  }
});

// Bot initialization
client.once('ready', async () => {
  await registerCommands(client);
  console.log(`[API] Logged in as ${client.user.tag}.`);
  await fetchLicenseData();
});

// Start polling for race results
setInterval(publishRaceResults, 5 * 60 * 1000);

client.login(config.token);