const { Client, GatewayIntentBits } = require('discord.js');

class DiscordService {
    constructor() {
        if (!DiscordService.instance) {
            this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
            DiscordService.instance = this;
        }

        return DiscordService.instance;
    }

    getClient() {
        return this.client;
    }

    setClient(client) {
        this.client = client;
    }
}

const discordService = new DiscordService();
module.exports = discordService;