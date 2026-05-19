import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Hook to track device heading/compass direction
 * Returns heading in degrees (0-360, where 0 is North)
 */
export const useDeviceHeading = () => {
  const [heading, setHeading] = useState(0);
  const [headingAccuracy, setHeadingAccuracy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    const startHeadingTracking = async () => {
      try {
        // Check if location permissions are granted
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }

        // Watch heading updates
        const subscription = await Location.watchHeadingAsync(
          (headingData) => {
            if (mounted) {
              setHeading(headingData.trueHeading);
              setHeadingAccuracy(headingData.accuracy || 0);
            }
          }
        );

        subscriptionRef.current = subscription;
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      }
    };

    startHeadingTracking();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  return { heading, headingAccuracy, error };
};

/**
 * Hook to track user's movement direction (velocity-based)
 * Calculates heading based on movement between location updates
 */
export const useMovementHeading = () => {
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastLocationRef = useRef<Location.LocationObject | null>(null);

  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1, // Update every 1 meter
          },
          (location) => {
            if (mounted && lastLocationRef.current) {
              const curr = location.coords;
              const prev = lastLocationRef.current.coords;

              // Calculate bearing based on movement
              const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
              const lat1 = prev.latitude * Math.PI / 180;
              const lat2 = curr.latitude * Math.PI / 180;

              const y = Math.sin(dLon) * Math.cos(lat2);
              const x =
                Math.cos(lat1) * Math.sin(lat2) -
                Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

              let bearing = Math.atan2(y, x) * 180 / Math.PI;
              bearing = (bearing + 360) % 360;

              setHeading(bearing);
              setSpeed(location.coords.speed || 0);
            }

            lastLocationRef.current = location;
          }
        );

        return subscription;
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      }
    };

    const subscription = startTracking();

    return () => {
      mounted = false;
      subscription?.then((sub) => sub?.remove());
    };
  }, []);

  return { heading, speed, error };
};

/**
 * Hook to combine device heading and movement heading
 * Prefers device heading if available and accurate, falls back to movement heading
 */
export const useCombinedHeading = (useMovement: boolean = false) => {
  const deviceHeading = useDeviceHeading();
  const movementHeading = useMovement ? useMovementHeading() : null;

  // Prefer device heading if available and reasonably accurate
  const heading =
    deviceHeading.headingAccuracy > 0 && deviceHeading.headingAccuracy < 25
      ? deviceHeading.heading
      : movementHeading?.heading || deviceHeading.heading;

  const error = deviceHeading.error || movementHeading?.error;

  return { heading, error };
};
