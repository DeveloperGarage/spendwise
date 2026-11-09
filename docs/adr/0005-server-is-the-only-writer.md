# 0005. The server is the only writer

Status: Accepted
Date: 2026-11-07

## Context

The beta group is usually online. Offline entry with a later sync is a second journal: two phones can split the same dinner differently, and the zero-sum check has to span a merge. That problem is real on a patchy network and it is larger than the trip requires.

Balances are only trustworthy if one place commits them. A client that writes straight to the database can skip a check the screen forgot.

## Decision

The Hono API is the only component that inserts or updates expenses, lines, settlements, and memberships. Each money write is one database transaction, described in [the architecture](../architecture.md): membership check, version check, domain split, line sums, zero-sum assertion, activity row, commit.

If the request fails, the client keeps the form open and shows that nothing was saved. Phase 1 has no outbox and no local journal.

Reads for balances and the trip summary run on the server from live rows. The client may show a preview from the shared domain package before the request returns. The committed response replaces the preview.

Sign-in is an email magic link. Sessions are opaque and stored on the server. There is no public signup. Group routes require a membership.

## Consequences

- The zero-sum assertion runs once, on the writer, in the same transaction as the insert.
- A lost connection cannot create a balance that exists only on one phone.
- The group cannot log an expense with no signal. The form must make that obvious.
- Direct database access from the app, and client-side Supabase writes to money tables, are out of bounds for Phase 1. Adding them means replacing this record.
- The API host and the magic-link mailer are [0008](0008-cloudflare-and-supabase.md). That choice does not change who is allowed to write.
