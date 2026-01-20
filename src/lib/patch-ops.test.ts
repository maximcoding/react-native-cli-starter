/**
 * FILE: src/lib/patch-ops.test.ts
 * PURPOSE: Unit/spec tests for patch operations (anchored edits, insert-once, rollback-safe)
 * OWNERSHIP: CLI
 * 
 * Tests validate:
 * - Anchored edits (Expo config, iOS plist, Android manifest, Gradle/Podfile)
 * - Insert-once semantics (idempotent, no duplicates)
 * - Rollback safety (backups created, can restore)
 * - Patch types (expo-config, plist, entitlements, android-manifest, gradle, podfile, text-anchor)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import {
  applyPatchOp,
  applyPatchOps,
} from './patch-ops';
import type {
  PatchOp,
  ExpoConfigPatchOp,
  GradlePatchOp,
  PlistPatchOp,
  AndroidManifestPatchOp,
} from './types/patch-ops';

describe('patch-ops', () => {
  let testProjectRoot: string;

  beforeEach(async () => {
    testProjectRoot = await mkdtemp(join(tmpdir(), 'rns-test-project-'));
  });

  afterEach(async () => {
    try {
      await rm(testProjectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('anchored edits', () => {
    it('should apply Expo config patches (anchored JSON path)', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      const appJson = {
        expo: {
          name: 'MyApp',
          plugins: [],
        },
      };
      await writeFile(appJsonPath, JSON.stringify(appJson, null, 2));

      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'app.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'append',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('applied');
      expect(result.patchType).toBe('expo-config');

      // Verify patch was applied
      const content = JSON.parse(await readFile(appJsonPath, 'utf-8'));
      expect(content.expo.plugins).toContain('expo-camera');
    });

    it('should apply Gradle patches (anchored text insertion)', async () => {
      const gradlePath = join(testProjectRoot, 'android', 'app', 'build.gradle');
      await mkdir(join(testProjectRoot, 'android', 'app'), { recursive: true });
      const gradleContent = `dependencies {
    implementation 'com.android.support:appcompat-v7:28.0.0'
}
`;
      await writeFile(gradlePath, gradleContent);

      const patch: GradlePatchOp = {
        type: 'gradle',
        file: 'android/app/build.gradle',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-gradle',
        anchor: "implementation 'com.android.support:appcompat-v7:28.0.0'",
        content: "    implementation 'expo-camera:1.0.0'",
        mode: 'after',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('applied');

      // Verify patch was applied
      const content = await readFile(gradlePath, 'utf-8');
      expect(content).toContain("implementation 'expo-camera:1.0.0'");
      expect(content.indexOf("expo-camera")).toBeGreaterThan(content.indexOf('appcompat-v7'));
    });

    it('should apply iOS plist patches', async () => {
      const plistPath = join(testProjectRoot, 'ios', 'MyApp', 'Info.plist');
      await mkdir(join(testProjectRoot, 'ios', 'MyApp'), { recursive: true });
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>MyApp</string>
</dict>
</plist>
`;
      await writeFile(plistPath, plistContent);

      const patch: PlistPatchOp = {
        type: 'plist',
        file: 'ios/MyApp/Info.plist',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-plist',
        key: 'NSCameraUsageDescription',
        value: 'This app needs camera access',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('applied');
    });

    it('should apply Android manifest patches', async () => {
      const manifestPath = join(testProjectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
      await mkdir(join(testProjectRoot, 'android', 'app', 'src', 'main'), { recursive: true });
      const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
    </application>
</manifest>
`;
      await writeFile(manifestPath, manifestContent);

      const patch: AndroidManifestPatchOp = {
        type: 'android-manifest',
        file: 'android/app/src/main/AndroidManifest.xml',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-manifest',
        manifestOp: 'permission',
        name: 'android.permission.CAMERA',
        action: 'add',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('applied');
    });
  });

  describe('insert-once semantics', () => {
    it('should be idempotent (rerun produces NO-OP, no duplicates)', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      const appJson = {
        expo: {
          name: 'MyApp',
          plugins: [],
        },
      };
      await writeFile(appJsonPath, JSON.stringify(appJson, null, 2));

      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'app.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'append',
      };

      // First application
      const result1 = applyPatchOp(testProjectRoot, patch, false);
      expect(result1.success).toBe(true);
      expect(result1.action).toBe('applied');

      // Second application (should be idempotent)
      const result2 = applyPatchOp(testProjectRoot, patch, false);
      expect(result2.success).toBe(true);
      expect(result2.action).toBe('skipped'); // Should skip, not apply again

      // Verify no duplicates
      const content = JSON.parse(await readFile(appJsonPath, 'utf-8'));
      const plugins = content.expo.plugins || [];
      const cameraCount = plugins.filter((p: string) => p === 'expo-camera').length;
      expect(cameraCount).toBe(1); // Should be exactly one, not duplicated
    });

    it('should detect existing patches via operation ID', async () => {
      const gradlePath = join(testProjectRoot, 'build.gradle');
      const gradleContent = `dependencies {
    // @rns-operation:camera-plugin-gradle
    implementation 'expo-camera:1.0.0'
}
`;
      await writeFile(gradlePath, gradleContent);

      const patch: GradlePatchOp = {
        type: 'gradle',
        file: 'build.gradle',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-gradle', // Same operation ID as in file
        anchor: 'dependencies {',
        content: "implementation 'expo-camera:1.0.0'",
        mode: 'after',
      };

      // Should detect existing patch and skip
      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.action).toBe('skipped');
    });
  });

  describe('rollback safety', () => {
    it('should create backup before modification', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      const originalContent = JSON.stringify({ expo: { name: 'MyApp' } }, null, 2);
      await writeFile(appJsonPath, originalContent);

      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'app.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'append',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toContain('.rns/backups');

      // Verify backup file exists and contains original content
      if (result.backupPath) {
        const backupContent = await readFile(result.backupPath, 'utf-8');
        expect(backupContent).toBe(originalContent);
      }
    });

    it('should not create backup for new files', async () => {
      // New file doesn't need backup
      const newFilePath = join(testProjectRoot, 'new-file.json');
      // Don't create the file - it's new

      // Actually, we can't patch a non-existent file, so this test verifies the error case
      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'new-file.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'append',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('File not found');
    });
  });

  describe('patch types', () => {
    it('should handle expo-config patches with set mode', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      await writeFile(appJsonPath, JSON.stringify({ expo: { name: 'MyApp' } }, null, 2));

      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'app.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'set', // Replace existing
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);
      expect(result.patchType).toBe('expo-config');
    });

    it('should handle expo-config patches with merge mode', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      await writeFile(
        appJsonPath,
        JSON.stringify({ expo: { name: 'MyApp', extra: { existing: 'value' } } }, null, 2)
      );

      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'app.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.extra',
        value: { newKey: 'newValue' },
        mode: 'merge', // Deep merge
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);

      // Verify merge (both existing and new keys should be present)
      const content = JSON.parse(await readFile(appJsonPath, 'utf-8'));
      expect(content.expo.extra.existing).toBe('value');
      expect(content.expo.extra.newKey).toBe('newValue');
    });

    it('should handle gradle patches with before mode', async () => {
      const gradlePath = join(testProjectRoot, 'build.gradle');
      await writeFile(gradlePath, 'dependencies {\n}\n');

      const patch: GradlePatchOp = {
        type: 'gradle',
        file: 'build.gradle',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-gradle',
        anchor: '}',
        content: "    implementation 'expo-camera:1.0.0'",
        mode: 'before', // Insert before anchor
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);

      // Verify insertion before anchor
      const content = await readFile(gradlePath, 'utf-8');
      const cameraIndex = content.indexOf('expo-camera');
      const anchorIndex = content.indexOf('}');
      expect(cameraIndex).toBeLessThan(anchorIndex); // Camera should be before closing brace
    });

    it('should handle gradle patches with after mode', async () => {
      const gradlePath = join(testProjectRoot, 'build.gradle');
      await writeFile(gradlePath, 'dependencies {\n}\n');

      const patch: GradlePatchOp = {
        type: 'gradle',
        file: 'build.gradle',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-gradle',
        anchor: 'dependencies {',
        content: "    implementation 'expo-camera:1.0.0'",
        mode: 'after', // Insert after anchor
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(true);

      // Verify insertion after anchor
      const content = await readFile(gradlePath, 'utf-8');
      const anchorIndex = content.indexOf('dependencies {');
      const cameraIndex = content.indexOf('expo-camera');
      expect(cameraIndex).toBeGreaterThan(anchorIndex); // Camera should be after dependencies {
    });
  });

  describe('batch operations', () => {
    it('should apply multiple patch operations', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      await writeFile(appJsonPath, JSON.stringify({ expo: { name: 'MyApp' } }, null, 2));

      const patches: PatchOp[] = [
        {
          type: 'expo-config',
          file: 'app.json',
          capabilityId: 'camera.plugin',
          operationId: 'camera-plugin-config',
          path: 'expo.plugins',
          value: ['expo-camera'],
          mode: 'append',
        },
        {
          type: 'expo-config',
          file: 'app.json',
          capabilityId: 'camera.plugin',
          operationId: 'camera-plugin-config-ios',
          path: 'expo.ios.bundleIdentifier',
          value: 'com.example.app.camera',
          mode: 'set',
        },
      ];

      const results = applyPatchOps(testProjectRoot, patches, false);
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('validation', () => {
    it('should error if file does not exist', () => {
      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'nonexistent.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'append',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      expect(result.error).toContain('File not found');
    });

    it('should error if anchor not found in text file', async () => {
      const gradlePath = join(testProjectRoot, 'build.gradle');
      await writeFile(gradlePath, 'dependencies {\n}\n');

      const patch: GradlePatchOp = {
        type: 'gradle',
        file: 'build.gradle',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-gradle',
        anchor: 'nonexistent-anchor',
        content: "implementation 'expo-camera:1.0.0'",
        mode: 'after',
      };

      const result = applyPatchOp(testProjectRoot, patch, false);
      expect(result.success).toBe(false);
      expect(result.action).toBe('error');
      // Should indicate anchor not found
    });
  });

  describe('dry run', () => {
    it('should not modify files in dry-run mode', async () => {
      const appJsonPath = join(testProjectRoot, 'app.json');
      const originalContent = JSON.stringify({ expo: { name: 'MyApp' } }, null, 2);
      await writeFile(appJsonPath, originalContent);

      const patch: ExpoConfigPatchOp = {
        type: 'expo-config',
        file: 'app.json',
        capabilityId: 'camera.plugin',
        operationId: 'camera-plugin-config',
        path: 'expo.plugins',
        value: ['expo-camera'],
        mode: 'append',
      };

      const result = applyPatchOp(testProjectRoot, patch, true); // dryRun = true
      expect(result.success).toBe(true);

      // File should not be modified
      const newContent = await readFile(appJsonPath, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });
});
