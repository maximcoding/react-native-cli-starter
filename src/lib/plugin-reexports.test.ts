/**
 * FILE: src/lib/plugin-reexports.test.ts
 * PURPOSE: Unit tests for plugin re-export generation
 * OWNERSHIP: CLI
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdir, mkdtemp, rm, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import {
  getPluginCategory,
  normalizePluginName,
  getPluginPackageName,
  generatePluginReExport,
  removePluginReExport,
  ensureCategoryDir,
} from './plugin-reexports';
import { pathExists } from './fs';

describe('plugin-reexports', () => {
  let testProjectRoot: string;

  beforeEach(async () => {
    testProjectRoot = await mkdtemp(join(tmpdir(), 'rns-test-reexports-'));
    await mkdir(join(testProjectRoot, 'src'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testProjectRoot, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('getPluginCategory', () => {
    it('should extract category from plugin ID with dot', () => {
      expect(getPluginCategory('state.zustand')).toBe('state');
      expect(getPluginCategory('auth.firebase')).toBe('auth');
      expect(getPluginCategory('storage.mmkv')).toBe('storage');
      expect(getPluginCategory('nav.react-navigation')).toBe('nav');
    });

    it('should return "plugins" for plugin ID without dot', () => {
      expect(getPluginCategory('example')).toBe('plugins');
      expect(getPluginCategory('my-plugin')).toBe('plugins');
    });
  });

  describe('normalizePluginName', () => {
    it('should strip category prefix from plugin ID', () => {
      expect(normalizePluginName('state.zustand')).toBe('zustand');
      expect(normalizePluginName('auth.firebase')).toBe('firebase');
      expect(normalizePluginName('storage.mmkv')).toBe('mmkv');
      expect(normalizePluginName('nav.react-navigation')).toBe('react-navigation');
    });

    it('should return unchanged for plugin ID without dot', () => {
      expect(normalizePluginName('example')).toBe('example');
      expect(normalizePluginName('my-plugin')).toBe('my-plugin');
    });
  });

  describe('getPluginPackageName', () => {
    it('should convert plugin ID to category-based package name', () => {
      expect(getPluginPackageName('state.zustand')).toBe('@rns/state');
      expect(getPluginPackageName('auth.firebase')).toBe('@rns/auth');
      expect(getPluginPackageName('storage.mmkv')).toBe('@rns/storage');
    });

    it('should handle plugin ID without dot', () => {
      expect(getPluginPackageName('example')).toBe('@rns/plugins');
    });
  });

  describe('ensureCategoryDir', () => {
    it('should create category directory', async () => {
      ensureCategoryDir(testProjectRoot, 'state');
      const stateDir = join(testProjectRoot, 'src', 'state');
      expect(await pathExists(stateDir)).toBe(true);
    });

    it('should create nested category directories', async () => {
      ensureCategoryDir(testProjectRoot, 'auth');
      const authDir = join(testProjectRoot, 'src', 'auth');
      expect(await pathExists(authDir)).toBe(true);
    });
  });


  describe('generatePluginReExport', () => {
    it('should generate re-export file with example stores for state.zustand', async () => {
      generatePluginReExport(testProjectRoot, 'state.zustand', 'ts');
      
      // Check main file exists
      const reexportPath = join(testProjectRoot, 'src', 'state', 'zustand.ts');
      expect(await pathExists(reexportPath)).toBe(true);
      
      const content = await readFile(reexportPath, 'utf-8');
      // Should use category-based package name
      expect(content).toContain('@rns/state');
      // Should include factory functions
      expect(content).toContain('createPersistedStore');
      expect(content).toContain('createVolatileStore');
      expect(content).toContain('src/state/zustand.ts');
      // Should re-export stores from subdirectory
      expect(content).toContain('./zustand/stores/session');
      expect(content).toContain('./zustand/stores/settings');
      expect(content).toContain('./zustand/stores/ui');
      
      // Check store files exist
      const sessionPath = join(testProjectRoot, 'src', 'state', 'zustand', 'stores', 'session.ts');
      const settingsPath = join(testProjectRoot, 'src', 'state', 'zustand', 'stores', 'settings.ts');
      const uiPath = join(testProjectRoot, 'src', 'state', 'zustand', 'stores', 'ui.ts');
      
      expect(await pathExists(sessionPath)).toBe(true);
      expect(await pathExists(settingsPath)).toBe(true);
      expect(await pathExists(uiPath)).toBe(true);
      
      // Check store files contain expected content
      const sessionContent = await readFile(sessionPath, 'utf-8');
      expect(sessionContent).toContain('useSessionStore');
      expect(sessionContent).toContain('SessionState');
      
      const settingsContent = await readFile(settingsPath, 'utf-8');
      expect(settingsContent).toContain('useSettingsStore');
      expect(settingsContent).toContain('SettingsState');
      
      const uiContent = await readFile(uiPath, 'utf-8');
      expect(uiContent).toContain('useUIStore');
      expect(uiContent).toContain('UIState');
    });

    it('should generate simple re-export file for auth plugin', async () => {
      generatePluginReExport(testProjectRoot, 'auth.firebase', 'ts');
      
      const reexportPath = join(testProjectRoot, 'src', 'auth', 'firebase.ts');
      expect(await pathExists(reexportPath)).toBe(true);
      
      const content = await readFile(reexportPath, 'utf-8');
      // Should use category-based package name
      expect(content).toContain('@rns/auth');
      expect(content).toContain('src/auth/firebase.ts');
      // Should NOT include example stores (only for state.zustand)
      expect(content).not.toContain('useSessionStore');
    });

    it('should generate JavaScript re-export file', async () => {
      generatePluginReExport(testProjectRoot, 'state.zustand', 'js');
      
      const reexportPath = join(testProjectRoot, 'src', 'state', 'zustand.js');
      expect(await pathExists(reexportPath)).toBe(true);
      
      const content = await readFile(reexportPath, 'utf-8');
      expect(content).toContain('src/state/zustand.js');
    });

    it('should handle plugin without category prefix', async () => {
      generatePluginReExport(testProjectRoot, 'example', 'ts');
      
      const reexportPath = join(testProjectRoot, 'src', 'plugins', 'example.ts');
      expect(await pathExists(reexportPath)).toBe(true);
      
      const content = await readFile(reexportPath, 'utf-8');
      // Should use category-based package name (fallback to 'plugins')
      expect(content).toContain('@rns/plugins');
    });
  });

  describe('removePluginReExport', () => {
    it('should remove re-export file and stores directory for state.zustand', async () => {
      // Generate first
      generatePluginReExport(testProjectRoot, 'state.zustand', 'ts');
      const reexportPath = join(testProjectRoot, 'src', 'state', 'zustand.ts');
      const sessionPath = join(testProjectRoot, 'src', 'state', 'zustand', 'stores', 'session.ts');
      const settingsPath = join(testProjectRoot, 'src', 'state', 'zustand', 'stores', 'settings.ts');
      const uiPath = join(testProjectRoot, 'src', 'state', 'zustand', 'stores', 'ui.ts');
      
      expect(await pathExists(reexportPath)).toBe(true);
      expect(await pathExists(sessionPath)).toBe(true);
      expect(await pathExists(settingsPath)).toBe(true);
      expect(await pathExists(uiPath)).toBe(true);
      
      // Remove
      removePluginReExport(testProjectRoot, 'state.zustand', 'ts');
      expect(await pathExists(reexportPath)).toBe(false);
      expect(await pathExists(sessionPath)).toBe(false);
      expect(await pathExists(settingsPath)).toBe(false);
      expect(await pathExists(uiPath)).toBe(false);
    });

    it('should handle removal of non-existent file gracefully', () => {
      // Should not throw
      expect(() => {
        removePluginReExport(testProjectRoot, 'state.zustand', 'ts');
      }).not.toThrow();
    });

    it('should remove JavaScript re-export file', async () => {
      generatePluginReExport(testProjectRoot, 'state.zustand', 'js');
      const reexportPath = join(testProjectRoot, 'src', 'state', 'zustand.js');
      expect(await pathExists(reexportPath)).toBe(true);
      
      removePluginReExport(testProjectRoot, 'state.zustand', 'js');
      expect(await pathExists(reexportPath)).toBe(false);
    });
  });
});
