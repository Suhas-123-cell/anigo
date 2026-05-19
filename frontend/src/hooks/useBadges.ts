// AniGO Badges React Hook
// Place in: frontend/src/hooks/useBadges.ts

import { useState, useEffect, useCallback } from 'react';
import {
    CharacterBadge,
    CharacterRarity,
    RarityStats,
    InventoryItem,
} from '../types/badges';
import { badgesClient } from '../utils/badgesClient';

interface UseBadgesState {
    loading: boolean;
    error: string | null;
}

interface UseAllBadgesReturn extends UseBadgesState {
    badges: CharacterBadge[];
    total: number;
    refetch: () => Promise<void>;
}

interface UseBadgesByRarityReturn extends UseBadgesState {
    badges: CharacterBadge[];
    total: number;
    refetch: () => Promise<void>;
}

interface UseUserBadgesReturn extends UseBadgesState {
    collected: InventoryItem[];
    total: number;
    byRarity: RarityStats;
    refetch: () => Promise<void>;
}

interface UseBadgeStatsReturn extends UseBadgesState {
    stats: {
        totalBadges: number;
        totalCatches: number;
        byRarity: RarityStats;
    } | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch all available badges
 */
export function useAllBadges(): UseAllBadgesReturn {
    const [badges, setBadges] = useState<CharacterBadge[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBadges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getAllBadges();
            setBadges(data);
            setTotal(data.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch badges');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    return { badges, total, loading, error, refetch: fetchBadges };
}

/**
 * Hook to fetch badges by rarity
 */
export function useBadgesByRarity(rarity: CharacterRarity): UseBadgesByRarityReturn {
    const [badges, setBadges] = useState<CharacterBadge[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBadges = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getBadgesByRarity(rarity);
            setBadges(data);
            setTotal(data.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to fetch ${rarity} badges`);
        } finally {
            setLoading(false);
        }
    }, [rarity]);

    useEffect(() => {
        fetchBadges();
    }, [rarity, fetchBadges]);

    return { badges, total, loading, error, refetch: fetchBadges };
}

/**
 * Hook to fetch a specific badge by name
 */
export function useBadgeByName(characterName: string | null) {
    const [badge, setBadge] = useState<CharacterBadge | null>(null);
    const [loading, setLoading] = useState(!!characterName);
    const [error, setError] = useState<string | null>(null);

    const fetchBadge = useCallback(async () => {
        if (!characterName) {
            setBadge(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getBadgeByName(characterName);
            setBadge(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch badge');
        } finally {
            setLoading(false);
        }
    }, [characterName]);

    useEffect(() => {
        fetchBadge();
    }, [characterName, fetchBadge]);

    return { badge, loading, error, refetch: fetchBadge };
}

/**
 * Hook to fetch badges by anime title
 */
export function useBadgesByAnime(animeTitle: string | null): UseBadgesByRarityReturn {
    const [badges, setBadges] = useState<CharacterBadge[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(!!animeTitle);
    const [error, setError] = useState<string | null>(null);

    const fetchBadges = useCallback(async () => {
        if (!animeTitle) {
            setBadges([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getBadgesByAnime(animeTitle);
            setBadges(data);
            setTotal(data.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch badges');
        } finally {
            setLoading(false);
        }
    }, [animeTitle]);

    useEffect(() => {
        fetchBadges();
    }, [animeTitle, fetchBadges]);

    return { badges, total, loading, error, refetch: fetchBadges };
}

/**
 * Hook to fetch user's collected badges
 */
export function useUserBadges(userId: number | null): UseUserBadgesReturn {
    const [collected, setCollected] = useState<InventoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [byRarity, setByRarity] = useState<RarityStats>({
        common: 0,
        rare: 0,
        legendary: 0,
        black: 0,
    });
    const [loading, setLoading] = useState(!!userId);
    const [error, setError] = useState<string | null>(null);

    const fetchBadges = useCallback(async () => {
        if (!userId) {
            setCollected([]);
            setTotal(0);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getUserBadges(userId);
            setCollected(data.collected);
            setTotal(data.total);
            setByRarity(data.byRarity);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user badges');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchBadges();
    }, [userId, fetchBadges]);

    return { collected, total, byRarity, loading, error, refetch: fetchBadges };
}

/**
 * Hook to fetch global badge statistics
 */
export function useBadgeStats(): UseBadgeStatsReturn {
    const [stats, setStats] = useState<{
        totalBadges: number;
        totalCatches: number;
        byRarity: RarityStats;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
}

/**
 * Hook to fetch all anime titles
 */
export function useAnimeTitles() {
    const [titles, setTitles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTitles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await badgesClient.getAnimeTitles();
            setTitles(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch anime titles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTitles();
    }, [fetchTitles]);

    return { titles, loading, error, refetch: fetchTitles };
}
