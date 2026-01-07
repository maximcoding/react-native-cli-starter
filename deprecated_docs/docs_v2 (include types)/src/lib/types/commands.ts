/**
 * FILE: commands.ts
 * LAYER: CLI types (src/lib/types)
 * PURPOSE: Canonical command identifiers and exit codes.
 */

export type CliCommandId =
  | 'init'
  | 'doctor.env'
  | 'doctor.project'
  | 'plugin.list'
  | 'plugin.add'
  | 'plugin.remove'
  | 'plugin.status'
  | 'plugin.doctor';

export enum CommandExitCode {
  OK = 0,
  FAIL = 1,
  INVALID_INPUT = 2,
  INCOMPATIBLE = 3,
  CONFLICT = 4,
  IO = 5,
}
