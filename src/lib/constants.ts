/**
 * FILE: src/lib/constants.ts
 * PURPOSE: Single source of truth for stable paths and constants used across the CLI
 * OWNERSHIP: CLI
 */

/**
 * Stable paths and constants for CLI operations.
 * All paths are relative to the resolved project root (where .rn-init.json lives).
 */

export const PROJECT_STATE_FILE = '.rn-init.json';

export const CLI_STATE_DIR = '.rns';
export const CLI_LOGS_DIR = '.rns/logs';
export const CLI_BACKUPS_DIR = '.rns/backups';
export const CLI_AUDIT_DIR = '.rns/audit';

/**
 * Option A: Workspace Packages Model
 * Generated apps use local workspace packages under packages/@rns/*
 * User-owned code stays clean in src/** (no CLI glue injected)
 */
export const WORKSPACE_PACKAGES_DIR = 'packages/@rns';
export const USER_SRC_DIR = 'src';

/**
 * Runtime package name (always present after init)
 */
export const RUNTIME_PACKAGE_NAME = '@rns/runtime';
export const CORE_PACKAGE_NAME = '@rns/core';
