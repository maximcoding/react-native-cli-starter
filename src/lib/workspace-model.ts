/**
 * FILE: src/lib/workspace-model.ts
 * PURPOSE: Option A Workspace Packages Model baseline definition (single source of truth)
 * OWNERSHIP: CLI
 */

import {
  WORKSPACE_PACKAGES_DIR,
  USER_SRC_DIR,
  RUNTIME_PACKAGE_NAME,
  CORE_PACKAGE_NAME,
} from './constants';

/**
 * Option A: Workspace Packages Model
 *
 * This is the canonical model for generated apps:
 * - CLI-managed code lives in local workspace packages under packages/@rns/*
 * - User-owned business code stays clean in src/** (no CLI glue injected)
 * - Runtime integration happens through @rns/runtime composition, not by patching user code
 */
export const WORKSPACE_MODEL = {
  /**
   * Directory where CLI-managed workspace packages live
   */
  packagesDir: WORKSPACE_PACKAGES_DIR,

  /**
   * Directory where user-owned business code lives (must stay clean)
   */
  userSrcDir: USER_SRC_DIR,

  /**
   * Runtime package name (always present after init)
   */
  runtimePackage: RUNTIME_PACKAGE_NAME,

  /**
   * Core package name (contracts + defaults)
   */
  corePackage: CORE_PACKAGE_NAME,

  /**
   * Rule: Never inject CLI glue code into user src/**
   * All integration must happen through:
   * - @rns/runtime composition (providers/init/root/registries)
   * - Workspace packages under packages/@rns/*
   * - Config/native patch operations (with backups)
   */
  rule: {
    noUserCodeInjection: true,
    integrationViaRuntime: true,
    integrationViaWorkspacePackages: true,
  },
} as const;

