export type RuntimeContributionKind = 'provider' | 'wrapper' | 'init' | 'binding';

/**
 * Symbol-based wiring instruction. CLI should resolve by module + exported name.
 */
export interface RuntimeSymbolRef {
  module: string;      // e.g. "@rns/plugin-react-query"
  exportName: string;  // e.g. "ReactQueryProvider"
}

/**
 * Contribution applied inside CLI-owned runtime composition.
 */
export interface RuntimeContribution {
  kind: RuntimeContributionKind;
  order?: number; // lower = earlier/outer
  symbol: RuntimeSymbolRef;

  /**
   * Optional configuration passed through runtime registry.
   * Must be JSON-serializable (stored in manifest).
   */
  config?: Record<string, unknown>;
}
