<!--
FILE: docs/SPEC_ACCEPTANCE.md
PURPOSE: Spec acceptance assertions mapping tests to TODO sections 1-22
OWNERSHIP: CLI
-->

# Spec Acceptance Assertions - Tests Mapping to TODO Sections

This document maps test files to TODO sections 1-22, ensuring each section's contract is validated by corresponding tests.

---

## Section 1: CLI Foundation ✅

**Contract:** Stable TypeScript CLI repository, runnable `rns` binary, single logging/error format, repo structure.

**Tests:**
- ✅ **CI Gates** (`.github/workflows/ci.yml`) - Build job validates CLI builds correctly
- ✅ **TypeCheck** (CI workflow) - TypeScript compilation validates repo structure
- ✅ **Build Tests** (CI workflow) - Verifies `dist/cli.js` is generated

**Acceptance Criteria:**
- ✅ `npm run build` produces `dist/cli.js`
- ✅ `npm run cli -- --help` works
- ✅ Type checking passes

---

## Section 2: INIT Pipeline ✅

**Contract:** Full init flow, zero manual edits, ready-to-run state.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/init.smoke.test.ts`) - Init Expo/Bare → boots → doctor passes

**Acceptance Criteria:**
- ✅ Init creates project structure
- ✅ Manifest is created correctly
- ✅ Doctor passes after init
- ✅ Project boots (structure validated)

---

## Section 3: CORE Base Pack ✅

**Contract:** CORE base template, infrastructure foundation, safe defaults.

**Tests:**
- ✅ **Attachment Engine Tests** (`src/lib/attachment-engine.test.ts`) - CORE pack attachment
- ✅ **Smoke Tests** (`src/smoke/init.smoke.test.ts`) - CORE structure after init

**Acceptance Criteria:**
- ✅ CORE pack attaches correctly
- ✅ Safe defaults compile and run
- ✅ Structure matches CORE contract

---

## Section 4: DX Baseline ✅

**Contract:** Zero-manual-setup DX, `@/` alias, SVG imports, fonts, env pipeline.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/init.smoke.test.ts`) - Project structure validates DX baseline

**Acceptance Criteria:**
- ✅ Alias configuration present
- ✅ SVG/fonts/env structure exists
- ✅ No manual setup required (verified by init smoke tests)

---

## Section 5: Docs Contract Set ✅

**Contract:** Canonical docs set, non-duplicated, single source of truth.

**Tests:**
- ✅ **Manual Validation** - Docs structure verified in codebase
- ✅ **CI Gates** - Lint/typecheck validate docs consistency

**Acceptance Criteria:**
- ✅ Canonical docs exist and are referenced
- ✅ No schema duplication (verified via code review)

---

## Section 6: Template Packs System ✅

**Contract:** Template-pack system, CORE/Plugin/Module packs, consistent structure.

**Tests:**
- ✅ **Attachment Engine Tests** (`src/lib/attachment-engine.test.ts`) - Pack attachment logic

**Acceptance Criteria:**
- ✅ Pack structure is consistent
- ✅ Deterministic selection works
- ✅ Variant resolution works

---

## Section 7: Dynamic Template Attachment Engine ✅

**Contract:** Deterministic pack selection/attachment, target/language variants, repeatable output.

**Tests:**
- ✅ **Attachment Engine Tests** (`src/lib/attachment-engine.test.ts`) - Deterministic selection, merge, conflicts

**Acceptance Criteria:**
- ✅ Same inputs → same output (deterministic)
- ✅ Variant merge logic works
- ✅ Conflict detection works

---

## Section 8: Ownership, Backups, Idempotency ✅

**Contract:** Ownership rules, backups, idempotent operations.

**Tests:**
- ✅ **Attachment Engine Tests** (`src/lib/attachment-engine.test.ts`) - Backup creation, idempotency
- ✅ **Marker Patcher Tests** (`src/lib/marker-patcher.test.ts`) - Idempotent injection
- ✅ **Patch Ops Tests** (`src/lib/patch-ops.test.ts`) - Rollback safety, insert-once
- ✅ **Modulator Tests** (`src/lib/modulator.test.ts`) - Idempotent plan/apply/remove

**Acceptance Criteria:**
- ✅ Backups created before modification
- ✅ Operations are idempotent (rerun = NO-OP)
- ✅ Ownership zones respected

---

## Section 9: Marker Contract ✅

**Contract:** Canonical markers, validation, actionable errors.

**Tests:**
- ✅ **Marker Patcher Tests** (`src/lib/marker-patcher.test.ts`) - Marker validation, error handling
- ✅ **Project Doctor Tests** (`src/lib/project-doctor.test.ts`) - Marker validation

**Acceptance Criteria:**
- ✅ Markers validated before patching
- ✅ Actionable errors when markers missing
- ✅ No duplicate injections

---

## Section 10: Marker Patcher Engine v1 ✅

**Contract:** Safe injection inside markers, no duplicates, stable output, traceability.

**Tests:**
- ✅ **Marker Patcher Tests** (`src/lib/marker-patcher.test.ts`) - Idempotent inject, no duplicates, stable ordering

**Acceptance Criteria:**
- ✅ Injection only inside markers
- ✅ No duplicates (idempotent)
- ✅ Stable ordering maintained
- ✅ Traceability by capability ID

---

## Section 11: Runtime Wiring Engine ✅

**Contract:** AST-only (ts-morph), symbol-based, SYSTEM ZONE only, deterministic ordering.

**Tests:**
- ✅ **Runtime Wiring Tests** (`src/lib/runtime-wiring.test.ts`) - ts-morph symbol-based ops, deterministic output

**Acceptance Criteria:**
- ✅ AST-only operations (no regex)
- ✅ Symbol-based injection
- ✅ SYSTEM ZONE enforcement
- ✅ Deterministic output

---

## Section 12: Patch Operations System ✅

**Contract:** Declarative, idempotent patches for Expo/iOS/Android, anchored edits, rollback-safe.

**Tests:**
- ✅ **Patch Ops Tests** (`src/lib/patch-ops.test.ts`) - Anchored edits, insert-once, rollback-safe

**Acceptance Criteria:**
- ✅ Anchored text edits work
- ✅ Insert-once semantics (idempotent)
- ✅ Backups created (rollback-safe)
- ✅ All patch types supported

---

## Section 13: Project State System ✅

**Contract:** `.rns/rn-init.json` as single source of truth, validation before actions, migration support.

**Tests:**
- ✅ **State System Tests** (`src/lib/manifest.test.ts`) - Schema validation, migrations, invariants

**Acceptance Criteria:**
- ✅ Manifest validated before actions
- ✅ Migration logic works
- ✅ Invariants maintained (no corruption)
- ✅ Read/write operations safe

---

## Section 14: Dependency Layer ✅

**Contract:** PM-aware unified layer, deterministic installs, lockfile discipline, never mix PMs.

**Tests:**
- ✅ **Dependency Layer Tests** (`src/lib/dependencies.test.ts`) - PM detection, lockfile discipline, install operations

**Acceptance Criteria:**
- ✅ PM detection works (manifest-first, then lockfiles)
- ✅ No mixing package managers
- ✅ Lockfile discipline enforced
- ✅ Deterministic installs

---

## Section 15: Modulator Engine v1 ✅

**Contract:** Plan/apply/remove, deterministic planning, stable phases, safe removal (NO-OP if absent).

**Tests:**
- ✅ **Modulator Tests** (`src/lib/modulator.test.ts`) - Plan/apply/remove, phases, reports, no USER ZONE edits

**Acceptance Criteria:**
- ✅ Plan is deterministic (dry-run)
- ✅ Apply uses stable phases
- ✅ Remove is safe (NO-OP if absent)
- ✅ Never touches USER ZONE

---

## Section 16: Permissions Model v1 ✅

**Contract:** Data-driven permissions, PermissionIds → dataset mapping, per-plugin traceability.

**Tests:**
- ✅ **Permissions Model Tests** (`src/lib/permissions.test.ts`) - PermissionIds → dataset mapping → aggregated manifest

**Acceptance Criteria:**
- ✅ PermissionIds resolve to dataset
- ✅ Platform-specific resolution (iOS/Android)
- ✅ Aggregated manifest generation
- ✅ Per-plugin traceability

---

## Section 17: Environment Doctor ✅

**Contract:** Machine preflight, checks required tooling, actionable fixes, blocks destructive commands.

**Tests:**
- ✅ **Environment Doctor Tests** (`src/lib/environment-doctor.test.ts`) - Actionable error messages, failure modes

**Acceptance Criteria:**
- ✅ Checks required tooling
- ✅ Failure modes produce actionable errors
- ✅ Target-specific checks work
- ✅ Blocks destructive commands

---

## Section 18: Project Doctor ✅

**Contract:** Project-level validation, safe fixes in SYSTEM ZONE only, actionable errors.

**Tests:**
- ✅ **Project Doctor Tests** (`src/lib/project-doctor.test.ts`) - Actionable error messages, fix mode safety

**Acceptance Criteria:**
- ✅ Validates manifest, markers, ownership zones
- ✅ Detects duplicate injections
- ✅ Fix mode only touches SYSTEM ZONE
- ✅ Actionable error messages

---

## Section 19: Plugin Framework ✅

**Contract:** Real plugin system, FULL_AUTO, standardized apply pipeline, doctor validation.

**Tests:**
- ✅ **Modulator Tests** (`src/lib/modulator.test.ts`) - Plugin plan/apply/remove
- ✅ **Smoke Tests** (`src/smoke/plugin.smoke.test.ts`) - Plugin add/remove → doctor passes

**Acceptance Criteria:**
- ✅ Plugins install FULL_AUTO (no manual edits)
- ✅ Standardized apply pipeline works
- ✅ Doctor validates plugin installation
- ✅ Plugin registry works

---

## Section 20: Plugin Commands ✅

**Contract:** Plugin command surface, state-driven, respects ownership/backup/idempotency.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/plugin.smoke.test.ts`) - Plugin add → status/doctor → rerun idempotent

**Acceptance Criteria:**
- ✅ Commands are state-driven
- ✅ Respect ownership/backup/idempotency
- ✅ Idempotent operations (rerun = NO-OP)

---

## Section 21: Module Framework ✅

**Contract:** Business module framework, generates feature code, stable registration model.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/module.smoke.test.ts`) - Module add → registered & wired via system zone

**Acceptance Criteria:**
- ✅ Modules generate correctly
- ✅ Registration model works
- ✅ Wired via SYSTEM ZONE only

---

## Section 22: Module Commands ✅

**Contract:** Module list/add/status/doctor commands, automatic attachment/registration.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/module.smoke.test.ts`) - Module add → registered & wired → doctor passes

**Acceptance Criteria:**
- ✅ Commands work correctly
- ✅ Automatic attachment/registration
- ✅ Doctor validates module installation

---

## Summary

**All Sections 1-22 Covered:** ✅

- **Unit/Spec Tests:** 10 test files covering all major engines
- **Integration Smoke Tests:** 3 test files covering init, plugin, and module flows
- **CI Gates:** GitHub Actions workflow blocks regressions
- **Spec Acceptance:** Tests map back to each section's contract

**Acceptance Criteria Met:**
- ✅ All critical engines have test coverage
- ✅ Integration flows tested end-to-end
- ✅ CI gates block regressions
- ✅ Tests validate contracts from sections 1-22

---

---

## Section 24: CI/CD Workflow Generation ✅

**Contract:** CI/CD workflow generation as CORE capability, GitHub Actions templates for Expo and Bare targets.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/cicd-workflows.smoke.test.ts`) - CI/CD workflow generation

**Acceptance Criteria:**
- ✅ Workflows generated for Expo and Bare targets
- ✅ Workflows placed in `.github/workflows/`
- ✅ Templates stored in `templates/base/.github/workflows/`
- ✅ Idempotent (regenerating doesn't duplicate)

---

## Section 25: Component Generation ✅

**Contract:** Component generation capability (`rns component add <component-name>`).

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/component.smoke.test.ts`) - Component generation

**Acceptance Criteria:**
- ✅ Components generated in USER ZONE
- ✅ Adapts to installed UI framework plugin if available
- ✅ Generates generic components otherwise

---

## Section 26: Bare Init React Navigation Presets ✅

**Contract:** Bare init includes React Navigation by default with preset selection.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/init.smoke.test.ts`) - Bare init with navigation presets

**Acceptance Criteria:**
- ✅ Navigation presets available (stack-only, tabs-only, stack-tabs, stack-tabs-modals, drawer)
- ✅ Preset stored in manifest
- ✅ Navigation structure matches selected preset

---

## Section 27: Navigation Registry ✅

**Contract:** Registry-based system for user screens from User Zone.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/init.smoke.test.ts`) - Navigation registry generation

**Acceptance Criteria:**
- ✅ Registry file generated at `src/app/navigation/registry.ts`
- ✅ System Zone reads from registry
- ✅ Falls back to placeholder screens if registry missing

---

## Section 30: Expanded Init Options ✅

**Contract:** Comprehensive option selection for Expo-specific, Bare-specific, and common options.

**Tests:**
- ✅ **Smoke Tests** (`src/smoke/init.smoke.test.ts`) - Init with various options

**Acceptance Criteria:**
- ✅ All Expo-specific options available for Expo target
- ✅ All Bare-specific options available for Bare target
- ✅ Common options available for both targets
- ✅ Target-aware filtering (Expo-only hidden for Bare, Bare-only hidden for Expo)
- ✅ Selected options stored in manifest

---

**Last Updated:** 2026-01-20  
**Status:** Sections 1-30 Spec Acceptance Assertions Complete
