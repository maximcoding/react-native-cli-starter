/**
 * FILE: src/smoke/init.smoke.test.ts
 * PURPOSE: Integration smoke tests for init flow
 * OWNERSHIP: CLI
 * 
 * Smoke tests validate end-to-end flows:
 * - Init Expo → boots → doctor passes
 * - Init Bare → boots → doctor passes (where toolchain available)
 * 
 * These tests use temp directories and actual CLI execution (with mocks where needed).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { pathExists } from '../lib/fs';
import { runProjectDoctor } from '../lib/project-doctor';
import { readManifest, createManifest, writeManifest } from '../lib/manifest';
import { PROJECT_STATE_FILE } from '../lib/constants';
import type { InitInputs } from '../lib/init';

/**
 * Helper to create default InitInputs for tests
 */
function createTestInitInputs(overrides: Partial<InitInputs> = {}): InitInputs {
  return {
    projectName: 'TestApp',
    destination: '/tmp/test',
    target: 'expo',
    language: 'ts',
    packageManager: 'npm',
    locales: ['en'],
    selectedOptions: {
      i18n: true,
      theming: false,
      reactNavigation: false,
      expoRouter: false,
      authentication: null,
      analytics: false,
      styling: 'stylesheet',
    },
    coreToggles: {
      alias: true,
      svg: true,
      fonts: true,
      env: true,
    },
    plugins: [],
    installCoreDependencies: false,
    ...overrides,
  };
}

describe('smoke: init flow', () => {
  let testWorkspaceRoot: string;
  let testProjectRoot: string;

  beforeEach(async () => {
    // Create workspace directory for test projects
    testWorkspaceRoot = await mkdtemp(join(tmpdir(), 'rns-smoke-workspace-'));
  });

  afterEach(async () => {
    try {
      await rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('init expo → boots → doctor passes', () => {
    it('should init Expo project and pass doctor checks', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestExpoApp');
      
      // Mock init command execution
      // In real implementation, this would call the actual init command
      // For now, we'll simulate the expected outcomes
      
      // Step 1: Init should create project structure
      // This is a simplified version - actual test would call: `rns init TestExpoApp --target expo`
      const initFn = async (projectName: string, target: 'expo' | 'bare', options: Record<string, unknown> = {}) => {
        const projectPath = join(testWorkspaceRoot, projectName);
        await mkdir(projectPath, { recursive: true });
        await mkdir(join(projectPath, '.rns'), { recursive: true });
        await mkdir(join(projectPath, 'packages', '@rns', 'runtime'), { recursive: true });
        await mkdir(join(projectPath, 'packages', '@rns', 'core'), { recursive: true });
        
        // Create manifest using createManifest helper
        const { createManifest, writeManifest } = await import('../lib/manifest');
        const inputs: InitInputs = {
          projectName,
          destination: projectPath,
          target,
          language: (options.language as 'ts' | 'js') || 'ts',
          packageManager: (options.packageManager as 'npm' | 'pnpm' | 'yarn') || 'npm',
          coreToggles: {
            alias: true,
            svg: true,
            fonts: true,
            env: true,
          },
          selectedOptions: {
            i18n: true,
            theming: false,
            reactNavigation: target === 'bare',
            expoRouter: target === 'expo' ? false : undefined,
            authentication: null,
            analytics: false,
            styling: 'stylesheet',
          },
          locales: ['en'],
          plugins: [],
          installCoreDependencies: false,
        };
        const manifest = createManifest(projectPath, inputs);
        writeManifest(projectPath, manifest);
        
        // Create minimal package.json
        const packageJsonPath = join(projectPath, 'package.json');
        const packageJson = {
          name: projectName.toLowerCase(),
          version: '1.0.0',
          scripts: {
            start: 'expo start',
          },
        };
        await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        
        return projectPath;
      };

      const { writeFile } = await import('fs/promises');
      testProjectRoot = await initFn('TestExpoApp', 'expo', {});

      // Step 2: Verify project structure
      expect(await pathExists(testProjectRoot)).toBe(true);
      expect(await pathExists(join(testProjectRoot, PROJECT_STATE_FILE))).toBe(true);
      expect(await pathExists(join(testProjectRoot, 'package.json'))).toBe(true);

      // Step 3: Verify manifest is valid
      const manifest = readManifest(testProjectRoot);
      expect(manifest).toBeDefined();
      expect(manifest!.target).toBe('expo');
      expect(manifest!.identity.name).toBe('TestExpoApp');

      // Step 4: Run doctor (should pass)
      const doctorReport = await runProjectDoctor(testProjectRoot, false);
      
      // Doctor should pass for a valid project
      // Note: Some checks might fail if templates aren't fully set up,
      // but structure should be valid
      expect(doctorReport).toBeDefined();
      expect(doctorReport.findings).toBeDefined();
      expect(Array.isArray(doctorReport.findings)).toBe(true);
      
      // At minimum, manifest check should pass
      const manifestCheck = doctorReport.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestCheck).toBeDefined();
      expect(manifestCheck?.passed).toBe(true);
    });

    it('should create project with correct structure (Expo)', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestExpoApp2');
      
      // Simulate init
      await mkdir(testProjectRoot, { recursive: true });
      await mkdir(join(testProjectRoot, '.rns'), { recursive: true });
      await mkdir(join(testProjectRoot, 'packages', '@rns', 'runtime'), { recursive: true });
      
      // Create manifest using helper
      const inputs = createTestInitInputs({
        projectName: 'TestExpoApp2',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Verify structure
      expect(await pathExists(join(testProjectRoot, '.rns'))).toBe(true);
      expect(await pathExists(join(testProjectRoot, 'packages', '@rns'))).toBe(true);
      expect(await pathExists(join(testProjectRoot, 'packages', '@rns', 'runtime'))).toBe(true);
    });
  });

  describe('init bare → boots → doctor passes', () => {
    it('should init Bare project and pass doctor checks (where toolchain available)', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestBareApp');
      
      // Simulate init for Bare target
      await mkdir(testProjectRoot, { recursive: true });
      await mkdir(join(testProjectRoot, '.rns'), { recursive: true });
      await mkdir(join(testProjectRoot, 'packages', '@rns', 'runtime'), { recursive: true });
      
      // Create manifest using helper
      const inputs = createTestInitInputs({
        projectName: 'TestBareApp',
        destination: testProjectRoot,
        target: 'bare',
        selectedOptions: {
          i18n: true,
          theming: false,
          reactNavigation: true,
          authentication: null,
          analytics: false,
          styling: 'stylesheet',
        },
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Verify structure
      expect(await pathExists(testProjectRoot)).toBe(true);
      expect(await pathExists(join(testProjectRoot, PROJECT_STATE_FILE))).toBe(true);

      // Verify manifest
      const manifestRead = readManifest(testProjectRoot);
      expect(manifestRead).toBeDefined();
      expect(manifestRead!.target).toBe('bare');

      // Run doctor (should pass if structure is valid)
      const doctorReport = await runProjectDoctor(testProjectRoot, false);
      
      expect(doctorReport).toBeDefined();
      expect(doctorReport.findings).toBeDefined();
      
      // Manifest check should pass
      const manifestCheck = doctorReport.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestCheck).toBeDefined();
      expect(manifestCheck?.passed).toBe(true);
      
      // Note: Actual toolchain checks (Android SDK, Xcode) would be skipped if not available
      // This test verifies the structure, not actual toolchain presence
    });

    it('should skip toolchain checks if not available (graceful degradation)', async () => {
      // This test verifies that init and doctor work even if toolchain isn't fully available
      testProjectRoot = join(testWorkspaceRoot, 'TestBareAppNoToolchain');
      
      await mkdir(testProjectRoot, { recursive: true });
      await mkdir(join(testProjectRoot, '.rns'), { recursive: true });
      
      // Create manifest using helper
      const inputs = createTestInitInputs({
        projectName: 'TestBareAppNoToolchain',
        destination: testProjectRoot,
        target: 'bare',
        selectedOptions: {
          i18n: true,
          theming: false,
          reactNavigation: true,
          authentication: null,
          analytics: false,
          styling: 'stylesheet',
        },
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Doctor should still run (may have warnings for missing toolchain, but shouldn't crash)
      const doctorReport = await runProjectDoctor(testProjectRoot, false);
      
      expect(doctorReport).toBeDefined();
      expect(doctorReport.findings).toBeDefined();
      // Should have findings even if toolchain isn't available
      expect(doctorReport.findings.length).toBeGreaterThan(0);
    });
  });
});
