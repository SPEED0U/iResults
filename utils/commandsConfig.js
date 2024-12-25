const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');
const config = require('../data/config.json');

const rest = new REST({ version: '10' }).setToken(config.token);

async function registerCommands(client) {
  try {
    const commands = [];
    const commandFiles = readdirSync(path.join(__dirname, '../commands'))
      .filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`../commands/${file}`);
      commands.push({
        name: command.name,
        description: command.description,
        options: command.options || [],
      });
    }

    console.log('[API] Refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('[API] Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('[API] Error reloading application (/) commands:', error);
  }
}

module.exports = { registerCommands };