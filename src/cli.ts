/**
 * FILE: src/cli.ts
 * PURPOSE: Root CLI entrypoint that routes commands to thin command handlers
 * OWNERSHIP: CLI
 */

import { parseArgs } from './lib/args';
import { createRuntimeContext, GlobalFlags } from './lib/runtime';
import { ConsoleLogger } from './lib/logger';
import { resolveProjectRoot } from './lib/fs';
import { generateRunId } from './lib/utils';
import { CliError, ExitCode, formatErrorOutput } from './lib/errors';
import * as commands from './commands';

/**
 * Main CLI entrypoint
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const flags: GlobalFlags = {
    cwd: args.cwd,
    yes: args.yes || false,
    verbose: args.verbose || false,
    dryRun: args.dryRun || false,
  };

  // Handle flags first (before positional commands)
  if (args.version || args['--version'] || args['-v']) {
    const { getCliVersion } = await import('./lib/version');
    console.log(getCliVersion());
    process.exit(0);
  }

  if (args.help || args['--help'] || args['-h']) {
    showHelp();
    process.exit(0);
  }

  const resolvedRoot = resolveProjectRoot(flags.cwd || process.cwd());
  const logger = new ConsoleLogger(flags.verbose);
  const runId = generateRunId();

  const ctx = createRuntimeContext(resolvedRoot, flags, logger, runId);

  const command = args._[0] || 'help';

  try {
    switch (command) {
      case 'init':
        await commands.init(ctx, args);
        break;
      case 'plugin':
        await commands.plugin(args, ctx);
        break;
      case 'module':
        await commands.module(args, ctx);
        break;
      case 'component':
        await commands.component(args, ctx);
        break;
      case 'version':
        const { getCliVersion: getVersion } = await import('./lib/version');
        console.log(getVersion());
        process.exit(0);
        break;
      case 'help':
        showHelp();
        process.exit(0);
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    const cliError = error instanceof CliError ? error : new CliError(error instanceof Error ? error.message : String(error));
    const errorOutput = formatErrorOutput(cliError, flags.verbose);
    logger.error(errorOutput);
    process.exit(cliError.exitCode);
  }
}

function showHelp() {
  console.log(`
React Native Starter CLI

Usage:
  rns <command> [options]

Commands:
  init        Create a new React Native app with CORE baseline
              Usage: rns init <name> [--target expo|bare] [--lang ts|js] [--pm npm|pnpm|yarn] [--platforms ios,android] [--rn-version <version>] [--locales en,ru,de] [--yes]
              Note: Use --yes to skip all prompts and use defaults for features, locales, plugins, and dependencies
              Note: Use --locales to specify which locales to use for i18n (e.g., --locales en,ru,de). English is always included.
  plugin      Manage plugins (list, add, remove, status, doctor)
  module      Manage modules (list, add, status, doctor)
  component   Generate UI components (add)
  version     Show CLI version
  help        Show this help message

Plugin Commands:
  rns plugin list [--json]                    List available plugins
  rns plugin add [ids...] [--dry-run] [--yes] Install plugins
  rns plugin remove [ids...] [--dry-run] [--yes] Remove plugins
  rns plugin status [--json]                 Show installed vs available
  rns plugin doctor [--fix]                  Validate installed plugins

Module Commands:
  rns module list [--json] [--category <cat>] [--target <target>] List available modules
  rns module add [ids...] [--dry-run] [--yes] [--verbose]         Generate modules
  rns module status [--json]                                       Show installed vs available
  rns module doctor                                                Validate installed modules

Component Commands:
  rns component add <name> [names...] [--dry-run] [--yes] [--verbose]  Generate UI components

Global Options:
  --cwd <dir>     Working directory (default: current directory)
  --yes           Auto-confirm all prompts
  --verbose       Enable verbose logging
  --dry-run       Show what would be done without making changes
`);
}

// Entry point when run directly (node dist/cli.js or rns command)
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
