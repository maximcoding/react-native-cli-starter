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
  pause?(): void;
  resume?(): void;
}

/**
 * Simple console logger implementation with pause/resume support
 */
export class ConsoleLogger implements Logger {
  private paused: boolean = false;
  private queuedMessages: Array<{ method: string; args: unknown[] }> = [];

  constructor(private verbose: boolean = false) {}

  info(message: string, ...args: unknown[]): void {
    if (this.paused) {
      // Route to stderr when paused (won't interfere with interactive prompts)
      console.error(message, ...args);
    } else {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.paused) {
      console.error(message, ...args);
    } else {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // Always use stderr for errors
    console.error(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      if (this.paused) {
        console.error(message, ...args);
      } else {
        console.debug(message, ...args);
      }
    }
  }

  /**
   * Pauses stdout logging (routes to stderr instead)
   * This prevents interference with interactive prompts
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resumes stdout logging
   */
  resume(): void {
    this.paused = false;
    // Flush any queued messages if needed
    this.queuedMessages = [];
  }
}

