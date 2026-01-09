/**
 * FILE: src/lib/types/doctor.ts
 * PURPOSE: Doctor tooling types (environment + project validation) (section 17-18)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.14
 */

import type { RnsTarget } from './common';

/**
 * Doctor check ID (stable identifier for each check)
 */
export type DoctorCheckId = 
  // Environment checks
  | 'node.version'
  | 'package-manager.installed'
  | 'git.installed'
  | 'expo.cli'
  | 'android.sdk'
  | 'android.jdk'
  | 'android.adb'
  | 'android.gradle'
  | 'ios.xcode'
  | 'ios.cocoapods'
  // Project checks
  | 'manifest.exists'
  | 'manifest.valid'
  | 'markers.intact'
  | 'ownership.zones'
  | 'injections.duplicates'
  | 'plugins.consistent';

/**
 * Check severity
 */
export type CheckSeverity = 'error' | 'warning' | 'info';

/**
 * Doctor finding (result of a single check)
 */
export interface DoctorFinding {
  /** Check ID */
  checkId: DoctorCheckId;
  /** Check name (human-readable) */
  name: string;
  /** Severity */
  severity: CheckSeverity;
  /** Pass status */
  passed: boolean;
  /** Message (if failed/warning) */
  message?: string;
  /** Actionable fix instructions */
  fix?: string;
  /** Optional value (e.g., detected version) */
  value?: string;
}

/**
 * Environment doctor report
 */
export interface EnvironmentDoctorReport {
  /** Target platform (expo/bare) */
  target: RnsTarget;
  /** All findings */
  findings: DoctorFinding[];
  /** Pass status */
  passed: boolean;
  /** Critical errors (blocking) */
  criticalErrors: DoctorFinding[];
  /** Warnings (non-blocking) */
  warnings: DoctorFinding[];
}

/**
 * Project doctor report
 */
export interface ProjectDoctorReport {
  /** All findings */
  findings: DoctorFinding[];
  /** Pass status */
  passed: boolean;
  /** Errors */
  errors: DoctorFinding[];
  /** Warnings */
  warnings: DoctorFinding[];
  /** Fixable issues */
  fixable: DoctorFinding[];
}

/**
 * Doctor report (union type)
 */
export type DoctorReport = EnvironmentDoctorReport | ProjectDoctorReport;
