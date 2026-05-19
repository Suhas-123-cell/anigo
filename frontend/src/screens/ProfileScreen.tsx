import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    FlatList,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL, { DEFAULT_HEADERS } from '../constants/api';
import { RootStackParamList, InventoryItem } from '../types';
import { useBackgroundPreload } from '../hooks/useBackgroundPreload';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// Level Badges Configuration (1-25)
const LEVEL_BADGES: Record<number, { emoji: string; name: string; title: string }> = {
    1: { emoji: '🔰', name: 'Newborn', title: 'Level 1' },
    2: { emoji: '⚡', name: 'Spark', title: 'Level 2' },
    3: { emoji: '🔥', name: 'Flame', title: 'Level 3' },
    4: { emoji: '❄️', name: 'Frost', title: 'Level 4' },
    5: { emoji: '🌪️', name: 'Tempest', title: 'Level 5' },
    6: { emoji: '⚔️', name: 'Warrior', title: 'Level 6' },
    7: { emoji: '🗡️', name: 'Swordmaster', title: 'Level 7' },
    8: { emoji: '🛡️', name: 'Guardian', title: 'Level 8' },
    9: { emoji: '👑', name: 'Royal', title: 'Level 9' },
    10: { emoji: '💎', name: 'Precious', title: 'Level 10' },
    11: { emoji: '🌟', name: 'Star', title: 'Level 11' },
    12: { emoji: '✨', name: 'Radiant', title: 'Level 12' },
    13: { emoji: '🌠', name: 'Celestial', title: 'Level 13' },
    14: { emoji: '🔮', name: 'Mystic', title: 'Level 14' },
    15: { emoji: '⚡🔥', name: 'Maelstrom', title: 'Level 15' },
    16: { emoji: '🗿', name: 'Ancient', title: 'Level 16' },
    17: { emoji: '🦅', name: 'Eagle', title: 'Level 17' },
    18: { emoji: '🐲', name: 'Dragon', title: 'Level 18' },
    19: { emoji: '👹', name: 'Demon', title: 'Level 19' },
    20: { emoji: '🌙', name: 'Lunar', title: 'Level 20' },
    21: { emoji: '☀️', name: 'Solar', title: 'Level 21' },
    22: { emoji: '⭐', name: 'Legend', title: 'Level 22' },
    23: { emoji: '🔱', name: 'Titan', title: 'Level 23' },
    24: { emoji: '👻', name: 'Specter', title: 'Level 24' },
    25: { emoji: '🐐', name: 'Cursed One', title: 'Level 25' },
};

// Available avatars from assets/avatars
const AVAILABLE_AVATARS = [
    { id: 1, name: 'Avatar 1', path: require('../../assets/avatars/ -2.jpg') },
    { id: 2, name: 'Avatar 2', path: require('../../assets/avatars/ -3.jpg') },
    { id: 3, name: 'Avatar 3', path: require('../../assets/avatars/ .jpg') },
    { id: 4, name: 'Spy X Family', path: require('../../assets/avatars/HD-wallpaper-anime-spy-x-family-yor-forger.jpg') },
    { id: 5, name: 'Violet Evergarden', path: require('../../assets/avatars/wallpapersden.com_violet-evergarden-8k-new-2022_wxl.jpg') },
];

const RARITY_COLOR: Record<string, string> = {
    legendary: '#FFD700',
    rare: '#9B59B6',
    common: '#4CAF50',
};

export default function ProfileScreen({ navigation }: Props) {
    const { user, updateUser, logout } = useContext(AuthContext);

    const [newUsername, setNewUsername] = useState(user?.username ?? '');
    const [editingUsername, setEditingUsername] = useState(false);
    const [savingUsername, setSavingUsername] = useState(false);
    
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectingAvatar, setSelectingAvatar] = useState(false);

    // Preload background for instant rendering
    const backgroundSource = require('../../assets/sukuna-dark.png');
    useBackgroundPreload(backgroundSource);

    // ─── Save new username ────────────────────────────────────
    const handleSaveUsername = async () => {
        if (!newUsername.trim() || newUsername.trim() === user?.username) {
            setEditingUsername(false);
            return;
        }

        setSavingUsername(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/update-username`, {
                method: 'PUT',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ user_id: user?.id, new_username: newUsername.trim() }),
            });

            const data = await res.json();

            if (data.success) {
                await updateUser(data.user);
                setEditingUsername(false);
                Alert.alert('✅ Done', 'Username updated successfully!');
            } else {
                Alert.alert('Failed', data.error ?? 'Could not update username.');
            }
        } catch (e) {
            Alert.alert('Error', 'Could not connect to the server.');
        } finally {
            setSavingUsername(false);
        }
    };

    // ─── Update Avatar ────────────────────────────────────────
    const handleAvatarSelect = async (avatarId: number) => {
        setSelectingAvatar(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/update-avatar`, {
                method: 'PUT',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ user_id: user?.id, avatar: avatarId }),
            });

            const data = await res.json();

            if (data.success) {
                await updateUser(data.user);
                setShowAvatarModal(false);
                Alert.alert('✅ Done', 'Avatar updated successfully!');
            } else {
                Alert.alert('Failed', data.error ?? 'Could not update avatar.');
            }
        } catch (e) {
            Alert.alert('Error', 'Could not connect to the server.');
        } finally {
            setSelectingAvatar(false);
        }
    };

    if (!user) return null;

    // Calculate XP progress within current level
    const xpThresholdPreviousLevel = (user.level - 1) * 150;
    const xpThresholdCurrentLevel = user.level * 150;
    const xpProgress = user.total_xp - xpThresholdPreviousLevel;
    const xpNeeded = xpThresholdCurrentLevel - xpThresholdPreviousLevel;
    const progressPct = Math.min((xpProgress / xpNeeded) * 100, 100);

    return (
        <ImageBackground
            source={backgroundSource}
            style={styles.background}
            resizeMode="cover"
            blurRadius={1}
        >
            <View style={styles.overlay} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>Hunter Profile</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* ── Avatar with Modal ── */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity 
                        style={styles.avatar}
                        onPress={() => setShowAvatarModal(true)}
                    >
                        {user?.avatar && AVAILABLE_AVATARS.find(a => a.id === user.avatar) ? (
                            <Image 
                                source={AVAILABLE_AVATARS.find(a => a.id === user.avatar)!.path}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarEmoji}>⚔️</Text>
                        )}
                    </TouchableOpacity>
                    <View style={styles.levelBadgeContainer}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeEmoji}>{LEVEL_BADGES[user?.level || 1]?.emoji || '🔰'}</Text>
                        </View>
                        <View style={styles.levelBadgeTextBox}>
                            <Text style={styles.levelBadgeText}>Lvl {user?.level}</Text>
                            <Text style={styles.levelBadgeName}>{LEVEL_BADGES[user?.level || 1]?.name}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Avatar Selection Modal ── */}
                <Modal
                    visible={showAvatarModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAvatarModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Choose Avatar</Text>
                                <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                                    <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.avatarGrid} showsVerticalScrollIndicator={false}>
                                {AVAILABLE_AVATARS.map((avatar) => (
                                    <TouchableOpacity
                                        key={avatar.id}
                                        style={[
                                            styles.avatarOption,
                                            user?.avatar === avatar.id && styles.avatarOptionSelected,
                                        ]}
                                        onPress={() => handleAvatarSelect(avatar.id)}
                                        disabled={selectingAvatar}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.avatarImageContainer}>
                                            <Image 
                                                source={avatar.path}
                                                style={styles.avatarOptionImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <Text style={styles.avatarOptionName}>{avatar.name}</Text>
                                        {user?.avatar === avatar.id && (
                                            <View style={styles.avatarCheckmark}>
                                                <Text style={styles.checkmark}>✓</Text>
                                            </View>
                                        )}
                                        {selectingAvatar && user?.avatar === avatar.id && (
                                            <ActivityIndicator size="large" color="#F87171" style={styles.avatarLoading} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* ── Username ── */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>CURSED ID</Text>
                    {editingUsername ? (
                        <View style={styles.editRow}>
                            <TextInput
                                style={styles.editInput}
                                value={newUsername}
                                onChangeText={setNewUsername}
                                autoFocus
                                autoCapitalize="none"
                                maxLength={30}
                                placeholderTextColor="#6B7280"
                            />
                            <TouchableOpacity
                                onPress={handleSaveUsername}
                                style={styles.saveBtn}
                                disabled={savingUsername}
                            >
                                {savingUsername
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.saveBtnText}>Save</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setEditingUsername(false); setNewUsername(user.username); }}
                                style={styles.cancelBtn}
                            >
                                <Text style={styles.cancelBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.usernameRow}>
                            <Text style={styles.usernameText}>{user.username}</Text>
                            <TouchableOpacity onPress={() => setEditingUsername(true)} style={styles.editBtn}>
                                <Text style={styles.editBtnText}>✏️ Edit</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── XP / Stats ── */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>POWER LEVEL</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{user.level}</Text>
                            <Text style={styles.statKey}>Level</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{user.total_xp}</Text>
                            <Text style={styles.statKey}>Total XP</Text>
                        </View>
                    </View>
                    {/* XP Bar */}
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${progressPct}%` }]} />
                    </View>
                    <Text style={styles.xpLabel}>
                        {xpProgress} / {xpNeeded} XP to Level {user.level + 1}
                    </Text>
                </View>

                {/* ── Logout ── */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Domain Denial</Text>
                </TouchableOpacity>

            </ScrollView>
            </KeyboardAvoidingView>
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 40,
    },
    safe: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        marginBottom: 24,
    },
    backBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    backText: {
        color: '#F87171',
        fontSize: 15,
        fontWeight: '600',
    },
    screenTitle: {
        color: '#F9FAFB',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
        textShadowColor: 'rgba(248, 113, 113, 0.7)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(12, 12, 18, 0.6)",
        borderWidth: 2,
        borderColor: "rgba(248, 113, 113, 0.6)",
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "rgba(248, 113, 113, 0.6)",
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarEmoji: {
        fontSize: 40,
    },
    levelBadgeContainer: {
        marginTop: -12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    levelBadge: {
        backgroundColor: 'rgba(12, 12, 18, 0.7)',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.6)',
        shadowColor: 'rgba(248, 113, 113, 0.6)',
        shadowOpacity: 0.6,
        shadowRadius: 6,
    },
    levelBadgeEmoji: {
        fontSize: 24,
    },
    levelBadgeTextBox: {
        backgroundColor: 'rgba(12, 12, 18, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.6)',
    },
    levelBadgeText: {
        color: '#F87171',
        fontWeight: '800',
        fontSize: 12,
    },
    levelBadgeName: {
        color: '#FCA5A5',
        fontWeight: '600',
        fontSize: 10,
        marginTop: 2,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'rgba(12, 12, 18, 0.95)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.6)',
        width: '100%',
        maxHeight: '80%',
        shadowColor: 'rgba(248, 113, 113, 0.4)',
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(248, 113, 113, 0.2)',
    },
    modalTitle: {
        color: '#F9FAFB',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    modalClose: {
        color: '#FCA5A5',
        fontSize: 24,
        fontWeight: 'bold',
    },
    avatarGrid: {
        padding: 16,
    },
    avatarOption: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(248, 113, 113, 0.3)',
        backgroundColor: 'rgba(248, 113, 113, 0.05)',
        paddingBottom: 12,
    },
    avatarOptionSelected: {
        borderColor: 'rgba(248, 113, 113, 0.8)',
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
    },
    avatarImageContainer: {
        width: '100%',
        height: 160,
        overflow: 'hidden',
    },
    avatarOptionImage: {
        width: '100%',
        height: '100%',
    },
    avatarOptionName: {
        color: '#F9FAFB',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        paddingHorizontal: 12,
        marginTop: 8,
    },
    avatarCheckmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F87171',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F87171',
        shadowOpacity: 0.9,
        shadowRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    checkmark: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    avatarLoading: {
        position: 'absolute',
        alignSelf: 'center',
        top: '40%',
    },
    card: {
        backgroundColor: 'rgba(12, 12, 18, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(248, 113, 113, 0.6)",
        shadowColor: "rgba(248, 113, 113, 0.4)",
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    cardLabel: {
        color: '#FCA5A5',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 10,
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    usernameText: {
        color: '#F9FAFB',
        fontSize: 20,
        fontWeight: '700',
    },
    editBtn: {
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.4)',
    },
    editBtnText: {
        color: '#FCA5A5',
        fontSize: 13,
        fontWeight: '600',
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editInput: {
        flex: 1,
        backgroundColor: 'rgba(9, 9, 15, 0.45)',
        color: '#F9FAFB',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.85)',
    },
    saveBtn: {
        backgroundColor: 'rgba(12, 12, 18, 0.8)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        minWidth: 56,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.6)',
    },
    saveBtnText: {
        color: '#FCA5A5',
        fontWeight: '700',
        fontSize: 14,
    },
    cancelBtn: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    cancelBtnText: {
        color: '#6B7280',
        fontSize: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 14,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: '900',
    },
    statKey: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
    },
    xpBarBg: {
        height: 8,
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(248, 113, 113, 0.3)',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: '#F87171',
        borderRadius: 4,
    },
    xpLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 6,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 12,
    },
    inventoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(248, 113, 113, 0.1)',
        gap: 10,
    },
    inventoryEmoji: {
        fontSize: 20,
    },
    inventoryName: {
        flex: 1,
        color: '#F9FAFB',
        fontSize: 15,
        fontWeight: '600',
    },
    inventoryDate: {
        color: '#6B7280',
        fontSize: 12,
    },
    logoutBtn: {
        marginTop: 10,
        backgroundColor: "rgba(12, 12, 18, 0.6)",
        borderWidth: 1,
        borderColor: "rgba(248, 113, 113, 0.6)",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "rgba(248, 113, 113, 0.4)",
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    logoutText: {
        color: '#F87171',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
