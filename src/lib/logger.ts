/**
 * FILE: src/lib/logger.ts
 * PURPOSE: Logging utility for CLI operations
 * OWNERSHIP: CLI
 */

/**
 * Logger interface for CLI operations
 */
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Simple console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(private verbose: boolean = false) {}

  info(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.debug(message, ...args);
    }
  }
}

