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
 * Moves cursor to the beginning of the line
 */
function cursorToStart(): void {
  process.stdout.write('\r');
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

  // Calculate how many lines we need to move up to redraw
  // Total: choices + blank line + instruction line
  const totalLines = choices.length + 2;
  
  // Track the starting line number for the prompt area (for cursor positioning)
  // We'll save the cursor position before drawing choices
  const promptStartLine = process.stdout.rows ? process.stdout.rows - 1 : undefined;

  // Display choices with arrow indicator (initial render)
  choices.forEach((choice, index) => {
    const marker = index === selectedIndex ? '→ ' : '  ';
    const selected = index === selectedIndex ? '\x1b[36m' : ''; // Cyan for selected
    const reset = '\x1b[0m';
    process.stdout.write(`${marker}${selected}${choice.label}${reset}\n`);
  });
  process.stdout.write('\n');
  process.stdout.write('(Use ↑/↓ to navigate, Enter to select)');
  // After initial render, cursor is at end of instruction line (NO trailing newline)

  return new Promise((resolve) => {
    enableRawMode();
    let buffer = '';

    const updateDisplay = () => {
      // Save current cursor position - we're at end of instruction line
      // Move cursor up exactly totalLines to get back to first choice line
      // We need to move up: instruction (1) + blank (1) + choices (N) = N+2
      for (let i = 0; i < totalLines; i++) {
        cursorUp(1);
      }
      
      // Now cursor should be at start of first choice line
      // Redraw each choice line exactly where it was
      for (let i = 0; i < choices.length; i++) {
        process.stdout.write('\r'); // Ensure at start of line
        process.stdout.write('\x1b[K'); // Clear from cursor to end of line only
        const marker = i === selectedIndex ? '→ ' : '  ';
        const selected = i === selectedIndex ? '\x1b[36m' : '';
        const reset = '\x1b[0m';
        process.stdout.write(`${marker}${selected}${choices[i].label}${reset}`);
        // Move to next line ONLY if not the last choice
        if (i < choices.length - 1) {
          process.stdout.write('\n');
        }
      }
      
      // Move to blank line (after last choice)
      process.stdout.write('\n');
      process.stdout.write('\r'); // Start of blank line
      process.stdout.write('\x1b[K'); // Clear blank line
      process.stdout.write('\n'); // Write blank line content (empty)
      
      // Move to instruction line (last line)
      process.stdout.write('\r'); // Start of instruction line
      process.stdout.write('\x1b[K'); // Clear instruction line completely
      process.stdout.write('(Use ↑/↓ to navigate, Enter to select)');
      // NO trailing newline - cursor stays at end of instruction line
      // This is critical - prevents scrolling and creating new lines
    };

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
 * Prompts for multiple selections (checkboxes) with arrow key navigation
 */
export async function promptMultiSelect<T>(
  question: string,
  choices: Array<{ label: string; value: T; default?: boolean }>
): Promise<T[]> {
  if (!process.stdin.isTTY) {
    // Fallback for non-TTY: return all default selections
    return Promise.resolve(choices.filter((c) => c.default !== false).map((c) => c.value));
  }

  // Initialize selected state
  const selected: boolean[] = choices.map((c) => c.default !== false);
  let selectedIndex = 0;

  // Display question
  process.stdout.write(`\n${question}\n`);

  // Display choices with checkbox indicator
  const renderChoices = () => {
    choices.forEach((choice, index) => {
      const checkbox = selected[index] ? '[x]' : '[ ]';
      const marker = index === selectedIndex ? '→ ' : '  ';
      const highlighted = index === selectedIndex ? '\x1b[36m' : '';
      const reset = '\x1b[0m';
      process.stdout.write(`${marker}${checkbox} ${highlighted}${choice.label}${reset}\n`);
    });
    process.stdout.write('\n(Use ↑/↓ to navigate, Space to toggle, Enter to confirm)');
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

      // Handle Space (toggle selection)
      if (buffer === ' ') {
        buffer = '';
        selected[selectedIndex] = !selected[selectedIndex];
        updateDisplay();
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
      // Move cursor up to beginning of first choice line
      cursorUp(totalLines);
      
      // Clear and redraw all choices line by line
      for (let i = 0; i < choices.length; i++) {
        clearLine();
        const checkbox = selected[i] ? '[x]' : '[ ]';
        const marker = i === selectedIndex ? '→ ' : '  ';
        const highlighted = i === selectedIndex ? '\x1b[36m' : '';
        const reset = '\x1b[0m';
        process.stdout.write(`${marker}${checkbox} ${highlighted}${choices[i].label}${reset}`);
        process.stdout.write('\n');
      }
      // Clear blank line
      clearLine();
      process.stdout.write('\n');
      // Clear and rewrite instruction line
      clearLine();
      process.stdout.write('(Use ↑/↓ to navigate, Space to toggle, Enter to confirm)');
    };

    const handleSelection = () => {
      disableRawMode();
      process.stdin.removeListener('data', onData);
      
      // Move cursor down past the prompt
      cursorDown(totalLines);
      
      const selectedLabels = choices
        .filter((_, index) => selected[index])
        .map((c) => c.label)
        .join(', ');
      
      process.stdout.write(`\nSelected: ${selectedLabels || '(none)'}\n`);
      
      // Return selected values
      const selectedValues = choices
        .filter((_, index) => selected[index])
        .map((c) => c.value);
      
      resolve(selectedValues);
    };

    process.stdin.on('data', onData);
    process.stdin.resume();
  });
}

