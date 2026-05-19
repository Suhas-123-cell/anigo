// ============================================================
// Spawn Routes - Get spawns, catch characters
// ============================================================

const express = require('express');
const { getActiveSpawns, getSpawnById, removeSpawn, addSpawnNearLocation, isSpawnCaught, getSpawnCaughtBy, hasUserFleeFromSpawn } = require('../spawner');

const router = express.Router();

// ─── GET /spawns ────────────────────────────────────────────
// Get all active spawns on the map
router.get('/', (req, res) => {
    const { user_id } = req.query;
    const spawns = getActiveSpawns();

    // Add caught_by and fled status to each spawn
    const spawnsWithStatus = spawns.map(spawn => ({
        ...spawn,
        caught_by: getSpawnCaughtBy(spawn.id) || null,
        user_fled: user_id ? hasUserFleeFromSpawn(spawn.id, parseInt(user_id, 10)) : false,
    }));

    res.json({
        success: true,
        count: spawnsWithStatus.length,
        spawns: spawnsWithStatus,
    });
});

// ─── GET /spawns/:id ────────────────────────────────────────
// Get a specific spawn by ID
router.get('/:id', (req, res) => {
    const spawn = getSpawnById(req.params.id);

    if (!spawn) {
        return res.status(404).json({
            success: false,
            error: 'Spawn not found or already caught',
        });
    }

    res.json({
        success: true,
        spawn,
    });
});

// ─── POST /spawns/near ──────────────────────────────────────
// Generate spawns near a user's location (for testing)
router.post('/near', (req, res) => {
    const { lat, lng, count = 1 } = req.body;

    if (lat === undefined || lng === undefined) {
        return res.status(400).json({
            success: false,
            error: 'lat and lng are required',
        });
    }

    const spawns = [];
    for (let i = 0; i < count; i++) {
        spawns.push(addSpawnNearLocation(lat, lng));
    }

    res.json({
        success: true,
        message: `Added ${spawns.length} spawn(s) near your location`,
        spawns,
    });
});

module.exports = router;
