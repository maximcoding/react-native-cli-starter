/**
 * FILE: src/lib/exec.ts
 * PURPOSE: Execute shell commands and package manager operations
 * OWNERSHIP: CLI
 */

import { execSync } from 'child_process';
import { CliError, ExitCode } from './errors';

export interface ExecOptions {
  cwd?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
  env?: NodeJS.ProcessEnv;
}

/**
 * Executes a shell command synchronously
 */
export function execCommand(command: string, options: ExecOptions = {}): { stdout: string; stderr: string } {
  const { cwd, stdio = 'inherit', env } = options;

  try {
    const stdout = execSync(command, {
      cwd,
      stdio: stdio === 'inherit' ? 'inherit' : ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      encoding: 'utf-8',
    }) as string;

    return {
      stdout: stdio !== 'inherit' ? (stdout || '') : '',
      stderr: '',
    };
  } catch (error: any) {
    if (error.stdout || error.stderr) {
      throw new CliError(
        `Command failed: ${command}\n${error.stdout || ''}\n${error.stderr || ''}`,
        ExitCode.GENERIC_FAILURE
      );
    }
    throw new CliError(
      `Command failed: ${command}\n${error.message || String(error)}`,
      ExitCode.GENERIC_FAILURE
    );
  }
}

/**
 * Executes a package manager command
 */
export function execPackageManager(
  pm: 'npm' | 'pnpm' | 'yarn',
  args: string[],
  options: ExecOptions = {}
): { stdout: string; stderr: string } {
  const command = `${pm} ${args.join(' ')}`;
  return execCommand(command, options);
}

