---
name: fe-review-build
description: Build, typing and tooling pass of a frontend review — TypeScript strictness and escape hatches, component/prop typing, lint, format and pre-commit gates, machine-enforced import boundaries, integration test weighting, production build config, browser targets, env handling, dependency hygiene. Use when reviewing frontend project configuration, or as pass 7 of /frontend-review.
---

# Build and tooling pass (BUILD)

A standard nobody's tooling checks is not a standard. Prefer the gate that
fails a commit over the paragraph that asks nicely.

| ID | Check | How to verify | Default sev |
|---|---|---|---|
| BUILD-01 | TypeScript is strict | `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`. Note which are missing | major |
| BUILD-02 | No type escape hatches | `any`, `as` casts that assert away a real risk, `!` non-null assertions, `@ts-ignore`/`@ts-expect-error` without a reason comment | major |
| BUILD-03 | Index access is guarded | Lookups into `Record<string, T>`/arrays by dynamic key are treated as possibly-`undefined` at the use site, whether or not the compiler flag is on | major |
| BUILD-04 | A lint gate exists | ESLint (or equivalent) is configured with the React hooks and jsx-a11y rules and is runnable from `package.json` — absent linting is a finding | major |
| BUILD-05 | Typecheck and tests are wired into the build | `build` runs `tsc --noEmit`; `test` exists and is runnable; CI (or a documented command) runs both | major |
| BUILD-06 | Tests cover the logic that matters | Pure model/rules/validation logic has assertions, including failure and edge inputs; the interactive paths flagged in other passes have at least a smoke test | major |
| BUILD-07 | Production build config | Judge the effective config, not whether it was written down: the bundler's defaults (minify on, chunk warnings live, dev tooling excluded) are a `PASS`. `FAIL` only on a setting that is actually wrong — minification off, warnings silenced, sourcemaps exposing source in production, dev plugins in the prod bundle | minor |
| BUILD-08 | Browser targets are declared | The bundler's default target is a `PASS` — an undeclared target is not itself a finding. `FAIL` only when the code in scope uses syntax or an API outside that default's baseline (`structuredClone`, `Array.at`, `:has()`, popover, top-level await) with no declared `build.target`/`browserslist` widening or narrowing to match | minor |
| BUILD-09 | Dev-only code cannot ship | Debug flags, mock data, `console.*` in hot paths, test hooks guarded by `import.meta.env.DEV`/`NODE_ENV` | minor |
| BUILD-10 | Environment config is explicit | Required env vars documented and validated at startup rather than silently `undefined` | minor |
| BUILD-11 | Dependency hygiene | No unused deps, no two libraries doing the same job, runtime vs dev deps correctly split, lockfile committed | minor |
| BUILD-12 | Static assets and entry HTML are complete | Favicon, `theme-color`/`color-scheme` meta, description meta, and any `<noscript>` fallback the app needs | minor |
| BUILD-13 | Dead code | Exported symbols with no importer, unreachable branches, commented-out blocks left in place | minor |
| BUILD-14 | Tests exercise behaviour, not internals | Weight integration over unit (the testing trophy): the app's main user flows have at least one test that renders the real component tree and drives it the way a user would. `FAIL` on a suite that is only pure-function unit tests while the UI has real interaction, or on tests asserting internal state, hook return values or implementation details instead of what renders. Queries by role/label/text `PASS`; queries by test-id everywhere, or `container.querySelector` on class names, is a `FAIL` | major |
| BUILD-15 | Boundaries are enforced by tooling, not by hope | In a project with `features/`, the import rules from STRUCT-06/07 are machine-checked — `import/no-restricted-paths` zones, an `eslint-plugin-boundaries` config, or the equivalent in the project's linter. A convention documented only in prose or a README is a `FAIL`; convention nobody enforces decays. If STRUCT-06/07 failed this run, say so in the `Fix` — the zones must be written against the *intended* architecture, so the boundary violations get resolved first | minor |
| BUILD-16 | Format and pre-commit gate | A formatter is configured (Prettier or the linter's formatter) *and* runs somewhere automatic — pre-commit hook (husky + lint-staged) or a CI check. A config file with no gate running it is a `FAIL` | minor |
| BUILD-17 | Component and prop typing is honest | Props have an explicit type/interface; no `React.FC` relying on implicit `children`; props whose valid combinations are constrained (mutually exclusive, or one required only when another is set) are modelled as a discriminated union rather than as independently-optional fields — a component that merely tolerates several props being set at once, with a documented precedence, is a `PASS`; event and ref types come from React's own types, not `any`. `FAIL` on a prop typed `any`/`object`/`Function`, or on a component whose props are inferred from an untyped spread | major |
