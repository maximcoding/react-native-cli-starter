/**
 * FILE: src/lib/prompts.ts
 * PURPOSE: Interactive prompt utilities for CLI commands
 * OWNERSHIP: CLI
 */

import * as readline from 'readline';
import { ReadStream } from 'tty';

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
 * Enables raw mode for stdin to capture arrow keys
 */
function enableRawMode(): void {
  if (process.stdin.isTTY) {
    (process.stdin as ReadStream).setRawMode(true);
  }
}

/**
 * Disables raw mode for stdin
 */
function disableRawMode(): void {
  if (process.stdin.isTTY) {
    (process.stdin as ReadStream).setRawMode(false);
  }
}

/**
 * Clears the current line and moves cursor to beginning
 */
function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

/**
 * Moves cursor up by n lines
 */
function cursorUp(n: number): void {
  process.stdout.write(`\x1b[${n}A`);
}

/**
 * Moves cursor down by n lines
 */
function cursorDown(n: number): void {
  process.stdout.write(`\x1b[${n}B`);
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
 * Prompts for selection from a list with arrow key navigation
 */
export async function promptSelect<T>(
  question: string,
  choices: Array<{ label: string; value: T }>,
  defaultValue?: T
): Promise<T> {
  if (!process.stdin.isTTY) {
    // Fallback for non-TTY (e.g., piping): use default or first choice
    return Promise.resolve(defaultValue !== undefined ? defaultValue : choices[0].value);
  }

  let selectedIndex = defaultValue !== undefined
    ? choices.findIndex((c) => c.value === defaultValue)
    : 0;
  
  if (selectedIndex < 0) {
    selectedIndex = 0;
  }

  // Display question
  process.stdout.write(`\n${question}\n`);

  // Display choices with arrow indicator
  const renderChoices = () => {
    choices.forEach((choice, index) => {
      const marker = index === selectedIndex ? '→ ' : '  ';
      const selected = index === selectedIndex ? '\x1b[36m' : ''; // Cyan for selected
      const reset = '\x1b[0m';
      process.stdout.write(`${marker}${selected}${choice.label}${reset}\n`);
    });
    process.stdout.write('\n(Use ↑/↓ to navigate, Enter to select)');
  };

  renderChoices();

  // Calculate how many lines we need to move up to redraw
  const totalLines = choices.length + 2; // choices + blank line + instruction line

  return new Promise((resolve) => {
    enableRawMode();
    let buffer = '';

    const onData = (data: Buffer) => {
      buffer += data.toString();
      
      // Handle escape sequences (arrow keys)
      if (buffer.startsWith('\x1b[')) {
        if (buffer.length >= 3) {
          const code = buffer.slice(2, 3);
          buffer = '';
          
          if (code === 'A') {
            // Up arrow
            if (selectedIndex > 0) {
              selectedIndex--;
            } else {
              selectedIndex = choices.length - 1;
            }
            updateDisplay();
          } else if (code === 'B') {
            // Down arrow
            if (selectedIndex < choices.length - 1) {
              selectedIndex++;
            } else {
              selectedIndex = 0;
            }
            updateDisplay();
          }
        }
        return;
      }

      // Handle Enter
      if (buffer === '\r' || buffer === '\n') {
        buffer = '';
        handleSelection();
        return;
      }

      // Handle Ctrl+C
      if (buffer === '\x03') {
        buffer = '';
        disableRawMode();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        process.exit(130);
      }

      // Reset buffer if it's not a valid sequence
      if (buffer.length > 10) {
        buffer = '';
      }
    };

    const updateDisplay = () => {
      // Move cursor up to beginning of choices
      cursorUp(totalLines);
      
      // Clear and redraw all choices
      for (let i = 0; i < totalLines; i++) {
        clearLine();
        if (i < choices.length) {
          const marker = i === selectedIndex ? '→ ' : '  ';
          const selected = i === selectedIndex ? '\x1b[36m' : '';
          const reset = '\x1b[0m';
          process.stdout.write(`${marker}${selected}${choices[i].label}${reset}\n`);
        } else if (i === choices.length) {
          process.stdout.write('\n');
        } else {
          process.stdout.write('(Use ↑/↓ to navigate, Enter to select)');
        }
      }
    };

    const handleSelection = () => {
      disableRawMode();
      process.stdin.removeListener('data', onData);
      
      // Move cursor down past the prompt
      cursorDown(totalLines);
      process.stdout.write(`\nSelected: ${choices[selectedIndex].label}\n`);
      
      resolve(choices[selectedIndex].value);
    };

    process.stdin.on('data', onData);
    process.stdin.resume();
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

