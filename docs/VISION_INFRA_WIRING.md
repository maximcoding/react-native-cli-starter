# Vision: Deps + Real Infra + Wiring — File Structures

This doc describes **how the outcome will look**: generated app layout and CLI layout after Phase A (real infra + wiring). Use it together with the plan "Deps + real infra + wiring".

---

## 1. Generated app (after `rns init` with options selected)

Example: user selects **State (Zustand)**, **Data (React Query)**, **Storage (MMKV)**, **Offline (NetInfo)**. Target is **Bare**, language **TS**.

### 1.1 User Zone (`src/`)

All capability code lives under `src/` so the developer owns it. One top-level folder per category; inside: subcategory (e.g. mmkv), then services/hooks and a re-export file.

```
MyApp/
  src/
    state/                          # State management (Section 51)
      zustand/
        zustand.ts                  # Store factory, createPersistedStore, etc.
        stores/
          session.ts
          settings.ts
          ui.ts
      zustand.ts                    # Re-export: stores, factory

    data/                           # Data fetching (Section 52)
      react-query/
        client.ts                   # QueryClient, defaultOptions
        hooks/
          useQueryExample.ts
      react-query.ts                # Re-export: client, hooks

    storage/                        # Storage (Section 56) — real infra, not stub
      mmkv/
        storage.ts                  # KeyValueStorage impl (from reference)
        hooks/
          useStorage.ts
      mmkv.ts                       # Re-export: storage, useStorage

    offline/                        # Offline (Section 58)
      netinfo/
        useNetworkStatus.ts
        context.tsx                 # NetworkInfoProvider
      netinfo.ts                   # Re-export

    transport/                      # Transport (Section 53)
      axios/
        client.ts
        interceptors.ts
      axios.ts

    auth/                           # Auth (Section 54)
      firebase/
        ...
```

So: **one category folder** (`src/storage/`), **one subfolder per selected option** (`mmkv/`), **real files** (storage.ts, hooks, re-export) — no single "Implement your logic here" stub.

### 1.2 System Zone (`packages/@rns/`) — wiring

Runtime composition and **provider wiring** live in System Zone. The CLI only edits files under `packages/@rns/**`.

```
MyApp/
  packages/
    @rns/
      runtime/
        index.tsx                   # Root provider; markers here
        core-init.ts                # Init steps (e.g. I18n)
      core/
        i18n/
        theme/
        contracts/
      navigation/
```

**Runtime file with wiring (concept):**

```tsx
// packages/@rns/runtime/index.tsx (simplified)

// @rns-marker:imports:start
// Plugin imports will be injected here
import { QueryClientProvider } from '@/data/react-query/client';  // injected when React Query selected
import { NetworkInfoProvider } from '@/offline/netinfo/context'; // injected when Offline NetInfo selected
// @rns-marker:imports:end

export function RnsApp({ children }) {
  return (
    <>
      {/* @rns-marker:providers:start */}
      <QueryClientProvider client={queryClient}>   {/* injected */}
        <NetworkInfoProvider>                       {/* injected */}
          {children}
        </NetworkInfoProvider>
      </QueryClientProvider>
      {/* @rns-marker:providers:end */}
    </>
  );
}
```

So: **same markers** as today; **content inside markers** is added by the init wiring step (via `wireRuntimeContributions`) when the user selects React Query, Offline NetInfo, etc. No manual paste.

### 1.3 Summary: generated app

| Zone       | Path                | Purpose                                      |
|-----------|----------------------|----------------------------------------------|
| User      | `src/state/`         | State (Zustand, XState, MobX)                |
| User      | `src/data/`          | Data fetching (React Query, Apollo, SWR)     |
| User      | `src/storage/`       | Storage (MMKV, SQLite, secure, filesystem)    |
| User      | `src/offline/`       | Offline (NetInfo, outbox, sync)              |
| User      | `src/firebase/`      | Firebase products                            |
| User      | `src/transport/`      | Transport (Axios, WebSocket, Firebase)        |
| User      | `src/auth/`          | Auth                                         |
| System    | `packages/@rns/runtime/` | Composition + **provider wiring** (markers) |

---

## 2. CLI repo (after Phase A)

Init keeps one entrypoint (`runInit`) and delegates to **install deps** → **generate infra** → **wiring**.

### 2.1 Init modules (generators)

Existing layout; remaining-phase2 gains **real generators** instead of one stub per category.

```
src/lib/init/
  index.ts                 # Orchestration: collectInputs → hostApp → … → installDeps
                            # → generateStateManagementInfrastructure
                            # → generateDataFetchingInfrastructure
                            # → generateTransportInfrastructure
                            # → generateAuthInfrastructure
                            # → generateRemainingPhase2Infrastructure
                            # → wireInitCapabilities   (NEW)
  install-dependencies.ts  # Phase 1: deps only
  state/
    index.ts
    zustand.ts             # Real: stores, factory, MMKV integration
    xstate.ts
    mobx.ts
  data-fetching/
    index.ts
    react-query.ts         # Real: client, hooks, re-export
    apollo.ts
    swr.ts
  transport/
    ...
  auth/
    ...
  remaining-phase2/
    index.ts               # Dispatches to per-category generators (no longer stub-only)
    storage.ts             # NEW: generateStorageInfrastructure (mmkv, sqlite, secure, filesystem)
    firebase.ts            # NEW: generateFirebaseProductsInfrastructure
    offline.ts             # NEW: generateOfflineInfrastructure + wiring for NetworkInfoProvider
    notifications.ts       # NEW: generateNotificationsInfrastructure
    maps.ts
    media.ts
    payments.ts
    iap.ts
    analytics.ts
    search.ts
    ota.ts
    background.ts
    privacy.ts
    device.ts
    testing.ts
  wiring.ts                # NEW: buildWiringOpsFromInputs(inputs) → RuntimeWiringOp[]
                            #       call wireRuntimeContributions(appRoot, ops, false)
  utils-helpers.ts
  ...
```

So: **one init module per capability category** (or a few grouped in `remaining-phase2/`). Each generator writes **real files** under `appRoot/src/<category>/` per TODO. **Wiring** is a single new step that builds `RuntimeWiringOp[]` from `InitInputs` and calls existing `wireRuntimeContributions`.

### 2.2 Wiring step (concept)

- **Input:** `InitInputs` (selectedOptions: state, dataFetching, storage, offline, …).
- **Logic:** For each option that needs a **provider** (e.g. React Query, Apollo, SWR, Offline NetInfo), push a `RuntimeWiringOp` (provider + import) targeting `packages/@rns/runtime/index.tsx` and markers `providers` / `imports`.
- **Output:** Call `wireRuntimeContributions(appRoot, wiringOps, false)` after all Phase 2 generators.

So: **no new “wiring engine”** — reuse [runtime-wiring.ts](src/lib/runtime-wiring.ts) and [markers.ts](src/lib/markers.ts).

### 2.3 Summary: CLI layout

| Area            | Path                          | Purpose                                      |
|-----------------|-------------------------------|----------------------------------------------|
| Phase 1         | `init/install-dependencies.ts`| Install deps for selected options            |
| Phase 2 (real) | `init/state/`, `data-fetching/`, `transport/`, `auth/` | Already real generators              |
| Phase 2 (real) | `init/remaining-phase2/*.ts`  | Real generators for 55–70 (storage, firebase, offline, …) |
| Wiring          | `init/wiring.ts` + `runtime-wiring.ts` | Build ops from inputs, inject providers in System Zone |

---

## 3. Concrete example: Storage (MMKV) before vs after

### 3.1 Before (current stub)

- **Generated:** One file only:
  - `src/storage/mmkv/mmkv.ts` with content like:
    - `// Storage mmkv configuration and utilities`
    - `// Implement your storage mmkv logic here`
- **Wiring:** None. No provider needed for MMKV, but also no real API (no KeyValueStorage, no hook).

### 3.2 After (real infra)

- **Generated:**
  - `src/storage/mmkv/storage.ts` — real implementation (e.g. from [deprecated_docs/generated_project_reference/src/infra/storage/mmkv.ts](deprecated_docs/generated_project_reference/src/infra/storage/mmkv.ts): `KeyValueStorage` interface, MMKV-backed impl).
  - `src/storage/mmkv/hooks/useStorage.ts` — React hook (get/set/remove using that storage).
  - `src/storage/mmkv.ts` — re-exports: `export { storage, useStorage } from './mmkv/storage'` (and hook).
- **Wiring:** None for MMKV (no provider). Zustand persistence already uses this storage if both state.zustand and storage.mmkv are selected.
- **Deps:** Already installed in Phase 1 (`react-native-mmkv`, `react-native-nitro-modules` per reference versions).

So the **file structure** the user sees is:

```
src/storage/
  mmkv/
    storage.ts
    hooks/
      useStorage.ts
  mmkv.ts
```

---

## 4. Flow diagram (high level)

```mermaid
flowchart LR
  subgraph init [Init pipeline]
    A[collectInputs]
    B[createHostApp]
    C[installDependencies]
    D[generateState]
    E[generateDataFetching]
    F[generateTransport]
    G[generateAuth]
    H[generateRemainingPhase2]
    I[wireInitCapabilities]
  end
  subgraph generated [Generated app]
    J[src/state, data, storage, ...]
    K[packages/@rns/runtime]
  end
  A --> B --> C --> D --> E --> F --> G --> H --> I
  D --> J
  E --> J
  F --> J
  G --> J
  H --> J
  I --> K
```

---

## 5. What you can tell stakeholders

- **Generated app:** One folder per capability under `src/` (state, data, storage, offline, firebase, …), each with **real** modules and re-exports; providers are **injected in System Zone** (`packages/@rns/runtime`) so the app runs with those capabilities without manual glue.
- **CLI:** Init runs **deps** (Phase 1) then **real infra** (Phase 2) then **wiring**; Phase 2 is implemented per TODO (sections 51–70), including replacing stubs in remaining-phase2 with real generators and adding a single wiring step that reuses the existing runtime-wiring engine.
