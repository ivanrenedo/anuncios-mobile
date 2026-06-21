const { withGradleProperties } = require('expo/config-plugins');

const JDK_PATH = 'C:\\\\Program Files\\\\Eclipse Adoptium\\\\jdk-17.0.19.10-hotspot';

module.exports = function withJdk17(config) {
  // Only pin a local Windows JDK for on-machine prebuilds. On EAS (Linux) the
  // builder already provides JDK 17, and this Windows path would be invalid
  // ("Java home supplied is invalid"), failing the Gradle build immediately.
  if (process.env.EAS_BUILD || process.platform !== 'win32') return config;
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const key = 'org.gradle.java.home';
    const idx = props.findIndex(
      (p) => p.type === 'property' && p.key === key,
    );
    const entry = { type: 'property', key, value: JDK_PATH };
    if (idx >= 0) {
      props[idx] = entry;
    } else {
      props.push(entry);
    }
    return cfg;
  });
};
