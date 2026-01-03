/**
 * FILE: src/lib/args.ts
 * PURPOSE: Argument parsing utility
 * OWNERSHIP: CLI
 */

/**
 * Parsed command-line arguments
 */
export interface ParsedArgs {
  _: string[];
  cwd?: string;
  yes?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  [key: string]: unknown;
}

/**
 * Simple argument parser
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { _: [] };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];

      if (next && !next.startsWith('-')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      args[key] = true;
    } else {
      args._.push(arg);
    }
  }

  return args;
}
