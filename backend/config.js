// ============================================================
// AniGO Backend Configuration
// ============================================================

const os = require('os');

/**
 * Get the local network IP for Expo Go connection
 */
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal/non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const config = {
    // Server
    PORT: process.env.PORT || 3001,
    HOST: '0.0.0.0', // Listen on all interfaces for Expo Go
    LOCAL_IP: getLocalIP(),

    // Database (MySQL - for current testing)
    DB: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'anigo_db',
        port: Number(process.env.DB_PORT || 3306),
    },

    // Game Settings
    GAME: {
        XP_PER_CATCH: 50,
        XP_THRESHOLD: (level) => level * 150,
        SPAWN_INTERVAL_MS: 60 * 1000,
        SPAWN_COUNT: 10,
    },

    // CORS - Allow Expo Go connections
    CORS_OPTIONS: {
        origin: '*', // Allow all origins for development
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    },
};

module.exports = config;
