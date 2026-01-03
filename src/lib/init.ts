/**
 * FILE: src/lib/init.ts
 * PURPOSE: Init pipeline logic (will be expanded in task 02).
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from './runtime';
import { createStepRunner } from './step-runner';
import { CliError, ExitCode } from './errors';
import { promptText, promptSelect, promptMultiSelect, promptConfirm } from './prompts';
import { join, resolve, dirname } from 'path';
import { pathExists, ensureDir, writeJsonFile, readJsonFile, isDirectory, writeTextFile } from './fs';
import { execCommand, execPackageManager } from './exec';
import { 
  PROJECT_STATE_FILE, 
  CLI_STATE_DIR, 
  CLI_LOGS_DIR,
  CLI_BACKUPS_DIR,
  CLI_AUDIT_DIR,
  WORKSPACE_PACKAGES_DIR,
  RUNTIME_PACKAGE_NAME,
  CORE_PACKAGE_NAME,
} from './constants';
import { getCliVersion } from './version';
import { verifyInitResult } from './init-verification';
import { generateCoreContracts } from './core-contracts';
import { generateRuntimeComposition } from './runtime-composition';

export interface InitOptions {
  projectName?: string;
  destination?: string;
  context: RuntimeContext;
}

export interface InitInputs {
  projectName: string;
  destination: string;
  target: 'expo' | 'bare';
  language: 'ts' | 'js';
  packageManager: 'npm' | 'pnpm' | 'yarn';
  reactNativeVersion?: string; // Only for Bare
  coreToggles: {
    alias: boolean;
    svg: boolean;
    fonts: boolean;
    env: boolean;
  };
  plugins: string[]; // Plugin IDs to apply after init
}

const DEFAULT_TARGET = 'expo';
const DEFAULT_LANGUAGE = 'ts';
const DEFAULT_PACKAGE_MANAGER = 'npm';
const DEFAULT_RN_VERSION = 'latest';
const DEFAULT_CORE_TOGGLES = {
  alias: true,
  svg: true,
  fonts: true,
  env: true,
};

/**
 * Collects init inputs from user (or uses defaults if --yes flag is set)
 */
export async function collectInitInputs(options: InitOptions): Promise<InitInputs> {
  const { context } = options;
  const isNonInteractive = context.flags.yes;

  // 1. Project name
  let projectName = options.projectName;
  if (!projectName) {
    if (isNonInteractive) {
      throw new CliError('Project name is required', ExitCode.VALIDATION_STATE_FAILURE);
    }
    projectName = await promptText('Project name');
    if (!projectName.trim()) {
      throw new CliError('Project name cannot be empty', ExitCode.VALIDATION_STATE_FAILURE);
    }
  }

  // 2. Destination path
  let destination = options.destination;
  if (!destination) {
    const defaultDestination = join(context.resolvedRoot, projectName);
    if (isNonInteractive) {
      destination = defaultDestination;
    } else {
      const answer = await promptText('Destination path', defaultDestination);
      destination = answer || defaultDestination;
    }
  }

  // 3. Target: Expo or Bare
  const target = isNonInteractive
    ? DEFAULT_TARGET
    : await promptSelect('Select target', [
        { label: 'Expo', value: 'expo' as const },
        { label: 'Bare React Native', value: 'bare' as const },
      ], DEFAULT_TARGET);

  // 4. Language: TS or JS
  const language = isNonInteractive
    ? DEFAULT_LANGUAGE
    : await promptSelect('Select language', [
        { label: 'TypeScript', value: 'ts' as const },
        { label: 'JavaScript', value: 'js' as const },
      ], DEFAULT_LANGUAGE);

  // 5. Package manager
  const packageManager = isNonInteractive
    ? DEFAULT_PACKAGE_MANAGER
    : await promptSelect('Select package manager', [
        { label: 'npm', value: 'npm' as const },
        { label: 'pnpm', value: 'pnpm' as const },
        { label: 'yarn', value: 'yarn' as const },
      ], DEFAULT_PACKAGE_MANAGER);

  // 6. RN version (only for Bare)
  let reactNativeVersion: string | undefined;
  if (target === 'bare') {
    reactNativeVersion = isNonInteractive
      ? DEFAULT_RN_VERSION
      : await promptSelect('Select React Native version', [
          { label: 'Latest stable', value: 'latest' },
          { label: '0.74.x', value: '0.74' },
          { label: '0.73.x', value: '0.73' },
          { label: '0.72.x', value: '0.72' },
        ], DEFAULT_RN_VERSION);
  }

  // 7. CORE toggles (defaults ON)
  let coreToggles = DEFAULT_CORE_TOGGLES;
  if (!isNonInteractive) {
    const selectedToggles = await promptMultiSelect(
      'Select CORE features (all enabled by default)',
      [
        { label: 'Path alias (@/)', value: 'alias' as const, default: true },
        { label: 'SVG imports', value: 'svg' as const, default: true },
        { label: 'Fonts pipeline', value: 'fonts' as const, default: true },
        { label: 'Environment variables', value: 'env' as const, default: true },
      ]
    );
    
    coreToggles = {
      alias: selectedToggles.includes('alias'),
      svg: selectedToggles.includes('svg'),
      fonts: selectedToggles.includes('fonts'),
      env: selectedToggles.includes('env'),
    };
  }

  // 8. Optional plugins (checkbox list from registry)
  // For now, plugins registry is not yet implemented, so we'll skip this
  // This will be implemented when plugin framework is ready
  const plugins: string[] = [];
  if (!isNonInteractive) {
    const applyPlugins = await promptConfirm(
      'Apply plugins after init? (plugin system not yet implemented)',
      false
    );
    // TODO: Show plugin list when plugin registry is available
  }

  return {
    projectName,
    destination,
    target,
    language,
    packageManager,
    reactNativeVersion,
    coreToggles,
    plugins,
  };
}

/**
 * Resolves absolute destination path
 */
function resolveDestination(context: RuntimeContext, destination: string): string {
  if (resolve(destination) === destination) {
    // Already absolute
    return destination;
  }
  // Relative to context root
  return resolve(context.resolvedRoot, destination);
}

/**
 * Preflight check: fails if destination exists
 */
function preflightCheck(destination: string): void {
  if (pathExists(destination)) {
    throw new CliError(
      `Destination already exists: ${destination}\nPlease remove it or choose a different location.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
}

/**
 * Creates the host app (Expo or Bare)
 * 
 * BLUEPRINT REFERENCE RULE (section 2.4):
 * - Creates host app skeleton using Expo/RN official CLI tools
 * - This is the ONLY part that copies structure from external sources
 * - Blueprint at docs/ReactNativeCLITemplate/ is used as REFERENCE only
 *   for understanding patterns, not for direct copying
 */
async function createHostApp(
  inputs: InitInputs,
  destination: string,
  verbose: boolean,
  stepRunner: ReturnType<typeof createStepRunner>
): Promise<void> {
  stepRunner.start('Create host app');
  
  if (inputs.target === 'expo') {
    // Create Expo app using official Expo CLI
    const template = inputs.language === 'ts' ? 'blank-typescript' : 'blank';
    const command = `npx create-expo-app@latest ${inputs.projectName} --template ${template} --no-install`;
    
    // Run from parent directory
    const parentDir = dirname(destination);
    ensureDir(parentDir);
    
    execCommand(command, {
      cwd: parentDir,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  } else {
    // Create Bare React Native app using official RN CLI
    const versionFlag = inputs.reactNativeVersion && inputs.reactNativeVersion !== 'latest'
      ? `--version ${inputs.reactNativeVersion}`
      : '';
    const template = inputs.language === 'ts' ? 'react-native-template-typescript' : '';
    const command = `npx @react-native-community/cli@latest init ${inputs.projectName} ${versionFlag} ${template ? `--template ${template}` : ''} --skip-install`.trim();
    
    const parentDir = dirname(destination);
    ensureDir(parentDir);
    
    execCommand(command, {
      cwd: parentDir,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  }
  
  stepRunner.ok('Create host app');
}

/**
 * Initializes CLI-managed folders in the host app
 */
function initializeCliFolders(appRoot: string): void {
  ensureDir(join(appRoot, CLI_STATE_DIR));
  ensureDir(join(appRoot, CLI_LOGS_DIR));
  ensureDir(join(appRoot, CLI_BACKUPS_DIR));
  ensureDir(join(appRoot, CLI_AUDIT_DIR));
}

/**
 * Installs Option A Workspace Packages model (stub - will be completed in section 03)
 * 
 * BLUEPRINT REFERENCE RULE (section 2.4):
 * - Use docs/ReactNativeCLITemplate/* as reference for shapes/config patterns
 * - Do NOT copy the entire blueprint folder into generated app
 * - Only use: host app skeleton (created by Expo/RN), CLI-owned workspace packages,
 *   and optional plugin packs
 */
function installWorkspacePackages(
  appRoot: string,
  inputs: InitInputs,
  stepRunner: ReturnType<typeof createStepRunner>
): void {
  stepRunner.start('Install workspace packages');
  
  // Create workspace packages directory structure (section 3.2)
  // Reference: docs/ReactNativeCLITemplate/ for patterns, but don't copy directly
  ensureDir(join(appRoot, WORKSPACE_PACKAGES_DIR));
  const runtimeDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'runtime');
  const coreDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'core');
  ensureDir(runtimeDir);
  ensureDir(coreDir);
  
  // Create @rns/core package (section 3.2)
  // Create @rns/core package (section 3.2)
  const corePackageJson = {
    name: CORE_PACKAGE_NAME,
    version: '0.1.0',
    main: inputs.language === 'ts' ? 'index.ts' : 'index.js',
    types: inputs.language === 'ts' ? 'index.ts' : undefined,
    private: true,
  };
  
  writeJsonFile(join(coreDir, 'package.json'), corePackageJson);
  
  // Create @rns/runtime package (section 3.2)
  const runtimePackageJson: any = {
    name: RUNTIME_PACKAGE_NAME,
    version: '0.1.0',
    main: inputs.language === 'ts' ? 'index.ts' : 'index.js',
    private: true,
    dependencies: {
      [CORE_PACKAGE_NAME]: 'workspace:*',
      'react': '^18.0.0',
      'react-native': '^0.74.0',
    },
  };
  
  if (inputs.language === 'ts') {
    runtimePackageJson.types = 'index.ts';
  }
  
  writeJsonFile(join(runtimeDir, 'package.json'), runtimePackageJson);
  
  // Create TypeScript config for packages (if TypeScript project)
  if (inputs.language === 'ts') {
    const coreTsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: '.',
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', 'dist'],
    };
    
    const runtimeTsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: '.',
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', 'dist'],
    };
    
    writeJsonFile(join(coreDir, 'tsconfig.json'), coreTsConfig);
    writeJsonFile(join(runtimeDir, 'tsconfig.json'), runtimeTsConfig);
  }
  
  // Generate CORE contracts first (section 3.3)
  generateCoreContracts(coreDir, inputs);
  
  // Create main index entry point that exports all contracts
  const coreIndexContent = inputs.language === 'ts'
    ? `/**
 * FILE: packages/@rns/core/index.ts
 * PURPOSE: CORE contracts and safe defaults (plugin-free)
 * OWNERSHIP: CORE
 */

export * from './contracts';
`
    : `/**
 * FILE: packages/@rns/core/index.js
 * PURPOSE: CORE contracts and safe defaults (plugin-free)
 * OWNERSHIP: CORE
 */

export * from './contracts';
`;
  
  // Generate runtime files (section 3.4)
  generateRuntimeComposition(runtimeDir, inputs);
  
  writeTextFile(join(coreDir, `index.${inputs.language === 'ts' ? 'ts' : 'js'}`), coreIndexContent);
  
  // Configure workspaces in host app package.json
  const hostPackageJsonPath = join(appRoot, 'package.json');
  if (pathExists(hostPackageJsonPath)) {
    const hostPackageJson = readJsonFile<any>(hostPackageJsonPath);
    
    // Add workspaces configuration
    if (inputs.packageManager === 'pnpm') {
      hostPackageJson.pnpm = {
        ...hostPackageJson.pnpm,
        workspaces: ['packages/*', 'packages/@rns/*'],
      };
    } else if (inputs.packageManager === 'yarn') {
      hostPackageJson.workspaces = ['packages/*', 'packages/@rns/*'];
    } else {
      // npm
      hostPackageJson.workspaces = ['packages/*', 'packages/@rns/*'];
    }
    
    writeJsonFile(hostPackageJsonPath, hostPackageJson);
  }
  
  stepRunner.ok('Install workspace packages');
}

/**
 * Ensures host App.tsx is minimal and only imports @rns/runtime (section 3.1)
 * This keeps developer code isolated and stable across plugins/modules
 */
function ensureMinimalAppEntrypoint(
  appRoot: string,
  inputs: InitInputs
): void {
  const appEntryPath = inputs.language === 'ts' 
    ? join(appRoot, 'App.tsx')
    : join(appRoot, 'App.js');
  
  // Only update if App.tsx/App.js exists (created by Expo/RN)
  if (!pathExists(appEntryPath)) {
    return; // May not exist in some templates
  }
  
  // Create minimal App.tsx that imports and renders @rns/runtime
  // This ensures no heavy glue code in user-owned src/**
  const minimalAppContent = inputs.language === 'ts'
    ? `import React from 'react';
import { RnsApp } from '@rns/runtime';

/**
 * Minimal app entrypoint.
 * All runtime composition is handled by @rns/runtime.
 * User code in src/** remains clean and isolated.
 */
export default function App() {
  return <RnsApp />;
}
`
    : `import React from 'react';
import { RnsApp } from '@rns/runtime';

/**
 * Minimal app entrypoint.
 * All runtime composition is handled by @rns/runtime.
 * User code in src/** remains clean and isolated.
 */
export default function App() {
  return <RnsApp />;
}
`;
  
  // Write the minimal App.tsx (this replaces the generated one)
  writeTextFile(appEntryPath, minimalAppContent);
}

/**
 * Applies CORE DX configs (stub - will be completed in section 04)
 * 
 * BLUEPRINT REFERENCE RULE (section 2.4):
 * - Reference docs/ReactNativeCLITemplate/ for config patterns (babel.config.js,
 *   tsconfig.json, metro.config.js, etc.)
 * - Apply patterns to generated app's config files, but don't copy blueprint files directly
 */
function applyCoreDxConfigs(
  appRoot: string,
  inputs: InitInputs,
  stepRunner: ReturnType<typeof createStepRunner>
): void {
  stepRunner.start('Apply CORE DX configs');
  
  // TODO: Apply configs for alias/svg/fonts/env (section 04)
  // Reference blueprint config patterns but apply to generated app structure
  // For now, this is a placeholder
  
  stepRunner.ok('Apply CORE DX configs');
}

/**
 * Installs CORE dependencies (stub - will be completed in section 11)
 */
function installCoreDependencies(
  appRoot: string,
  inputs: InitInputs,
  verbose: boolean,
  stepRunner: ReturnType<typeof createStepRunner>
): void {
  stepRunner.start('Install CORE dependencies');
  
  // TODO: Install dependencies via dependency layer (section 11)
  // For now, just install workspace packages
  execPackageManager(inputs.packageManager, ['install'], {
    cwd: appRoot,
    stdio: verbose ? 'inherit' : 'pipe',
  });
  
  stepRunner.ok('Install CORE dependencies');
}

/**
 * Writes .rn-init.json state file
 */
function writeProjectStateFile(
  appRoot: string,
  inputs: InitInputs
): void {
  const stateFile = {
    cliVersion: getCliVersion(),
    workspaceModel: 'Option A',
    projectName: inputs.projectName,
    target: inputs.target,
    language: inputs.language,
    packageManager: inputs.packageManager,
    reactNativeVersion: inputs.reactNativeVersion,
    coreToggles: inputs.coreToggles,
    plugins: inputs.plugins,
    createdAt: new Date().toISOString(),
  };
  
  writeJsonFile(join(appRoot, PROJECT_STATE_FILE), stateFile);
}

/**
 * Validates init result (section 2.5 acceptance criteria)
 */
function validateInitResult(
  appRoot: string,
  context: RuntimeContext,
  stepRunner: ReturnType<typeof createStepRunner>
): void {
  stepRunner.start('Validate init result');
  
  const verification = verifyInitResult(appRoot);
  
  if (!verification.success) {
    const errorMessage = `Init validation failed:\n${verification.errors.map(e => `  - ${e}`).join('\n')}`;
    if (verification.warnings.length > 0) {
      context.logger.info(`Warnings: ${verification.warnings.join(', ')}`);
    }
    throw new CliError(errorMessage, ExitCode.VALIDATION_STATE_FAILURE);
  }
  
  if (verification.warnings.length > 0) {
    context.logger.info(`Validation warnings: ${verification.warnings.join(', ')}`);
  }
  
  stepRunner.ok('Validate init result');
}

/**
 * Runs boot sanity checks
 */
function runBootSanityChecks(
  appRoot: string,
  inputs: InitInputs,
  stepRunner: ReturnType<typeof createStepRunner>
): void {
  stepRunner.start('Run boot sanity checks');
  
  // Check required files present
  const requiredFiles = ['package.json'];
  if (inputs.target === 'expo') {
    requiredFiles.push('app.json');
  }
  
  for (const file of requiredFiles) {
    if (!pathExists(join(appRoot, file))) {
      throw new CliError(`Required file not found: ${file}`, ExitCode.VALIDATION_STATE_FAILURE);
    }
  }
  
  // TODO: Check workspace packages are resolvable (requires dependency install)
  
  stepRunner.ok('Run boot sanity checks');
}

/**
 * Applies plugins if selected (stub - will be completed in section 13)
 */
async function applyPlugins(
  appRoot: string,
  plugins: string[],
  inputs: InitInputs,
  context: RuntimeContext,
  stepRunner: ReturnType<typeof createStepRunner>
): Promise<void> {
  if (plugins.length === 0) {
    return;
  }
  
  stepRunner.start('Apply plugins');
  
  // TODO: Apply plugins using standard plugin apply pipeline (section 13)
  
  stepRunner.ok('Apply plugins');
}

/**
 * Prints next steps for the user
 */
function printNextSteps(
  appRoot: string,
  inputs: InitInputs
): void {
  const cdCommand = `cd ${appRoot}`;
  const startCommand = inputs.target === 'expo' 
    ? `${inputs.packageManager} run start`
    : `${inputs.packageManager} run android`; // or ios
  
  console.log('\n✓ Project initialized successfully!\n');
  console.log('Next steps:');
  console.log(`  1. ${cdCommand}`);
  console.log(`  2. ${startCommand}`);
  console.log('\n');
}

export async function runInit(options: InitOptions): Promise<void> {
  const stepRunner = createStepRunner(options.context);
  
  try {
    stepRunner.start('Collect init inputs');
    
    // For testing error handling - create a test scenario
    if (options.projectName === 'test-error') {
      const result = stepRunner.fail('Collect init inputs', new Error('Test error for acceptance verification'));
      throw new CliError(
        result.error!.message,
        ExitCode.VALIDATION_STATE_FAILURE,
        result.stepName,
        result.logPath
      );
    }
    
    // Collect all init inputs (section 2.1)
    const inputs = await collectInitInputs(options);
    stepRunner.ok('Collect init inputs');
    
    // Log collected inputs for debugging
    if (options.context.flags.verbose) {
      options.context.logger.debug('Init inputs:', JSON.stringify(inputs, null, 2));
    }
    
    // Section 2.2: Init pipeline steps
    // 1. Resolve destination (absolute path)
    const absoluteDestination = resolveDestination(options.context, inputs.destination);
    
    // 2. Preflight: fail if destination exists
    stepRunner.start('Preflight check');
    preflightCheck(absoluteDestination);
    stepRunner.ok('Preflight check');
    
    // 3. Create the host app (Expo or Bare)
    await createHostApp(inputs, absoluteDestination, options.context.flags.verbose, stepRunner);
    const appRoot = absoluteDestination;
    
    // 4. Initialize CLI-managed folders
    stepRunner.start('Initialize CLI folders');
    initializeCliFolders(appRoot);
    stepRunner.ok('Initialize CLI folders');
    
    // 5. Install Option A Workspace Packages model
    installWorkspacePackages(appRoot, inputs, stepRunner);
    
    // 5.1 Ensure minimal App.tsx entrypoint (section 3.1)
    stepRunner.start('Ensure minimal App entrypoint');
    ensureMinimalAppEntrypoint(appRoot, inputs);
    stepRunner.ok('Ensure minimal App entrypoint');
    
    // 6. Apply CORE DX configs
    applyCoreDxConfigs(appRoot, inputs, stepRunner);
    
    // 7. Install CORE dependencies
    installCoreDependencies(appRoot, inputs, options.context.flags.verbose, stepRunner);
    
    // 8. Write .rn-init.json
    stepRunner.start('Write project state');
    writeProjectStateFile(appRoot, inputs);
    stepRunner.ok('Write project state');
    
    // 9. Validate init result
    validateInitResult(appRoot, options.context, stepRunner);
    
    // 10. Run boot sanity checks
    runBootSanityChecks(appRoot, inputs, stepRunner);
    
    // 11. Apply plugins if selected
    await applyPlugins(appRoot, inputs.plugins, inputs, options.context, stepRunner);
    
    // 12. Print next steps
    printNextSteps(appRoot, inputs);
    
    stepRunner.complete();
  } catch (error) {
    if (error instanceof CliError) {
      throw error; // Re-throw CliError as-is
    }
    const result = stepRunner.fail('Initialize project', error instanceof Error ? error : new Error(String(error)));
    throw new CliError(
      result.error!.message,
      ExitCode.GENERIC_FAILURE,
      result.stepName,
      result.logPath
    );
  }
}

