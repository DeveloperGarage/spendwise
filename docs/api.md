# Spendwise API

Status: planning baseline. 7 November 2026.

Phase 1 HTTP contract. The caller is the session. A group is the shared aggregate. Money rules are in [domain-model.md](domain-model.md). The system those routes sit in is [architecture.md](architecture.md).

## Conventions

A session is required on every route except `POST /auth/magic-links` and `POST /auth/sessions`. The web client sends the httpOnly Secure cookie. The native client sends `Authorization: Bearer`.

A group id is checked against membership before the query. A group the caller is not in returns 404.

`amount` is the only money name on the wire. It is an integer in the minor unit of `currency`. For `INR`, ₹1,200.00 is `120000`. That integer is what the domain model calls paise. A JSON number with a fractional part is rejected. The client parses a typed rupee string with `packages/domain` and posts the integer.

A positive `balance` means the group owes that member.

Lists take `limit` and `cursor` and return `nextCursor`.

`POST` of an expense or a settlement requires `Idempotency-Key`. A replay returns the original row and inserts nothing.

An edit sends the `version` the client read. A mismatch is `409 VERSION_CONFLICT` and writes nothing.

Errors are one shape.

```json
{ "error": { "code": "SPLIT_REFUSED", "message": "The shares do not add up.", "details": { "gap": 100 }, "requestId": "req_1" } }
```

There is no `/v1` prefix. There is no public signup.

## Auth

### POST /auth/magic-links

```json
{ "email": "aman@company.com" }
```

`202` with an empty body, whether or not that email may sign in. At most one live link. The login screen's copy is a 10-minute expiry.

### POST /auth/sessions

```json
{ "token": "..." }
```

`201`. The token is the one from the email. The first successful redeem of an allowed email creates the user. Web sets the cookie. Native receives the bearer token once.

```json
{ "user": { "id": "u_1", "displayName": "Aman", "email": "aman@company.com" } }
```

### DELETE /auth/session

`204`. Ends the session that presented the request.

### GET /me

```json
{ "id": "u_1", "displayName": "Aman", "email": "aman@company.com" }
```

### PATCH /me

```json
{ "displayName": "Aman" }
```

Response is the `GET /me` body. This is the only user write.

## Dashboard

### GET /dashboard

The launch screen: greeting, the three headline figures, and the group cards. Computed on read from live rows. Phase 1 is one currency, `INR`.

```json
{
  "user": { "id": "u_1", "displayName": "Aman" },
  "summary": { "currency": "INR", "net": 156000, "owed": 221000, "owe": 65000 },
  "groups": [
    { "id": "g_goa", "name": "Goa Trip", "memberCount": 4, "balance": 156000 },
    { "id": "g_flat", "name": "Flat 203", "memberCount": 3, "balance": -42000 }
  ]
}
```

For the caller, inside one group:

```text
balance = paid − share + sent − received
```

`paid` and `share` come from live expenses. `sent` and `received` come from live settlements.

Across the caller's groups:

- `net` is the sum of those balances.
- `owed` is the sum of the positive balances.
- `owe` is the sum of the absolute negative balances.
- A settled group contributes nothing to `owed` or `owe`.

## Groups

### GET /groups

The Groups screen. The same card as `dashboard.groups`, the full list, and no `summary` object.

### POST /groups

```json
{ "name": "Goa Trip" }
```

`201` and the group. The caller becomes a member. `currency` is `INR`. The seven seed categories are Food, Stay, Transport, Activities, Shopping, Groceries, and Other.

### GET /groups/:groupId

Header for the group screen. Members are embedded. Phase 1 has no route that removes a member.

```json
{
  "id": "g_goa",
  "name": "Goa Trip",
  "currency": "INR",
  "balance": 156000,
  "members": [
    { "id": "u_1", "displayName": "Aman" },
    { "id": "u_2", "displayName": "Riya" }
  ]
}
```

## Expenses

### GET /groups/:groupId/expenses

The Expenses tab, newest first.

```json
{
  "expenses": [
    {
      "id": "e_1",
      "version": 1,
      "note": "Dinner at Britto's",
      "occurredOn": "2026-11-07",
      "category": { "id": "c_food", "name": "Food" },
      "amount": 120000,
      "payer": { "id": "u_1", "displayName": "Aman" },
      "caller": { "paid": 120000, "share": 40000, "effect": "lent", "effectAmount": 80000 },
      "voided": false
    }
  ],
  "nextCursor": null
}
```

`caller.effect` is `lent`, `paid`, or `owe` for that expense alone. `describeExpenseForMember` in `packages/domain` produces it, so Android and Safari use the same words. A cab that Sam paid, where the caller's share is ₹350, is `effect: "owe"` with Sam as `payer`.

### POST /groups/:groupId/expenses

`201`. Requires `Idempotency-Key`.

```json
{
  "note": "Dinner at Britto's",
  "occurredOn": "2026-11-07",
  "categoryId": "c_food",
  "amount": 120000,
  "split": { "mode": "equal", "memberIds": ["u_1", "u_2", "u_3"] },
  "fundingLines": [{ "memberId": "u_1", "amount": 120000 }]
}
```

Phase 1 accepts one funding line, and that line's `amount` equals the expense `amount`. `split.mode` is `equal`, `exact`, `percentage`, or `shares`.

| Mode | Body | Rule |
| --- | --- | --- |
| `equal` | `memberIds` | Weights are 1. |
| `exact` | `{ "memberId", "amount" }[]` | The amounts must sum to the expense `amount`. |
| `percentage` | `{ "memberId", "hundredths" }[]` | Accepted only when the hundredths sum to `10000` (100.00%). |
| `shares` | `{ "memberId", "weight" }[]` | Each weight is a positive integer. |

The Add expense frame shows Equally, Exact, and %. `shares` stays on the API so the screen can hide it without a second split. `categoryId` and `occurredOn` stay required. The current frame does not draw those controls yet.

`fundingLines` is an array so a later second payer is another line, not a new route. `accountId` stays off the JSON until accounts exist.

### GET /groups/:groupId/expenses/:expenseId

The edit form. The create body, plus `id`, `version`, `voided`, and the allocation lines the split produced.

### PUT /groups/:groupId/expenses/:expenseId

Replaces the expense. The body is the create body plus `version`.

### POST /groups/:groupId/expenses/:expenseId/void

`200`. The row stays in activity and drops out of balances, the dashboard, and the trip summary. A voided expense cannot be edited.

## Settlements

A settlement is its own collection. It has an `amount`, a sender, and a recipient. It has no category. A category field on the body is `422 VALIDATION_FAILED`.

### POST /groups/:groupId/settlements

`201`. Requires `Idempotency-Key`. The amount may be larger than the current suggestion. The next balance read shows the flipped direction.

```json
{
  "fromMemberId": "u_2",
  "toMemberId": "u_1",
  "amount": 40000,
  "occurredOn": "2026-11-07",
  "note": ""
}
```

### GET /groups/:groupId/settlements/:settlementId

The settlement, including `version` and `voided`.

### PUT /groups/:groupId/settlements/:settlementId

The create body plus `version`.

### POST /groups/:groupId/settlements/:settlementId/void

Same terminal rule as an expense.

### GET /groups/:groupId/settlements

Newest first, for a later list. The group screen's Expenses tab is expenses only. Settlements appear on Activity and inside Balances.

## Balances, activity, summary

### GET /groups/:groupId/balances

The Balances tab and the settle-up suggestion. The suggestion is computed. It is not saved. Recording a payment is `POST /groups/:groupId/settlements` for the amount the person entered.

```json
{
  "members": [
    { "id": "u_1", "displayName": "Aman", "balance": 156000 },
    { "id": "u_2", "displayName": "Riya", "balance": -40000 }
  ],
  "suggestion": [
    { "fromMemberId": "u_2", "toMemberId": "u_1", "amount": 40000 }
  ]
}
```

### GET /groups/:groupId/activity

The Activity tab, newest first, including edits and voids. Each item has `actor`, `at`, `kind` (`expense` or `settlement`), `action` (`created`, `edited`, or `voided`), and a snapshot. Totals never read this list.

### GET /groups/:groupId/summary

Trip totals. Live expenses the list has scrolled past are included. Voided rows are excluded.

```json
{
  "currency": "INR",
  "total": 840000,
  "members": [{ "id": "u_1", "displayName": "Aman", "share": 210000 }],
  "categories": [{ "id": "c_food", "name": "Food", "amount": 320000 }]
}
```

## Invites and categories

The product plan includes these. The six v1 frames do not draw them yet.

### GET /groups/:groupId/invite

```json
{ "url": "https://spendwise.example/join/TOKEN" }
```

Any member may read it. The token is unguessable.

### POST /groups/:groupId/invite/rotations

`200` and the new invite. The previous link stops working.

### POST /invites/:token/accept

Session required. `201` and the group. Creates the membership.

### GET /groups/:groupId/categories

The group's categories, seed names included.

### POST /groups/:groupId/categories

```json
{ "name": "Fuel" }
```

`201` and the category.

### PATCH /groups/:groupId/categories/:categoryId

```json
{ "name": "Food and drink" }
```

The renamed category. This is a real partial update. An expense edit is a full replace.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `SPLIT_REFUSED` | 422 | Exact or percentage totals miss. `details.gap` is the missing or extra amount, or the percentage gap in hundredths. |
| `VERSION_CONFLICT` | 409 | The `version` is stale. Nothing is written. |
| `VOIDED` | 409 | The row is already voided. |
| `VALIDATION_FAILED` | 422 | The body is wrong. `details` names the field. A category on a settlement lands here. |

## Later phases

Personal expenses, when they arrive, are this same expense with an account, not a second collection under the user. Income, own-account transfers, card-bill payments, and refunds are further entry types. They are not optional fields on an expense or a settlement.
