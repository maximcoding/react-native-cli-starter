/**
 * FILE: src/lib/cicd-workflows.ts
 * PURPOSE: Generate CI/CD GitHub Actions workflows as CORE capability
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, isDirectory, ensureDir, writeTextFile, readTextFile } from './fs';
import type { InitInputs } from './init';
import { CliError, ExitCode } from './errors';
import { resolvePackSourcePath } from './pack-locations';

const WORKFLOWS_DIR = '.github/workflows';
const WORKFLOW_FILE = 'ci.yml';

/**
 * Generates CI/CD GitHub Actions workflows as a CORE capability (section 24)
 * 
 * This implements the decision made in ALIGNMENT.md TASK 2 (CI/CD = CORE).
 * Workflows are generated during init and placed in `.github/workflows/ci.yml`.
 * 
 * Rules:
 * - Idempotent: If workflow already exists, skip (don't overwrite)
 * - Target-specific: Expo uses EAS-based workflows, Bare uses Gradle/Xcode-based workflows
 * - Environment splits: dev/stage/prod with appropriate build/release pipelines
 */
export function generateCiCdWorkflows(
  appRoot: string,
  inputs: InitInputs
): void {
  const workflowsDir = join(appRoot, WORKFLOWS_DIR);
  const workflowPath = join(workflowsDir, WORKFLOW_FILE);

  // Idempotency check: if workflow already exists, skip
  if (pathExists(workflowPath)) {
    return; // Already generated, skip
  }

  // Ensure .github/workflows directory exists
  ensureDir(workflowsDir);

  // Resolve template path based on target
  const templateName = inputs.target === 'expo' ? 'ci-expo.yml' : 'ci-bare.yml';
  const templatePath = join(
    resolvePackSourcePath('core', 'base'),
    WORKFLOWS_DIR,
    templateName
  );

  // Validate template exists
  if (!pathExists(templatePath)) {
    throw new CliError(
      `CI/CD workflow template not found: ${templatePath}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Read template content
  const templateContent = readTextFile(templatePath);

  // Write workflow file to generated app
  writeTextFile(workflowPath, templateContent);
}
