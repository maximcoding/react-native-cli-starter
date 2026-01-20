module.exports = {
  presets: ['module:@react-native/babel-preset'],
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

