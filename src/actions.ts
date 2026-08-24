import { TYPES, type TypeKey } from './c4'
import { TECH } from './catalog/tech'
import type { ElementNodeType } from './ElementNode'
import { CATALOG, type Category, COMMON, type FieldKey, fieldsFor } from './fields'
import { enclose, frameAround } from './nesting'
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

// The two rows that name a type without standing it beside the subject. They
// are the same shape and stay two, because one `verb: 'becomes' | 'replicate'`
// is a discriminant the compiler will not narrow away to nothing — and the
// canvas leaning on that narrowing is what keeps the last branch a Drop.

// An in-memory cache that becomes a distributed one is the same box with the
// same lines into it.
export type Becomes = {
  title: string
  verb: 'becomes'
  type: TypeKey // what it turns into
}

// A second region is the same drawing again, and eighty-five presses of it.
export type Replicate = {
  title: string
  verb: 'replicate'
  type: TypeKey // the frame the copy stands in
}

export type Action = Drop | Fanout | Becomes | Replicate

// Only two of the verbs stand a new element; the other two work on the card
// that was right-clicked.
export const drops = (action: Action): action is Drop =>
  action.verb === undefined || action.verb === 'front'

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
    { title: 'Serve it over GraphQL', verb: 'becomes', type: 'graphql-api' },
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
  Caching: [{ title: 'Make it distributed', verb: 'becomes', type: 'distributed-cache' }],
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
  'Analytics & ML': [{ title: 'Batch → stream', verb: 'becomes', type: 'stream-processor' }],
  'Boundaries & Zones': [{ title: 'Replicate to region', verb: 'replicate', type: 'region' }],
  'Deployment & Infrastructure': [
    { title: 'Replicate to zone', verb: 'replicate', type: 'region' },
  ],
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

/**
 * The subject, as another type. It keeps its id, so its position, its frame
 * and every line drawn to it are untouched — swapping a card by hand means
 * deleting it and drawing all of those again, which is the whole cost this
 * takes away.
 *
 * It keeps every field the new type still has a slot for and sheds the rest: a
 * cache's TTL means nothing to a stream. Technology goes by the same rule
 * `place` uses — kept only where the new type's shortlist has a line for it,
 * since the picker has no free-text line and a value it cannot offer is a
 * value nobody could have typed.
 */
export function becomes(node: ElementNodeType, type: TypeKey): ElementNodeType['data'] {
  const slots = new Set([...COMMON, ...fieldsFor(type), ...CATALOG].map((f) => f.key))
  const kept = Object.entries(node.data).filter(
    ([key, value]) =>
      slots.has(key as FieldKey) &&
      (key !== 'technology' || (TECH[type] as string[]).includes(value as string)),
  )
  return {
    ...Object.fromEntries(kept),
    type,
    // A card still wearing its type's own title was never named, so it takes
    // the new one's; a card somebody named keeps the name they gave it.
    label: node.data.label === TYPES[node.data.type].title ? TYPES[type].title : node.data.label,
  }
}

// What this thing can have done to it: its shelf's row, less whatever it
// already is, since becoming what you are is not a move. A frame answers the
// same question as a card now — replicating a region is the one move that only
// a frame has — so the type is the whole of it, as it is everywhere else.
export const actionsFor = (node: ElementNodeType): Action[] =>
  ACTIONS[TYPES[node.data.type].category].filter(
    (a: Action) => a.verb !== 'becomes' || a.type !== node.data.type,
  )

// Clear of the frame it was copied from, by the width of it.
const GAP = 48

/**
 * The subject again, standing in a frame beside it.
 *
 * A second region is the same drawing a second time, and nothing on this board
 * copies: eighty-five presses to redraw what is already there, which is the
 * largest number in docs/actions.md and the one this takes to three.
 *
 * Everything under the subject comes with it. Only the subject itself is
 * moved: its descendants are said relative to it, so shifting the one shifts
 * the family, and `enclose` rebases it into the new frame the way it rebases
 * anything else. The frame is `frameAround` asked about the original and then
 * stepped clear of it, so the copy is padded exactly as an enclosure is.
 *
 * The copies keep the lines the originals had. An end inside the family is
 * remapped to its copy, so a service that talked to its own database talks to
 * the copy of it; an end outside is left alone, so both regions still answer
 * the same DNS.
 */
export function replicate(
  nodes: ElementNodeType[],
  edges: RelationshipEdgeType[],
  subject: ElementNodeType,
  type: TypeKey,
  id: string,
) {
  // The subject and everything under it, however deep — a region holds a
  // cluster holds a node, and all three are the copy.
  const family = new Set([subject.id])
  for (const n of nodes)
    for (let p = n.parentId; p; p = nodes.find((m) => m.id === p)?.parentId)
      if (family.has(p)) {
        family.add(n.id)
        break
      }

  const copies = new Map([...family].map((held) => [held, crypto.randomUUID()]))
  const frame = frameAround(nodes, [subject.id], id, type)
  if (!frame) return { nodes, edges }
  frame.position = { x: frame.position.x + (frame.width ?? 0) + GAP, y: frame.position.y }

  const shift = (frame.width ?? 0) + GAP
  const clones = nodes
    .filter((n) => family.has(n.id))
    .map((n) => ({
      ...n,
      id: copies.get(n.id) as string,
      // The subject steps right with its new frame; everything under it is
      // said relative to the subject and travels without being touched.
      ...(n.id === subject.id
        ? { position: { x: n.position.x + shift, y: n.position.y } }
        : { parentId: copies.get(n.parentId as string) }),
      selected: false,
    }))

  return {
    nodes: enclose([...nodes, ...clones], [copies.get(subject.id) as string], frame),
    edges: [
      ...edges,
      ...edges
        .filter((e) => family.has(e.source) || family.has(e.target))
        .map((e) => ({
          ...e,
          id: crypto.randomUUID(),
          source: copies.get(e.source) ?? e.source,
          target: copies.get(e.target) ?? e.target,
        })),
    ],
  }
}
