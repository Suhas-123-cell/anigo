const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Add GLB as an asset extension for Metro bundler
// This allows require() to work with .glb files
if (!config.resolver.assetExts.includes('glb')) {
  config.resolver.assetExts.push('glb');
}

// Ensure proper node_modules resolution
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
];

// Watch the frontend directory
config.watchFolders = [projectRoot];

// Fix HMR for tunnel mode
config.server = {
  ...config.server,
  useGlobalHotkey: false,
};

module.exports = config;
