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
 *
 * The verbs are the doc's; the functions are the board's. A board is two
 * lists, so a move is asked twice — `place` for what it stands, `wire` for
 * what it does to the lines — and each of them switches on the row's verb
 * rather than every verb owning a function that has to return both.
 */

// A row that drops something. `attach` is the default — a box beside the
// subject — and `front` puts the box in front of it, handing it everything
// that was already arriving.
export type Drop = {
  title: string // what the menu row says
  type: TypeKey // what it drops
  label: string // what the line it draws says
  verb?: 'front'
  interaction?: 'Async' // Sync is the default and the line says nothing
  below?: true // attach only: a sidecar under the subject rather than downstream
  instances?: string // the new element comes up already ×N
}

// A row that drops nothing and says there are more of what is already there.
// Scaling out is not three cards: it is one card that says three, which is
// what keeps a line to it one line and the model a count.
export type Fanout = {
  title: string
  verb: 'fanout'
  instances: string
}

export type Action = Drop | Fanout

// A fanout has no type of its own — it multiplies the subject, so it wears the
// subject's mark and the subject's pigment.
export const drops = (action: Action): action is Drop => action.verb !== 'fanout'

// The rows, by shelf. See the map in docs/actions.md for what lands where; a
// shelf standing empty is a shelf whose rows want a verb not built yet.
export const ACTIONS = {
  'Actors & Externals': [],
  Applications: [
    { title: 'Scale out ×3', verb: 'fanout', instances: '3' },
    { title: 'Put behind load balancer', type: 'load-balancer', label: 'routes to', verb: 'front' },
    { title: 'Add database', type: 'relational-db', label: 'reads from and writes to' },
    { title: 'Add cache', type: 'memory-cache', label: 'reads through' },
    {
      title: 'Offload to queue',
      type: 'message-queue',
      label: 'publishes to',
      interaction: 'Async',
    },
  ],
  'APIs & Contracts': [
    { title: 'Put behind gateway', type: 'api-gateway', label: 'routes to', verb: 'front' },
  ],
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
    { title: 'Partition ×3', verb: 'fanout', instances: '3' },
    {
      title: 'Add consumer pool ×3',
      type: 'worker',
      label: 'feeds',
      interaction: 'Async',
      instances: '3',
    },
    {
      title: 'Add dead-letter queue',
      type: 'dead-letter-queue',
      label: 'fails into',
      below: true,
    },
  ],
  'Edge & Traffic': [
    { title: 'Front with CDN', type: 'cdn', label: 'misses to', verb: 'front' },
    { title: 'Add WAF', type: 'waf', label: 'passes clean traffic to', verb: 'front' },
  ],
  'Platform & Security': [
    { title: 'Put behind auth', type: 'auth-service', label: 'admits callers to', verb: 'front' },
  ],
  'Observability & Ops': [],
  'Analytics & ML': [],
  'Boundaries & Zones': [], // a frame is enclosed in, not acted on
  'Deployment & Infrastructure': [],
} satisfies Record<Category, Action[]>

// Where the new element lands. No layout engine: downstream goes to the right,
// upstream to the left, a sidecar below, and that is the whole of it — a board
// somebody is already arranging by hand does not want an autolayout moving
// what they placed. Far enough that a 200px card clears the one it came from.
const OFFSET = { x: 264, y: 0 }
const UPSTREAM = { x: -264, y: 0 }
const SIDECAR = { x: 0, y: 152 }

/**
 * Where the move stands its new element.
 *
 * It keeps the subject's parent and is offset from the subject's own position
 * — both are said relative to the same frame, so a card added beside one
 * standing in a Region stands in that Region too, and nesting.ts is never
 * asked.
 */
export function place(subject: ElementNodeType, action: Drop, id: string): ElementNodeType {
  const at = action.verb === 'front' ? UPSTREAM : action.below ? SIDECAR : OFFSET
  // A replica off a PostgreSQL primary is a PostgreSQL replica without anybody
  // saying so — but only where the new type's shortlist has a line for it, so
  // a queue beside a Postgres service does not come up running Postgres.
  const kept = subject.data.technology
  const inherits = !!kept && (TECH[action.type] as string[]).includes(kept)

  return {
    id,
    type: 'element',
    position: { x: subject.position.x + at.x, y: subject.position.y + at.y },
    ...(subject.parentId && { parentId: subject.parentId }),
    data: {
      type: action.type,
      label: TYPES[action.type].title,
      ...(inherits && { technology: kept }),
      ...(action.instances && { instances: action.instances }),
    },
  }
}

// The line the move draws, described, so it arrives saying what it does. The
// handles are the offset's, known without measuring: a node minted this frame
// has no width for faces() to read.
const drawn = (
  action: Drop,
  source: string,
  target: string,
  faces: readonly [string, string],
): RelationshipEdgeType => ({
  id: crypto.randomUUID(),
  source,
  target,
  sourceHandle: faces[0],
  targetHandle: faces[1],
  data: { label: action.label, ...(action.interaction && { interaction: action.interaction }) },
})

/**
 * What the move does to the lines.
 *
 * `attach` draws one and leaves the rest alone. `front` is the verb with real
 * logic: putting a service behind a load balancer is not a box beside it, it
 * is a box in front of every line that already arrives — so everything that
 * pointed at the subject now points at what stands in front of it, and the new
 * element hands its own line on. Five rows in the table are that one function.
 *
 * A re-pointed line keeps the flank it arrived on. The new element stands
 * where the traffic was already coming from, so the face that was right for
 * the subject is right for it.
 */
export function wire(
  edges: RelationshipEdgeType[],
  subject: ElementNodeType,
  action: Drop,
  id: string,
): RelationshipEdgeType[] {
  if (action.verb === 'front')
    return [
      ...edges.map((e) => (e.target === subject.id ? { ...e, target: id } : e)),
      drawn(action, id, subject.id, ['r', 'l']),
    ]

  const faces = action.below ? (['b', 't'] as const) : (['r', 'l'] as const)
  return [...edges, drawn(action, subject.id, id, faces)]
}

// What this thing can have done to it. A frame is enclosed in rather than
// acted on, and its shelf is empty anyway, so the one question is the type's.
export const actionsFor = (node: ElementNodeType): Action[] =>
  node.type === 'boundary' ? [] : ACTIONS[TYPES[node.data.type].category]
