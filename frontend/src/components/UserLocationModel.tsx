import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';

interface UserLocationModelProps {
  heading?: number; // Device compass heading (0-360, 0 = North)
  latitude: number;
  longitude: number;
  bearing?: number; // Calculated travel bearing from GPS position changes
}

/**
 * User Location Indicator – Red Arrow Navigator
 * Uses the red arrow PNG to show user position and direction they're facing.
 * - heading = compass heading (where device is pointing) — primary direction indicator
 * - bearing = GPS travel bearing (fallback if available)
 * - Arrow PNG points RIGHT; pre-rotated -90° to point UP (north = 0°)
 * - On Android: Only shows arrow (no container)
 * - On iOS: Shows arrow + pulsing ring + center dot
 */
export const UserLocationModel: React.FC<UserLocationModelProps> = ({
  heading = 0,
  latitude,
  longitude,
  bearing,
}) => {
  // Use heading as primary direction (where user is facing).
  // Bearing is only used on iOS for travel direction enhancement.
  const displayHeading = heading;

  // Pulsing glow animation
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Android: Show only arrow
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.arrowWrapper,
          { transform: [{ rotate: `${displayHeading}deg` }] },
        ]}
      >
        <Image
          source={require('../../assets/right-arrow.png')}
          style={[styles.arrowImage, { transform: [{ rotate: '-90deg' }] }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // iOS: Show arrow + pulsing ring + center dot
  return (
    <View style={styles.container}>
      {/* Pulsing glow ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { opacity: pulseAnim },
        ]}
      />

      {/* Inner dot – location anchor */}
      <View style={styles.innerDot} />

      {/* Heading rotation wrapper:
          displayHeading = 0  → north → arrow points UP
          displayHeading = 90 → east  → arrow points RIGHT */}
      <View
        style={[
          styles.arrowWrapper,
          { transform: [{ rotate: `${displayHeading}deg` }] },
        ]}
      >
        {/* Arrow image pre-rotated -90° so it defaults to UP (north).
            The PNG natively points RIGHT; -90° makes it point UP. */}
        <Image
          source={require('../../assets/right-arrow.png')}
          style={[styles.arrowImage, { transform: [{ rotate: '-90deg' }] }]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const ARROW_SIZE = 24;
const CONTAINER_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
  },
  pulseRing: {
    position: 'absolute',
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    borderRadius: CONTAINER_SIZE / 2,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  innerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  arrowWrapper: {
    position: 'absolute',
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowImage: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
  },
});
