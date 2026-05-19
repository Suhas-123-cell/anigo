import { Image } from 'react-native';

// Centralized background image sources
export const BACKGROUND_IMAGES = {
  sukuna: require('../../assets/sukuna-dark.png'),
} as const;

// Cache to track which images have been preloaded
const preloadedImages = new Set<string>();

/**
 * Preload background images for faster rendering
 * Call this in useEffect on app startup and before screen transitions
 */
export const preloadBackgroundImages = async (): Promise<void> => {
  try {
    const imagesToPreload = Object.values(BACKGROUND_IMAGES);
    
    await Promise.all(
      imagesToPreload.map((source) => {
        // Avoid duplicate preloads
        const sourceKey = JSON.stringify(source);
        if (preloadedImages.has(sourceKey)) {
          return Promise.resolve();
        }
        
        preloadedImages.add(sourceKey);
        return Image.prefetch(typeof source === 'string' ? source : source.uri || '');
      })
    );
  } catch (error) {
    console.warn('Background image preload failed:', error);
    // Non-blocking error - continue anyway
  }
};

/**
 * Preload a specific background image with error handling
 */
export const preloadImage = async (source: any): Promise<boolean> => {
  try {
    const sourceKey = JSON.stringify(source);
    if (preloadedImages.has(sourceKey)) {
      return true;
    }
    
    await Image.prefetch(typeof source === 'string' ? source : source.uri || '');
    preloadedImages.add(sourceKey);
    return true;
  } catch (error) {
    console.warn('Image prefetch failed:', error);
    return false;
  }
};

/**
 * Clear the preload cache (useful for memory management if needed)
 */
export const clearPreloadCache = (): void => {
  preloadedImages.clear();
};
