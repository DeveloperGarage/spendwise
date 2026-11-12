# Spendwise product plan

Status: planning baseline. 9 November 2026.

Spendwise is a mobile-first record of shared and personal spending in one place. The private beta is a shared-expense tracker a group can use for a whole trip instead of Splitwise. Personal spending, capture automation, and payments come later, on the same entries.

The arithmetic lives in [domain-model.md](domain-model.md). The system shape lives in [architecture.md](architecture.md). The decisions that are expensive to reverse live in [adr/README.md](adr/README.md).

## Problem

Shared-expense apps track who owes whom. Personal-expense apps track what you spent from your own accounts. Using both means the same dinner is typed twice, and the second typing is easy to get wrong.

A person who pays ₹2,000 for five people, split equally, has spent ₹400 on the meal. ₹1,600 is owed to them until the others pay it back. That repayment restores cash. It is not income, and it does not belong in a spending category. A tracker that only has "income" and "expense" has to lie about one of those facts.

## Beta

One known group, one trip in India, amounts in INR, phones usually online. Everyone uses the same Expo web PWA from the Worker origin, in a browser or added to the home screen. The trip is a success when every shared expense is recorded in Spendwise and nobody opens Splitwise to keep the books.

Sign-in is invite-only: Google OAuth for emails on the allowlist. There is no public signup. The host and identity are [0008](adr/0008-cloudflare-and-supabase.md).

## One entry, three effects

A shared expense is a single entry. Reports read different columns of it. People never see debits and credits.

| Effect | ₹2,000 dinner, equal, five people, you paid |
| --- | --- |
| Cash | ₹2,000 leaves you |
| Spending | ₹400 in the meal's category |
| Position | The group owes you ₹1,600 |

A friend paying you ₹400 reduces that position by ₹400 and brings ₹400 of cash back. The category total stays ₹400.

The add screen is the same action for a personal expense and a group expense. In the beta the confirmation line uses group language: "You get back ₹1,600" or "You owe ₹400." When personal reports arrive, the same screen adds "₹400 counts as Food." The [domain model](domain-model.md) defines the formula, the rounding, and the checks that keep these numbers consistent.

## Phases

### Phase 1 — Trip beta, shared expenses only

A group can leave Splitwise for this trip.

- Google sign-in for allowlisted emails. First-open display name. Groups. The creator (or any member) adds people by email who have already signed in. No invite link in the beta. The client is a PWA on any device.
- Add, edit, and void an expense. Any member can correct an entry. Void keeps the row and drops it from the balances. An activity list shows who changed what.
- Split equally, by exact amounts, by percentage, or by shares. One payer per expense.
- Flat categories the group can rename and extend: Food, Stay, Transport, Activities, Shopping, Groceries, Other.
- Balances, a short settle-up suggestion, and a recorded settlement between two members.
- A trip summary: total spent, each person's share, totals by category. Expenses scrolled out of the list still count.

Two people paying one bill are entered as two expenses. The stored entry can already hold several payers, so a later screen does not have to rewrite old trips.

### Phase 2 — Personal and shared together

Cash and bank accounts. A personal expense is the same kind of entry with one participant and a real account. Two views of the month:

- **Spending** is each person's shares, shared and personal.
- **Cash movement** is money in and out of accounts. A reimbursement appears here, labeled as a settlement.

Settlements, transfers between a person's own accounts, and credit-card bill payments stay out of spending. Shared shares show up in each participant's categories.

### Phase 3 — A full personal tracker

Subcategories, budgets, repeating entries, loans, and credit cards as liabilities. A card purchase is spending plus a liability. Paying the card bill is a transfer. Interest is its own expense. A refund reverses spending. Splits with one other person and no group. Charts. Export.

A repeating group expense, such as rent, is a new expense spawned from a rule. It is not a new kind of money.

### Phase 4 — Capture, still confirmed by a person

Receipt photos and OCR. Android SMS or notification reading, off until the person turns it on. Suggested categories. A suggestion becomes an entry only after a person confirms it.

Connecting bank accounts through India's Account Aggregator is a separate later effort. It is not part of adding suggestions.

### Phase 5 — Paying from the settle screen

The first version opens the person's existing UPI app with the amount and payee filled in. Spendwise does not hold the money. The settlement is recorded when the payer confirms it. Returning from the UPI app does not, by itself, mean the payment happened.

A payment gateway that collects money into Spendwise is a regulated step. It waits until the UPI link is not enough.

## Phase 1 is done when

The group can record every shared trip expense, see who owes whom, and record settlements, from the PWA on a phone or a laptop.

- After every save, the members' balances sum to zero.
- An equal split sums to the exact total in paise.
- An exact split that does not add up is refused, and the screen shows the gap.
- A settlement changes balances and has no category.
- A person on any device can join, add an expense, read the balance, and record a settlement.

## Out of the beta

Offline entry. Native Android or iOS apps. More than one currency. More than one payer on a single expense. Receipt photos. Comment threads. Charts beyond the trip summary. Personal accounts, income, budgets, and repeating transactions. Payments. Leaving a group mid-trip. Public signup.

## Standard tracker features, by the phase that adds them

Categories are a flat group list in Phase 1, with subcategories in Phase 3. Weekly, monthly, and yearly spending views arrive in Phase 2. Accounts, loans, and repeating transactions arrive in Phases 2 and 3. Non-group splits arrive in Phase 3. The beta group does not need those to replace Splitwise for one trip.
