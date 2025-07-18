// utils/performance.js
// Centralistion des paramètres de performance pour optimiser la consommation CPU

module.exports = {
  // Intervalles en millisecondes
  INTERVALS: {
    // Fréquence de vérification des résultats de course (5 minutes)
    RACE_RESULTS_CHECK: 5 * 60 * 1000,
    
    // Fréquence des logs de stats des shards (30 minutes)
    SHARD_STATS_LOG: 30 * 60 * 1000,
    
    // Fréquence des logs de stats globales (6 heures)
    GLOBAL_STATS_LOG: 6 * 60 * 60 * 1000,
    
    // Fréquence du nettoyage des channels invalides (6 heures)
    CLEANUP_INVALID_CHANNELS: 6 * 60 * 60 * 1000,
    
    // Fréquence de mise à jour du statut Discord (10 minutes)
    STATUS_UPDATE: 10 * 60 * 1000,
    
    // Expiration du cache des données de voiture (24 heures)
    CAR_DATA_CACHE_EXPIRATION: 24 * 60 * 60 * 1000,
    
    // Expiration de la session iRacing (15 minutes)
    IRACING_SESSION_EXPIRATION: 15 * 60 * 1000
  },

  // Limites de concurrence
  CONCURRENCY: {
    // Nombre maximum de pilotes traités simultanément
    MAX_CONCURRENT_DRIVERS: 5000,
    
    // Taille des batches pour le traitement des pilotes
    DRIVER_BATCH_SIZE: 50,
    
    // Délai entre les éléments d'un batch (ms)
    BATCH_ITEM_DELAY: 100,
    
    // Délai entre les batches (ms)
    BATCH_DELAY: 1000
  },

  // Configuration de la base de données
  DATABASE: {
    // Limite de connexions simultanées
    CONNECTION_LIMIT: 5,
    
    // Timeout pour les connexions inactives (5 minutes)
    // Note: acquireTimeout et timeout ne sont pas supportés par MySQL2 pools
    IDLE_TIMEOUT: 300000,
    
    // Nombre maximum de connexions inactives
    MAX_IDLE: 3
  },

  // Messages de log optimisés
  LOG_MESSAGES: {
    RACE_RESULTS_SKIPPED: '[OPT] Skipping driver processing - max concurrent limit reached',
    CAR_DATA_CACHED: '[OPT] Car data cached for 24 hours',
    SESSION_EXPIRED: '[OPT] Session expired or missing. Reauthenticating',
    BATCH_PROCESSING: '[OPT] Processing driver batch',
    PERFORMANCE_OPTIMIZED: '[OPT] Performance optimizations active',
    CLEANUP_STARTED: '[CLN] Starting cleanup of invalid channels',
    CLEANUP_COMPLETED: '[CLN] Cleanup completed',
    INVALID_GUILD: '[CLN] Guild not found, removing from database',
    INVALID_CHANNEL: '[CLN] Channel not found in guild, removing settings',
    MISSING_PERMISSIONS: '[CLN] Missing permissions in channel, removing settings',
    STATUS_UPDATED: '[BOT] Discord status updated'
  }
};
