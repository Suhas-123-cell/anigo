/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in meters
 */
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Distance in meters
}

import { CATCH_RADIUS_METERS } from './distance';

/**
 * Check if a spawn is within the catchable distance range
 * Uses CATCH_RADIUS_METERS as the canonical source of truth
 * @param playerLat - Player's latitude
 * @param playerLon - Player's longitude
 * @param spawnLat - Spawn's latitude
 * @param spawnLon - Spawn's longitude
 * @returns Boolean indicating if spawn is within catchable range (>= 5m and <= CATCH_RADIUS_METERS)
 */
export function isSpawnInRange(
  playerLat: number,
  playerLon: number,
  spawnLat: number,
  spawnLon: number
): boolean {
  const distance = getDistanceFromLatLonInMeters(
    playerLat,
    playerLon,
    spawnLat,
    spawnLon
  );
  return distance >= 5 && distance <= CATCH_RADIUS_METERS;
}
