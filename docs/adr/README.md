# Architecture decision records

Accepted for the private-beta baseline on 7 November 2026. Each record is the decision and its consequences. The long form of the money rules is [../domain-model.md](../domain-model.md). The system those decisions sit in is [../architecture.md](../architecture.md).

| Record | Decision |
| --- | --- |
| [0001](0001-three-effect-journal.md) | One expense has a cash effect, a spending effect, and a balance effect. A settlement is none of income, spending, or a category. |
| [0002](0002-integer-paise-and-split-rules.md) | Amounts are integer paise. Proportional splits use largest remainder. Exact amounts and percentages that do not add up are refused. |
| [0003](0003-derived-balances.md) | Live expense and settlement rows are the source of truth. Balances and the settle-up plan are computed. |
| [0004](0004-expo-including-web.md) | The beta client is Expo, including the web build. Native iOS does not gate the trip. |
| [0005](0005-server-is-the-only-writer.md) | The API commits money inside one transaction. Phase 1 does not save offline. |
| [0006](0006-shared-domain-package.md) | Split, balance, and suggestion math live in one TypeScript package used by the client preview and the API. |
| [0007](0007-frontend-stack.md) | The Expo client is built from NativeWind, TanStack Query, Zustand, and React Hook Form with Zod. |
