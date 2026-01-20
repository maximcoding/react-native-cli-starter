/**
 * FILE: src/lib/marker-patcher.test.ts
 * PURPOSE: Unit/spec tests for marker patcher (idempotent inject, no duplicates, stable ordering)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - Idempotent injection (rerun produces NO-OP, no duplicates)
 * - Stable ordering (content inserted in consistent position)
 * - Marker validation (errors when markers missing/corrupted)
 * - Insert modes (append, prepend, replace)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { patchMarker, patchMarkers, validatePatches, type MarkerPatch } from './marker-patcher';

describe('marker-patcher', () => {
  let testProjectRoot: string;
  let testFile: string;

  beforeEach(async () => {
    testProjectRoot = await mkdtemp(join(tmpdir(), 'rns-test-project-'));
    testFile = join(testProjectRoot, 'test.ts');
    
    // Create a test file with markers
    const content = `// Test file
import { Component } from 'react';

// @rns-marker:imports:start
// @rns-marker:imports:end

// @rns-marker:providers:start
// @rns-marker:providers:end

// @rns-marker:root:start
// @rns-marker:root:end
`;
    await mkdir(testProjectRoot, { recursive: true });
    await writeFile(testFile, content);
  });

  afterEach(async () => {
    try {
      await rm(testProjectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('idempotent injection', () => {
    it('should be idempotent (rerun produces NO-OP, no duplicates)', async () => {
      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Test } from './test';",
        capabilityId: 'test-plugin',
        insertMode: 'append',
      };

      // First injection
      const result1 = patchMarker(testProjectRoot, patch, false);
      expect(result1.success).toBe(true);
      expect(result1.action).toBe('injected');

      // Second injection (should be idempotent)
      const result2 = patchMarker(testProjectRoot, patch, false);
      expect(result2.success).toBe(true);
      expect(result2.action).toBe('skipped'); // Should skip, not inject again
    });

    it('should prevent duplicate injections', async () => {
      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Test } from './test';",
        capabilityId: 'test-plugin',
      };

      // Inject once
      patchMarker(testProjectRoot, patch, false);

      // Inject again - should be skipped (idempotent)
      const result = patchMarker(testProjectRoot, patch, false);
      expect(result.action).toBe('skipped');
    });
  });

  describe('stable ordering', () => {
    it('should maintain stable ordering (content inserted in consistent position)', async () => {
      const patch1: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { First } from './first';",
        capabilityId: 'plugin-a',
      };

      const patch2: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Second } from './second';",
        capabilityId: 'plugin-b',
      };

      // Inject in order
      patchMarker(testProjectRoot, patch1, false);
      patchMarker(testProjectRoot, patch2, false);

      // Rerun should maintain same order
      patchMarker(testProjectRoot, patch1, false);
      patchMarker(testProjectRoot, patch2, false);

      // Order should be stable (first before second)
      const { readFile } = await import('fs/promises');
      const content = await readFile(testFile, 'utf-8');
      const firstIndex = content.indexOf("import { First }");
      const secondIndex = content.indexOf("import { Second }");
      
      expect(firstIndex).toBeGreaterThan(-1);
      expect(secondIndex).toBeGreaterThan(-1);
      expect(firstIndex).toBeLessThan(secondIndex); // First should appear before second
    });
  });

  describe('insert modes', () => {
    it('should support append mode (default)', async () => {
      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Appended } from './appended';",
        capabilityId: 'test-plugin',
        insertMode: 'append',
      };

      const result = patchMarker(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('injected');
    });

    it('should support prepend mode', async () => {
      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Prepended } from './prepended';",
        capabilityId: 'test-plugin',
        insertMode: 'prepend',
      };

      const result = patchMarker(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('injected');
    });

    it('should support replace mode', async () => {
      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Replaced } from './replaced';",
        capabilityId: 'test-plugin',
        insertMode: 'replace',
      };

      const result = patchMarker(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('injected');
    });
  });

  describe('validation', () => {
    it('should error if file does not exist', () => {
      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'nonexistent.ts',
        content: "import { Test } from './test';",
        capabilityId: 'test-plugin',
      };

      const result = patchMarker(testProjectRoot, patch, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('File not found');
    });

    it('should error if marker does not exist', async () => {
      // Create file without markers
      const content = `// File without markers
export const test = 'test';
`;
      await writeFile(testFile, content);

      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Test } from './test';",
        capabilityId: 'test-plugin',
      };

      const result = patchMarker(testProjectRoot, patch, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('not found');
    });
  });

  describe('batch operations', () => {
    it('should patch multiple markers', () => {
      const patches: MarkerPatch[] = [
        {
          markerType: 'imports',
          file: 'test.ts',
          content: "import { Test1 } from './test1';",
          capabilityId: 'plugin-a',
        },
        {
          markerType: 'providers',
          file: 'test.ts',
          content: '<TestProvider />',
          capabilityId: 'plugin-b',
        },
      ];

      const results = patchMarkers(testProjectRoot, patches, false);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('dry run', () => {
    it('should not modify files in dry-run mode', async () => {
      const { readFile } = await import('fs/promises');
      const originalContent = await readFile(testFile, 'utf-8');

      const patch: MarkerPatch = {
        markerType: 'imports',
        file: 'test.ts',
        content: "import { Test } from './test';",
        capabilityId: 'test-plugin',
      };

      const result = patchMarker(testProjectRoot, patch, true); // dryRun = true
      expect(result.success).toBe(true);

      // File should not be modified
      const newContent = await readFile(testFile, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });
});
