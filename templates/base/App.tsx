import React from 'react';
import { RnsApp } from '@rns/runtime';

/**
 * Minimal app entrypoint.
 * All runtime composition is handled by @rns/runtime.
 * User code in src/** remains clean and isolated.
 */
export default function App() {
  return <RnsApp />;
}

