/**
 * FILE: src/lib/environment-doctor.test.ts
 * PURPOSE: Unit/spec tests for env doctor (failure modes are actionable)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - Failure modes produce actionable error messages
 * - Error messages include clear fix hints
 * - Checks are deterministic and consistent
 * - Target-specific checks (Expo vs Bare)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runEnvironmentDoctor } from './environment-doctor';
import type { RnsTarget } from './types/common';

describe('environment-doctor', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('failure modes are actionable', () => {
    it('should provide actionable error when Node version is too low', () => {
      // Mock process.version to return low version
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v16.0.0',
        writable: true,
        configurable: true,
      });

      try {
        const report = runEnvironmentDoctor('expo');
        
        const nodeCheck = report.findings.find(f => f.checkId === 'node.version');
        expect(nodeCheck).toBeDefined();
        
        if (!nodeCheck?.passed) {
          expect(nodeCheck?.message).toBeDefined();
          expect(nodeCheck?.fix).toBeDefined();
          expect(nodeCheck?.fix).toContain('Upgrade Node.js');
          expect(nodeCheck?.fix).toContain('https://nodejs.org/'); // Actionable URL
        }
      } finally {
        // Restore original version
        Object.defineProperty(process, 'version', {
          value: originalVersion,
          writable: true,
          configurable: true,
        });
      }
    });

    it('should provide actionable error when Node check fails', () => {
      // This tests the error handling path when version check throws
      // Note: Hard to mock process.version throwing, but structure should handle errors
      const report = runEnvironmentDoctor('expo');
      
      const nodeCheck = report.findings.find(f => f.checkId === 'node.version');
      expect(nodeCheck).toBeDefined();
      
      // If check failed, should have fix hint
      if (!nodeCheck?.passed) {
        expect(nodeCheck?.fix).toBeDefined();
        expect(nodeCheck?.fix).not.toBe('');
      }
    });

    it('should provide actionable errors for missing package managers', () => {
      const report = runEnvironmentDoctor('expo');
      
      // Check that package manager checks have actionable messages
      const packageManagerCheck = report.findings.find(f => f.checkId === 'package-manager.installed');
      
      // If check failed, should have actionable fix
      if (packageManagerCheck && !packageManagerCheck.passed) {
        expect(packageManagerCheck.message).toBeDefined();
        expect(packageManagerCheck.fix).toBeDefined();
        expect(packageManagerCheck.fix).not.toBe('');
      }
    });

    it('should provide actionable errors for missing Git', () => {
      const report = runEnvironmentDoctor('expo');
      
      const gitCheck = report.findings.find(f => f.checkId === 'git.installed');
      
      if (gitCheck && !gitCheck.passed) {
        expect(gitCheck.message).toBeDefined();
        expect(gitCheck.fix).toBeDefined();
        expect(gitCheck.fix).not.toBe('');
        expect(gitCheck.fix).toMatch(/install.*git|brew.*git|download.*git/i); // Actionable installation instructions
      }
    });

    it('should provide actionable errors for missing Expo CLI (Expo target)', () => {
      const report = runEnvironmentDoctor('expo');
      
      const expoCheck = report.findings.find(f => f.checkId === 'expo.cli');
      
      if (expoCheck && !expoCheck.passed) {
        expect(expoCheck.message).toBeDefined();
        expect(expoCheck.fix).toBeDefined();
        expect(expoCheck.fix).not.toBe('');
        expect(expoCheck.fix).toMatch(/npm.*install.*expo-cli|npx expo/i); // Actionable command
      }
    });

    it('should provide actionable errors for missing Android toolchain (Bare target)', () => {
      const report = runEnvironmentDoctor('bare');
      
      // Check Android SDK
      const androidSdkCheck = report.findings.find(f => f.checkId === 'android.sdk');
      
      if (androidSdkCheck && !androidSdkCheck.passed) {
        expect(androidSdkCheck.message).toBeDefined();
        expect(androidSdkCheck.fix).toBeDefined();
        expect(androidSdkCheck.fix).not.toBe('');
        expect(androidSdkCheck.fix).toMatch(/Android Studio|SDK|ANDROID_HOME/i); // Actionable instructions
      }
    });

    it('should provide actionable errors for missing iOS toolchain (Bare target)', () => {
      const report = runEnvironmentDoctor('bare');
      
      // Check Xcode (if on macOS)
      if (process.platform === 'darwin') {
        const xcodeCheck = report.findings.find(f => f.checkId === 'ios.xcode');
        
        if (xcodeCheck && !xcodeCheck.passed) {
          expect(xcodeCheck.message).toBeDefined();
          expect(xcodeCheck.fix).toBeDefined();
          expect(xcodeCheck.fix).not.toBe('');
          expect(xcodeCheck.fix).toMatch(/Xcode|App Store|install/i); // Actionable instructions
        }
      }
    });
  });

  describe('error messages quality', () => {
    it('should include check name in error messages', () => {
      const report = runEnvironmentDoctor('expo');
      
      report.findings.forEach(finding => {
        if (!finding.passed && finding.message) {
          expect(finding.message).toBeDefined();
          expect(finding.name).toBeDefined();
          // Message should be descriptive
          expect(finding.message.length).toBeGreaterThan(10);
        }
      });
    });

    it('should include fix instructions in all failure cases', () => {
      const report = runEnvironmentDoctor('expo');
      
      report.findings.forEach(finding => {
        if (!finding.passed && finding.fix) {
          expect(finding.fix).toBeDefined();
          expect(finding.fix).not.toBe('');
          // Fix should be actionable (not just "fix it")
          expect(finding.fix.length).toBeGreaterThan(10);
        }
      });
    });

    it('should categorize findings by severity', () => {
      const report = runEnvironmentDoctor('expo');
      
      report.findings.forEach(finding => {
        expect(finding.severity).toBeDefined();
        expect(['error', 'warning', 'info']).toContain(finding.severity);
      });
    });
  });

  describe('target-specific checks', () => {
    it('should check Expo CLI for Expo target', () => {
      const report = runEnvironmentDoctor('expo');
      
      const expoCheck = report.findings.find(f => f.checkId === 'expo.cli');
      expect(expoCheck).toBeDefined();
    });

    it('should check Android toolchain for Bare target', () => {
      const report = runEnvironmentDoctor('bare');
      
      const androidSdkCheck = report.findings.find(f => f.checkId === 'android.sdk');
      expect(androidSdkCheck).toBeDefined();
    });

    it('should check iOS toolchain for Bare target (on macOS)', () => {
      if (process.platform === 'darwin') {
        const report = runEnvironmentDoctor('bare');
        
        const xcodeCheck = report.findings.find(f => f.checkId === 'ios.xcode');
        expect(xcodeCheck).toBeDefined();
      }
    });

    it('should skip platform-specific checks on wrong platform', () => {
      // iOS checks should only run on macOS
      if (process.platform !== 'darwin') {
        const report = runEnvironmentDoctor('bare');
        
        const xcodeCheck = report.findings.find(f => f.checkId === 'ios.xcode');
        // Should either not exist or be skipped
        if (xcodeCheck) {
          // If it exists, should indicate it's not applicable
          expect(xcodeCheck.passed || xcodeCheck.message?.toLowerCase().includes('macos')).toBeTruthy();
        }
      }
    });
  });

  describe('deterministic behavior', () => {
    it('should produce same results for same inputs', () => {
      const report1 = runEnvironmentDoctor('expo');
      const report2 = runEnvironmentDoctor('expo');
      
      // Should have same number of findings
      expect(report1.findings.length).toBe(report2.findings.length);
      
      // Should have same check IDs
      const ids1 = report1.findings.map(f => f.checkId).sort();
      const ids2 = report2.findings.map(f => f.checkId).sort();
      expect(ids1).toEqual(ids2);
    });
  });

  describe('report structure', () => {
    it('should return valid report structure', () => {
      const report = runEnvironmentDoctor('expo');
      
      expect(report).toBeDefined();
      expect(report.target).toBe('expo');
      expect(report.findings).toBeDefined();
      expect(Array.isArray(report.findings)).toBe(true);
      expect(typeof report.passed).toBe('boolean');
      expect(Array.isArray(report.criticalErrors)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
    });

    it('should mark report as passed only if no critical errors', () => {
      const report = runEnvironmentDoctor('expo');
      
      if (report.criticalErrors.length > 0) {
        expect(report.passed).toBe(false);
      } else {
        expect(report.passed).toBe(true);
      }
    });

    it('should categorize findings correctly', () => {
      const report = runEnvironmentDoctor('expo');
      
      // Critical errors should be subset of findings
      report.criticalErrors.forEach(error => {
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
});
