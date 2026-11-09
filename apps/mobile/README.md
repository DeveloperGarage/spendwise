# Spendwise mobile (`apps/mobile`)

The Phase 1 Expo client is a **web PWA**. Anyone with a browser can use it; Add to
Home Screen is how it sits on a phone (see [`../../docs/adr/0004-expo-including-web.md`](../../docs/adr/0004-expo-including-web.md)).
In production the web export is static assets on the same Cloudflare Worker as the API
([`../../docs/adr/0008-cloudflare-and-supabase.md`](../../docs/adr/0008-cloudflare-and-supabase.md)). There is no Phase 1 APK or TestFlight build.

Stack and rationale: [`../../docs/adr/0007-frontend-stack.md`](../../docs/adr/0007-frontend-stack.md).
Expo Router, NativeWind, TanStack Query, Zustand, React Hook Form + Zod, Jest.

## Prerequisites

- Node.js 20+ (built on v22) and npm.
- No local Xcode or Android Studio needed for web. For a native dev build you need the
  platform toolchain, or use [EAS Build](https://docs.expo.dev/eas/).
- Optional: the **Expo Go** app on your phone to open the dev server over LAN.

## Initial setup

```bash
cd apps/mobile
npm install
```

Always add packages with `npx expo install <package>` (not `npm/yarn add`) so versions
match the Expo SDK. Fix mismatches with `npx expo install --fix`; diagnose with
`npx expo-doctor`.

## Running

```bash
npm run web       # browser, http://localhost:8081  (Phase 1 path)
npm run android   # Android emulator or connected device
npm run ios       # iOS simulator (macOS only)
npm start         # interactive: pick a target, show QR for Expo Go
```

> After adding any library with native code, Expo Go is no longer enough — build a dev
> client with `npx expo run:android` / `npx expo run:ios` or `eas build --profile development`.
> The libraries in this project (NativeWind, TanStack Query, Zustand, RHF, Zod) are
> JS-only, so Expo Go and the web build work as-is.

## Testing, lint, typecheck

```bash
npx jest --watchman=false   # unit tests (see note below)
npx expo lint               # lint
npx tsc --noEmit            # typecheck
```

Run lint and typecheck before marking any task done.

### Watchman note

This machine's Watchman is broken (an unrelated Homebrew `libfmt` issue), which makes
Jest hang. Pass `--watchman=false` to Jest, or set `WATCHMAN_DISABLE=1` for the Metro
dev server. Fix the root cause with `brew reinstall watchman` when convenient.

## Project layout

```
src/app/          Expo Router screens; every file is a route, _layout.tsx defines navigators
src/components/    Reusable UI (keep out of src/app/)
src/lib/           Non-UI helpers, e.g. the TanStack Query client
src/stores/        Zustand stores — UI-only state, never server data
src/global.css     Tailwind/NativeWind entry (directives + CSS vars)
```

Config files: `babel.config.js`, `metro.config.js` (NativeWind), `tailwind.config.js`,
`jest.config.js` (`jest-expo` preset), `app.json` (Expo config).

Native folders `ios/` and `android/` are generated (Continuous Native Generation) — do
not create or edit them by hand; configure native behaviour in `app.json`.

## Verify the setup

A clean checkout should pass all three:

```bash
npm install
npx jest --watchman=false   # placeholder test green
npx expo export -p web      # Metro + NativeWind build succeeds
npm run web                 # serves http://localhost:8081
```
