const { Client, GatewayIntentBits, ShardingManager } = require('discord.js');
const path = require('path');
const config = require('../data/config.json');

class DiscordService {
    constructor() {
        if (!DiscordService.instance) {
            this.client = null;
            this.manager = null;
            this.isSharded = false;
            DiscordService.instance = this;
        }
        return DiscordService.instance;
    }

    // Helper function to convert zero-based to one-based shard ID
    async initialize(shardCount = 'auto') {
        try {
            if (this.isSharded) {
                console.log('[SHD] Bot is already sharded.');
                return;
            }

            this.manager = new ShardingManager(path.join(__dirname, '../index.js'), {
                token: config.token,
                totalShards: shardCount,
                respawn: true
            });

            this.manager.on('shardCreate', shard => {
                console.log(`[SHD] Launched shard ${shard.id}.`);
                
                shard.on('ready', () => {
                    console.log(`[SHD] Shard ${shard.id} ready..`);
                });

                shard.on('disconnect', () => {
                    console.log(`[SHD] Shard ${shard.id} disconnected.`);
                });

                shard.on('reconnecting', () => {
                    console.log(`[SHD] Shard ${shard.id} reconnecting.`);
                });

                shard.on('death', () => {
                    console.error(`[SHD] Shard ${shard.id} died.`);
                });

                shard.on('error', error => {
                    console.error(`[SHD] Shard ${shard.id} error:`, error);
                });
            });

            this.isSharded = true;
            await this.manager.spawn();
            console.log('[SHD] All shards spawned.');
        } catch (error) {
            console.error('[SHD] Error initializing shards:', error);
            throw error;
        }
    }

    getClient() {
        return this.client;
    }

    setClient(client) {
        this.client = client;
    }

    async broadcastEval(fn) {
        if (!this.manager) return null;
        try {
            return await this.manager.broadcastEval(fn);
        } catch (error) {
            console.error('[SHD] Broadcast eval error:', error);
            return null;
        }
    }

    async getTotalGuilds() {
        if (!this.manager) return 0;
        try {
            const guildCounts = await this.manager.broadcastEval(c => c.guilds.cache.size);
            return guildCounts.reduce((acc, count) => acc + count, 0);
        } catch (error) {
            console.error('[SHD] Error getting total guilds:', error);
            return 0;
        }
    }

    async getTotalUsers() {
        if (!this.manager) return 0;
        try {
            const userCounts = await this.manager.broadcastEval(c => c.users.cache.size);
            return userCounts.reduce((acc, count) => acc + count, 0);
        } catch (error) {
            console.error('[SHD] Error getting total users:', error);
            return 0;
        }
    }

    // Helper to get total number of shards
    getTotalShards() {
        return this.manager ? this.manager.totalShards : 1;
    }
}

const discordService = new DiscordService();
module.exports = discordService;