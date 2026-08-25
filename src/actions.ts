import { TYPES, type TypeKey } from './c4'
import { TECH } from './catalog/tech'
import type { ElementNodeType } from './ElementNode'

/**
 * What you can *do* to a thing, as against what you can draw. The board has a
 * vocabulary of nouns and the work is all verbs, so this is the table that
 * names them — and it is written the way TECH is, per type rather than per
 * shelf: a Relational Database replicates and a File System does not, though
 * they share a shelf, exactly as they share no products.
 *
 * Inverted, though. An action names the types it applies to, rather than every
 * type naming its actions: *Add cache* is one row here instead of the same row
 * written out eleven times down the Applications shelf.
 *
 * One verb so far. `attach` drops an element beside the subject and draws the
 * line, described, in one press-and-pick. See docs/actions.md for the rest.
 */
export type Action = {
  title: string
  on: readonly TypeKey[] // the types it is offered on
  type: TypeKey // what it drops
  label: string // what the line it draws says
  interaction?: 'Sync' | 'Async'
}

// The six that `attach` alone buys. A browser or a phone has no database of its
// own and a stream is not dead-lettered: the row says where it belongs, which
// is the whole reason it is written this way round.
export const ACTIONS: Action[] = [
  {
    title: 'Add database',
    on: ['container', 'component', 'web-app', 'api-service', 'serverless-function', 'worker'],
    type: 'relational-db',
    label: 'reads from and writes to',
  },
  {
    title: 'Add cache',
    on: ['container', 'component', 'web-app', 'api-service', 'serverless-function', 'worker'],
    type: 'distributed-cache',
    label: 'reads through',
  },
  {
    title: 'Offload to queue',
    on: ['container', 'component', 'web-app', 'api-service', 'serverless-function'],
    type: 'message-queue',
    label: 'publishes to',
    interaction: 'Async',
  },
  {
    title: 'Add read replica',
    on: [
      'relational-db',
      'document-db',
      'key-value-store',
      'wide-column-store',
      'graph-db',
      'timeseries-db',
    ],
    type: 'read-replica',
    label: 'replicates to',
    interaction: 'Async',
  },
  {
    title: 'Add search index',
    on: ['relational-db', 'document-db', 'key-value-store', 'wide-column-store', 'object-store'],
    type: 'search-index',
    label: 'indexes into',
    interaction: 'Async',
  },
  {
    title: 'Add dead-letter queue',
    on: ['message-queue', 'pubsub-topic', 'task-queue', 'event-bus'],
    type: 'dead-letter-queue',
    label: 'dead-letters to',
    interaction: 'Async',
  },
]

export const actionsFor = (type: TypeKey) => ACTIONS.filter((a) => a.on.includes(type))

// Downstream is to the right, far enough that a card of ordinary width clears
// the one it came from. No layout engine: a board somebody is arranging by hand
// does not want one moving what they placed.
const OFFSET = 320

/**
 * Drop the action's element beside the subject, in whatever frame the subject
 * stands in. It inherits the subject's technology where the new type's
 * shortlist has a line for it, so a replica off a PostgreSQL primary is a
 * PostgreSQL replica without anybody saying so.
 *
 * Position is the subject's own, offset — both are said against the same
 * parent, so nothing is owed the conversion nesting.ts owes everywhere else.
 */
export function attach(
  nodes: ElementNodeType[],
  subject: ElementNodeType,
  action: Action,
  id: string,
): ElementNodeType[] {
  const tech = subject.data.technology
  return [
    ...nodes,
    {
      id,
      type: 'element',
      parentId: subject.parentId,
      position: { x: subject.position.x + OFFSET, y: subject.position.y },
      data: {
        type: action.type,
        label: TYPES[action.type].title,
        ...(tech && TECH[action.type].includes(tech) && { technology: tech }),
      },
    },
  ]
}
