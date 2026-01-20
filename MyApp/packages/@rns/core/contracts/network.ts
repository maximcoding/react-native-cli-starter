/**
 * FILE: packages/@rns/core/contracts/network.ts
 * PURPOSE: Network connectivity API with stub default
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Stub implementation (no @react-native-community/netinfo dependency)
 * - initNetInfoBridge() is a no-op by default
 * - Plugins can wire NetInfo via setTransport/onNetworkChange, NOT by modifying this file
 */

type NetworkListener = (offline: boolean) => void;

let offline = false;
const listeners: NetworkListener[] = [];

function emit(nextOffline: boolean): void {
  offline = nextOffline;
  listeners.forEach(cb => cb(nextOffline));
}

/**
 * Check if device is currently offline (stub default - always returns false)
 */
export function isOffline(): boolean {
  return offline;
}

/**
 * Subscribe to network changes. Returns unsubscribe function.
 */
export function onNetworkChange(cb: NetworkListener): () => void {
  listeners.push(cb);
  return () => {
    const index = listeners.indexOf(cb);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Initialize network monitoring (stub - no-op by default)
 * Plugins can wire this to @react-native-community/netinfo
 */
export function initNetInfoBridge(): void {
  // Stub: no-op default implementation
  // Plugins will replace this with actual NetInfo integration
}


