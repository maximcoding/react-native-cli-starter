/**
 * FILE: src/lib/types/manifest.ts
 * PURPOSE: Project manifest types for .rns/rn-init.json (section 13)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.2
 */

/**
 * Manifest schema version for migration support
 * Increment when making breaking changes to the manifest structure
 */
export type ManifestSchemaVersion = '1.0.0';

/**
 * Current manifest schema version
 */
export const CURRENT_MANIFEST_SCHEMA_VERSION: ManifestSchemaVersion = '1.0.0';

/**
 * Project identity information
 */
export interface RnsProjectIdentity {
  /** Project name (package.json name) */
  name: string;
  /** Display name (app.json displayName) */
  displayName?: string;
  /** iOS bundle identifier */
  bundleId?: string;
  /** Android package name */
  packageName?: string;
  /** Project version */
  version?: string;
  /** Build number */
  build?: string;
}

/**
 * Permission requirement record (for manifest storage)
 */
export interface PermissionRequirementRecord {
  /** Permission ID */
  permissionId: string;
  /** Whether permission is mandatory */
  mandatory: boolean;
}

/**
 * Installed plugin/module record
 * Tracks what plugins/modules are installed and when
 */
export interface InstalledPluginRecord {
  /** Plugin/module ID */
  id: string;
  /** Installed version */
  version: string;
  /** Installation timestamp */
  installedAt: string;
  /** Installation options (plugin-specific) */
  options?: Record<string, unknown>;
  /** Files/directories owned by this plugin (for cleanup) */
  ownedFiles?: string[];
  ownedDirs?: string[];
  /** Permission requirements (for traceability) */
  permissions?: PermissionRequirementRecord[];
  /** Last updated timestamp */
  updatedAt?: string;
}

/**
 * Project manifest structure
 * Single source of truth for what was generated and what is installed
 */
export interface RnsProjectManifest {
  /** Manifest schema version (for migrations) */
  schemaVersion: ManifestSchemaVersion;
  /** CLI version that generated this manifest */
  cliVersion: string;
  /** Workspace model (Option A) */
  workspaceModel: 'Option A';
  /** Project identity */
  identity: RnsProjectIdentity;
  /** Target platform (expo/bare) */
  target: 'expo' | 'bare';
  /** Language (ts/js) */
  language: 'ts' | 'js';
  /** Package manager (npm/pnpm/yarn) */
  packageManager: 'npm' | 'pnpm' | 'yarn';
  /** React Native version */
  reactNativeVersion?: string;
  /**
   * Init-selected CORE navigation preset.
   * Note: currently Bare RN only (section 26); Expo selection can be added later.
   */
  navigationPreset?: 'stack-only' | 'tabs-only' | 'stack-tabs' | 'stack-tabs-modals' | 'drawer';
  /**
   * Selected locales for I18n (CORE).
   * Only populated if i18n option is selected in selectedOptions.
   */
  locales?: string[];
  /**
   * Selected project feature options (section 29, 30).
   */
  selectedOptions?: {
    // Common options (available for both Expo and Bare)
    i18n: boolean;
    theming: boolean;
    reactNavigation: boolean;
    styling: 'nativewind' | 'unistyles' | 'tamagui' | 'restyle' | 'stylesheet';
    reactNativeScreens?: boolean; // Optional (currently auto-included with React Navigation)
    reactNativePaper?: boolean; // Material Design component library
    reactNativeElements?: boolean; // Component library (React Native Elements)
    uiKitten?: boolean; // Component library (UI Kitten)
    styledComponents?: boolean; // CSS-in-JS styling library
    reactNativeWeb?: boolean; // Web support for React Native apps
    
    // Expo-specific options (only available when target is Expo)
    expoRouter?: boolean; // Currently implemented
    expoLinking?: boolean; // URL handling and deep linking
    expoStatusBar?: boolean; // Status bar customization
    expoSystemUI?: boolean; // System UI customization
    expoWebBrowser?: boolean; // Open links in browser
    expoDevClient?: boolean; // Custom development client for native modules
    expoVectorIcons?: boolean; // Vector icon library (Ionicons, MaterialIcons, etc.)
    expoImage?: boolean; // Optimized image component with caching
    expoLinearGradient?: boolean; // Linear gradient component
    expoHaptics?: boolean; // Haptic feedback (vibrations)
    expoDevice?: boolean; // Device information utilities
    
    // Bare-specific options (only available when target is Bare)
    reactNativeKeychain?: boolean; // Secure keychain/keystore storage
    reactNativeFS?: boolean; // Native file system access
    reactNativePermissions?: boolean; // Unified permissions API for native modules
    reactNativeFastImage?: boolean; // Optimized image loading with native caching
    nativeModulesSupport?: boolean; // Provider SDKs and native configuration support
    
    // Deprecated/removed options (kept for backward compatibility)
    authentication?: 'firebase' | 'supabase' | null; // Use plugin system instead
    analytics: boolean; // Use plugin system instead
  };
  /** CORE toggles (from init) */
  coreToggles?: Record<string, boolean>;
  /** Installed plugins */
  plugins: InstalledPluginRecord[];
  /** Installed modules */
  modules?: InstalledPluginRecord[];
  /** Aggregated permissions (all installed plugins) */
  permissions?: {
    /** All permission IDs */
    permissionIds: string[];
    /** Mandatory permission IDs */
    mandatory: string[];
    /** Optional permission IDs */
    optional: string[];
    /** Per-plugin traceability */
    byPlugin: Record<string, {
      pluginId: string;
      permissions: PermissionRequirementRecord[];
    }>;
  };
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Manifest validation result
 */
export interface ManifestValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  migrated?: boolean;
}
