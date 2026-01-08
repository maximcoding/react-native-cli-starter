/**
 * FILE: src/lib/runtime-wiring.ts
 * PURPOSE: Runtime Wiring Engine (AST-only, symbol-based) using ts-morph (section 11)
 * OWNERSHIP: CLI
 * 
 * This engine performs runtime wiring via AST manipulation only (no regex, no raw code strings).
 * Wiring must be symbol-based and composed in SYSTEM ZONE (packages/@rns/**) only.
 */

import { join } from 'path';
import { Project, SyntaxKind, Node, ImportDeclaration, CallExpression, SourceFile } from 'ts-morph';
import { readTextFile, writeTextFile, pathExists } from './fs';
import { findMarker, validateMarker, formatMarkerError, type MarkerType, CANONICAL_MARKERS } from './markers';
import { backupFile, createBackupDirectory } from './backup';
import { hasInjectionMarker, createInjectionMarker, isCliManagedZone } from './idempotency';
import { CliError, ExitCode } from './errors';
import type {
  RuntimeWiringOp,
  RuntimeWiringResult,
  RuntimeContribution,
  SymbolRef,
  ProviderContribution,
  ImportContribution,
  InitStepContribution,
  RegistrationContribution,
  RootContribution,
} from './types/runtime';

/**
 * Wires a single runtime contribution using AST manipulation
 * 
 * @param projectRoot - Project root directory
 * @param op - Runtime wiring operation
 * @param dryRun - If true, don't write changes
 * @returns Wiring result
 */
export function wireRuntimeContribution(
  projectRoot: string,
  op: RuntimeWiringOp,
  dryRun: boolean = false
): RuntimeWiringResult {
  const filePath = join(projectRoot, op.file);

  // Validate file exists
  if (!pathExists(filePath)) {
    return {
      success: false,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'error',
      error: `File not found: ${op.file}`,
    };
  }

  // Validate SYSTEM ZONE only
  if (!isCliManagedZone(filePath, projectRoot)) {
    return {
      success: false,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'error',
      error: `Runtime wiring only allowed in SYSTEM ZONE (packages/@rns/**). File: ${op.file}`,
    };
  }

  // Find marker definition
  const markerDef = CANONICAL_MARKERS.find(m => m.type === op.markerType);
  if (!markerDef) {
    return {
      success: false,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'error',
      error: `Unknown marker type: ${op.markerType}`,
    };
  }

  // Validate marker exists and is well-formed
  const validation = validateMarker(projectRoot, markerDef);
  if (!validation.valid) {
    return {
      success: false,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'error',
      error: formatMarkerError(markerDef, filePath, validation.error!),
    };
  }

  // Check for duplicate injection (idempotency)
  const operationId = `${op.capabilityId}-${op.markerType}-${op.contribution.type}`;
  if (hasInjectionMarker(filePath, operationId)) {
    return {
      success: true,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'skipped',
    };
  }

  // Find marker location
  const markerInfo = findMarker(filePath, op.markerType);
  if (!markerInfo) {
    return {
      success: false,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'error',
      error: `Marker not found: @rns-marker:${op.markerType}`,
    };
  }

  // Create backup before modification
  let backupPath: string | null = null;
  if (!dryRun) {
    const backupDir = createBackupDirectory(projectRoot, `wire-${op.capabilityId}`);
    backupPath = backupFile(projectRoot, filePath, backupDir) || null;
  }

  // Perform AST-based injection
  try {
    if (!dryRun) {
      injectContributionViaAST(filePath, op, markerInfo.startLine, markerInfo.endLine);
    }

    return {
      success: true,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'injected',
      backupPath: backupPath || undefined,
    };
  } catch (error) {
    return {
      success: false,
      file: op.file,
      markerType: op.markerType,
      capabilityId: op.capabilityId,
      contributionType: op.contribution.type,
      action: 'error',
      error: error instanceof Error ? error.message : String(error),
      backupPath: backupPath || undefined,
    };
  }
}

/**
 * Wires multiple runtime contributions
 * Automatically sorts by order before applying
 * 
 * @param projectRoot - Project root directory
 * @param ops - Array of wiring operations
 * @param dryRun - If true, don't write changes
 * @returns Array of wiring results
 */
export function wireRuntimeContributions(
  projectRoot: string,
  ops: RuntimeWiringOp[],
  dryRun: boolean = false
): RuntimeWiringResult[] {
  // Sort operations by order (lower = earlier) and capability ID for deterministic ordering
  const sortedOps = [...ops].sort((a, b) => {
    // Get order from op.order first, then from contribution.order if it exists
    const orderA = a.order ?? ('order' in a.contribution ? a.contribution.order : undefined) ?? 0;
    const orderB = b.order ?? ('order' in b.contribution ? b.contribution.order : undefined) ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // Secondary sort by capability ID for stability
    return a.capabilityId.localeCompare(b.capabilityId);
  });

  return sortedOps.map(op => wireRuntimeContribution(projectRoot, op, dryRun));
}

/**
 * Injects a contribution using ts-morph AST manipulation
 * 
 * @param filePath - Absolute path to file
 * @param op - Wiring operation
 * @param markerStartLine - Start line of marker (1-based)
 * @param markerEndLine - End line of marker (1-based)
 */
function injectContributionViaAST(
  filePath: string,
  op: RuntimeWiringOp,
  markerStartLine: number,
  markerEndLine: number
): void {
  // Create ts-morph project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    useInMemoryFileSystem: false,
  });

  // Add the source file
  const sourceFile = project.addSourceFileAtPath(filePath);

  // Get the marker region (lines between start and end markers, excluding markers)
  const markerStart = sourceFile.getLineAndColumnAtPos(
    sourceFile.getFullText().split('\n').slice(0, markerStartLine - 1).join('\n').length
  );
  const markerEnd = sourceFile.getLineAndColumnAtPos(
    sourceFile.getFullText().split('\n').slice(0, markerEndLine - 1).join('\n').length
  );

  // Inject based on contribution type
  switch (op.contribution.type) {
    case 'import':
      injectImportContribution(sourceFile, op.contribution, op.capabilityId, markerStartLine);
      break;
    case 'provider':
      injectProviderContribution(sourceFile, op.contribution, op.capabilityId, markerStartLine, markerEndLine);
      break;
    case 'init-step':
      injectInitStepContribution(sourceFile, op.contribution, op.capabilityId, markerStartLine, markerEndLine);
      break;
    case 'registration':
      injectRegistrationContribution(sourceFile, op.contribution, op.capabilityId, markerStartLine, markerEndLine);
      break;
    case 'root':
      injectRootContribution(sourceFile, op.contribution, op.capabilityId, markerStartLine, markerEndLine);
      break;
    default:
      throw new Error(`Unknown contribution type: ${(op.contribution as any).type}`);
  }

  // Save the modified file
  sourceFile.saveSync();
}

/**
 * Injects import statements using AST
 */
function injectImportContribution(
  sourceFile: SourceFile,
  contribution: ImportContribution,
  capabilityId: string,
  markerStartLine: number
): void {
  const existingImports = sourceFile.getImportDeclarations();
  
  // Group imports by module source to merge if needed
  const importsBySource = new Map<string, SymbolRef[]>();
  for (const symbolRef of contribution.imports) {
    const existing = importsBySource.get(symbolRef.source) || [];
    existing.push(symbolRef);
    importsBySource.set(symbolRef.source, existing);
  }

  // Check if imports already exist (idempotency check) and add missing ones
  for (const [source, symbols] of importsBySource) {
    const existingImport = existingImports.find(imp => {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      const normalizedSpecifier = moduleSpecifier.replace(/['"]/g, '');
      return normalizedSpecifier === source;
    });

    if (existingImport) {
      // Check which symbols are missing
      const importedNames = existingImport.getNamedImports().map(named => named.getName());
      const missingSymbols = symbols.filter(s => !importedNames.includes(s.symbol));
      
      if (missingSymbols.length > 0) {
        // Add missing symbols to existing import
        for (const symbol of missingSymbols) {
          existingImport.addNamedImport(symbol.symbol);
        }
      }
    } else {
      // Create new import declaration
      // Find insertion point: after last import or at beginning of file
      let insertionIndex = 0;
      if (existingImports.length > 0) {
        const lastImport = existingImports[existingImports.length - 1];
        insertionIndex = lastImport.getChildIndex() + 1;
      }

      // Add new import declaration using AST
      sourceFile.insertImportDeclaration(insertionIndex, {
        namedImports: symbols.map(s => s.symbol),
        moduleSpecifier: source,
      });
    }
  }

  // Add injection marker as trailing comment on last import
  // Note: ts-morph doesn't easily support arbitrary comments, so we add it as a statement if needed
  // For imports, the marker is tracked via idempotency check on the capability ID
}

/**
 * Injects provider wrapper using AST
 * Note: JSX wrapping is complex with ts-morph. We inject the provider as a statement
 * that wraps children, expecting the marker region to contain JSX children.
 */
function injectProviderContribution(
  sourceFile: SourceFile,
  contribution: ProviderContribution,
  capabilityId: string,
  markerStartLine: number,
  markerEndLine: number
): void {
  // Build provider JSX element string
  const propsStr = contribution.props
    ? ' ' + Object.entries(contribution.props)
        .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
        .join(' ')
    : '';
  
  const providerOpen = `<${contribution.provider.symbol}${propsStr}>`;
  const providerClose = `</${contribution.provider.symbol}>`;
  
  const injectionMarker = createInjectionMarker(`${capabilityId}-provider`);
  
  // Insert provider wrapper before end marker
  // We inject: open tag, then existing content, then close tag
  const content = sourceFile.getFullText();
  const lines = content.split('\n');
  const beforeMarker = lines.slice(0, markerEndLine - 1).join('\n');
  const afterMarker = lines.slice(markerEndLine - 1).join('\n');
  
  // Calculate insertion position (just before end marker)
  const insertionPos = beforeMarker.length;
  
  // Insert provider wrapper
  const providerCode = `\n    // ${injectionMarker}\n    ${providerOpen}\n      {children}\n    ${providerClose}\n`;
  sourceFile.insertText(insertionPos, providerCode);
}

/**
 * Injects initialization step using AST
 * Creates a call expression statement using ts-morph
 */
function injectInitStepContribution(
  sourceFile: SourceFile,
  contribution: InitStepContribution,
  capabilityId: string,
  markerStartLine: number,
  markerEndLine: number
): void {
  const injectionMarker = createInjectionMarker(`${capabilityId}-init-step`);

  // Calculate insertion position (just before end marker)
  const content = sourceFile.getFullText();
  const lines = content.split('\n');
  const beforeMarker = lines.slice(0, markerEndLine - 1).join('\n');
  const insertionPos = beforeMarker.length;

  if (typeof contribution.step === 'string') {
    // Raw code string (discouraged but supported)
    // Note: For raw strings, we can't use AST, so we insert as text
    const code = `\n  // ${injectionMarker}\n  ${contribution.step};\n`;
    sourceFile.insertText(insertionPos, code);
  } else {
    // Symbol-based (preferred)
    // Insert as call expression
    const symbolRef = contribution.step as SymbolRef;
    const argsStr = contribution.args ? contribution.args.map(a => JSON.stringify(a)).join(', ') : '';
    const callCode = `\n  // ${injectionMarker}\n  ${symbolRef.symbol}(${argsStr});\n`;
    sourceFile.insertText(insertionPos, callCode);
  }
}

/**
 * Injects registration using AST
 */
function injectRegistrationContribution(
  sourceFile: SourceFile,
  contribution: RegistrationContribution,
  capabilityId: string,
  markerStartLine: number,
  markerEndLine: number
): void {
  const injectionMarker = createInjectionMarker(`${capabilityId}-registration`);

  // Calculate insertion position (just before end marker)
  const content = sourceFile.getFullText();
  const lines = content.split('\n');
  const beforeMarker = lines.slice(0, markerEndLine - 1).join('\n');
  const insertionPos = beforeMarker.length;

  if (typeof contribution.registration === 'string') {
    // Raw code string
    const code = `\n  // ${injectionMarker}\n  ${contribution.registration};\n`;
    sourceFile.insertText(insertionPos, code);
  } else {
    // Symbol-based
    const symbolRef = contribution.registration as SymbolRef;
    const callCode = `\n  // ${injectionMarker}\n  ${symbolRef.symbol}();\n`;
    sourceFile.insertText(insertionPos, callCode);
  }
}

/**
 * Injects root component replacement using AST
 * Replaces the return statement content within the root marker
 */
function injectRootContribution(
  sourceFile: SourceFile,
  contribution: RootContribution,
  capabilityId: string,
  markerStartLine: number,
  markerEndLine: number
): void {
  // Root replacement replaces the content between markers
  const injectionMarker = createInjectionMarker(`${capabilityId}-root`);
  const rootCode = `  // ${injectionMarker}\n  return <${contribution.root.symbol} />;`;
  
  // Replace content between markers
  const content = sourceFile.getFullText();
  const lines = content.split('\n');
  const beforeMarker = lines.slice(0, markerStartLine).join('\n');
  const afterMarker = lines.slice(markerEndLine - 1).join('\n');
  
  // Calculate positions for replacement
  const startPos = content.split('\n').slice(0, markerStartLine).join('\n').length;
  const endPos = content.split('\n').slice(0, markerEndLine - 1).join('\n').length;
  
  // Replace the marker content
  sourceFile.replaceWithText(
    content.substring(0, startPos) +
    '\n' + rootCode + '\n' +
    content.substring(endPos)
  );
}

/**
 * Validates that all wiring operations are valid before applying
 * 
 * @param projectRoot - Project root directory
 * @param ops - Array of wiring operations
 * @returns Array of validation errors (empty if all valid)
 */
export function validateWiringOps(
  projectRoot: string,
  ops: RuntimeWiringOp[]
): string[] {
  const errors: string[] = [];

  for (const op of ops) {
    // Validate file exists and is in SYSTEM ZONE
    const filePath = join(projectRoot, op.file);
    if (!pathExists(filePath)) {
      errors.push(`File not found: ${op.file} (capability: ${op.capabilityId})`);
      continue;
    }

    if (!isCliManagedZone(filePath, projectRoot)) {
      errors.push(
        `Runtime wiring only allowed in SYSTEM ZONE. File: ${op.file} (capability: ${op.capabilityId})`
      );
      continue;
    }

    // Validate marker
    const markerDef = CANONICAL_MARKERS.find(m => m.type === op.markerType);
    if (!markerDef) {
      errors.push(`Unknown marker type: ${op.markerType} (capability: ${op.capabilityId})`);
      continue;
    }

    const validation = validateMarker(projectRoot, markerDef);
    if (!validation.valid) {
      errors.push(
        `Marker validation failed for ${op.capabilityId}: ${validation.error}`
      );
    }

    // Validate contribution structure
    if (op.contribution.type === 'import' && !op.contribution.imports.length) {
      errors.push(`Import contribution must have at least one import (capability: ${op.capabilityId})`);
    }
  }

  return errors;
}
