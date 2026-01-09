/**
 * FILE: src/lib/types/runtime.ts
 * PURPOSE: Runtime injection types for AST-based wiring (section 11)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.6
 */

import type { MarkerType } from '../markers';

/**
 * Symbol reference for AST-based injection
 * Used by ts-morph to inject symbols without raw code strings
 */
export interface SymbolRef {
  /** Symbol name to import/inject (e.g., "AuthProvider", "initFirebase") */
  symbol: string;
  /** Module source path (relative to project root or package name) */
  source: string;
}

/**
 * Provider wrapper contribution
 * Wraps children in a provider component
 */
export interface ProviderContribution {
  type: 'provider';
  /** Provider component reference */
  provider: SymbolRef;
  /** Optional order hint (lower = earlier, default: 0) */
  order?: number;
  /** Optional props to pass to provider */
  props?: Record<string, unknown>;
}

/**
 * Import statement contribution
 * Adds import statements to the file
 */
export interface ImportContribution {
  type: 'import';
  /** Import references */
  imports: SymbolRef[];
  /** Optional order hint (lower = earlier, default: 0) */
  order?: number;
}

/**
 * Initialization step contribution
 * Adds initialization code (function calls, setup logic)
 */
export interface InitStepContribution {
  type: 'init-step';
  /** Function/statement to call */
  step: SymbolRef | string; // SymbolRef for function calls, string for raw code (discouraged)
  /** Optional arguments */
  args?: unknown[];
  /** Optional order hint (lower = earlier, default: 0) */
  order?: number;
}

/**
 * Registration contribution
 * Registers plugins/services in runtime registries
 */
export interface RegistrationContribution {
  type: 'registration';
  /** Registration call */
  registration: SymbolRef | string; // SymbolRef preferred, string for custom code
  /** Optional order hint (lower = earlier, default: 0) */
  order?: number;
}

/**
 * Root component replacement contribution
 * Replaces the MinimalUI component in RnsApp
 */
export interface RootContribution {
  type: 'root';
  /** Root component reference */
  root: SymbolRef;
}

/**
 * Runtime contribution union type
 * Represents what a plugin/module adds to the runtime
 */
export type RuntimeContribution =
  | ProviderContribution
  | ImportContribution
  | InitStepContribution
  | RegistrationContribution
  | RootContribution;

/**
 * Runtime wiring operation
 * Combines a contribution with its target marker location
 */
export interface RuntimeWiringOp {
  /** Contribution to apply */
  contribution: RuntimeContribution;
  /** Target marker type */
  markerType: MarkerType;
  /** Target file (relative to project root) */
  file: string;
  /** Plugin/module ID for traceability */
  capabilityId: string;
  /** Optional order override (takes precedence over contribution.order) */
  order?: number;
}

/**
 * Runtime wiring result
 */
export interface RuntimeWiringResult {
  success: boolean;
  file: string;
  markerType: MarkerType;
  capabilityId: string;
  contributionType: RuntimeContribution['type'];
  action: 'injected' | 'skipped' | 'error';
  error?: string;
  backupPath?: string;
}
