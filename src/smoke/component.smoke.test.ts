/**
 * FILE: src/smoke/component.smoke.test.ts
 * PURPOSE: Integration smoke tests for component generation (Section 25)
 * OWNERSHIP: CLI
 * 
 * Smoke tests validate end-to-end flows:
 * - Component generation for TypeScript projects
 * - Component generation for JavaScript projects
 * - UI framework detection works
 * - Component name validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { pathExists, readTextFile } from '../lib/fs';
import { addComponents } from '../lib/component';
import { createManifest, writeManifest, addPluginToManifest } from '../lib/manifest';
import { createRuntimeContext } from '../lib/runtime';
import { ConsoleLogger } from '../lib/logger';
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
import type { RuntimeContext } from '../lib/runtime';

describe('smoke: component generation (Section 25)', () => {
  let testWorkspaceRoot: string;
  let testProjectRoot: string;
  let context: RuntimeContext;

  beforeEach(async () => {
    testWorkspaceRoot = await mkdtemp(join(tmpdir(), 'rns-smoke-component-'));
    testProjectRoot = join(testWorkspaceRoot, 'TestComponentApp');
    await mkdir(testProjectRoot, { recursive: true });
    await mkdir(join(testProjectRoot, 'src'), { recursive: true });

    // Create logger for context
    const logger = new ConsoleLogger(false);

    // Create runtime context
    context = createRuntimeContext(
      testProjectRoot,
      { yes: false, verbose: false, dryRun: false },
      logger,
      'test-run-id'
    );
  });

  afterEach(async () => {
    try {
      await rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('component generation for TypeScript projects', () => {
    it('should generate TypeScript components', async () => {
      // Create manifest for TypeScript project
      const inputs = createTestInitInputs({
        projectName: 'TestComponentApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Generate component
      const results = await addComponents(
        ['TestButton'],
        { dryRun: false },
        context
      );

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].componentName).toBe('TestButton');

      // Verify component file exists (.tsx for TypeScript)
      const componentPath = join(testProjectRoot, 'src', 'components', 'TestButton.tsx');
      expect(await pathExists(componentPath)).toBe(true);

      // Verify component content
      const componentContent = readTextFile(componentPath);
      expect(componentContent).toContain('export function TestButton');
      expect(componentContent).toContain('interface TestButtonProps');
      expect(componentContent).toContain('React.JSX.Element');

      // Verify index.ts was created/updated
      const indexPath = join(testProjectRoot, 'src', 'components', 'index.ts');
      expect(await pathExists(indexPath)).toBe(true);
      const indexContent = readTextFile(indexPath);
      expect(indexContent).toContain("export { TestButton }");
    });
  });

  describe('component generation for JavaScript projects', () => {
    it('should generate JavaScript components', async () => {
      // Create manifest for JavaScript project
      const inputs = createTestInitInputs({
        projectName: 'TestComponentAppJS',
        destination: testProjectRoot,
        language: 'js',
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Generate component
      const results = await addComponents(
        ['TestInput'],
        { dryRun: false },
        context
      );

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].componentName).toBe('TestInput');

      // Verify component file exists (.jsx for JavaScript)
      const componentPath = join(testProjectRoot, 'src', 'components', 'TestInput.jsx');
      expect(await pathExists(componentPath)).toBe(true);

      // Verify component content
      const componentContent = readTextFile(componentPath);
      expect(componentContent).toContain('export function TestInput');
      // JavaScript components use JSDoc, not TypeScript interfaces
      expect(componentContent).toMatch(/@param|@returns/);
    });
  });

  describe('component name validation', () => {
    beforeEach(async () => {
      // Setup project for validation tests
      const inputs = createTestInitInputs({
        projectName: 'TestComponentApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);
    });

    it('should reject invalid component names', async () => {
      // Test lowercase name (should fail)
      const results1 = await addComponents(
        ['invalidName'],
        { dryRun: false },
        context
      );
      expect(results1[0].success).toBe(false);
      expect(results1[0].error).toContain('uppercase');

      // Test name with spaces (should fail)
      const results2 = await addComponents(
        ['Invalid Name'],
        { dryRun: false },
        context
      );
      expect(results2[0].success).toBe(false);
      expect(results2[0].error).toBeDefined();

      // Test empty name (should fail)
      const results3 = await addComponents(
        [''],
        { dryRun: false },
        context
      );
      expect(results3[0].success).toBe(false);
      expect(results3[0].error).toContain('empty');
    });

    it('should accept valid PascalCase component names', async () => {
      const results = await addComponents(
        ['ValidComponent'],
        { dryRun: false },
        context
      );
      expect(results[0].success).toBe(true);
    });
  });

  describe('idempotency', () => {
    beforeEach(async () => {
      const inputs = createTestInitInputs({
        projectName: 'TestComponentApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);
    });

    it('should skip if component already exists', async () => {
      // First generation
      const results1 = await addComponents(
        ['ExistingComponent'],
        { dryRun: false },
        context
      );
      expect(results1[0].success).toBe(true);
      expect(results1[0].skipped).toBe(false);

      // Second generation (should skip)
      const results2 = await addComponents(
        ['ExistingComponent'],
        { dryRun: false },
        context
      );
      expect(results2[0].success).toBe(false);
      expect(results2[0].skipped).toBe(true);
      expect(results2[0].error).toContain('already exists');
    });
  });

  describe('UI framework detection', () => {
    it('should detect installed UI framework plugins', async () => {
      const inputs = createTestInitInputs({
        projectName: 'TestComponentApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Add a UI framework plugin (simulate)
      addPluginToManifest(testProjectRoot, {
        id: 'ui.paper',
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      });

      // Generate component (should detect UI framework)
      // Note: Current implementation generates generic components regardless of UI framework
      // This test verifies the function runs without error when UI framework is present
      const results = await addComponents(
        ['TestComponent'],
        { dryRun: false },
        context
      );
      
      expect(results[0].success).toBe(true);
      // UI framework detection happens but doesn't change generation behavior currently
      // (as per implementation, it logs but generates generic components)
    });
  });

  describe('component directory detection', () => {
    it('should use src/app/components if available', async () => {
      const inputs = createTestInitInputs({
        projectName: 'TestComponentApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Create src/app/components directory (preferred)
      await mkdir(join(testProjectRoot, 'src', 'app', 'components'), { recursive: true });

      const results = await addComponents(
        ['PreferredComponent'],
        { dryRun: false },
        context
      );

      expect(results[0].success).toBe(true);
      
      // Component should be in src/app/components (not src/components)
      const preferredPath = join(testProjectRoot, 'src', 'app', 'components', 'PreferredComponent.tsx');
      const fallbackPath = join(testProjectRoot, 'src', 'components', 'PreferredComponent.tsx');
      
      expect(await pathExists(preferredPath)).toBe(true);
      expect(await pathExists(fallbackPath)).toBe(false);
    });
  });
});
