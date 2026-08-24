import { TYPES, type TypeKey } from './c4'
import { TECH } from './catalog/tech'
import type { ElementNodeType } from './ElementNode'
import type { Category } from './fields'
import type { RelationshipEdgeType } from './RelationshipEdge'

/**
 * What you can do to a thing on the board, as against what you can put on it.
 * The rack has a vocabulary of nouns and the work is all verbs: adding a read
 * replica is fifteen presses, and not one of them is the decision. See
 * docs/actions.md.
 *
 * One table keyed by category, the shape fields.ts already won — a shelf
 * without a line here is a compile error the same way a category without
 * fields is. A verb never grows; the table does.
 */

export type Action = {
  title: string // what the menu row says
  type: TypeKey // what it drops
  label: string // what the line it draws says
  interaction?: 'Async' // Sync is the default and the line says nothing
  below?: true // a sidecar under the subject rather than downstream of it
}

// The rows, by shelf. Six of them so far, and every one is an `attach` — the
// shelves standing empty are the rows that want a verb this branch has not
// built. See the map in docs/actions.md for what lands where.
export const ACTIONS = {
  'Actors & Externals': [],
  Applications: [
    { title: 'Add database', type: 'relational-db', label: 'reads from and writes to' },
    { title: 'Add cache', type: 'memory-cache', label: 'reads through' },
    {
      title: 'Offload to queue',
      type: 'message-queue',
      label: 'publishes to',
      interaction: 'Async',
    },
  ],
  'APIs & Contracts': [],
  'Data Stores': [
    { title: 'Add read replica', type: 'read-replica', label: 'replicates to', below: true },
    {
      title: 'Add search index',
      type: 'search-index',
      label: 'indexes into',
      interaction: 'Async',
    },
  ],
  Caching: [],
  'Messaging & Streaming': [
    {
      title: 'Add dead-letter queue',
      type: 'dead-letter-queue',
      label: 'fails into',
      below: true,
    },
  ],
  'Edge & Traffic': [],
  'Platform & Security': [],
  'Observability & Ops': [],
  'Analytics & ML': [],
  'Boundaries & Zones': [], // a frame is enclosed in, not acted on
  'Deployment & Infrastructure': [],
} satisfies Record<Category, Action[]>

// Where the new element lands. No layout engine: downstream goes to the right
// and a sidecar goes below, and that is the whole of it — a board somebody is
// already arranging by hand does not want an autolayout moving what they
// placed. Far enough that a 200px card clears the one it came from.
const OFFSET = { x: 264, y: 0 }
const SIDECAR = { x: 0, y: 152 }

/**
 * Drop an element beside the subject and wire it up, described.
 *
 * The new node keeps the subject's parent and is offset from the subject's own
 * position — both are said relative to the same frame, so a card added beside
 * one standing in a Region stands in that Region too, and nesting.ts is never
 * asked. The handles are the offset's, known without measuring: a node minted
 * this frame has no width yet for faces() to read.
 */
export function attach(subject: ElementNodeType, action: Action, id: string) {
  const at = action.below ? SIDECAR : OFFSET
  // A replica off a PostgreSQL primary is a PostgreSQL replica without anybody
  // saying so — but only where the new type's shortlist has a line for it, so
  // a queue beside a Postgres service does not come up running Postgres.
  const kept = subject.data.technology
  const inherits = !!kept && (TECH[action.type] as string[]).includes(kept)

  const node: ElementNodeType = {
    id,
    type: 'element',
    position: { x: subject.position.x + at.x, y: subject.position.y + at.y },
    ...(subject.parentId && { parentId: subject.parentId }),
    data: {
      type: action.type,
      label: TYPES[action.type].title,
      ...(inherits && { technology: kept }),
    },
  }

  const edge: RelationshipEdgeType = {
    id: crypto.randomUUID(),
    source: subject.id,
    target: id,
    sourceHandle: action.below ? 'b' : 'r',
    targetHandle: action.below ? 't' : 'l',
    data: { label: action.label, ...(action.interaction && { interaction: action.interaction }) },
  }

  return { node, edge }
}

// What this thing can have done to it. A frame is enclosed in rather than
// acted on, and its shelf is empty anyway, so the one question is the type's.
export const actionsFor = (node: ElementNodeType): Action[] =>
  node.type === 'boundary' ? [] : ACTIONS[TYPES[node.data.type].category]
