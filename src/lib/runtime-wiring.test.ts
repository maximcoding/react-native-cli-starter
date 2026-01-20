/**
 * FILE: src/lib/runtime-wiring.test.ts
 * PURPOSE: Unit/spec tests for runtime wiring (ts-morph symbol-based ops, deterministic output)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - ts-morph AST-only operations (no regex, no raw code strings)
 * - Symbol-based injection (SymbolRef usage)
 * - Deterministic output (same inputs → same output)
 * - SYSTEM ZONE enforcement (only packages/@rns/**)
 * - Idempotency (rerun produces NO-OP)
 * - Contribution types (import, provider, init-step, registration, root)
 * - Ordering (deterministic sorting by order, then capability ID)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { tmpdir } from 'os';
import {
  wireRuntimeContribution,
  wireRuntimeContributions,
  validateWiringOps,
} from './runtime-wiring';
import type { RuntimeWiringOp } from './types/runtime';
import type {
  ImportContribution,
  ProviderContribution,
  InitStepContribution,
  RegistrationContribution,
} from './types/runtime';

describe('runtime-wiring', () => {
  let testProjectRoot: string;
  let systemZoneFile: string;
  let systemZoneDir: string;

  beforeEach(async () => {
    testProjectRoot = await mkdtemp(join(tmpdir(), 'rns-test-project-'));
    systemZoneDir = join(testProjectRoot, 'packages', '@rns', 'runtime');
    systemZoneFile = join(systemZoneDir, 'index.ts');
    
    // Create system zone directory structure
    await mkdir(systemZoneDir, { recursive: true });
    
    // Create a test file with markers in SYSTEM ZONE
    const content = `import { Component } from 'react';

// @rns-marker:imports:start
// @rns-marker:imports:end

export function RootProvider({ children }: { children: React.ReactNode }) {
  // @rns-marker:providers:start
  // @rns-marker:providers:end
  
  // @rns-marker:init-steps:start
  // @rns-marker:init-steps:end
  
  // @rns-marker:registrations:start
  // @rns-marker:registrations:end
  
  // @rns-marker:root:start
  return <div>MinimalUI</div>;
  // @rns-marker:root:end
}
`;
    await writeFile(systemZoneFile, content);
  });

  afterEach(async () => {
    try {
      await rm(testProjectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('ts-morph symbol-based operations', () => {
    it('should use symbol-based imports (not raw code strings)', async () => {
      const contribution: ImportContribution = {
        type: 'import',
        imports: [
          { symbol: 'AuthProvider', source: '@rns/plugin-auth' },
          { symbol: 'useAuth', source: '@rns/plugin-auth' },
        ],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      if (!result.success) {
        console.error('Test 1 failed - Error:', result.error);
        console.error('Result:', JSON.stringify(result, null, 2));
      }
      expect(result.success).toBe(true);
      expect(result.action).toBe('injected');

      // Verify import was added using AST (check file content)
      // Note: ts-morph may use double quotes, test accepts either quote style
      const { readFile } = await import('fs/promises');
      const content = await readFile(systemZoneFile, 'utf-8');
      expect(content).toMatch(/import\s*{\s*AuthProvider[,\s]*useAuth\s*}\s*from\s*['"]@rns\/plugin-auth['"]/);
    });

    it('should merge imports from same source (idempotent)', async () => {
      const contribution1: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'AuthProvider', source: '@rns/plugin-auth' }],
      };

      const contribution2: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'useAuth', source: '@rns/plugin-auth' }],
      };

      const op1: RuntimeWiringOp = {
        contribution: contribution1,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      const op2: RuntimeWiringOp = {
        contribution: contribution2,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      // Inject first import
      wireRuntimeContribution(testProjectRoot, op1, false);

      // Inject second import (should merge with first)
      wireRuntimeContribution(testProjectRoot, op2, false);

      // Verify both symbols are in same import statement
      const { readFile } = await import('fs/promises');
      const content = await readFile(systemZoneFile, 'utf-8');
      // Should have merged import with both symbols
      expect(content).toMatch(/import\s*{\s*AuthProvider[,\s]*useAuth\s*}\s*from\s*['"]@rns\/plugin-auth['"]/);
    });
  });

  describe('deterministic output', () => {
    it('should produce same output for same inputs', async () => {
      const contribution: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'TestComponent', source: './test' }],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'test-plugin',
      };

      // Create backup of original content
      const { readFile, writeFile: writeFileSync } = await import('fs/promises');
      const originalContent = await readFile(systemZoneFile, 'utf-8');

      // First injection
      const result1 = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result1.success).toBe(true);
      const content1 = await readFile(systemZoneFile, 'utf-8');

      // Reset file
      await writeFileSync(systemZoneFile, originalContent);

      // Second injection with same inputs
      const result2 = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result2.success).toBe(true);
      const content2 = await readFile(systemZoneFile, 'utf-8');

      // Output should be identical (deterministic)
      // Normalize timestamps in injection markers for comparison
      const normalizeContent = (content: string) => {
        return content.replace(/\/\/\s*@rns-inject:[^:]+:\d{4}-\d{2}-\d{2}T[\d:.-]+Z/g, '// @rns-inject:TIMESTAMP');
      };
      const normalized1 = normalizeContent(content1);
      const normalized2 = normalizeContent(content2);
      expect(normalized1).toBe(normalized2);
    });
  });

  describe('SYSTEM ZONE enforcement', () => {
    it('should reject wiring in USER ZONE (src/**)', async () => {
      const userZoneFile = join(testProjectRoot, 'src', 'app.tsx');
      await mkdir(join(testProjectRoot, 'src'), { recursive: true });
      await writeFile(userZoneFile, '// User zone file');

      const contribution: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'Test', source: './test' }],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'src/app.tsx', // USER ZONE - should be rejected
        capabilityId: 'test-plugin',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('SYSTEM ZONE');
    });

    it('should allow wiring in SYSTEM ZONE (packages/@rns/**)', async () => {
      const contribution: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'Test', source: './test' }],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts', // SYSTEM ZONE - should be allowed
        capabilityId: 'test-plugin',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('injected');
    });
  });

  describe('idempotency', () => {
    it('should be idempotent (rerun produces NO-OP)', async () => {
      const contribution: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'Test', source: './test' }],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'test-plugin',
      };

      // First injection
      const result1 = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result1.success).toBe(true);
      expect(result1.action).toBe('injected');

      // Second injection (should be idempotent)
      const result2 = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result2.success).toBe(true);
      expect(result2.action).toBe('skipped'); // Should skip, not inject again
    });
  });

  describe('contribution types', () => {
    it('should handle import contributions', async () => {
      const contribution: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'AuthProvider', source: '@rns/plugin-auth' }],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(true);
      expect(result.contributionType).toBe('import');
    });

    it('should handle provider contributions', async () => {
      const contribution: ProviderContribution = {
        type: 'provider',
        provider: { symbol: 'AuthProvider', source: '@rns/plugin-auth' },
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'providers',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(true);
      expect(result.contributionType).toBe('provider');
    });

    it('should handle init-step contributions', async () => {
      const contribution: InitStepContribution = {
        type: 'init-step',
        step: { symbol: 'initFirebase', source: '@rns/plugin-auth' },
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'init-steps',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(true);
      expect(result.contributionType).toBe('init-step');
    });

    it('should handle registration contributions', async () => {
      const contribution: RegistrationContribution = {
        type: 'registration',
        registration: { symbol: 'registerAuthPlugin', source: '@rns/plugin-auth' },
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'registrations',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'auth.firebase',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(true);
      expect(result.contributionType).toBe('registration');
    });
  });

  describe('ordering', () => {
    it('should sort contributions by order (lower = earlier)', async () => {
      const op1: RuntimeWiringOp = {
        contribution: {
          type: 'import',
          imports: [{ symbol: 'First', source: './first' }],
          order: 10,
        },
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'plugin-a',
        order: 10,
      };

      const op2: RuntimeWiringOp = {
        contribution: {
          type: 'import',
          imports: [{ symbol: 'Second', source: './second' }],
          order: 5,
        },
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'plugin-b',
        order: 5,
      };

      // Wire in reverse order (should still be deterministic)
      const results = wireRuntimeContributions(testProjectRoot, [op1, op2], false);
      expect(results.length).toBe(2);
      expect(results[0].capabilityId).toBe('plugin-b'); // Lower order first
      expect(results[1].capabilityId).toBe('plugin-a');
    });

    it('should use secondary sort by capability ID when order is equal', async () => {
      const op1: RuntimeWiringOp = {
        contribution: {
          type: 'import',
          imports: [{ symbol: 'First', source: './first' }],
        },
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'plugin-b',
      };

      const op2: RuntimeWiringOp = {
        contribution: {
          type: 'import',
          imports: [{ symbol: 'Second', source: './second' }],
        },
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'plugin-a',
      };

      // Both have same order (default 0), so sort by capability ID
      const results = wireRuntimeContributions(testProjectRoot, [op1, op2], false);
      expect(results.length).toBe(2);
      expect(results[0].capabilityId).toBe('plugin-a'); // Alphabetically first
      expect(results[1].capabilityId).toBe('plugin-b');
    });
  });

  describe('validation', () => {
    it('should validate wiring operations before applying', () => {
      const ops: RuntimeWiringOp[] = [
        {
          contribution: {
            type: 'import',
            imports: [{ symbol: 'Test', source: './test' }],
          },
          markerType: 'imports',
          file: 'packages/@rns/runtime/index.ts',
          capabilityId: 'test-plugin',
        },
        {
          contribution: {
            type: 'import',
            imports: [], // Invalid: empty imports
          },
          markerType: 'imports',
          file: 'packages/@rns/runtime/index.ts',
          capabilityId: 'invalid-plugin',
        },
        {
          contribution: {
            type: 'import',
            imports: [{ symbol: 'Test', source: './test' }],
          },
          markerType: 'imports',
          file: 'src/app.tsx', // Invalid: USER ZONE
          capabilityId: 'wrong-zone-plugin',
        },
      ];

      const errors = validateWiringOps(testProjectRoot, ops);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('empty imports')) || errors.some(e => e.includes('invalid-plugin'))).toBeTruthy();
      expect(errors.some(e => e.includes('SYSTEM ZONE')) || errors.some(e => e.includes('wrong-zone-plugin'))).toBeTruthy();
    });

    it('should error if file does not exist', () => {
      const op: RuntimeWiringOp = {
        contribution: {
          type: 'import',
          imports: [{ symbol: 'Test', source: './test' }],
        },
        markerType: 'imports',
        file: 'packages/@rns/nonexistent.ts',
        capabilityId: 'test-plugin',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('File not found');
    });
  });

  describe('dry run', () => {
    it('should not modify files in dry-run mode', async () => {
      const { readFile } = await import('fs/promises');
      const originalContent = await readFile(systemZoneFile, 'utf-8');

      const contribution: ImportContribution = {
        type: 'import',
        imports: [{ symbol: 'Test', source: './test' }],
      };

      const op: RuntimeWiringOp = {
        contribution,
        markerType: 'imports',
        file: 'packages/@rns/runtime/index.ts',
        capabilityId: 'test-plugin',
      };

      const result = wireRuntimeContribution(testProjectRoot, op, true); // dryRun = true
      expect(result.success).toBe(true);

      // File should not be modified
      const newContent = await readFile(systemZoneFile, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });
});
