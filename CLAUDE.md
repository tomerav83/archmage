# Archmage

React board editor in `web/`. Layout in README.md, roadmap in PLAN.md.

- Layers flow one way — `lib → features → app` — enforced by oxlint `no-restricted-imports`.
- Features never import features at runtime (type imports are fine); compose in `app/editor.tsx`.
- Before hand-rolling canvas behaviour, check what `@xyflow/react` already ships — connecting,
  deleting, selection and the connection ghost line are all built in.
- Name files for their role (`codec.ts`, `use-board.ts`) — never model/utils/misc.
- `cd web && npm run check` must pass before any commit (format, lint, typecheck, tests).
- A refactor is not done until it is committed.
