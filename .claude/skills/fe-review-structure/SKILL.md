---
name: fe-review-structure
description: Project structure pass of a frontend review — feature-based organisation, colocation, import boundaries, unidirectional dependency flow, feature public surface, global folder discipline, state placement, API/data layer, config, page thinness, path aliases, test colocation. Use when reviewing how a React project's files and modules are organised, or as pass 8 of /frontend-review.
---

# Project structure pass (STRUCT)

Group by **domain**, not by file type. Files that change together live
together; everything global stays aggressively small. A feature is a module
with a boundary — delete the folder and nothing outside it should break.

Dependencies flow one way: **shared → features → app**. Shared code is usable
by anything; a feature may use shared code; only the app layer composes
features. (bulletproof-react, *Project Structure*.)

**Scale gate.** Structure checks earn their keep at size. If `src/**` holds
fewer than 15 source files *and* no `features/` directory exists, the app is
pre-split: STRUCT-01..06 and STRUCT-13 are `N/A` with reason `below split
threshold (N files)`. The rest still apply. Never invent a migration the app's
size does not justify.

**Absent folders are `N/A`, absent behaviour is `PASS`.** A check scoped to a folder that does not exist (no `src/components/` for STRUCT-02/03, no `lib/`/`utils/` for STRUCT-12) is `N/A` with reason `no such folder` — a well-split app never grows those folders and should not be credited or penalised for it. A check about a *behaviour* the code could exhibit anywhere (colocation, cycles, direction, naming) is `PASS` when the behaviour is absent.

**Data-layer gate.** If the app makes no network request and talks to no
external client (no `fetch`/`axios`/SDK/websocket anywhere in scope),
STRUCT-16..17 are `N/A` with reason `no remote data layer`. Local persistence
alone (`localStorage`, IndexedDB) does not open the gate.

| ID | Check | How to verify | Default sev |
|---|---|---|---|
| STRUCT-01 | Domain grouping, not type grouping | Top-level `src/` splits by feature/domain, not solely by `components/ hooks/ utils/`. Fail when a type folder holds files from three or more unrelated domains | major |
| STRUCT-02 | Global `components/` stays domain-agnostic | Anything under `src/components/` that fetches, dispatches, or imports a feature/domain type. Ask: could it be copy-pasted into an unrelated project? | major |
| STRUCT-03 | Global folders stay small | `src/components/`, `src/utils/`, `src/hooks/` are not dumping grounds — fail at >25 files in one flat folder, or a single `utils.ts` over ~200 lines | minor |
| STRUCT-04 | Single-consumer helpers are colocated | A helper, hook, type or subcomponent imported by exactly one feature but living in a global folder belongs beside its consumer | minor |
| STRUCT-05 | A feature's surface is deliberate | Outsiders touch only what the feature means to expose. Either style passes: a curated `index.ts` naming that surface, or direct deep-path imports with no barrel at all (bulletproof-react now prefers this — a wildcard barrel defeats tree-shaking). **`FAIL` only on**: a barrel that `export *`s the feature's internals wholesale, an `index.ts` whose exports nobody outside the feature imports, or outsiders importing a module the barrel deliberately omits | major |
| STRUCT-06 | Features do not reach into each other | Grep every import specifier under `features/<a>/` for `features/<b>`. A feature importing another feature couples them permanently — the fix is to lift the shared piece into shared code, or compose both at the app layer and pass data down. Deep reaches (`features/<b>/internal/thing`) are the worse form and stay `major`. **Leaf exemption:** where the imported feature is a genuine leaf — it imports no other feature, and exports only types, pure data or pure functions — the architecture is sound and only the filing is wrong. Report that once, at `minor`, as misfiled shared code (the fix is a move to `lib/`), not once per importer. Real coupling — a feature importing another feature's components, hooks or state, or any import cycle between features — stays `major` | major |
| STRUCT-07 | Dependency direction is one-way | Two directions, both must hold: shared code (`components/`, `ui/`, `lib/`, `utils/`, `hooks/`, `types/`) never imports from `features/`, `app/`, `pages/` or `store/`; and `features/` never imports from the app layer (`app/`, `routes/`, `pages/`, `router`, `provider`). Flow is shared → features → app | blocker |
| STRUCT-08 | No import cycles | Two modules that import each other, directly or through a barrel — check barrel files first, they are where cycles hide | major |
| STRUCT-09 | Pages are thin | A route/page component holds layout and composition only; fail on data fetching, business rules or non-trivial state living in a page. **A composition root misfiled under `features/` is STRUCT-06's finding, not this one** — judge such a file on its contents alone here. **The bar is kind, not line count:** callbacks that wire a child's event to a hook the page owns are composition and `PASS` however many there are; a rule that decides *what the data means* inline in the page is a `FAIL` — concretely: validation, a fetch, a reducer/updater body that computes the next document state, or a derivation that reads a domain source (a catalogue, a rules table) to fill in a value. A callback that forwards its arguments to a hook or a child, adding nothing, stays `PASS` | major |
| STRUCT-10 | Global client state is minimal | `src/store/` (or a root context/provider) holds only genuinely app-wide state; feature-only state living there is a fail. Push state down | major |
| STRUCT-11 | Server state is not hand-rolled global state | Fetched data cached in a global store or context with manual `isLoading`/`error` bookkeeping instead of a query layer, or duplicated across features | minor |
| STRUCT-12 | `lib/` vs `utils/` split respected | `utils/` holds pure functions with no React and no third-party client; configured SDK/client instances (axios, sentry, supabase) belong in `lib/` | minor |
| STRUCT-13 | Imports use a path alias | Deep relative escapes (`../../..` or worse) where an alias (`@/…`) is configured, or no alias configured in a project deep enough to need one | minor |
| STRUCT-14 | Tests sit beside their subject | Test files live next to the module they test (or in a mirrored tree), and every non-trivial pure module in scope has one | minor |
| STRUCT-15 | Naming is consistent | One casing convention per artefact kind across the tree (components, hooks `useX`, modules); fail on a mixture, not on the choice itself | minor |
| STRUCT-16 | One configured API client | Every request goes through a single pre-configured client instance in `lib/` (base URL, headers, credentials, error interceptor set once). `FAIL` on bare `fetch`/`axios` calls scattered across components or features re-declaring base URL and headers | major |
| STRUCT-17 | Requests are declared, not inlined | Each endpoint is an exported fetcher colocated with its feature (`features/<name>/api/`), carrying the request/response types (ideally a runtime schema) and the query/mutation hook that consumes it. `FAIL` on a `fetch` inside a component body or effect, or a response typed `any`/untyped | major |
| STRUCT-18 | Environment and config are centralised | `import.meta.env`/`process.env` is read in one config module that exports typed, validated values; the rest of the app imports from it. No `import.meta.env`/`process.env` access anywhere in scope → **`N/A`**, reason `no env access` (matching BUILD-10 — the construct governs, not a free `PASS`). Otherwise `FAIL` on env access spread across features or on a raw `import.meta.env.X` used at a call site. **Placement only** — whether the values are validated is BUILD-10, do not report it here | minor |
