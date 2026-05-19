import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
import {
  StyleSheet,
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  Image,
  Platform,
  ImageSourcePropType,
  Animated,
  Easing,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, darkMapStyle } from "../components/MapView";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import API_BASE_URL, { DEFAULT_HEADERS } from "../constants/api";
import { getDistanceMeters, CATCH_RADIUS_METERS } from "../utils/distance";
import { getDistanceFromLatLonInMeters } from "../utils/geoDistance";
import { Spawn, RootStackParamList } from "../types";
import { AuthContext } from "../context/AuthContext";
import { RotatingCharacterBadge } from "../components/RotatingCharacterBadge";
import { playSpawnNotification } from "../utils/hapticAndSound";
import { getCharacterAvatar } from "../types/badges";
import { UserLocationModel } from "../components/UserLocationModel";
import { useDeviceHeading } from "../hooks/useHeading";
import { useBackgroundPreload } from "../hooks/useBackgroundPreload";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

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

// Using CHARACTER_AVATARS from badges.ts as the single source of truth for all character images

// Available avatars (unchanged)
const AVAILABLE_AVATARS = [
  { id: 1, name: 'Avatar 1', path: require('../../assets/avatars/ -2.jpg') },
  { id: 2, name: 'Avatar 2', path: require('../../assets/avatars/ -3.jpg') },
  { id: 3, name: 'Avatar 3', path: require('../../assets/avatars/ .jpg') },
  { id: 4, name: 'Spy X Family', path: require('../../assets/avatars/HD-wallpaper-anime-spy-x-family-yor-forger.jpg') },
  { id: 5, name: 'Violet Evergarden', path: require('../../assets/avatars/wallpapersden.com_violet-evergarden-8k-new-2022_wxl.jpg') },
  { id: 6, name: 'Goku', path: require('../../assets/avatars/Goku UI.jpg') },
];

// ─── SpawnMarker ──────────────────────────────────────────────────────────
// Android-safe marker component with tracksViewChanges toggle.
//
// tracksViewChanges behavior:
// - Set to true initially to ensure bitmap snapshot captures the badge layout
// - Toggled to false via onImageLoadComplete callback (Image onLoad)
// - Falls back to false after 1500ms if image doesn't load (timeout)
// - This allows Android's hit-box detection to work after layout is finalized
//
// CRITICAL: onPress MUST be on <Marker>, NOT on custom children,
// because Android ignores touch events on custom marker views.
interface SpawnMarkerProps {
  spawn: Spawn;
  coordinate: { latitude: number; longitude: number };
  distance: number;
  characterImage: ImageSourcePropType | undefined;
  index: number;
  onPress: (spawn: Spawn) => void;
}

// ─── Rarity color helper ─────────────────────────────────────────────────────
function getRarityBorderColor(rarity: string | undefined): string {
  switch (rarity) {
    case 'legendary': return '#FFD700';
    case 'rare': return '#9B59B6';
    case 'black': return '#AAAAAA';
    default: return '#FF6B6B';
  }
}

function SpawnMarker({ spawn, coordinate, distance, characterImage, index, onPress }: SpawnMarkerProps) {
  const isAndroid = Platform.OS === 'android';
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Rotation animation for both platforms
  useEffect(() => {
    spinAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    loop.start();
  }, []);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const handleImageLoadComplete = useCallback(() => {
    setTimeout(() => {
      setTracksViewChanges(false);
    }, isAndroid ? 800 : 300);
  }, [isAndroid]);

  // Fallback: set to false after timeout if image doesn't load
  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, isAndroid ? 2000 : 800);

    return () => clearTimeout(timer);
  }, [isAndroid]);

  const borderColor = getRarityBorderColor(spawn.rarity);
  const fallbackLetter = spawn.character
    ? spawn.character.trim().charAt(0).toUpperCase()
    : '?';

  // ─── ANDROID: Simple flat badge that Android CAN bitmap-capture ───────────
  // Key differences from iOS:
  // - NO Animated components (breaks bitmap capture)
  // - NO absoluteFillObject (breaks bitmap capture)
  // - NO shadows/elevation on inner views (breaks bitmap capture)
  // - Minimal nesting, all views have explicit sizes
  // - collapsable={false} on ALL views
  if (isAndroid) {
    return (
      <Marker
        coordinate={coordinate}
        onPress={() => onPress(spawn)}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracksViewChanges}
        tappable={true}
        zIndex={100 + index}
      >
        <Animated.View
          collapsable={false}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: rotation }],
          }}
        >
          <View
            collapsable={false}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: borderColor,
              backgroundColor: '#121219',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {characterImage ? (
              <Image
                source={characterImage}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                }}
                resizeMode="cover"
                onLoad={handleImageLoadComplete}
                onError={handleImageLoadComplete}
              />
            ) : (
              <Text
                style={{
                  fontSize: 12,
                  color: borderColor,
                  fontWeight: '900',
                  textAlign: 'center',
                }}
              >
                {fallbackLetter}
              </Text>
            )}
          </View>
        </Animated.View>
      </Marker>
    );
  }

  // ─── iOS: Full animated badge with rotation ─────────────────────────────────
  React.useEffect(() => {
    if (characterImage) {
      console.log(`[SpawnMarker iOS] ${spawn.character} - image available`);
    }
  }, [characterImage, spawn.character]);

  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress(spawn)}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      tracksViewChanges={tracksViewChanges}
      stopPropagation={true}
      tappable={true}
      zIndex={100 + index}
    >
      <RotatingCharacterBadge
        characterName={spawn.character}
        avatarSource={characterImage}
        rarity={spawn.rarity as 'legendary' | 'rare' | 'common' | 'black'}
        size={76}
        onImageLoadComplete={handleImageLoadComplete}
      />
    </Marker>
  );
}

export default function MapScreen({ navigation }: Props) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [travelBearing, setTravelBearing] = useState<number>(0);
  const mapRef = useRef<MapView>(null);
  const previousSpawnIds = useRef<Set<string>>(new Set());
  const previousVisibleSpawnIds = useRef<Set<string>>(new Set());
  const previousLocationRef = useRef<Location.LocationObject | null>(null);
  // Store the last position used for bearing calculation (separate from general position updates)
  const bearingAnchorRef = useRef<{ lat: number; lng: number } | null>(null);
  const { user, logout } = useContext(AuthContext);
  
  // Track device heading for user location model rotation
  const { heading } = useDeviceHeading();
  
  // Preload background for instant rendering
  const backgroundSource = require('../../assets/sukuna-dark.png');
  useBackgroundPreload(backgroundSource);

  // ─── Helper: calculate bearing between two GPS coordinates ─────────
  const calcBearing = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }, []);

  // ─── Helper: haversine distance in meters ──────────────────────────
  const haversineDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // ─── Location Permission & Tracking ─────────
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to play AniGO.");
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(current);
      previousLocationRef.current = current;
      bearingAnchorRef.current = {
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      };
      setLoading(false);

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (loc) => {
          // ── Calculate travel bearing from position change ──
          // Only update bearing when user has moved ≥ 3m from the last
          // anchor point to filter out GPS jitter/noise
          if (bearingAnchorRef.current) {
            const dist = haversineDistance(
              bearingAnchorRef.current.lat,
              bearingAnchorRef.current.lng,
              loc.coords.latitude,
              loc.coords.longitude
            );
            if (dist >= 3) {
              const brng = calcBearing(
                bearingAnchorRef.current.lat,
                bearingAnchorRef.current.lng,
                loc.coords.latitude,
                loc.coords.longitude
              );
              setTravelBearing(brng);
              bearingAnchorRef.current = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
              };
            }
          } else {
            bearingAnchorRef.current = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            };
          }

          setLocation(loc);
          previousLocationRef.current = loc;
        }
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  // ─── Fetch Spawns ─────────────────────────────────────────
  const fetchSpawns = useCallback(async () => {
    try {
      const query = user?.id ? `?user_id=${user.id}` : '';
      const res = await fetch(`${API_BASE_URL}/spawns${query}`, { headers: DEFAULT_HEADERS });
      const text = await res.text();
      if (text.startsWith('<')) {
        console.error('API returned HTML:', text.substring(0, 200));
        return;
      }
      const data = JSON.parse(text);
      const spawnsList = data.spawns || [];
      
      // Preload character images for faster rendering on both platforms
      if (spawnsList.length > 0) {
        spawnsList.forEach((spawn: Spawn) => {
          const characterImage = getCharacterAvatar(spawn.character);
          if (characterImage) {
            if (typeof characterImage === 'string') {
              // Only prefetch remote URLs, local require() images are cached automatically
              Image.prefetch(characterImage).catch(() => {
                // Silently fail - image will still render or show fallback
              });
            } else {
              // Local image loaded via require()
              console.log(`[MapScreen] Local image ready for: ${spawn.character}`, characterImage);
            }
          } else {
            console.warn(`[MapScreen] No image found for: ${spawn.character}`);
          }
        });
      }
      
      setSpawns(spawnsList);
    } catch (err) {
      console.error('Failed to fetch spawns:', (err as Error).message);
    }
  }, [user?.id]);

  // ─── Visibility detection ──────────────
  useEffect(() => {
    if (!location) return;
    const currentVisibleSpawns = spawns.filter(spawn => {
      // Exclude spawns caught by others
      if (spawn.caught_by && spawn.caught_by !== user?.id) return false;
      // Exclude spawns the user fled from
      if (spawn.user_fled) return false;
      const distance = getDistanceFromLatLonInMeters(
        location.coords.latitude,
        location.coords.longitude,
        spawn.lat,
        spawn.lng
      );
      return distance <= 15;
    });

    currentVisibleSpawns.forEach(spawn => {
      if (!previousVisibleSpawnIds.current.has(spawn.id)) {
        console.log(`New visible: ${spawn.character}`);
        playSpawnNotification(spawn.character);
        previousVisibleSpawnIds.current.add(spawn.id);
      }
    });

    previousVisibleSpawnIds.current = new Set(currentVisibleSpawns.map(s => s.id));
  }, [location, spawns, user?.id]);

  // ─── Periodic fetch & focus refetch ────────────────────
  useEffect(() => {
    fetchSpawns();
    const interval = setInterval(fetchSpawns, 30000);
    return () => clearInterval(interval);
  }, [fetchSpawns]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchSpawns);
    return unsubscribe;
  }, [navigation, fetchSpawns]);

  // ─── Marker press ───────────────────────────────────
  const handleMarkerPress = (spawn: Spawn) => {
    if (!location) {
      Alert.alert("Waiting", "Still acquiring your location…");
      return;
    }
    const distance = getDistanceMeters(
      location.coords.latitude,
      location.coords.longitude,
      spawn.lat,
      spawn.lng
    );
    if (distance <= CATCH_RADIUS_METERS) {
      navigation.navigate("Quiz", { spawn });
    } else {
      Alert.alert(
        "Too Far!",
        `You are ${Math.round(distance)}m away from ${spawn.character}.\n\nGet within 7.5m to catch!`
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Locating you…</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not get location. Enable GPS and try again.</Text>
      </View>
    );
  }

  // ─── Visible spawns filter ───────────────────────────────────────────
  const visibleSpawns = spawns.filter(spawn => {
    if (spawn.caught_by && spawn.caught_by !== user?.id) return false;
    if (spawn.user_fled) return false;
    const distance = getDistanceFromLatLonInMeters(
      location.coords.latitude,
      location.coords.longitude,
      spawn.lat,
      spawn.lng
    );
    return distance <= 15;
  });

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
      blurRadius={1}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          minZoomLevel={15}
          maxZoomLevel={20}
          zoomControlEnabled={true}
          scrollEnabled={true}
          zoomTapEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
          cacheEnabled={Platform.OS === 'android' ? false : false}
          loadingEnabled={true}
          loadingIndicatorColor="#F87171"
        >
          {/* User Location Model - Rotating Character */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: 0 }}
              zIndex={50}
            >
              <UserLocationModel
                heading={heading}
                bearing={travelBearing}
                latitude={location.coords.latitude}
                longitude={location.coords.longitude}
              />
            </Marker>
          )}

          {visibleSpawns.map((spawn, index) => {
            const distance = getDistanceFromLatLonInMeters(
              location.coords.latitude,
              location.coords.longitude,
              spawn.lat,
              spawn.lng
            );

            const characterImage = getCharacterAvatar(spawn.character);
            if (!characterImage) {
              console.warn(`[MapScreen] Missing avatar for: ${spawn.character}`);
            }

            const markerCoordinate = {
              latitude: Number(parseFloat(spawn.lat.toString())),
              longitude: Number(parseFloat(spawn.lng.toString())),
            };

            return (
              <SpawnMarker
                key={`${spawn.id}-${spawn.character}`}
                spawn={spawn}
                coordinate={markerCoordinate}
                distance={distance}
                characterImage={characterImage}
                index={index}
                onPress={handleMarkerPress}
              />
            );
          })}
        </MapView>

        <View style={styles.spawnCounter}>
          <Text style={styles.spawnCountText}>
            {visibleSpawns.length === 0 ? "None" : visibleSpawns.length}
          </Text>
        </View>

        {/* Locate Me – top right */}
        <TouchableOpacity
          style={styles.locateButton}
          onPress={() => {
            if (location && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.004,
                longitudeDelta: 0.004,
              }, 500);
            }
          }}
        >
          <Text style={styles.locateIcon}>📍</Text>
        </TouchableOpacity>

        {/* Bottom Right Menu */}
        {menuExpanded && (
          <>
            <TouchableOpacity
              style={styles.menuButtonExpanded}
              onPress={fetchSpawns}
            >
              <Text style={styles.menuButtonExpandedIcon}>🔄</Text>
              <Text style={styles.menuButtonExpandedLabel}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButtonExpanded2}
              onPress={() => {
                setMenuExpanded(false);
                navigation.navigate('Collections');
              }}
            >
              <Text style={styles.menuButtonExpandedIcon}>🎴</Text>
              <Text style={styles.menuButtonExpandedLabel}>Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButtonExpanded3}
              onPress={() => {
                setMenuExpanded(false);
                navigation.navigate('Leaderboard');
              }}
            >
              <Text style={styles.menuButtonExpandedIcon}>🏆</Text>
              <Text style={styles.menuButtonExpandedLabel}>Leaderboard</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.howToPlayButton}
          onPress={() => {
            Alert.alert(
              'How to Play AniGO',
              '🗺️ TAP BADGES\nTap rotating badges on the map to encounter characters\n\n📍 GET CLOSE\nMove within 7.5m of a character to catch it\n\n🎯 COMPLETE QUIZ\nAnswer quiz questions to collect the character\n\n⭐ EARN XP\nLegendary & Black rarity give more XP\n\n🏆 COMPETE\nClimb the leaderboard to become champion',
              [{ text: 'Got it!', style: 'default' }],
              { cancelable: true }
            );
          }}
        >
          <Text style={styles.howToPlayIcon}>❓</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuToggleButton}
          onPress={() => setMenuExpanded(!menuExpanded)}
        >
          <Text style={styles.menuToggleIcon}>{menuExpanded ? '✕' : '⊕'}</Text>
        </TouchableOpacity>

        {/* Profile widget */}
        <TouchableOpacity
          style={styles.profileBottomWidget}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.avatarWidgetSmall}>
            {user?.avatar && AVAILABLE_AVATARS.find(a => a.id === user.avatar) ? (
              <Image
                source={AVAILABLE_AVATARS.find(a => a.id === user.avatar)!.path}
                style={styles.avatarWidgetImage}
              />
            ) : (
              <Text style={styles.avatarWidgetEmoji}>⚔️</Text>
            )}
          </View>
          <View style={styles.profileWidgetInfo}>
            <Text style={styles.profileWidgetUsername}>{user?.username}</Text>
            <View style={styles.levelWidgetBadge}>
              <Text style={styles.levelWidgetEmoji}>{LEVEL_BADGES[user?.level || 1]?.emoji || '🔰'}</Text>
              <View>
                <Text style={styles.levelWidgetText}>Lvl {user?.level}</Text>
                <Text style={styles.levelWidgetName}>{LEVEL_BADGES[user?.level || 1]?.name}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// ─── Styles (unchanged from your original) ────────────────────────────────
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  container: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  loadingText: { color: "#fff", marginTop: 12, fontSize: 16 },
  errorText: { color: "#F87171", fontSize: 16, textAlign: "center", paddingHorizontal: 24 },
  spawnCounter: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 80,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: "rgba(12, 12, 18, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(248, 113, 113, 0.8)",
    shadowColor: "rgba(248, 113, 113, 0.4)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
  },
  locateButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 70 : 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(12, 12, 18, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(248, 113, 113, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 100,
  },
  locateIcon: { fontSize: 22 },
  spawnCountText: {
    color: "#F87171",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(248, 113, 113, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  howToPlayButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(12, 12, 18, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(248, 113, 113, 0.6)',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 25,
    zIndex: 103,
  },
  howToPlayIcon: { fontSize: 28 },
  menuToggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(248, 113, 113, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(248, 113, 113, 0.8)',
    shadowOpacity: 0.95,
    shadowRadius: 15,
    elevation: 30,
    zIndex: 105,
  },
  menuToggleIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  menuButtonExpanded: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(12, 12, 18, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    shadowColor: 'rgba(248, 113, 113, 0.6)',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 24,
    zIndex: 104,
  },
  menuButtonExpanded2: {
    position: 'absolute',
    bottom: 190,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(12, 12, 18, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    shadowColor: 'rgba(248, 113, 113, 0.6)',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 23,
    zIndex: 104,
  },
  menuButtonExpanded3: {
    position: 'absolute',
    bottom: 280,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(12, 12, 18, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    shadowColor: 'rgba(248, 113, 113, 0.6)',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 22,
    zIndex: 104,
  },
  menuButtonExpandedIcon: { fontSize: 28, marginBottom: 4 },
  menuButtonExpandedLabel: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileBottomWidget: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 101,
    maxWidth: '60%',
  },
  avatarWidgetSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(248, 113, 113, 0.8)",
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(248, 113, 113, 0.6)',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarWidgetImage: { width: '100%', height: '100%', borderRadius: Platform.OS === 'android' ? 36 : 30 },
  avatarWidgetEmoji: { fontSize: Platform.OS === 'android' ? 34 : 28 },
  profileWidgetInfo: {
    backgroundColor: 'rgba(12, 12, 18, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.6)',
    shadowColor: 'rgba(248, 113, 113, 0.4)',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  profileWidgetUsername: { color: '#F9FAFB', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  levelWidgetBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  levelWidgetEmoji: { fontSize: Platform.OS === 'android' ? 21 : 18 },
  levelWidgetText: { color: '#F87171', fontWeight: '700', fontSize: Platform.OS === 'android' ? 13 : 11 },
  levelWidgetName: { color: '#FCA5A5', fontWeight: '600', fontSize: Platform.OS === 'android' ? 11 : 9 },
});