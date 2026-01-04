/**
 * FILE: packages/@rns/core/contracts/logging.ts
 * PURPOSE: Stable logger API + default console implementation
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Uses only built-in console APIs (no external dependencies)
 * - Can be replaced via plugins by swapping the logger instance
 * - Plugins must NOT modify this file directly
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Default console-based logger implementation
 */
class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info('[INFO]', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn('[WARN]', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error('[ERROR]', message, ...args);
  }
}

/**
 * Default logger instance (safe default, can be replaced via plugins)
 */
export const logger: Logger = new ConsoleLogger();

