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
  ],
};


