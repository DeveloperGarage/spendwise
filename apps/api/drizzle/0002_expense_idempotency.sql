Issue draft aligned with the [feature-request template](https://github.com/DeveloperGarage/spendwise/blob/main/.github/ISSUE_TEMPLATE/feature-request.yml). Backend for detail/replace is already done; this is a **PWA / navigation** slice.

---

### Title

`[FEATURE]: View and edit expense from group list`

---

### Feature Summary

Let group members **open an expense** from the Expenses tab, **view its details**, and **edit** it (full replace via `PUT`), with correct handling for **voided** expenses, **version conflicts**, and refresh of list/balances/summary after save.

---

### Problem Statement

The API already supports expense detail and replace ([`docs/api.md`](docs/api.md) — `GET` / `PUT` / `POST .../void` **Done**), and [`ExpenseList`](apps/mobile/src/components/expense-list/expense-list.tsx) supports `onPress` via `onOpenExpense`, but:

- [`view-group.tsx`](apps/mobile/src/screens/view-group/view-group.tsx) does **not** wire `onOpenExpense` — rows are not navigable.
- Mobile only has [`saveExpense`](apps/mobile/src/lib/api/expense.ts) (**POST** create); no **GET** detail or **PUT** update client.
- There is no Expo route/screen for expense detail or edit (only [`add-expense`](apps/mobile/src/app/add-expense.tsx)).
- No MSW handlers for expense detail/update.

Users can add expenses but cannot correct mistakes or review split/category/payer without leaving the app or using the API manually.

---

### Proposed Solution

**Navigation**

- From group **Expenses** tab: tap row → `/groups/:groupId/expenses/:expenseId` (or `/edit-expense?groupId=&expenseId=`).
- Pass `groupId` + `expenseId`; back returns to group with list refreshed (`useFocusEffect` pattern like balances/activity).

**API client**

- Types: `ExpenseDetail` = create body + `id`, `version`, `voided`, `category` (or `categoryId` from GET), `fundingLines`, `split`, `splitMode`.
- `getExpenseById(groupId, expenseId)` → `GET /groups/:groupId/expenses/:expenseId`
- `updateExpense(groupId, expenseId, body)` → `PUT` with `version` in body (no idempotency key on edit per API).

**UI**

- **View mode (or combined screen):** note, date, category, amount, paid by, split summary, voided banner if `voided`.
- **Edit mode:** reuse [`ExpenseSplitEditor`](apps/mobile/src/components/expense-split-editor/expense-split-editor.tsx) + same fields as add expense (category dropdown, date, amount, paid by, split tabs). Prefer **shared form** extracted from/add-expense or a dedicated `edit-expense` screen that loads detail then pre-fills:
  - **Equal:** participants from `split` lines with amount > 0 (or all members on expense).
  - **Exact:** seed `exactInput` from allocation amounts.
  - **Shares / %:** seed weight inputs from stored lines (document limitation: round-trip may not recover original user-entered %/shares; amounts are source of truth).
- **Save:** `PUT` with current `version`; on **409 `VERSION_CONFLICT`**, show message and refetch detail.
- **Voided:** read-only; no Save; optional future “Void” action as separate story unless in scope.
- **Errors:** 404, validation, `SPLIT_REFUSED` (show gap if API returns it).

**Mocks**

- MSW: `GET` and `PUT` for `/groups/:groupId/expenses/:expenseId` aligned with list fixture expense id.

**Docs**

- Short note in [`apps/mobile/README.md`](apps/mobile/README.md) or ADR 0007 screen list if you track PWA screens there.

---

### Use Cases

1. User taps “Dinner” on Expenses → sees who paid, category, split, their share effect.
2. User fixes wrong category or amount → Save → list and balances update on return.
3. Another member edited the same expense → user gets version conflict and refreshes.
4. User opens a voided expense → sees voided state; cannot edit (per API).

---

### Acceptance Criteria

- [ ] Tapping an expense on the group Expenses tab opens detail/edit UI.
- [ ] Screen loads via `GET /groups/:groupId/expenses/:expenseId`; loading and error states.
- [ ] Edit + Save calls `PUT` with `version`; successful save returns to group and refreshes expenses (and ideally balances/summary on next tab visit).
- [ ] `voided: true` → no edit/save (read-only).
- [ ] `409 VERSION_CONFLICT` handled with user-visible message + refetch.
- [ ] Category picker uses `GET .../categories` (same as add expense).
- [ ] MSW supports mock detail/update for `web:mock`.
- [ ] Manual test: change note, amount, split mode, category on a non-voided expense; balances stay consistent.

**API:** no new routes required (already Done).

---

### Priority

**High** — core journal correction path; API is ready, UX gap blocks day-to-day use.

---

### Alternatives Considered

- **Inline expand on list:** avoids new route but poor fit for split editor; rejected.
- **Duplicate add-expense only:** no prefill/version → bad edit UX; rejected.
- **Void-only from detail:** useful follow-up; can be same issue or child if you want “Void expense” button calling `POST .../void`.

---

### Additional Context

**Already implemented**

- API: [`getExpenseDetail`](apps/api/src/expenses/service.ts), [`replaceExpense`](apps/api/src/expenses/service.ts), routes in [`expenses/routes.ts`](apps/api/src/expenses/routes.ts).
- List item: [`ExpenseList`](apps/mobile/src/components/expense-list/expense-list.tsx) `onOpenExpense` hook (unwired).

**Reference screens**

- [`add-expense.tsx`](apps/mobile/src/screens/add-expense/add-expense.tsx) — field layout, split editor, category load.
- [`settle-up.tsx`](apps/mobile/src/screens/settle-up/settle-up.tsx) — pattern for parameterized group route + save.

**Suggested PR split**

1. Client + route + read-only detail.
2. Edit prefill + PUT + conflict handling.
3. MSW + smoke tests.

**Open product choice (note in issue when implementing):** v1 read-only detail with “Edit” toggle vs single editable screen from the start.

---

Paste each block into the matching GitHub form field. If you want **Void** on the same issue, say so and we can add acceptance criteria for `POST .../void`.CREATE TABLE "expense_idempotency" (
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"expense_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_idempotency_user_id_group_id_idempotency_key_pk" PRIMARY KEY("user_id","group_id","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "expense_idempotency" ADD CONSTRAINT "expense_idempotency_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_idempotency" ADD CONSTRAINT "expense_idempotency_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_idempotency" ADD CONSTRAINT "expense_idempotency_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;
