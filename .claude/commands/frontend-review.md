---
description: Full frontend review — a11y, performance, React correctness, security, UX resilience, CSS/responsive, build hygiene, project structure. Deterministic checklist, one row per check.
argument-hint: "[paths or section names, e.g. web/src | a11y perf | all]"
allowed-tools: Read, Grep, Glob, Bash(npm:*), Bash(npx:*), Bash(git diff:*), Bash(git status:*), Bash(wc:*), Bash(du:*)
---

# Frontend review

Review the frontend for every checklist item in the eight review skills. This is
an audit, not a refactor: **report only, change no files** unless the user asks
for fixes afterwards.

## 1. Scope

Target: `$ARGUMENTS` — if empty, review `web/index.html`, `web/src/**/*`,
`web/vite.config.ts`, `web/tsconfig.json`, `web/package.json`.

**Tooling config is always in scope**, whatever the target: the project's linter,
formatter, pre-commit and CI config (`.eslintrc*`/`eslint.config.*`,
`.oxlintrc.json`, `.prettierrc*`, `.husky/`, `.github/workflows/`, and the repo
root equivalents). BUILD-04, BUILD-15 and BUILD-16 cannot be verdicted without
them, and "not found" is a real answer only after looking.

If the argument names sections (`a11y`, `perf`, `react`, `security`, `ux`,
`css`, `build`, `structure`), run only those. Otherwise run all eight.

Resolve the file list with Glob first and sort it. **Read every file in scope
end to end before reporting anything.** A check answered from a grep hit alone
is a guess; grep locates candidates, reading confirms them.

**Scope is a hard boundary.** `node_modules` and any dependency's own source or
stylesheet are never in scope and never evidence. Where a library's behaviour
matters, anchor the finding to the file in scope that uses it, and reason from
the library's documented public behaviour — never from reading its internals.
Markup a library renders that the app does not author is out of scope too.

## 2. Passes

Run these skills in this exact order, one pass each, completing a pass before
starting the next:

| Order | Skill | Prefix |
|---|---|---|
| 1 | `fe-review-a11y` | `A11Y` |
| 2 | `fe-review-perf` | `PERF` |
| 3 | `fe-review-react` | `REACT` |
| 4 | `fe-review-security` | `SEC` |
| 5 | `fe-review-ux` | `UX` |
| 6 | `fe-review-css` | `CSS` |
| 7 | `fe-review-build` | `BUILD` |
| 8 | `fe-review-structure` | `STRUCT` |

Each skill owns its checks exclusively. If a finding fits two sections, report
it under the skill that owns the check ID and do not repeat it.

## 3. Verdict rules — apply literally

For **every** check ID in a running skill, emit exactly one row — no skipped ID,
no invented ID, no ID twice, no two IDs merged. Before printing a table, count:
its row count must equal the skill's check count. A11Y 15, PERF 15, REACT 17,
SEC 14, UX 15, CSS 14, BUILD 17, STRUCT 18.

Decide each row in this order — the first branch that applies wins:

1. Is the check's pass condition *absence* — no `eval`, no secrets, no unsanitized
   sink, no `!important`? Then absence is **`PASS`**, never `N/A`. `N/A` is only
   for a check that tests how an existing construct is handled when that
   construct is nowhere in scope (no `<img>` to size, no `postMessage` to
   origin-check, no env var to validate). One-line reason required.
   Where a check bundles both — "images are sized *and* no oversized asset is
   used" — the construct governs: no `<img>` anywhere means `N/A`, not a free
   `PASS` on the absence half.
2. Is the defect present, with `file:line` evidence you read? **Yes → `FAIL`.**
3. Otherwise **`PASS`**, citing where you looked.

Uncertain at step 2? It is `PASS`. A maybe-finding is noise, and noise is what
makes two runs of this command disagree. Report what the code does, never what a
future version might do. Framework or tool defaults count as `PASS` unless a
specific default is demonstrably wrong for this app.

A row's `Status` and its prose must agree: if you wrote a defect in `Finding`,
the status is `FAIL`. A `PASS` or `N/A` row carries `—` in `Sev`, `Finding` and
`Fix`. Never emit a correction after a table — fix the row before printing it.

**On a `FAIL` row, severity is the skill table's default value for that check ID.
Copy it; do not re-grade.** The defaults already encode the rubric — `blocker` = data loss,
crash, reachable security hole, or a control unusable by keyboard/AT users;
`major` = a WCAG 2.2 AA failure, a Core Web Vitals breach (LCP > 2.5s /
INP > 200ms / CLS > 0.1), or a correctness bug on a real path; `minor` =
quality or latent risk. The only permitted deviation is a condition the check's
own row names as an exception.

## 4. Output format

One section per pass, in pass order, rows in ID order:

```
## A11Y — 2 blockers, 1 major, 0 minors
| ID | Status | Sev | Where | Finding | Fix |
|---|---|---|---|---|---|
| A11Y-01 | FAIL | blocker | App.tsx:99 | palette chip is a div with draggable only | make it a button, add keydown |
| A11Y-02 | PASS | — | — | — | — |
| A11Y-03 | N/A | — | — | no form elements in scope | — |
```

Keep `Finding` and `Fix` to one line each — the fix names the change, it is not
a patch. Then close with:

```
## Top findings
1. <sev> <ID> — <one line>   (max 10, sorted by severity then ID)

## Counts
blockers N · majors N · minors N · pass N · n/a N
```

Nothing else. No preamble, no praise, no "overall the code is clean" paragraph.

## 5. Where the checks come from

WCAG 2.2 AA, Core Web Vitals thresholds, the React docs (effects, purity,
keys), OWASP client-side risks, and — for structure, data layer, standards and
testing weight — [bulletproof-react](https://github.com/alan2207/bulletproof-react),
the [React TypeScript cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
and Testing Library's guiding principles. When a check cites a convention, it
cites one of these, not taste.
