/**
 * FILE: src/lib/prompts.ts
 * PURPOSE: Interactive prompt utilities for CLI commands
 * OWNERSHIP: CLI
 */

import * as readline from 'readline';

/**
 * Creates a readline interface for prompts
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts for text input
 */
export async function promptText(question: string, defaultValue?: string): Promise<string> {
  const rl = createReadlineInterface();
  const prompt = defaultValue ? `${question} (default: ${defaultValue}): ` : `${question}: `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Prompts for selection from a list
 */
export async function promptSelect<T>(
  question: string,
  choices: Array<{ label: string; value: T }>,
  defaultValue?: T
): Promise<T> {
  const rl = createReadlineInterface();

  // Display choices
  console.log(`\n${question}`);
  choices.forEach((choice, index) => {
    const marker = defaultValue === choice.value ? '(*) ' : '    ';
    console.log(`${marker}${index + 1}. ${choice.label}`);
  });

  const defaultValueIndex = defaultValue
    ? choices.findIndex((c) => c.value === defaultValue)
    : -1;
  const prompt = defaultValueIndex >= 0
    ? `\nSelect (1-${choices.length}, default: ${defaultValueIndex + 1}): `
    : `\nSelect (1-${choices.length}): `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const input = answer.trim();
      
      if (!input && defaultValue !== undefined) {
        resolve(defaultValue);
        return;
      }

      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < choices.length) {
        resolve(choices[selectedIndex].value);
      } else {
        console.log('Invalid selection, using default');
        resolve(defaultValue !== undefined ? defaultValue : choices[0].value);
      }
    });
  });
}

/**
 * Prompts for yes/no confirmation
 */
export async function promptConfirm(question: string, defaultValue: boolean = true): Promise<boolean> {
  const rl = createReadlineInterface();
  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const prompt = `${question} (${defaultText}): `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const input = answer.trim().toLowerCase();
      
      if (!input) {
        resolve(defaultValue);
        return;
      }

      resolve(input === 'y' || input === 'yes');
    });
  });
}

/**
 * Prompts for multiple selections (checkboxes)
 */
export async function promptMultiSelect<T>(
  question: string,
  choices: Array<{ label: string; value: T; default?: boolean }>
): Promise<T[]> {
  const rl = createReadlineInterface();

  console.log(`\n${question}`);
  choices.forEach((choice, index) => {
    const marker = choice.default !== false ? '[x]' : '[ ]';
    console.log(`${marker} ${index + 1}. ${choice.label}`);
  });

  const prompt = `\nSelect items (comma-separated numbers, default: all checked): `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const input = answer.trim();

      if (!input) {
        // Return all items where default !== false
        resolve(choices.filter((c) => c.default !== false).map((c) => c.value));
        return;
      }

      const selectedIndices = input
        .split(',')
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((n) => n >= 0 && n < choices.length);

      if (selectedIndices.length === 0) {
        resolve(choices.filter((c) => c.default !== false).map((c) => c.value));
        return;
      }

      resolve(selectedIndices.map((i) => choices[i].value));
    });
  });
}

