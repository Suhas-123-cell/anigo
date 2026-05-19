export type Spawn = {
    id: string;
    lat: number;
    lng: number;
    locationName: string;
    character: string;
    anime?: string;
    rarity?: 'common' | 'rare' | 'legendary';
    spawnedAt: string;
    caught_by?: number | null; // User ID who caught it, or null if uncaught
    user_fled?: boolean; // Whether current user has fled from this spawn
    // Legacy field for backward compatibility
    name?: string;
};

export type UserStats = {
    id: number;
    username: string;
    level: number;
    total_xp: number;
    xp_to_next_level?: number;
    avatar?: number;
};

export type InventoryItem = {
    id: number;
    character_name: string;
    caught_at: string;
    rarity?: 'common' | 'rare' | 'legendary';
    xp_gained?: number;
};

export type CatchResult = {
    success: boolean;
    message?: string;
    caught?: {
        character: string;
        anime: string;
        rarity: string;
    };
    xp_gained: number;
    total_xp: number;
    level: number;
    leveled_up: boolean;
};

export type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
    Map: undefined;
    Profile: undefined;
    Collections: undefined;
    Leaderboard: undefined;
    AREncounter: {
        spawn: Spawn;
    };
    Quiz: {
        spawn: Spawn;
    };
};
