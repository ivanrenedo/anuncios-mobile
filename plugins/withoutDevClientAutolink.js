const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Excludes the expo-dev-client family from native autolinking on non-dev
 * builds. Without this the modules end up compiled into the release APK
 * even though `developmentClient: true` isn't set on the profile — they
 * autolink because they're in node_modules, and add ~25 MB of dead weight.
 *
 * Strategy: at prebuild time, patch the on-disk `package.json` inside the
 * EAS build container's copy of the project, adding an
 * `expo.autolinking.exclude` list. `expo-modules-autolinking` reads that
 * config when Gradle configures the app, so the excluded modules are
 * skipped entirely.
 *
 * Gating: runs ONLY when we're on an EAS build AND the profile isn't
 * `development`. This means:
 *   - Local `npx expo start` / `expo run:android`: no exclusion → dev
 *     client works.
 *   - `eas build --profile development`: no exclusion → dev client works.
 *   - `eas build --profile preview` / `production`: exclusion applied →
 *     ~25 MB shaved off the APK.
 *
 * Safety: the mutation happens inside EAS's ephemeral working directory,
 * not on your local repo, so nothing is left dirty.
 */
const EXCLUDED_MODULES = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
];

module.exports = function withoutDevClientAutolink(config) {
  const isEasBuild = !!process.env.EAS_BUILD;
  const isDevProfile = process.env.EAS_BUILD_PROFILE === 'development';
  if (!isEasBuild || isDevProfile) return config;

  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const pkgPath = path.join(cfg.modRequest.projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.expo = pkg.expo || {};
      pkg.expo.autolinking = pkg.expo.autolinking || {};
      const current = new Set(pkg.expo.autolinking.exclude || []);
      for (const mod of EXCLUDED_MODULES) current.add(mod);
      pkg.expo.autolinking.exclude = Array.from(current);
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      return cfg;
    },
  ]);
};
