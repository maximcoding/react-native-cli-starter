/**
 * FILE: src/lib/project-doctor.ts
 * PURPOSE: Project Doctor - project-level validation (section 18)
 * OWNERSHIP: CLI
 * 
 * Implements `rns doctor` and `rns doctor --fix` for project-level validation.
 * --fix may only apply safe fixes in SYSTEM ZONE (never touches src/**).
 */

import { join } from 'path';
import { readManifest, validateManifest, migrateManifest } from './manifest';
import { validateAllMarkers } from './markers';
import { isCliManagedZone, OWNERSHIP_ZONES } from './idempotency';
import { readdirSync, statSync } from 'fs';
import { pathExists, isDirectory, isFile } from './fs';
import { readTextFile } from './fs';
import { INJECTION_MARKER_PATTERN } from './idempotency';
import { getPluginRegistry, initializePluginRegistry } from './plugin-registry';
import { CliError, ExitCode } from './errors';
import type {
  ProjectDoctorReport,
  DoctorFinding,
  DoctorCheckId,
} from './types/doctor';

/**
 * Runs project doctor checks
 * 
 * @param projectRoot - Project root directory
 * @param fix - If true, apply safe fixes in SYSTEM ZONE only
 * @returns Project doctor report
 */
export async function runProjectDoctor(projectRoot: string, fix: boolean = false): Promise<ProjectDoctorReport> {
  const findings: DoctorFinding[] = [];
  
  // Check 1: Manifest exists and is valid
  findings.push(...checkManifest(projectRoot, fix));
  
  // Check 2: Markers intact
  findings.push(...checkMarkers(projectRoot));
  
  // Check 3: Ownership zones intact
  findings.push(...checkOwnershipZones(projectRoot));
  
  // Check 4: No duplicate injections
  findings.push(...checkDuplicateInjections(projectRoot));
  
  // Check 5: Plugins consistent with workspace + deps + registry
  findings.push(...(await checkPluginConsistency(projectRoot)));
  
  // Categorize findings
  const errors = findings.filter(f => f.severity === 'error' && !f.passed);
  const warnings = findings.filter(f => f.severity === 'warning' && !f.passed);
  const fixable = findings.filter(f => !f.passed && f.fix && isCliManagedZone(join(projectRoot, f.checkId), projectRoot));
  const passed = errors.length === 0;
  
  return {
    findings,
    passed,
    errors,
    warnings,
    fixable: fix ? fixable : [],
  };
}

/**
 * Checks manifest exists and is valid
 */
function checkManifest(projectRoot: string, fix: boolean): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  const manifestPath = join(projectRoot, '.rns', 'rn-init.json');
  
  // Check manifest exists
  if (!pathExists(manifestPath)) {
    findings.push({
      checkId: 'manifest.exists',
      name: 'Manifest exists',
      severity: 'error',
      passed: false,
      message: 'Project manifest (.rns/rn-init.json) not found',
      fix: 'Run "rns init" to initialize the project',
    });
    return findings; // Can't continue without manifest
  }
  
  findings.push({
    checkId: 'manifest.exists',
    name: 'Manifest exists',
    severity: 'error',
    passed: true,
  });
  
  // Check manifest is valid
  try {
    const manifest = readManifest(projectRoot);
    if (!manifest) {
      findings.push({
        checkId: 'manifest.valid',
        name: 'Manifest valid',
        severity: 'error',
        passed: false,
        message: 'Manifest file exists but is invalid',
        fix: 'Manifest may need migration. Run "rns doctor --fix" to attempt migration',
      });
      return findings;
    }
    
    // Check if migration is needed
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      if (fix && validation.migrated) {
        // Attempt migration
        try {
          const migrated = migrateManifest(manifest, manifest.schemaVersion || '1.0.0');
          if (migrated) {
            findings.push({
              checkId: 'manifest.valid',
              name: 'Manifest valid',
              severity: 'error',
              passed: true,
              message: 'Manifest migrated successfully',
            });
            return findings;
          }
        } catch (error) {
          // Migration failed
        }
      }
      
      findings.push({
        checkId: 'manifest.valid',
        name: 'Manifest valid',
        severity: 'error',
        passed: false,
        message: `Manifest validation failed: ${validation.errors?.join(', ')}`,
        fix: 'Manifest may need migration. Run "rns doctor --fix" to attempt migration',
      });
      return findings;
    }
    
    findings.push({
      checkId: 'manifest.valid',
      name: 'Manifest valid',
      severity: 'error',
      passed: true,
    });
  } catch (error) {
    findings.push({
      checkId: 'manifest.valid',
      name: 'Manifest valid',
      severity: 'error',
      passed: false,
      message: `Failed to read manifest: ${error instanceof Error ? error.message : String(error)}`,
      fix: 'Check manifest file format and permissions',
    });
  }
  
  return findings;
}

/**
 * Checks markers are intact
 */
function checkMarkers(projectRoot: string): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  
  try {
    const errors = validateAllMarkers(projectRoot);
    
    if (errors.length > 0) {
      findings.push({
        checkId: 'markers.intact',
        name: 'Markers intact',
        severity: 'error',
        passed: false,
        message: `Marker validation failed: ${errors.length} error(s)`,
        fix: `Fix marker issues:\n${errors.slice(0, 5).map(e => `  - ${e}`).join('\n')}${errors.length > 5 ? `\n  ... and ${errors.length - 5} more` : ''}`,
      });
    } else {
      findings.push({
        checkId: 'markers.intact',
        name: 'Markers intact',
        severity: 'error',
        passed: true,
      });
    }
  } catch (error) {
    findings.push({
      checkId: 'markers.intact',
      name: 'Markers intact',
      severity: 'error',
      passed: false,
      message: `Failed to validate markers: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
  
  return findings;
}

/**
 * Checks ownership zones (no SYSTEM/USER contamination)
 */
function checkOwnershipZones(projectRoot: string): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  const violations: string[] = [];
  
  // Check SYSTEM zone files don't have user-owned patterns
  const systemZonePaths = [
    join(projectRoot, 'packages', '@rns'),
    join(projectRoot, '.rns'),
  ];
  
  for (const systemPath of systemZonePaths) {
    if (pathExists(systemPath) && isDirectory(systemPath)) {
      const violationsInPath = checkDirectoryForViolations(systemPath, projectRoot, 'SYSTEM');
      violations.push(...violationsInPath);
    }
  }
  
  // Check USER zone files don't have CLI markers/injections
  const userZonePath = join(projectRoot, 'src');
  if (pathExists(userZonePath) && isDirectory(userZonePath)) {
    const violationsInPath = checkDirectoryForViolations(userZonePath, projectRoot, 'USER');
    violations.push(...violationsInPath);
  }
  
  if (violations.length > 0) {
    findings.push({
      checkId: 'ownership.zones',
      name: 'Ownership zones intact',
      severity: 'error',
      passed: false,
      message: `Ownership zone violations detected: ${violations.length} file(s)`,
      fix: `Review and fix ownership violations:\n${violations.slice(0, 10).map(v => `  - ${v}`).join('\n')}${violations.length > 10 ? `\n  ... and ${violations.length - 10} more` : ''}`,
    });
  } else {
    findings.push({
      checkId: 'ownership.zones',
      name: 'Ownership zones intact',
      severity: 'error',
      passed: true,
    });
  }
  
  return findings;
}

/**
 * Checks a directory for ownership violations
 */
function checkDirectoryForViolations(
  dirPath: string,
  projectRoot: string,
  zone: 'SYSTEM' | 'USER'
): string[] {
  const violations: string[] = [];
  
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relPath = require('path').relative(projectRoot, fullPath);
      
      if (entry.isDirectory()) {
        const subViolations = checkDirectoryForViolations(fullPath, projectRoot, zone);
        violations.push(...subViolations);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
        // Check for ownership violations
        if (zone === 'USER') {
          // USER zone should not have CLI markers or injection markers
          try {
            const content = readTextFile(fullPath);
            if (content.includes('@rns-marker:') || INJECTION_MARKER_PATTERN.test(content)) {
              violations.push(relPath);
            }
          } catch {
            // Skip files we can't read
          }
        } else if (zone === 'SYSTEM') {
          // SYSTEM zone files should be in CLI-managed paths
          if (!isCliManagedZone(fullPath, projectRoot)) {
            violations.push(relPath);
          }
        }
      }
    }
  } catch {
    // Skip directories we can't read
  }
  
  return violations;
}

/**
 * Checks for duplicate injections
 */
function checkDuplicateInjections(projectRoot: string): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  const duplicates: string[] = [];
  
  // Check markers for duplicates
  const markerFiles = [
    join(projectRoot, 'packages', '@rns', 'runtime', 'index.ts'),
    join(projectRoot, 'packages', '@rns', 'runtime', 'core-init.ts'),
  ];
  
  for (const filePath of markerFiles) {
    if (pathExists(filePath)) {
      try {
        const content = readTextFile(filePath);
        const injectionMarkers = content.match(new RegExp(INJECTION_MARKER_PATTERN.source, 'g'));
        
        if (injectionMarkers) {
          // Check for duplicate operation IDs
          const operationIds = new Map<string, number>();
          for (const marker of injectionMarkers) {
            const match = marker.match(INJECTION_MARKER_PATTERN);
            if (match) {
              const operationId = match[1];
              operationIds.set(operationId, (operationIds.get(operationId) || 0) + 1);
            }
          }
          
          for (const [operationId, count] of operationIds.entries()) {
            if (count > 1) {
              duplicates.push(`${require('path').relative(projectRoot, filePath)}: ${operationId} (${count} times)`);
            }
          }
        }
      } catch {
        // Skip files we can't read
      }
    }
  }
  
  if (duplicates.length > 0) {
    findings.push({
      checkId: 'injections.duplicates',
      name: 'No duplicate injections',
      severity: 'error',
      passed: false,
      message: `Duplicate injections detected: ${duplicates.length} occurrence(s)`,
      fix: `Remove duplicate injection markers:\n${duplicates.slice(0, 10).map(d => `  - ${d}`).join('\n')}${duplicates.length > 10 ? `\n  ... and ${duplicates.length - 10} more` : ''}`,
    });
  } else {
    findings.push({
      checkId: 'injections.duplicates',
      name: 'No duplicate injections',
      severity: 'error',
      passed: true,
    });
  }
  
  return findings;
}

/**
 * Checks plugin consistency with workspace + deps + registry
 */
async function checkPluginConsistency(projectRoot: string): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  const inconsistencies: string[] = [];
  
  try {
    const manifest = readManifest(projectRoot);
    if (!manifest) {
      return findings; // Can't check without manifest
    }
    
    // Initialize plugin registry
    await initializePluginRegistry();
    const registry = getPluginRegistry();
    
    // Check installed plugins exist in workspace
    for (const plugin of manifest.plugins) {
      const pluginPackagePath = join(projectRoot, 'packages', '@rns', `plugin-${plugin.id}`);
      if (!pathExists(pluginPackagePath)) {
        inconsistencies.push(`Plugin ${plugin.id} is in manifest but package not found at ${pluginPackagePath}`);
      }
      
      // Check plugin exists in registry
      if (!registry.hasPlugin(plugin.id)) {
        inconsistencies.push(`Plugin ${plugin.id} is installed but not found in plugin registry`);
      }
    }
    
    // Check workspace packages match manifest
    const workspacePluginsPath = join(projectRoot, 'packages', '@rns');
    if (pathExists(workspacePluginsPath) && isDirectory(workspacePluginsPath)) {
      try {
        const entries = readdirSync(workspacePluginsPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name.startsWith('plugin-')) {
            const pluginId = entry.name.replace('plugin-', '');
            const inManifest = manifest.plugins.some(p => p.id === pluginId);
            if (!inManifest) {
              inconsistencies.push(`Plugin package ${entry.name} exists but not in manifest`);
            }
          }
        }
      } catch {
        // Skip if we can't read directory
      }
    }
    
    if (inconsistencies.length > 0) {
      findings.push({
        checkId: 'plugins.consistent',
        name: 'Plugins consistent',
        severity: 'warning',
        passed: false,
        message: `Plugin inconsistencies detected: ${inconsistencies.length} issue(s)`,
        fix: `Fix plugin inconsistencies:\n${inconsistencies.slice(0, 10).map(i => `  - ${i}`).join('\n')}${inconsistencies.length > 10 ? `\n  ... and ${inconsistencies.length - 10} more` : ''}`,
      });
    } else {
      findings.push({
        checkId: 'plugins.consistent',
        name: 'Plugins consistent',
        severity: 'warning',
        passed: true,
      });
    }
  } catch (error) {
    findings.push({
      checkId: 'plugins.consistent',
      name: 'Plugins consistent',
      severity: 'warning',
      passed: false,
      message: `Failed to check plugin consistency: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
  
  return findings;
}

/**
 * Applies safe fixes in SYSTEM ZONE only
 * 
 * @param projectRoot - Project root directory
 * @param fixable - Fixable findings to apply
 * @returns Array of fixed findings
 */
export function applySafeFixes(
  projectRoot: string,
  fixable: DoctorFinding[]
): DoctorFinding[] {
  const fixed: DoctorFinding[] = [];
  
  for (const finding of fixable) {
    // Only fix in SYSTEM ZONE
    // For now, we'll implement basic fixes
    // More complex fixes can be added later
    
    if (finding.checkId === 'manifest.valid' && finding.fix?.includes('migration')) {
      // Attempt manifest migration
      try {
        const manifest = readManifest(projectRoot);
        if (manifest) {
          const migrated = migrateManifest(manifest, manifest.schemaVersion || '1.0.0');
          if (migrated) {
            fixed.push({
              ...finding,
              passed: true,
              message: 'Manifest migrated successfully',
            });
          }
        }
      } catch {
        // Migration failed, skip
      }
    }
  }
  
  return fixed;
}
