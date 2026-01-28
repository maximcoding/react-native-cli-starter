<!--
FILE: docs/ALIGNMENT.md
PURPOSE: Architectural decisions and alignment summary for CliMobile (RNS).
         Key decisions made during plugin catalog alignment (Dec 2024).
OWNERSHIP: CLI
-->

# Alignment & Architectural Decisions

This document summarizes key architectural decisions made during plugin catalog alignment. All tasks are complete; this serves as a reference for decisions.

---

## Key Decisions Summary

### CORE vs Plugin Decisions

**State Management (Zustand):**
- ✅ **Plugin** (not CORE) - State management is a developer choice, not universal infrastructure

**CI/CD Workflows:**
- ✅ **CORE** - GitHub Actions templates always generated (implemented in TODO Section 24)

**Theme System & Splash Screen:**
- ✅ **CORE** - Theme system (dark/light) and splash screen are CORE features

**Feature Flags & Code Quality:**
- ✅ **CORE** - Feature flags registry (extendable), Prettier, Husky, ESLint are CORE DX baseline

### Plugin Naming Conventions

**Transport Category:**
- ✅ Use `transport.*` prefix (not `adapter.*`)
- ✅ Canonical plugins: `transport.axios`, `transport.fetch`, `transport.graphql`, `transport.websocket`, `transport.firebase`
- ✅ Use full names (`transport.websocket`, not `transport.ws`)

**Navigation:**
- ✅ Keep specific library names: `nav.react-navigation`, `nav.expo-router`
- ✅ `nav.core` (deprecated) = `nav.react-navigation`

**State Management:**
- ✅ Keep specific library names: `state.zustand`, `state.xstate`, `state.mobx`
- ✅ **NO Redux** - Zustand is sufficient

### Dependency Injection Pattern

**Decision:** ✅ **No DI/IoC container needed**
- Current patterns sufficient: Setter pattern, Registry pattern, Service layer, Provider composition, Contract/Interface pattern
- React Native apps don't require complex DI containers

### Plugin Catalog Additions

**New Categories Added:**
- ✅ **Search**: `search.algolia`, `search.local-index`
- ✅ **Subscriptions/IAP**: `iap.revenuecat`, `iap.adapty`, `iap.app-store`, `iap.play-billing` (single slot)
- ✅ **OTA Updates**: `ota.expo-updates`, `ota.code-push` (single slot, target-aware)
- ✅ **Background Tasks**: `background.tasks`, `background.geofencing`, `background.fetch`
- ✅ **Privacy & Consent**: `privacy.att`, `privacy.consent`, `privacy.gdpr`
- ✅ **Device/Hardware**: `device.biometrics`, `device.bluetooth`
- ✅ **Testing**: `test.detox`
- ✅ **Animations**: `animation.reanimated`, `animation.lottie`

**AWS & Firebase Products:**
- ✅ **Hybrid approach**: Keep generic plugins (`auth.cognito`, `transport.firebase`) AND add product-specific plugins
- ✅ **AWS**: `aws.amplify`, `aws.appsync`, `aws.dynamodb`, `aws.s3`
- ✅ **Firebase**: `firebase.firestore`, `firebase.realtime-database`, `firebase.storage`, `firebase.remote-config`

**Component Generation:**
- ✅ **Dual approach**: UI framework plugins provide framework-specific components + `rns component add <name>` command for generic components
- ✅ Manual component creation always available (USER ZONE)

### CORE Capabilities Matrix

**Final CORE Capabilities (16 total):**
1. Workspace packages (`packages/@rns/**`)
2. Runtime utilities (`@rns/runtime`)
3. Kernel contracts (`@rns/core`)
4. Ownership zones
5. Manifest (`.rns/rn-init.json`)
6. Doctor (`doctor --env`, `doctor`)
7. DX baseline (alias/SVG/fonts/env)
8. CI/CD Workflows (GitHub Actions templates)
9. Theme System (dark/light)
10. Splash Screen
11. Feature Flags Registry (extendable)
12. Code Quality Tools (Prettier, Husky, ESLint)
13. Navigation Infrastructure (bootstrap routing)
14. Cache Engine (contract + in-memory default)
15. UI Components (App.tsx structure)
16. Development Scripts

---

## Task Completion Status

**All 11 tasks completed:**
- ✅ TASK 1: Zustand CORE vs Plugin decision
- ✅ TASK 2: CI/CD CORE vs Plugin decision
- ✅ TASK 3: DI pattern investigation
- ✅ TASK 4: Plugin naming convention alignment
- ✅ TASK 5: Missing plugin IDs evaluation
- ✅ TASK 6: Missing categories evaluation
- ✅ TASK 7: Update deprecated README
- ✅ TASK 8: Update current README
- ✅ TASK 9: Align CORE capabilities matrix
- ✅ TASK 10: Document reference plugin rule
- ✅ TASK 11: AWS/Firebase product-specific plugins & component generation

---

## Reference

**Canonical Documentation:**
- `docs/README.md` - Complete plugin catalog and CORE matrix
- `docs/cli-interface-and-types.md` - Canonical type definitions
- `docs/plugins-permissions.md` - Permissions catalog

**Decision Date:** 2024-12-19  
**Status:** All alignment tasks completed. Plugin catalog fully aligned with decisions.
