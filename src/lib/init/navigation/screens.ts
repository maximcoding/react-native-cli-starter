/**
 * FILE: src/lib/init/navigation/screens.ts
 * PURPOSE: Example screen generation for navigation
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import { AVAILABLE_LOCALES } from '../utils';
import type { InitInputs } from '../types';

/**
 * Section 27, 29: Generates example screens in User Zone based on navigation preset.
 * Creates screens in src/screens/ and updates registry to use them.
 */
export function generateExampleScreens(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.reactNavigation || !inputs.navigationPreset) {
    return;
  }

  const screensDir = join(appRoot, USER_SRC_DIR, 'screens');
  ensureDir(screensDir);

  const fileExt = inputs.language === 'ts' ? 'tsx' : 'jsx';
  const hasI18n = inputs.selectedOptions.i18n === true;
  const hasTheming = inputs.selectedOptions.theming === true;

  // Always generate HomeScreen and SettingsScreen
  const homeScreenContent = generateHomeScreen(inputs.language, hasI18n, hasTheming, inputs.navigationPreset);
  writeTextFile(join(screensDir, `HomeScreen.${fileExt}`), homeScreenContent);

  const settingsScreenContent = generateSettingsScreen(
    inputs.language,
    hasI18n,
    hasTheming,
    hasI18n ? (inputs.locales ?? []) : []
  );
  writeTextFile(join(screensDir, `SettingsScreen.${fileExt}`), settingsScreenContent);

  // Generate additional screens based on preset
  if (inputs.navigationPreset === 'stack-tabs' || inputs.navigationPreset === 'stack-tabs-modals' || inputs.navigationPreset === 'stack-only') {
    const detailScreenContent = generateDetailScreen(inputs.language, hasI18n, hasTheming);
    writeTextFile(join(screensDir, `DetailScreen.${fileExt}`), detailScreenContent);
  }

  if (inputs.navigationPreset === 'stack-tabs-modals') {
    const modalContent = generateInfoModal(inputs.language, hasI18n, hasTheming);
    writeTextFile(join(screensDir, `InfoModal.${fileExt}`), modalContent);
  }
}

/**
 * Generates HomeScreen component
 */
export function generateHomeScreen(
  language: 'ts' | 'js',
  hasI18n: boolean,
  hasTheming: boolean,
  preset: string
): string {
  const hasStackNav = preset === 'stack-tabs' || preset === 'stack-tabs-modals' || preset === 'stack-only';

  let imports = `import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES, createRoute } from '@rns/navigation';
`;

  if (hasI18n) {
    imports += `import { useT } from '@/hooks/useT';
`;
  }

  if (hasTheming) {
    imports += `import { useTheme } from '@rns/core/theme';
`;
  }

  const themeHook = hasTheming ? '  const { theme } = useTheme();' : '';
  const tHook = hasI18n ? '  const t = useT();' : '';
  const navigationHook = '  const navigation = useNavigation();';

  const titleText = hasI18n ? '{t(\'screens.home.title\')}' : '\'Home\'';
  const subtitleText = hasI18n ? '{t(\'screens.home.subtitle\')}' : '\'Welcome to your app!\'';
  const settingsButtonText = hasI18n ? '{t(\'screens.home.go_settings\')}' : '\'Go to Settings\'';
  const detailButtonText = hasI18n ? '{t(\'screens.home.view_details\')}' : '\'View Details\'';

  const styles = hasTheming
    ? `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      gap: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    button: {
      backgroundColor: theme.colors.primary || '#007AFF',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md || 8,
      marginBottom: theme.spacing.sm,
    },
    buttonText: {
      color: theme.colors.textPrimary || '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });`
    : `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#FFFFFF',
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#666666',
      marginBottom: 24,
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
    },
    buttonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });`;

  const detailButton = hasStackNav
    ? `
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate(createRoute('SCREEN_DETAIL') as never)}
      >
        <Text style={styles.buttonText}>${detailButtonText}</Text>
      </Pressable>`
    : '';

  return `${imports}
/**
 * FILE: src/screens/HomeScreen.tsx
 * PURPOSE: Example home screen (User Zone).
 * OWNERSHIP: USER
 * 
 * This is an example screen demonstrating navigation patterns.
 * You can edit or remove this file as needed.
 */
export default function HomeScreen() {
${themeHook}
${tHook}
${navigationHook}

${styles}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${titleText}</Text>
      <Text style={styles.subtitle}>${subtitleText}</Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate(ROUTES.TAB_SETTINGS as never)}
      >
        <Text style={styles.buttonText}>${settingsButtonText}</Text>
      </Pressable>
${detailButton}
    </View>
  );
}
`;
}

/**
 * Generates SettingsScreen component
 */
export function generateSettingsScreen(
  language: 'ts' | 'js',
  hasI18n: boolean,
  hasTheming: boolean,
  locales: string[] = []
): string {
  const isTS = language === 'ts';
  const typeAnnotation = isTS ? ': React.FC' : '';

  let imports = `import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
`;

  if (hasI18n) {
    imports += `import { useT } from '@/hooks/useT';
import i18n from '@rns/core/i18n';
`;
  }

  if (hasTheming) {
    imports += `import { useTheme } from '@rns/core/theme';
`;
  }

  const themeHook = hasTheming ? '  const { theme, mode, setTheme } = useTheme();' : '';
  const tHook = hasI18n ? '  const t = useT();' : '';

  const styles = hasTheming
    ? `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      gap: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
    },
    button: {
      backgroundColor: theme.colors.surface || '#F5F5F5',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md || 8,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E0E0E0',
    },
    buttonText: {
      color: theme.colors.textPrimary,
      textAlign: 'center',
      fontSize: 16,
    },
  });`
    : `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#FFFFFF',
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 24,
    },
    button: {
      backgroundColor: '#F5F5F5',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    buttonText: {
      color: '#000000',
      textAlign: 'center',
      fontSize: 16,
    },
  });`;

  const languageButtons =
    locales
      .map(
        (code) =>
          AVAILABLE_LOCALES.find((l) => l.code === code)?.name ?? code
      )
      .map(
        (displayName, i) =>
          `<Pressable
        style={styles.button}
        onPress={() => i18n.changeLanguage('${locales[i]}')}
      >
        <Text style={styles.buttonText}>${displayName}</Text>
      </Pressable>`
      )
      .join('\n      ');

  const languageSwitcher =
    hasI18n && locales.length > 0
      ? `
      <Text style={styles.title}>${hasI18n ? '{t(\'screens.settings.language\')}' : '\'Language\''}</Text>
      ${languageButtons}`
      : '';

  const themeSwitcher = hasTheming
    ? `
      <Text style={styles.title}>${hasI18n ? '{t(\'screens.settings.theme\')}' : '\'Theme\''}</Text>
      <Pressable
        style={styles.button}
        onPress={() => {
          const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
          setTheme(next);
        }}
      >
        <Text style={styles.buttonText}>${hasI18n ? '{t(\'screens.settings.theme_current\')}' : '\'Theme: \''} {mode}</Text>
      </Pressable>`
    : '';

  return `${imports}
/**
 * FILE: src/screens/SettingsScreen.tsx
 * PURPOSE: Example settings screen (User Zone).
 * OWNERSHIP: USER
 * 
 * This is an example screen demonstrating settings patterns.
 * You can edit or remove this file as needed.
 */
export default function SettingsScreen() {
${themeHook}
${tHook}

${styles}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${hasI18n ? '{t(\'screens.settings.title\')}' : '\'Settings\''}</Text>
${languageSwitcher}
${themeSwitcher}
    </View>
  );
}
`;
}

/**
 * Generates DetailScreen component (for stack navigation)
 */
export function generateDetailScreen(
  language: 'ts' | 'js',
  hasI18n: boolean,
  hasTheming: boolean
): string {
  const isTS = language === 'ts';
  const typeAnnotation = isTS ? ': React.FC' : '';

  let imports = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
`;

  if (hasI18n) {
    imports += `import { useT } from '@/hooks/useT';
`;
  }

  if (hasTheming) {
    imports += `import { useTheme } from '@rns/core/theme';
`;
  }

  const themeHook = hasTheming ? '  const { theme } = useTheme();' : '';
  const tHook = hasI18n ? '  const t = useT();' : '';

  const styles = hasTheming
    ? `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    text: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });`
    : `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#FFFFFF',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 16,
    },
    text: {
      fontSize: 16,
      color: '#666666',
    },
  });`;

  return `${imports}
/**
 * FILE: src/screens/DetailScreen.tsx
 * PURPOSE: Example detail screen demonstrating stack navigation (User Zone).
 * OWNERSHIP: USER
 * 
 * This screen is navigated to from HomeScreen to demonstrate stack navigation.
 * You can edit or remove this file as needed.
 */
export default function DetailScreen() {
${themeHook}
${tHook}

${styles}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${hasI18n ? '{t(\'screens.detail.title\')}' : '\'Detail Screen\''}</Text>
      <Text style={styles.text}>${hasI18n ? '{t(\'screens.detail.description\')}' : '\'This is an example detail screen that demonstrates stack navigation.\''}</Text>
    </View>
  );
}
`;
}

/**
 * Generates InfoModal component (for modal presentation)
 */
export function generateInfoModal(
  language: 'ts' | 'js',
  hasI18n: boolean,
  hasTheming: boolean
): string {
  const isTS = language === 'ts';
  const typeAnnotation = isTS ? ': React.FC' : '';

  let imports = `import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
`;

  if (hasI18n) {
    imports += `import { useT } from '@/hooks/useT';
`;
  }

  if (hasTheming) {
    imports += `import { useTheme } from '@rns/core/theme';
`;
  }

  const themeHook = hasTheming ? '  const { theme } = useTheme();' : '';
  const tHook = hasI18n ? '  const t = useT();' : '';
  const navigationHook = '  const navigation = useNavigation();';

  const styles = hasTheming
    ? `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    text: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    button: {
      backgroundColor: theme.colors.primary || '#007AFF',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md || 8,
      minWidth: 120,
    },
    buttonText: {
      color: theme.colors.textPrimary || '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });`
    : `  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 16,
    },
    text: {
      fontSize: 16,
      color: '#666666',
      textAlign: 'center',
      marginBottom: 32,
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 16,
      borderRadius: 8,
      minWidth: 120,
    },
    buttonText: {
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });`;

  return `${imports}
/**
 * FILE: src/screens/InfoModal.tsx
 * PURPOSE: Example modal screen demonstrating modal presentation (User Zone).
 * OWNERSHIP: USER
 * 
 * This is an example modal screen that demonstrates modal presentation.
 * You can edit or remove this file as needed.
 */
export default function InfoModal() {
${themeHook}
${tHook}
${navigationHook}

${styles}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${hasI18n ? '{t(\'screens.modal.title\')}' : '\'Info Modal\''}</Text>
      <Text style={styles.text}>${hasI18n ? '{t(\'screens.modal.description\')}' : '\'This is an example modal screen.\''}</Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>${hasI18n ? '{t(\'screens.modal.close\')}' : '\'Close\''}</Text>
      </Pressable>
    </View>
  );
}
`;
}
