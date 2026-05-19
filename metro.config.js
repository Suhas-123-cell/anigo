const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to not watch the root directory's node_modules
config.watchFolders = [];

// Ensure we're only watching the frontend directory
config.projectRoot = __dirname;

// Add project specific settings
config.resolver.nodeModulesPaths = [
  `${__dirname}/node_modules`,
];

module.exports = config;
