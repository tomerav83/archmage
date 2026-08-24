import { describe, expect, it } from 'vitest'
import {
  ACTIONS,
  type Action,
  actionsFor,
  type Bundle,
  becomes,
  type Drop,
  drops,
  type Fanout,
  place,
  replicate,
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

// The same box with the same lines into it. Replacing a card by hand means
// drawing every one of those again, which is the cost this takes away.
describe('the swap in place', () => {
  it('keeps every field the new type still has a slot for', () => {
    const cache = card('a', 'memory-cache', {
      description: 'session store',
      owner: 'Payments team',
      status: 'Live',
      ttl: '5m',
    })
    const after = becomes(cache, 'distributed-cache')
    expect(after.description).toBe('session store')
    expect(after.owner).toBe('Payments team')
    expect(after.status).toBe('Live')
    expect(after.type).toBe('distributed-cache')
    // Caching keeps its TTL across the shelf, so this one survives
    expect(after.ttl).toBe('5m')
  })

  it('sheds the fields the new type has no slot for', () => {
    // A cache's TTL means nothing to a stream processor.
    const cache = card('a', 'memory-cache', { ttl: '5m' })
    expect(becomes(cache, 'stream-processor').ttl).toBeUndefined()
  })

  // The same rule place() uses: the picker has no free-text line, so a value
  // it cannot offer is a value nobody could have typed.
  it('keeps the technology only where the new type has a line for it', () => {
    expect(
      becomes(card('a', 'memory-cache', { technology: 'Redis' }), 'distributed-cache').technology,
    ).toBe('Redis')
    expect(
      becomes(card('a', 'memory-cache', { technology: 'Memcached' }), 'stream-processor')
        .technology,
    ).toBeUndefined()
  })

  it('takes the new title where nobody had named it', () => {
    const bare = card('a', 'memory-cache', { label: TYPES['memory-cache'].title })
    expect(becomes(bare, 'distributed-cache').label).toBe(TYPES['distributed-cache'].title)
  })

  it('keeps the name somebody gave it', () => {
    const named = card('a', 'memory-cache', { label: 'Session Store' })
    expect(becomes(named, 'distributed-cache').label).toBe('Session Store')
  })

  // Becoming what you already are is not a move, so the row is not offered.
  it('is kept off the menu of the thing it would turn into', () => {
    const titles = (type: string) => actionsFor(card('a', type)).map((a) => a.title)
    expect(titles('memory-cache')).toContain('Make it distributed')
    expect(titles('distributed-cache')).not.toContain('Make it distributed')
  })
})

// A row whose run is a list of the rows above it: four elements and four
// lines and one decision. No new machinery — the verbs never grow, the table
// does.
describe('a bundle', () => {
  const INSTRUMENT = row('Applications', 'Instrument') as unknown as Bundle
  const subject = card('a', 'api-service')

  it('is a list of drops the table already knows how to run', () => {
    expect(INSTRUMENT.verb).toBe('bundle')
    expect(INSTRUMENT.run.map((r) => r.type)).toEqual([
      'metrics-store',
      'log-aggregator',
      'tracing-backend',
    ])
  })

  // All three leave the same flank, so each steps clear of the one before it.
  it('steps each element clear of the last', () => {
    const ys = INSTRUMENT.run.map((r, i) => place(subject, r, 'x', i).position.y)
    expect(ys).toEqual([60, 212, 364])
    // and they all stand downstream, on the same column
    const xs = INSTRUMENT.run.map((r, i) => place(subject, r, 'x', i).position.x)
    expect(new Set(xs)).toEqual(new Set([364]))
  })

  it('leaves a row that is not in a bundle where it was', () => {
    expect(place(subject, DATABASE, 'b').position).toEqual({ x: 364, y: 60 })
  })

  it('draws one described line per element', () => {
    const after = INSTRUMENT.run.reduce(
      (held, r, i) => wire(held, subject, r, `x${i}`),
      [] as RelationshipEdgeType[],
    )
    expect(after).toHaveLength(3)
    expect(after.map((e) => e.target)).toEqual(['x0', 'x1', 'x2'])
    expect(after.map((e) => e.data?.label)).toEqual([
      'reports metrics to',
      'ships logs to',
      'emits spans to',
    ])
    // nobody waits on telemetry
    expect(after.every((e) => e.data?.interaction === 'Async')).toBe(true)
  })
})

describe('what a thing can have done to it', () => {
  it('is its shelf row, so shelf-mates offer the same verbs', () => {
    expect(actionsFor(card('a', 'worker'))).toEqual(actionsFor(card('b', 'api-service')))
  })

  it('reads a frame the same way it reads a card — off the type', () => {
    const frame = { ...card('z', 'system-boundary'), type: 'boundary' } as ElementNodeType
    expect(actionsFor(frame).map((a) => a.title)).toEqual(['Replicate to region'])
  })

  // The bargain fields.ts makes: a shelf with no line here is a compile error,
  // and every row it does have has to name a type the registry owns.
  it('drops only types the registry knows', () => {
    for (const rows of Object.values(ACTIONS))
      for (const action of rows as Action[])
        if (drops(action)) expect(TYPES[action.type]).toBeTruthy()
  })
})

// A second region is the same drawing again, and eighty-five presses of it.
describe('the replica', () => {
  // outer frame at 0,0 holding a service at 40,60 that reads its own database
  // at 300,60; something outside the frame calls the service.
  const board = () =>
    [
      {
        id: 'z',
        type: 'boundary',
        position: { x: 0, y: 0 },
        width: 600,
        height: 400,
        data: { type: 'system-boundary', label: 'Payments' },
      },
      { ...card('svc', 'api-service'), position: { x: 40, y: 60 }, parentId: 'z' },
      { ...card('db', 'relational-db'), position: { x: 300, y: 60 }, parentId: 'z' },
      { ...card('out', 'single-page-app'), position: { x: -400, y: 60 } },
    ] as ElementNodeType[]

  const lines = () => [line('e1', 'svc', 'db'), line('e2', 'out', 'svc')]

  const copied = () => replicate(board(), lines(), board()[0] as ElementNodeType, 'region', 'r')

  it('stands a frame of the type the row named, beside the original', () => {
    const { nodes } = copied()
    const region = nodes.find((n) => n.id === 'r')
    expect(region?.data.type).toBe('region')
    expect(region?.position.x).toBeGreaterThan(0)
  })

  it('brings everything under the subject, however deep', () => {
    // four nodes in, plus the region and three copies: the frame, the service
    // and the database. The card outside the frame is not copied.
    expect(copied().nodes).toHaveLength(4 + 1 + 3)
  })

  it('gives every copy an id of its own', () => {
    const ids = copied().nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps the copies inside the new frame, arranged as they were', () => {
    const { nodes } = copied()
    const clone = nodes.find((n) => n.parentId === 'r') as ElementNodeType
    expect(clone.data.type).toBe('system-boundary')
    // the two cards keep their places relative to the frame that holds them
    const held = nodes.filter((n) => n.parentId === clone.id)
    expect(held.map((n) => n.position)).toEqual([
      { x: 40, y: 60 },
      { x: 300, y: 60 },
    ])
  })

  // A service that talked to its own database talks to the copy of it; both
  // regions still answer the same thing outside.
  it('remaps a line with both ends inside, and keeps one with an end outside', () => {
    const { edges } = copied()
    expect(edges).toHaveLength(4)

    const inner = edges.filter((e) => e.source !== 'svc' && e.source !== 'out')
    const [both] = inner.filter((e) => e.target !== 'db' && e.target !== 'svc')
    expect(both).toBeTruthy()

    // the line from outside points at the copy of the service, not at the
    // original and not at anything new
    const fromOutside = edges.filter((e) => e.source === 'out')
    expect(fromOutside).toHaveLength(2)
    expect(new Set(fromOutside.map((e) => e.target)).size).toBe(2)
  })

  it('leaves the board alone when there is nothing to draw a frame around', () => {
    const before = board()
    const after = replicate(before, [], { id: 'nope' } as ElementNodeType, 'region', 'r')
    expect(after.nodes).toBe(before)
  })
})
