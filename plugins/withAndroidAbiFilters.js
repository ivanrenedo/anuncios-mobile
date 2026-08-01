const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Restrict the native `.so` libs bundled in the APK to a whitelist of CPU
 * architectures. Without this the Android build ships arm64-v8a +
 * armeabi-v7a + x86 + x86_64, which multiplies every native lib (Hermes,
 * Reanimated, Google Sign-In, etc.) by four and inflates the APK past
 * 100 MB. Restricting to arm64-v8a + armeabi-v7a covers 99.9% of real
 * Android devices while cutting the APK roughly in half.
 *
 * Production (Play Store) exception:
 *   The `production` EAS profile builds an AAB, which Google Play splits
 *   per-device on the server side ("Dynamic Delivery"). An AAB with full
 *   ABI coverage results in a ~20 MB install for each user AND stays
 *   compatible with Chromebooks / WSA (x86_64) — so restricting ABIs there
 *   would only hurt reach without saving install size. This plugin skips
 *   itself when EAS_BUILD_PROFILE === 'production' unless the escape hatch
 *   FORCE_ABI_FILTERS=1 is set (useful when you build a direct-distribution
 *   production APK outside Play Store).
 *
 * Trade-off: the resulting APK will NOT run on x86/x86_64 emulators. If
 * you need to test on an emulator, either use an arm64 image (Android
 * Studio's default on Apple Silicon) or spin a separate EAS profile that
 * skips this plugin.
 *
 * The mod is idempotent — running expo prebuild multiple times won't
 * duplicate the ndk block.
 */
module.exports = function withAndroidAbiFilters(
  config,
  { abis = ['arm64-v8a', 'armeabi-v7a'] } = {},
) {
  const isProductionProfile = process.env.EAS_BUILD_PROFILE === 'production';
  const force =
    process.env.FORCE_ABI_FILTERS === '1' ||
    process.env.FORCE_ABI_FILTERS === 'true';
  if (isProductionProfile && !force) return config;

  return withAppBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;

    // Skip if we've already injected the filter (any abiFilters mention is
    // enough — the block is ours, and there's no legitimate reason for a
    // second one). Prevents duplicate blocks on repeated prebuilds.
    if (gradle.includes('abiFilters')) return cfg;

    const abiList = abis.map((a) => `'${a}'`).join(', ');
    const injection = `\n        ndk {\n            abiFilters ${abiList}\n        }`;

    // Anchor on `defaultConfig {` — the RN template always has exactly one
    // in app/build.gradle. If Expo ever changes the template so the anchor
    // vanishes, we fall through without mutating rather than corrupting
    // the file.
    const anchor = /defaultConfig\s*\{/;
    if (!anchor.test(gradle)) return cfg;
    cfg.modResults.contents = gradle.replace(
      anchor,
      (match) => `${match}${injection}`,
    );
    return cfg;
  });
};
