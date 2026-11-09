# 0004. The beta client is an Expo web PWA

Status: Accepted
Date: 2026-11-07
Amended: 2026-11-09 (Phase 1 is web-only, installed as a PWA)

## Context

The group will use phones and laptops on one trip. A native Android APK and a native iOS build each add a store, a signing pipeline, and a second install path. A second, thinner web app would be a second product to keep in step with the money rules.

The app is forms, lists, and balances. It does not need a custom rendering engine or a store listing to feel right for the beta.

## Decision

The Phase 1 client is the Expo web build, served as a progressive web app from the same Cloudflare Worker as the API ([0008](0008-cloudflare-and-supabase.md)).

- Anyone with a browser can open the origin: phone, tablet, or laptop.
- Add to Home Screen is how it sits on a phone. Chrome and Edge can prompt; Safari uses Share → Add to Home Screen. Instructions belong in the trip runbook.
- The web app manifest (name, icons, `display: standalone`) is part of the export. A service worker may cache the shell. It does not make offline expense entry: saves still require the network, as in [0005](0005-server-is-the-only-writer.md).
- Every Phase 1 screen uses libraries that work on web.
- Native Android and native iOS can still ship later from the same Expo project. The trip does not wait for them.

The PWA is the product for the beta, not a reduced admin site.

## Consequences

- A native-only module cannot sit on the path of a Phase 1 screen. If a later feature is Android-only, such as reading SMS, it waits for a native build or an honest "not in the web app" label.
- The Phase 1 test is the PWA in a mobile browser and as an installed home-screen app: join, add an expense, read a balance, record a settlement.
- Flutter is not the client. Reopening that choice means a new record, because the web build and the shared domain package in [0006](0006-shared-domain-package.md) assume a TypeScript client.
- There is no Phase 1 APK, TestFlight build, or public store listing.
