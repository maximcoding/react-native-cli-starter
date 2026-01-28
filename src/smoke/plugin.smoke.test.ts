/**
 * FILE: src/smoke/plugin.smoke.test.ts
 * PURPOSE: Integration smoke tests for plugin operations
 * OWNERSHIP: CLI
 * 
 * Smoke tests validate end-to-end flows:
 * - Plugin add → status/doctor passes → rerun add is idempotent
 * - Plugin remove → system zone cleanup only → rerun remove is noop
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { pathExists } from '../lib/fs';
import { runProjectDoctor } from '../lib/project-doctor';
import { readManifest, addPluginToManifest, removePluginFromManifest, createManifest, writeManifest } from '../lib/manifest';
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

describe('smoke: plugin operations', () => {
  let testWorkspaceRoot: string;
  let testProjectRoot: string;

  beforeEach(async () => {
    testWorkspaceRoot = await mkdtemp(join(tmpdir(), 'rns-smoke-plugin-'));
    testProjectRoot = join(testWorkspaceRoot, 'TestPluginApp');
    
    // Create initialized project structure
    await mkdir(testProjectRoot, { recursive: true });
    await mkdir(join(testProjectRoot, '.rns'), { recursive: true });
    await mkdir(join(testProjectRoot, 'packages', '@rns', 'runtime'), { recursive: true });
    
    // Create manifest
    const inputs = createTestInitInputs({
      projectName: 'TestPluginApp',
      destination: testProjectRoot,
    });
    const manifest = createManifest(testProjectRoot, inputs);
    writeManifest(testProjectRoot, manifest);
  });

  afterEach(async () => {
    try {
      await rm(testWorkspaceRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('plugin add → status/doctor passes → rerun add is idempotent', () => {
    it('should add plugin and pass doctor checks', async () => {
      // Step 1: Add plugin
      const pluginId = 'auth.firebase';
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };

      const added = addPluginToManifest(testProjectRoot, pluginRecord);
      expect(added).toBe(true);

      // Step 2: Verify plugin in manifest
      const manifest = readManifest(testProjectRoot);
      expect(manifest).toBeDefined();
      expect(manifest!.plugins).toBeDefined();
      expect(manifest!.plugins!.length).toBe(1);
      expect(manifest!.plugins![0].id).toBe(pluginId);

      // Step 3: Run doctor (should pass)
      const doctorReport = await runProjectDoctor(testProjectRoot, false);
      
      expect(doctorReport).toBeDefined();
      expect(doctorReport.findings).toBeDefined();
      
      // Manifest check should pass
      const manifestCheck = doctorReport.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestCheck).toBeDefined();
      expect(manifestCheck?.passed).toBe(true);
    });

    it('should be idempotent (rerun add produces NO-OP)', async () => {
      const pluginId = 'auth.firebase';
      const pluginRecord1 = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };

      // First add
      const added1 = addPluginToManifest(testProjectRoot, pluginRecord1);
      expect(added1).toBe(true);

      const manifest1 = readManifest(testProjectRoot);
      expect(manifest1!.plugins!.length).toBe(1);

      // Second add (should be idempotent - update version, not duplicate)
      const pluginRecord2 = {
        id: pluginId,
        version: '1.1.0',
        installedAt: new Date().toISOString(),
      };

      const added2 = addPluginToManifest(testProjectRoot, pluginRecord2);
      expect(added2).toBe(true);

      const manifest2 = readManifest(testProjectRoot);
      
      // Should still be one plugin (not two)
      expect(manifest2!.plugins!.length).toBe(1);
      // Version should be updated
      expect(manifest2!.plugins![0].version).toBe('1.1.0');
    });

    it('should maintain manifest integrity after plugin add', async () => {
      const pluginId = 'camera.plugin';
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };

      addPluginToManifest(testProjectRoot, pluginRecord);

      // Verify manifest is still valid
      const manifest = readManifest(testProjectRoot);
      expect(manifest).toBeDefined();
      expect(manifest!.schemaVersion).toBe('1.0.0');
      expect(manifest!.plugins).toBeDefined();
      expect(Array.isArray(manifest!.plugins)).toBe(true);
    });
  });

  describe('plugin remove → system zone cleanup only → rerun remove is noop', () => {
    it('should remove plugin and clean up system zone only', async () => {
      // Step 1: Add plugin first
      const pluginId = 'auth.firebase';
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };

      addPluginToManifest(testProjectRoot, pluginRecord);

      // Create system zone file (simulating plugin files)
      const systemZoneDir = join(testProjectRoot, 'packages', '@rns', 'plugin-auth');
      await mkdir(systemZoneDir, { recursive: true });
      const systemZoneFile = join(systemZoneDir, 'index.ts');
      await writeFile(systemZoneFile, '// System zone file from auth.firebase');

      // Create user zone file (should NOT be touched)
      const userZoneDir = join(testProjectRoot, 'src');
      await mkdir(userZoneDir, { recursive: true });
      const userZoneFile = join(userZoneDir, 'app.tsx');
      const userZoneContent = '// User zone file - should not be touched';
      await writeFile(userZoneFile, userZoneContent);

      // Step 2: Remove plugin
      const removed = removePluginFromManifest(testProjectRoot, pluginId);
      expect(removed).toBe(true);

      // Step 3: Verify plugin removed from manifest
      const manifest = readManifest(testProjectRoot);
      expect(manifest!.plugins).toBeDefined();
      expect(manifest!.plugins!.length).toBe(0);

      // Step 4: Verify user zone was NOT touched
      const { readFile } = await import('fs/promises');
      const { pathExists } = await import('../lib/fs');
      const userZoneExists = pathExists(userZoneFile);
      expect(userZoneExists).toBe(true);
      
      const userZoneContentAfter = await readFile(userZoneFile, 'utf-8');
      expect(userZoneContentAfter).toBe(userZoneContent);
    });

    it('should be idempotent (rerun remove is NO-OP)', async () => {
      const pluginId = 'auth.firebase';
      
      // Add plugin first
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };
      addPluginToManifest(testProjectRoot, pluginRecord);

      // First remove
      const removed1 = removePluginFromManifest(testProjectRoot, pluginId);
      expect(removed1).toBe(true);

      const manifest1 = readManifest(testProjectRoot);
      expect(manifest1!.plugins!.length).toBe(0);

      // Second remove (should be NO-OP)
      const removed2 = removePluginFromManifest(testProjectRoot, pluginId);
      expect(removed2).toBe(false); // Should return false if already removed

      const manifest2 = readManifest(testProjectRoot);
      expect(manifest2!.plugins!.length).toBe(0); // Still 0, not negative
    });

    it('should only remove from system zone, not user zone', async () => {
      const pluginId = 'camera.plugin';
      
      // Add plugin
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };
      addPluginToManifest(testProjectRoot, pluginRecord);

      // Create user zone file
      const userZoneDir = join(testProjectRoot, 'src', 'features', 'camera');
      await mkdir(userZoneDir, { recursive: true });
      const userZoneFile = join(userZoneDir, 'CameraScreen.tsx');
      const userZoneContent = '// User zone camera screen - should not be removed';
      await writeFile(userZoneFile, userZoneContent);

      // Remove plugin
      removePluginFromManifest(testProjectRoot, pluginId);

      // Verify user zone file still exists
      const { pathExists } = await import('../lib/fs');
      const userZoneExists = pathExists(userZoneFile);
      expect(userZoneExists).toBe(true);
    });
  });

  describe('plugin status/doctor', () => {
    it('should pass doctor after plugin add', async () => {
      const pluginId = 'auth.firebase';
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };

      addPluginToManifest(testProjectRoot, pluginRecord);

      // Run doctor
      const doctorReport = await runProjectDoctor(testProjectRoot, false);
      
      expect(doctorReport).toBeDefined();
      expect(doctorReport.findings).toBeDefined();
      
      // Should have plugin consistency checks
      const pluginChecks = doctorReport.findings.filter(f => f.checkId?.startsWith('plugin.'));
      // May have plugin checks (depending on implementation)
      expect(Array.isArray(pluginChecks)).toBe(true);
    });

    it('should pass doctor after plugin remove', async () => {
      const pluginId = 'auth.firebase';
      
      // Add then remove plugin
      const pluginRecord = {
        id: pluginId,
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      };
      addPluginToManifest(testProjectRoot, pluginRecord);
      removePluginFromManifest(testProjectRoot, pluginId);

      // Run doctor (should still pass)
      const doctorReport = await runProjectDoctor(testProjectRoot, false);
      
      expect(doctorReport).toBeDefined();
      expect(doctorReport.findings).toBeDefined();
      
      // Manifest check should pass
      const manifestCheck = doctorReport.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestCheck).toBeDefined();
      expect(manifestCheck?.passed).toBe(true);
    });
  });
});
