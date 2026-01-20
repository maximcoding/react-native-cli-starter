module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@rns': './packages/@rns',
          '@': './src',
          '@assets': './assets',
        },
      },
    ],
      // Required by @react-navigation/drawer (react-native-reanimated)
    'react-native-reanimated/plugin',
],
};


