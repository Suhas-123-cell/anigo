// AniGO Badges - TypeScript Types and API Client
// Place in: frontend/src/types/badges.ts

import { ImageSourcePropType } from 'react-native';

export type CharacterRarity = 'common' | 'rare' | 'legendary' | 'black';

// Character image mapping - SINGLE SOURCE OF TRUTH for all avatar assets
export const CHARACTER_AVATARS: Record<string, ImageSourcePropType> = {
    // Common Characters - Using available assets, with fallback pattern
    'Tanjiro Kamado': require('../../assets/tanjiro.jpg'),
    'Nezuko Kamado': require('../../assets/nezuko.png'),
    'Zenitsu Agatsuma': require('../../assets/zenitsu.jpg'),
    'Inosuke Hashibira': require('../../assets/insouke.jpg'),
    'Yuji Itadori': require('../../assets/yuji.png'),
    'Megumi Fushiguro': require('../../assets/megumi.jpg'),
    'Nobara Kugisaki': require('../../assets/nobara.jpg'),
    'Sakura Haruno': require('../../assets/sakura.jpg'),
    'Rock Lee': require('../../assets/rocklee.jpg'),
    'Hinata Hyuga': require('../../assets/hinata.jpg'),
    'Sanji': require('../../assets/sanji.jpg'),
    'Usopp': require('../../assets/usopp.jpg'),
    'Tony Tony Chopper': require('../../assets/chopper.png'),
    'Nami': require('../../assets/nami.jpg'),
    'Orihime Inoue': require('../../assets/orihime.jpg'),
    'Uryu Ishida': require('../../assets/uryu.jpg'),
    'Mikasa Ackerman': require('../../assets/mikasa.jpg'),
    'Armin Arlert': require('../../assets/armin.jpg'),
    'Sasha Blouse': require('../../assets/sasha.jpg'),
    'Genos': require('../../assets/genos.jpg'),
    'Mumen Rider': require('../../assets/mumen.jpg'),
    'Ochaco Uraraka': require('../../assets/ochaco.jpg'),
    'Tenya Iida': require('../../assets/tenya.jpg'),
    'Denji': require('../../assets/denji.jpg'),
    'Power': require('../../assets/power.jpg'),
    'Aki Hayakawa': require('../../assets/aki.jpg'),
    'Subaru Natsuki': require('../../assets/subaru.jpg'),
    'Emilia': require('../../assets/emilia.jpg'),
    'Edward Elric': require('../../assets/edward.png'),
    'Winry Rockbell': require('../../assets/winry.jpg'),
    // Rare Characters
    'Naruto Uzumaki': require('../../assets/naruto.jpg'),
    'Naruto': require('../../assets/naruto.jpg'),
    'Sasuke Uchiha': require('../../assets/sasuke.jpg'),
    'Sasuke': require('../../assets/sasuke.jpg'),
    'Kakashi Hatake': require('../../assets/kakashi.jpg'),
    'Kakashi': require('../../assets/kakashi.jpg'),
    'Roronoa Zoro': require('../../assets/zoro.jpg'),
    'Zoro': require('../../assets/zoro.jpg'),
    'Monkey D. Ace': require('../../assets/Disegno Ace One Piece.jpg'),
    'Ace': require('../../assets/Disegno Ace One Piece.jpg'),
    'Toji Fushiguro': require('../../assets/toji.jpg'),
    'Toji': require('../../assets/toji.jpg'),
    'Levi Ackerman': require('../../assets/levi.jpg'),
    'Levi': require('../../assets/levi.jpg'),
    'Light Yagami': require('../../assets/light.jpg'),
    'Light': require('../../assets/light.jpg'),
    'Vegeta': require('../../assets/vegeta.jpg'),
    'Shoto Todoroki': require('../../assets/shoto.jpg'),
    'Shoto': require('../../assets/shoto.jpg'),
    'Killua Zoldyck': require('../../assets/killua.jpg'),
    'Killua': require('../../assets/killua.jpg'),
    'Yuta Okkotsu': require('../../assets/yuta.jpg'),
    'Yuta': require('../../assets/yuta.jpg'),
    // Legendary Characters
    'Monkey D. Luffy': require('../../assets/luffy.png'),
    'Luffy': require('../../assets/luffy.png'),
    'Satoru Gojo': require('../../assets/gojo.jpg'),
    'Gojo': require('../../assets/gojo.jpg'),
    'Goku': require('../../assets/Goku UI.jpg'),
    'Sung Jin-Woo': require('../../assets/jinwoo.jpg'),
    'Jin-Woo': require('../../assets/jinwoo.jpg'),
    'Ichigo Kurosaki': require('../../assets/ichigo.jpg'),
    'Ichigo': require('../../assets/ichigo.jpg'),
    'Eren Yeager': require('../../assets/eren.jpg'),
    'Eren': require('../../assets/eren.jpg'),
    'Saitama': require('../../assets/saitama.jpg'),
    // Black Characters
    'Itachi Uchiha': require('../../assets/itachi.jpg'),
    'Itachi': require('../../assets/itachi.jpg'),
    'Ryomen Sukuna': require('../../assets/sukuna.png'),
    'Sukuna': require('../../assets/sukuna.png'),
    'Sosuke Aizen': require('../../assets/aizen.jpg'),
    'Aizen': require('../../assets/aizen.jpg'),
    'Akagami Shanks': require('../../assets/shanks.jpg'),
    'Shanks': require('../../assets/shanks.jpg'),
};

/**
 * Get avatar source for a character by name
 * @param characterName - The character name to look up
 * @returns The image source or undefined if not found
 */
export function getCharacterAvatar(characterName: string | undefined): ImageSourcePropType | undefined {
    if (!characterName) {
        console.warn(`[getCharacterAvatar] characterName is undefined or empty`);
        return undefined;
    }
    
    console.log(`[getCharacterAvatar] Looking up: "${characterName}"`);
    
    // Try exact match first
    let avatar = CHARACTER_AVATARS[characterName];
    if (avatar) {
        console.log(`[getCharacterAvatar] Found exact match for "${characterName}"`);
        return avatar;
    }
    
    // Try case-insensitive match
    const lowerName = characterName.toLowerCase();
    for (const [key, value] of Object.entries(CHARACTER_AVATARS)) {
        if (key.toLowerCase() === lowerName) {
            console.log(`[getCharacterAvatar] Found case-insensitive match: "${key}" for "${characterName}"`);
            return value;
        }
    }
    
    // Try partial matching for common name variations
    const nameParts = characterName.split(/\s+/);
    if (nameParts.length > 1) {
        // Try matching first name
        const firstName = nameParts[0];
        for (const [key, value] of Object.entries(CHARACTER_AVATARS)) {
            if (key.toLowerCase().includes(firstName.toLowerCase())) {
                console.log(`[getCharacterAvatar] Found first name match: "${key}" for "${characterName}"`);
                return value;
            }
        }
        // Try matching last name
        const lastName = nameParts[nameParts.length - 1];
        for (const [key, value] of Object.entries(CHARACTER_AVATARS)) {
            if (key.toLowerCase().includes(lastName.toLowerCase())) {
                console.log(`[getCharacterAvatar] Found last name match: "${key}" for "${characterName}"`);
                return value;
            }
        }
    }
    
    console.warn(`⚠️ [getCharacterAvatar] No image found for character: "${characterName}"`);
    console.log(`   Available characters: ${Object.keys(CHARACTER_AVATARS).length} total`);
    console.log(`   First 10: ${Object.keys(CHARACTER_AVATARS).slice(0, 10).join(', ')}`);
    return undefined;
}

/**
 * Character badge metadata from database
 */
export interface CharacterBadge {
    id: number;
    name: string;
    anime: string;
    rarity: CharacterRarity;
    spawn_frequency_ms: number;
    xp_reward: number;
    avatar_filename: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * User's inventory item (collected badge)
 */
export interface InventoryItem extends Omit<CharacterBadge, 'created_at' | 'updated_at'> {
    id: number;
    character_name: string;
    caught_at: string;
}

/**
 * Rarity distribution statistics
 */
export interface RarityStats {
    common: number;
    rare: number;
    legendary: number;
    black: number;
}

/**
 * Response from GET /api/badges
 */
export interface GetAllBadgesResponse {
    success: boolean;
    badges: CharacterBadge[];
    total: number;
    byRarity: RarityStats;
}

/**
 * Response from GET /api/badges/:rarity
 */
export interface GetBadgesByRarityResponse {
    success: boolean;
    rarity: CharacterRarity;
    badges: CharacterBadge[];
    total: number;
}

/**
 * Response from GET /api/badges/name/:characterName
 */
export interface GetBadgeByNameResponse {
    success: boolean;
    badge: CharacterBadge;
}

/**
 * Response from GET /api/badges/anime/:animeTitle
 */
export interface GetBadgesByAnimeResponse {
    success: boolean;
    anime: string;
    badges: CharacterBadge[];
    total: number;
}

/**
 * Response from GET /api/badges/user/:userId
 */
export interface GetUserBadgesResponse {
    success: boolean;
    userId: number;
    collected: InventoryItem[];
    total: number;
    byRarity: RarityStats;
}

/**
 * Response from GET /api/badges/stats
 */
export interface GetBadgeStatsResponse {
    success: boolean;
    stats: {
        totalBadges: number;
        totalCatches: number;
        byRarity: RarityStats;
    };
}

/**
 * Error response
 */
export interface ErrorResponse {
    success: false;
    error: string;
}

/**
 * Type guard for successful responses
 */
export function isSuccessResponse<T extends { success: boolean }>(
    response: T | ErrorResponse
): response is Exclude<T, ErrorResponse> {
    return response.success === true;
}

/**
 * Type guard for error responses
 */
export function isErrorResponse(response: any): response is ErrorResponse {
    return response.success === false;
}
