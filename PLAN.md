# Archmage board — plan

A drag-and-drop canvas for system design review. IcePanel's C4 model as the base,
extended with typed technology blocks (databases, queues, APIs) that carry properties
and their own validation rules.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Model | Own model, IcePanel-shaped | Reuse its six object types; no API token, no vendor coupling, free to add properties and rules IcePanel has nowhere to put. |
| Stack | `web/` static React + TS + Vite | Smallest first PR. Board is a JSON document. Add a Python API only when the AI review needs one. |
| Canvas | React Flow (`@xyflow/react`) | MIT, no license key. Typed custom nodes, handles and edge routing map 1:1 onto typed C4 blocks. |
| Review | Per-type rule checks | Every block PR ships its kind, its property schema *and* its rules. Review is a live findings list, no AI required. |

Rejected: IcePanel API sync (their schema can't hold custom properties), LikeC4 DSL
(text-first, fights a drag-drop canvas), tldraw (paid license for production),
Excalidraw (element model isn't a typed node graph).

## The contract

Everything downstream extends these three shapes. If a later PR has to change them,
the design was wrong.

```jsonc
// board.json — the document. Nodes and edges only; the catalog is shipped code.
{
  "id": "b_...", "name": "Checkout redesign",
  "nodes": [{ "id": "n1", "kind": "postgres", "name": "Orders DB",
              "parent": "n0", "x": 240, "y": 80, "props": { "ha": "primary-replica" } }],
  "edges": [{ "id": "e1", "kind": "sql", "from": "n2", "to": "n1", "props": {} }]
}
```

```jsonc
// web/src/lib/catalog/data/<family>.json — one entry per block type. Each stacked PR adds one.
{ "kind": "postgres", "base": "store",        // base = IcePanel object type
  "label": "PostgreSQL", "icon": "lucide:database",
  "props": { "ha":  { "enum": ["single", "primary-replica", "multi-primary"] },
             "pii": { "type": "boolean" } } }
```

```ts
// web/src/features/review/rules/<family>.ts — a rule is a function, not a DSL.
type Rule = (b: Board) => Finding[]   // Finding = { nodeId?, edgeId?, severity, title, why }
export const rules: Rule[]
```

`base` is one of IcePanel's six object types — `actor, group, system, app, store,
component`. The extension is `kind` (the specialization), `props` (what the kind
knows about itself) and `rules` (what it knows about being used wrong).

Catalog files and rule files are merged by `import.meta.glob`, so a new family is a
new file and nothing else.

**Queues and APIs are mostly edge kinds.** A Kafka box asserts nothing; `publish` and
`subscribe` edges carry the semantics, and that is where the useful rules live. PR3
and PR4 each ship node kinds *and* edge kinds.

## The stack

| # | Branch | Ships |
|---|---|---|
| 1 | `feature/frontend` | Vite + React + TS in `web/`, React Flow canvas, palette drag-to-place, connect, inspector, catalog + rule engines, findings panel. Nothing persists — every load starts blank. Core six kinds only. |
| 2 | `feature/blocks-datastores` | relational, document, kv/cache, wide-column, search, object, analytics. Rules: store with no owner, store shared across systems, cache with no TTL, PII store with no backup. |
| 3 | `feature/blocks-messaging` | kafka, rabbitmq, sqs/sns, pubsub, nats + `publish`/`subscribe`/`stream` edges. Rules: topic with no consumer, no DLQ, at-least-once consumer not marked idempotent. |
| 4 | `feature/blocks-apis` | api-gateway, load-balancer, cdn, bff + `rest`/`grpc`/`graphql`/`websocket`/`webhook` edges. Rules: public edge without auth, sync chain depth > 3, cross-system sync with no timeout or retry. |
| 5 | `feature/blocks-compute` | service, worker, cron, serverless, spa, mobile. Rules: stateful service behind a load balancer with no session store, cron with no lock, serverless to relational DB with no pooler. |
| 6 | `feature/blocks-external` | third-party SaaS, IdP, payments, email/SMS. Rules: external dependency with no fallback, single point of failure. |

Each layer: `gh stack add feature/blocks-<family>`. PR2–6 touch only `lib/catalog/data/`,
`features/review/rules/` and a test — zero canvas code. If a family needs a new renderer, the
catalog engine was wrong and that is the bug to fix.

Icons are `lucide-react` components, mapped from catalog names in
`lib/catalog/icons.ts` (offline, MIT). No AWS/Azure/GCP icon art — those sets are
brand-restricted.

## Deliberately skipped

Multiplayer, server persistence, auth, undo/redo beyond React Flow's own, AI review.
Add multiplayer when a second person needs the same board; add the backend when the
board schema has stopped moving.
