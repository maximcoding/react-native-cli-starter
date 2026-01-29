/**
 * FILE: src/lib/init/remaining-phase2/index.ts
 * PURPOSE: Batch infrastructure generation for remaining Phase 2 sections (55-70)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates infrastructure for remaining Phase 2 sections
 */
export function generateRemainingPhase2Infrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  // Section 55: AWS Services
  if (inputs.selectedOptions.aws) {
    generateAwsInfrastructure(appRoot, inputs);
  }

  // Section 56: Storage
  if (inputs.selectedOptions.storage) {
    generateStorageInfrastructure(appRoot, inputs);
  }

  // Section 57: Firebase Products
  if (inputs.selectedOptions.firebase) {
    generateFirebaseProductsInfrastructure(appRoot, inputs);
  }

  // Section 58: Offline-first
  if (inputs.selectedOptions.offline) {
    generateOfflineInfrastructure(appRoot, inputs);
  }

  // Section 59: Notifications
  if (inputs.selectedOptions.notifications) {
    generateNotificationsInfrastructure(appRoot, inputs);
  }

  // Section 60: Maps/Location
  if (inputs.selectedOptions.maps) {
    generateMapsInfrastructure(appRoot, inputs);
  }

  // Section 61: Camera/Media
  if (inputs.selectedOptions.media) {
    generateMediaInfrastructure(appRoot, inputs);
  }

  // Section 62: Payments
  if (inputs.selectedOptions.payments) {
    generatePaymentsInfrastructure(appRoot, inputs);
  }

  // Section 63: IAP
  if (inputs.selectedOptions.iap) {
    generateIapInfrastructure(appRoot, inputs);
  }

  // Section 64: Analytics/Observability
  if (inputs.selectedOptions.analytics) {
    generateAnalyticsInfrastructure(appRoot, inputs);
  }

  // Section 65: Search
  if (inputs.selectedOptions.search) {
    generateSearchInfrastructure(appRoot, inputs);
  }

  // Section 66: OTA Updates
  if (inputs.selectedOptions.ota) {
    generateOtaInfrastructure(appRoot, inputs);
  }

  // Section 67: Background Tasks
  if (inputs.selectedOptions.background) {
    generateBackgroundInfrastructure(appRoot, inputs);
  }

  // Section 68: Privacy & Consent
  if (inputs.selectedOptions.privacy) {
    generatePrivacyInfrastructure(appRoot, inputs);
  }

  // Section 69: Device/Hardware
  if (inputs.selectedOptions.device) {
    generateDeviceInfrastructure(appRoot, inputs);
  }

  // Section 70: Testing
  if (inputs.selectedOptions.testing) {
    generateTestingInfrastructure(appRoot, inputs);
  }
}

/**
 * Generates a simple infrastructure file for a category
 */
function generateSimpleInfrastructure(
  appRoot: string,
  category: string,
  subcategory: string,
  inputs: InitInputs,
  content: string
): void {
  const categoryDir = join(appRoot, USER_SRC_DIR, category);
  const subcategoryDir = join(categoryDir, subcategory);
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  ensureDir(subcategoryDir);

  const mainFilePath = join(subcategoryDir, `${subcategory}.${fileExt}`);
  writeTextFile(mainFilePath, content);
}

function generateAwsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const baseContent = inputs.language === 'js' 
    ? `/**
 * FILE: src/aws/{subcategory}/{subcategory}.js
 * PURPOSE: AWS {subcategory} utilities (User Zone).
 * OWNERSHIP: USER
 */

// AWS {subcategory} configuration and utilities
// Implement your AWS {subcategory} logic here
`
    : `/**
 * FILE: src/aws/{subcategory}/{subcategory}.ts
 * PURPOSE: AWS {subcategory} utilities (User Zone).
 * OWNERSHIP: USER
 */

// AWS {subcategory} configuration and utilities
// Implement your AWS {subcategory} logic here
`;

  if (inputs.selectedOptions.aws?.amplify) {
    generateSimpleInfrastructure(appRoot, 'aws', 'amplify', inputs, baseContent.replace(/{subcategory}/g, 'amplify'));
  }
  if (inputs.selectedOptions.aws?.appsync) {
    generateSimpleInfrastructure(appRoot, 'aws', 'appsync', inputs, baseContent.replace(/{subcategory}/g, 'appsync'));
  }
  if (inputs.selectedOptions.aws?.dynamodb) {
    generateSimpleInfrastructure(appRoot, 'aws', 'dynamodb', inputs, baseContent.replace(/{subcategory}/g, 'dynamodb'));
  }
  if (inputs.selectedOptions.aws?.s3) {
    generateSimpleInfrastructure(appRoot, 'aws', 's3', inputs, baseContent.replace(/{subcategory}/g, 's3'));
  }
}

/**
 * Section 56: Real MMKV storage infra (from reference).
 * Generates src/storage/mmkv/storage.ts, hooks/useStorage.ts, and mmkv.ts re-export.
 */
function generateMmkvStorageInfrastructure(appRoot: string, inputs: InitInputs): void {
  const storageDir = join(appRoot, USER_SRC_DIR, 'storage');
  const mmkvDir = join(storageDir, 'mmkv');
  const hooksDir = join(mmkvDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const storageTs = `/**
 * FILE: src/storage/mmkv/storage.ts
 * PURPOSE: MMKV key-value storage (User Zone). From reference.
 * OWNERSHIP: USER
 */

export interface KeyValueStorage {
  getString(key: string): string | null;
  setString(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
}

function createStorage(): KeyValueStorage {
  try {
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV({
      id: 'app-storage',
      // encryptionKey: 'secure-key', // configure via env for production
    });
    return {
      getString(key) {
        return mmkv.getString(key) ?? null;
      },
      setString(key, value) {
        mmkv.set(key, value);
      },
      delete(key) {
        mmkv.delete(key);
      },
      clearAll() {
        mmkv.clearAll();
      },
    };
  } catch {
    const memory = new Map<string, string>();
    return {
      getString(key) {
        return memory.has(key) ? memory.get(key)! : null;
      },
      setString(key, value) {
        memory.set(key, value);
      },
      delete(key) {
        memory.delete(key);
      },
      clearAll() {
        memory.clear();
      },
    };
  }
}

export const kvStorage: KeyValueStorage = createStorage();
`;

  const useStorageTs = `/**
 * FILE: src/storage/mmkv/hooks/useStorage.ts
 * PURPOSE: React hook for MMKV storage (User Zone).
 * OWNERSHIP: USER
 */

import { useCallback, useState } from 'react';
import { kvStorage } from '../storage';

export function useStorage(key: string): [string | null, (value: string | null) => void] {
  const [value, setValue] = useState<string | null>(() => kvStorage.getString(key));

  const set = useCallback(
    (newValue: string | null) => {
      if (newValue === null) {
        kvStorage.delete(key);
      } else {
        kvStorage.setString(key, newValue);
      }
      setValue(newValue);
    },
    [key]
  );

  return [value, set];
}
`;

  const reexportTs = `/**
 * FILE: src/storage/mmkv.ts
 * PURPOSE: Re-export MMKV storage (User Zone).
 * OWNERSHIP: USER
 */

export { kvStorage } from './mmkv/storage';
export type { KeyValueStorage } from './mmkv/storage';
export { useStorage } from './mmkv/hooks/useStorage';
`;

  writeTextFile(join(mmkvDir, `storage.${fileExt}`), storageTs);
  writeTextFile(join(hooksDir, `useStorage.${fileExt}`), useStorageTs);
  writeTextFile(join(storageDir, `mmkv.${fileExt}`), reexportTs);
}

/**
 * Section 56: Real SQLite storage infra.
 * Generates src/storage/sqlite/database.ts, services/, and sqlite.ts re-export.
 */
function generateSqliteStorageInfrastructure(appRoot: string, inputs: InitInputs): void {
  const storageDir = join(appRoot, USER_SRC_DIR, 'storage');
  const sqliteDir = join(storageDir, 'sqlite');
  const servicesDir = join(sqliteDir, 'services');
  ensureDir(servicesDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const databaseTs = `/**
 * FILE: src/storage/sqlite/database.ts
 * PURPOSE: SQLite database setup (User Zone).
 * OWNERSHIP: USER
 */

import SQLite from 'react-native-sqlite-2';

export const db = SQLite.openDatabase('app.db', '1.0', '', 1);

/**
 * Initialize database schema
 */
export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((txn) => {
      // Example: create users table
      txn.executeSql(
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)',
        [],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
}
`;

  const serviceTs = `/**
 * FILE: src/storage/sqlite/services/userService.ts
 * PURPOSE: Example user service wrapper (User Zone).
 * OWNERSHIP: USER
 */

import { db } from '../database';

export interface User {
  id?: number;
  name: string;
  email: string;
}

export function createUser(user: Omit<User, 'id'>): Promise<number> {
  return new Promise((resolve, reject) => {
    db.transaction((txn) => {
      txn.executeSql(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [user.name, user.email],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error)
      );
    });
  });
}

export function getUsers(): Promise<User[]> {
  return new Promise((resolve, reject) => {
    db.transaction((txn) => {
      txn.executeSql(
        'SELECT * FROM users',
        [],
        (_, result) => {
          const users: User[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            users.push(result.rows.item(i));
          }
          resolve(users);
        },
        (_, error) => reject(error)
      );
    });
  });
}
`;

  const reexportTs = `/**
 * FILE: src/storage/sqlite.ts
 * PURPOSE: Re-export SQLite storage (User Zone).
 * OWNERSHIP: USER
 */

export { db, initDatabase } from './sqlite/database';
export * from './sqlite/services/userService';
`;

  writeTextFile(join(sqliteDir, `database.${fileExt}`), databaseTs);
  writeTextFile(join(servicesDir, `userService.${fileExt}`), serviceTs);
  writeTextFile(join(storageDir, `sqlite.${fileExt}`), reexportTs);
}

/**
 * Section 56: Real secure storage (Keychain) infra.
 * Generates src/storage/secure/keychain.ts, hooks/useSecureStorage.ts, and secure.ts re-export.
 */
function generateSecureStorageInfrastructure(appRoot: string, inputs: InitInputs): void {
  const storageDir = join(appRoot, USER_SRC_DIR, 'storage');
  const secureDir = join(storageDir, 'secure');
  const hooksDir = join(secureDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const keychainTs = `/**
 * FILE: src/storage/secure/keychain.ts
 * PURPOSE: Keychain/secure storage service wrapper (User Zone).
 * OWNERSHIP: USER
 */

import * as Keychain from 'react-native-keychain';

export interface SecureStorage {
  getPassword(service: string, username: string): Promise<string | null>;
  setPassword(service: string, username: string, password: string): Promise<void>;
  deletePassword(service: string, username: string): Promise<void>;
}

export const secureStorage: SecureStorage = {
  async getPassword(service: string, username: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(service);
      if (credentials && credentials.username === username) {
        return credentials.password;
      }
      return null;
    } catch {
      return null;
    }
  },

  async setPassword(service: string, username: string, password: string): Promise<void> {
    await Keychain.setInternetCredentials(service, username, password);
  },

  async deletePassword(service: string, username: string): Promise<void> {
    await Keychain.resetInternetCredentials(service);
  },
};
`;

  const useSecureStorageTs = `/**
 * FILE: src/storage/secure/hooks/useSecureStorage.ts
 * PURPOSE: React hook for secure storage (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { secureStorage } from '../keychain';

export function useSecureStorage(service: string, username: string) {
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const value = await secureStorage.getPassword(service, username);
    setPassword(value);
    setLoading(false);
  }, [service, username]);

  const save = useCallback(
    async (value: string) => {
      await secureStorage.setPassword(service, username, value);
      setPassword(value);
    },
    [service, username]
  );

  const remove = useCallback(async () => {
    await secureStorage.deletePassword(service, username);
    setPassword(null);
  }, [service, username]);

  return { password, loading, load, save, remove };
}
`;

  const reexportTs = `/**
 * FILE: src/storage/secure.ts
 * PURPOSE: Re-export secure storage (User Zone).
 * OWNERSHIP: USER
 */

export { secureStorage } from './secure/keychain';
export type { SecureStorage } from './secure/keychain';
export { useSecureStorage } from './secure/hooks/useSecureStorage';
`;

  writeTextFile(join(secureDir, `keychain.${fileExt}`), keychainTs);
  writeTextFile(join(hooksDir, `useSecureStorage.${fileExt}`), useSecureStorageTs);
  writeTextFile(join(storageDir, `secure.${fileExt}`), reexportTs);
}

/**
 * Section 56: Real filesystem storage infra.
 * Generates src/storage/filesystem/fileService.ts, hooks/useFileSystem.ts, and filesystem.ts re-export.
 */
function generateFilesystemStorageInfrastructure(appRoot: string, inputs: InitInputs): void {
  const storageDir = join(appRoot, USER_SRC_DIR, 'storage');
  const filesystemDir = join(storageDir, 'filesystem');
  const hooksDir = join(filesystemDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const fileServiceTs = `/**
 * FILE: src/storage/filesystem/fileService.ts
 * PURPOSE: File system utilities (User Zone).
 * OWNERSHIP: USER
 */

import RNFS from 'react-native-fs';

export interface FileService {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  readDir(path: string): Promise<string[]>;
}

export const fileService: FileService = {
  async readFile(path: string): Promise<string> {
    return await RNFS.readFile(path, 'utf8');
  },

  async writeFile(path: string, content: string): Promise<void> {
    await RNFS.writeFile(path, content, 'utf8');
  },

  async deleteFile(path: string): Promise<void> {
    await RNFS.unlink(path);
  },

  async exists(path: string): Promise<boolean> {
    return await RNFS.exists(path);
  },

  async mkdir(path: string): Promise<void> {
    await RNFS.mkdir(path);
  },

  async readDir(path: string): Promise<string[]> {
    return await RNFS.readdir(path);
  },
};
`;

  const useFileSystemTs = `/**
 * FILE: src/storage/filesystem/hooks/useFileSystem.ts
 * PURPOSE: React hook for file operations (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { fileService } from '../fileService';

export function useFileSystem(filePath: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const read = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const exists = await fileService.exists(filePath);
      if (exists) {
        const data = await fileService.readFile(filePath);
        setContent(data);
      } else {
        setContent(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const write = useCallback(
    async (data: string) => {
      setLoading(true);
      setError(null);
      try {
        await fileService.writeFile(filePath, data);
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [filePath]
  );

  const remove = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fileService.deleteFile(filePath);
      setContent(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  return { content, loading, error, read, write, remove };
}
`;

  const reexportTs = `/**
 * FILE: src/storage/filesystem.ts
 * PURPOSE: Re-export filesystem storage (User Zone).
 * OWNERSHIP: USER
 */

export { fileService } from './filesystem/fileService';
export type { FileService } from './filesystem/fileService';
export { useFileSystem } from './filesystem/hooks/useFileSystem';
`;

  writeTextFile(join(filesystemDir, `fileService.${fileExt}`), fileServiceTs);
  writeTextFile(join(hooksDir, `useFileSystem.${fileExt}`), useFileSystemTs);
  writeTextFile(join(storageDir, `filesystem.${fileExt}`), reexportTs);
}

function generateStorageInfrastructure(appRoot: string, inputs: InitInputs): void {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const baseContent = inputs.language === 'js'
    ? `/**
 * FILE: src/storage/{subcategory}/{subcategory}.js
 * PURPOSE: Storage {subcategory} utilities (User Zone).
 * OWNERSHIP: USER
 */

// Storage {subcategory} configuration and utilities
// Implement your storage {subcategory} logic here
`
    : `/**
 * FILE: src/storage/{subcategory}/{subcategory}.ts
 * PURPOSE: Storage {subcategory} utilities (User Zone).
 * OWNERSHIP: USER
 */

// Storage {subcategory} configuration and utilities
// Implement your storage {subcategory} logic here
`;

  if (inputs.selectedOptions.storage?.mmkv) {
    generateMmkvStorageInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.storage?.sqlite) {
    generateSqliteStorageInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.storage?.secure) {
    generateSecureStorageInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.storage?.filesystem) {
    generateFilesystemStorageInfrastructure(appRoot, inputs);
  }
}

function generateFirebaseProductsInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.firebase?.firestore) {
    generateFirestoreInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.firebase?.realtimeDatabase) {
    generateRealtimeDatabaseInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.firebase?.storage) {
    generateFirebaseStorageInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.firebase?.remoteConfig) {
    generateRemoteConfigInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 57: Real Firestore infrastructure.
 */
function generateFirestoreInfrastructure(appRoot: string, inputs: InitInputs): void {
  const firebaseDir = join(appRoot, USER_SRC_DIR, 'firebase');
  const firestoreDir = join(firebaseDir, 'firestore');
  const servicesDir = join(firestoreDir, 'services');
  const hooksDir = join(firestoreDir, 'hooks');
  ensureDir(servicesDir);
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/firebase/firestore/services/firestoreService.ts
 * PURPOSE: Firestore service wrapper (User Zone).
 * OWNERSHIP: USER
 */

import firestore from '@react-native-firebase/firestore';

export const firestoreDb = firestore();

export interface FirestoreService {
  collection(path: string): ReturnType<typeof firestoreDb.collection>;
  doc(path: string): ReturnType<typeof firestoreDb.doc>;
}

export const firestoreService: FirestoreService = {
  collection: (path: string) => firestoreDb.collection(path),
  doc: (path: string) => firestoreDb.doc(path),
};
`;

  const hookTs = `/**
 * FILE: src/firebase/firestore/hooks/useFirestore.ts
 * PURPOSE: Firestore hook example (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import { firestoreDb } from '../services/firestoreService';
import type { FirestoreDataConverter, QueryDocumentSnapshot } from '@react-native-firebase/firestore';

export function useFirestore<T>(
  collectionPath: string,
  converter?: FirestoreDataConverter<T>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = firestoreDb
      .collection(collectionPath)
      .onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map((doc) =>
            converter ? converter.fromFirestore(doc as QueryDocumentSnapshot<T>, {}) : doc.data() as T
          );
          setData(items);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [collectionPath, converter]);

  return { data, loading, error };
}
`;

  const reexportTs = `/**
 * FILE: src/firebase/firestore.ts
 * PURPOSE: Re-export Firestore utilities (User Zone).
 * OWNERSHIP: USER
 */

export { firestoreDb, firestoreService } from './firestore/services/firestoreService';
export type { FirestoreService } from './firestore/services/firestoreService';
export { useFirestore } from './firestore/hooks/useFirestore';
`;

  writeTextFile(join(servicesDir, `firestoreService.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useFirestore.${fileExt}`), hookTs);
  writeTextFile(join(firebaseDir, `firestore.${fileExt}`), reexportTs);
}

/**
 * Section 57: Real Realtime Database infrastructure.
 */
function generateRealtimeDatabaseInfrastructure(appRoot: string, inputs: InitInputs): void {
  const firebaseDir = join(appRoot, USER_SRC_DIR, 'firebase');
  const realtimeDir = join(firebaseDir, 'realtime');
  const servicesDir = join(realtimeDir, 'services');
  const hooksDir = join(realtimeDir, 'hooks');
  ensureDir(servicesDir);
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/firebase/realtime/services/realtimeService.ts
 * PURPOSE: Realtime Database service wrapper (User Zone).
 * OWNERSHIP: USER
 */

import database from '@react-native-firebase/database';

export const realtimeDb = database();

export interface RealtimeService {
  ref(path: string): ReturnType<typeof realtimeDb.ref>;
}

export const realtimeService: RealtimeService = {
  ref: (path: string) => realtimeDb.ref(path),
};
`;

  const hookTs = `/**
 * FILE: src/firebase/realtime/hooks/useRealtime.ts
 * PURPOSE: Realtime Database hook example (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import { realtimeDb } from '../services/realtimeService';

export function useRealtime<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = realtimeDb.ref(path);
    const listener = ref.on('value', (snapshot) => {
      setData(snapshot.val() as T);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => ref.off('value', listener);
  }, [path]);

  return { data, loading, error };
}
`;

  const reexportTs = `/**
 * FILE: src/firebase/realtime.ts
 * PURPOSE: Re-export Realtime Database utilities (User Zone).
 * OWNERSHIP: USER
 */

export { realtimeDb, realtimeService } from './realtime/services/realtimeService';
export type { RealtimeService } from './realtime/services/realtimeService';
export { useRealtime } from './realtime/hooks/useRealtime';
`;

  writeTextFile(join(servicesDir, `realtimeService.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useRealtime.${fileExt}`), hookTs);
  writeTextFile(join(firebaseDir, `realtime.${fileExt}`), reexportTs);
}

/**
 * Section 57: Real Firebase Storage infrastructure.
 */
function generateFirebaseStorageInfrastructure(appRoot: string, inputs: InitInputs): void {
  const firebaseDir = join(appRoot, USER_SRC_DIR, 'firebase');
  const storageDir = join(firebaseDir, 'storage');
  const servicesDir = join(storageDir, 'services');
  ensureDir(servicesDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const uploadServiceTs = `/**
 * FILE: src/firebase/storage/services/uploadService.ts
 * PURPOSE: Firebase Storage upload utilities (User Zone).
 * OWNERSHIP: USER
 */

import storage from '@react-native-firebase/storage';

export const storageRef = storage();

export interface UploadService {
  uploadFile(localPath: string, remotePath: string): Promise<string>;
  downloadFile(remotePath: string, localPath: string): Promise<void>;
  deleteFile(remotePath: string): Promise<void>;
  getDownloadURL(remotePath: string): Promise<string>;
}

export const uploadService: UploadService = {
  async uploadFile(localPath: string, remotePath: string): Promise<string> {
    const reference = storageRef.ref(remotePath);
    await reference.putFile(localPath);
    return await reference.getDownloadURL();
  },

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    const reference = storageRef.ref(remotePath);
    await reference.writeToFile(localPath);
  },

  async deleteFile(remotePath: string): Promise<void> {
    const reference = storageRef.ref(remotePath);
    await reference.delete();
  },

  async getDownloadURL(remotePath: string): Promise<string> {
    const reference = storageRef.ref(remotePath);
    return await reference.getDownloadURL();
  },
};
`;

  const reexportTs = `/**
 * FILE: src/firebase/storage.ts
 * PURPOSE: Re-export Firebase Storage utilities (User Zone).
 * OWNERSHIP: USER
 */

export { storageRef, uploadService } from './storage/services/uploadService';
export type { UploadService } from './storage/services/uploadService';
`;

  writeTextFile(join(servicesDir, `uploadService.${fileExt}`), uploadServiceTs);
  writeTextFile(join(firebaseDir, `storage.${fileExt}`), reexportTs);
}

/**
 * Section 57: Real Remote Config infrastructure.
 */
function generateRemoteConfigInfrastructure(appRoot: string, inputs: InitInputs): void {
  const firebaseDir = join(appRoot, USER_SRC_DIR, 'firebase');
  const remoteConfigDir = join(firebaseDir, 'remote-config');
  const servicesDir = join(remoteConfigDir, 'services');
  ensureDir(servicesDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/firebase/remote-config/services/remoteConfigService.ts
 * PURPOSE: Remote Config service wrapper (User Zone).
 * OWNERSHIP: USER
 */

import remoteConfig from '@react-native-firebase/remote-config';

export const remoteConfigInstance = remoteConfig();

export interface RemoteConfigService {
  fetch(): Promise<void>;
  activate(): Promise<boolean>;
  getValue(key: string): ReturnType<typeof remoteConfigInstance.getValue>;
  setDefaults(defaults: Record<string, string | number | boolean>): Promise<void>;
}

export const remoteConfigService: RemoteConfigService = {
  async fetch(): Promise<void> {
    await remoteConfigInstance.fetch();
  },

  async activate(): Promise<boolean> {
    return await remoteConfigInstance.activate();
  },

  getValue(key: string) {
    return remoteConfigInstance.getValue(key);
  },

  async setDefaults(defaults: Record<string, string | number | boolean>): Promise<void> {
    await remoteConfigInstance.setDefaults(defaults);
  },
};
`;

  const reexportTs = `/**
 * FILE: src/firebase/remote-config.ts
 * PURPOSE: Re-export Remote Config utilities (User Zone).
 * OWNERSHIP: USER
 */

export { remoteConfigInstance, remoteConfigService } from './remote-config/services/remoteConfigService';
export type { RemoteConfigService } from './remote-config/services/remoteConfigService';
`;

  writeTextFile(join(servicesDir, `remoteConfigService.${fileExt}`), serviceTs);
  writeTextFile(join(firebaseDir, `remote-config.${fileExt}`), reexportTs);
}

function generateOfflineInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.offline?.netinfo) {
    generateNetInfoInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.offline?.outbox) {
    generateOutboxInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.offline?.sync) {
    generateSyncInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 58: Real NetInfo infrastructure.
 * Generates src/offline/netinfo/hooks/useNetworkStatus.ts, context.tsx, and netinfo.ts re-export.
 */
function generateNetInfoInfrastructure(appRoot: string, inputs: InitInputs): void {
  const offlineDir = join(appRoot, USER_SRC_DIR, 'offline');
  const netinfoDir = join(offlineDir, 'netinfo');
  const hooksDir = join(netinfoDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const contextExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const useNetworkStatusTs = `/**
 * FILE: src/offline/netinfo/hooks/useNetworkStatus.ts
 * PURPOSE: Network status hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean | null;
  type: string | null;
  isInternetReachable: boolean | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    type: null,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? null,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? null,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
`;

  const contextTsx = `/**
 * FILE: src/offline/netinfo/context.tsx
 * PURPOSE: NetworkInfo context provider (User Zone).
 * OWNERSHIP: USER
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useNetworkStatus, type NetworkStatus } from './hooks/useNetworkStatus';

interface NetworkInfoContextValue extends NetworkStatus {}

const NetworkInfoContext = createContext<NetworkInfoContextValue | undefined>(undefined);

export function NetworkInfoProvider({ children }: { children: ReactNode }) {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkInfoContext.Provider value={networkStatus}>
      {children}
    </NetworkInfoContext.Provider>
  );
}

export function useNetworkInfo(): NetworkInfoContextValue {
  const context = useContext(NetworkInfoContext);
  if (!context) {
    throw new Error('useNetworkInfo must be used within NetworkInfoProvider');
  }
  return context;
}
`;

  const reexportTs = `/**
 * FILE: src/offline/netinfo.ts
 * PURPOSE: Re-export NetInfo utilities (User Zone).
 * OWNERSHIP: USER
 */

export { useNetworkStatus } from './netinfo/hooks/useNetworkStatus';
export type { NetworkStatus } from './netinfo/hooks/useNetworkStatus';
export { NetworkInfoProvider, useNetworkInfo } from './netinfo/context';
`;

  writeTextFile(join(hooksDir, `useNetworkStatus.${fileExt}`), useNetworkStatusTs);
  writeTextFile(join(netinfoDir, `context.${contextExt}`), contextTsx);
  writeTextFile(join(offlineDir, `netinfo.${fileExt}`), reexportTs);
}

/**
 * Section 58: Outbox infrastructure (stub for now - requires custom implementation).
 */
function generateOutboxInfrastructure(appRoot: string, inputs: InitInputs): void {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const baseContent = inputs.language === 'js'
    ? `/**
 * FILE: src/offline/outbox/outbox.js
 * PURPOSE: Offline outbox utilities (User Zone).
 * OWNERSHIP: USER
 */

// Offline outbox configuration and utilities
// Implement your offline outbox logic here
`
    : `/**
 * FILE: src/offline/outbox/outbox.ts
 * PURPOSE: Offline outbox utilities (User Zone).
 * OWNERSHIP: USER
 */

// Offline outbox configuration and utilities
// Implement your offline outbox logic here
`;
  generateSimpleInfrastructure(appRoot, 'offline', 'outbox', inputs, baseContent.replace(/{subcategory}/g, 'outbox'));
}

/**
 * Section 58: Sync infrastructure (stub for now - requires custom implementation).
 */
function generateSyncInfrastructure(appRoot: string, inputs: InitInputs): void {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const baseContent = inputs.language === 'js'
    ? `/**
 * FILE: src/offline/sync/sync.js
 * PURPOSE: Offline sync utilities (User Zone).
 * OWNERSHIP: USER
 */

// Offline sync configuration and utilities
// Implement your offline sync logic here
`
    : `/**
 * FILE: src/offline/sync/sync.ts
 * PURPOSE: Offline sync utilities (User Zone).
 * OWNERSHIP: USER
 */

// Offline sync configuration and utilities
// Implement your offline sync logic here
`;
  generateSimpleInfrastructure(appRoot, 'offline', 'sync', inputs, baseContent.replace(/{subcategory}/g, 'sync'));
}

function generateNotificationsInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.notifications?.expo) {
    generateExpoNotificationsInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.notifications?.fcm) {
    generateFcmNotificationsInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.notifications?.onesignal) {
    generateOneSignalNotificationsInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 59: Real Expo Notifications infrastructure.
 */
function generateExpoNotificationsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const notificationsDir = join(appRoot, USER_SRC_DIR, 'notifications');
  const expoDir = join(notificationsDir, 'expo');
  const hooksDir = join(expoDir, 'hooks');
  const handlersDir = join(expoDir, 'handlers');
  ensureDir(hooksDir);
  ensureDir(handlersDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/notifications/expo/service.ts
 * PURPOSE: Expo Notifications service (User Zone).
 * OWNERSHIP: USER
 */

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationService {
  requestPermissions(): Promise<Notifications.NotificationPermissionsStatus>;
  scheduleNotification(title: string, body: string, seconds: number): Promise<string>;
  cancelNotification(identifier: string): Promise<void>;
  getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]>;
}

export const notificationService: NotificationService = {
  async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.requestPermissionsAsync();
  },

  async scheduleNotification(title: string, body: string, seconds: number): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds },
    });
  },

  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  },

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  },
};
`;

  const hookTs = `/**
 * FILE: src/notifications/expo/hooks/useNotifications.ts
 * PURPOSE: Expo Notifications hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../service';

export function useNotifications() {
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    notificationService.requestPermissions().then(setPermissions);
    Notifications.getExpoPushTokenAsync().then((token) => setExpoPushToken(token.data));
  }, []);

  return { permissions, expoPushToken };
}
`;

  const handlerTs = `/**
 * FILE: src/notifications/expo/handlers/notificationHandler.ts
 * PURPOSE: Expo notification handlers (User Zone).
 * OWNERSHIP: USER
 */

import * as Notifications from 'expo-notifications';

export function setupNotificationHandlers() {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
  });
}
`;

  const reexportTs = `/**
 * FILE: src/notifications/expo.ts
 * PURPOSE: Re-export Expo Notifications (User Zone).
 * OWNERSHIP: USER
 */

export { notificationService } from './expo/service';
export type { NotificationService } from './expo/service';
export { useNotifications } from './expo/hooks/useNotifications';
export { setupNotificationHandlers } from './expo/handlers/notificationHandler';
`;

  writeTextFile(join(expoDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useNotifications.${fileExt}`), hookTs);
  writeTextFile(join(handlersDir, `notificationHandler.${fileExt}`), handlerTs);
  writeTextFile(join(notificationsDir, `expo.${fileExt}`), reexportTs);
}

/**
 * Section 59: Real FCM Notifications infrastructure.
 */
function generateFcmNotificationsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const notificationsDir = join(appRoot, USER_SRC_DIR, 'notifications');
  const fcmDir = join(notificationsDir, 'fcm');
  const hooksDir = join(fcmDir, 'hooks');
  const handlersDir = join(fcmDir, 'handlers');
  ensureDir(hooksDir);
  ensureDir(handlersDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/notifications/fcm/service.ts
 * PURPOSE: FCM service (User Zone).
 * OWNERSHIP: USER
 */

import messaging from '@react-native-firebase/messaging';

export interface FcmService {
  requestPermission(): Promise<number>;
  getToken(): Promise<string>;
  deleteToken(): Promise<void>;
  onMessage(): ReturnType<typeof messaging().onMessage>;
  onNotificationOpenedApp(): ReturnType<typeof messaging().onNotificationOpenedApp>;
  getInitialNotification(): Promise<ReturnType<typeof messaging().getInitialNotification>>;
}

export const fcmService: FcmService = {
  async requestPermission(): Promise<number> {
    return await messaging().requestPermission();
  },

  async getToken(): Promise<string> {
    return await messaging().getToken();
  },

  async deleteToken(): Promise<void> {
    await messaging().deleteToken();
  },

  onMessage() {
    return messaging().onMessage((remoteMessage) => {
      console.log('FCM message received:', remoteMessage);
    });
  },

  onNotificationOpenedApp() {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('FCM notification opened:', remoteMessage);
    });
  },

  async getInitialNotification() {
    return await messaging().getInitialNotification();
  },
};
`;

  const hookTs = `/**
 * FILE: src/notifications/fcm/hooks/useNotifications.ts
 * PURPOSE: FCM Notifications hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import { fcmService } from '../service';

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<number | null>(null);

  useEffect(() => {
    fcmService.requestPermission().then(setPermission);
    fcmService.getToken().then(setToken);
  }, []);

  return { token, permission };
}
`;

  const handlerTs = `/**
 * FILE: src/notifications/fcm/handlers/messageHandler.ts
 * PURPOSE: FCM message handlers (User Zone).
 * OWNERSHIP: USER
 */

import { fcmService } from '../service';

export function setupFcmHandlers() {
  const unsubscribeMessage = fcmService.onMessage();
  const unsubscribeOpened = fcmService.onNotificationOpenedApp();

  return () => {
    unsubscribeMessage();
    unsubscribeOpened();
  };
}
`;

  const reexportTs = `/**
 * FILE: src/notifications/fcm.ts
 * PURPOSE: Re-export FCM Notifications (User Zone).
 * OWNERSHIP: USER
 */

export { fcmService } from './fcm/service';
export type { FcmService } from './fcm/service';
export { useNotifications } from './fcm/hooks/useNotifications';
export { setupFcmHandlers } from './fcm/handlers/messageHandler';
`;

  writeTextFile(join(fcmDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useNotifications.${fileExt}`), hookTs);
  writeTextFile(join(handlersDir, `messageHandler.${fileExt}`), handlerTs);
  writeTextFile(join(notificationsDir, `fcm.${fileExt}`), reexportTs);
}

/**
 * Section 59: Real OneSignal Notifications infrastructure.
 */
function generateOneSignalNotificationsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const notificationsDir = join(appRoot, USER_SRC_DIR, 'notifications');
  const onesignalDir = join(notificationsDir, 'onesignal');
  const hooksDir = join(onesignalDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/notifications/onesignal/service.ts
 * PURPOSE: OneSignal service (User Zone).
 * OWNERSHIP: USER
 */

import OneSignal from 'react-native-onesignal';

export interface OneSignalService {
  setAppId(appId: string): void;
  promptForPushNotificationsWithUserResponse(): Promise<boolean>;
  getDeviceState(): Promise<OneSignal.DeviceState | null>;
  setNotificationWillShowInForegroundHandler(handler: (event: OneSignal.NotificationReceivedEvent) => void): void;
  setNotificationOpenedHandler(handler: (result: OneSignal.NotificationOpenedResult) => void): void;
}

export const oneSignalService: OneSignalService = {
  setAppId(appId: string) {
    OneSignal.setAppId(appId);
  },

  async promptForPushNotificationsWithUserResponse(): Promise<boolean> {
    return await OneSignal.promptForPushNotificationsWithUserResponse();
  },

  async getDeviceState(): Promise<OneSignal.DeviceState | null> {
    return await OneSignal.getDeviceState();
  },

  setNotificationWillShowInForegroundHandler(handler: (event: OneSignal.NotificationReceivedEvent) => void) {
    OneSignal.setNotificationWillShowInForegroundHandler(handler);
  },

  setNotificationOpenedHandler(handler: (result: OneSignal.NotificationOpenedResult) => void) {
    OneSignal.setNotificationOpenedHandler(handler);
  },
};
`;

  const hookTs = `/**
 * FILE: src/notifications/onesignal/hooks/useNotifications.ts
 * PURPOSE: OneSignal Notifications hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import { oneSignalService } from '../service';
import type OneSignal from 'react-native-onesignal';

export function useNotifications() {
  const [deviceState, setDeviceState] = useState<OneSignal.DeviceState | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);

  useEffect(() => {
    oneSignalService.getDeviceState().then(setDeviceState);
    oneSignalService.promptForPushNotificationsWithUserResponse().then(setPermission);
  }, []);

  return { deviceState, permission };
}
`;

  const reexportTs = `/**
 * FILE: src/notifications/onesignal.ts
 * PURPOSE: Re-export OneSignal Notifications (User Zone).
 * OWNERSHIP: USER
 */

export { oneSignalService } from './onesignal/service';
export type { OneSignalService } from './onesignal/service';
export { useNotifications } from './onesignal/hooks/useNotifications';
`;

  writeTextFile(join(onesignalDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useNotifications.${fileExt}`), hookTs);
  writeTextFile(join(notificationsDir, `onesignal.${fileExt}`), reexportTs);
}

function generateMapsInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.maps?.location) {
    generateLocationInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.maps?.google) {
    generateGoogleMapsInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 60: Real Location (Geolocation) infrastructure.
 */
function generateLocationInfrastructure(appRoot: string, inputs: InitInputs): void {
  const geoDir = join(appRoot, USER_SRC_DIR, 'geo');
  const locationDir = join(geoDir, 'location');
  const hooksDir = join(locationDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/geo/location/service.ts
 * PURPOSE: Geolocation service (User Zone).
 * OWNERSHIP: USER
 */

import Geolocation from '@react-native-community/geolocation';

export interface Location {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface LocationService {
  getCurrentPosition(): Promise<Location>;
  watchPosition(onUpdate: (location: Location) => void): number;
  clearWatch(watchId: number): void;
  requestAuthorization(): Promise<'granted' | 'denied'>;
}

export const locationService: LocationService = {
  async getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude ?? null,
            accuracy: position.coords.accuracy ?? null,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
          });
        },
        reject,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  },

  watchPosition(onUpdate: (location: Location) => void): number {
    return Geolocation.watchPosition(
      (position) => {
        onUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? null,
          accuracy: position.coords.accuracy ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
        });
      },
      (error) => console.error('Location watch error:', error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
  },

  clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  },

  async requestAuthorization(): Promise<'granted' | 'denied'> {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve('granted'),
        () => resolve('denied')
      );
    });
  },
};
`;

  const hookTs = `/**
 * FILE: src/geo/location/hooks/useLocation.ts
 * PURPOSE: Location hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { locationService, type Location } from '../service';

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    const result = await locationService.requestAuthorization();
    setAuthorized(result === 'granted');
    return result === 'granted';
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await locationService.getCurrentPosition();
      setLocation(loc);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestPermission().then((granted) => {
      if (granted) {
        getCurrentLocation();
      }
    });
  }, [requestPermission, getCurrentLocation]);

  return { location, loading, error, authorized, getCurrentLocation, requestPermission };
}
`;

  const reexportTs = `/**
 * FILE: src/geo/location.ts
 * PURPOSE: Re-export Location utilities (User Zone).
 * OWNERSHIP: USER
 */

export { locationService } from './location/service';
export type { Location, LocationService } from './location/service';
export { useLocation } from './location/hooks/useLocation';
`;

  writeTextFile(join(locationDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useLocation.${fileExt}`), hookTs);
  writeTextFile(join(geoDir, `location.${fileExt}`), reexportTs);
}

/**
 * Section 60: Real Google Maps infrastructure.
 */
function generateGoogleMapsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const mapsDir = join(appRoot, USER_SRC_DIR, 'maps');
  const googleDir = join(mapsDir, 'google');
  const componentsDir = join(googleDir, 'components');
  const servicesDir = join(googleDir, 'services');
  ensureDir(componentsDir);
  ensureDir(servicesDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const mapViewTsx = `/**
 * FILE: src/maps/google/components/MapView.tsx
 * PURPOSE: Google Maps MapView component (User Zone).
 * OWNERSHIP: USER
 */

import React from 'react';
import MapView from 'react-native-maps';

export interface GoogleMapViewProps {
  style?: object;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export function GoogleMapView({ style, initialRegion }: GoogleMapViewProps) {
  return (
    <MapView
      style={style || { flex: 1 }}
      initialRegion={initialRegion || {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    />
  );
}
`;

  const serviceTs = `/**
 * FILE: src/maps/google/services/googleMapsService.ts
 * PURPOSE: Google Maps service utilities (User Zone).
 * OWNERSHIP: USER
 */

export interface GoogleMapsService {
  // Add Google Maps API utilities here
}

export const googleMapsService: GoogleMapsService = {};
`;

  const reexportTs = `/**
 * FILE: src/maps/google.ts
 * PURPOSE: Re-export Google Maps utilities (User Zone).
 * OWNERSHIP: USER
 */

export { GoogleMapView } from './google/components/MapView';
export type { GoogleMapViewProps } from './google/components/MapView';
export { googleMapsService } from './google/services/googleMapsService';
export type { GoogleMapsService } from './google/services/googleMapsService';
`;

  writeTextFile(join(componentsDir, `MapView.${componentExt}`), mapViewTsx);
  writeTextFile(join(servicesDir, `googleMapsService.${fileExt}`), serviceTs);
  writeTextFile(join(mapsDir, `google.${fileExt}`), reexportTs);
}

function generateMediaInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.media?.camera) {
    generateCameraInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.media?.visionCamera) {
    generateVisionCameraInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.media?.picker) {
    generateMediaPickerInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 61: Real Camera (Expo) infrastructure.
 */
function generateCameraInfrastructure(appRoot: string, inputs: InitInputs): void {
  const mediaDir = join(appRoot, USER_SRC_DIR, 'media');
  const cameraDir = join(mediaDir, 'camera');
  const componentsDir = join(cameraDir, 'components');
  const hooksDir = join(cameraDir, 'hooks');
  ensureDir(componentsDir);
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const cameraViewTsx = `/**
 * FILE: src/media/camera/components/CameraView.tsx
 * PURPOSE: Camera component (User Zone).
 * OWNERSHIP: USER
 */

import React, { useState, useRef } from 'react';
import { View, Button } from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';

export interface CameraViewProps {
  onPhotoTaken?: (uri: string) => void;
}

export function CameraView({ onPhotoTaken }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View>
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      onPhotoTaken?.(photo.uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpoCameraView ref={cameraRef} style={{ flex: 1 }} />
      <Button title="Take Picture" onPress={takePicture} />
    </View>
  );
}
`;

  const hookTs = `/**
 * FILE: src/media/camera/hooks/useCamera.ts
 * PURPOSE: Camera hook (User Zone).
 * OWNERSHIP: USER
 */

import { useCameraPermissions } from 'expo-camera';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();

  return {
    permission,
    requestPermission,
    hasPermission: permission?.granted ?? false,
  };
}
`;

  const reexportTs = `/**
 * FILE: src/media/camera.ts
 * PURPOSE: Re-export Camera utilities (User Zone).
 * OWNERSHIP: USER
 */

export { CameraView } from './camera/components/CameraView';
export type { CameraViewProps } from './camera/components/CameraView';
export { useCamera } from './camera/hooks/useCamera';
`;

  writeTextFile(join(componentsDir, `CameraView.${componentExt}`), cameraViewTsx);
  writeTextFile(join(hooksDir, `useCamera.${fileExt}`), hookTs);
  writeTextFile(join(mediaDir, `camera.${fileExt}`), reexportTs);
}

/**
 * Section 61: Real Vision Camera infrastructure.
 */
function generateVisionCameraInfrastructure(appRoot: string, inputs: InitInputs): void {
  const mediaDir = join(appRoot, USER_SRC_DIR, 'media');
  const visionCameraDir = join(mediaDir, 'vision-camera');
  const componentsDir = join(visionCameraDir, 'components');
  const hooksDir = join(visionCameraDir, 'hooks');
  ensureDir(componentsDir);
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const cameraViewTsx = `/**
 * FILE: src/media/vision-camera/components/CameraView.tsx
 * PURPOSE: Vision Camera component (User Zone).
 * OWNERSHIP: USER
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';

export interface VisionCameraViewProps {
  onFrameProcessed?: (frame: any) => void;
}

export function VisionCameraView({ onFrameProcessed }: VisionCameraViewProps) {
  const device = useCameraDevice('back');
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    onFrameProcessed?.(frame);
  }, []);

  if (!device) {
    return <View style={styles.container} />;
  }

  return (
    <Camera
      style={styles.container}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
`;

  const hookTs = `/**
 * FILE: src/media/vision-camera/hooks/useFrameProcessor.ts
 * PURPOSE: Frame processor hook (User Zone).
 * OWNERSHIP: USER
 */

import { useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';

export function useFrameProcessorHook(onProcess: (frame: any) => void) {
  return useFrameProcessor((frame) => {
    'worklet';
    onProcess(frame);
  }, [onProcess]);
}
`;

  const reexportTs = `/**
 * FILE: src/media/vision-camera.ts
 * PURPOSE: Re-export Vision Camera utilities (User Zone).
 * OWNERSHIP: USER
 */

export { VisionCameraView } from './vision-camera/components/CameraView';
export type { VisionCameraViewProps } from './vision-camera/components/CameraView';
export { useFrameProcessorHook } from './vision-camera/hooks/useFrameProcessor';
`;

  writeTextFile(join(componentsDir, `CameraView.${componentExt}`), cameraViewTsx);
  writeTextFile(join(hooksDir, `useFrameProcessor.${fileExt}`), hookTs);
  writeTextFile(join(mediaDir, `vision-camera.${fileExt}`), reexportTs);
}

/**
 * Section 61: Real Media Picker infrastructure.
 */
function generateMediaPickerInfrastructure(appRoot: string, inputs: InitInputs): void {
  const mediaDir = join(appRoot, USER_SRC_DIR, 'media');
  const pickerDir = join(mediaDir, 'picker');
  const hooksDir = join(pickerDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/media/picker/service.ts
 * PURPOSE: Media picker service (User Zone).
 * OWNERSHIP: USER
 */

import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';

export interface MediaPickerService {
  pickImage(options?: { mediaType?: MediaType; allowsEditing?: boolean }): Promise<ImagePickerResponse>;
  takePhoto(options?: { mediaType?: MediaType; allowsEditing?: boolean }): Promise<ImagePickerResponse>;
}

export const mediaPickerService: MediaPickerService = {
  async pickImage(options = {}) {
    return new Promise((resolve, reject) => {
      launchImageLibrary(
        {
          mediaType: options.mediaType || 'photo',
          quality: 0.8,
          allowsEditing: options.allowsEditing ?? false,
        },
        (response) => {
          if (response.didCancel) {
            reject(new Error('User cancelled'));
          } else if (response.errorMessage) {
            reject(new Error(response.errorMessage));
          } else {
            resolve(response);
          }
        }
      );
    });
  },

  async takePhoto(options = {}) {
    return new Promise((resolve, reject) => {
      launchCamera(
        {
          mediaType: options.mediaType || 'photo',
          quality: 0.8,
          allowsEditing: options.allowsEditing ?? false,
        },
        (response) => {
          if (response.didCancel) {
            reject(new Error('User cancelled'));
          } else if (response.errorMessage) {
            reject(new Error(response.errorMessage));
          } else {
            resolve(response);
          }
        }
      );
    });
  },
};
`;

  const hookTs = `/**
 * FILE: src/media/picker/hooks/useMediaPicker.ts
 * PURPOSE: Media picker hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { mediaPickerService } from '../service';
import type { ImagePickerResponse } from 'react-native-image-picker';

export function useMediaPicker() {
  const [image, setImage] = useState<ImagePickerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pickImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaPickerService.pickImage();
      setImage(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mediaPickerService.takePhoto();
      setImage(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  return { image, loading, error, pickImage, takePhoto };
}
`;

  const reexportTs = `/**
 * FILE: src/media/picker.ts
 * PURPOSE: Re-export Media Picker utilities (User Zone).
 * OWNERSHIP: USER
 */

export { mediaPickerService } from './picker/service';
export type { MediaPickerService } from './picker/service';
export { useMediaPicker } from './picker/hooks/useMediaPicker';
`;

  writeTextFile(join(pickerDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useMediaPicker.${fileExt}`), hookTs);
  writeTextFile(join(mediaDir, `picker.${fileExt}`), reexportTs);
}

function generatePaymentsInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.payments?.stripe) {
    generateStripePaymentsInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 62: Real Stripe Payments infrastructure.
 */
function generateStripePaymentsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const paymentsDir = join(appRoot, USER_SRC_DIR, 'payments');
  const stripeDir = join(paymentsDir, 'stripe');
  const hooksDir = join(stripeDir, 'hooks');
  const componentsDir = join(stripeDir, 'components');
  ensureDir(hooksDir);
  ensureDir(componentsDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const serviceTs = `/**
 * FILE: src/payments/stripe/service.ts
 * PURPOSE: Stripe payment service (User Zone).
 * OWNERSHIP: USER
 */

import { initStripe, presentPaymentSheet, createPaymentMethod } from '@stripe/stripe-react-native';

export interface StripeService {
  initialize(publishableKey: string): Promise<void>;
  createPaymentMethod(params: { type: string; cardDetails: any }): Promise<any>;
  presentPaymentSheet(params: { paymentIntentClientSecret: string }): Promise<{ error?: any }>;
}

export const stripeService: StripeService = {
  async initialize(publishableKey: string): Promise<void> {
    await initStripe({ publishableKey });
  },

  async createPaymentMethod(params: { type: string; cardDetails: any }): Promise<any> {
    const { error, paymentMethod } = await createPaymentMethod({
      paymentMethodType: params.type as any,
      paymentMethodData: params.cardDetails,
    });
    if (error) {
      throw new Error(error.message);
    }
    return paymentMethod;
  },

  async presentPaymentSheet(params: { paymentIntentClientSecret: string }): Promise<{ error?: any }> {
    const { error } = await presentPaymentSheet({
      clientSecret: params.paymentIntentClientSecret,
    });
    return { error };
  },
};
`;

  const hookTs = `/**
 * FILE: src/payments/stripe/hooks/useStripe.ts
 * PURPOSE: Stripe payment hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { stripeService } from '../service';

export function useStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async (publishableKey: string) => {
    setLoading(true);
    setError(null);
    try {
      await stripeService.initialize(publishableKey);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (params: { type: string; cardDetails: any }) => {
    setLoading(true);
    setError(null);
    try {
      return await stripeService.createPaymentMethod(params);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (paymentIntentClientSecret: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await stripeService.presentPaymentSheet({ paymentIntentClientSecret });
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, initialize, createPayment, confirmPayment };
}
`;

  const componentTsx = `/**
 * FILE: src/payments/stripe/components/PaymentButton.tsx
 * PURPOSE: Stripe payment button component (User Zone).
 * OWNERSHIP: USER
 */

import React from 'react';
import { Button } from 'react-native';
import { useStripe } from '../hooks/useStripe';

export interface PaymentButtonProps {
  paymentIntentClientSecret: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PaymentButton({ paymentIntentClientSecret, onSuccess, onError }: PaymentButtonProps) {
  const { confirmPayment, loading, error } = useStripe();

  const handlePress = async () => {
    try {
      await confirmPayment(paymentIntentClientSecret);
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return <Button title="Pay" onPress={handlePress} disabled={loading} />;
}
`;

  const reexportTs = `/**
 * FILE: src/payments/stripe.ts
 * PURPOSE: Re-export Stripe Payments utilities (User Zone).
 * OWNERSHIP: USER
 */

export { stripeService } from './stripe/service';
export type { StripeService } from './stripe/service';
export { useStripe } from './stripe/hooks/useStripe';
export { PaymentButton } from './stripe/components/PaymentButton';
export type { PaymentButtonProps } from './stripe/components/PaymentButton';
`;

  writeTextFile(join(stripeDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useStripe.${fileExt}`), hookTs);
  writeTextFile(join(componentsDir, `PaymentButton.${componentExt}`), componentTsx);
  writeTextFile(join(paymentsDir, `stripe.${fileExt}`), reexportTs);
}

function generateIapInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.iap?.revenuecat) {
    generateRevenueCatIapInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.iap?.adapty) {
    generateAdaptyIapInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.iap?.appStore) {
    generateAppStoreIapInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.iap?.playBilling) {
    generatePlayBillingIapInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 63: Real RevenueCat IAP infrastructure.
 */
function generateRevenueCatIapInfrastructure(appRoot: string, inputs: InitInputs): void {
  const iapDir = join(appRoot, USER_SRC_DIR, 'iap');
  const revenuecatDir = join(iapDir, 'revenuecat');
  const hooksDir = join(revenuecatDir, 'hooks');
  const servicesDir = join(revenuecatDir, 'services');
  ensureDir(hooksDir);
  ensureDir(servicesDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/iap/revenuecat/service.ts
 * PURPOSE: RevenueCat IAP service (User Zone).
 * OWNERSHIP: USER
 */

import Purchases from 'react-native-purchases';

export interface RevenueCatService {
  configure(apiKey: string): Promise<void>;
  getCustomerInfo(): Promise<import('react-native-purchases').CustomerInfo>;
  getOfferings(): Promise<import('react-native-purchases').PurchasesOffering | null>;
  purchasePackage(packageToPurchase: { identifier: string }): Promise<{ customerInfo: import('react-native-purchases').CustomerInfo }>;
  restorePurchases(): Promise<import('react-native-purchases').CustomerInfo>;
}

export const revenueCatService: RevenueCatService = {
  async configure(apiKey: string): Promise<void> {
    await Purchases.configure({ apiKey });
  },

  async getCustomerInfo(): Promise<CustomerInfo> {
    return await Purchases.getCustomerInfo();
  },

  async getOfferings() {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  },

  async purchasePackage(packageToPurchase: { identifier: string }) {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageToPurchase.identifier);
    if (!pkg) throw new Error('Package not found');
    return await Purchases.purchasePackage(pkg);
  },

  async restorePurchases(): Promise<CustomerInfo> {
    return await Purchases.restorePurchases();
  },
};
`;

  const subscriptionTs = `/**
 * FILE: src/iap/revenuecat/services/subscriptionService.ts
 * PURPOSE: Subscription management (User Zone).
 * OWNERSHIP: USER
 */

import { revenueCatService } from '../service';

export interface SubscriptionStatus {
  isActive: boolean;
  entitlements: string[];
  expirationDate: Date | null;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const info = await revenueCatService.getCustomerInfo();
  const entitlements = Object.keys(info.entitlements.active);
  const expiration = entitlements.length > 0
    ? Object.values(info.entitlements.active)[0]?.expirationDate ?? null
    : null;
  return {
    isActive: entitlements.length > 0,
    entitlements,
    expirationDate: expiration ? new Date(expiration) : null,
  };
}
`;

  const hookTs = `/**
 * FILE: src/iap/revenuecat/hooks/useIAP.ts
 * PURPOSE: RevenueCat IAP hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { revenueCatService } from '../service';
import { getSubscriptionStatus, type SubscriptionStatus } from '../services/subscriptionService';

export function useIAP() {
  const [customerInfo, setCustomerInfo] = useState<import('react-native-purchases').CustomerInfo | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [info, status] = await Promise.all([
        revenueCatService.getCustomerInfo(),
        getSubscriptionStatus(),
      ]);
      setCustomerInfo(info);
      setSubscriptionStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await revenueCatService.restorePurchases();
      setCustomerInfo(info);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return { customerInfo, subscriptionStatus, loading, error, refresh, restore };
}
`;

  const reexportTs = `/**
 * FILE: src/iap/revenuecat.ts
 * PURPOSE: Re-export RevenueCat IAP (User Zone).
 * OWNERSHIP: USER
 */

export { revenueCatService } from './revenuecat/service';
export type { RevenueCatService } from './revenuecat/service';
export { useIAP } from './revenuecat/hooks/useIAP';
export { getSubscriptionStatus } from './revenuecat/services/subscriptionService';
export type { SubscriptionStatus } from './revenuecat/services/subscriptionService';
`;

  writeTextFile(join(revenuecatDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(servicesDir, `subscriptionService.${fileExt}`), subscriptionTs);
  writeTextFile(join(hooksDir, `useIAP.${fileExt}`), hookTs);
  writeTextFile(join(iapDir, `revenuecat.${fileExt}`), reexportTs);
}

/**
 * Section 63: Real Adapty IAP infrastructure.
 */
function generateAdaptyIapInfrastructure(appRoot: string, inputs: InitInputs): void {
  const iapDir = join(appRoot, USER_SRC_DIR, 'iap');
  const adaptyDir = join(iapDir, 'adapty');
  const hooksDir = join(adaptyDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/iap/adapty/service.ts
 * PURPOSE: Adapty IAP service (User Zone).
 * OWNERSHIP: USER
 */

import Adapty from 'react-native-adapty';

export interface AdaptyService {
  activate(apiKey: string): Promise<void>;
  getProfile(): Promise<unknown>;
  getPaywall(id: string): Promise<unknown>;
  purchase(product: unknown): Promise<unknown>;
  restorePurchases(): Promise<unknown>;
}

export const adaptyService: AdaptyService = {
  async activate(apiKey: string): Promise<void> {
    await Adapty.activate(apiKey);
  },

  async getProfile(): Promise<Adapty.Profile> {
    return await Adapty.getProfile();
  },

  async getPaywall(id: string) {
    return await Adapty.getPaywall(id);
  },

  async purchase(product: unknown) {
    return await Adapty.purchase(product);
  },

  async restorePurchases(): Promise<Adapty.Profile> {
    return await Adapty.restorePurchases();
  },
};
`;

  const hookTs = `/**
 * FILE: src/iap/adapty/hooks/useIAP.ts
 * PURPOSE: Adapty IAP hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { adaptyService } from '../service';

export function useIAP() {
  const [profile, setProfile] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await adaptyService.getProfile();
      setProfile(p);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await adaptyService.restorePurchases();
      setProfile(p);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, refresh, restore };
}
`;

  const reexportTs = `/**
 * FILE: src/iap/adapty.ts
 * PURPOSE: Re-export Adapty IAP (User Zone).
 * OWNERSHIP: USER
 */

export { adaptyService } from './adapty/service';
export type { AdaptyService } from './adapty/service';
export { useIAP } from './adapty/hooks/useIAP';
`;

  writeTextFile(join(adaptyDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useIAP.${fileExt}`), hookTs);
  writeTextFile(join(iapDir, `adapty.${fileExt}`), reexportTs);
}

/**
 * Section 63: Real App Store IAP infrastructure.
 */
function generateAppStoreIapInfrastructure(appRoot: string, inputs: InitInputs): void {
  const iapDir = join(appRoot, USER_SRC_DIR, 'iap');
  const appStoreDir = join(iapDir, 'app-store');
  const hooksDir = join(appStoreDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/iap/app-store/service.ts
 * PURPOSE: App Store IAP service (User Zone).
 * OWNERSHIP: USER
 */

import * as RNIap from 'react-native-iap';

export interface AppStoreIapService {
  initConnection(): Promise<void>;
  endConnection(): Promise<void>;
  getProducts(skus: string[]): Promise<RNIap.Product[]>;
  requestPurchase(sku: string): Promise<RNIap.PurchaseResult>;
  finishTransaction(purchase: RNIap.Purchase): Promise<void>;
  getAvailablePurchases(): Promise<RNIap.Purchase[]>;
}

export const appStoreIapService: AppStoreIapService = {
  async initConnection(): Promise<void> {
    await RNIap.initConnection();
  },

  async endConnection(): Promise<void> {
    await RNIap.endConnection();
  },

  async getProducts(skus: string[]): Promise<RNIap.Product[]> {
    return await RNIap.getProducts({ skus });
  },

  async requestPurchase(sku: string): Promise<RNIap.PurchaseResult> {
    return await RNIap.requestPurchase({ sku });
  },

  async finishTransaction(purchase: RNIap.Purchase): Promise<void> {
    await RNIap.finishTransaction({ purchase });
  },

  async getAvailablePurchases(): Promise<RNIap.Purchase[]> {
    return await RNIap.getAvailablePurchases();
  },
};
`;

  const hookTs = `/**
 * FILE: src/iap/app-store/hooks/useIAP.ts
 * PURPOSE: App Store IAP hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { appStoreIapService } from '../service';
import type * as RNIap from 'react-native-iap';

export function useIAP() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [purchases, setPurchases] = useState<RNIap.Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async (skus: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const list = await appStoreIapService.getProducts(skus);
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await appStoreIapService.getAvailablePurchases();
      setPurchases(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    appStoreIapService.initConnection().then(() => loadPurchases());
    return () => {
      appStoreIapService.endConnection();
    };
  }, [loadPurchases]);

  const purchase = useCallback(async (sku: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await appStoreIapService.requestPurchase(sku);
      await loadPurchases();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPurchases]);

  return { products, purchases, loading, error, loadProducts, loadPurchases, purchase };
}
`;

  const reexportTs = `/**
 * FILE: src/iap/app-store.ts
 * PURPOSE: Re-export App Store IAP (User Zone).
 * OWNERSHIP: USER
 */

export { appStoreIapService } from './app-store/service';
export type { AppStoreIapService } from './app-store/service';
export { useIAP } from './app-store/hooks/useIAP';
`;

  writeTextFile(join(appStoreDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useIAP.${fileExt}`), hookTs);
  writeTextFile(join(iapDir, `app-store.${fileExt}`), reexportTs);
}

/**
 * Section 63: Real Play Billing IAP infrastructure.
 */
function generatePlayBillingIapInfrastructure(appRoot: string, inputs: InitInputs): void {
  const iapDir = join(appRoot, USER_SRC_DIR, 'iap');
  const playBillingDir = join(iapDir, 'play-billing');
  const hooksDir = join(playBillingDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/iap/play-billing/service.ts
 * PURPOSE: Google Play Billing service (User Zone).
 * OWNERSHIP: USER
 */

import * as RNIap from 'react-native-iap';

export interface PlayBillingService {
  initConnection(): Promise<void>;
  endConnection(): Promise<void>;
  getProducts(skus: string[]): Promise<RNIap.Product[]>;
  requestPurchase(sku: string): Promise<RNIap.PurchaseResult>;
  finishTransaction(purchase: RNIap.Purchase): Promise<void>;
  getAvailablePurchases(): Promise<RNIap.Purchase[]>;
}

export const playBillingService: PlayBillingService = {
  async initConnection(): Promise<void> {
    await RNIap.initConnection();
  },

  async endConnection(): Promise<void> {
    await RNIap.endConnection();
  },

  async getProducts(skus: string[]): Promise<RNIap.Product[]> {
    return await RNIap.getProducts({ skus });
  },

  async requestPurchase(sku: string): Promise<RNIap.PurchaseResult> {
    return await RNIap.requestPurchase({ sku });
  },

  async finishTransaction(purchase: RNIap.Purchase): Promise<void> {
    await RNIap.finishTransaction({ purchase });
  },

  async getAvailablePurchases(): Promise<RNIap.Purchase[]> {
    return await RNIap.getAvailablePurchases();
  },
};
`;

  const hookTs = `/**
 * FILE: src/iap/play-billing/hooks/useIAP.ts
 * PURPOSE: Play Billing IAP hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { playBillingService } from '../service';
import type * as RNIap from 'react-native-iap';

export function useIAP() {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [purchases, setPurchases] = useState<RNIap.Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async (skus: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const list = await playBillingService.getProducts(skus);
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await playBillingService.getAvailablePurchases();
      setPurchases(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    playBillingService.initConnection().then(() => loadPurchases());
    return () => {
      playBillingService.endConnection();
    };
  }, [loadPurchases]);

  const purchase = useCallback(async (sku: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await playBillingService.requestPurchase(sku);
      await loadPurchases();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPurchases]);

  return { products, purchases, loading, error, loadProducts, loadPurchases, purchase };
}
`;

  const reexportTs = `/**
 * FILE: src/iap/play-billing.ts
 * PURPOSE: Re-export Play Billing IAP (User Zone).
 * OWNERSHIP: USER
 */

export { playBillingService } from './play-billing/service';
export type { PlayBillingService } from './play-billing/service';
export { useIAP } from './play-billing/hooks/useIAP';
`;

  writeTextFile(join(playBillingDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useIAP.${fileExt}`), hookTs);
  writeTextFile(join(iapDir, `play-billing.${fileExt}`), reexportTs);
}

function generateAnalyticsInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.analytics?.firebase) {
    generateFirebaseAnalyticsInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.analytics?.amplitude) {
    generateAmplitudeAnalyticsInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.analytics?.sentry) {
    generateSentryAnalyticsInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.analytics?.bugsnag) {
    generateBugsnagAnalyticsInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 64: Real Firebase Analytics infrastructure.
 */
function generateFirebaseAnalyticsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const analyticsDir = join(appRoot, USER_SRC_DIR, 'analytics');
  const firebaseDir = join(analyticsDir, 'firebase');
  const hooksDir = join(firebaseDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/analytics/firebase/service.ts
 * PURPOSE: Firebase Analytics service (User Zone).
 * OWNERSHIP: USER
 */

import analytics from '@react-native-firebase/analytics';

export const analyticsInstance = analytics();

export interface FirebaseAnalyticsService {
  logEvent(name: string, params?: Record<string, unknown>): Promise<void>;
  setUserId(userId: string | null): Promise<void>;
  setUserProperty(name: string, value: string | null): Promise<void>;
  setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
}

export const firebaseAnalyticsService: FirebaseAnalyticsService = {
  async logEvent(name: string, params?: Record<string, unknown>): Promise<void> {
    await analyticsInstance.logEvent(name, params);
  },

  async setUserId(userId: string | null): Promise<void> {
    await analyticsInstance.setUserId(userId ?? undefined);
  },

  async setUserProperty(name: string, value: string | null): Promise<void> {
    await analyticsInstance.setUserProperty(name, value ?? undefined);
  },

  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    await analyticsInstance.setAnalyticsCollectionEnabled(enabled);
  },
};
`;

  const hookTs = `/**
 * FILE: src/analytics/firebase/hooks/useAnalytics.ts
 * PURPOSE: Firebase Analytics hook (User Zone).
 * OWNERSHIP: USER
 */

import { useCallback } from 'react';
import { firebaseAnalyticsService } from '../service';

export function useAnalytics() {
  const logEvent = useCallback((name: string, params?: Record<string, unknown>) => {
    return firebaseAnalyticsService.logEvent(name, params);
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    return firebaseAnalyticsService.setUserId(userId);
  }, []);

  const setUserProperty = useCallback((name: string, value: string | null) => {
    return firebaseAnalyticsService.setUserProperty(name, value);
  }, []);

  return { logEvent, setUserId, setUserProperty };
}
`;

  const reexportTs = `/**
 * FILE: src/analytics/firebase.ts
 * PURPOSE: Re-export Firebase Analytics (User Zone).
 * OWNERSHIP: USER
 */

export { analyticsInstance, firebaseAnalyticsService } from './firebase/service';
export type { FirebaseAnalyticsService } from './firebase/service';
export { useAnalytics } from './firebase/hooks/useAnalytics';
`;

  writeTextFile(join(firebaseDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useAnalytics.${fileExt}`), hookTs);
  writeTextFile(join(analyticsDir, `firebase.${fileExt}`), reexportTs);
}

/**
 * Section 64: Real Amplitude Analytics infrastructure.
 */
function generateAmplitudeAnalyticsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const analyticsDir = join(appRoot, USER_SRC_DIR, 'analytics');
  const amplitudeDir = join(analyticsDir, 'amplitude');
  const hooksDir = join(amplitudeDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/analytics/amplitude/service.ts
 * PURPOSE: Amplitude Analytics service (User Zone).
 * OWNERSHIP: USER
 */

import * as Amplitude from '@amplitude/analytics-react-native';

export interface AmplitudeAnalyticsService {
  init(apiKey: string): Promise<void>;
  track(eventType: string, eventProperties?: Record<string, unknown>): void;
  setUserId(userId: string | null): void;
  setUserProperties(properties: Record<string, unknown>): void;
}

export const amplitudeAnalyticsService: AmplitudeAnalyticsService = {
  async init(apiKey: string): Promise<void> {
    await Amplitude.init(apiKey);
  },

  track(eventType: string, eventProperties?: Record<string, unknown>): void {
    Amplitude.track(eventType, eventProperties);
  },

  setUserId(userId: string | null): void {
    Amplitude.setUserId(userId ?? undefined);
  },

  setUserProperties(properties: Record<string, unknown>): void {
    Amplitude.setUserProperties(properties);
  },
};
`;

  const hookTs = `/**
 * FILE: src/analytics/amplitude/hooks/useAnalytics.ts
 * PURPOSE: Amplitude Analytics hook (User Zone).
 * OWNERSHIP: USER
 */

import { useCallback } from 'react';
import { amplitudeAnalyticsService } from '../service';

export function useAnalytics() {
  const track = useCallback((eventType: string, eventProperties?: Record<string, unknown>) => {
    amplitudeAnalyticsService.track(eventType, eventProperties);
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    amplitudeAnalyticsService.setUserId(userId);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, unknown>) => {
    amplitudeAnalyticsService.setUserProperties(properties);
  }, []);

  return { track, setUserId, setUserProperties };
}
`;

  const reexportTs = `/**
 * FILE: src/analytics/amplitude.ts
 * PURPOSE: Re-export Amplitude Analytics (User Zone).
 * OWNERSHIP: USER
 */

export { amplitudeAnalyticsService } from './amplitude/service';
export type { AmplitudeAnalyticsService } from './amplitude/service';
export { useAnalytics } from './amplitude/hooks/useAnalytics';
`;

  writeTextFile(join(amplitudeDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useAnalytics.${fileExt}`), hookTs);
  writeTextFile(join(analyticsDir, `amplitude.${fileExt}`), reexportTs);
}

/**
 * Section 64: Real Sentry Analytics infrastructure.
 */
function generateSentryAnalyticsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const analyticsDir = join(appRoot, USER_SRC_DIR, 'analytics');
  const sentryDir = join(analyticsDir, 'sentry');
  ensureDir(sentryDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const configTs = `/**
 * FILE: src/analytics/sentry/config.ts
 * PURPOSE: Sentry configuration (User Zone).
 * OWNERSHIP: USER
 */

export const sentryConfig = {
  dsn: '', // Set your Sentry DSN
  enableAutoSessionTracking: true,
  tracesSampleRate: 1.0,
};
`;

  const serviceTs = `/**
 * FILE: src/analytics/sentry/service.ts
 * PURPOSE: Sentry error tracking service (User Zone).
 * OWNERSHIP: USER
 */

import * as Sentry from '@sentry/react-native';
import { sentryConfig } from './config';

export interface SentryAnalyticsService {
  init(): void;
  captureException(error: Error): string | undefined;
  captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'): string | undefined;
  setUser(user: { id?: string; email?: string; username?: string } | null): void;
  setTag(key: string, value: string): void;
}

export const sentryAnalyticsService: SentryAnalyticsService = {
  init(): void {
    Sentry.init({
      dsn: sentryConfig.dsn,
      enableAutoSessionTracking: sentryConfig.enableAutoSessionTracking,
      tracesSampleRate: sentryConfig.tracesSampleRate,
    });
  },

  captureException(error: Error): string | undefined {
    return Sentry.captureException(error);
  },

  captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'): string | undefined {
    return Sentry.captureMessage(message, level);
  },

  setUser(user: { id?: string; email?: string; username?: string } | null): void {
    Sentry.setUser(user ?? undefined);
  },

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  },
};
`;

  const reexportTs = `/**
 * FILE: src/analytics/sentry.ts
 * PURPOSE: Re-export Sentry Analytics (User Zone).
 * OWNERSHIP: USER
 */

export { sentryConfig } from './sentry/config';
export { sentryAnalyticsService } from './sentry/service';
export type { SentryAnalyticsService } from './sentry/service';
`;

  writeTextFile(join(sentryDir, `config.${fileExt}`), configTs);
  writeTextFile(join(sentryDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(analyticsDir, `sentry.${fileExt}`), reexportTs);
}

/**
 * Section 64: Real Bugsnag Analytics infrastructure.
 */
function generateBugsnagAnalyticsInfrastructure(appRoot: string, inputs: InitInputs): void {
  const analyticsDir = join(appRoot, USER_SRC_DIR, 'analytics');
  const bugsnagDir = join(analyticsDir, 'bugsnag');
  ensureDir(bugsnagDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/analytics/bugsnag/service.ts
 * PURPOSE: Bugsnag error tracking service (User Zone).
 * OWNERSHIP: USER
 */

import { Bugsnag } from '@bugsnag/react-native';

export interface BugsnagAnalyticsService {
  start(apiKey: string): void;
  notify(error: Error): void;
  setUser(id: string | null, email?: string, name?: string): void;
  addMetadata(section: string, key: string, value: unknown): void;
}

export const bugsnagAnalyticsService: BugsnagAnalyticsService = {
  start(apiKey: string): void {
    Bugsnag.start({ apiKey });
  },

  notify(error: Error): void {
    Bugsnag.notify(error);
  },

  setUser(id: string | null, email?: string, name?: string): void {
    Bugsnag.setUser(id ?? undefined, email, name);
  },

  addMetadata(section: string, key: string, value: unknown): void {
    Bugsnag.addMetadata(section, key, value);
  },
};
`;

  const reexportTs = `/**
 * FILE: src/analytics/bugsnag.ts
 * PURPOSE: Re-export Bugsnag Analytics (User Zone).
 * OWNERSHIP: USER
 */

export { bugsnagAnalyticsService } from './bugsnag/service';
export type { BugsnagAnalyticsService } from './bugsnag/service';
`;

  writeTextFile(join(bugsnagDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(analyticsDir, `bugsnag.${fileExt}`), reexportTs);
}

function generateSearchInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.search?.algolia) {
    generateAlgoliaSearchInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.search?.localIndex) {
    generateLocalSearchInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 65: Real Algolia Search infrastructure.
 */
function generateAlgoliaSearchInfrastructure(appRoot: string, inputs: InitInputs): void {
  const searchDir = join(appRoot, USER_SRC_DIR, 'search');
  const algoliaDir = join(searchDir, 'algolia');
  const hooksDir = join(algoliaDir, 'hooks');
  const componentsDir = join(algoliaDir, 'components');
  ensureDir(hooksDir);
  ensureDir(componentsDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const serviceTs = `/**
 * FILE: src/search/algolia/service.ts
 * PURPOSE: Algolia search service (User Zone).
 * OWNERSHIP: USER
 */

import algoliasearch from 'algoliasearch/lite';

const client = algoliasearch('', ''); // Set appId, apiKey

export interface AlgoliaSearchService {
  search(indexName: string, query: string, options?: { hitsPerPage?: number }): Promise<{ hits: unknown[] }>;
}

export const algoliaSearchService: AlgoliaSearchService = {
  async search(indexName: string, query: string, options?: { hitsPerPage?: number }): Promise<{ hits: unknown[] }> {
    const index = client.initIndex(indexName);
    const result = await index.search(query, { hitsPerPage: options?.hitsPerPage ?? 20 });
    return { hits: result.hits };
  },
};
`;

  const hookTs = `/**
 * FILE: src/search/algolia/hooks/useSearch.ts
 * PURPOSE: Algolia search hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { algoliaSearchService } from '../service';

export function useSearch(indexName: string) {
  const [hits, setHits] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string, options?: { hitsPerPage?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await algoliaSearchService.search(indexName, query, options);
      setHits(result.hits);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [indexName]);

  return { hits, loading, error, search };
}
`;

  const searchBarTsx = `/**
 * FILE: src/search/algolia/components/SearchBar.tsx
 * PURPOSE: Algolia search UI component (User Zone).
 * OWNERSHIP: USER
 */

import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ placeholder = 'Search...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          onSearch(text);
        }}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 },
});
`;

  const reexportTs = `/**
 * FILE: src/search/algolia.ts
 * PURPOSE: Re-export Algolia Search (User Zone).
 * OWNERSHIP: USER
 */

export { algoliaSearchService } from './algolia/service';
export type { AlgoliaSearchService } from './algolia/service';
export { useSearch } from './algolia/hooks/useSearch';
export { SearchBar } from './algolia/components/SearchBar';
export type { SearchBarProps } from './algolia/components/SearchBar';
`;

  writeTextFile(join(algoliaDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useSearch.${fileExt}`), hookTs);
  writeTextFile(join(componentsDir, `SearchBar.${componentExt}`), searchBarTsx);
  writeTextFile(join(searchDir, `algolia.${fileExt}`), reexportTs);
}

/**
 * Section 65: Real Local Search infrastructure.
 */
function generateLocalSearchInfrastructure(appRoot: string, inputs: InitInputs): void {
  const searchDir = join(appRoot, USER_SRC_DIR, 'search');
  const localDir = join(searchDir, 'local-index');
  const hooksDir = join(localDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/search/local-index/service.ts
 * PURPOSE: Local search index service (User Zone).
 * OWNERSHIP: USER
 */

export interface LocalSearchService {
  addDocuments(indexName: string, documents: Record<string, unknown>[]): void;
  search(indexName: string, query: string): unknown[];
  clearIndex(indexName: string): void;
}

const indexes: Map<string, Record<string, unknown>[]> = new Map();

export const localSearchService: LocalSearchService = {
  addDocuments(indexName: string, documents: Record<string, unknown>[]): void {
    const existing = indexes.get(indexName) ?? [];
    indexes.set(indexName, [...existing, ...documents]);
  },

  search(indexName: string, query: string): unknown[] {
    const docs = indexes.get(indexName) ?? [];
    const q = query.toLowerCase();
    return docs.filter((doc) =>
      Object.values(doc).some((v) => String(v).toLowerCase().includes(q))
    );
  },

  clearIndex(indexName: string): void {
    indexes.set(indexName, []);
  },
};
`;

  const hookTs = `/**
 * FILE: src/search/local-index/hooks/useSearch.ts
 * PURPOSE: Local search hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { localSearchService } from '../service';

export function useSearch(indexName: string) {
  const [hits, setHits] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback((query: string) => {
    setLoading(true);
    const result = localSearchService.search(indexName, query);
    setHits(result);
    setLoading(false);
  }, [indexName]);

  return { hits, loading, search };
}
`;

  const reexportTs = `/**
 * FILE: src/search/local-index.ts
 * PURPOSE: Re-export Local Search (User Zone).
 * OWNERSHIP: USER
 */

export { localSearchService } from './local-index/service';
export type { LocalSearchService } from './local-index/service';
export { useSearch } from './local-index/hooks/useSearch';
`;

  writeTextFile(join(localDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useSearch.${fileExt}`), hookTs);
  writeTextFile(join(searchDir, `local-index.${fileExt}`), reexportTs);
}

function generateOtaInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.ota?.expoUpdates) {
    generateExpoUpdatesOtaInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.ota?.codePush) {
    generateSimpleInfrastructure(appRoot, 'ota', 'code-push', inputs, getOtaStubContent(inputs, 'code-push'));
  }
}

function getOtaStubContent(inputs: InitInputs, subcategory: string): string {
  return inputs.language === 'js'
    ? `/**
 * FILE: src/ota/${subcategory}/${subcategory}.js
 * PURPOSE: OTA ${subcategory} utilities (User Zone).
 * OWNERSHIP: USER
 */

// OTA ${subcategory} configuration and utilities (CodePush deprecated; prefer Expo Updates)
`
    : `/**
 * FILE: src/ota/${subcategory}/${subcategory}.ts
 * PURPOSE: OTA ${subcategory} utilities (User Zone).
 * OWNERSHIP: USER
 */

// OTA ${subcategory} configuration and utilities (CodePush deprecated; prefer Expo Updates)
`;
}

/**
 * Section 66: Real Expo Updates OTA infrastructure.
 */
function generateExpoUpdatesOtaInfrastructure(appRoot: string, inputs: InitInputs): void {
  const otaDir = join(appRoot, USER_SRC_DIR, 'ota');
  const expoUpdatesDir = join(otaDir, 'expo-updates');
  const hooksDir = join(expoUpdatesDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/ota/expo-updates/service.ts
 * PURPOSE: Expo Updates OTA service (User Zone).
 * OWNERSHIP: USER
 */

import * as Updates from 'expo-updates';

export interface ExpoUpdatesService {
  checkForUpdateAsync(): Promise<Updates.UpdateCheckResult>;
  fetchUpdateAsync(): Promise<Updates.UpdateFetchResult>;
  reloadAsync(): Promise<void>;
  isEmbeddedLaunch: boolean;
  updateId: string | null;
  channel: string | null;
  runtimeVersion: string | null;
}

export const expoUpdatesService: ExpoUpdatesService = {
  async checkForUpdateAsync(): Promise<Updates.UpdateCheckResult> {
    return await Updates.checkForUpdateAsync();
  },

  async fetchUpdateAsync(): Promise<Updates.UpdateFetchResult> {
    return await Updates.fetchUpdateAsync();
  },

  async reloadAsync(): Promise<void> {
    await Updates.reloadAsync();
  },

  get isEmbeddedLaunch(): boolean {
    return Updates.isEmbeddedLaunch;
  },

  get updateId(): string | null {
    return Updates.updateId;
  },

  get channel(): string | null {
    return Updates.channel;
  },

  get runtimeVersion(): string | null {
    return Updates.runtimeVersion;
  },
};
`;

  const hookTs = `/**
 * FILE: src/ota/expo-updates/hooks/useOTA.ts
 * PURPOSE: Expo Updates OTA hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { expoUpdatesService } from '../service';
import type { UpdateCheckResult, UpdateFetchResult } from 'expo-updates';

export function useOTA() {
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);
  const [fetchResult, setFetchResult] = useState<UpdateFetchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkForUpdate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await expoUpdatesService.checkForUpdateAsync();
      setCheckResult(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAndReload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await expoUpdatesService.fetchUpdateAsync();
      setFetchResult(result);
      if (result.isNew) {
        await expoUpdatesService.reloadAsync();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkResult,
    fetchResult,
    loading,
    error,
    checkForUpdate,
    fetchAndReload,
    isEmbeddedLaunch: expoUpdatesService.isEmbeddedLaunch,
    updateId: expoUpdatesService.updateId,
    channel: expoUpdatesService.channel,
    runtimeVersion: expoUpdatesService.runtimeVersion,
  };
}
`;

  const reexportTs = `/**
 * FILE: src/ota/expo-updates.ts
 * PURPOSE: Re-export Expo Updates OTA (User Zone).
 * OWNERSHIP: USER
 */

export { expoUpdatesService } from './expo-updates/service';
export type { ExpoUpdatesService } from './expo-updates/service';
export { useOTA } from './expo-updates/hooks/useOTA';
`;

  writeTextFile(join(expoUpdatesDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useOTA.${fileExt}`), hookTs);
  writeTextFile(join(otaDir, `expo-updates.${fileExt}`), reexportTs);
}

function generateBackgroundInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.background?.tasks) {
    generateBackgroundTasksInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.background?.geofencing) {
    generateGeofencingInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.background?.fetch) {
    generateBackgroundFetchInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 67: Real Background Tasks infrastructure.
 */
function generateBackgroundTasksInfrastructure(appRoot: string, inputs: InitInputs): void {
  const backgroundDir = join(appRoot, USER_SRC_DIR, 'background');
  const tasksDir = join(backgroundDir, 'tasks');
  const hooksDir = join(tasksDir, 'hooks');
  const handlersDir = join(tasksDir, 'handlers');
  ensureDir(hooksDir);
  ensureDir(handlersDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/background/tasks/service.ts
 * PURPOSE: Background task service (User Zone).
 * OWNERSHIP: USER
 */

import BackgroundService from 'react-native-background-actions';

export interface BackgroundTaskService {
  start(taskId: string, taskFn: () => Promise<void>, options: { taskTitle: string; taskDesc: string }): Promise<void>;
  stop(taskId: string): Promise<void>;
  isRunning(taskId: string): Promise<boolean>;
}

export const backgroundTaskService: BackgroundTaskService = {
  async start(taskId: string, taskFn: () => Promise<void>, options: { taskTitle: string; taskDesc: string }): Promise<void> {
    await BackgroundService.start(taskFn, {
      taskName: taskId,
      taskTitle: options.taskTitle,
      taskDesc: options.taskDesc,
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#ff00ff',
      linkingURI: undefined,
      parameters: {},
    });
  },

  async stop(taskId: string): Promise<void> {
    await BackgroundService.stop();
  },

  async isRunning(_taskId: string): Promise<boolean> {
    return BackgroundService.isRunning();
  },
};
`;

  const hookTs = `/**
 * FILE: src/background/tasks/hooks/useBackgroundTask.ts
 * PURPOSE: Background task hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { backgroundTaskService } from '../service';

export function useBackgroundTask(taskId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const start = useCallback(async (taskFn: () => Promise<void>, options: { taskTitle: string; taskDesc: string }) => {
    setError(null);
    try {
      await backgroundTaskService.start(taskId, taskFn, options);
      setIsRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [taskId]);

  const stop = useCallback(async () => {
    setError(null);
    try {
      await backgroundTaskService.stop(taskId);
      setIsRunning(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [taskId]);

  return { isRunning, error, start, stop };
}
`;

  const handlerTs = `/**
 * FILE: src/background/tasks/handlers/exampleTaskHandler.ts
 * PURPOSE: Example background task handler (User Zone).
 * OWNERSHIP: USER
 */

import { backgroundTaskService } from '../service';

export async function runExampleBackgroundTask(): Promise<void> {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const taskFn = async () => {
    while (true) {
      await sleep(5000);
      console.log('Background task tick');
    }
  };
  await backgroundTaskService.start('example-task', taskFn, {
    taskTitle: 'Example Task',
    taskDesc: 'Running in background',
  });
}
`;

  const reexportTs = `/**
 * FILE: src/background/tasks.ts
 * PURPOSE: Re-export Background Tasks (User Zone).
 * OWNERSHIP: USER
 */

export { backgroundTaskService } from './tasks/service';
export type { BackgroundTaskService } from './tasks/service';
export { useBackgroundTask } from './tasks/hooks/useBackgroundTask';
export { runExampleBackgroundTask } from './tasks/handlers/exampleTaskHandler';
`;

  writeTextFile(join(tasksDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useBackgroundTask.${fileExt}`), hookTs);
  writeTextFile(join(handlersDir, `exampleTaskHandler.${fileExt}`), handlerTs);
  writeTextFile(join(backgroundDir, `tasks.${fileExt}`), reexportTs);
}

/**
 * Section 67: Real Geofencing infrastructure.
 */
function generateGeofencingInfrastructure(appRoot: string, inputs: InitInputs): void {
  const backgroundDir = join(appRoot, USER_SRC_DIR, 'background');
  const geofencingDir = join(backgroundDir, 'geofencing');
  const hooksDir = join(geofencingDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/background/geofencing/service.ts
 * PURPOSE: Geofencing service (User Zone).
 * OWNERSHIP: USER
 */

import * as Location from 'expo-location';

export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
}

const GEOFENCING_TASK_NAME = 'geofencing';

export interface GeofencingService {
  requestPermissions(): Promise<boolean>;
  startGeofencingAsync(regions: GeofenceRegion[]): Promise<void>;
  stopGeofencingAsync(): Promise<void>;
}

export const geofencingService: GeofencingService = {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const bg = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted' && bg.status === 'granted';
  },

  async startGeofencingAsync(regions: GeofenceRegion[]): Promise<void> {
    await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions.map((r) => ({
      identifier: r.identifier,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      notifyOnEnter: r.notifyOnEnter ?? true,
      notifyOnExit: r.notifyOnExit ?? true,
    })));
  },

  async stopGeofencingAsync(): Promise<void> {
    await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
  },
};
`;

  const hookTs = `/**
 * FILE: src/background/geofencing/hooks/useGeofencing.ts
 * PURPOSE: Geofencing hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { geofencingService, type GeofenceRegion } from '../service';

export function useGeofencing() {
  const [permission, setPermission] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = useCallback(async () => {
    setError(null);
    try {
      const granted = await geofencingService.requestPermissions();
      setPermission(granted);
      return granted;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return { permission, error, requestPermission };
}
`;

  const reexportTs = `/**
 * FILE: src/background/geofencing.ts
 * PURPOSE: Re-export Geofencing (User Zone).
 * OWNERSHIP: USER
 */

export { geofencingService } from './geofencing/service';
export type { GeofencingService, GeofenceRegion } from './geofencing/service';
export { useGeofencing } from './geofencing/hooks/useGeofencing';
`;

  writeTextFile(join(geofencingDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useGeofencing.${fileExt}`), hookTs);
  writeTextFile(join(backgroundDir, `geofencing.${fileExt}`), reexportTs);
}

/**
 * Section 67: Real Background Fetch infrastructure.
 */
function generateBackgroundFetchInfrastructure(appRoot: string, inputs: InitInputs): void {
  const backgroundDir = join(appRoot, USER_SRC_DIR, 'background');
  const fetchDir = join(backgroundDir, 'fetch');
  const hooksDir = join(fetchDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/background/fetch/service.ts
 * PURPOSE: Background fetch service (User Zone).
 * OWNERSHIP: USER
 */

import BackgroundFetch from 'react-native-background-fetch';

export interface BackgroundFetchService {
  configure(options: { minimumFetchInterval?: number; stopOnTerminate?: boolean }, callback: () => Promise<void>): Promise<number>;
  scheduleTask(config: { taskId: string; delay: number }): Promise<boolean>;
  stop(): Promise<void>;
  status(callback: (status: number) => void): void;
}

export const backgroundFetchService: BackgroundFetchService = {
  async configure(options: { minimumFetchInterval?: number; stopOnTerminate?: boolean }, callback: () => Promise<void>): Promise<number> {
    return await BackgroundFetch.configure(
      {
        minimumFetchInterval: options.minimumFetchInterval ?? 15,
        stopOnTerminate: options.stopOnTerminate ?? false,
      },
      callback,
      () => console.log('Background fetch failed to start')
    );
  },

  async scheduleTask(config: { taskId: string; delay: number }): Promise<boolean> {
    return await BackgroundFetch.scheduleTask(config);
  },

  async stop(): Promise<void> {
    await BackgroundFetch.stop();
  },

  status(callback: (status: number) => void): void {
    BackgroundFetch.status(callback);
  },
};
`;

  const hookTs = `/**
 * FILE: src/background/fetch/hooks/useBackgroundFetch.ts
 * PURPOSE: Background fetch hook (User Zone).
 * OWNERSHIP: USER
 */

import { useCallback } from 'react';
import { backgroundFetchService } from '../service';

export function useBackgroundFetch() {
  const configure = useCallback(async (callback: () => Promise<void>, options?: { minimumFetchInterval?: number; stopOnTerminate?: boolean }) => {
    return await backgroundFetchService.configure(options ?? {}, callback);
  }, []);

  const scheduleTask = useCallback(async (taskId: string, delay: number) => {
    return await backgroundFetchService.scheduleTask({ taskId, delay });
  }, []);

  const stop = useCallback(async () => {
    await backgroundFetchService.stop();
  }, []);

  return { configure, scheduleTask, stop };
}
`;

  const reexportTs = `/**
 * FILE: src/background/fetch.ts
 * PURPOSE: Re-export Background Fetch (User Zone).
 * OWNERSHIP: USER
 */

export { backgroundFetchService } from './fetch/service';
export type { BackgroundFetchService } from './fetch/service';
export { useBackgroundFetch } from './fetch/hooks/useBackgroundFetch';
`;

  writeTextFile(join(fetchDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useBackgroundFetch.${fileExt}`), hookTs);
  writeTextFile(join(backgroundDir, `fetch.${fileExt}`), reexportTs);
}

function generatePrivacyInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.privacy?.att) {
    generateAttPrivacyInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.privacy?.consent) {
    generateConsentPrivacyInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.privacy?.gdpr) {
    generateGdprPrivacyInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 68: Real ATT (App Tracking Transparency) infrastructure.
 */
function generateAttPrivacyInfrastructure(appRoot: string, inputs: InitInputs): void {
  const privacyDir = join(appRoot, USER_SRC_DIR, 'privacy');
  const attDir = join(privacyDir, 'att');
  const hooksDir = join(attDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/privacy/att/service.ts
 * PURPOSE: App Tracking Transparency service (User Zone).
 * OWNERSHIP: USER
 */

import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';

export type ATTStatus = 'undetermined' | 'restricted' | 'denied' | 'authorized';

export interface AttService {
  requestPermission(): Promise<ATTStatus>;
  getStatus(): Promise<ATTStatus>;
}

export const attService: AttService = {
  async requestPermission(): Promise<ATTStatus> {
    const { status } = await requestTrackingPermissionsAsync();
    return status as ATTStatus;
  },

  async getStatus(): Promise<ATTStatus> {
    const { status } = await getTrackingPermissionsAsync();
    return status as ATTStatus;
  },
};
`;

  const hookTs = `/**
 * FILE: src/privacy/att/hooks/useATT.ts
 * PURPOSE: ATT permission hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback, useEffect } from 'react';
import { attService, type ATTStatus } from '../service';

export function useATT() {
  const [status, setStatus] = useState<ATTStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const s = await attService.getStatus();
      setStatus(s);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await attService.requestPermission();
      setStatus(s);
      return s;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, error, requestPermission, refresh };
}
`;

  const reexportTs = `/**
 * FILE: src/privacy/att.ts
 * PURPOSE: Re-export ATT (User Zone).
 * OWNERSHIP: USER
 */

export { attService } from './att/service';
export type { AttService, ATTStatus } from './att/service';
export { useATT } from './att/hooks/useATT';
`;

  writeTextFile(join(attDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useATT.${fileExt}`), hookTs);
  writeTextFile(join(privacyDir, `att.${fileExt}`), reexportTs);
}

/**
 * Section 68: Real Consent management infrastructure.
 */
function generateConsentPrivacyInfrastructure(appRoot: string, inputs: InitInputs): void {
  const privacyDir = join(appRoot, USER_SRC_DIR, 'privacy');
  const consentDir = join(privacyDir, 'consent');
  const hooksDir = join(consentDir, 'hooks');
  const componentsDir = join(consentDir, 'components');
  ensureDir(hooksDir);
  ensureDir(componentsDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const serviceTs = `/**
 * FILE: src/privacy/consent/service.ts
 * PURPOSE: Consent management service (User Zone).
 * OWNERSHIP: USER
 */

export interface ConsentPreferences {
  analytics?: boolean;
  marketing?: boolean;
  essential?: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'consent_preferences';

export interface ConsentService {
  getConsent(): Promise<ConsentPreferences | null>;
  setConsent(prefs: Omit<ConsentPreferences, 'timestamp'>): Promise<void>;
  clearConsent(): Promise<void>;
}

export const consentService: ConsentService = {
  async getConsent(): Promise<ConsentPreferences | null> {
    try {
      const raw = await require('@react-native-async-storage/async-storage').default.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setConsent(prefs: Omit<ConsentPreferences, 'timestamp'>): Promise<void> {
    const prefsWithTs: ConsentPreferences = { ...prefs, timestamp: Date.now() };
    await require('@react-native-async-storage/async-storage').default.setItem(STORAGE_KEY, JSON.stringify(prefsWithTs));
  },

  async clearConsent(): Promise<void> {
    await require('@react-native-async-storage/async-storage').default.removeItem(STORAGE_KEY);
  },
};
`;

  const hookTs = `/**
 * FILE: src/privacy/consent/hooks/useConsent.ts
 * PURPOSE: Consent hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { consentService, type ConsentPreferences } from '../service';

export function useConsent() {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const prefs = await consentService.getConsent();
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const setConsent = useCallback(async (prefs: Omit<ConsentPreferences, 'timestamp'>) => {
    setError(null);
    try {
      await consentService.setConsent(prefs);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [refresh]);

  const clearConsent = useCallback(async () => {
    setError(null);
    try {
      await consentService.clearConsent();
      setPreferences(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { preferences, loading, error, setConsent, clearConsent, refresh };
}
`;

  const componentTsx = `/**
 * FILE: src/privacy/consent/components/ConsentDialog.tsx
 * PURPOSE: Consent UI component (User Zone).
 * OWNERSHIP: USER
 */

import React, { useState } from 'react';
import { View, Text, Modal, Button, StyleSheet } from 'react-native';
import { useConsent } from '../hooks/useConsent';

export interface ConsentDialogProps {
  visible: boolean;
  onAccept?: (prefs: { analytics?: boolean; marketing?: boolean; essential?: boolean }) => void;
  onDecline?: () => void;
}

export function ConsentDialog({ visible, onAccept, onDecline }: ConsentDialogProps) {
  const { setConsent } = useConsent();
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [essential, setEssential] = useState(true);

  const handleAccept = () => {
    setConsent({ analytics, marketing, essential });
    onAccept?.({ analytics, marketing, essential });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Consent preferences</Text>
          <Text style={styles.label}>Analytics</Text>
          <Button title={analytics ? 'On' : 'Off'} onPress={() => setAnalytics(!analytics)} />
          <Text style={styles.label}>Marketing</Text>
          <Button title={marketing ? 'On' : 'Off'} onPress={() => setMarketing(!marketing)} />
          <Button title="Accept" onPress={handleAccept} />
          <Button title="Decline" onPress={onDecline} color="gray" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: 'white', borderRadius: 12, padding: 24 },
  title: { fontSize: 18, marginBottom: 16 },
  label: { fontSize: 14, marginTop: 8 },
});
`;

  const reexportTs = `/**
 * FILE: src/privacy/consent.ts
 * PURPOSE: Re-export Consent (User Zone).
 * OWNERSHIP: USER
 */

export { consentService } from './consent/service';
export type { ConsentService, ConsentPreferences } from './consent/service';
export { useConsent } from './consent/hooks/useConsent';
export { ConsentDialog } from './consent/components/ConsentDialog';
export type { ConsentDialogProps } from './consent/components/ConsentDialog';
`;

  writeTextFile(join(consentDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useConsent.${fileExt}`), hookTs);
  writeTextFile(join(componentsDir, `ConsentDialog.${componentExt}`), componentTsx);
  writeTextFile(join(privacyDir, `consent.${fileExt}`), reexportTs);
}

/**
 * Section 68: Real GDPR compliance infrastructure.
 */
function generateGdprPrivacyInfrastructure(appRoot: string, inputs: InitInputs): void {
  const privacyDir = join(appRoot, USER_SRC_DIR, 'privacy');
  const gdprDir = join(privacyDir, 'gdpr');
  const hooksDir = join(gdprDir, 'hooks');
  const componentsDir = join(gdprDir, 'components');
  ensureDir(hooksDir);
  ensureDir(componentsDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';
  const componentExt = inputs.language === 'ts' ? 'tsx' : 'jsx';

  const serviceTs = `/**
 * FILE: src/privacy/gdpr/service.ts
 * PURPOSE: GDPR compliance service (User Zone).
 * OWNERSHIP: USER
 */

export interface GdprService {
  requestDataExport(): Promise<Record<string, unknown>>;
  requestDataDeletion(): Promise<void>;
  getConsentHistory(): Promise<{ action: string; timestamp: number }[]>;
}

const HISTORY_KEY = 'gdpr_consent_history';

export const gdprService: GdprService = {
  async requestDataExport(): Promise<Record<string, unknown>> {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(pairs.filter(([, v]) => v != null) as [string, string][]);
  },

  async requestDataDeletion(): Promise<void> {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k !== HISTORY_KEY));
  },

  async getConsentHistory(): Promise<{ action: string; timestamp: number }[]> {
    try {
      const raw = await require('@react-native-async-storage/async-storage').default.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
`;

  const hookTs = `/**
 * FILE: src/privacy/gdpr/hooks/useGDPR.ts
 * PURPOSE: GDPR hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback } from 'react';
import { gdprService } from '../service';

export function useGDPR() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await gdprService.requestDataExport();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await gdprService.requestDataDeletion();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHistory = useCallback(async () => {
    setError(null);
    try {
      return await gdprService.getConsentHistory();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, []);

  return { exportData, deleteData, getHistory, loading, error };
}
`;

  const reexportTs = `/**
 * FILE: src/privacy/gdpr.ts
 * PURPOSE: Re-export GDPR (User Zone).
 * OWNERSHIP: USER
 */

export { gdprService } from './gdpr/service';
export type { GdprService } from './gdpr/service';
export { useGDPR } from './gdpr/hooks/useGDPR';
`;

  writeTextFile(join(gdprDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useGDPR.${fileExt}`), hookTs);
  writeTextFile(join(privacyDir, `gdpr.${fileExt}`), reexportTs);
}

function generateDeviceInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.device?.biometrics) {
    generateBiometricsDeviceInfrastructure(appRoot, inputs);
  }
  if (inputs.selectedOptions.device?.bluetooth) {
    generateBluetoothDeviceInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 69: Real Biometrics device infrastructure.
 */
function generateBiometricsDeviceInfrastructure(appRoot: string, inputs: InitInputs): void {
  const deviceDir = join(appRoot, USER_SRC_DIR, 'device');
  const biometricsDir = join(deviceDir, 'biometrics');
  const hooksDir = join(biometricsDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/device/biometrics/service.ts
 * PURPOSE: Biometric authentication service (User Zone).
 * OWNERSHIP: USER
 */

import ReactNativeBiometrics from 'react-native-biometrics';

export interface BiometricsService {
  isSensorAvailable(): Promise<{ available: boolean; biometryType?: string }>;
  authenticate(promptMessage: string): Promise<{ success: boolean }>;
  simpleIsAvailable(): Promise<boolean>;
}

export const biometricsService: BiometricsService = {
  async isSensorAvailable(): Promise<{ available: boolean; biometryType?: string }> {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  },

  async authenticate(promptMessage: string): Promise<{ success: boolean }> {
    const rnBiometrics = new ReactNativeBiometrics();
    const { success } = await rnBiometrics.simplePrompt({ promptMessage, cancelButtonText: 'Cancel' });
    return { success };
  },

  async simpleIsAvailable(): Promise<boolean> {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  },
};
`;

  const hookTs = `/**
 * FILE: src/device/biometrics/hooks/useBiometrics.ts
 * PURPOSE: Biometrics hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect, useCallback } from 'react';
import { biometricsService } from '../service';

export function useBiometrics() {
  const [available, setAvailable] = useState<boolean>(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await biometricsService.isSensorAvailable();
      setAvailable(result.available);
      setBiometryType(result.biometryType ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (promptMessage: string = 'Authenticate') => {
    setError(null);
    try {
      const result = await biometricsService.authenticate(promptMessage);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return { available, biometryType, loading, error, checkAvailability, authenticate };
}
`;

  const reexportTs = `/**
 * FILE: src/device/biometrics.ts
 * PURPOSE: Re-export Biometrics (User Zone).
 * OWNERSHIP: USER
 */

export { biometricsService } from './biometrics/service';
export type { BiometricsService } from './biometrics/service';
export { useBiometrics } from './biometrics/hooks/useBiometrics';
`;

  writeTextFile(join(biometricsDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useBiometrics.${fileExt}`), hookTs);
  writeTextFile(join(deviceDir, `biometrics.${fileExt}`), reexportTs);
}

/**
 * Section 69: Real Bluetooth device infrastructure.
 */
function generateBluetoothDeviceInfrastructure(appRoot: string, inputs: InitInputs): void {
  const deviceDir = join(appRoot, USER_SRC_DIR, 'device');
  const bluetoothDir = join(deviceDir, 'bluetooth');
  const hooksDir = join(bluetoothDir, 'hooks');
  ensureDir(hooksDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const serviceTs = `/**
 * FILE: src/device/bluetooth/service.ts
 * PURPOSE: Bluetooth service (User Zone).
 * OWNERSHIP: USER
 */

import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export interface BluetoothDevice {
  id: string;
  name: string | null;
  localName: string | null;
  rssi: number | null;
}

export interface BluetoothService {
  startScan(onDeviceFound: (device: BluetoothDevice) => void): void;
  stopScan(): Promise<void>;
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  destroy(): void;
}

export const bluetoothService: BluetoothService = {
  startScan(onDeviceFound: (device: BluetoothDevice) => void): void {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error || !device) return;
      onDeviceFound({
        id: device.id,
        name: device.name,
        localName: device.localName,
        rssi: device.rssi,
      });
    });
  },

  async stopScan(): Promise<void> {
    manager.stopDeviceScan();
  },

  async connect(deviceId: string): Promise<void> {
    await manager.connectToDevice(deviceId);
  },

  async disconnect(deviceId: string): Promise<void> {
    await manager.cancelDeviceConnection(deviceId);
  },

  destroy(): void {
    manager.destroy();
  },
};
`;

  const hookTs = `/**
 * FILE: src/device/bluetooth/hooks/useBluetooth.ts
 * PURPOSE: Bluetooth hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useCallback, useEffect } from 'react';
import { bluetoothService, type BluetoothDevice } from '../service';

export function useBluetooth() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startScan = useCallback(() => {
    setScanning(true);
    setError(null);
    setDevices([]);
    const seen = new Set<string>();
    bluetoothService.startScan((device) => {
      if (!seen.has(device.id)) {
        seen.add(device.id);
        setDevices((prev) => [...prev, device]);
      }
    });
  }, []);

  const stopScan = useCallback(async () => {
    await bluetoothService.stopScan();
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      bluetoothService.destroy();
    };
  }, []);

  return { devices, scanning, error, startScan, stopScan };
}
`;

  const reexportTs = `/**
 * FILE: src/device/bluetooth.ts
 * PURPOSE: Re-export Bluetooth (User Zone).
 * OWNERSHIP: USER
 */

export { bluetoothService } from './bluetooth/service';
export type { BluetoothService, BluetoothDevice } from './bluetooth/service';
export { useBluetooth } from './bluetooth/hooks/useBluetooth';
`;

  writeTextFile(join(bluetoothDir, `service.${fileExt}`), serviceTs);
  writeTextFile(join(hooksDir, `useBluetooth.${fileExt}`), hookTs);
  writeTextFile(join(deviceDir, `bluetooth.${fileExt}`), reexportTs);
}

function generateTestingInfrastructure(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.testing?.detox) {
    generateDetoxTestingInfrastructure(appRoot, inputs);
  }
}

/**
 * Section 70: Real Detox E2E testing infrastructure.
 */
function generateDetoxTestingInfrastructure(appRoot: string, inputs: InitInputs): void {
  const e2eDir = join(appRoot, 'e2e');
  const configDir = join(e2eDir, 'config');
  const screensDir = join(e2eDir, 'screens');
  const flowsDir = join(e2eDir, 'flows');
  ensureDir(configDir);
  ensureDir(screensDir);
  ensureDir(flowsDir);

  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  const detoxConfigJs = `/**
 * FILE: e2e/config/.detoxrc.js
 * PURPOSE: Detox E2E configuration (User Zone).
 * OWNERSHIP: USER
 */

module.exports = {
  testRunner: {
    args: {
      '$0': 'test',
      config: 'e2e/config/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15', os: 'iOS 17.0' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_5_API_34' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
`;

  const jestConfigJs = `/**
 * FILE: e2e/config/jest.config.js
 * PURPOSE: Jest config for Detox E2E (User Zone).
 * OWNERSHIP: USER
 */

module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
`;

  const screenTestTs = `/**
 * FILE: e2e/screens/HomeScreen.test.ts
 * PURPOSE: Example Detox screen test (User Zone).
 * OWNERSHIP: USER
 */

import { by, element, expect } from 'detox';

describe('HomeScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome text', async () => {
    await expect(element(by.text('Welcome'))).toBeVisible();
  });

  it('should navigate to detail on tap', async () => {
    await element(by.id('home-detail-button')).tap();
    await expect(element(by.id('detail-screen'))).toBeVisible();
  });
});
`;

  const flowTestTs = `/**
 * FILE: e2e/flows/appFlow.test.ts
 * PURPOSE: Example Detox user flow test (User Zone).
 * OWNERSHIP: USER
 */

import { by, element, expect } from 'detox';

describe('App flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete main flow', async () => {
    await expect(element(by.id('root-screen'))).toBeVisible();
    await element(by.id('home-detail-button')).tap();
    await expect(element(by.id('detail-screen'))).toBeVisible();
    await element(by.id('back-button')).tap();
    await expect(element(by.id('root-screen'))).toBeVisible();
  });
});
`;

  writeTextFile(join(configDir, '.detoxrc.js'), detoxConfigJs);
  writeTextFile(join(configDir, 'jest.config.js'), jestConfigJs);
  writeTextFile(join(screensDir, `HomeScreen.test.${fileExt}`), screenTestTs);
  writeTextFile(join(flowsDir, `appFlow.test.${fileExt}`), flowTestTs);
}
