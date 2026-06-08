# VitPOS Mobile Shell

Capacitor Android shell wrapping the root web build (`../../dist`).

## Architecture

```
┌────────────────────────────────────┐
│  apps/mobile/                      │
│  ├─ capacitor.config.ts            │
│  │  └─ webDir: ../../dist          │
│  └─ android/ (generated)           │
│                                     │
│          ↓ wraps                    │
│                                     │
│  dist/                              │
│  └─ index.html (Vite build output) │
└────────────────────────────────────┘
```

## Requirements

### For basic checks (no Android SDK needed):
- Node.js
- Root web build exists (`../../dist/`)

### For Android build/run:
- Android Studio
- Android SDK
- Java JDK 17+

## Setup

### 1. Build web first

```bash
cd ../..  # to project root
npm run build
```

This creates `dist/` with the compiled web app.

### 2. Run mobile check

```bash
cd apps/mobile
npm run check
```

This validates:
- `capacitor.config.ts` is valid
- Root web build exists at `../../dist/index.html`

**No Android SDK required for this step.**

### 3. Initialize Android platform (requires SDK)

```bash
npx cap add android
```

This generates `apps/mobile/android/` with native project.

**Only run when you have Android Studio installed.**

### 4. Sync and open

```bash
npm run sync           # Copy web assets to native shell
npm run open:android   # Open in Android Studio
```

## Scripts

| Script | Purpose | Requires SDK |
|--------|---------|--------------|
| `npm run check` | Validate config + web build exists | ❌ No |
| `npm run check:config` | Validate capacitor.config.ts | ❌ No |
| `npm run check:web-build` | Check ../../dist exists | ❌ No |
| `npm run sync` | Sync web build to android/ | ✅ Yes |
| `npm run open:android` | Open Android Studio | ✅ Yes |
| `npm run build:android` | Check + sync + copy to android | ✅ Yes |

## appId

`com.kotacom.vitpos` (shared with root config)

## SQLite Adapter Plan

Future work (Engine C):

1. Add `@capacitor-community/sqlite` plugin
2. Create adapter seam:
   - `src/services/local-db/adapters/indexeddb.adapter.ts` (web)
   - `src/services/local-db/adapters/sqlite.adapter.ts` (mobile)
3. Runtime detection switches adapter based on platform
4. Keep Dexie types as contract interface

See: `../../docs/architecture/android-shell.md`

## Verification

From project root:

```bash
npm run mobile:check
```

This runs `apps/mobile` check script to validate scaffold integrity.

## Notes

- Web build (`dist/`) is source of truth
- Mobile shell is thin wrapper
- No web code lives in `apps/mobile/`
- All business logic stays in `src/`
- Android folder only generated when SDK present
- Scaffold safe without native tooling
