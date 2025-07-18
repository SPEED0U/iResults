const discordService = require('./discord');

async function startBot() {
    try {
        // Initialize sharding
        await discordService.initialize('auto');

        // Optimisation : Réduire la fréquence des logs de stats de 1 heure à 6 heures
        // pour réduire la consommation CPU
        setInterval(async () => {
            const totalGuilds = await discordService.getTotalGuilds();
            const totalUsers = await discordService.getTotalUsers();
            console.log(`[Stats] Total guilds: ${totalGuilds}, Total users: ${totalUsers}`);
        }, 6 * 60 * 60 * 1000); // 6 heures au lieu de 1 heure

    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();