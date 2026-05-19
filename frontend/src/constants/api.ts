// ─── Backend API Configuration ──────────────────────────────
// Configure this for Expo Go to connect to your local backend.
//
// OPTION 1: Set your local IP (recommended for testing)
// Run `ifconfig | grep "inet " | grep -v 127.0.0.1` to find your IP
//
// OPTION 2: Use ngrok for external access
// Set EXPO_PUBLIC_API_URL in .env file:
// EXPO_PUBLIC_API_URL=https://your-tunnel.ngrok-free.app/api

import { Platform } from 'react-native';

// ─── Your local machine's IP address ────────────────────────
// Update this to match your computer's IP when testing with Expo Go
const LOCAL_IP = process.env.EXPO_PUBLIC_LOCAL_IP || '192.0.0.2';
const PORT = 3001;

// ─── Determine the correct API URL ──────────────────────────
function getApiBaseUrl(): string {
	// 1. Environment variable takes priority (for production/ngrok)
	if (process.env.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}

	// 2. Web uses localhost
	if (Platform.OS === 'web') {
		return `http://localhost:${PORT}/api`;
	}

	// 3. Native platforms (iOS/Android): use LAN IP for physical device access
	// For simulator/emulator you can still override with EXPO_PUBLIC_API_URL if needed.
	return `http://${LOCAL_IP}:${PORT}/api`;
}

const API_BASE_URL = getApiBaseUrl();

// ─── API Endpoints Helper ───────────────────────────────────
export const API = {
	baseUrl: API_BASE_URL,

	// Auth
	signup: `${API_BASE_URL}/auth/signup`,
	login: `${API_BASE_URL}/auth/login`,
	me: (userId: number) => `${API_BASE_URL}/auth/me/${userId}`,

	// Spawns
	spawns: `${API_BASE_URL}/spawns`,
	spawn: (id: string) => `${API_BASE_URL}/spawns/${id}`,
	spawnNear: `${API_BASE_URL}/spawns/near`,

	// Game
	catch: `${API_BASE_URL}/game/catch`,
	inventory: (userId: number) => `${API_BASE_URL}/game/inventory/${userId}`,
	stats: (userId: number) => `${API_BASE_URL}/game/stats/${userId}`,
	leaderboard: `${API_BASE_URL}/game/leaderboard`,
};

// Log the API URL in development
if (__DEV__) {
	console.log('🔗 API Base URL:', API_BASE_URL);
}

// ─── Default fetch headers ───────────────────────────────────
// ngrok-skip-browser-warning bypasses the ngrok interstitial page
export const DEFAULT_HEADERS: Record<string, string> = {
	'Content-Type': 'application/json',
	'ngrok-skip-browser-warning': 'true',
};

export default API_BASE_URL;
