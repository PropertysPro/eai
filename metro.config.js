const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  stream: 'stream-browserify',
  buffer: 'buffer',
  zlib: 'browserify-zlib',
};

module.exports = config;
