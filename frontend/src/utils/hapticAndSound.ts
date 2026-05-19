import { Vibration, Platform } from 'react-native';

/**
 * Character spawn sound configuration
 */
export const CHARACTER_SOUNDS: Record<string, string> = {
    'Naruto Uzumaki': '🔊 Kage Bunshin!',
    'Goku': '🔊 Instant Transmission!',
    'Luffy': '🔊 Gomu Gomu!',
    'Levi Ackerman': '🔊 Soldier!',
    'Itachi Uchiha': '🔊 Tsukuyomi!',
    'Tanjiro Kamado': '🔊 Hinokami!',
    'Gojo Satoru': '🔊 Limitless!',
    'Eren Yeager': '🔊 Tatakae!',
    'Spike Spiegel': '🔊 Whatever happens...',
    'Edward Elric': '🔊 Equivalent Exchange!',
    'Saitama': '🔊 One Punch!',
    'Light Yagami': '🔊 Death Note!',
    'Zoro': '🔊 Three Sword!',
    'Sasuke': '🔊 Chidori!',
    'Mikasa': '🔊 Survey Corps!',
};

/**
 * Haptic feedback patterns for different events
 */
export const HAPTIC_PATTERNS = {
    // Double-tap vibration when spawn appears (notification style)
    spawnAppear: [0, 50, 100, 50],
    
    // Light feedback for successful catch
    success: [0, 100],
    
    // Error/warning pattern
    error: [0, 200, 100, 200],
    
    // Quick response for UI interactions
    tap: [0, 10],
};

/**
 * Trigger haptic vibration feedback
 * @param pattern - Array of milliseconds alternating between delay and vibration
 */
export function triggerHaptic(pattern: number[] = HAPTIC_PATTERNS.tap) {
    if (Platform.OS === 'android') {
        Vibration.vibrate(pattern);
    } else if (Platform.OS === 'ios') {
        // iOS Vibration.vibrate() doesn't support array patterns properly
        // Use single vibration or implement timeout-based pattern
        // For now, use first element or default to simple tap
        const singleDuration = typeof pattern === 'number' ? pattern : pattern[0] || 50;
        Vibration.vibrate(singleDuration);
    }
}

/**
 * Get the sound description for a character
 */
export function getCharacterSound(characterName: string): string {
    return CHARACTER_SOUNDS[characterName] || '🔊 New Spawn!';
}

/**
 * Play spawn notification with haptic feedback
 * This can be extended to play actual audio files
 */
export function playSpawnNotification(characterName: string) {
    // Haptic feedback - double-tap vibration
    triggerHaptic(HAPTIC_PATTERNS.spawnAppear);
    
    // Console log for now (actual audio can be integrated later)
    console.log(`[Spawn] ${getCharacterSound(characterName)}`);
}

/**
 * Play success feedback when character is caught
 */
export function playSuccessFeedback() {
    triggerHaptic(HAPTIC_PATTERNS.success);
    console.log('[Success] Character caught!');
}

/**
 * Play error feedback
 */
export function playErrorFeedback() {
    triggerHaptic(HAPTIC_PATTERNS.error);
    console.log('[Error] Failed action');
}
