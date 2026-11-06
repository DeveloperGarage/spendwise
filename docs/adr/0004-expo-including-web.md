# 0004. Expo, including web, is the beta client

Status: Accepted
Date: 2026-11-07

## Context

The group will use Android day to day. iPhone users still have to join, add expenses, read balances, and record settlements for the whole trip. A native iOS build depends on an Apple developer account and TestFlight, which may not be ready. A second, thinner web app would be a second product to keep in step with the money rules.

The app is forms, lists, and balances. It does not need a custom rendering engine to feel right.

## Decision

The client is one Expo app, with Expo Router and TypeScript.

- Android ships as an internal build.
- iPhone users use the web build in Safari.
- A native iOS build can ship from the same project. The trip does not wait for it.
- Every Phase 1 screen uses libraries that work on web as well as on native.

The web build is the iPhone product for the beta, not a reduced admin site.

## Consequences

- A native-only module cannot sit on the path of a Phase 1 screen. If a later feature is Android-only, such as reading SMS, the screen says so.
- Safari is part of the Phase 1 test: join, add an expense, read a balance, record a settlement.
- Flutter is not the client. Reopening that choice means a new record, because the web build and the shared domain package in [0006](0006-shared-domain-package.md) assume a TypeScript client.
- Add to Home Screen instructions belong in the trip runbook, written against the build the group will actually open.
