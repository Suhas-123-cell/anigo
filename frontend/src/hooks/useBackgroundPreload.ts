import { useEffect } from 'react';
import { preloadImage } from '../utils/backgroundLoader';

/**
 * Custom hook to preload and optimize background image rendering
 * Use this in any screen with ImageBackground
 */
export const useBackgroundPreload = (backgroundSource: any): void => {
  useEffect(() => {
    // Preload immediately when screen mounts
    preloadImage(backgroundSource);
  }, [backgroundSource]);
};
