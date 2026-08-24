import { describe, expect, it } from 'vitest'
import {
  ACTIONS,
  type Action,
  actionsFor,
  type Drop,
  drops,
  type Fanout,
  place,
  wire,
} from './actions'
import { TYPES } from './c4'
import { TECH } from './catalog/tech'
import type { ElementNodeType } from './ElementNode'
import { fieldsFor } from './fields'
import type { RelationshipEdgeType } from './RelationshipEdge'

const card = (
  id: string,
  type: string,
  over: Partial<ElementNodeType['data']> = {},
  parentId?: string,
) =>
  ({
    id,
    type: 'element',
    position: { x: 100, y: 60 },
    ...(parentId && { parentId }),
    data: { type, label: id, ...over },
  }) as ElementNodeType

const line = (id: string, source: string, target: string) =>
  ({ id, source, target, targetHandle: 'l' }) as RelationshipEdgeType

const row = (shelf: keyof typeof ACTIONS, title: string) =>
  (ACTIONS[shelf] as Action[]).find((a) => a.title === title) as Drop

const DATABASE = row('Applications', 'Add database')
const REPLICA = row('Data Stores', 'Add read replica')
const QUEUE = row('Applications', 'Offload to queue')
const BALANCER = row('Applications', 'Put behind load balancer')

describe('where a move stands its element', () => {
  it('goes downstream, upstream, or below, and nowhere else', () => {
    expect(place(card('a', 'api-service'), DATABASE, 'b').position).toEqual({ x: 364, y: 60 })
    expect(place(card('a', 'api-service'), BALANCER, 'b').position).toEqual({ x: -164, y: 60 })
    expect(place(card('a', 'relational-db'), REPLICA, 'b').position).toEqual({ x: 100, y: 212 })
  })

  // Both positions are said relative to the same frame, which is the whole
  // reason nesting.ts is never asked: a card added beside one standing in a
  // Region stands in that Region too, at the offset and nothing else.
  it('joins whatever frame the subject stands in', () => {
    expect(place(card('a', 'api-service', {}, 'region'), DATABASE, 'b').parentId).toBe('region')
    expect(place(card('a', 'api-service'), DATABASE, 'b').parentId).toBeUndefined()
  })

  it('names itself off the type it dropped, so the panel need not open', () => {
    const node = place(card('a', 'api-service'), DATABASE, 'b')
    expect(node.data.type).toBe('relational-db')
    expect(node.data.label).toBe(TYPES['relational-db'].title)
  })
})

describe('what the new element inherits', () => {
  it('takes the technology where the new type has a line for it', () => {
    const primary = card('a', 'relational-db', { technology: 'PostgreSQL' })
    expect(place(primary, REPLICA, 'b').data.technology).toBe('PostgreSQL')
    expect(TECH['read-replica']).toContain('PostgreSQL')
  })

  // A queue beside a Postgres service does not come up running Postgres.
  it('leaves it alone where the new type has no line for it', () => {
    const service = card('a', 'api-service', { technology: 'Go' })
    expect(TECH['message-queue']).not.toContain('Go')
    expect(place(service, QUEUE, 'b').data.technology).toBeUndefined()
  })

  it('has nothing to inherit from a subject that never said', () => {
    expect(place(card('a', 'relational-db'), REPLICA, 'b').data.technology).toBeUndefined()
  })
})

describe('the line a move draws', () => {
  const subject = card('a', 'api-service')

  it('arrives described, from the face the offset says it left', () => {
    const [edge] = wire([], subject, DATABASE, 'b')
    expect(edge?.source).toBe('a')
    expect(edge?.target).toBe('b')
    expect(edge?.data?.label).toBe('reads from and writes to')
    expect([edge?.sourceHandle, edge?.targetHandle]).toEqual(['r', 'l'])
  })

  it('says when nobody is waiting, and stays quiet when they are', () => {
    expect(wire([], subject, QUEUE, 'b')[0]?.data?.interaction).toBe('Async')
    // Sync is the default the edge already draws, so the row does not say it
    expect(wire([], subject, DATABASE, 'b')[0]?.data?.interaction).toBeUndefined()
  })

  it('sends a sidecar out of the underside', () => {
    const [edge] = wire([], card('a', 'relational-db'), REPLICA, 'b')
    expect([edge?.sourceHandle, edge?.targetHandle]).toEqual(['b', 't'])
  })

  it('leaves every line already on the board alone', () => {
    const held = [line('e1', 'x', 'a'), line('e2', 'a', 'y')]
    expect(wire(held, subject, DATABASE, 'b').slice(0, 2)).toEqual(held)
  })
})

// The one verb with real logic. Putting a service behind a load balancer is
// not a box beside it — it is a box in front of every line that arrives.
describe('the upstream insert', () => {
  const subject = card('a', 'api-service')

  it('hands the new element everything that pointed at the subject', () => {
    const held = [line('e1', 'x', 'a'), line('e2', 'y', 'a')]
    const after = wire(held, subject, BALANCER, 'lb')
    expect(after.filter((e) => e.target === 'lb').map((e) => e.id)).toEqual(['e1', 'e2'])
    expect(after.filter((e) => e.target === 'a')).toHaveLength(1)
  })

  it('leaves what the subject points at where it was', () => {
    const out = line('e3', 'a', 'z')
    expect(wire([out], subject, BALANCER, 'lb')).toContainEqual(out)
  })

  // The new element stands where the traffic was already coming from, so the
  // face that was right for the subject is right for it.
  it('lets a re-pointed line keep the flank it arrived on', () => {
    const above = { ...line('e1', 'x', 'a'), targetHandle: 't' } as RelationshipEdgeType
    expect(wire([above], subject, BALANCER, 'lb')[0]?.targetHandle).toBe('t')
  })

  it('wires itself on to the subject, described', () => {
    const [edge] = wire([], subject, BALANCER, 'lb')
    expect(edge?.source).toBe('lb')
    expect(edge?.target).toBe('a')
    expect(edge?.data?.label).toBe('routes to')
    expect([edge?.sourceHandle, edge?.targetHandle]).toEqual(['r', 'l'])
  })

  it('is five rows of the table and one function', () => {
    const fronts = (Object.values(ACTIONS).flat() as Action[]).filter((a) => a.verb === 'front')
    expect(fronts.map((a) => a.title)).toEqual([
      'Put behind load balancer',
      'Put behind gateway',
      'Front with CDN',
      'Add WAF',
      'Put behind auth',
    ])
  })
})

// Scaling out is not three cards. It is one card that says three, so the one
// line already drawn to it stays one line and the model holds a count.
describe('the fanout', () => {
  it('drops nothing at all, so place and wire are never asked', () => {
    const scale = row('Applications', 'Scale out ×3')
    expect(drops(scale as unknown as Action)).toBe(false)
    expect((scale as unknown as Fanout).instances).toBe('3')
  })

  it('comes up already counted where the row drops something', () => {
    const pool = row('Messaging & Streaming', 'Add consumer pool ×3')
    expect(place(card('a', 'message-queue'), pool, 'b').data.instances).toBe('3')
  })

  it('leaves the count off everything that never asked for one', () => {
    expect(place(card('a', 'api-service'), DATABASE, 'b').data.instances).toBeUndefined()
  })

  // The field is the one the panel already renders, so a count typed into the
  // rail and a count stamped by a row are the same fact on the same key.
  it('writes the field the panel writes', () => {
    const counted = (type: string) => fieldsFor(type as never).some((f) => f.key === 'instances')
    expect(counted('api-service')).toBe(true)
    expect(counted('event-stream')).toBe(true)
    expect(counted('instance')).toBe(true)
    // and not everywhere: a database does not scale by saying three
    expect(counted('relational-db')).toBe(false)
  })
})

describe('what a thing can have done to it', () => {
  it('is its shelf row, so shelf-mates offer the same verbs', () => {
    expect(actionsFor(card('a', 'worker'))).toBe(actionsFor(card('b', 'api-service')))
  })

  it('is nothing at all for a frame, which is enclosed in rather than acted on', () => {
    const frame = { ...card('z', 'system-boundary'), type: 'boundary' } as ElementNodeType
    expect(actionsFor(frame)).toEqual([])
  })

  // The bargain fields.ts makes: a shelf with no line here is a compile error,
  // and every row it does have has to name a type the registry owns.
  it('drops only types the registry knows', () => {
    for (const rows of Object.values(ACTIONS))
      for (const action of rows as Action[])
        if (drops(action)) expect(TYPES[action.type]).toBeTruthy()
  })
})
