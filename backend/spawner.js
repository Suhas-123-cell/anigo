// ============================================================
// Spawner — Anime Character Spawn System
// Frequency-based spawning with character rarity table
// ============================================================

const config = require('./config');
const { query: dbQuery } = require('./db');

// Pre-defined spawn locations (Hyderabad area for testing)
// Two polygon areas with corners defined
const SPAWN_POLYGONS = [
    
   /* {
        name: 'Main Zone',
        points: [
            { lat: 24.8432472, lng: 93.9378714 },
            { lat: 24.8442224, lng: 93.9390875 },
            { lat: 24.8427398, lng: 93.9398526 },
            { lat: 24.8423013, lng: 93.9383274 },
        ],
    }, */
    {
        name: 'Secondary Zone',
        points: [
            { lat: 24.8431365, lng: 93.9379294 },
            { lat: 24.8431931, lng: 93.9381095 },
            { lat: 24.8430337, lng: 93.9379757 },
            { lat: 24.8430893, lng: 93.9381614 },
        ],
    },
];

// Fallback character data (if database is unavailable)
// 50 unique anime characters with rarity distribution: 30 common, 12 rare, 5 legendary, 3 black
const ANIME_CHARACTERS = [
    // COMMON (30 characters)
    { name: 'Tanjiro Kamado', anime: 'Demon Slayer', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Nezuko Kamado', anime: 'Demon Slayer', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Zenitsu Agatsuma', anime: 'Demon Slayer', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Inosuke Hashibira', anime: 'Demon Slayer', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Yuji Itadori', anime: 'Jujutsu Kaisen', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Megumi Fushiguro', anime: 'Jujutsu Kaisen', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Nobara Kugisaki', anime: 'Jujutsu Kaisen', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Sakura Haruno', anime: 'Naruto', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Rock Lee', anime: 'Naruto', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Hinata Hyuga', anime: 'Naruto', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Sanji', anime: 'One Piece', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Usopp', anime: 'One Piece', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Tony Tony Chopper', anime: 'One Piece', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Nami', anime: 'One Piece', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Orihime Inoue', anime: 'Bleach', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Uryu Ishida', anime: 'Bleach', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Mikasa Ackerman', anime: 'Attack on Titan', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Armin Arlert', anime: 'Attack on Titan', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Sasha Blouse', anime: 'Attack on Titan', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Genos', anime: 'One Punch Man', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Mumen Rider', anime: 'One Punch Man', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Ochaco Uraraka', anime: 'My Hero Academia', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Tenya Iida', anime: 'My Hero Academia', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Denji', anime: 'Chainsaw Man', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Power', anime: 'Chainsaw Man', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Aki Hayakawa', anime: 'Chainsaw Man', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Subaru Natsuki', anime: 'Re:Zero', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Emilia', anime: 'Re:Zero', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Edward Elric', anime: 'Fullmetal Alchemist', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },
    { name: 'Winry Rockbell', anime: 'Fullmetal Alchemist', rarity: 'common', spawn_frequency_ms: 300000, xp_reward: 5 },

    // RARE (12 characters)
    { name: 'Naruto Uzumaki', anime: 'Naruto', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Sasuke Uchiha', anime: 'Naruto', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Kakashi Hatake', anime: 'Naruto', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Roronoa Zoro', anime: 'One Piece', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Monkey D. Ace', anime: 'One Piece', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Toji Fushiguro', anime: 'Jujutsu Kaisen', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Levi Ackerman', anime: 'Attack on Titan', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Light Yagami', anime: 'Death Note', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Vegeta', anime: 'Dragon Ball', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Shoto Todoroki', anime: 'My Hero Academia', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Killua Zoldyck', anime: 'Hunter x Hunter', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },
    { name: 'Yuta Okkotsu', anime: 'Jujutsu Kaisen', rarity: 'rare', spawn_frequency_ms: 900000, xp_reward: 10 },

    // LEGENDARY (7 characters)
    { name: 'Monkey D. Luffy', anime: 'One Piece', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },
    { name: 'Satoru Gojo', anime: 'Jujutsu Kaisen', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },
    { name: 'Goku', anime: 'Dragon Ball', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },
    { name: 'Sung Jin-Woo', anime: 'Solo Leveling', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },
    { name: 'Ichigo Kurosaki', anime: 'Bleach', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },
    { name: 'Eren Yeager', anime: 'Attack on Titan', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },
    { name: 'Saitama', anime: 'One Punch Man', rarity: 'legendary', spawn_frequency_ms: 1800000, xp_reward: 25 },

    // BLACK (5 characters)
    { name: 'Itachi Uchiha', anime: 'Naruto', rarity: 'black', spawn_frequency_ms: 3600000, xp_reward: 100 },
    { name: 'Ryomen Sukuna', anime: 'Jujutsu Kaisen', rarity: 'black', spawn_frequency_ms: 3600000, xp_reward: 100 },
    { name: 'Sosuke Aizen', anime: 'Bleach', rarity: 'black', spawn_frequency_ms: 3600000, xp_reward: 100 },
    { name: 'Akagami Shanks', anime: 'One Piece', rarity: 'black', spawn_frequency_ms: 3600000, xp_reward: 100 },];
    
const CHARACTER_RARITY_MAP = ANIME_CHARACTERS.reduce((acc, character) => {
    acc[character.name.toLowerCase()] = character.rarity;
    return acc;
}, {});

// Alias support for alternate character labels used in UI/tests.
CHARACTER_RARITY_MAP['naruto'] = 'rare';

function getCharacterRarity(characterName) {
    if (!characterName) return null;
    return CHARACTER_RARITY_MAP[String(characterName).toLowerCase()] || null;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point, polygon) {
    const { lat: x, lng: y } = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat;
        const yi = polygon[i].lng;
        const xj = polygon[j].lat;
        const yj = polygon[j].lng;

        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Generate a random point within a polygon using rejection sampling
 * Ensures the point is always inside the polygon
 */
function generateRandomPointInPolygon(polygon) {
    // Validate polygon has at least 3 points
    if (!polygon || polygon.length < 3) {
        console.error('[Spawner] Invalid polygon:', polygon);
        return { lat: 24.8420, lng: 93.9420 }; // Fallback center
    }

    // Find bounding box
    let minLat = polygon[0].lat;
    let maxLat = polygon[0].lat;
    let minLng = polygon[0].lng;
    let maxLng = polygon[0].lng;

    for (const point of polygon) {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
    }

    // Add small padding to ensure valid bounding box
    const latPadding = (maxLat - minLat) * 0.1 || 0.0001;
    const lngPadding = (maxLng - minLng) * 0.1 || 0.0001;

    minLat -= latPadding;
    maxLat += latPadding;
    minLng -= lngPadding;
    maxLng += lngPadding;

    // Rejection sampling: generate random points until one falls inside polygon
    let attempts = 0;
    const maxAttempts = 100; // Increased from 50

    while (attempts < maxAttempts) {
        const randomLat = minLat + Math.random() * (maxLat - minLat);
        const randomLng = minLng + Math.random() * (maxLng - minLng);
        const randomPoint = { lat: randomLat, lng: randomLng };

        if (isPointInPolygon(randomPoint, polygon)) {
            return randomPoint;
        }
        attempts++;
    }

    // Fallback: return center of polygon if rejection sampling fails
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    console.warn(
        `[Spawner] Rejection sampling exceeded max attempts, using polygon center: (${centerLat.toFixed(6)}, ${centerLng.toFixed(6)})`
    );
    return { lat: centerLat, lng: centerLng };
}

// Active spawns on the map
let activeSpawns = [];
let spawnInterval = null;
let spawnTimeouts = {}; // Track timeout IDs for each spawn

// Track which user caught each spawn (for hiding from others)
let spawnCatchStatus = {}; // { spawn_id: user_id }

// Track which users have fled from each spawn (for hiding from that specific user)
let spawnFleeStatus = {}; // { spawn_id: Set(user_ids) }

// Spawn TTL in milliseconds (2.5 minutes = 150000ms)
const SPAWN_TTL_MS = 150000;

// Rarity spawn throttle intervals
const RARITY_SPAWN_INTERVALS = {
    common: 300000,      // 5 minutes
    rare: 900000,        // 15 minutes
    legendary: 1800000,  // 30 minutes
    black: 3600000,      // 1 hour
};

// Track last spawn time for each rarity
let lastRaritySpawnTime = {
    common: 0,
    rare: 0,
    legendary: 0,
    black: 0,
};

/**
 * Generate a unique spawn ID
 */
function generateSpawnId() {
    return `spawn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a spawn with automatic removal after TTL expires
 */
function addSpawnWithTTL(spawn) {
    activeSpawns.push(spawn);

    // Set timeout to remove spawn after 2.5 minutes
    const timeoutId = setTimeout(() => {
        removeSpawn(spawn.id);
        delete spawnTimeouts[spawn.id];
        console.log(`[Spawner] Spawn ${spawn.character} expired after 2.5 minutes`);
    }, SPAWN_TTL_MS);

    spawnTimeouts[spawn.id] = timeoutId;
}

/**
 * Randomly select and assign characters to spawn points
 */
function refreshSpawns(count = config.GAME.SPAWN_COUNT) {
    // Only spawn if we have room (keep spawn count steady)
    const spawnSlots = count - activeSpawns.length;
    if (spawnSlots <= 0) return;

    const now = Date.now();

    // Distribute new spawns across both polygons
    const spawnsPerPolygon = Math.ceil(spawnSlots / SPAWN_POLYGONS.length);
    const newSpawns = [];

    for (const polygon of SPAWN_POLYGONS) {
        for (let i = 0; i < spawnsPerPolygon && newSpawns.length < spawnSlots; i++) {
            let character = null;
            let selectedRarity = null;

            // Try to pick a character respecting cooldowns
            // First, try to respect cooldowns, but if all are on cooldown, allow common
            const availableRarities = Object.keys(RARITY_SPAWN_INTERVALS).filter(r => {
                const timeSinceLastSpawn = now - lastRaritySpawnTime[r];
                return timeSinceLastSpawn >= RARITY_SPAWN_INTERVALS[r];
            });

            if (availableRarities.length > 0) {
                // Pick from available rarities
                selectedRarity = availableRarities[Math.floor(Math.random() * availableRarities.length)];
            } else {
                // All on cooldown - allow common regardless to fill spawn slots
                selectedRarity = 'common';
            }

            const charactersOfRarity = ANIME_CHARACTERS.filter(c => c.rarity === selectedRarity);
            character = charactersOfRarity[Math.floor(Math.random() * charactersOfRarity.length)];

            const spawnPoint = generateRandomPointInPolygon(polygon.points);

            // Validate spawn point is within polygon boundaries
            const isValid = isPointInPolygon(spawnPoint, polygon.points);
            if (!isValid) {
                console.warn(
                    `[Spawner] Generated spawn point outside polygon! Point: (${spawnPoint.lat.toFixed(6)}, ${spawnPoint.lng.toFixed(6)}), Polygon: ${polygon.name}`
                );
            }

            const spawn = {
                id: generateSpawnId(),
                lat: spawnPoint.lat,
                lng: spawnPoint.lng,
                locationName: polygon.name,
                character: character.name,
                anime: character.anime,
                rarity: character.rarity,
                spawnedAt: new Date().toISOString(),
            };

            // Update last spawn time for this rarity (only if this specific rarity was ready)
            if (availableRarities.includes(character.rarity)) {
                lastRaritySpawnTime[character.rarity] = now;
            }
            
            const rarityEmoji = {
                common: '🟢',
                rare: '🔵',
                legendary: '⭐',
                black: '🖤'
            }[character.rarity];

            console.log(`[Spawner] ${rarityEmoji} ${character.rarity.toUpperCase()} spawned: ${character.name} @ ${polygon.name}`);

            newSpawns.push(spawn);
            addSpawnWithTTL(spawn);
        }
    }

    if (newSpawns.length > 0) {
        console.log(
            `[Spawner] ✓ Maintained spawn count: ${activeSpawns.length}/${count} characters active`
        );
    }
}

/**
 * Remove a spawn by ID or coordinates
 */
function removeSpawn(identifier) {
    const before = activeSpawns.length;

    if (typeof identifier === 'string') {
        // Remove by ID
        activeSpawns = activeSpawns.filter((s) => s.id !== identifier);
        // Clear timeout if exists
        if (spawnTimeouts[identifier]) {
            clearTimeout(spawnTimeouts[identifier]);
            delete spawnTimeouts[identifier];
        }
    } else if (identifier.lat !== undefined && identifier.lng !== undefined) {
        // Remove by coordinates
        const toRemove = activeSpawns.filter(
            (s) => Math.abs(s.lat - identifier.lat) < 0.0001 && Math.abs(s.lng - identifier.lng) < 0.0001
        );
        toRemove.forEach(s => {
            if (spawnTimeouts[s.id]) {
                clearTimeout(spawnTimeouts[s.id]);
                delete spawnTimeouts[s.id];
            }
        });
        activeSpawns = activeSpawns.filter(
            (s) => !(Math.abs(s.lat - identifier.lat) < 0.0001 && Math.abs(s.lng - identifier.lng) < 0.0001)
        );
    }

    const removed = before - activeSpawns.length;
    if (removed > 0) {
        console.log(`[Spawner] Removed ${removed} spawn(s)`);
    }
    return removed > 0;
}

/**
 * Get all active spawns
 */
function getActiveSpawns() {
    return activeSpawns;
}

/**
 * Get a specific spawn by ID
 */
function getSpawnById(id) {
    return activeSpawns.find((s) => s.id === id);
}

/**
 * Mark a spawn as caught by a user
 */
function markSpawnCaught(spawnId, userId) {
    spawnCatchStatus[spawnId] = userId;
    console.log(`[Spawner] Spawn ${spawnId} caught by user ${userId}`);
}

/**
 * Check if a spawn has been caught globally (by anyone)
 */
function isSpawnCaught(spawnId) {
    return spawnCatchStatus[spawnId] !== undefined;
}

/**
 * Check if a spawn was caught by a specific user
 */
function isSpawnCaughtByUser(spawnId, userId) {
    return spawnCatchStatus[spawnId] === userId;
}

/**
 * Get who caught a spawn (returns user_id or undefined)
 */
function getSpawnCaughtBy(spawnId) {
    return spawnCatchStatus[spawnId];
}

/**
 * Mark that a user has fled from a spawn (only hides it for that user)
 */
function markUserFleeFromSpawn(spawnId, userId) {
    if (!spawnFleeStatus[spawnId]) {
        spawnFleeStatus[spawnId] = new Set();
    }
    spawnFleeStatus[spawnId].add(userId);
    console.log(`[Spawner] User ${userId} fled from spawn ${spawnId}`);
}

/**
 * Check if a user has fled from a spawn (character won't show for them)
 */
function hasUserFleeFromSpawn(spawnId, userId) {
    return spawnFleeStatus[spawnId]?.has(userId) || false;
}

/**
 * Start the spawn refresh timer
 */
function startSpawner() {
    if (spawnInterval) return;

    // Spawn initial batch
    refreshSpawns();
    
    // Continuously maintain spawn count every 10 seconds
    spawnInterval = setInterval(() => {
        refreshSpawns();
    }, 10000);

    console.log(`[Spawner] Started (spawn TTL: ${SPAWN_TTL_MS / 1000}s, maintenance every 10s)`);
}

/**
 * Stop the spawn refresh timer
 */
function stopSpawner() {
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
        console.log('[Spawner] Stopped');
    }
}

/**
 * Add spawn points dynamically (for user location-based spawns)
 */
function addSpawnNearLocation(lat, lng, radius = 0.001) {
    // Find the closest polygon to the user location
    let closestPolygon = SPAWN_POLYGONS[0];
    let minDistance = Infinity;

    for (const polygon of SPAWN_POLYGONS) {
        // Calculate distance to polygon center
        let centerLat = 0;
        let centerLng = 0;
        for (const point of polygon.points) {
            centerLat += point.lat;
            centerLng += point.lng;
        }
        centerLat /= polygon.points.length;
        centerLng /= polygon.points.length;

        const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestPolygon = polygon;
        }
    }

    const character = ANIME_CHARACTERS[Math.floor(Math.random() * ANIME_CHARACTERS.length)];
    const spawnPoint = generateRandomPointInPolygon(closestPolygon.points);

    const spawn = {
        id: generateSpawnId(),
        lat: spawnPoint.lat,
        lng: spawnPoint.lng,
        locationName: closestPolygon.name,
        character: character.name,
        anime: character.anime,
        rarity: character.rarity,
        spawnedAt: new Date().toISOString(),
    };

    activeSpawns.push(spawn);
    return spawn;
}

module.exports = {
    getActiveSpawns,
    getSpawnById,
    getCharacterRarity,
    removeSpawn,
    refreshSpawns,
    startSpawner,
    stopSpawner,
    addSpawnNearLocation,
    markSpawnCaught,
    isSpawnCaught,
    isSpawnCaughtByUser,
    getSpawnCaughtBy,
    markUserFleeFromSpawn,
    hasUserFleeFromSpawn,
    SPAWN_POLYGONS,
    ANIME_CHARACTERS,
};
