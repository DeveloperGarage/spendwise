# 0001. One expense has three effects

Status: Accepted
Date: 2026-11-07

## Context

Spendwise has to record a group dinner and, later, a person's own spending, from the same entry. The case that breaks an income-and-expense ledger is ordinary: one person pays ₹2000 for five people, split equally. That person laid out ₹2000, consumed ₹400, and is owed ₹1600. When the others pay, the ₹1600 comes back as cash.

Calling the ₹2000 an expense overstates spending. Calling the repayment income overstates income. Recording only the ₹400 and ignoring the ₹2000 that left the account will break account balances once those exist.

Personal reports are Phase 2. The entry stored in the trip beta is the one those reports will read. See [the domain model](../domain-model.md).

## Decision

An expense stores funding lines and allocation lines.

- Funding is the cash side. The payer's funding line is the full amount they paid.
- Allocation is the spending side. Each person's share is their spending in the category.
- The difference is that person's balance with the group.

A settlement is a different entry. It moves cash from one member to another and changes balances. It has no category. It is not income. It is not spending.

Phase 1 does not build accounts or an income type. It does store funding and allocation separately, and it stores settlements as their own type, so Phase 2 can attach accounts without reclassifying old trips.

The add screen is one flow. The beta confirms with "You get back …" or "You owe …". Phase 2 adds the spending figure to that same confirmation.

## Consequences

- Category totals and, later, personal spending read allocation lines only.
- Account balances, when they exist, read funding lines and settlements.
- A repayment never appears in an income total. The type has nowhere to put a category.
- A payer who consumed nothing has a zero allocation and a balance equal to what they paid.
- Credit-card purchases, card-bill payments, refunds, and interest stay future entry types. They follow the same split between spending and balance movement, and they are not implemented by overloading a settlement.
