/**
 * FILE: src/lib/errors.ts
 * PURPOSE: Error handling and exit codes
 * OWNERSHIP: CLI
 */

/**
 * Exit codes for CI-friendly error handling
 */
export enum ExitCode {
  SUCCESS = 0,
  GENERIC_FAILURE = 1,
  VALIDATION_STATE_FAILURE = 2,
  DEPENDENCY_INSTALL_FAILURE = 3,
}

/**
 * CLI error with exit code
 */
export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCode = ExitCode.GENERIC_FAILURE,
    public readonly stepName?: string,
    public readonly logPath?: string
  ) {
    super(message);
    this.name = 'CliError';
  }
}

/**
 * Formats error output for user display
 */
export function formatErrorOutput(error: CliError | Error, verbose: boolean): string {
  const lines: string[] = [];

  if (error instanceof CliError) {
    if (error.stepName) {
      lines.push(`Failed at step: ${error.stepName}`);
    }
    lines.push(`Error: ${error.message}`);
    if (error.logPath) {
      lines.push(`Log file: ${error.logPath}`);
    }
    if (verbose && error.stack) {
      lines.push('');
      lines.push('Stack trace:');
      lines.push(error.stack);
    }
  } else {
    lines.push(`Error: ${error.message}`);
    if (verbose && error.stack) {
      lines.push('');
      lines.push('Stack trace:');
      lines.push(error.stack);
    }
  }

  return lines.join('\n');
}


