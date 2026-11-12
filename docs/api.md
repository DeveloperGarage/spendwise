# Spendwise API

Status: Phase 1 contract plus live implementation tracking. Baseline 9 November 2026. Amended 12 November 2026 (group membership by email; invite URLs deferred). Implementation column updated 13 November 2026.

Phase 1 HTTP contract. The caller is the session. A group is the shared aggregate. Money rules are in [domain-model.md](domain-model.md). The system those routes sit in is [architecture.md](architecture.md). The host that serves these routes is [0008](adr/0008-cloudflare-and-supabase.md).

## Route implementation

Tracked against `apps/api`. **Done** means the route is wired in Hono (tests where we have them). **—** means contract only for now. Update this table as each slice ships.

| Route | Status |
| --- | --- |
| [`GET /auth/google`](#get-authgoogle) | Done |
| [`GET /auth/callback`](#get-authcallback) | Done |
| [`POST /auth/sessions`](#post-authsessions) | Done |
| [`DELETE /auth/session`](#delete-authsession) | Done |
| [`GET /me`](#get-me) | Done |
| [`PATCH /me`](#patch-me) | Done |
| [`GET /dashboard`](#get-dashboard) | Done |
| [`GET /groups`](#get-groups) | Done |
| [`POST /groups`](#post-groups) | Done |
| [`GET /groups/:groupId/members`](#get-groupsgroupidmembers) | Done |
| [`POST /groups/:groupId/members`](#post-groupsgroupidmembers) | Done |
| [`GET /groups/:groupId`](#get-groupsgroupid) | Done |
| [`GET /groups/:groupId/expenses`](#get-groupsgroupidexpenses) | Done |
| [`POST /groups/:groupId/expenses`](#post-groupsgroupidexpenses) | Done |
| [`GET /groups/:groupId/expenses/:expenseId`](#get-groupsgroupidexpensesexpenseid) | Done |
| [`PUT /groups/:groupId/expenses/:expenseId`](#put-groupsgroupidexpensesexpenseid) | Done |
| [`POST /groups/:groupId/expenses/:expenseId/void`](#post-groupsgroupidexpensesexpenseidvoid) | Done |
| [`POST /groups/:groupId/settlements`](#post-groupsgroupidsettlements) | — |
| [`GET /groups/:groupId/settlements/:settlementId`](#get-groupsgroupidsettlementssettlementid) | — |
| [`PUT /groups/:groupId/settlements/:settlementId`](#put-groupsgroupidsettlementssettlementid) | — |
| [`POST /groups/:groupId/settlements/:settlementId/void`](#post-groupsgroupidsettlementssettlementidvoid) | — |
| [`GET /groups/:groupId/settlements`](#get-groupsgroupidsettlements) | — |
| [`GET /groups/:groupId/balances`](#get-groupsgroupidbalances) | — |
| [`GET /groups/:groupId/activity`](#get-groupsgroupidactivity) | — |
| [`GET /groups/:groupId/summary`](#get-groupsgroupidsummary) | — |
| [`GET /groups/:groupId/categories`](#get-groupsgroupidcategories) | — |
| [`POST /groups/:groupId/categories`](#post-groupsgroupidcategories) | — |
| [`PATCH /groups/:groupId/categories/:categoryId`](#patch-groupsgroupidcategoriescategoryid) | — |

## Conventions

The Hono app is mounted at `/api` on the Cloudflare Worker that also serves the Expo web PWA. Paths in this document are that mount: `GET /auth/google` is `GET /api/auth/google` on the wire. There is no `/v1` prefix. There is no public signup.

A session is required on every route except `GET /auth/google`, `GET /auth/callback`, and `POST /auth/sessions`. The PWA sends the httpOnly Secure cookie to the same origin.

A group id is checked against membership before the query. A group the caller is not in returns 404.

`amount` is the only money name on the wire. It is a JSON integer of paise, not a string and not a decimal. For `INR`, ₹1,200.00 is `120000`. A string, and a number with a fractional part, are both `422 VALIDATION_FAILED`. Rupees exist only on the screen: the person types them, `packages/domain` turns that text into paise, and the client formats paise back into rupees to display.

A positive `balance` means the group owes that member.

Lists take `limit` and `cursor` and return `nextCursor`.

`POST` of an expense or a settlement requires `Idempotency-Key`. A replay returns the original row and inserts nothing.

An edit sends the `version` the client read. A mismatch is `409 VERSION_CONFLICT` and writes nothing.

Errors are one shape.

```json
{ "error": { "code": "SPLIT_REFUSED", "message": "The shares do not add up.", "details": { "gap": 100 }, "requestId": "req_1" } }
```

## Auth

_All routes in this section: **Done**._

Sign-in is Google OAuth only, gated by `allowed_emails`. Email/password and magic link stay off. The Before User Created hook rejects a Google account whose email is not on the list, so no `auth.users` row is created. Hono checks the same table before writing `public.users` and the opaque session.

The allowlisted address must be the Google account the person will tap. The Expo web app may talk to Google and to Supabase Auth for this login. It does not write journal tables.

### GET /auth/google

Starts Google OAuth. `302` toward Google, through Supabase Auth. `redirectTo` is this Worker's `/api/auth/callback`.

### GET /auth/callback

Return from Supabase Auth. Hono verifies the result, checks `allowed_emails`, creates `public.users` if needed, writes the opaque session, sets the httpOnly Secure cookie, and redirects into the app. If `profileCompleted` is false, that landing is the display-name form.

A GET that a scanner might fetch does not create a session unless it presents a valid OAuth result for an allowlisted email.

### POST /auth/sessions

```json
{ "provider": "google", "idToken": "..." }
```

`201`. If the client already holds a Google id token, it may complete login here instead of the redirect. Hono verifies it with Supabase Auth, checks `allowed_emails`, creates `public.users` if needed, writes the opaque session, and sets the cookie.

An email that is not on the allowlist is `403`. No `public.users` row and no session.

```json
{ "user": { "id": "u_1", "displayName": "Aman", "email": "aman@gmail.com", "profileCompleted": false } }
```

`displayName` is prefilled from the Google profile on first success. `profileCompleted` is `false` until `PATCH /me`.

### DELETE /auth/session

`204`. Ends the session that presented the request.

### GET /me

```json
{ "id": "u_1", "displayName": "Aman", "email": "aman@gmail.com", "profileCompleted": false }
```

If `profileCompleted` is `false`, the client shows the display-name form before the dashboard.

### PATCH /me

```json
{ "displayName": "Aman" }
```

Response is the `GET /me` body with `profileCompleted: true`. This is the only user write. They can change the name later the same way.

## Dashboard

_Done: `GET /dashboard`._

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

_Done: list, create, add members, member list, and group detail._

### GET /groups

The Groups screen. The same card as `dashboard.groups`, the full list, and no `summary` object.

```json
{
  "groups": [
    { "id": "g_goa", "name": "Goa Trip", "memberCount": 4, "balance": 156000 },
    { "id": "g_flat", "name": "Flat 203", "memberCount": 3, "balance": -42000 }
  ]
}
```

### POST /groups

Creates a group in one transaction. The caller becomes a member. `currency` is `INR`. The seven seed categories are Food, Stay, Transport, Activities, Shopping, Groceries, and Other.

Phase 1 adds people by **email**, not invite links. Each address must belong to someone who has already signed in (`public.users`). The email must also be on `allowed_emails`, the same gate as Google sign-in.

```json
{
  "name": "Goa Trip",
  "memberEmails": ["riya@gmail.com", "sam@gmail.com"]
}
```

`name` is required. `memberEmails` is optional. Addresses are normalized to lowercase. The caller's own email and duplicates in the array are ignored. If any remaining address has no matching `users` row, or is not allowlisted, the request is `422 VALIDATION_FAILED` with `details.field` set to `memberEmails` and no group is created.

`201` and the group body (same shape as `GET /groups/:groupId`).

### GET /groups/:groupId/members

The member directory for one group, without the balance or category work on `GET /groups/:groupId`. Same people as `members` on the group body, ordered by display name.

```json
{
  "members": [
    { "id": "u_1", "displayName": "Aman", "email": "aman@gmail.com" },
    { "id": "u_2", "displayName": "Riya", "email": "riya@gmail.com" }
  ]
}
```

A caller who is not in the group gets `404`.

### POST /groups/:groupId/members

Any current member may add people by email. Uses the same `memberEmails` field as create so one person or several share one validation path and one transaction.

```json
{ "memberEmails": ["sam@gmail.com", "mira@gmail.com"] }
```

`memberEmails` is required and non-empty after trimming. Same rules as on create: lowercase, must exist in `users`, must be on `allowed_emails`. The caller's own email, duplicates in the array, and addresses already in the group are ignored. If every address is skipped and nobody new would join, `422 VALIDATION_FAILED` with `details.field` = `memberEmails`. If any remaining address fails lookup or allowlist, nothing is written and the response is `422` with `details.field` = `memberEmails`.

`201` and the full group body (same shape as `GET /groups/:groupId`) after the new memberships commit.

### GET /groups/:groupId

Header for the group screen. Members are embedded. Phase 1 has no route that removes a member.

```json
{
  "id": "g_goa",
  "name": "Goa Trip",
  "currency": "INR",
  "balance": 156000,
  "members": [
    { "id": "u_1", "displayName": "Aman", "email": "aman@gmail.com" },
    { "id": "u_2", "displayName": "Riya", "email": "riya@gmail.com" }
  ]
}
```

Member `email` is returned so the client can show who is in the trip without a separate directory.

## Expenses

_Done: list, create, detail, replace, and void._

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

`caller.effect` is `lent`, `paid`, or `owe` for that expense alone. `describeExpenseForMember` in `packages/domain` produces it, so every client uses the same words. A cab that Sam paid, where the caller's share is ₹350, is `effect: "owe"` with Sam as `payer`.

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

_Not implemented._

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

_Not implemented._

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

## Categories

_Not implemented_ (seed categories on `POST /groups` are **Done**).

Category routes are not wired in the first client frames. They are still part of Phase 1 on the API; create group seeds the defaults.

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
| `VALIDATION_FAILED` | 422 | The body is wrong. `details` names the field. A category on a settlement lands here. Unknown or never-signed-in addresses on `memberEmails` (create group or add members) land here with `details.field` = `memberEmails`. |

## Later phases

Personal expenses, when they arrive, are this same expense with an account, not a second collection under the user. Income, own-account transfers, card-bill payments, and refunds are further entry types. They are not optional fields on an expense or a settlement.

**Invite links (deferred).** The journal still has `group_invites` for a possible later flow. Phase 1 beta uses email add on `POST /groups` and `POST /groups/:groupId/members` instead of `GET /groups/:groupId/invite`, `POST /groups/:groupId/invite/rotations`, or `POST /invites/:token/accept`.
