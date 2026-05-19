import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { preloadBackgroundImages } from "./src/utils/backgroundLoader";

export default function App() {
  useEffect(() => {
    // Preload all backgrounds on app startup for instant rendering
    preloadBackgroundImages().catch(() => {
      // Non-blocking: backgrounds will still load normally if prefetch fails
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
