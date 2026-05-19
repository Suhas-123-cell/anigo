// ============================================================
// Admin Routes - Dashboard, spawn management, player stats
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { query: dbQuery, insert, update } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const { getActiveSpawns, SPAWN_POLYGONS } = require('../spawner');

// Get Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const router = express.Router();

// Simple token storage (in production, use JWT)
let adminTokens = new Set();

// ─── POST /admin/login ──────────────────────────────────────
// Admin login endpoint - uses Supabase
router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password required',
        });
    }

    try {
        // Query admin user from Supabase
        const { data: adminUsers, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !adminUsers) {
            console.error('[Admin] Login failed - user not found:', username);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }

        if (!adminUsers.is_active) {
            console.error('[Admin] Login failed - admin account disabled:', username);
            return res.status(401).json({
                success: false,
                error: 'Admin account is disabled',
            });
        }

        // Verify password using bcrypt
        const isValidPassword = await bcrypt.compare(password, adminUsers.password_hash);
        if (!isValidPassword) {
            console.error('[Admin] Login failed - invalid password:', username);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }

        // Generate token
        const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Save session to database
        const { error: sessionError } = await supabase
            .from('admin_sessions')
            .insert({
                admin_id: adminUsers.id,
                token,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                expires_at: expiresAt,
            });

        if (sessionError) {
            console.error('[Admin] Session creation error:', sessionError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create session',
            });
        }

        // Update last login
        await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', adminUsers.id);

        // Log admin login
        await supabase
            .from('admin_logs')
            .insert({
                admin_id: adminUsers.id,
                action: 'LOGIN',
                ip_address: req.ip,
            });

        console.log(`✅ Admin login successful: ${username}`);

        return res.json({
            success: true,
            token,
            admin: {
                id: adminUsers.id,
                username: adminUsers.username,
                full_name: adminUsers.full_name,
                email: adminUsers.email,
            },
            message: 'Login successful',
        });
    } catch (error) {
        console.error('[Admin] Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}));

// Middleware to verify admin token
async function verifyAdminToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Missing admin token',
        });
    }

    try {
        // Check if token exists and is not expired in Supabase
        const { data: session, error } = await supabase
            .from('admin_sessions')
            .select('*, admin_users(*)')
            .eq('token', token)
            .single();

        if (error || !session) {
            console.error('[Admin] Token verification failed - token not found');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid token',
            });
        }

        // Check if session expired
        if (new Date(session.expires_at) < new Date()) {
            console.error('[Admin] Token verification failed - token expired');
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Token expired',
            });
        }

        req.admin = session.admin_users;
        req.adminToken = token;
        next();
    } catch (error) {
        console.error('[Admin] Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

// ─── GET /admin/spawn-points ───────────────────────────────
// Get all current spawn points and spawn zones
router.get('/spawn-points', verifyAdminToken, asyncHandler(async (req, res) => {
    const spawns = getActiveSpawns();

    res.json({
        success: true,
        data: {
            active_spawns: spawns.map((spawn) => ({
                id: spawn.id,
                character: spawn.character,
                rarity: spawn.rarity,
                anime: spawn.anime,
                location: spawn.locationName,
                coordinates: {
                    lat: spawn.lat,
                    lng: spawn.lng,
                },
                spawned_at: spawn.spawnedAt,
            })),
            spawn_zones: SPAWN_POLYGONS.map((polygon) => ({
                name: polygon.name,
                coordinates: polygon.points,
                center: {
                    lat: polygon.points.reduce((sum, p) => sum + p.lat, 0) / polygon.points.length,
                    lng: polygon.points.reduce((sum, p) => sum + p.lng, 0) / polygon.points.length,
                },
            })),
            total_active: spawns.length,
            spawn_count_per_zone: Math.ceil(spawns.length / SPAWN_POLYGONS.length),
        },
    });
}));

// ─── GET /admin/players ────────────────────────────────────
// Get player statistics
router.get('/players', verifyAdminToken, asyncHandler(async (req, res) => {
    try {
        const users = await dbQuery('users', {
            select: 'id, username, email, level, total_xp, created_at',
            orderBy: { column: 'total_xp', ascending: false },
        });

        // Get inventory count per user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const inventory = await dbQuery('inventory', {
                    filters: { user_id: user.id },
                    select: 'id, rarity',
                });

                const rarityCount = {
                    common: 0,
                    rare: 0,
                    legendary: 0,
                    black: 0,
                };

                inventory.forEach((item) => {
                    rarityCount[item.rarity || 'common']++;
                });

                return {
                    ...user,
                    characters_caught: inventory.length,
                    rarity_breakdown: rarityCount,
                    rank: 0, // Will be set below
                };
            })
        );

        // Add rank
        usersWithStats.forEach((user, index) => {
            user.rank = index + 1;
        });

        const stats = {
            total_players: usersWithStats.length,
            total_characters_caught: usersWithStats.reduce((sum, u) => sum + u.characters_caught, 0),
            average_level: (
                usersWithStats.reduce((sum, u) => sum + u.level, 0) / usersWithStats.length || 0
            ).toFixed(2),
            top_players: usersWithStats.slice(0, 10),
        };

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}));

// ─── GET /admin/player/:id ────────────────────────────────
// Get detailed player info
router.get('/player/:id', verifyAdminToken, asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const users = await dbQuery('users', {
            filters: { id: parseInt(id) },
            select: 'id, username, email, level, total_xp, created_at',
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Player not found',
            });
        }

        const user = users[0];

        // Get inventory
        const inventory = await dbQuery('inventory', {
            filters: { user_id: parseInt(id) },
            select: 'character_name, rarity, caught_at',
            orderBy: { column: 'caught_at', ascending: false },
        });

        res.json({
            success: true,
            data: {
                player: user,
                inventory_count: inventory.length,
                characters: inventory,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}));

// ─── GET /admin/dashboard ──────────────────────────────────
// Get overall dashboard stats
router.get('/dashboard', verifyAdminToken, asyncHandler(async (req, res) => {
    try {
        // Total users
        const users = await dbQuery('users');
        const userCount = users.length;

        // Total catches
        const inventory = await dbQuery('inventory');
        const totalCatches = inventory.length;

        // Active spawns
        const activeSpawns = getActiveSpawns();

        // Top players
        const topPlayers = users
            .sort((a, b) => b.total_xp - a.total_xp)
            .slice(0, 5);

        // Character popularity
        const characterCounts = {};
        inventory.forEach((item) => {
            characterCounts[item.character_name] = (characterCounts[item.character_name] || 0) + 1;
        });

        const popularCharacters = Object.entries(characterCounts)
            .map(([character, count]) => ({ character, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                total_players: userCount,
                total_characters_caught: totalCatches,
                active_spawns: activeSpawns.length,
                top_players: topPlayers,
                popular_characters: popularCharacters,
                spawn_zones: SPAWN_POLYGONS.length,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}));

// ─── POST /admin/logout ────────────────────────────────────
// Admin logout
router.post('/logout', verifyAdminToken, asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    try {
        // Delete session from database
        await supabase
            .from('admin_sessions')
            .delete()
            .eq('token', token);

        // Log admin logout
        await supabase
            .from('admin_logs')
            .insert({
                admin_id: req.admin.id,
                action: 'LOGOUT',
                ip_address: req.ip,
            });

        console.log(`✅ Admin logout successful: ${req.admin.username}`);

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('[Admin] Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to logout',
        });
    }
}));

module.exports = router;
