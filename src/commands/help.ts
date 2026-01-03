/**
 * FILE: src/commands/help.ts
 * PURPOSE: Thin entrypoint for help command.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';

export async function handleHelp(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Thin entrypoint: just print help
  console.log(`
CliMobile - React Native Starter CLI

Usage:
  rns <command> [options]

Commands:
  init              Create a new React Native app with CORE baseline
  plugin            Manage plugins (list, add, status, doctor)
  module            Manage business modules (list, add, status, doctor)
  version, --version Show CLI version
  help, --help     Show this help message

Global Options:
  --cwd <path>     Set working directory
  --yes, -y        Skip prompts and use defaults
  --verbose, -v    Show verbose output
  --dry-run        Show what would be done without making changes

Examples:
  rns init MyApp
  rns plugin add nav.core
  rns --version
`);
}

