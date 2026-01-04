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
  ],
};

