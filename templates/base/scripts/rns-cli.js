#!/usr/bin/env node
/**
 * Local CLI wrapper for RNS commands
 * 
 * Allows running RNS CLI commands from within generated projects without global installation.
 * Finds the CliMobile repository in parent directory or via CLIMOBILE_PATH env var.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();

function findCliMobilePath() {
  // Check parent directory first (MyApp might be inside CliMobile repo)
  const parentPath = path.join(cwd, '..');
  const parentPackageJson = path.join(parentPath, 'package.json');
  if (fs.existsSync(parentPackageJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(parentPackageJson, 'utf-8'));
      if (pkg.name === 'climobile') return parentPath;
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Check sibling directory (CliMobile/MyApp structure where MyApp is sibling to CliMobile)
  const siblingPath = path.join(cwd, '..', 'CliMobile');
  if (fs.existsSync(path.join(siblingPath, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(siblingPath, 'package.json'), 'utf-8'));
      if (pkg.name === 'climobile') return siblingPath;
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Check environment variable
  if (process.env.CLIMOBILE_PATH) {
    const envPath = process.env.CLIMOBILE_PATH;
    if (fs.existsSync(path.join(envPath, 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(envPath, 'package.json'), 'utf-8'));
        if (pkg.name === 'climobile') return envPath;
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  return null;
}

const cliMobilePath = findCliMobilePath();
if (!cliMobilePath) {
  console.error('❌ CliMobile repository not found.');
  console.error('   Set CLIMOBILE_PATH environment variable or ensure CliMobile is in parent directory.');
  process.exit(1);
}

// Get all CLI arguments (skip node and script path)
const args = process.argv.slice(2).join(' ');

// Execute CLI from CliMobile repository, passing --cwd to set working directory
try {
  execSync(`npm run cli -- ${args} --cwd "${cwd}"`, {
    cwd: cliMobilePath,
    stdio: 'inherit',
    shell: true,
  });
} catch (error) {
  // Exit with the same code as the child process
  process.exit(error.status || 1);
}
