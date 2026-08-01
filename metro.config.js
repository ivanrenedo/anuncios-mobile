// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Inline requires defer module evaluation until first use instead of loading
// every dependency at bundle startup. With ~30 hooks, ~17 components, and
// several 2000-line route files (explore, post, profile), this cuts cold-start
// parse cost on Android/iOS noticeably.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
