// AniGO Badges API Client
// Place in: frontend/src/utils/badgesClient.ts

import {
    CharacterBadge,
    CharacterRarity,
    GetAllBadgesResponse,
    GetBadgesByRarityResponse,
    GetBadgeByNameResponse,
    GetBadgesByAnimeResponse,
    GetUserBadgesResponse,
    GetBadgeStatsResponse,
    ErrorResponse,
    isErrorResponse,
} from '../types/badges';
import API_BASE_URL from '../constants/api';

class BadgesClient {
    private baseUrl = `${API_BASE_URL}/badges`;

    /**
     * Get all available badges
     */
    async getAllBadges(): Promise<CharacterBadge[]> {
        const response = await fetch(`${this.baseUrl}`);
        const data = (await response.json()) as GetAllBadgesResponse | ErrorResponse;

        if (isErrorResponse(data)) {
            throw new Error(data.error);
        }

        return data.badges;
    }

    /**
     * Get badges filtered by rarity
     */
    async getBadgesByRarity(rarity: CharacterRarity): Promise<CharacterBadge[]> {
        const response = await fetch(`${this.baseUrl}/${rarity}`);
        const data = (await response.json()) as GetBadgesByRarityResponse | ErrorResponse;

        if (isErrorResponse(data)) {
            throw new Error(data.error);
        }

        return data.badges;
    }

    /**
     * Get a specific badge by character name
     */
    async getBadgeByName(characterName: string): Promise<CharacterBadge> {
        const response = await fetch(`${this.baseUrl}/name/${encodeURIComponent(characterName)}`);
        const data = (await response.json()) as GetBadgeByNameResponse | ErrorResponse;

        if (isErrorResponse(data)) {
            throw new Error(data.error);
        }

        return data.badge;
    }

    /**
     * Get all badges from a specific anime series
     */
    async getBadgesByAnime(animeTitle: string): Promise<CharacterBadge[]> {
        const response = await fetch(`${this.baseUrl}/anime/${encodeURIComponent(animeTitle)}`);
        const data = (await response.json()) as GetBadgesByAnimeResponse | ErrorResponse;

        if (isErrorResponse(data)) {
            throw new Error(data.error);
        }

        return data.badges;
    }

    /**
     * Get user's collected badges
     */
    async getUserBadges(userId: number) {
        const response = await fetch(`${this.baseUrl}/user/${userId}`);
        const data = (await response.json()) as GetUserBadgesResponse | ErrorResponse;

        if (isErrorResponse(data)) {
            throw new Error(data.error);
        }

        return {
            collected: data.collected,
            total: data.total,
            byRarity: data.byRarity,
        };
    }

    /**
     * Get global badge statistics
     */
    async getStats() {
        const response = await fetch(`${this.baseUrl}/stats`);
        const data = (await response.json()) as GetBadgeStatsResponse | ErrorResponse;

        if (isErrorResponse(data)) {
            throw new Error(data.error);
        }

        return data.stats;
    }

    /**
     * Get all badges grouped by rarity
     */
    async getAllBadgesGroupedByRarity() {
        const [common, rare, legendary, black] = await Promise.all([
            this.getBadgesByRarity('common'),
            this.getBadgesByRarity('rare'),
            this.getBadgesByRarity('legendary'),
            this.getBadgesByRarity('black'),
        ]);

        return { common, rare, legendary, black };
    }

    /**
     * Get all unique anime titles from badges
     */
    async getAnimeTitles(): Promise<string[]> {
        const badges = await this.getAllBadges();
        const titles = new Set(badges.map(b => b.anime));
        return Array.from(titles).sort();
    }
}

// Export singleton instance
export const badgesClient = new BadgesClient();

// Export class for testing
export { BadgesClient };
