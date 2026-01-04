# Fonts Directory

Place your custom font files (.ttf, .otf) in this directory.

## Usage

### Expo Projects
Fonts in this directory are automatically available. Use them with expo-font.

### Bare React Native Projects
Fonts are auto-linked via react-native.config.js. After adding fonts:
1. Add font files to this directory
2. Run npx react-native-asset (or restart Metro bundler)
3. Use font family names in your styles

## Font Naming
- Font file names should match the font family name used in styles
- Example: Inter-Regular.ttf → fontFamily: 'Inter-Regular'

