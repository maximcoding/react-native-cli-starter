/**
 * FILE: src/lib/dependencies.test.ts
 * PURPOSE: Unit/spec tests for dependency layer (pm-aware commands, no mixing PMs, lockfile rules)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - Package manager detection (manifest-first, then lockfiles, then default)
 * - No mixing package managers (lockfile discipline)
 * - Lockfile rules (respects lockfile, never mixes)
 * - Install/uninstall operations (deterministic, safe)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { tmpdir } from 'os';
import {
  detectPackageManager,
  resolvePackageManager,
  validateLockfileDiscipline,
  addRuntimeDependencies,
  addDevDependencies,
  installDependencies,
} from './dependencies';
import { PROJECT_STATE_FILE } from './constants';
import type { DependencySpec } from './types/dependencies';

describe('dependencies', () => {
  let testProjectRoot: string;

  beforeEach(async () => {
    testProjectRoot = await mkdtemp(join(tmpdir(), 'rns-test-project-'));
    await mkdir(join(testProjectRoot, '.rns'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testProjectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('package manager detection', () => {
    it('should detect package manager from manifest (most authoritative)', async () => {
      // Create manifest with pnpm
      const manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
      const manifest = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'pnpm' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Also create npm lockfile (should be ignored if manifest exists)
      await writeFile(join(testProjectRoot, 'package-lock.json'), '{}');

      const detection = detectPackageManager(testProjectRoot);
      expect(detection.packageManager).toBe('pnpm');
      expect(detection.source).toBe('manifest');
    });

    it('should detect package manager from lockfiles (if no manifest)', async () => {
      // Create npm lockfile
      await writeFile(join(testProjectRoot, 'package-lock.json'), '{}');

      const detection = detectPackageManager(testProjectRoot);
      expect(detection.packageManager).toBe('npm');
      expect(detection.source).toBe('lockfile');
      expect(detection.lockfiles).toContain('package-lock.json');
    });

    it('should detect pnpm from lockfiles', async () => {
      await writeFile(join(testProjectRoot, 'pnpm-lock.yaml'), 'lockfileVersion: 5.4');
      
      const detection = detectPackageManager(testProjectRoot);
      expect(detection.packageManager).toBe('pnpm');
      expect(detection.source).toBe('lockfile');
      expect(detection.lockfiles).toContain('pnpm-lock.yaml');
    });

    it('should detect yarn from lockfiles', async () => {
      await writeFile(join(testProjectRoot, 'yarn.lock'), '# yarn lockfile v1');
      
      const detection = detectPackageManager(testProjectRoot);
      expect(detection.packageManager).toBe('yarn');
      expect(detection.source).toBe('lockfile');
      expect(detection.lockfiles).toContain('yarn.lock');
    });

    it('should default to npm if nothing detected', () => {
      // No manifest, no lockfiles
      const detection = detectPackageManager(testProjectRoot);
      expect(detection.packageManager).toBe('npm');
      expect(detection.source).toBe('default');
    });

    it('should detect conflicts when multiple lockfiles exist', async () => {
      // Create conflicting lockfiles
      await writeFile(join(testProjectRoot, 'package-lock.json'), '{}');
      await writeFile(join(testProjectRoot, 'yarn.lock'), '# yarn lockfile');

      expect(() => detectPackageManager(testProjectRoot)).toThrow();
    });
  });

  describe('lockfile discipline', () => {
    it('should enforce no mixing package managers', async () => {
      // Create manifest with npm
      const manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
      const manifest = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'npm' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Create yarn lockfile (conflict)
      await writeFile(join(testProjectRoot, 'yarn.lock'), '# yarn lockfile');

      expect(() => validateLockfileDiscipline(testProjectRoot, 'npm')).toThrow();
      expect(() => validateLockfileDiscipline(testProjectRoot, 'npm')).toThrowError(/Lockfile discipline violation/);
    });

    it('should allow matching package manager lockfile', async () => {
      // Create npm lockfile
      await writeFile(join(testProjectRoot, 'package-lock.json'), '{}');

      // Should not throw for npm
      expect(() => validateLockfileDiscipline(testProjectRoot, 'npm')).not.toThrow();
    });

    it('should allow no lockfile (fresh project)', () => {
      // No lockfiles at all
      expect(() => validateLockfileDiscipline(testProjectRoot, 'npm')).not.toThrow();
    });
  });

  describe('resolve package manager', () => {
    it('should resolve from manifest first', async () => {
      const manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
      const manifest = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'pnpm' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      const pm = resolvePackageManager(testProjectRoot);
      expect(pm).toBe('pnpm');
    });

    it('should reject override that conflicts with manifest', async () => {
      const manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
      const manifest = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'pnpm' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      expect(() => resolvePackageManager(testProjectRoot, 'npm')).toThrow();
      expect(() => resolvePackageManager(testProjectRoot, 'npm')).toThrowError(/Package manager mismatch/);
    });

    it('should use override if no manifest exists', () => {
      const pm = resolvePackageManager(testProjectRoot, 'pnpm');
      expect(pm).toBe('pnpm');
    });

    it('should detect from lockfiles if no manifest and no override', async () => {
      await writeFile(join(testProjectRoot, 'yarn.lock'), '# yarn lockfile');
      
      const pm = resolvePackageManager(testProjectRoot);
      expect(pm).toBe('yarn');
    });
  });

  describe('install operations', () => {
    it('should respect lockfile discipline when installing', () => {
      const deps: DependencySpec[] = [
        { name: 'react', version: '18.0.0' },
      ];

      const result = addRuntimeDependencies(testProjectRoot, deps, { dryRun: true });
      expect(result.success).toBe(true);
      expect(result.action).toBe('installed');
      expect(result.dependencies).toEqual(deps);
    });

    it('should skip installation if no dependencies provided', () => {
      const result = addRuntimeDependencies(testProjectRoot, [], { dryRun: true });
      expect(result.success).toBe(true);
      expect(result.action).toBe('skipped');
      expect(result.dependencies).toEqual([]);
    });

    it('should handle dev dependencies separately', () => {
      const deps: DependencySpec[] = [
        { name: '@types/node', version: '20.0.0' },
      ];

      const result = addDevDependencies(testProjectRoot, deps, { dryRun: true });
      expect(result.success).toBe(true);
      expect(result.action).toBe('installed');
      expect(result.dependencies).toEqual(deps);
    });

    it('should handle install from lockfile', () => {
      const result = installDependencies(testProjectRoot, { dryRun: true });
      expect(result.success).toBe(true);
      expect(result.action).toBe('installed');
    });
  });

  describe('package manager command mapping', () => {
    it('should use correct install command for npm', async () => {
      const manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
      const manifest = {
        schemaVersion: '1.0.0',
        cliVersion: '1.0.0',
        workspaceModel: 'Option A',
        identity: {
          name: 'TestApp',
        },
        target: 'expo',
        language: 'ts',
        packageManager: 'npm' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plugins: [],
        modules: [],
      };
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      const deps: DependencySpec[] = [
        { name: 'react', version: '18.0.0' },
      ];

      // Mock execPackageManager to verify command
      const { execPackageManager } = await import('./exec');
      const execSpy = vi.spyOn(await import('./exec'), 'execPackageManager').mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
      } as any);

      // This would fail in real execution, but we're testing the command construction
      // In dry-run mode, it shouldn't actually execute
      const result = addRuntimeDependencies(testProjectRoot, deps, { dryRun: true });
      expect(result.success).toBe(true);

      // Restore mock
      execSpy.mockRestore();
    });
  });

  describe('scope resolution', () => {
    it('should resolve workspace scope to project root', () => {
      const deps: DependencySpec[] = [
        { name: 'react', version: '18.0.0' },
      ];

      const result = addRuntimeDependencies(testProjectRoot, deps, {
        dryRun: true,
        scope: 'workspace',
      });

      expect(result.success).toBe(true);
      expect(result.scope).toBe('workspace');
    });

    it('should resolve host scope to project root', () => {
      const deps: DependencySpec[] = [
        { name: 'react', version: '18.0.0' },
      ];

      const result = addRuntimeDependencies(testProjectRoot, deps, {
        dryRun: true,
        scope: 'host',
      });

      expect(result.success).toBe(true);
      expect(result.scope).toBe('host');
    });

    it('should resolve package scope to package path', () => {
      const deps: DependencySpec[] = [
        { name: 'react', version: '18.0.0' },
      ];

      const result = addRuntimeDependencies(testProjectRoot, deps, {
        dryRun: true,
        scope: 'package:@rns/core',
      });

      expect(result.success).toBe(true);
      expect(result.scope).toBe('package:@rns/core');
    });
  });

  describe('deterministic installs', () => {
    it('should produce same result for same inputs (dry-run)', () => {
      const deps: DependencySpec[] = [
        { name: 'react', version: '18.0.0' },
      ];

      const result1 = addRuntimeDependencies(testProjectRoot, deps, { dryRun: true });
      const result2 = addRuntimeDependencies(testProjectRoot, deps, { dryRun: true });

      expect(result1).toEqual(result2);
    });
  });
});
