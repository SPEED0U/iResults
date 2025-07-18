// services/database.js
require('dotenv').config();
const mysql = require('mysql2/promise');

class DatabaseService {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 5, // Réduire le nombre de connexions simultanées
      queueLimit: 0,
      timezone: '+00:00',
      charset: 'utf8mb4',
      // Optimisations pour réduire la consommation CPU (options valides pour MySQL2)
      // acquireTimeout et timeout ne sont pas valides pour les pools MySQL2
      idleTimeout: 300000, // 5 minutes - temps avant fermeture des connexions inactives
      maxIdle: 3 // Nombre maximum de connexions inactives
    });

    this.initialize();
  }

  async initialize() {
    try {
      await this.testConnection();
    } catch (error) {
      console.error('[SQL] Initialization failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log('[SQL] Database connection established');
      connection.release();
    } catch (error) {
      console.error('[SQL] Database connection failed:', error);
      throw error;
    }
  }

  async query(sql, params) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('[SQL] Query error:', error);
      throw error;
    }
  }

  async getTrackedDrivers() {
    return this.query('SELECT * FROM tracked_data');
  }

  async addTrackedDriver(guildId, channelId, driverId) {
    await this.setGuildChannel(guildId, channelId);

    const sql = `
      INSERT INTO tracked_data (guild_id, channel_id, driver_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        channel_id = VALUES(channel_id)
    `;
    const result = await this.query(sql, [guildId, channelId, driverId]);
    
    // Déclencher la mise à jour du statut Discord
    this.triggerStatusUpdate();
    
    return result.insertId;
  }

  async removeTrackedDriver(guildId, driverId) {
    const sql = 'DELETE FROM tracked_data WHERE guild_id = ? AND driver_id = ?';
    const result = await this.query(sql, [guildId, driverId]);
    
    // Déclencher la mise à jour du statut Discord
    this.triggerStatusUpdate();
    
    return result;
  }

  async updateLastRaceId(driverId, lastRaceId) {
    const sql = 'UPDATE tracked_data SET last_race_id = ? WHERE driver_id = ?';
    return this.query(sql, [lastRaceId, driverId]);
  }

  async getGuildSettings(guildId) {
    const sql = 'SELECT * FROM guild_settings WHERE `guild_id` = ?';
    const results = await this.query(sql, [guildId]);
    return results[0];
  }

  async getAllGuildSettings() {
    const sql = 'SELECT * FROM guild_settings';
    return this.query(sql);
  }

  async setGuildChannel(guildId, channelId) {
    const sql = `
      INSERT INTO guild_settings (guild_id, channel_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        channel_id = VALUES(channel_id)
    `;
    return this.query(sql, [guildId, channelId]);
  }

  async removeGuild(guildId) {
    const sql = 'DELETE FROM guild_settings WHERE `guild_id` = ?';
    const result = await this.query(sql, [guildId]);
    
    // Déclencher la mise à jour du statut Discord
    this.triggerStatusUpdate();
    
    return result;
  }

  // Fonction pour déclencher la mise à jour du statut Discord
  triggerStatusUpdate() {
    // Utiliser un timeout pour éviter les appels trop fréquents
    if (this.statusUpdateTimeout) {
      clearTimeout(this.statusUpdateTimeout);
    }
    
    this.statusUpdateTimeout = setTimeout(async () => {
      try {
        const { updateDiscordStatus } = require('../utils/helpers');
        await updateDiscordStatus();
      } catch (error) {
        console.error('[STATUS] Error triggering status update:', error);
      }
    }, 2000); // Délai de 2 secondes pour éviter les appels multiples
  }

  async close() {
    return this.pool.end();
  }
}

// Create and export a singleton instance
const db = new DatabaseService();
module.exports = db;