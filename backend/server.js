// ============================================================
// AniGO Backend Server
// Location-based AR Anime Game
// ============================================================

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const { initDB, isDBConnected } = require('./db');
const routes = require('./routes/index');
const { errorHandler, notFoundHandler, jsonErrorHandler } = require('./middleware/errorHandler');
const { startSpawner } = require('./spawner');

const app = express();

// ─── Static Files ─────────────────────────────────────────────
// Serve admin dashboard
app.get('/admin', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// ─── Middleware ─────────────────────────────────────────────
app.use(cors(config.CORS_OPTIONS));
app.use(express.json());

// JSON parsing error handler (must come after express.json())
app.use(jsonErrorHandler);

// Request logging (dev)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    
    // Log request body if POST/PUT
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('  Body:', JSON.stringify(req.body).substring(0, 100));
    }
    
    // Log response
    const originalJson = res.json;
    res.json = function(data) {
        console.log('  Response:', data.success !== undefined ? (data.success ? '✓' : '✗') : '?');
        return originalJson.call(this, data);
    };
    
    next();
});

// ─── Health Check ───────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        status: 'AniGO Backend is running 🎮',
        version: '2.0.0',
        database: isDBConnected() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /',
            auth: {
                signup: 'POST /api/auth/signup',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me/:user_id',
            },
            spawns: {
                list: 'GET /api/spawns',
                get: 'GET /api/spawns/:id',
                nearMe: 'POST /api/spawns/near',
            },
            game: {
                catch: 'POST /api/game/catch',
                inventory: 'GET /api/game/inventory/:user_id',
                stats: 'GET /api/game/stats/:user_id',
                leaderboard: 'GET /api/game/leaderboard',
            },
        },
    });
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handling ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Uncaught Exception]', error);
});

// ─── Start Server ───────────────────────────────────────────
async function startServer() {
    try {
        // Initialize database
        console.log('\n🔌 Connecting to database...');
        await initDB();

        // Start spawner
        startSpawner();

        // Start server on all interfaces (0.0.0.0) for Expo Go access
        const serverInstance = app.listen(config.PORT, config.HOST, () => {
            console.log('\n' + '═'.repeat(50));
            console.log('🚀 AniGO Server Started!');
            console.log('═'.repeat(50));
            console.log(`📍 Local:    http://localhost:${config.PORT}`);
            console.log(`📱 Network:  http://${config.LOCAL_IP}:${config.PORT}`);
            console.log('═'.repeat(50));
            console.log('\n📱 For Expo Go, use this in your frontend:');
            console.log(`   API_BASE_URL = 'http://${config.LOCAL_IP}:${config.PORT}/api'`);
            console.log('\n');
        });

        serverInstance.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${config.PORT} is already in use.`);
                console.error(`   Run: lsof -ti :${config.PORT} | xargs kill -9\n`);
                process.exit(1);
            } else {
                throw err;
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('\n💡 Starting in DB-less mode (spawns only)...\n');
        
        // Start without DB for testing spawns
        startSpawner();
        
        const serverInstance = app.listen(config.PORT, config.HOST, () => {
            console.log('\n' + '═'.repeat(50));
            console.log('🚀 AniGO Server Started (No DB)');
            console.log('═'.repeat(50));
            console.log(`📍 Local:    http://localhost:${config.PORT}`);
            console.log(`📱 Network:  http://${config.LOCAL_IP}:${config.PORT}`);
            console.log('═'.repeat(50));
            console.log('\n⚠️  Auth and inventory routes will not work without DB');
            console.log('\n');
        });

        serverInstance.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Port ${config.PORT} is already in use.`);
                console.error(`   Run: lsof -ti :${config.PORT} | xargs kill -9\n`);
                process.exit(1);
            } else {
                throw err;
            }
        });
    }
}

startServer();
