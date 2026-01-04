/**
 * FILE: src/lib/step-runner.ts
 * PURPOSE: Step runner utility (start/ok/fail) shared by init/plugins/modules
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from './runtime';
import { join } from 'path';
import { CLI_LOGS_DIR } from './constants';
import { ensureDir, atomicWrite, pathExists } from './fs';

export interface StepResult {
  success: boolean;
  stepName: string;
  error?: Error;
  logPath?: string;
}

/**
 * Step runner for tracking command execution steps
 */
export class StepRunner {
  private steps: Array<{ name: string; startTime: number; endTime?: number; success?: boolean; error?: Error }> = [];
  private logPath: string;
  private logBuffer: string[] = [];

  constructor(private ctx: RuntimeContext) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logPath = join(ctx.resolvedRoot, CLI_LOGS_DIR, `${timestamp}-${ctx.runId}.log`);
    ensureDir(join(ctx.resolvedRoot, CLI_LOGS_DIR));
    this.log(`CLI Run ID: ${ctx.runId}`);
    this.log(`Timestamp: ${new Date().toISOString()}`);
    this.log(`Command: ${process.argv.slice(2).join(' ')}`);
    this.log(`Working Directory: ${ctx.resolvedRoot}`);
    this.log('');
  }

  /**
   * Starts a new step
   */
  start(stepName: string): void {
    this.steps.push({ name: stepName, startTime: Date.now() });
    this.log(`[START] ${stepName}`);
    // Logger automatically routes to stderr if paused (prevents interference with prompts)
    this.ctx.logger.info(`→ ${stepName}...`);
  }

  /**
   * Marks the current step as successful
   */
  ok(stepName?: string): void {
    const step = this.findStep(stepName);
    if (step) {
      step.endTime = Date.now();
      step.success = true;
      const duration = step.endTime - step.startTime;
      this.log(`[OK] ${step.name} (${duration}ms)`);
      this.ctx.logger.info(`✓ ${step.name}`);
    }
  }

  /**
   * Marks the current step as failed
   */
  fail(stepName: string, error: Error): StepResult {
    const step = this.findStep(stepName);
    if (step) {
      step.endTime = Date.now();
      step.success = false;
      step.error = error;
      const duration = step.endTime - step.startTime;
      this.log(`[FAIL] ${step.name} (${duration}ms)`);
      this.log(`Error: ${error.message}`);
      if (this.ctx.flags.verbose && error.stack) {
        this.log(`Stack: ${error.stack}`);
      }
    }

    this.flushLog();
    return {
      success: false,
      stepName,
      error,
      logPath: this.logPath,
    };
  }

  /**
   * Flushes the log buffer to disk
   */
  flushLog(): void {
    if (this.logBuffer.length > 0) {
      const content = this.logBuffer.join('\n') + '\n';
      atomicWrite(this.logPath, content);
      this.logBuffer = [];
    }
  }

  /**
   * Logs a message to both console and log file
   */
  private log(message: string): void {
    this.logBuffer.push(message);
    if (this.ctx.flags.verbose) {
      this.ctx.logger.debug(message);
    }
  }

  /**
   * Finds a step by name (or returns the last step if no name provided)
   */
  private findStep(stepName?: string) {
    if (stepName) {
      return this.steps.find((s) => s.name === stepName);
    }
    return this.steps.length > 0 ? this.steps[this.steps.length - 1] : undefined;
  }

  /**
   * Gets the log file path
   */
  getLogPath(): string {
    return this.logPath;
  }

  /**
   * Completes the step runner and flushes logs
   */
  complete(): void {
    this.flushLog();
    this.log('');
    this.log('Run completed successfully');
  }
}

/**
 * Creates a step runner for a command execution
 */
export function createStepRunner(ctx: RuntimeContext): StepRunner {
  return new StepRunner(ctx);
}

