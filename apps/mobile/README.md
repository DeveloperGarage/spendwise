# Spendwise mobile (`apps/mobile`)

The Phase 1 Expo client is a **web PWA**. Anyone with a browser can use it; Add to
Home Screen is how it sits on a phone (see [`../../docs/adr/0004-expo-including-web.md`](../../docs/adr/0004-expo-including-web.md)).
In production the web export is static assets on the same Cloudflare Worker as the API
([`../../docs/adr/0008-cloudflare-and-supabase.md`](../../docs/adr/0008-cloudflare-and-supabase.md)). There is no Phase 1 APK or TestFlight build.

Stack and rationale: [`../../docs/adr/0007-frontend-stack.md`](../../docs/adr/0007-frontend-stack.md).
Expo Router, React Native `StyleSheet` + design tokens, TanStack Query, Zustand, React Hook Form + Zod, Jest.

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
> The libraries in this project (TanStack Query, Zustand, RHF, Zod) are
> JS-only, so Expo Go and the web build work as-is.

### Mock mode (MSW, web only)

Run the app without the API or a database:

```bash
npm run web:mock
```

(Shorthand for `EXPO_PUBLIC_USE_MOCKS=true expo start --web`.)

- Handlers live in `mocks/` (outside `src/`). `index.js` starts the worker before
  loading `expo-router/entry`, so app code is untouched.
- Guarded by `__DEV__`, so mocks and `msw` are never in production bundles.
- You start signed in. The session is stored in localStorage under
  `spendwise.mock.session`; delete it to reset.

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
src/app/                Expo Router routes; thin files that re-export a screen.
                        _layout.tsx sets up the Stack navigator and providers
src/screens/<screen>/   Screen component + sibling <screen>.styles.ts
src/components/<name>/  Reusable UI: component + <name>.styles.ts + index.ts barrel
src/constants/theme.ts  Design tokens: Colors (light/dark), Spacing, Radius, Sizes,
                        Opacity, Typography, Fonts
src/hooks/              useTheme, useColorScheme, useBreakpoint
src/lib/                Non-UI helpers, e.g. the TanStack Query client, API, session
src/stores/             Zustand stores — UI-only state, never server data
```

Routes must stay in `src/app/` (Expo Router resolves URLs from that tree), but keep them
to a one-line re-export, e.g. `export { default } from '@/screens/dashboard/dashboard';`.
Screen logic and UI live in `src/screens/`.

Config files: `app.json` (Expo config), `jest.config.js` (`jest-expo` preset),
`eslint.config.js`, `tsconfig.json` (`@/*` → `./src/*`).

## Styling conventions

- Use `StyleSheet` with values from `src/constants/theme.ts`. Don't hard-code colours,
  spacing, radii or font sizes in components.
- Put styles in a sibling `*.styles.ts` that exports a theme-aware factory:

  ```ts
  export const createStyles = (theme: Theme) =>
    StyleSheet.create({ container: { backgroundColor: theme.background, padding: Spacing.lg } });
  ```

- In the component, read the active palette and memoise the styles:

  ```tsx
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  ```

  `useTheme` returns `Colors.light` or `Colors.dark` depending on the system colour
  scheme, so dark mode works without per-component checks.
- For nested rounded shapes, set inner radius = outer radius − padding so the corners
  stay concentric.

Native folders `ios/` and `android/` are generated (Continuous Native Generation) — do
not create or edit them by hand; configure native behaviour in `app.json`.

## Verify the setup

A clean checkout should pass all three:

```bash
npm install
npx jest --watchman=false   # placeholder test green
npx expo export -p web      # Metro web build succeeds
npm run web                 # serves http://localhost:8081
```
