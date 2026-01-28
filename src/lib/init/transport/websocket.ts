/**
 * FILE: src/lib/init/transport/websocket.ts
 * PURPOSE: WebSocket infrastructure generation (Section 53)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates WebSocket infrastructure files
 */
export function generateWebSocketInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const transportDir = join(appRoot, USER_SRC_DIR, 'transport');
  const websocketDir = join(transportDir, 'websocket');
  const hooksDir = join(websocketDir, 'hooks');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);

  // Generate WebSocket client
  const clientFilePath = join(websocketDir, `client.${fileExt}`);
  const clientContent = generateWebSocketClient(inputs);
  writeTextFile(clientFilePath, clientContent);

  // Generate React hook
  const hookFilePath = join(hooksDir, `useWebSocket.${fileExt}`);
  const hookContent = generateWebSocketHook(inputs);
  writeTextFile(hookFilePath, hookContent);

  // Generate main websocket file
  const mainFilePath = join(websocketDir, `websocket.${fileExt}`);
  const mainContent = generateWebSocketMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);
}

function generateWebSocketClient(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/websocket/client.js
 * PURPOSE: WebSocket client with reconnection (User Zone).
 * OWNERSHIP: USER
 */

import ReconnectingWebSocket from 'react-native-reconnecting-websocket';

export function createWebSocketClient(url) {
  return new ReconnectingWebSocket(url, [], {
    connectionTimeout: 4000,
    maxRetries: 10,
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
  });
}
`;
  }

  return `/**
 * FILE: src/transport/websocket/client.ts
 * PURPOSE: WebSocket client with reconnection (User Zone).
 * OWNERSHIP: USER
 */

import ReconnectingWebSocket from 'react-native-reconnecting-websocket';

export function createWebSocketClient(url: string): ReconnectingWebSocket {
  return new ReconnectingWebSocket(url, [], {
    connectionTimeout: 4000,
    maxRetries: 10,
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
  });
}
`;
}

function generateWebSocketHook(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/websocket/hooks/useWebSocket.js
 * PURPOSE: React hook for WebSocket (User Zone).
 * OWNERSHIP: USER
 */

import { useEffect, useState, useRef } from 'react';
import { createWebSocketClient } from '../client';

export function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = createWebSocketClient(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => setMessage(JSON.parse(event.data));

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { isConnected, message, sendMessage };
}
`;
  }

  return `/**
 * FILE: src/transport/websocket/hooks/useWebSocket.ts
 * PURPOSE: React hook for WebSocket (User Zone).
 * OWNERSHIP: USER
 */

import { useEffect, useState, useRef } from 'react';
import { createWebSocketClient } from '../client';
import ReconnectingWebSocket from 'react-native-reconnecting-websocket';

export function useWebSocket<T = any>(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<T | null>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  useEffect(() => {
    const ws = createWebSocketClient(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      try {
        setMessage(JSON.parse(event.data) as T);
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (data: T): void => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { isConnected, message, sendMessage };
}
`;
}

function generateWebSocketMainFile(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/websocket/websocket.js
 * PURPOSE: WebSocket utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export { createWebSocketClient } from './client';
export { useWebSocket } from './hooks/useWebSocket';
`;
  }

  return `/**
 * FILE: src/transport/websocket/websocket.ts
 * PURPOSE: WebSocket utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export { createWebSocketClient } from './client';
export { useWebSocket } from './hooks/useWebSocket';
`;
}
