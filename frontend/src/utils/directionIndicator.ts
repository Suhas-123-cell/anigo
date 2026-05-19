/**
 * Direction Indicator Utility
 * 
 * Calculates bearing and direction between user and target positions
 * Similar to the 3D character login visualization from the reference repo
 */

export interface DirectionData {
  bearing: number; // 0-360 degrees (0 = North, 90 = East, 180 = South, 270 = West)
  direction: string; // Cardinal direction (N, NE, E, SE, S, SW, W, NW)
  distance: number; // Distance in meters
  angle: number; // Angle in radians for 3D rotation
}

/**
 * Calculate bearing between two coordinates
 * Returns angle from North (0-360)
 */
export function calculateBearing(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number
): number {
  const dLon = (targetLon - userLon) * Math.PI / 180;
  const lat1 = userLat * Math.PI / 180;
  const lat2 = targetLat * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Convert bearing to cardinal direction
 */
export function bearingToDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((bearing % 360) / 22.5);
  return directions[index % 16];
}

/**
 * Get simplified cardinal direction (8 directions)
 */
export function getCardinalDirection(bearing: number): string {
  bearing = (bearing + 22.5) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.floor(bearing / 45)];
}

/**
 * Calculate complete direction data
 */
export function calculateDirectionData(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  distance: number
): DirectionData {
  const bearing = calculateBearing(userLat, userLon, targetLat, targetLon);
  const direction = getCardinalDirection(bearing);
  const angle = (bearing - 90) * Math.PI / 180; // Convert to radians, offset for coordinate system

  return {
    bearing,
    direction,
    distance,
    angle,
  };
}

/**
 * Get direction indicator emoji based on bearing
 */
export function getDirectionEmoji(bearing: number): string {
  const cardinal = getCardinalDirection(bearing);
  const emojiMap: Record<string, string> = {
    'N': '⬆️',
    'NE': '↗️',
    'E': '➡️',
    'SE': '↘️',
    'S': '⬇️',
    'SW': '↙️',
    'W': '⬅️',
    'NW': '↖️',
  };
  return emojiMap[cardinal] || '📍';
}

/**
 * Get rotation angle for 3D character model
 * Simulates character facing direction
 */
export function getCharacterRotation(bearing: number): number {
  // Convert bearing to radians, normalized to 0-2π
  return (bearing * Math.PI / 180) % (2 * Math.PI);
}

/**
 * Get relative position on a compass-like display
 * Returns x, y coordinates for positioning on a circular indicator
 */
export function getCompassPosition(bearing: number, radius: number = 100): { x: number; y: number } {
  const angle = (bearing - 90) * Math.PI / 180;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

/**
 * Determine if target is nearby (within catch radius)
 */
export function isNearby(distance: number, catchRadius: number = 20): boolean {
  return distance <= catchRadius;
}

/**
 * Get distance display text
 */
export function getDistanceText(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}
