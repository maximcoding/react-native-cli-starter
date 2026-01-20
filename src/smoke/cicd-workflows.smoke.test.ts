/**
 * FILE: src/smoke/cicd-workflows.smoke.test.ts
 * PURPOSE: Integration smoke tests for CI/CD workflow generation (Section 24)
 * OWNERSHIP: CLI
 * 
 * Smoke tests validate end-to-end flows:
 * - CI/CD workflows are generated during init
 * - Expo workflows use EAS, Bare workflows use Gradle/Xcode
 * - Idempotency (regenerating doesn't duplicate)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { pathExists, readTextFile } from '../lib/fs';
import { generateCiCdWorkflows } from '../lib/cicd-workflows';
import { createManifest, writeManifest } from '../lib/manifest';
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

describe('smoke: CI/CD workflow generation (Section 24)', () => {
  let testWorkspaceRoot: string;
  let testProjectRoot: string;

  beforeEach(async () => {
    testWorkspaceRoot = await mkdtemp(join(tmpdir(), 'rns-smoke-cicd-'));
  });

  afterEach(async () => {
    try {
      await rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('workflow generation during init', () => {
    it('should generate workflows for Expo target', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestExpoApp');
      await mkdir(testProjectRoot, { recursive: true });

      // Create manifest
      const inputs = createTestInitInputs({
        projectName: 'TestExpoApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Generate workflows
      generateCiCdWorkflows(testProjectRoot, inputs);

      // Verify workflow file exists
      const workflowPath = join(testProjectRoot, '.github', 'workflows', 'ci.yml');
      expect(await pathExists(workflowPath)).toBe(true);

      // Verify workflow content uses EAS (for Expo)
      const workflowContent = readTextFile(workflowPath);
      // Expo workflow should contain EAS-related steps
      expect(workflowContent.toLowerCase()).toMatch(/eas|expo/i);
    });

    it('should generate workflows for Bare target', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestBareApp');
      await mkdir(testProjectRoot, { recursive: true });

      // Create manifest
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

      // Generate workflows
      generateCiCdWorkflows(testProjectRoot, inputs);

      // Verify workflow file exists
      const workflowPath = join(testProjectRoot, '.github', 'workflows', 'ci.yml');
      expect(await pathExists(workflowPath)).toBe(true);

      // Verify workflow content uses Gradle/Xcode (for Bare)
      const workflowContent = readTextFile(workflowPath);
      // Bare workflow should mention gradle or xcode or android/ios builds
      const hasGradleXcode = workflowContent.includes('gradle') || 
                             workflowContent.includes('xcode') ||
                             workflowContent.includes('android') ||
                             workflowContent.includes('ios');
      expect(hasGradleXcode).toBe(true);
    });
  });

  describe('idempotency', () => {
    it('should not duplicate workflows when regenerating', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestIdempotentApp');
      await mkdir(testProjectRoot, { recursive: true });

      // Create manifest
      const inputs = createTestInitInputs({
        projectName: 'TestIdempotentApp',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // First generation
      generateCiCdWorkflows(testProjectRoot, inputs);
      const workflowPath = join(testProjectRoot, '.github', 'workflows', 'ci.yml');
      expect(await pathExists(workflowPath)).toBe(true);
      const firstContent = readTextFile(workflowPath);

      // Second generation (should be idempotent - no change)
      generateCiCdWorkflows(testProjectRoot, inputs);
      expect(await pathExists(workflowPath)).toBe(true);
      const secondContent = readTextFile(workflowPath);

      // Content should be identical (idempotent)
      expect(secondContent).toBe(firstContent);
    });
  });

  describe('workflow content validation', () => {
    it('should generate valid YAML workflow file', async () => {
      testProjectRoot = join(testWorkspaceRoot, 'TestValidWorkflow');
      await mkdir(testProjectRoot, { recursive: true });

      const inputs = createTestInitInputs({
        projectName: 'TestValidWorkflow',
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      generateCiCdWorkflows(testProjectRoot, inputs);

      const workflowPath = join(testProjectRoot, '.github', 'workflows', 'ci.yml');
      const workflowContent = readTextFile(workflowPath);

      // Basic YAML structure validation
      expect(workflowContent).toContain('name:');
      expect(workflowContent).toContain('on:');
      expect(workflowContent).toContain('jobs:');
      
      // Should have quality and test jobs at minimum
      expect(workflowContent).toMatch(/quality|test/i);
    });
  });
});
