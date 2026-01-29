/**
 * FILE: src/lib/init/host-app.ts
 * PURPOSE: Host app creation and workspace setup
 * OWNERSHIP: CLI
 */

import { join, dirname } from 'path';
import { CliError, ExitCode } from '../errors';
import { pathExists, ensureDir, isDirectory, readJsonFile, writeJsonFile } from '../fs';
import { execCommand } from '../exec';
import { createStepRunner } from '../step-runner';
import { 
  CLI_STATE_DIR,
  CLI_LOGS_DIR,
  CLI_BACKUPS_DIR,
  CLI_AUDIT_DIR,
  CORE_PACKAGE_NAME,
} from '../constants';
import { attachPack } from '../attachment-engine';
import { loadPackManifest } from '../pack-manifest';
import { resolvePackVariant, normalizeOptionsKey } from '../pack-variants';
import { resolvePackSourcePath } from '../pack-locations';
import type { InitInputs } from './types';
import type { RuntimeContext } from '../runtime';

/**
 * Creates the host app (Expo or Bare)
 * 
 * BLUEPRINT REFERENCE RULE (section 2.4):
 * - Creates host app skeleton using Expo/RN official CLI tools
 * - This is the ONLY part that copies structure from external sources
 * - Blueprint at docs/ReactNativeCLITemplate/ is used as REFERENCE only
 *   for understanding patterns, not for direct copying
 */
export async function createHostApp(
  inputs: InitInputs,
  destination: string,
  verbose: boolean,
  stepRunner: ReturnType<typeof createStepRunner>
): Promise<string> {
  stepRunner.start('Create host app');
  
  // The CLI tools (create-expo-app/react-native init) create app in cwd/projectName
  // So we need to ensure destination points to where the app will actually be created
  let actualDestination: string;
  let parentDir: string;
  
  // If destination ends with project name, use it as-is
  if (destination.endsWith(inputs.projectName)) {
    actualDestination = destination;
    parentDir = dirname(destination);
  } else {
    // Destination is a parent directory, app will be created at destination/projectName
    actualDestination = join(destination, inputs.projectName);
    parentDir = destination;
  }
  
  ensureDir(parentDir);
  
  if (inputs.target === 'expo') {
    // Create Expo app using official Expo CLI
    const template = inputs.language === 'ts' ? 'blank-typescript' : 'blank';
    // Use --yes flag to skip prompts, and create in current directory with project name
    const command = `npx --yes create-expo-app@latest ${inputs.projectName} --template ${template} --no-install`;
    
    try {
      execCommand(command, {
        cwd: parentDir,
        stdio: verbose ? 'inherit' : 'pipe',
      });
    } catch (error) {
      throw new CliError(
        `Failed to create Expo app: ${error instanceof Error ? error.message : String(error)}\n` +
        `Command: ${command}\n` +
        `Working directory: ${parentDir}`,
        ExitCode.GENERIC_FAILURE
      );
    }
  } else {
    // Create Bare React Native app using official RN CLI
    // Note: TypeScript is now the default, no need for --template flag
    const versionFlag = inputs.reactNativeVersion && inputs.reactNativeVersion !== 'latest'
      ? `--version ${inputs.reactNativeVersion}`
      : '';
    // Use --skip-install to skip npm install, we'll handle it later
    // No --template flag needed - TypeScript/JavaScript is detected automatically
    const command = `npx --yes @react-native-community/cli@latest init ${inputs.projectName} ${versionFlag} --skip-install`.trim();
    
    try {
      execCommand(command, {
        cwd: parentDir,
        stdio: verbose ? 'inherit' : 'pipe',
      });
    } catch (error) {
      throw new CliError(
        `Failed to create Bare React Native app: ${error instanceof Error ? error.message : String(error)}\n` +
        `Command: ${command}\n` +
        `Working directory: ${parentDir}`,
        ExitCode.GENERIC_FAILURE
      );
    }
  }
  
  // Verify the app was actually created
  if (!pathExists(actualDestination) || !isDirectory(actualDestination)) {
    throw new CliError(
      `App creation failed: expected app directory not found at ${actualDestination}\n` +
      `Please check the command output above for errors.`,
      ExitCode.GENERIC_FAILURE
    );
  }
  
  // Verify essential files exist (package.json, App.tsx/App.js)
  const packageJsonPath = join(actualDestination, 'package.json');
  
  if (!pathExists(packageJsonPath)) {
    throw new CliError(
      `App creation incomplete: package.json not found at ${packageJsonPath}\n` +
      `The generated app may be corrupted or incomplete.`,
      ExitCode.GENERIC_FAILURE
    );
  }
  
  // Verify app entry point exists (check for both TS and JS - React Native CLI may create either)
  const appEntryTs = join(actualDestination, 'App.tsx');
  const appEntryJs = join(actualDestination, 'App.js');
  
  if (!pathExists(appEntryTs) && !pathExists(appEntryJs)) {
    throw new CliError(
      `App creation incomplete: App entry point not found at ${appEntryTs} or ${appEntryJs}\n` +
      `Expected either App.tsx or App.js in the generated app root.\n` +
      `The generated app may be corrupted or incomplete.`,
      ExitCode.GENERIC_FAILURE
    );
  }
  
  stepRunner.ok('Create host app');
  
  // Return the actual app root directory
  return actualDestination;
}

/**
 * Initializes CLI-managed folders in the host app
 */
export function initializeCliFolders(appRoot: string): void {
  ensureDir(join(appRoot, CLI_STATE_DIR));
  ensureDir(join(appRoot, CLI_LOGS_DIR));
  ensureDir(join(appRoot, CLI_BACKUPS_DIR));
  ensureDir(join(appRoot, CLI_AUDIT_DIR));
}

/**
 * Installs Option A Workspace Packages model using attachment engine (section 05, 06)
 * 
 * BLUEPRINT REFERENCE RULE (section 2.4):
 * - Use docs/ReactNativeCLITemplate/* as reference for shapes/config patterns
 * - Do NOT copy the entire blueprint folder into generated app
 * - Only use: host app skeleton (created by Expo/RN), CLI-owned workspace packages,
 *   and optional plugin packs
 * 
 * TEMPLATES REQUIRED (section 05):
 * - Must use templates/base via attachment engine
 * - Do NOT generate packages directly - use attachPack() instead
 */
export function installWorkspacePackages(
  appRoot: string,
  inputs: InitInputs,
  stepRunner: ReturnType<typeof createStepRunner>,
  context: RuntimeContext
): void {
  stepRunner.start('Install workspace packages via attachment engine');
  
  try {
    // Load base pack manifest (section 5.2)
    const basePackPath = resolvePackSourcePath('core', 'base');
    const manifest = loadPackManifest(basePackPath);
    
    // Resolve pack variant (section 5.3)
    const variantPath = resolvePackVariant('base', 'core', manifest, {
      target: inputs.target,
      language: inputs.language,
      packType: 'core',
      normalizedOptionsKey: normalizeOptionsKey(inputs.coreToggles),
    });
    
    // Attach base pack using attachment engine (section 6.1)
    const attachmentReport = attachPack({
      projectRoot: appRoot,
      packManifest: manifest,
      resolvedPackPath: variantPath,
      target: inputs.target,
      language: inputs.language,
      mode: 'CORE',
      options: inputs.coreToggles,
      dryRun: false,
    });
    
    // Log attachment report using context logger
    if (attachmentReport.created.length > 0) {
      context.logger.debug(`Created ${attachmentReport.created.length} files`);
    }
    if (attachmentReport.updated.length > 0) {
      context.logger.debug(`Updated ${attachmentReport.updated.length} files`);
    }
    if (attachmentReport.conflicts.length > 0) {
      throw new CliError(
        `Attachment conflicts detected:\n${attachmentReport.conflicts.map(f => `  - ${f}`).join('\n')}\n` +
        `These files are user-owned and cannot be overwritten.`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
    
    // Post-process: Update package.json files to use file: protocol for npm (fix workspace:* issue)
    updatePackageJsonDepsForNpm(appRoot, inputs);
    
    // Configure workspaces in host app package.json
    configureWorkspacesInHostPackageJson(appRoot, inputs);
    
    stepRunner.ok('Install workspace packages via attachment engine');
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(
      `Failed to install workspace packages: ${error instanceof Error ? error.message : String(error)}`,
      ExitCode.GENERIC_FAILURE
    );
  }
}

/**
 * Updates package.json files in workspace packages to use file: protocol for npm
 * This fixes the workspace:* issue where npm doesn't support workspace protocol
 */
function updatePackageJsonDepsForNpm(
  appRoot: string,
  inputs: InitInputs
): void {
  // Only need to update if using npm
  if (inputs.packageManager !== 'npm') {
    return;
  }
  
  // Update runtime package.json to use file: for @rns/core
  const runtimePackageJsonPath = join(appRoot, 'packages', '@rns', 'runtime', 'package.json');
  if (pathExists(runtimePackageJsonPath)) {
    const runtimePackageJson = readJsonFile<any>(runtimePackageJsonPath);
    
    // Replace workspace:* with file:../core for npm
    if (runtimePackageJson.dependencies && runtimePackageJson.dependencies[CORE_PACKAGE_NAME]) {
      const currentDep = runtimePackageJson.dependencies[CORE_PACKAGE_NAME];
      if (currentDep === 'workspace:*' || currentDep.startsWith('workspace:')) {
        runtimePackageJson.dependencies[CORE_PACKAGE_NAME] = 'file:../core';
        writeJsonFile(runtimePackageJsonPath, runtimePackageJson);
      }
    }
  }
}

/**
 * Configures workspaces in host app package.json
 */
function configureWorkspacesInHostPackageJson(
  appRoot: string,
  inputs: InitInputs
): void {
  const hostPackageJsonPath = join(appRoot, 'package.json');
  if (!pathExists(hostPackageJsonPath)) {
    return;
  }
  
  const hostPackageJson = readJsonFile<any>(hostPackageJsonPath);
  
  // Ensure private: true (required for workspace packages)
  hostPackageJson.private = true;
  
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
