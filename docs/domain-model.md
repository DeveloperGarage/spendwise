# Spendwise domain model

Status: planning baseline. 7 November 2026.

This is the contract for money in Spendwise. The product plan and the architecture doc cite it. If a screen and this document disagree, this document wins until someone changes it on purpose.

Amounts are integers of paise. ₹2000 is `200000`. Display rupees are formatted at the edge. Nothing in the split, the balances, or the database uses a binary floating-point value for money.

## Glossary

| Word | Meaning |
| --- | --- |
| Expense | One shared or personal cost. It has funding lines and allocation lines. |
| Funding | Who paid, and how much. This is the cash (or, later, the account) side. |
| Allocation, or share | Who consumed the cost, and how much. This is the spending side. |
| Settlement | A payment from one member to another that reduces a group balance. It has no category. |
| Balance | What the group owes a member. Positive means the group owes them. |
| Spending | The sum of a person's allocations. The personal-report name for consumption. |
| Cash movement | Money in and out of a person's accounts, including settlements. A Phase 2 report. |
| Void | A terminal flag. The row stays for the activity list and drops out of every total. |

## Entries

### Expense

- Group. Required by the Phase 1 API. The column can be empty later for a split with no group.
- When it happened, a note, who created it, a category.
- Gross amount in paise, greater than zero.
- Currency, INR in the beta. The gross is denominated in the group's currency.
- How the split was asked for: equal, exact, percentage, or shares. Stored so the screen can show it. Balances read the paise on the lines, not this label.
- Funding lines. Each line is a member, an optional account, and a paise amount. The lines sum to the gross. Phase 1 writes exactly one line.
- Allocation lines. Each line is a member, a paise amount, and the category. The lines sum to the gross. Every line amount is zero or greater. At least one line is greater than zero.

A payer with a zero allocation consumed nothing. Their spending for this expense is zero. The whole payment is a balance with the group.

### Settlement

- Group, payer, recipient, amount in paise greater than zero, when it happened.
- Optional account, empty until accounts exist.
- No category field. The type itself is what keeps a repayment out of Food, income, and spending.

A settlement may be larger than the current debt. Balances are recomputed. The direction flips if someone overpays. The beta does not clip the amount to the suggestion.

### What is not an entry in Phase 1

Income, a transfer between a person's own accounts, a credit-card bill payment, a refund, and interest. They are later entry types with the same discipline: a bill payment and an own-account transfer move balances between accounts and leave spending unchanged. Interest is spending. A refund reverses spending. None of them is a settlement, and a settlement is none of them.

## The worked dinner

Five members, A through E. A pays ₹2000 for a meal, split equally. Each share is ₹400.

| Member | Paid | Share | Balance from this expense |
| --- | --- | --- | --- |
| A | ₹2000 | ₹400 | +₹1600 |
| B, C, D, E | ₹0 | ₹400 | −₹400 each |

The four negative balances and the one positive balance sum to zero.

A's spending in Food is ₹400. A's cash is down ₹2000 until people pay. The ₹1600 is a receivable: part of what A is owed, not income.

B pays A ₹400. That settlement has no category.

| Member | Paid | Share | Sent | Received | Balance |
| --- | --- | --- | --- | --- | --- |
| A | ₹2000 | ₹400 | ₹0 | ₹400 | +₹1200 |
| B | ₹0 | ₹400 | ₹400 | ₹0 | ₹0 |
| C, D, E | ₹0 | ₹400 | ₹0 | ₹0 | −₹400 each |

The sum is still zero. Food is still ₹400 for A and ₹400 for B. When C, D, and E have paid as well, A's balance is zero and A's cash is down ₹400.

Wealth at the moment of the dinner, once accounts exist: cash −₹2000, receivable +₹1600, wealth −₹400. That matches the spending. After settlement, the receivable is cash again. Wealth does not move a second time.

## Balance

For one member, over the non-voided expenses and settlements in a group:

```text
balance = paid − share + sent − received
```

- `paid` is the sum of that member's funding lines.
- `share` is the sum of that member's allocation lines.
- `sent` is the sum of settlements they paid.
- `received` is the sum of settlements they received.

A positive balance means the group owes that member.

Several payers on one expense are several funding lines. The rule does not change. Phase 1 records that situation as two expenses, each with one payer.

## Invariants

These hold for every group after every committed write. Voided rows are ignored.

1. For each live expense, the funding lines sum to the gross, and the allocation lines sum to the gross.
2. The sum of all members' balances is exactly zero.
3. A settlement has no category and is excluded from spending.
4. Spending for a member is the sum of their allocation lines, nothing else.
5. Every paise amount is an integer. A line amount is zero or greater. An expense gross and a settlement amount are greater than zero.

Check 2 is the one that catches a share on the wrong member, a settlement stored on one side only, and a void that forgot a line. It is cheap to assert and it fails before a screen does.

Because every expense is fully funded and fully allocated, total paid equals total shares. Because every settlement has one sender and one recipient, total sent equals total received. The balance formula then sums to zero across the group. A bug is a break in one of those premises.

## Splits

The split function returns allocation lines in paise. It does not write the database.

Proportional modes use the largest-remainder method. Compute each person's floor share. Give one leftover paisa at a time to the people with the largest leftover fraction. Break ties by member id, ascending, so the same input always produces the same lines. The lines sum to the gross. ₹100 across three people is ₹33.34, ₹33.33, and ₹33.33.

| Mode | Input | Rule |
| --- | --- | --- |
| Equal | The members | Weights are all 1. Rounding is allowed. This is how a three-way split is done. |
| Shares | A positive integer weight per member | Relative weights. Paise may round. |
| Percentage | A percentage per member, in hundredths of a percent | The percentages must sum to 100.00%. Paise may still round. 33.33 three times sums to 99.99 and is refused. The gap is shown. Equal mode is the way to split three ways. |
| Exact | A paise amount per member, typed by a person | The amounts must sum to the gross. If they do not, the split is refused and the gap is returned. The difference is never added to the largest share. |

Shares are relative weights, so only the indivisible paisa is assigned by the method. Percentages are accepted only when they already sum to 100.00%; the method then assigns only leftover paise. Exact amounts were typed as money, so a gap is returned instead of being assigned to anyone.

Parsing a typed rupee string happens before the split. More than two decimal places is a rejection. The parser walks the decimal string. It does not parse through a binary float.

## Settle-up suggestion

The suggestion is a view over the balances. It is not stored.

Members with a negative balance are debtors. Members with a positive balance are creditors. Zeros are omitted. Each side is sorted by amount descending, then member id ascending.

While both sides remain, the next transfer is the minimum of the two heads. Subtract it from both. If a head reaches zero, advance that side. The two advances are independent: when the amounts match, both sides advance. Each step finishes at least one person, so a group of n needs at most n − 1 transfers.

The stored fact, when someone settles, is one payment from one member to another for a positive amount. Saving it recomputes the suggestion. The suggestion is not allowed to rewrite history into a different set of debts.

## Void, edit, and the activity list

A live expense or settlement can be edited by any group member. The edit replaces the lines, then the invariants are checked again.

Void sets a terminal flag. A voided row cannot be edited. Undoing a void means creating a new entry. Voided rows stay in the activity list and count in no total: not the balance, not the trip total, not the category total.

The activity list is for people. Balances are computed from the live rows, not from the list.

## Categories

A group has a flat list. The seed names are Food, Stay, Transport, Activities, Shopping, Groceries, and Other. Members can rename and add. An expense has one category, copied onto each allocation line so a later personal report can read the line alone.

There are no subcategories in the beta.

## Reserved for later phases

These are part of the model now so Phase 2 does not invent a second kind of expense. They are not Phase 1 screens.

- `account` on a funding line and on a settlement. Empty in the beta. Phase 2 fills it. Personal spending still reads allocations. Cash movement reads funding lines and settlements against accounts.
- An expense with no group, for a split between two people. The Phase 1 API requires a group.
- A foreign charge. The group amount stays in paise in the group's currency. The original amount, the original currency, and the rate used at entry are stored on that expense and then left alone. Balances never call a live rate. The beta writes INR only and does not add those columns yet.
- Credit card as a liability account. The purchase is an allocation plus an increase in what is owed to the issuer. The bill payment moves cash onto that liability.

## Phase 2 reports, defined now

Spending and cash movement are two series. They are never added together.

Spending in a period is the sum of a person's allocation lines whose expense falls in the period, shared and personal.

Cash movement in a period is funding lines (cash out), settlements paid (cash out), settlements received (cash in), plus later income and own-account transfers. A settlement received is labeled as a settlement. It is absent from any income total.

The dinner's preview, once both series exist, shows three figures for the payer: cash out ₹2000, spending ₹400 in Food, group balance up ₹1600. A participant who did not pay sees cash out ₹0, spending ₹400, group balance down ₹400.
