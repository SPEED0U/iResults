const discordService = require('./discord');

async function startBot() {
    try {
        // Initialize sharding
        await discordService.initialize('auto');

        // Optional: Log total stats every hour
        setInterval(async () => {
            const totalGuilds = await discordService.getTotalGuilds();
            const totalUsers = await discordService.getTotalUsers();
            console.log(`[Stats] Total guilds: ${totalGuilds}, Total users: ${totalUsers}`);
        }, 60 * 60 * 1000);

    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();