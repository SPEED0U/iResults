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
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
      charset: 'utf8mb4'
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
    return result.insertId;
  }

  async removeTrackedDriver(guildId, driverId) {
    const sql = 'DELETE FROM tracked_data WHERE guild_id = ? AND driver_id = ?';
    return this.query(sql, [guildId, driverId]);
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
    return this.query(sql, [guildId]);
  }

  async close() {
    return this.pool.end();
  }
}

// Create and export a singleton instance
const db = new DatabaseService();
module.exports = db;