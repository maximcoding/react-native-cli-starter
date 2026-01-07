````md
# React Native Starter CLI — Final Spec (EN)

> **Scope:** Opinionated CLI to scaffold React Native apps with a sane, safe default stack. Minimal questions, strict priorities.  
> **CLI UI language:** **EN by default**. Auto-RU if system locale starts with `ru*`. Override anytime with `--locale en|ru`.  
> **Preflight:** runs **automatically** before/after installs (no “repeat preflight” prompt).  
> **Not in wizard:** Welcome/Onboarding, Theme, UI-Kit customization — these are **features** added later via augment.

---

## Quick Start (non-interactive one-liners)

### Expo + REST + Sentry + OTA (Expo Updates) + TypeScript
```bash
rns init --mode quick --type expo --data online --adapters rest \
  --name ReactNativeStarter --platforms android,ios --pm npm --lang ts --langs en,ru \
  --state zustand --ci on --rq on --rq-persist on --rest-base https://api.example.com \
  --ota expo --analytics sentry --push fcm --auth skip \
  --snapshot --yes --locale en
````

### Bare RN + REST + CodePush + TypeScript (with IDs)

```bash
rns init --mode quick --type bare --data online --adapters rest \
  --name ReactNativeStarter --platforms android,ios --pm npm --lang ts --langs en,ru \
  --appid com.company.reactnativestarter --bundle com.company.reactnativestarter \
  --state zustand --ci on --rq on --rq-persist on --rest-base https://api.example.com \
  --ota codepush --analytics sentry --push fcm --auth skip \
  --snapshot --yes --locale en
```

> Replace `https://api.example.com`, `--appid`, `--bundle` with real values.

---

## Priorities (highest → lowest)

1. **P-2 Auto Environment Setup**
2. **P0 Product Shape** (Expo/Bare; Offline/Online)
3. **P1 Project Identity** (name, platforms, TS/JS)
4. **P2 Universal Basics** (i18n, state, CI)
5. **P3A/B Branch** (Pure Offline vs With Network)
6. **P3D Secrets & Signing**
7. **P4 Review / Diff / Generate** (safe by default)
8. **P5 Finish**
9. **Post-gen (optional):** `rns feature add …`

---

## P-2 · Auto Environment (highest priority)

**Automatic:** Preflight runs **before & after** installs silently.

1. **Project folder** — choose directory; confirm overwrite if it exists.
2. **Existing RN/Expo detected → Augment?** *(default: Yes)*
3. **Allow auto-setup of required toolchain?** *(default: Yes)*

    * Installs/configures: **Node 20 LTS (nvm)**, **OpenJDK 17**, **Android SDK** (cmdline-tools, platforms, build-tools + licenses, PATH), **CocoaPods** (macOS), **Python 3**, **Watchman** (macOS).
    * OS package manager auto-selected (Homebrew / winget / apt / …). Emulator install is skipped by default.

---

## P0 · Product Shape

4. **Wizard mode** — Quick / Advanced *(default: Quick)*
5. **Project type** — Expo (fastest) / Bare RN *(default: Expo)*
6. **Data mode** — **Pure Offline (no network)** / **With Network** *(default: With Network)*
7. **Preset (optional)** — Offline Only · API-Heavy (REST+WS) · Graph Realtime (GQL+Subs) · Skip

---

## P1 · Project Identity

8. **App name** (PascalCase)
9. **Platforms** — Android / iOS *(default: both)*
10. **Project package manager** — npm / pnpm / yarn / bun *(default: npm)*
11. **Language** — **TypeScript (recommended)** / JavaScript *(default: TypeScript)*
12. **Starter preset** — Bare: Standard/Minimal/Full · Expo: Quick/Full
13. *(Bare only)* **Android `applicationId`** (`com.company.app`)
14. *(Bare only)* **iOS `bundleIdentifier`** (`com.company.app`)

---

## P2 · Universal Basics (independent of Offline/Online)

15. **i18n languages** — list of locales *(default: `en, ru`)*
16. **State management** — **Zustand On** / None *(default: On)*
17. **CI now?** — **GitHub Actions On** / Skip *(default: On; caches enabled; optional release lane toggle)*

> **Not in wizard** (handled later via augment): Welcome/Onboarding, Theme, UI-Kit customization.

---

## P3A · Branch: Pure Offline (strictly no network)

18. **Local storage** — **SQLite (recommended)** / MMKV
19. **Seed demo data** — Yes / No *(default: Yes)*
20. **Backup/Export destinations** — multi-select: Save to file · OS Share Sheet · (optional) Local Wi-Fi *(default: File + Share Sheet)*
21. **Backup encryption** — Passphrase / Device key *(default: Passphrase)*
22. **Import/Restore from file** — Yes / No *(default: Yes)*
23. **Local notifications (no push)** — On / Off *(default: Off)*

**Never asked in Offline:** sign-in/OAuth/SMS, push, analytics, payments, AWS, OTA.

---

## P3B · Branch: With Network (online core)

24. **Data adapters (multi)** — **REST**, **GraphQL**, **Firebase**, **WebSockets** *(default: REST)*
25. **REST** — Base URL (`https://api.example.com`)
26. **GraphQL** — Client (**Apollo**/urql) + Endpoint *(default: Apollo)*
27. **WebSockets** — Socket.IO / native WS + WS URL
28. **Firebase** — Modules (multi): Auth, Firestore/RTDB, Storage, Messaging, Remote Config, Analytics
29. **TanStack Query** — On / Off *(default: On)*
30. **Persist Query cache (MMKV)** — On / Off *(default: On)*

### AWS (no “Amplify?” prompt)

31. **AWS endpoints already?** Yes / No

* **Yes** → provide **AppSync URL+region** and/or **API Gateway Base URL**
* **No** → **Create minimal backend now?** Yes / No *(default: No)*

    * If **Yes** → choose: **AppSync + Cognito + DynamoDB** **or** **API Gateway + Lambda + DynamoDB**; region/profile/env

### Access & Security (online only)

32. **Sign-in now?** — Skip / Email+Password / OAuth (Google, Apple) / Phone (SMS) *(default: Skip)*
33. **If OAuth** — providers (Google, Apple; opt: Facebook/GitHub/LinkedIn) + deep-link scheme (e.g., `myapp://auth`)
34. **If SMS** — purpose (Sign-in / MFA / Verify) + provider (Firebase / Twilio / Auth0 / AWS SNS / MessageBird)
35. **Authorization model** — **RBAC** / Scopes / ABAC *(default: RBAC)*
36. **Policy location** — Local / Backend *(default: Local)*
37. **When forbidden** — **Hide** / Disable / Redirect *(default: Hide)*

### Online Extras (secondary)

38. **OTA** — **CodePush (Bare)** / **Expo Updates (Expo)** / None *(default: On)*
39. **Analytics & crash** — **Sentry** / Firebase / Segment / Mixpanel / Datadog *(default: Sentry)*
40. **Push & links** — **FCM** / OneSignal / Branch / AppsFlyer / Dynamic Links *(default: FCM)*
41. **Payments** — Stripe / RevenueCat / Adapty *(default: Off)*
42. **AI (LLM)** — Off / On (providers & tasks; e.g., OpenAI) *(default: Off)*
43. **ML (TensorFlow)** — Off / On (TFLite / TF.js / Server) *(default: Off)*

---

## P3D · Secrets & Signing (when relevant)

44. **Generate `.env.example` + CI secret names?** *(default: Yes)*
45. **Collect secrets now?** *(default: Skip; can add later)*
46. **Android keystore create & encrypt?** *(default: No)*
47. **iOS signing checklist + CI hints?** *(default: Yes)*

---

## P4 · Review / Diff / Generate (safe by default)

48. **Environment summary** (versions/installs) → Continue
49. **Diff preview** (files & JSON patches) → Proceed
50. **Dry-run first?** *(default: No)*
51. **Create rollback snapshot before writing?** *(default: Yes)*
52. **Save as named preset?** *(optional)*

---

## P5 · Finish

53. **Initialize git?** *(default: Yes)*
54. **Install CORE dependencies?** *(default: No)*
55. **(macOS+iOS) Run `pod install` now?** *(default: Yes)*
56. **Show “What’s next” checklist?** *(default: Yes)*
57. **Copy non-interactive command (all flags)?** *(default: Yes)*
58. **Write `GENERATE_LOG.md` (steps/flags/results)?** *(default: Yes)*

---

## Built-ins & Guardrails

* **Auto preflight** before/after installs; no “repeat preflight” prompt.
* **Augment mode** for existing RN/Expo (non-destructive).
* **Validation**: package IDs, URLs, WS URLs, deep-links.
* **Guardrails**: early warnings for incompatible picks (e.g., Expo + native-only lib).
* **Safety**: Diff preview, Dry-run, Rollback snapshot.
* **Networking defaults**: timeouts, Bearer+refresh interceptors, dev logging, friendly error mapping.
* **CLI UI language**: EN default; auto-RU by `ru*` locale; `--locale en|ru` to override.

---

## CLI Commands

* `rns init` — main wizard (Quick/Advanced; auto-setup env first)
* `rns env setup` — environment setup only
* `rns doctor` — preflight diagnostics
* `rns diff` — show generation plan diff
* `rns apply --preset ./preset.json` — non-interactive generation
* `rns rollback [snapshot]` — rollback to snapshot
* `rns preset save|load` — manage presets
* *(Post-gen)* `rns feature add users|books|…` — optional features later

---

## Core Flags (non-interactive)

* **Shape:** `--mode quick|advanced --type expo|bare --data offline|online --adapters rest,graphql,firebase,ws --lang ts|js`
* **Identity:** `--name App --platforms android,ios --pm npm --appid com.company.app --bundle com.company.app`
* **Basics:** `--langs en,ru --state zustand --ci on`
* **Offline:** `--store sqlite|mmkv --seed on --backup file,share,wifi --backup-encrypt passphrase|device --restore on`
* **Online:** `--rq on --rq-persist on --rest-base <url> --gql client=apollo endpoint=<url> --ws client=socketio url=<ws> --fb modules=auth,firestore`
* **AWS:** `--aws have|provision --backend appsync|apigw --region <id> --profile <name> --apigw-base <url> --appsync-url <url>`
* **Access:** `--auth skip|email|oauth|sms --oauth google,apple --deeplink myapp://auth --sms role=signin provider=firebase --authz rbac source=local forbidden=hide`
* **Extras:** `--ota codepush|expo|none --analytics sentry --push fcm --payments stripe --ai off|on:openai --ml off|on:tflite`
* **Safety:** `--dry-run --snapshot --yes`
* **Locale:** `--locale en|ru`

---

## Defaults (summary)

* **TypeScript**, **Expo**, **With Network**, **REST**, **Zustand On**, **TanStack Query On + Persist**, **Sentry On**, **OTA On**, **CI On**, **i18n: `en, ru`**.
* **Pure Offline**: SQLite + Seed + Backup(File+Share) + Import On; **no** login/push/analytics/payments/AWS/OTA prompts.

---

## Post-gen Features (intentionally later)

Add features after the base app is generated:

```bash
rns feature add users
rns feature add books
```

## rns add adapters: rest, graphql, websocket, firebase (adds adapter and tanquery)
## rns add analytics: sentry, firebase, mixpanel ( based on existing adapters inside the app)

## rns add storage: mmkv, sqlite (adds local storage)
## rns add auth: email, oauth, sms

