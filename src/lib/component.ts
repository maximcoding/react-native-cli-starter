/**
 * FILE: src/lib/component.ts
 * PURPOSE: Component generation command implementation (section 25)
 * OWNERSHIP: CLI
 * 
 * This module provides component generation capability:
 * - Generates individual UI components (Button, Input, FlashList, etc.)
 * - Adapts to installed UI framework plugin if available
 * - Generates generic components if no UI framework installed
 * - Components generated in USER ZONE (src/components/ or src/app/components/)
 */

import { join } from 'path';
import { pathExists, isDirectory, ensureDir, writeTextFile, readTextFile } from './fs';
import { readManifest, validateProjectInitialized, getPluginFromManifest } from './manifest';
import { CliError, ExitCode } from './errors';
import type { RuntimeContext } from './runtime';

/**
 * UI framework plugin IDs that provide component generation
 */
const UI_FRAMEWORK_PLUGINS = ['ui.paper', 'ui.tamagui', 'ui.nativebase'] as const;

/**
 * Options for component command
 */
export interface ComponentCommandOptions {
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Component generation result
 */
export interface ComponentCommandResult {
  componentName: string;
  success: boolean;
  skipped: boolean;
  error?: string;
  summary?: {
    filesGenerated?: number;
    componentPath?: string;
  };
}

/**
 * Gets the installed UI framework plugin ID if any
 */
function getInstalledUIFramework(projectRoot: string): string | null {
  const manifest = readManifest(projectRoot);
  if (!manifest) {
    return null;
  }

  // Check for UI framework plugins (single slot, so only one should be installed)
  for (const uiFrameworkId of UI_FRAMEWORK_PLUGINS) {
    const plugin = getPluginFromManifest(projectRoot, uiFrameworkId);
    if (plugin) {
      return uiFrameworkId;
    }
  }

  return null;
}

/**
 * Determines the component directory path (USER ZONE)
 * Checks for src/components/ or src/app/components/
 */
function determineComponentDirectory(projectRoot: string): string {
  const srcDir = join(projectRoot, 'src');
  
  // Check if src/app/components/ exists (preferred structure)
  const appComponentsDir = join(srcDir, 'app', 'components');
  if (pathExists(appComponentsDir) && isDirectory(appComponentsDir)) {
    return appComponentsDir;
  }
  
  // Check if src/components/ exists
  const componentsDir = join(srcDir, 'components');
  if (pathExists(componentsDir) && isDirectory(componentsDir)) {
    return componentsDir;
  }
  
  // Default to src/components/ (create if needed)
  return componentsDir;
}

/**
 * Validates component name (PascalCase, valid identifier)
 */
function validateComponentName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Component name cannot be empty' };
  }

  // Must start with uppercase letter
  if (!/^[A-Z]/.test(name)) {
    return { valid: false, error: 'Component name must start with an uppercase letter (PascalCase)' };
  }

  // Must be valid identifier (alphanumeric + underscore, no spaces)
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    return { valid: false, error: 'Component name must be a valid identifier (PascalCase, alphanumeric, underscore only)' };
  }

  return { valid: true };
}

/**
 * Generates a generic component (TypeScript or JavaScript)
 */
function generateGenericComponent(
  componentName: string,
  componentDir: string,
  language: 'ts' | 'js',
  dryRun: boolean
): { success: boolean; error?: string; componentPath?: string } {
  const ext = language === 'ts' ? 'tsx' : 'jsx';
  const componentPath = join(componentDir, `${componentName}.${ext}`);
  const indexPath = join(componentDir, 'index.ts'); // Always TypeScript for index

  // Check if component already exists
  if (pathExists(componentPath)) {
    return {
      success: false,
      error: `Component ${componentName} already exists at ${componentPath}`,
      componentPath,
    };
  }

  if (dryRun) {
    return {
      success: true,
      componentPath,
    };
  }

  // Generate component content
  const componentContent = language === 'ts'
    ? generateTypeScriptComponent(componentName)
    : generateJavaScriptComponent(componentName);

  // Ensure directory exists
  ensureDir(componentDir);

  // Write component file
  writeTextFile(componentPath, componentContent);

  // Update or create index.ts for exports (if TypeScript project)
  if (language === 'ts') {
    updateComponentIndex(componentDir, componentName, indexPath);
  }

  return {
    success: true,
    componentPath,
  };
}

/**
 * Generates TypeScript component template
 */
function generateTypeScriptComponent(componentName: string): string {
  return `import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

export interface ${componentName}Props {
  // Add your props here
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * ${componentName} component
 * 
 * @param props - Component props
 * @returns ${componentName} component
 */
export function ${componentName}({ children, style }: ${componentName}Props): React.JSX.Element {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{componentName}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Add your styles here
  },
  text: {
    // Add your text styles here
  },
});

export default ${componentName};
`;
}

/**
 * Generates JavaScript component template
 */
function generateJavaScriptComponent(componentName: string): string {
  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * ${componentName} component
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {object} [props.style] - Additional styles
 * @returns {React.JSX.Element} ${componentName} component
 */
export function ${componentName}({ children, style = {} }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{componentName}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Add your styles here
  },
  text: {
    // Add your text styles here
  },
});

export default ${componentName};
`;
}

/**
 * Updates component index.ts to export the new component
 */
function updateComponentIndex(componentDir: string, componentName: string, indexPath: string): void {
  let indexContent = '';
  try {
    if (pathExists(indexPath)) {
      indexContent = readTextFile(indexPath);
    }
  } catch {
    // If file doesn't exist or can't be read, start with empty content
    indexContent = '';
  }

  // Check if export already exists
  const exportPattern = new RegExp(`export\\s*\\{\\s*${componentName}\\s*\\}`, 'g');
  if (exportPattern.test(indexContent)) {
    return; // Already exported
  }

  // Add export statement
  const newExport = `export { ${componentName} } from './${componentName}';\n`;
  const updatedContent = indexContent.trim() 
    ? `${indexContent.trim()}\n${newExport}`
    : newExport;

  writeTextFile(indexPath, updatedContent);
}


/**
 * Generates components (section 25)
 * 
 * Components are generated in USER ZONE and adapt to installed UI framework plugin.
 * If no UI framework is installed, generic React Native components are generated.
 */
export async function addComponents(
  componentNames: string[],
  options: ComponentCommandOptions,
  context: RuntimeContext
): Promise<ComponentCommandResult[]> {
  const dryRun = options.dryRun ?? false;

  // Validate project is initialized
  validateProjectInitialized(context.resolvedRoot);

  // Read manifest to get project settings
  const manifest = readManifest(context.resolvedRoot);
  if (!manifest) {
    throw new CliError(
      'Project not initialized. Run "rns init" first.',
      ExitCode.NOT_INITIALIZED
    );
  }

  const language = manifest.language;
  const projectRoot = context.resolvedRoot;

  // Check for installed UI framework plugin
  const uiFramework = getInstalledUIFramework(projectRoot);
  
  if (uiFramework) {
    context.logger.info(`UI framework detected: ${uiFramework}`);
    context.logger.info('Note: Framework-specific component generation should be handled by UI framework plugins.');
    context.logger.info('Generating generic components instead.');
  }

  // Determine component directory (USER ZONE)
  const componentDir = determineComponentDirectory(projectRoot);

  // Validate and generate each component
  const results: ComponentCommandResult[] = [];

  for (const componentName of componentNames) {
    // Validate component name
    const validation = validateComponentName(componentName);
    if (!validation.valid) {
      results.push({
        componentName,
        success: false,
        skipped: false,
        error: validation.error,
      });
      continue;
    }

    try {
      // Generate generic component (or framework-specific if UI framework provides it)
      const result = generateGenericComponent(
        componentName,
        componentDir,
        language,
        dryRun
      );

      if (result.success) {
        const skipped = result.componentPath ? (pathExists(result.componentPath) && !dryRun) : false;
        results.push({
          componentName,
          success: true,
          skipped,
          summary: {
            filesGenerated: dryRun ? 0 : 1,
            componentPath: result.componentPath,
          },
        });

        if (result.componentPath) {
          if (dryRun) {
            context.logger.info(`[DRY RUN] Would generate component: ${componentName} at ${join(componentDir, `${componentName}.${language === 'ts' ? 'tsx' : 'jsx'}`)}`);
          } else {
            context.logger.info(`✓ Generated component: ${componentName} at ${result.componentPath}`);
          }
        }
      } else {
        results.push({
          componentName,
          success: false,
          skipped: result.error?.includes('already exists') ?? false,
          error: result.error,
        });

        if (result.error?.includes('already exists')) {
          context.logger.warn(`⚠ Component ${componentName} already exists, skipping`);
        } else {
          context.logger.error(`✗ Failed to generate component ${componentName}: ${result.error}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        componentName,
        success: false,
        skipped: false,
        error: errorMessage,
      });
      context.logger.error(`✗ Failed to generate component ${componentName}: ${errorMessage}`);
    }
  }

  return results;
}
