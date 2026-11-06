# 0003. Balances are derived

Status: Accepted
Date: 2026-11-07

## Context

A group balance can be stored and updated on every write, or computed from the expenses and settlements. Stored balances drift when one update path forgets a side: a void, an edit, a settlement recorded for the payer and not the recipient.

The settle-up screen also wants a short list of payments. The shortest such list is a different problem from "who is owed what," and storing the short list as if it were the debt rewrites relationships the group did not agree to.

## Decision

The live, non-voided expense rows, their lines, and the live settlement rows are the source of truth.

```text
balance = paid − share + sent − received
```

A positive balance means the group owes that member. After every committed write the balances in a group sum to zero. The formula and the greedy suggestion are in [the domain model](../domain-model.md).

The suggestion is computed on read. It is deterministic. It is not saved. When someone settles, the stored row is one payment between two members for the amount they entered. The suggestion is then computed again.

Edits change the live row. A version integer rejects a write that started from a stale read. Voids flag the row and leave it out of every total. The activity list records the change for people. Totals do not read the activity list.

Phase 1 does not keep a balance column. A cache may be added later only if it is rebuilt from these rows.

## Consequences

- Any bug that drops one side of an entry fails the zero-sum check in the write transaction.
- The suggestion can change after a settlement without rewriting older expenses.
- Overpaying is allowed. The next suggestion shows the flipped direction.
- Trip totals include every live expense, including ones the list is not currently showing.
- Leaving a group is out of the beta. Everyone who joined stays in the balance set.
