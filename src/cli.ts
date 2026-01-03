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
      case 'version':
      case '--version':
      case '-v':
        const { getCliVersion } = await import('./lib/version');
        console.log(getCliVersion());
        process.exit(0);
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    logger.error('Command failed:', error instanceof Error ? error.message : String(error));
    if (flags.verbose && error instanceof Error) {
      logger.debug(error.stack || '');
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
React Native Starter CLI

Usage:
  rns <command> [options]

Commands:
  init        Create a new React Native app with CORE baseline
  version     Show CLI version
  help        Show this help message

Global Options:
  --cwd <dir>     Working directory (default: current directory)
  --yes           Auto-confirm all prompts
  --verbose       Enable verbose logging
  --dry-run       Show what would be done without making changes
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
