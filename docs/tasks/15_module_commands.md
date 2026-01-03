<!--
FILE: docs/tasks/15_module_commands.md
PURPOSE: CLI commands for modules (list/add/status/doctor), aligned with Option A isolation and standard module pipeline.
OWNERSHIP: CLI
-->

# 15) Module Commands — Task List (Option A: Isolated)

## 15.1 `rns module list`
- [ ] Lists all available modules from module registry (id + title + short description).
- [ ] Supports output formats:
  - [ ] default pretty table (human)
  - [ ] `--json` stable machine output
- [ ] Output order is stable (sorted by id).

## 15.2 `rns module add [ids...]`
- [ ] Preconditions:
  - [ ] refuses if `.rn-init.json` missing/invalid
  - [ ] validates marker contract (host wiring points exist)
- [ ] If ids are provided: generate them in the given order.
- [ ] If no ids: interactive checkbox selection from registry.
- [ ] Supports module wizards when required (selection-first UX).
- [ ] Uses the standard module generation pipeline:
  - [ ] resolve module pack variant
  - [ ] attach module pack into CLI-owned isolated location (Option A)
  - [ ] wire minimal glue into host app via markers/registry only
  - [ ] update state with module record + options + owned files
  - [ ] run post-generate validation
- [ ] Produces a clear per-module summary:
  - [ ] generated / skipped (already present) / failed (actionable reason)

## 15.3 `rns module status`
- [ ] Shows installed modules from `.rn-init.json` vs available modules from registry.
- [ ] Clearly indicates:
  - [ ] installed & known
  - [ ] installed but missing in registry (warn)
  - [ ] available but not installed
- [ ] Supports `--json`.

## 15.4 `rns module doctor`
- [ ] Validates:
  - [ ] `.rn-init.json` exists and is valid
  - [ ] marker contract is valid
  - [ ] required plugin dependencies for installed modules are present (based on `requires`)
  - [ ] module registry entry exists for each installed module (warn if missing)
  - [ ] module-owned files exist (based on state ownership list)
  - [ ] host registry wiring exists (no missing imports/entries, best-effort)
- [ ] Prints only actionable results (what is missing + what command fixes it).
- [ ] Supports `--json`.
- [ ] Exit codes:
  - [ ] `0` clean
  - [ ] `2` validation/state failure (align with global exit codes)

## 15.5 CLI UX requirements
- [ ] Non-interactive mode:
  - [ ] `--yes` installs defaults for wizards (if wizard supports defaults)
  - [ ] if wizard cannot be defaulted safely: fail actionable (what flags/options are required)
- [ ] Supports `--dry-run`:
  - [ ] prints plan (packs to attach + wiring + deps) without writing/installing
  - [ ] returns success unless plan has conflicts/invalid state

## 15.6 Acceptance
- [ ] `module list` works in dev and built modes.
- [ ] `module add` generates at least one module end-to-end using Option A isolation and updates state.
- [ ] `module status` reflects installed modules correctly.
- [ ] `module doctor` reports clean state after init + required plugins + module add.
