const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidSize(config) {
  return withGradleProperties(config, (config) => {
    // Play splits the production bundle per device; preview APKs target ARM64.
    const architectures = process.env.EAS_BUILD_PROFILE === 'production'
      ? 'armeabi-v7a,arm64-v8a,x86,x86_64'
      : 'arm64-v8a';
    const properties = {
      reactNativeArchitectures: architectures,
      'android.enableMinifyInReleaseBuilds': 'true',
      'android.enableShrinkResourcesInReleaseBuilds': 'true',
    };

    for (const [key, value] of Object.entries(properties)) {
      config.modResults = config.modResults.filter(
        (property) => property.type !== 'property' || property.key !== key,
      );
      config.modResults.push({ type: 'property', key, value });
    }

    return config;
  });
};
