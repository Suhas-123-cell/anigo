// ============================================================
// Game Routes - Catch characters, inventory, stats
// ============================================================

const express = require('express');
const config = require('../config');
const { query, insert, update, getClient } = require('../db');
const { removeSpawn, getSpawnById, getCharacterRarity, markSpawnCaught, isSpawnCaught, getSpawnCaughtBy, markUserFleeFromSpawn } = require('../spawner');
const { validateBody, validateParams } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const { XP_PER_CATCH, XP_THRESHOLD } = config.GAME;

// ─── POST /game/catch ───────────────────────────────────────
// Catch an anime character
router.post('/catch', validateBody(['user_id', 'spawn_id']), asyncHandler(async (req, res, next) => {
    const { user_id, spawn_id, character_name, rarity: requestedRarity, lat, lng } = req.body;

    // Updated XP values (common=5, rare=10, legendary=25, black=100)
    const XP_BY_RARITY = {
        'common': 5,
        'rare': 10,
        'legendary': 25,
        'black': 100,
    };

    try {
        // Verify spawn exists
        const spawn = getSpawnById(spawn_id);
        const characterToCatch = spawn ? spawn.character : character_name;
        const canonicalRarity = getCharacterRarity(characterToCatch);
        const rarity = canonicalRarity || (spawn ? (spawn.rarity || 'common') : (requestedRarity || 'common'));

        if (!characterToCatch) {
            return res.status(400).json({
                success: false,
                error: 'Spawn not found. It may have expired.',
            });
        }

        // Check if this spawn was already caught by someone else
        if (isSpawnCaught(spawn_id)) {
            const caughtByUserId = getSpawnCaughtBy(spawn_id);
            if (caughtByUserId !== parseInt(user_id, 10)) {
                return res.status(400).json({
                    success: false,
                    error: 'This character was already caught by someone else!',
                });
            }
        }

        // Get current user stats
        const userId = parseInt(user_id, 10);
        const users = await query('users', {
            filters: { id: userId },
            select: 'level, total_xp',
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const user = users[0];
        const xpGained = XP_BY_RARITY[rarity] || 2;
        const newXp = user.total_xp + xpGained;

        // Calculate new level
        let newLevel = user.level;
        while (newXp >= XP_THRESHOLD(newLevel)) {
            newLevel++;
        }

        const leveledUp = newLevel !== user.level;

        // Add to inventory with rarity
        await insert('inventory', {
            user_id: userId,
            character_name: characterToCatch,
            rarity: rarity,
        });

        // Update XP and level
        await update('users', {
            total_xp: newXp,
            level: newLevel,
        }, { id: userId });

        // Mark spawn as caught by this user (globally)
        markSpawnCaught(spawn_id, userId);

        // Remove spawn from map
        if (spawn) {
            removeSpawn(spawn_id);
        }

        res.json({
            success: true,
            message: `You caught ${characterToCatch}!`,
            caught: {
                character: characterToCatch,
                anime: spawn?.anime || 'Unknown',
                rarity: rarity,
            },
            xp_gained: xpGained,
            total_xp: newXp,
            level: newLevel,
            leveled_up: leveledUp,
        });
    } catch (error) {
        console.error('[Catch Error]', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack,
        });
        next(error);
    }
}));

// ─── POST /game/flee ────────────────────────────────────────
// Mark a spawn as fled for the user (remove it from their view when they answer wrong)
router.post('/flee', validateBody(['spawn_id', 'user_id']), asyncHandler(async (req, res, next) => {
    const { spawn_id, user_id } = req.body;

    try {
        const spawn = getSpawnById(spawn_id);
        
        if (!spawn) {
            return res.status(404).json({
                success: false,
                error: 'Spawn not found or already fled.',
            });
        }

        // Mark that this user fled from this spawn (only hides it for them)
        markUserFleeFromSpawn(spawn_id, parseInt(user_id, 10));

        res.json({
            success: true,
            message: `${spawn.character} fled away!`,
            character: spawn.character,
        });
    } catch (error) {
        next(error);
    }
}));

// ─── GET /game/inventory/:user_id ───────────────────────────
// Get user's inventory
router.get('/inventory/:user_id', asyncHandler(async (req, res, next) => {
    const { user_id } = req.params;

    try {
        // Get user
        const users = await query('users', {
            filters: { id: parseInt(user_id) },
            select: 'id, username, level, total_xp',
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const user = users[0];

        // Get inventory
        const inventory = await query('inventory', {
            filters: { user_id: parseInt(user_id) },
            select: 'id, character_name, rarity, caught_at',
            orderBy: { column: 'caught_at', ascending: false },
        });

        const normalizedInventory = inventory.map((item) => ({
            ...item,
            rarity: getCharacterRarity(item.character_name) || item.rarity || 'common',
        }));

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                level: user.level,
                total_xp: user.total_xp,
                xp_to_next_level: XP_THRESHOLD(user.level) - user.total_xp,
            },
            inventory: normalizedInventory,
            total_caught: normalizedInventory.length,
        });
    } catch (error) {
        next(error);
    }
}));

// ─── GET /game/stats/:user_id ───────────────────────────────
// Get user's game stats
router.get('/stats/:user_id', asyncHandler(async (req, res, next) => {
    const { user_id } = req.params;

    try {
        const users = await query('users', {
            filters: { id: parseInt(user_id) },
            select: 'id, username, level, total_xp, created_at',
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const user = users[0];

        // Get inventory for stats
        const inventory = await query('inventory', {
            filters: { user_id: parseInt(user_id) },
        });

        // Count unique characters
        const uniqueChars = new Set(inventory.map(i => i.character_name)).size;

        res.json({
            success: true,
            stats: {
                username: user.username,
                level: user.level,
                total_xp: user.total_xp,
                xp_to_next_level: XP_THRESHOLD(user.level) - user.total_xp,
                total_catches: inventory.length,
                unique_characters: uniqueChars,
                member_since: user.created_at,
            },
        });
    } catch (error) {
        next(error);
    }
}));

// ─── GET /game/leaderboard ──────────────────────────────────
// Get top players
router.get('/leaderboard', asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 25; // Default to top 25 players

    try {
        const supabase = getClient();

        // Use raw Supabase query for aggregate
        const { data: players, error } = await supabase
            .from('users')
            .select('id, username, level, total_xp')
            .order('total_xp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Get catch counts separately
        const playersWithCatches = await Promise.all(
            players.map(async (player) => {
                const inventory = await query('inventory', {
                    filters: { user_id: player.id },
                });
                return {
                    ...player,
                    catches: inventory.length,
                };
            })
        );

        res.json({
            success: true,
            leaderboard: playersWithCatches.map((p, index) => ({
                rank: index + 1,
                ...p,
            })),
        });
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
