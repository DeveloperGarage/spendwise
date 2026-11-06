# 0006. One package owns the money math

Status: Accepted
Date: 2026-11-07

## Context

The expense screen shows each person's share before the save. The server checks those shares again before it commits. If those are two implementations, they will diverge by a paisa, by a tie-break, or by an exact-mode rule that only one side still enforces.

The client is TypeScript. The API is TypeScript. The math has no need of a database or a phone.

## Decision

`packages/domain` holds the pure functions: rupee parsing, the four split modes, balance calculation, the settle-up suggestion, and the zero-sum assertion. It performs no I/O and imports nothing from Expo or the API.

The Expo app calls it for the preview. The API calls it inside the write transaction. Refusals, such as an exact split that does not add up, are returned as data with the gap. They are not messages the client parses out of an error string.

The package's tests are a Phase 1 gate. The cases are listed in [the architecture](../architecture.md).

## Consequences

- A change to rounding or to the balance formula is one change, with one set of tests.
- The API still rechecks. A buggy or old client cannot commit a split the package would refuse.
- The package stays free of React components, SQL, and environment variables. Putting a query in it breaks the preview.
- Sharing stops at the math. HTTP shapes, sessions, and row locking stay in the API. A typed RPC layer is optional later. It is not required for the client and the server to agree on paise.
