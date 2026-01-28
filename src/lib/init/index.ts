/**
 * FILE: src/lib/init/index.ts
 * PURPOSE: Main init pipeline orchestration
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { CliError, ExitCode } from '../errors';
import { createStepRunner } from '../step-runner';
import { collectInitInputs, resolveDestination, preflightCheck } from './collect-inputs';
import { createHostApp, initializeCliFolders, installWorkspacePackages } from './host-app';
import { configureNavigation } from './navigation';
import { configureI18n } from './i18n';
import { configureTheme, configureHooks } from './theme';
import { configureExpoRouter, ensureMinimalAppEntrypoint } from './app-generation';
import { generateStateManagementInfrastructure } from './state';
import { generateDataFetchingInfrastructure } from './data-fetching';
import { generateTransportInfrastructure } from './transport';
import { generateAuthInfrastructure } from './auth';
import { generateRemainingPhase2Infrastructure } from './remaining-phase2';
import {
  configureStyling,
  configureReactNativeWeb,
  configureStyledComponents,
  configureUIKitten,
  configureReactNativePaper,
} from './styling';
import { installCoreDependencies } from './install-dependencies';
import {
  applyCoreDxConfigs,
  writeCoreBaselineMarker,
  writeProjectStateFile,
  validateInitResult,
  verifyMetroConfigLoads,
  runBootSanityChecks,
  applyPlugins,
  printNextSteps,
} from './utils-helpers';
import { generateRuntimeComposition } from '../runtime-composition';
import { generateCiCdWorkflows } from '../cicd-workflows';
import { verifyCoreBaselineAcceptance, verifyGeneratedProjectStructure } from '../init-verification';
import { verifyDxBaselineAcceptance } from '../dx-verification';
import type { InitOptions, InitInputs } from './types';
import type { RuntimeContext } from '../runtime';

/**
 * Main init pipeline orchestration
 * 
 * This is the entry point for the init command. It orchestrates all the
 * initialization steps in the correct order.
 */
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
    // createHostApp returns the actual app root directory where the app was created
    const appRoot = await createHostApp(inputs, absoluteDestination, options.context.flags.verbose, stepRunner);
    
    // 4. Initialize CLI-managed folders
    stepRunner.start('Initialize CLI folders');
    initializeCliFolders(appRoot);
    stepRunner.ok('Initialize CLI folders');
    
    // 5. Install Option A Workspace Packages model (includes App.tsx from templates/base)
    installWorkspacePackages(appRoot, inputs, stepRunner, options.context);

    // 5.0 Section 26, 29: Configure navigation preset and attach navigation files (System Zone) - for both Expo and Bare when React Navigation is selected
    if (inputs.selectedOptions.reactNavigation) {
      stepRunner.start('Configure navigation');
      configureNavigation(appRoot, inputs);
      stepRunner.ok('Configure navigation');
    } else {
      stepRunner.start('Configure navigation');
      stepRunner.ok('Configure navigation (skipped - React Navigation not selected)');
    }
    
    // 5.0.1 Section 28: Generate I18n files (CORE) - only if I18n is selected
    if (inputs.selectedOptions.i18n) {
      stepRunner.start('Configure I18n');
      configureI18n(appRoot, inputs);
      stepRunner.ok('Configure I18n');
    } else {
      stepRunner.start('Configure I18n');
      configureI18n(appRoot, inputs);
      stepRunner.ok('Configure I18n (removed - not selected)');
    }
    
    // 5.0.1.1 Generate runtime composition (overwrites template core-init.ts with conditional I18n import)
    stepRunner.start('Generate runtime composition');
    const runtimeDir = join(appRoot, 'packages', '@rns', 'runtime');
    generateRuntimeComposition(runtimeDir, inputs);
    stepRunner.ok('Generate runtime composition');
    
    // 5.0.2 Section 29: Generate theme files (CORE)
    // Always generate minimal theme files so ThemeProvider can import them
    // Theming option controls whether useTheme hook is generated, not whether theme files exist
    stepRunner.start('Configure theme');
    configureTheme(appRoot, inputs);
    stepRunner.ok('Configure theme');
    
    // 5.0.3 Generate hooks in User Zone (src/hooks/) - always generate if i18n or theming is selected
    if (inputs.selectedOptions.i18n || inputs.selectedOptions.theming) {
      stepRunner.start('Generate hooks');
      configureHooks(appRoot, inputs);
      stepRunner.ok('Generate hooks');
    }
    
    // Note: Authentication and Analytics configuration is NOT done here
    // They should be added via plugin system: rns plugin add auth.firebase, rns plugin add analytics.vexo, etc.
    
    // 5.0.6 Section 29: Configure Expo Router - only if Expo Router is selected and target is Expo
    if (inputs.selectedOptions.expoRouter && inputs.target === 'expo') {
      stepRunner.start('Configure Expo Router');
      configureExpoRouter(appRoot, inputs);
      stepRunner.ok('Configure Expo Router');
    } else {
      stepRunner.start('Configure Expo Router');
      stepRunner.ok('Configure Expo Router (skipped - Expo Router not selected or not Expo target)');
    }
    
    // 5.1. Ensure minimal App.tsx entrypoint (safety net - ensures App.tsx is always correct)
    // This is called after attachment to guarantee App.tsx imports @rns/runtime
    // even if attachment engine has issues or template structure changes
    stepRunner.start('Ensure minimal app entrypoint');
    ensureMinimalAppEntrypoint(appRoot, inputs);
    stepRunner.ok('Ensure minimal app entrypoint');
    
    // 6. Apply CORE DX configs
    applyCoreDxConfigs(appRoot, inputs, stepRunner);
    
    // 6.1 Section 29: Configure Styling - AFTER DX configs to preserve Babel plugins
    // This must run after applyCoreDxConfigs because configureBabelResolver overwrites babel.config.js
    if (inputs.selectedOptions.styling && inputs.selectedOptions.styling !== 'stylesheet') {
      stepRunner.start('Configure styling');
      configureStyling(appRoot, inputs);
      stepRunner.ok('Configure styling');
    } else {
      stepRunner.start('Configure styling');
      stepRunner.ok('Configure styling (skipped - StyleSheet default or not selected)');
    }
    
    // 6.2 Section 30: Configure additional common options
    if (inputs.selectedOptions.reactNativeWeb) {
      stepRunner.start('Configure React Native Web');
      configureReactNativeWeb(appRoot, inputs);
      stepRunner.ok('Configure React Native Web');
    }
    
    if (inputs.selectedOptions.styledComponents) {
      stepRunner.start('Configure Styled Components');
      configureStyledComponents(appRoot, inputs);
      stepRunner.ok('Configure Styled Components');
    }
    
    if (inputs.selectedOptions.uiKitten) {
      stepRunner.start('Configure UI Kitten');
      configureUIKitten(appRoot, inputs);
      stepRunner.ok('Configure UI Kitten');
    }
    
    if (inputs.selectedOptions.reactNativePaper) {
      stepRunner.start('Configure React Native Paper');
      configureReactNativePaper(appRoot, inputs);
      stepRunner.ok('Configure React Native Paper');
    }
    
    // 6.1. Generate CI/CD workflows (CORE capability - section 24)
    stepRunner.start('Generate CI/CD workflows');
    generateCiCdWorkflows(appRoot, inputs);
    stepRunner.ok('Generate CI/CD workflows');
    
    // 7. Install CORE dependencies (if user requested)
    if (inputs.installCoreDependencies) {
      installCoreDependencies(appRoot, inputs, options.context.flags.verbose, stepRunner);
    } else {
      stepRunner.start('Install CORE dependencies');
      stepRunner.ok('Install CORE dependencies (skipped by user)');
    }
    
    // 7.0.1 Section 51: Generate state management infrastructure
    if (inputs.selectedOptions.state) {
      stepRunner.start('Generate state management infrastructure');
      generateStateManagementInfrastructure(appRoot, inputs);
      stepRunner.ok('Generate state management infrastructure');
    }
    
    // 7.0.2 Section 52: Generate data fetching infrastructure
    if (inputs.selectedOptions.dataFetching) {
      stepRunner.start('Generate data fetching infrastructure');
      generateDataFetchingInfrastructure(appRoot, inputs);
      stepRunner.ok('Generate data fetching infrastructure');
    }
    
    // 7.0.3 Section 53: Generate network transport infrastructure
    if (inputs.selectedOptions.transport) {
      stepRunner.start('Generate network transport infrastructure');
      generateTransportInfrastructure(appRoot, inputs);
      stepRunner.ok('Generate network transport infrastructure');
    }
    
    // 7.0.4 Section 54: Generate auth infrastructure
    if (inputs.selectedOptions.auth) {
      stepRunner.start('Generate auth infrastructure');
      generateAuthInfrastructure(appRoot, inputs);
      stepRunner.ok('Generate auth infrastructure');
    }
    
    // 7.0.5 Sections 55-70: Generate remaining Phase 2 infrastructure
    stepRunner.start('Generate remaining Phase 2 infrastructure');
    generateRemainingPhase2Infrastructure(appRoot, inputs);
    stepRunner.ok('Generate remaining Phase 2 infrastructure');
    
    // 7.1 Write CORE baseline audit marker (section 3.6)
    stepRunner.start('Write CORE baseline marker');
    writeCoreBaselineMarker(appRoot, inputs);
    stepRunner.ok('Write CORE baseline marker');
    
    // 8. Write .rn-init.json
    stepRunner.start('Write project state');
    writeProjectStateFile(appRoot, inputs);
    stepRunner.ok('Write project state');
    
    // 9. Validate init result
    validateInitResult(appRoot, options.context, stepRunner);
    
    // 9.1 Verify CORE baseline acceptance criteria (section 3.7)
    stepRunner.start('Verify CORE baseline acceptance');
    const coreAcceptance = verifyCoreBaselineAcceptance(appRoot);
    if (!coreAcceptance.success) {
      const errorMessage = `CORE baseline acceptance verification failed:\n${coreAcceptance.errors.map(e => `  - ${e}`).join('\n')}`;
      if (coreAcceptance.warnings.length > 0) {
        options.context.logger.info(`Warnings: ${coreAcceptance.warnings.join(', ')}`);
      }
      throw new CliError(errorMessage, ExitCode.VALIDATION_STATE_FAILURE);
    }
    if (coreAcceptance.warnings.length > 0) {
      options.context.logger.info(`Acceptance warnings: ${coreAcceptance.warnings.join(', ')}`);
    }
    stepRunner.ok('Verify CORE baseline acceptance');
    
    // 9.2 Verify DX baseline acceptance criteria (section 4.6)
    stepRunner.start('Verify DX baseline acceptance');
    const dxAcceptance = verifyDxBaselineAcceptance(
      appRoot,
      inputs.target,
      inputs.language,
      inputs.coreToggles.alias
    );
    if (!dxAcceptance.success) {
      const errorMessage = `DX baseline acceptance verification failed:\n${dxAcceptance.errors.map((e: string) => `  - ${e}`).join('\n')}`;
      if (dxAcceptance.warnings.length > 0) {
        options.context.logger.info(`Warnings: ${dxAcceptance.warnings.join(', ')}`);
      }
      throw new CliError(errorMessage, ExitCode.VALIDATION_STATE_FAILURE);
    }
    if (dxAcceptance.warnings.length > 0) {
      options.context.logger.info(`DX acceptance warnings: ${dxAcceptance.warnings.join(', ')}`);
    }
    stepRunner.ok('Verify DX baseline acceptance');
    
    // 9.3 Verify metro.config.js loads without errors (after deps installed)
    if (inputs.coreToggles.svg || inputs.target === 'expo') {
      stepRunner.start('Verify metro.config.js loads');
      verifyMetroConfigLoads(appRoot, inputs.target);
      stepRunner.ok('Verify metro.config.js loads');
    }
    
    // 10. Run structural verification (local FS-only, no network)
    stepRunner.start('Verify generated project structure');
    const structureVerification = verifyGeneratedProjectStructure(appRoot, inputs);
    if (!structureVerification.success) {
      const errorMessage = `Structural verification failed:\n${structureVerification.errors.map(e => `  - ${e}`).join('\n')}`;
      if (structureVerification.warnings.length > 0) {
        options.context.logger.info(`Warnings: ${structureVerification.warnings.join(', ')}`);
      }
      throw new CliError(errorMessage, ExitCode.VALIDATION_STATE_FAILURE);
    }
    if (structureVerification.warnings.length > 0) {
      options.context.logger.info(`Structure warnings: ${structureVerification.warnings.join(', ')}`);
    }
    stepRunner.ok('Verify generated project structure');
    
    // 11. Run boot sanity checks
    runBootSanityChecks(appRoot, inputs, stepRunner);
    
    // 12. Apply plugins if selected
    await applyPlugins(appRoot, inputs.plugins, inputs, options.context, stepRunner);
    
    // 13. Print next steps
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

// Re-export types and functions for backward compatibility
export type { InitOptions, InitInputs } from './types';
export { collectInitInputs, resolveDestination, preflightCheck } from './collect-inputs';
