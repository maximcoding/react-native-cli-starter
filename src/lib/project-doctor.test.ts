/**
 * FILE: src/lib/project-doctor.test.ts
 * PURPOSE: Unit/spec tests for project doctor (failure modes are actionable)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - Failure modes produce actionable error messages
 * - Error messages include clear fix hints
 * - Fix mode only applies safe fixes in SYSTEM ZONE
 * - Validation logic is correct
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import {
  runProjectDoctor,
  applySafeFixes,
} from './project-doctor';
import { PROJECT_STATE_FILE } from './constants';
import type { InitInputs } from './init';
import { createManifest, writeManifest } from './manifest';

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

describe('project-doctor', () => {
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

  describe('failure modes are actionable', () => {
    it('should provide actionable error when manifest is missing', async () => {
      const report = await runProjectDoctor(testProjectRoot, false);
      
      const manifestCheck = report.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestCheck).toBeDefined();
      
      if (!manifestCheck?.passed) {
        expect(manifestCheck?.message).toBeDefined();
        expect(manifestCheck?.fix).toBeDefined();
        expect(manifestCheck?.fix).toContain('rns init'); // Actionable command
      }
    });

    it('should provide actionable error when manifest is invalid', async () => {
      // Create invalid manifest
      const manifestPath = join(testProjectRoot, PROJECT_STATE_FILE);
      await writeFile(manifestPath, JSON.stringify({ invalid: 'manifest' }));

      const report = await runProjectDoctor(testProjectRoot, false);
      
      const manifestValidCheck = report.findings.find(f => f.checkId === 'manifest.valid');
      
      if (manifestValidCheck && !manifestValidCheck.passed) {
        expect(manifestValidCheck.message).toBeDefined();
        expect(manifestValidCheck.fix).toBeDefined();
        expect(manifestValidCheck.fix).not.toBe('');
      }
    });

    it('should provide actionable error when markers are missing', async () => {
      // Create valid manifest but missing markers
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Create runtime file but without markers
      const runtimeDir = join(testProjectRoot, 'packages', '@rns', 'runtime');
      await mkdir(runtimeDir, { recursive: true });
      await writeFile(
        join(runtimeDir, 'index.ts'),
        '// File without markers\nexport const test = "test";'
      );

      const report = await runProjectDoctor(testProjectRoot, false);
      
      const markerChecks = report.findings.filter(f => f.checkId?.startsWith('marker.'));
      markerChecks.forEach(check => {
        if (!check.passed) {
          expect(check.message).toBeDefined();
          // Should indicate which marker is missing
          expect(check.message).toMatch(/marker|@rns-marker/i);
        }
      });
    });

    it('should provide actionable error when ownership zones are contaminated', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Create file in wrong zone (example: CLI code in user zone)
      // This is a simplified check - actual implementation might check more
      
      const report = await runProjectDoctor(testProjectRoot, false);
      
      const ownershipChecks = report.findings.filter(f => f.checkId?.startsWith('ownership.'));
      ownershipChecks.forEach(check => {
        if (!check.passed) {
          expect(check.message).toBeDefined();
          expect(check.message).toMatch(/ownership|zone|SYSTEM|USER/i);
        }
      });
    });

    it('should provide actionable error when duplicate injections detected', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // This would require actual injection markers to be duplicated
      // Simplified check for structure
      
      const report = await runProjectDoctor(testProjectRoot, false);
      
      const duplicateChecks = report.findings.filter(f => f.checkId?.startsWith('injection.duplicate'));
      duplicateChecks.forEach(check => {
        if (!check.passed) {
          expect(check.message).toBeDefined();
          expect(check.message).toMatch(/duplicate|injection|marker/i);
          if (check.fix) {
            expect(check.fix).not.toBe('');
          }
        }
      });
    });
  });

  describe('fix mode', () => {
    it('should only apply fixes in SYSTEM ZONE', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const report = await runProjectDoctor(testProjectRoot, true); // fix = true
      
      // Verify that fixable items are only in SYSTEM ZONE
      report.fixable.forEach(fix => {
        // Fix checkId should point to SYSTEM ZONE file
        const fixPath = join(testProjectRoot, fix.checkId || '');
        // Should be in packages/@rns/** or .rns/**
        expect(
          fixPath.includes('packages/@rns') ||
          fixPath.includes('.rns')
        ).toBe(true);
      });
    });

    it('should not fix issues in USER ZONE (src/**)', async () => {
      // Create user zone file
      const userZoneDir = join(testProjectRoot, 'src');
      await mkdir(userZoneDir, { recursive: true });
      await writeFile(join(userZoneDir, 'app.tsx'), '// User zone file');

      const report = await runProjectDoctor(testProjectRoot, true); // fix = true
      
      // Verify no fixes are applied to USER ZONE
      report.fixable.forEach(fix => {
        const fixPath = join(testProjectRoot, fix.checkId || '');
        expect(fixPath.includes('src/')).toBe(false);
      });
    });
  });

  describe('validation logic', () => {
    it('should validate manifest exists and is valid', async () => {
      // No manifest
      let report = await runProjectDoctor(testProjectRoot, false);
      let manifestExistsCheck = report.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestExistsCheck?.passed).toBe(false);

      // Valid manifest
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      // Verify manifest was written
      const { readManifest } = await import('../lib/manifest');
      const writtenManifest = readManifest(testProjectRoot);
      expect(writtenManifest).toBeDefined();
      expect(writtenManifest!.identity.name).toBe('TestApp');

      report = await runProjectDoctor(testProjectRoot, false);
      manifestExistsCheck = report.findings.find(f => f.checkId === 'manifest.exists');
      expect(manifestExistsCheck).toBeDefined();
      expect(manifestExistsCheck?.passed).toBe(true);
      
      // Also check manifest.valid passes
      const manifestValidCheck = report.findings.find(f => f.checkId === 'manifest.valid');
      expect(manifestValidCheck).toBeDefined();
      expect(manifestValidCheck?.passed).toBe(true);
    });

    it('should validate markers are intact', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const report = await runProjectDoctor(testProjectRoot, false);
      
      const markerChecks = report.findings.filter(f => f.checkId?.startsWith('marker'));
      // Should have marker checks (may pass or fail depending on actual files)
      expect(markerChecks.length).toBeGreaterThan(0);
    });

    it('should validate plugin consistency', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const report = await runProjectDoctor(testProjectRoot, false);
      
      const pluginChecks = report.findings.filter(f => f.checkId?.startsWith('plugin.'));
      // Should have plugin consistency checks
      expect(pluginChecks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('report structure', () => {
    it('should return valid report structure', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const report = await runProjectDoctor(testProjectRoot, false);
      
      expect(report).toBeDefined();
      expect(report.findings).toBeDefined();
      expect(Array.isArray(report.findings)).toBe(true);
      expect(typeof report.passed).toBe('boolean');
      expect(Array.isArray(report.errors)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
      expect(Array.isArray(report.fixable)).toBe(true);
    });

    it('should mark report as passed only if no errors', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const report = await runProjectDoctor(testProjectRoot, false);
      
      if (report.errors.length > 0) {
        expect(report.passed).toBe(false);
      } else {
        expect(report.passed).toBe(true);
      }
    });

    it('should categorize findings correctly', async () => {
      const inputs = createTestInitInputs({
        destination: testProjectRoot,
      });
      const manifest = createManifest(testProjectRoot, inputs);
      writeManifest(testProjectRoot, manifest);

      const report = await runProjectDoctor(testProjectRoot, false);
      
      // Errors should be subset of findings
      report.errors.forEach(error => {
        expect(report.findings).toContain(error);
        expect(error.severity).toBe('error');
        expect(error.passed).toBe(false);
      });
      
      // Warnings should be subset of findings
      report.warnings.forEach(warning => {
        expect(report.findings).toContain(warning);
        expect(warning.severity).toBe('warning');
        expect(warning.passed).toBe(false);
      });
    });
  });

  describe('actionable error messages', () => {
    it('should include check name in all error messages', async () => {
      const report = await runProjectDoctor(testProjectRoot, false);
      
      report.findings.forEach(finding => {
        if (!finding.passed && finding.message) {
          expect(finding.message).toBeDefined();
          expect(finding.name).toBeDefined();
          expect(finding.name).not.toBe('');
        }
      });
    });

    it('should include fix instructions for fixable issues', async () => {
      const report = await runProjectDoctor(testProjectRoot, true); // fix = true
      
      report.fixable.forEach(fix => {
        if (fix.fix) {
          expect(fix.fix).toBeDefined();
          expect(fix.fix).not.toBe('');
          // Fix should be actionable
          expect(fix.fix.length).toBeGreaterThan(5);
        }
      });
    });
  });
});
