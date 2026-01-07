/**
 * FILE: doctor.ts
 * LAYER: CLI types (src/lib/types)
 * PURPOSE: Contract for doctor checks + actionable reports.
 */

export type DoctorLevel = 'info' | 'warn' | 'error';

export type DoctorCheckId =
  | 'env.node'
  | 'env.git'
  | 'env.xcode'
  | 'env.android'
  | 'project.manifest'
  | 'project.ownership'
  | 'project.runtime'
  | 'project.permissions'
  | 'project.duplicates'
  | 'plugins.compat'
  | 'plugins.slots'
  | 'plugins.native';

export interface DoctorFix {
  /** Human description of what fix does */
  title: string;
  /**
   * Commands or steps the user can run.
   * (Doctor may offer --fix, but docs should not imply auto-fixing everything.)
   */
  steps: string[];
}

export interface DoctorFinding {
  id: DoctorCheckId;
  level: DoctorLevel;
  message: string;
  details?: string[];
  fix?: DoctorFix;
}

export interface DoctorReport {
  ok: boolean;
  findings: DoctorFinding[];
  warnings: DoctorFinding[];
  errors: DoctorFinding[];
}
