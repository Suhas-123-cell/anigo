// @ts-nocheck
import React, { useState, useRef, useCallback, useContext } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Animated,
    Modal,
    Dimensions,
    SafeAreaView,
    Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import API_BASE_URL, { DEFAULT_HEADERS } from "../constants/api";
import { RootStackParamList } from "../types";
import { AuthContext } from "../context/AuthContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Character image data - maps character names to avatar images (matches badges.ts)
const CHARACTER_IMAGES: Record<string, any> = {
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

// ─────────────────────────────────────────────────────────────
// AR Encounter Screen
// ─────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<RootStackParamList, "AREncounter">;

export default function AREncounterScreen({ route, navigation }: Props) {
    const { spawn } = route.params;
    const { user } = useContext(AuthContext);

    const [catching, setCatching] = useState(false);
    const [tossed, setTossed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [catchResult, setCatchResult] = useState<{
        xp_gained: number;
        total_xp: number;
        level: number;
    } | null>(null);

    // ─── Camera Permissions ───────────────────────────────────
    const [permission, requestPermission] = useCameraPermissions();

    // Flash animation
    const flashOpacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    // ─── Network Request ──────────────────────────────────────
    const triggerBackendCatch = async () => {
        if (!user) return;

        // 1. Flash animation when hit
        Animated.sequence([
            Animated.timing(flashOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(flashOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            const res = await fetch(`${API_BASE_URL}/game/catch`, {
                method: "POST",
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({
                    user_id: user.id,
                    spawn_id: spawn.id,
                    character_name: spawn.character,
                    lat: spawn.lat,
                    lng: spawn.lng,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setCatchResult({
                    xp_gained: data.xp_gained,
                    total_xp: data.total_xp,
                    level: data.level,
                });
                setTimeout(() => setShowModal(true), 600);
            } else {
                setCatching(false);
                setTossed(false);
            }
        } catch (err) {
            console.error("Catch failed:", err);
            setCatching(false);
            setTossed(false);
        }
    };


    // ─── Throw Handler ────────────────────────────────────────
    const handleThrow = useCallback(() => {
        if (catching || tossed) return;
        setCatching(true);
        setTossed(true);
        triggerBackendCatch();
    }, [catching, tossed]);

    // ─── Dismiss Modal & Go Back ──────────────────────────────
    const handleDismiss = useCallback(() => {
        setShowModal(false);
        navigation.goBack();
    }, [navigation]);

    // Generate random color for character based on name string for MVP
    const charColor = `#${Math.floor(Math.abs(spawn.character.charCodeAt(0) * 1234567) % 16777215).toString(16).padStart(6, '0')}`;

    // ─── Permission Guard ──────────────────────────────────────
    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.modalBtn} onPress={requestPermission}>
                    <Text style={styles.modalBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Get character image or use default
    const characterImage = CHARACTER_IMAGES[spawn.character] || require('../../assets/naruto.jpg');

    return (
        <View style={styles.container}>
            {/* Live Camera Feed */}
            <CameraView style={styles.camera} facing="back" />

            {/* Character Image Overlay */}
            {!showModal && (
                <View style={styles.characterOverlay}>
                    <Image 
                        source={characterImage}
                        style={styles.characterImage}
                        resizeMode="contain"
                    />
                </View>
            )}

            {/* Throw Button Area Overlay */}
            <View style={styles.throwAreaOverlay} pointerEvents="box-only">
                <TouchableOpacity 
                    style={styles.throwZone}
                    onPress={handleThrow}
                    activeOpacity={0.6}
                >
                    <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />
                </TouchableOpacity>
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* HUD */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>✕</Text>
                    </TouchableOpacity>

                    <View style={styles.nameBadge}>
                        <Text style={styles.nameText}>{spawn.character}</Text>
                        <Text style={styles.locationText}>📍 {spawn.name}</Text>
                    </View>
                    <View style={{ width: 40 }} /> {/* Spacer */}
                </View>

                {/* Throw Button */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.catchBtn, catching && styles.catchBtnDisabled]}
                        onPress={handleThrow}
                        disabled={catching}
                        activeOpacity={0.7}
                    >
                        <View style={styles.catchInner}>
                            <View style={styles.catchInnerRing} />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Flash Overlay */}
            <Animated.View
                style={[styles.flashOverlay, { opacity: flashOpacity }]}
                pointerEvents="none"
            />

            {/* Success Modal */}
            <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleDismiss}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalEmoji}>🎉</Text>
                        <Text style={styles.modalTitle}>Gotcha!</Text>
                        <Text style={styles.modalCharacter}>{spawn.character} was caught!</Text>

                        {catchResult && (
                            <View style={styles.modalStats}>
                                <Text style={styles.modalXP}>+{catchResult.xp_gained} XP</Text>
                                <Text style={styles.modalLevel}>
                                    Level {catchResult.level} • {catchResult.total_xp} total XP
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.modalBtn} onPress={handleDismiss}>
                            <Text style={styles.modalBtnText}>Back to Map</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    characterOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    characterImage: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_HEIGHT * 0.6,
    },
    throwAreaOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    throwZone: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flash: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        zIndex: 2,
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        zIndex: 3,
    },
    safeArea: {
        flex: 1,
        zIndex: 2,
        justifyContent: "space-between",
        pointerEvents: 'box-none',
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 10,
    },
    backText: {
        color: "#FF3B30",
        fontSize: 28,
        fontWeight: "900",
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    nameBadge: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 16,
        elevation: 12,
    },
    nameText: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 2,
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    locationText: {
        color: "#FF3B30",
        fontSize: 14,
        marginTop: 6,
        fontWeight: "900",
        letterSpacing: 1,
    },
    bottomBar: {
        alignItems: "center",
        paddingBottom: 40,
    },
    catchBtn: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 6,
        borderColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        elevation: 16,
    },
    catchBtnDisabled: {
        opacity: 0.5,
    },
    catchInner: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    catchInnerRing: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#FF3B30",
        borderWidth: 8,
        borderColor: "#FFF",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 16,
        elevation: 14,
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#fff",
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.98)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalCard: {
        backgroundColor: "#000",
        borderRadius: 20,
        padding: 40,
        alignItems: "center",
        width: SCREEN_WIDTH * 0.85,
        borderWidth: 4,
        borderColor: "#7c3aed",
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 28,
        elevation: 22,
    },
    modalEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    modalTitle: {
        color: "#FFF",
        fontSize: 44,
        fontWeight: "900",
        fontStyle: "italic",
        letterSpacing: 2,
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    modalCharacter: {
        color: "#FF3B30",
        fontSize: 28,
        marginTop: 14,
        fontWeight: "900",
        letterSpacing: 1.5,
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    modalStats: {
        marginTop: 24,
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 20,
        borderRadius: 14,
        width: "100%",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 8,
    },
    modalXP: {
        color: "#FFF",
        fontSize: 40,
        fontWeight: "900",
        letterSpacing: 2.5,
        marginBottom: 12,
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    modalLevel: {
        color: "#FF3B30",
        fontSize: 32,
        fontWeight: "900",
        marginTop: 0,
        letterSpacing: 1.5,
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    modalBtn: {
        marginTop: 32,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 16,
        width: "100%",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 14,
        elevation: 12,
    },
    modalBtnText: {
        color: "#FF3B30",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 1.5,
        textShadowColor: "#FF3B30",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    permissionText: {
        color: "#fff",
        fontSize: 20,
        textAlign: "center",
        marginBottom: 30,
    },
});
