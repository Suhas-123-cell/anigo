// ============================================================
// Routes Index - Combine all route modules
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../db');
const { getActiveSpawns, getSpawnById, getCharacterRarity, removeSpawn } = require('../spawner');
const config = require('../config');

const authRoutes = require('./auth');
const spawnRoutes = require('./spawns');
const gameRoutes = require('./game');
const badgesRoutes = require('./badges');

const router = express.Router();

// Mount route modules (new API)
router.use('/auth', authRoutes);
router.use('/spawns', spawnRoutes);
router.use('/game', gameRoutes);
router.use('/badges', badgesRoutes);

// ============================================================
// LEGACY ROUTES (for existing frontend compatibility)
// ============================================================

// ─── POST /signup ───────────────────────────────────────────
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
        const users = await query('SELECT id, username, level, total_xp FROM users WHERE username = ?', [username]);
        res.status(201).json({ success: true, user: users[0] });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists.' });
        }
        console.error('[Signup Error]', error);
        res.status(500).json({ error: 'Failed to create account.' });
    }
});

// ─── POST /login ────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const users = await query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const { password_hash, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// ─── GET /spawns ────────────────────────────────────────────
router.get('/spawns', (req, res) => {
    res.json({ spawns: getActiveSpawns() });
});

// ─── POST /catch ────────────────────────────────────────────
router.post('/catch', async (req, res) => {
    const { user_id, spawn_id, character_name, rarity, lat, lng } = req.body;
    const { XP_PER_CATCH, XP_THRESHOLD } = config.GAME;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required.' });
    }

    const spawn = spawn_id ? getSpawnById(spawn_id) : null;
    const characterToCatch = spawn ? spawn.character : character_name;
    const rarityValue = getCharacterRarity(characterToCatch) || rarity || (spawn ? spawn.rarity : 'common');

    if (!characterToCatch) {
        return res.status(400).json({ error: 'character_name or valid spawn_id required.' });
    }

    // Calculate XP based on rarity (adjusted for max level 25)
    const XP_BY_RARITY = {
        'common': 2,
        'rare': 5,
        'legendary': 15,
    };
    const xpGained = XP_BY_RARITY[rarityValue] || 2;

    try {
        const result = await transaction(async (conn) => {
            await conn.execute('INSERT INTO inventory (user_id, character_name, rarity) VALUES (?, ?, ?)', [user_id, characterToCatch, rarityValue]);
            await conn.execute('UPDATE users SET total_xp = total_xp + ? WHERE id = ?', [xpGained, user_id]);
            
            const [[user]] = await conn.execute('SELECT level, total_xp FROM users WHERE id = ?', [user_id]);
            
            let newLevel = user.level;
            while (user.total_xp >= XP_THRESHOLD(newLevel)) {
                newLevel++;
            }
            
            if (newLevel !== user.level) {
                await conn.execute('UPDATE users SET level = ? WHERE id = ?', [newLevel, user_id]);
            }
            
            return { total_xp: user.total_xp, level: newLevel, leveledUp: newLevel !== user.level };
        });

        if (spawn_id) removeSpawn(spawn_id);
        else if (lat !== undefined && lng !== undefined) removeSpawn({ lat, lng });

        res.json({
            success: true,
            caught: characterToCatch,
            rarity: rarityValue,
            xp_gained: xpGained,
            total_xp: result.total_xp,
            level: result.level,
            leveled_up: result.leveledUp,
        });
    } catch (err) {
        console.error('[Catch Error]', err);
        res.status(500).json({ error: 'Failed to catch character.' });
    }
});

// ─── GET /inventory/:user_id ────────────────────────────────
router.get('/inventory/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { XP_THRESHOLD } = config.GAME;

    try {
        const users = await query('SELECT id, username, level, total_xp FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = users[0];
        const inventory = await query(
            'SELECT id, character_name, rarity, caught_at FROM inventory WHERE user_id = ? ORDER BY caught_at DESC',
            [user_id]
        );

        const normalizedInventory = inventory.map((item) => ({
            ...item,
            rarity: getCharacterRarity(item.character_name) || item.rarity || 'common',
        }));

        res.json({
            user: {
                id: user.id,
                username: user.username,
                level: user.level,
                total_xp: user.total_xp,
                xp_to_next_level: XP_THRESHOLD(user.level) - user.total_xp,
            },
            inventory: normalizedInventory,
        });
    } catch (err) {
        console.error('[Inventory Error]', err);
        res.status(500).json({ error: 'Failed to fetch inventory.' });
    }
});

module.exports = router;
