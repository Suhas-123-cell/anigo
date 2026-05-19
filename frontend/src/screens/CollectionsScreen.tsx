import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ImageBackground,
    Image,
    ImageSourcePropType,
    Modal,
    Dimensions,
    FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL, { DEFAULT_HEADERS } from '../constants/api';
import { RootStackParamList, InventoryItem } from '../types';
import { useBackgroundPreload } from '../hooks/useBackgroundPreload';

type Props = NativeStackScreenProps<RootStackParamList, 'Collections'>;

const RARITY_COLOR: Record<string, string> = {
    legendary: '#FFD700',
    rare: '#9B59B6',
    common: '#4CAF50',
    black: '#1a1a1a',
};

const RARITY_EMOJI: Record<string, string> = {
    legendary: '⭐',
    rare: '💜',
    common: '🌱',
    black: '🖤',
};

// XP values per rarity (updated: common=5, rare=10, legendary=25, black=100)
const XP_PER_RARITY: Record<string, number> = {
    common: 5,
    rare: 10,
    legendary: 25,
    black: 100,
};

// Character image mapping - maps character names to their asset images (imports from badges.ts for consistency)
const AVAILABLE_AVATARS: Record<string, ImageSourcePropType> = {
    // Common Characters
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

export default function CollectionsScreen({ navigation }: Props) {
    const { user } = useContext(AuthContext);
    const [collection, setCollection] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<InventoryItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Preload background for instant rendering
    const backgroundSource = require('../../assets/sukuna-dark.png');
    useBackgroundPreload(backgroundSource);

    // Preload character images with batching for large inventories
    useEffect(() => {
        const preloadBatch = async () => {
            const imageSources = Object.values(AVAILABLE_AVATARS).filter(Boolean);
            
            // Process in batches of 5 to avoid overwhelming the system
            for (let i = 0; i < imageSources.length; i += 5) {
                const batch = imageSources.slice(i, i + 5);
                await Promise.all(
                    batch.map(source =>
                        Image.prefetch(typeof source === 'string' ? source : '').catch(() => {})
                    )
                );
            }
        };
        
        preloadBatch();
    }, []);

    const fetchCollection = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/game/inventory/${user.id}`, {
                headers: DEFAULT_HEADERS,
            });
            const text = await res.text();

            if (text.startsWith('<')) {
                return;
            }

            const data = JSON.parse(text);
            const inventoryItems = data.inventory || [];
            
            // Preload all character images for faster rendering
            inventoryItems.forEach((item: InventoryItem) => {
                const avatarSource = AVAILABLE_AVATARS[item.character_name];
                if (avatarSource) {
                    // Properly prefetch the image without JSON.stringify
                    Image.prefetch(
                        typeof avatarSource === 'string' ? avatarSource : ''
                    ).catch(() => {
                        // Silently fail - fallback emoji will show
                    });
                }
            });
            
            setCollection(inventoryItems);
        } catch (err) {
            // Handle error silently
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCollection();
    }, [user, fetchCollection]);

    const handleCharacterPress = (item: InventoryItem) => {
        setSelectedCharacter(item);
        setModalVisible(true);
    };

    return (
        <ImageBackground
            source={backgroundSource}
            style={styles.background}
            resizeMode="cover"
            blurRadius={1}
            progressiveRenderingEnabled={true}
        >
            <View style={styles.overlay} />
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('Map')} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.screenTitle}>My Collection</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#F87171" />
                    </View>
                ) : collection.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🎴</Text>
                        <Text style={styles.emptyTitle}>No Characters Yet</Text>
                        <Text style={styles.emptyText}>Explore the map and catch characters to build your collection!</Text>
                    </View>
                ) : (
                    <>
                        {/* Stats Bar */}
                        <View style={styles.statsBar}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Total Caught</Text>
                                <Text style={styles.statValue}>{collection.length}</Text>
                            </View>
                        </View>

                        {/* Grid Layout with FlatList for virtualization */}
                        <FlatList
                            data={collection}
                            numColumns={3}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            scrollEnabled={true}
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={6}
                            updateCellsBatchingPeriod={75}
                            initialNumToRender={6}
                            windowSize={10}
                            contentContainerStyle={styles.flatListContent}
                            renderItem={({ item }) => {
                                const avatarSource = AVAILABLE_AVATARS[item.character_name];
                                return (
                                    <TouchableOpacity
                                        style={styles.gridItem}
                                        onPress={() => handleCharacterPress(item)}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[
                                                styles.gridImage,
                                                {
                                                    borderColor: RARITY_COLOR[item.rarity || 'common'],
                                                },
                                            ]}
                                        >
                                            {avatarSource ? (
                                                <Image
                                                    source={avatarSource}
                                                    style={styles.gridCharacterImage}
                                                    progressiveRenderingEnabled={true}
                                                />
                                            ) : (
                                                <Text style={styles.gridPlaceholderEmoji}>🎴</Text>
                                            )}
                                            </View>
                                            <Text style={styles.gridCharacterName} numberOfLines={2}>
                                                {item.character_name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                            }}
                        />

                        {/* Detail Modal */}
                        <Modal
                            visible={modalVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    {selectedCharacter && (
                                        <>
                                            {/* Close Button */}
                                            <TouchableOpacity
                                                style={styles.modalCloseButton}
                                                onPress={() => setModalVisible(false)}
                                            >
                                                <Text style={styles.modalCloseIcon}>✕</Text>
                                            </TouchableOpacity>

                                            {/* Character Image - Large View */}
                                            <View
                                                style={[
                                                    styles.modalImage,
                                                    {
                                                        borderColor: RARITY_COLOR[selectedCharacter.rarity || 'common'],
                                                    },
                                                ]}
                                            >
                                                {AVAILABLE_AVATARS[selectedCharacter.character_name] ? (
                                                    <Image
                                                        source={AVAILABLE_AVATARS[selectedCharacter.character_name]}
                                                        style={styles.modalCharacterImage}
                                                        progressiveRenderingEnabled={true}
                                                    />
                                                ) : (
                                                    <Text style={styles.modalPlaceholderEmoji}>🎴</Text>
                                                )}
                                            </View>

                                            {/* Character Info */}
                                            <Text style={styles.modalCharacterName}>
                                                {selectedCharacter.character_name}
                                            </Text>

                                            {/* Rarity */}
                                            <View style={styles.modalRarityBox}>
                                                <Text
                                                    style={[
                                                        styles.modalRarityBadge,
                                                        {
                                                            color: RARITY_COLOR[selectedCharacter.rarity || 'common'],
                                                        },
                                                    ]}
                                                >
                                                    {selectedCharacter.rarity ? selectedCharacter.rarity.charAt(0).toUpperCase() + selectedCharacter.rarity.slice(1) : 'Common'}
                                                </Text>
                                            </View>

                                            {/* Date Caught */}
                                            <View style={styles.modalInfoRow}>
                                                <Text style={styles.modalInfoLabel}>📅 Date Caught</Text>
                                                <Text style={styles.modalInfoValue}>
                                                    {new Date(selectedCharacter.caught_at).toLocaleDateString()}
                                                </Text>
                                            </View>

                                            {/* XP Earned */}
                                            <View style={styles.modalInfoRow}>
                                                <Text style={styles.modalInfoLabel}>⚡ XP Earned</Text>
                                                <Text style={styles.modalInfoValue}>
                                                    +{XP_PER_RARITY[selectedCharacter.rarity || 'common'] || 5} XP
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        </Modal>
                    </>
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(248, 113, 113, 0.3)',
        marginBottom: 16,
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    backText: {
        color: '#F87171',
        fontSize: 16,
        fontWeight: '700',
    },
    screenTitle: {
        color: '#F9FAFB',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyEmoji: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#F9FAFB',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    flatListContent: {
        paddingHorizontal: 8,
        paddingBottom: 24,
    },
    statsBar: {
        flexDirection: 'row',
        marginBottom: 20,
        marginHorizontal: 16,
        backgroundColor: 'rgba(12, 12, 18, 0.6)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.4)',
        padding: 16,
        justifyContent: 'center',
        shadowColor: 'rgba(248, 113, 113, 0.2)',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        color: '#F87171',
        fontSize: 28,
        fontWeight: '800',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    gridItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridImage: {
        width: 140,
        height: 140,
        borderRadius: 12,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(12, 12, 18, 0.8)',
        overflow: 'hidden',
        marginBottom: 10,
    },
    gridCharacterImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gridPlaceholderEmoji: {
        fontSize: 50,
    },
    gridCharacterName: {
        color: '#F9FAFB',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 18,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: 'rgba(12, 12, 18, 0.95)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(248, 113, 113, 0.6)',
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxHeight: '90%',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(248, 113, 113, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalCloseIcon: {
        fontSize: 24,
        color: '#F87171',
        fontWeight: 'bold',
    },
    modalImage: {
        width: 220,
        height: 220,
        borderRadius: 16,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(12, 12, 18, 0.8)',
        overflow: 'hidden',
        marginBottom: 24,
        marginTop: 16,
    },
    modalCharacterImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    modalPlaceholderEmoji: {
        fontSize: 80,
    },
    modalCharacterName: {
        color: '#F9FAFB',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalRarityBox: {
        marginBottom: 24,
    },
    modalRarityBadge: {
        fontSize: 16,
        fontWeight: '800',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        borderRadius: 10,
        overflow: 'hidden',
    },
    modalInfoRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 113, 113, 0.08)',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.3)',
    },
    modalInfoLabel: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalInfoValue: {
        color: '#F87171',
        fontSize: 16,
        fontWeight: '800',
    },
    cardsContainer: {
        gap: 12,
    },
    cardWrapper: {
        marginBottom: 4,
    },
    card: {
        backgroundColor: 'rgba(12, 12, 18, 0.6)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.4)',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        shadowColor: 'rgba(248, 113, 113, 0.2)',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    cardRarityBadge: {
        width: 70,
        height: 70,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(12, 12, 18, 0.8)',
        overflow: 'hidden',
    },
    characterImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    placeholderEmoji: {
        fontSize: 40,
    },
    rarityEmoji: {
        fontSize: 32,
    },
    cardDetails: {
        flex: 1,
    },
    cardCharacter: {
        color: '#F9FAFB',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    cardRarity: {
        color: '#FCA5A5',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    cardDate: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '500',
    },
    cardXPBox: {
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.4)',
    },
    cardXPValue: {
        color: '#F87171',
        fontSize: 16,
        fontWeight: '800',
    },
    cardXPLabel: {
        color: '#FCA5A5',
        fontSize: 10,
        fontWeight: '700',
    },
});
