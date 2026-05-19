import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    FlatList,
    ImageBackground,
    Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL, { DEFAULT_HEADERS } from '../constants/api';
import { useBackgroundPreload } from '../hooks/useBackgroundPreload';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

interface LeaderboardEntry {
    id: number;
    username: string;
    level: number;
    total_xp: number;
    rank: number;
}

const LEVEL_BADGES: Record<number, { emoji: string; name: string }> = {
    1: { emoji: '🔰', name: 'Newborn' },
    2: { emoji: '⚡', name: 'Spark' },
    3: { emoji: '🔥', name: 'Flame' },
    4: { emoji: '❄️', name: 'Frost' },
    5: { emoji: '🌪️', name: 'Tempest' },
    6: { emoji: '⚔️', name: 'Warrior' },
    7: { emoji: '🗡️', name: 'Swordmaster' },
    8: { emoji: '🛡️', name: 'Guardian' },
    9: { emoji: '👑', name: 'Royal' },
    10: { emoji: '💎', name: 'Precious' },
    11: { emoji: '🌟', name: 'Star' },
    12: { emoji: '✨', name: 'Radiant' },
    13: { emoji: '🌠', name: 'Celestial' },
    14: { emoji: '🔮', name: 'Mystic' },
    15: { emoji: '⚡🔥', name: 'Maelstrom' },
    16: { emoji: '🗿', name: 'Ancient' },
    17: { emoji: '🦅', name: 'Eagle' },
    18: { emoji: '🐲', name: 'Dragon' },
    19: { emoji: '👹', name: 'Demon' },
    20: { emoji: '🌙', name: 'Lunar' },
    21: { emoji: '☀️', name: 'Solar' },
    22: { emoji: '⭐', name: 'Legend' },
    23: { emoji: '🔱', name: 'Titan' },
    24: { emoji: '👻', name: 'Specter' },
    25: { emoji: '🐐', name: 'Cursed One' },
};

export default function LeaderBoardScreen({ navigation }: Props) {
    const { user } = useContext(AuthContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

    // Preload background for instant rendering
    const backgroundSource = require('../../assets/sukuna-dark.png');
    useBackgroundPreload(backgroundSource);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/game/leaderboard`, {
                headers: DEFAULT_HEADERS,
            });
            
            if (!res.ok) {
                console.error('Leaderboard fetch failed:', res.status);
                setLeaderboard([]);
                setUserRank(null);
                setLoading(false);
                return;
            }
            
            const data = await res.json();
            
            if (data.success) {
                setLeaderboard(data.leaderboard || []);
                if (user) {
                    const currentUserRank = data.leaderboard?.find(
                        (entry: LeaderboardEntry) => entry.id === user.id
                    );
                    setUserRank(currentUserRank || null);
                }
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMedalEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isCurrentUser = user?.id === item.id;
        const badge = LEVEL_BADGES[item.level] || { emoji: '🔰', name: 'Newborn' };

        return (
            <View style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
                <View style={styles.rankContainer}>
                    <Text style={styles.rankMedal}>{getMedalEmoji(index + 1)}</Text>
                </View>

                <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
                        {item.username}{isCurrentUser ? ' (You)' : ''}
                    </Text>
                    <View style={styles.levelBadgeRow}>
                        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                        <Text style={styles.levelText}>Level {item.level}</Text>
                        <Text style={styles.xpText}>• {item.total_xp} XP</Text>
                    </View>
                </View>

                <View style={styles.rightSide}>
                    <Text style={styles.xpDisplay}>{item.total_xp.toLocaleString()}</Text>
                </View>
            </View>
        );
    };

    return (
        <ImageBackground
            source={backgroundSource}
            style={styles.background}
            resizeMode="cover"
            blurRadius={1}
        >
            <View style={styles.overlay} />
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>🏆 Leaderboard</Text>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={fetchLeaderboard}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.refreshText}>🔄</Text>
                    </TouchableOpacity>
                </View>

                {/* Current User Rank (if not in top 25) */}
                {userRank && !leaderboard.find(e => e.id === user?.id) && (
                    <View style={styles.currentUserSection}>
                        <Text style={styles.sectionLabel}>Your Rank</Text>
                        {renderLeaderboardItem({ item: userRank, index: userRank.rank - 1 })}
                    </View>
                )}

                {/* Loading State */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF6B6B" />
                        <Text style={styles.loadingText}>Fetching leaderboard...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={leaderboard}
                        renderItem={renderLeaderboardItem}
                        keyExtractor={(item) => `${item.id}`}
                        scrollEnabled
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(18, 18, 24, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 59, 48, 0.3)',
    },
    backButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        flex: 1,
    },
    refreshButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    refreshText: {
        fontSize: 18,
    },
    currentUserSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#AAA',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#AAA',
        marginTop: 12,
    },
    listContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginVertical: 6,
        backgroundColor: 'rgba(100, 100, 120, 0.3)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    currentUserRow: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 0.5)',
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankMedal: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    playerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    currentUserName: {
        color: '#4CAF50',
    },
    levelBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeEmoji: {
        fontSize: 16,
    },
    levelText: {
        fontSize: 13,
        color: '#FFD700',
        fontWeight: '600',
    },
    xpText: {
        fontSize: 12,
        color: '#AAA',
    },
    rightSide: {
        alignItems: 'flex-end',
        minWidth: 70,
    },
    xpDisplay: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
});
