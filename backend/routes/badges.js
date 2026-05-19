// ============================================================
// Badges Routes - Get character badges and metadata
// ============================================================

const express = require('express');
const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ─── GET /badges ────────────────────────────────────────────
// Get all available badges/characters
router.get('/', asyncHandler(async (req, res) => {
    try {
        const characters = await query('characters', {
            select: 'id, name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename',
            orderBy: { rarity: 'asc', name: 'asc' },
        });

        if (!characters || characters.length === 0) {
            return res.status(200).json({
                success: true,
                badges: [],
                total: 0,
                message: 'No badges available yet',
            });
        }

        res.status(200).json({
            success: true,
            badges: characters,
            total: characters.length,
            byRarity: {
                common: characters.filter(c => c.rarity === 'common').length,
                rare: characters.filter(c => c.rarity === 'rare').length,
                legendary: characters.filter(c => c.rarity === 'legendary').length,
                black: characters.filter(c => c.rarity === 'black').length,
            },
        });
    } catch (error) {
        console.error('[Get Badges Error]', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badges',
        });
    }
}));

// ─── GET /badges/:rarity ────────────────────────────────────
// Get badges by rarity level
router.get('/:rarity', asyncHandler(async (req, res) => {
    const { rarity } = req.params;
    const validRarities = ['common', 'rare', 'legendary', 'black'];

    if (!validRarities.includes(rarity.toLowerCase())) {
        return res.status(400).json({
            success: false,
            error: `Invalid rarity. Must be one of: ${validRarities.join(', ')}`,
        });
    }

    try {
        const characters = await query('characters', {
            filters: { rarity: rarity.toLowerCase() },
            select: 'id, name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename',
            orderBy: { name: 'asc' },
        });

        res.status(200).json({
            success: true,
            rarity: rarity.toLowerCase(),
            badges: characters,
            total: characters.length,
        });
    } catch (error) {
        console.error('[Get Badges by Rarity Error]', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badges by rarity',
        });
    }
}));

// ─── GET /badges/name/:characterName ─────────────────────────
// Get a specific badge by character name
router.get('/name/:characterName', asyncHandler(async (req, res) => {
    const { characterName } = req.params;

    try {
        const characters = await query('characters', {
            filters: { name: characterName },
            select: 'id, name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename',
        });

        if (!characters || characters.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Badge '${characterName}' not found`,
            });
        }

        res.status(200).json({
            success: true,
            badge: characters[0],
        });
    } catch (error) {
        console.error('[Get Badge by Name Error]', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badge',
        });
    }
}));

// ─── GET /badges/anime/:animeTitle ──────────────────────────
// Get all badges from a specific anime
router.get('/anime/:animeTitle', asyncHandler(async (req, res) => {
    const { animeTitle } = req.params;

    try {
        const characters = await query('characters', {
            filters: { anime: animeTitle },
            select: 'id, name, anime, rarity, spawn_frequency_ms, xp_reward, avatar_filename',
            orderBy: { rarity: 'asc', name: 'asc' },
        });

        if (!characters || characters.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No badges found for anime '${animeTitle}'`,
            });
        }

        res.status(200).json({
            success: true,
            anime: animeTitle,
            badges: characters,
            total: characters.length,
        });
    } catch (error) {
        console.error('[Get Badges by Anime Error]', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badges by anime',
        });
    }
}));

// ─── GET /badges/user/:userId ──────────────────────────────
// Get user's collected badges from inventory
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
        // Get user's inventory
        const inventoryItems = await query('inventory', {
            filters: { user_id: parseInt(userId, 10) },
            select: 'id, character_name, rarity, caught_at',
            orderBy: { caught_at: 'desc' },
        });

        if (!inventoryItems || inventoryItems.length === 0) {
            return res.status(200).json({
                success: true,
                userId: parseInt(userId, 10),
                collected: [],
                total: 0,
                message: 'No badges collected yet',
            });
        }

        // Enrich with character metadata
        const enrichedBadges = await Promise.all(
            inventoryItems.map(async (item) => {
                const chars = await query('characters', {
                    filters: { name: item.character_name },
                    select: 'anime, spawn_frequency_ms, xp_reward, avatar_filename',
                });
                return {
                    ...item,
                    ...chars[0],
                };
            })
        );

        // Group by rarity
        const byRarity = {
            common: enrichedBadges.filter(b => b.rarity === 'common').length,
            rare: enrichedBadges.filter(b => b.rarity === 'rare').length,
            legendary: enrichedBadges.filter(b => b.rarity === 'legendary').length,
            black: enrichedBadges.filter(b => b.rarity === 'black').length,
        };

        res.status(200).json({
            success: true,
            userId: parseInt(userId, 10),
            collected: enrichedBadges,
            total: enrichedBadges.length,
            byRarity,
        });
    } catch (error) {
        console.error('[Get User Badges Error]', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user badges',
        });
    }
}));

// ─── GET /badges/stats ──────────────────────────────────────
// Get global badge statistics
router.get('/stats', asyncHandler(async (req, res) => {
    try {
        const allCharacters = await query('characters', {
            select: 'id, rarity',
        });

        const totalCatches = await query('inventory', {
            select: 'id',
        });

        const stats = {
            totalBadges: allCharacters.length || 0,
            totalCatches: totalCatches.length || 0,
            byRarity: {
                common: allCharacters.filter(c => c.rarity === 'common').length,
                rare: allCharacters.filter(c => c.rarity === 'rare').length,
                legendary: allCharacters.filter(c => c.rarity === 'legendary').length,
                black: allCharacters.filter(c => c.rarity === 'black').length,
            },
        };

        res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('[Get Badge Stats Error]', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badge statistics',
        });
    }
}));

module.exports = router;
