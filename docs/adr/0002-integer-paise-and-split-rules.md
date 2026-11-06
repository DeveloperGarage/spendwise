# 0002. Integer paise and split rules

Status: Accepted
Date: 2026-11-07

## Context

Group totals are checked by an exact zero-sum. Binary floating point cannot support that check. Splits also have to decide who receives an indivisible paisa, and they have to refuse to invent an amount a person typed.

The beta is INR only. The unit is still the minor unit, so a later currency does not introduce a second representation. The rules are specified in [the domain model](../domain-model.md).

## Decision

Every amount is an integer number of paise. Rupee input is parsed from a decimal string. More than two decimal places is rejected. JSON numbers with a fractional part are not accepted as money.

Equal splits and share-weighted splits use the largest-remainder method. Leftover paise go to the largest fractional parts. Ties break by member id, ascending. The allocated lines sum to the gross.

Percentage splits must sum to 100.00% before any paise are assigned. 33.33 three times sums to 99.99 and is refused, with the gap shown. Equal mode is how a group splits three ways. Paise inside a valid percentage split still use largest remainder.

Exact splits must sum to the gross. A shortfall or an overage is refused, with the gap in paise. The server does not add the difference to the largest share.

## Consequences

- The zero-sum check is exact.
- The same input always yields the same lines, so a preview and a save cannot drift by a paisa because of ordering.
- The expense screen shows the paise each person received whenever a split rounded.
- Callers that want "about a third each" use equal mode. Percentage mode does not guess that 99.99 meant 100.
- A later foreign amount is converted once, at entry, into group-currency paise. The beta does not do that conversion. It also does not store money as a float while waiting.
