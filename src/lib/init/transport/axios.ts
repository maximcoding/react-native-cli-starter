/**
 * FILE: src/lib/init/transport/axios.ts
 * PURPOSE: Axios infrastructure generation (Section 53)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates Axios infrastructure files
 */
export function generateAxiosInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const transportDir = join(appRoot, USER_SRC_DIR, 'transport');
  const axiosDir = join(transportDir, 'axios');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(axiosDir);

  // Generate Axios client
  const clientFilePath = join(axiosDir, `client.${fileExt}`);
  const clientContent = generateAxiosClient(inputs);
  writeTextFile(clientFilePath, clientContent);

  // Generate interceptors
  const interceptorsFilePath = join(axiosDir, `interceptors.${fileExt}`);
  const interceptorsContent = generateInterceptors(inputs);
  writeTextFile(interceptorsFilePath, interceptorsContent);

  // Generate main axios file
  const mainFilePath = join(axiosDir, `axios.${fileExt}`);
  const mainContent = generateAxiosMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);
}

function generateAxiosClient(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/axios/client.js
 * PURPOSE: Axios client instance (User Zone).
 * OWNERSHIP: USER
 */

import axios from 'axios';
import { setupInterceptors } from './interceptors';

export const axiosClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup interceptors
setupInterceptors(axiosClient);

export default axiosClient;
`;
  }

  return `/**
 * FILE: src/transport/axios/client.ts
 * PURPOSE: Axios client instance (User Zone).
 * OWNERSHIP: USER
 */

import axios, { AxiosInstance } from 'axios';
import { setupInterceptors } from './interceptors';

export const axiosClient: AxiosInstance = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup interceptors
setupInterceptors(axiosClient);

export default axiosClient;
`;
}

function generateInterceptors(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/axios/interceptors.js
 * PURPOSE: Axios request/response interceptors (User Zone).
 * OWNERSHIP: USER
 */

export function setupInterceptors(axiosInstance) {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Add auth token if available
      // const token = getAuthToken();
      // if (token) {
      //   config.headers.Authorization = \`Bearer \${token}\`;
      // }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common errors (401, 403, 500, etc.)
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
      }
      return Promise.reject(error);
    }
  );
}
`;
  }

  return `/**
 * FILE: src/transport/axios/interceptors.ts
 * PURPOSE: Axios request/response interceptors (User Zone).
 * OWNERSHIP: USER
 */

import { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

export function setupInterceptors(axiosInstance: AxiosInstance): void {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add auth token if available
      // const token = getAuthToken();
      // if (token) {
      //   config.headers.Authorization = \`Bearer \${token}\`;
      // }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle common errors (401, 403, 500, etc.)
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
      }
      return Promise.reject(error);
    }
  );
}
`;
}

function generateAxiosMainFile(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/axios/axios.js
 * PURPOSE: Axios utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export * from 'axios';
export { axiosClient, default } from './client';
export { setupInterceptors } from './interceptors';
`;
  }

  return `/**
 * FILE: src/transport/axios/axios.ts
 * PURPOSE: Axios utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export * from 'axios';
export { axiosClient, default } from './client';
export { setupInterceptors } from './interceptors';
`;
}
