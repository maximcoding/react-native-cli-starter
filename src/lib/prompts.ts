/**
 * FILE: src/lib/prompts.ts
 * PURPOSE: Interactive prompt utilities for CLI commands
 * OWNERSHIP: CLI
 * 
 * Uses the 'prompts' library for proper TUI support that works in all terminals including Cursor.
 * Logging is automatically paused during prompts to prevent interference.
 */

import prompts from 'prompts';
import { Logger } from './logger';

// Global reference to logger for pausing/resuming during prompts
let globalLogger: Logger | undefined;

/**
 * Sets the global logger instance for pause/resume during prompts
 */
export function setPromptLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * Pauses logger and returns a resume function
 */
function pauseLogging(): () => void {
  if (globalLogger?.pause) {
    globalLogger.pause();
    return () => {
      if (globalLogger?.resume) {
        globalLogger.resume();
      }
    };
  }
  return () => {};
}

/**
 * Prompts for text input
 */
export async function promptText(question: string, defaultValue?: string): Promise<string> {
  // If not TTY, return default or empty
  if (!process.stdout.isTTY) {
    return defaultValue || '';
  }

  const resume = pauseLogging();
  try {
    const response = await prompts({
      type: 'text',
      name: 'value',
      message: question,
      initial: defaultValue,
      onState: () => {
        // Prevent prompts library from printing to stdout during cancellation
        // All output goes through prompts' internal handling
      },
    });

    // Handle cancellation (Ctrl+C)
    if (!response || !response.value) {
      process.exit(130);
    }

    return response.value || defaultValue || '';
  } finally {
    resume();
  }
}

/**
 * Prompts for selection from a list with arrow key navigation
 */
export async function promptSelect<T>(
  question: string,
  choices: Array<{ label: string; value: T }>,
  defaultValue?: T
): Promise<T> {
  // If not TTY, return default or first choice
  if (!process.stdout.isTTY) {
    return defaultValue !== undefined ? defaultValue : choices[0].value;
  }

  const resume = pauseLogging();
  try {
    const defaultValueIndex = defaultValue !== undefined
      ? choices.findIndex((c) => c.value === defaultValue)
      : 0;

    const response = await prompts({
      type: 'select',
      name: 'value',
      message: question,
      choices: choices.map((choice) => ({
        title: choice.label,
        value: choice.value,
      })),
      initial: defaultValueIndex >= 0 ? defaultValueIndex : 0,
      onState: () => {
        // Prompts library handles all output internally
      },
    });

    // Handle cancellation (Ctrl+C)
    if (!response || response.value === undefined) {
      process.exit(130);
    }

    return response.value;
  } finally {
    resume();
  }
}

/**
 * Prompts for yes/no confirmation
 */
export async function promptConfirm(question: string, defaultValue: boolean = true): Promise<boolean> {
  // If not TTY, return default
  if (!process.stdout.isTTY) {
    return defaultValue;
  }

  const resume = pauseLogging();
  try {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: question,
      initial: defaultValue,
      onState: () => {
        // Prompts library handles all output internally
      },
    });

    // Handle cancellation (Ctrl+C)
    if (response === undefined || response.value === undefined) {
      process.exit(130);
    }

    return response.value as boolean;
  } finally {
    resume();
  }
}

/**
 * Prompts for multiple selections (checkboxes)
 */
export async function promptMultiSelect<T>(
  question: string,
  choices: Array<{ label: string; value: T; default?: boolean }>
): Promise<T[]> {
  // If not TTY, return all defaults
  if (!process.stdout.isTTY) {
    return choices.filter((c) => c.default !== false).map((c) => c.value);
  }

  const resume = pauseLogging();
  try {
    const response = await prompts({
      type: 'multiselect',
      name: 'value',
      message: question,
      choices: choices.map((choice, index) => ({
        title: choice.label,
        value: choice.value,
        selected: choice.default !== false,
      })),
      onState: () => {
        // Prompts library handles all output internally
      },
    });

    // Handle cancellation (Ctrl+C)
    if (response === undefined || response.value === undefined) {
      process.exit(130);
    }

    return response.value as T[];
  } finally {
    resume();
  }
}
