/**
 * FILE: src/lib/manifest.test.ts
 * PURPOSE: Unit/spec tests for state system (.rns/rn-init.json schema, migrations, invariants)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - Manifest schema validation (correct structure, required fields)
 * - Migration logic (version upgrades)
 * - Invariants (no corruption, version tracking, timestamps)
 * - Read/write operations (idempotent, safe)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import {
  readManifest,
  writeManifest,
  createManifest,
  validateManifest,
  migrateManifest,
  addPluginToManifest,
  removePluginFromManifest,
} from './manifest';
import type { RnsProjectManifest } from './types/manifest';
import { PROJECT_STATE_FILE } from './constants';
import type { InitInputs } from './init';

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

describe('manifest', () => {
  let testProjectRoot: string;
  let manifestPath: string;

  beforeEach(async () => {
    testProjectRoot = await mkdtemp(join(tmpdir(), 'rns-test-project-'));
    manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
    await mkdir(join(testProjectRoot, '.rns'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testProjectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('schema validation', () => {
    it('should validate correct manifest structure', () => {
      const manifest: Partial<RnsProjectManifest> = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'npm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };

      const validation = validateManifest(manifest);
      expect(validation.valid).toBe(true);
    });

    it('should reject manifest with missing required fields', () => {
      const manifest: Partial<RnsProjectManifest> = {
        // Missing schemaVersion, cliVersion, etc.
        target: 'expo',
      };

      const validation = validateManifest(manifest);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors!.length).toBeGreaterThan(0);
    });

    it('should reject manifest with invalid schema version', () => {
      const manifest: Partial<RnsProjectManifest> = {
        schemaVersion: 'invalid-version' as any,
        cliVersion: '1.0.0',
        target: 'expo',
      };

      const validation = validateManifest(manifest);
      expect(validation.valid).toBe(false);
    });

    it('should validate plugin records structure', () => {
      const manifest: Partial<RnsProjectManifest> = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'npm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [
          {
            id: 'auth.firebase',
            version: '1.0.0',
            installedAt: new Date().toISOString(),
          },
        ],
        modules: [],
      };

      const validation = validateManifest(manifest);
      expect(validation.valid).toBe(true);
    });
  });

  describe('migrations', () => {
    it('should handle manifest migration (if schema version changes)', () => {
      // This test verifies migration logic exists
      // Actual migration tests depend on when schema version changes
      const manifest: Partial<RnsProjectManifest> = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        target: 'expo',
        language: 'ts',
        packageManager: 'npm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };

      const migrated = migrateManifest(manifest, '1.0.0');
      // Migration should preserve data when versions match
      expect(migrated).toBeDefined();
    });

    it('should preserve data during migration', () => {
      const manifest: Partial<RnsProjectManifest> = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        target: 'expo',
        language: 'ts',
        packageManager: 'npm',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        plugins: [
          {
            id: 'auth.firebase',
            version: '1.0.0',
            installedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        modules: [],
      };

      const migrated = migrateManifest(manifest, '1.0.0');
      expect(migrated).toBeDefined();
      if (migrated) {
        expect(migrated.target).toBe('expo');
        expect(migrated.plugins?.length).toBe(1);
        expect(migrated.plugins![0].id).toBe('auth.firebase');
      }
    });
  });

  describe('invariants', () => {
    it('should maintain version tracking', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
        target: 'bare',
        navigationPreset: 'stack-tabs',
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

      const read = readManifest(testProjectRoot);
      expect(read).toBeDefined();
      expect(read!.schemaVersion).toBe('1.0.0');
      expect(read!.cliVersion).toBeDefined();
      expect(read!.navigationPreset).toBe('stack-tabs');
    });

    it('should update timestamps on write', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      const originalUpdatedAt = manifest.updatedAt;
      
      writeManifest(testProjectRoot, manifest);

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      writeManifest(testProjectRoot, manifest);
      const read = readManifest(testProjectRoot);
      
      expect(read!.updatedAt).toBeDefined();
      if (read!.updatedAt && originalUpdatedAt) {
        expect(read!.updatedAt).not.toBe(originalUpdatedAt);
        expect(new Date(read!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
      }
    });

    it('should prevent corruption (invalid JSON)', async () => {
      await writeFile(manifestPath, '{ invalid json }');

      expect(() => readManifest(testProjectRoot)).toThrow();
    });

    it('should prevent corruption (missing required fields)', async () => {
      await writeFile(manifestPath, JSON.stringify({ target: 'expo' }));

      expect(() => readManifest(testProjectRoot)).toThrow();
    });
  });

  describe('read/write operations', () => {
    it('should read manifest if exists', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const read = readManifest(testProjectRoot);
      expect(read).toBeDefined();
      expect(read!.identity.name).toBe('TestApp');
      expect(read!.target).toBe('expo');
    });

    it('should return null if manifest does not exist', () => {
      const read = readManifest(testProjectRoot);
      expect(read).toBeNull();
    });

    it('should write manifest safely (idempotent)', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      
      // Write multiple times
      writeManifest(testProjectRoot, manifest);
      writeManifest(testProjectRoot, manifest);
      writeManifest(testProjectRoot, manifest);

      const read = readManifest(testProjectRoot);
      expect(read).toBeDefined();
      expect(read!.identity.name).toBe('TestApp');
    });

    it('should validate before writing', () => {
      const invalidManifest = {
        // Missing required fields
        target: 'expo',
      } as any;

      expect(() => writeManifest(testProjectRoot, invalidManifest)).toThrow();
    });
  });

  describe('plugin management', () => {
    it('should add plugin to manifest', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const updated = addPluginToManifest(testProjectRoot, {
        id: 'auth.firebase',
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      });

      expect(updated).toBe(true);
      
      const read = readManifest(testProjectRoot);
      expect(read!.plugins).toHaveLength(1);
      expect(read!.plugins![0].id).toBe('auth.firebase');
    });

    it('should remove plugin from manifest', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Add plugin first
      addPluginToManifest(testProjectRoot, {
        id: 'auth.firebase',
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      });

      // Remove plugin
      const removed = removePluginFromManifest(testProjectRoot, 'auth.firebase');
      expect(removed).toBe(true);

      const read = readManifest(testProjectRoot);
      expect(read!.plugins).toHaveLength(0);
    });

    it('should be idempotent when adding same plugin twice', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Add plugin
      addPluginToManifest(testProjectRoot, {
        id: 'auth.firebase',
        version: '1.0.0',
        installedAt: new Date().toISOString(),
      });

      // Add same plugin again (should update, not duplicate)
      addPluginToManifest(testProjectRoot, {
        id: 'auth.firebase',
        version: '1.1.0',
        installedAt: new Date().toISOString(),
      });

      const read = readManifest(testProjectRoot);
      expect(read!.plugins).toHaveLength(1); // Should still be one, not two
      expect(read!.plugins![0].version).toBe('1.1.0'); // Should update version
    });

    it('should handle removing non-existent plugin (NO-OP)', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });

      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Remove non-existent plugin (should be safe)
      const removed = removePluginFromManifest(testProjectRoot, 'nonexistent.plugin');
      expect(removed).toBe(false); // Or true if operation succeeded even though nothing removed

      const read = readManifest(testProjectRoot);
      expect(read!.plugins).toHaveLength(0);
    });
  });
});
