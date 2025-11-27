const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for asset resolution
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'mp3', 'ttf', 'obj', 'txt', 'jpg', 'png'];

// Add any problematic modules to blacklist if needed
config.resolver.blacklistRE = /.*.test.js$/;

module.exports = config;
