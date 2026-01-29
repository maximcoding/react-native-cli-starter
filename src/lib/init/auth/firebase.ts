/**
 * FILE: src/lib/init/auth/firebase.ts
 * PURPOSE: Firebase Auth infrastructure generation (Section 54)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

export function generateFirebaseAuthInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const authDir = join(appRoot, USER_SRC_DIR, 'auth');
  const firebaseDir = join(authDir, 'firebase');
  const hooksDir = join(firebaseDir, 'hooks');
  const servicesDir = join(firebaseDir, 'services');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);
  ensureDir(servicesDir);

  // Generate context
  const contextContent = generateAuthContext(inputs, 'firebase');
  writeTextFile(join(firebaseDir, `context.${fileExt}x`), contextContent);

  // Generate hook
  const hookContent = generateAuthHook(inputs, 'firebase');
  writeTextFile(join(hooksDir, `useAuth.${fileExt}`), hookContent);

  // Generate service
  const serviceContent = generateAuthService(inputs, 'firebase');
  writeTextFile(join(servicesDir, `authService.${fileExt}`), serviceContent);

  // Generate main file
  const mainContent = generateAuthMainFile(inputs, 'firebase');
  writeTextFile(join(firebaseDir, `firebase.${fileExt}`), mainContent);
}

function generateAuthContext(inputs: InitInputs, provider: string): string {
  const providerName = provider === 'firebase' ? 'Firebase' : provider === 'cognito' ? 'Cognito' : provider === 'auth0' ? 'Auth0' : 'JWT';
  const importPath = provider === 'firebase' ? '@react-native-firebase/auth' : provider === 'cognito' ? 'amazon-cognito-identity-js' : provider === 'auth0' ? 'react-native-auth0' : 'jwt-decode';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/auth/${provider}/context.jsx
 * PURPOSE: ${providerName} Auth context (User Zone).
 * OWNERSHIP: USER
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
`;
  }

  return `/**
 * FILE: src/auth/${provider}/context.tsx
 * PURPOSE: ${providerName} Auth context (User Zone).
 * OWNERSHIP: USER
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './hooks/useAuth';

interface AuthContextValue {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
`;
}

function generateAuthHook(inputs: InitInputs, provider: string): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/auth/${provider}/hooks/useAuth.js
 * PURPOSE: Authentication hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));
  }, []);

  const signIn = async (email, password) => {
    const user = await authService.signIn(email, password);
    setUser(user);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signOut };
}
`;
  }

  return `/**
 * FILE: src/auth/${provider}/hooks/useAuth.ts
 * PURPOSE: Authentication hook (User Zone).
 * OWNERSHIP: USER
 */

import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const user = await authService.signIn(email, password);
    setUser(user);
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signOut };
}
`;
}

function generateAuthService(inputs: InitInputs, provider: string): string {
  const providerName = provider === 'firebase' ? 'Firebase' : provider === 'cognito' ? 'Cognito' : provider === 'auth0' ? 'Auth0' : 'JWT';
  const importPath = provider === 'firebase' ? '@react-native-firebase/auth' : provider === 'cognito' ? 'amazon-cognito-identity-js' : provider === 'auth0' ? 'react-native-auth0' : 'jwt-decode';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/auth/${provider}/services/authService.js
 * PURPOSE: ${providerName} authentication service (User Zone).
 * OWNERSHIP: USER
 */

${provider === 'firebase' ? `import auth from '@react-native-firebase/auth';` : provider === 'cognito' ? `import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';` : provider === 'auth0' ? `import Auth0 from 'react-native-auth0';` : `import { decode } from 'jwt-decode';`}

class AuthService {
  async signIn(email, password) {
    // Implement ${providerName} sign in logic
    throw new Error('Not implemented');
  }

  async signOut() {
    // Implement ${providerName} sign out logic
    throw new Error('Not implemented');
  }

  async getCurrentUser() {
    // Implement ${providerName} get current user logic
    return null;
  }
}

export const authService = new AuthService();
`;
  }

  return `/**
 * FILE: src/auth/${provider}/services/authService.ts
 * PURPOSE: ${providerName} authentication service (User Zone).
 * OWNERSHIP: USER
 */

${provider === 'firebase' ? `import auth from '@react-native-firebase/auth';` : provider === 'cognito' ? `import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';` : provider === 'auth0' ? `import Auth0 from 'react-native-auth0';` : `import { decode } from 'jwt-decode';`}

class AuthService {
  async signIn(email: string, password: string): Promise<any> {
    // Implement ${providerName} sign in logic
    throw new Error('Not implemented');
  }

  async signOut(): Promise<void> {
    // Implement ${providerName} sign out logic
    throw new Error('Not implemented');
  }

  async getCurrentUser(): Promise<any> {
    // Implement ${providerName} get current user logic
    return null;
  }
}

export const authService = new AuthService();
`;
}

function generateAuthMainFile(inputs: InitInputs, provider: string): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/auth/${provider}/${provider}.js
 * PURPOSE: ${provider} auth utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export { AuthProvider, useAuthContext } from './context';
export { useAuth } from './hooks/useAuth';
export { authService } from './services/authService';
`;
  }

  return `/**
 * FILE: src/auth/${provider}/${provider}.ts
 * PURPOSE: ${provider} auth utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export { AuthProvider, useAuthContext } from './context';
export { useAuth } from './hooks/useAuth';
export { authService } from './services/authService';
`;
}

// Reuse functions for other providers
export function generateCognitoAuthInfrastructure(appRoot: string, inputs: InitInputs): void {
  const authDir = join(appRoot, USER_SRC_DIR, 'auth');
  const cognitoDir = join(authDir, 'cognito');
  const hooksDir = join(cognitoDir, 'hooks');
  const servicesDir = join(cognitoDir, 'services');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);
  ensureDir(servicesDir);

  writeTextFile(join(cognitoDir, `context.${fileExt}x`), generateAuthContext(inputs, 'cognito'));
  writeTextFile(join(hooksDir, `useAuth.${fileExt}`), generateAuthHook(inputs, 'cognito'));
  writeTextFile(join(servicesDir, `authService.${fileExt}`), generateAuthService(inputs, 'cognito'));
  writeTextFile(join(cognitoDir, `cognito.${fileExt}`), generateAuthMainFile(inputs, 'cognito'));
}

export function generateAuth0Infrastructure(appRoot: string, inputs: InitInputs): void {
  const authDir = join(appRoot, USER_SRC_DIR, 'auth');
  const auth0Dir = join(authDir, 'auth0');
  const hooksDir = join(auth0Dir, 'hooks');
  const servicesDir = join(auth0Dir, 'services');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);
  ensureDir(servicesDir);

  writeTextFile(join(auth0Dir, `context.${fileExt}x`), generateAuthContext(inputs, 'auth0'));
  writeTextFile(join(hooksDir, `useAuth.${fileExt}`), generateAuthHook(inputs, 'auth0'));
  writeTextFile(join(servicesDir, `authService.${fileExt}`), generateAuthService(inputs, 'auth0'));
  writeTextFile(join(auth0Dir, `auth0.${fileExt}`), generateAuthMainFile(inputs, 'auth0'));
}

export function generateJwtAuthInfrastructure(appRoot: string, inputs: InitInputs): void {
  const authDir = join(appRoot, USER_SRC_DIR, 'auth');
  const jwtDir = join(authDir, 'jwt');
  const hooksDir = join(jwtDir, 'hooks');
  const servicesDir = join(jwtDir, 'services');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);
  ensureDir(servicesDir);

  writeTextFile(join(jwtDir, `context.${fileExt}x`), generateAuthContext(inputs, 'jwt'));
  writeTextFile(join(hooksDir, `useAuth.${fileExt}`), generateAuthHook(inputs, 'jwt'));
  writeTextFile(join(servicesDir, `tokenService.${fileExt}`), generateAuthService(inputs, 'jwt'));
  writeTextFile(join(jwtDir, `jwt.${fileExt}`), generateAuthMainFile(inputs, 'jwt'));
}
