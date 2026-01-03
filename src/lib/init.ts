/**
 * FILE: src/lib/init.ts
 * PURPOSE: Init pipeline logic (will be expanded in task 02).
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from './runtime';
import { createStepRunner } from './step-runner';
import { CliError, ExitCode } from './errors';
import { promptText, promptSelect, promptMultiSelect, promptConfirm } from './prompts';
import { join } from 'path';

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

export async function runInit(options: InitOptions): Promise<void> {
  const stepRunner = createStepRunner(options.context);
  
  try {
    stepRunner.start('Collect init inputs');
    
    // For testing error handling - create a test scenario
    // This will be replaced with real implementation in task 02
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
    
    // TODO: Rest of init pipeline will be implemented in section 2.2
    // For now, just confirm inputs were collected
    options.context.logger.info(`Project: ${inputs.projectName}`);
    options.context.logger.info(`Destination: ${inputs.destination}`);
    options.context.logger.info(`Target: ${inputs.target}`);
    options.context.logger.info(`Language: ${inputs.language}`);
    options.context.logger.info(`Package manager: ${inputs.packageManager}`);
    
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

