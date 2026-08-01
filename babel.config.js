module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.BABEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Strip console.* calls from release bundles. Each console call is a
      // JS-side format + native bridge write; harmless in dev, wasted work
      // in prod. Kept dev-active so debugging stays intact.
      ...(isProduction ? ['transform-remove-console'] : []),
    ],
  };
};
