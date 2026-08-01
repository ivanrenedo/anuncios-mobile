const { withGradleProperties } = require('expo/config-plugins');

/**
 * Restrict the native CPU architectures the React Native gradle plugin
 * compiles for, by writing `reactNativeArchitectures` into
 * android/gradle.properties. In RN 0.71+ / Expo SDK 50+, this is the
 * property the RN gradle plugin actually reads to decide which ABIs to
 * build — the older `defaultConfig.ndk.abiFilters` approach in
 * build.gradle no longer has effect at that stage of the build, because
 * the RN plugin has already selected the target ABIs by the time Gradle
 * processes the android block.
 *
 * Default (no override) is `armeabi-v7a,arm64-v8a,x86,x86_64` → four
 * architectures compiled and packaged. Restricting to
 * `arm64-v8a,armeabi-v7a` covers ~99.9% of real Android devices and
 * shaves ~60-70 MB off the APK.
 *
 * Production (Play Store) exception:
 *   The `production` EAS profile builds an AAB, which Google Play splits
 *   per-device on the server ("Dynamic Delivery"). Leaving all four ABIs
 *   in the AAB keeps Chromebook / WSA compatibility without inflating
 *   the install size for anyone. This plugin skips itself when
 *   EAS_BUILD_PROFILE === 'production' unless FORCE_ABI_FILTERS=1 is
 *   set (for the rare case of a direct-distribution production APK).
 *
 * Trade-off: the resulting APK will NOT run on x86/x86_64 emulators. If
 * you need to test on an emulator, use an arm64 image (default on Apple
 * Silicon) or spin an EAS profile that skips this plugin.
 *
 * Idempotent: running expo prebuild multiple times overwrites the same
 * property entry rather than duplicating it.
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

  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const key = 'reactNativeArchitectures';
    const value = abis.join(',');
    const idx = props.findIndex(
      (p) => p.type === 'property' && p.key === key,
    );
    const entry = { type: 'property', key, value };
    if (idx >= 0) props[idx] = entry;
    else props.push(entry);
    return cfg;
  });
};
