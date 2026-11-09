# 0007. Frontend library stack

Status: Accepted
Date: 2026-11-07

## Context

[0004](0004-expo-including-web.md) settled the client as an Expo web PWA with Expo Router and TypeScript. It did not name the libraries the screens are built from. The Phase 1 screens are forms, lists, and balances: sign in, first-open display name, group list, group balances, expense list, expense form, settlement form, trip summary, activity. The expense form is the hardest screen, because it collects a gross amount, a payer, members, a split mode, and a category, and must show the split before the save.

Three needs follow from that. The screens render in a mobile or desktop browser, and as an installed PWA. Server data has to stay fresh after a write without hand-rolled loading and cache code. The forms need validation that does not drift from the types the rest of the app uses.

The team knows React and JavaScript. Some know Kotlin and Flutter. The library choices lean on React knowledge the whole team shares.

This record decides the client only. The backend is already settled in [architecture.md](../architecture.md), [0005](0005-server-is-the-only-writer.md), and [0008](0008-cloudflare-and-supabase.md): a Hono and Drizzle API that is the only writer, hosted with the PWA on one Cloudflare Worker. This record reads that decision and builds the client against it. It does not change it.

## Decision

The Expo client is built from these libraries.

| Need | Choice |
| --- | --- |
| Styling | NativeWind. Tailwind utility classes compiled to React Native styles, which Expo web understands. |
| Server state | TanStack Query. One cache for reads, with refetch after every money write. |
| UI state | Zustand. Local screen state only, kept out of the server cache. |
| Forms | React Hook Form for the form state, Zod for the schema. |
| Validation and types | Zod schemas, inferred into TypeScript types, one definition per form. |

- NativeWind is chosen because every Phase 1 screen must render in the PWA, and one utility styling system avoids a second stylesheet. It keeps styling in the component, which the team can read without learning a styling DSL. Native Android or iOS, if they arrive later from this project, can keep the same classes.
- TanStack Query owns everything that comes from the server: groups, members, expenses, settlements, balances. Balances are computed on read ([0003](0003-derived-balances.md)), so the client refetches them after a write rather than mutating a local copy. The library gives the cache, the refetch, the retry, and the loading and error states that every list screen needs, instead of each screen writing its own. It calls the Hono API from [0005](0005-server-is-the-only-writer.md); the client is not a second writer.
- Zustand holds only state that never leaves the client: the expense form's current step, list filters, a theme toggle. Server data does not live in Zustand. Keeping the two apart stops a stale store from becoming a second, wrong source of balances.
- React Hook Form runs the expense and settlement forms. Zod is the schema for each form, inferred into the TypeScript type the screen uses, so the validation and the type cannot drift. A money field is parsed to paise, never read as a fractional JSON number, matching the rule the API enforces ([0002](0002-integer-paise-and-split-rules.md)).

The split arithmetic itself is not in any of these libraries. The form calls the shared domain package ([0006](0006-shared-domain-package.md)) to turn the gross and the mode into lines, and shows those lines before the save. The form posts paise to the API.

## Consequences

- Every one of these libraries works in the Expo web PWA. A styling, form, or state library that is native-only cannot back a Phase 1 screen, by the same rule as [0004](0004-expo-including-web.md).
- Server state and UI state have separate homes. A reviewer can tell which is which by the import. Balances only ever come from TanStack Query, never from Zustand.
- A form's shape is one Zod schema. The validation message, the TypeScript type, and the parsed paise all come from it. Changing a field is one edit, not three.
- The split preview is the domain package's output, not logic re-expressed inside React Hook Form. The form renders lines; it does not compute them.
- The client reads and writes only through the API in [0005](0005-server-is-the-only-writer.md). TanStack Query is the client's view of that boundary. This record names no backend of its own and reopens no backend decision.
