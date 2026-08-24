import { describe, expect, it } from 'vitest'
import { ACTIONS, type Action, actionsFor, attach } from './actions'
import { TYPES } from './c4'
import { TECH } from './catalog/tech'
import type { ElementNodeType } from './ElementNode'

const card = (type: string, over: Partial<ElementNodeType['data']> = {}, parentId?: string) =>
  ({
    id: 'a',
    type: 'element',
    position: { x: 100, y: 60 },
    ...(parentId && { parentId }),
    data: { type, label: 'Orders Service', ...over },
  }) as ElementNodeType

const row = (shelf: keyof typeof ACTIONS, title: string) =>
  (ACTIONS[shelf] as Action[]).find((a) => a.title === title) as Action

const DATABASE = row('Applications', 'Add database')
const REPLICA = row('Data Stores', 'Add read replica')
const QUEUE = row('Applications', 'Offload to queue')

describe('attaching an element to a subject', () => {
  it('stands it downstream, and a sidecar below', () => {
    expect(attach(card('api-service'), DATABASE, 'b').node.position).toEqual({ x: 364, y: 60 })
    expect(attach(card('relational-db'), REPLICA, 'b').node.position).toEqual({ x: 100, y: 212 })
  })

  // Both positions are said relative to the same frame, which is the whole
  // reason nesting.ts is never asked: a card added beside one standing in a
  // Region stands in that Region too, at the offset and nothing else.
  it('joins whatever frame the subject stands in', () => {
    expect(attach(card('api-service', {}, 'region'), DATABASE, 'b').node.parentId).toBe('region')
    expect(attach(card('api-service'), DATABASE, 'b').node.parentId).toBeUndefined()
  })

  it('names itself off the type it dropped, so the panel need not open', () => {
    const { node } = attach(card('api-service'), DATABASE, 'b')
    expect(node.data.type).toBe('relational-db')
    expect(node.data.label).toBe(TYPES['relational-db'].title)
  })

  it('draws the line already described, from the face it left', () => {
    const { edge } = attach(card('api-service'), DATABASE, 'b')
    expect(edge.source).toBe('a')
    expect(edge.target).toBe('b')
    expect(edge.data?.label).toBe('reads from and writes to')
    // downstream leaves the right flank and lands on the left
    expect([edge.sourceHandle, edge.targetHandle]).toEqual(['r', 'l'])
  })

  it('says when nobody is waiting, and stays quiet when they are', () => {
    expect(attach(card('api-service'), QUEUE, 'b').edge.data?.interaction).toBe('Async')
    // Sync is the default the edge already draws, so the row does not say it
    expect(attach(card('api-service'), DATABASE, 'b').edge.data?.interaction).toBeUndefined()
  })

  it('sends a sidecar out of the underside', () => {
    const { edge } = attach(card('relational-db'), REPLICA, 'b')
    expect([edge.sourceHandle, edge.targetHandle]).toEqual(['b', 't'])
  })
})

describe('what the new element inherits', () => {
  it('takes the technology where the new type has a line for it', () => {
    const primary = card('relational-db', { technology: 'PostgreSQL' })
    expect(attach(primary, REPLICA, 'b').node.data.technology).toBe('PostgreSQL')
    expect(TECH['read-replica']).toContain('PostgreSQL')
  })

  // A queue beside a Postgres service does not come up running Postgres.
  it('leaves it alone where the new type has no line for it', () => {
    const service = card('api-service', { technology: 'Go' })
    expect(TECH['message-queue']).not.toContain('Go')
    expect(attach(service, QUEUE, 'b').node.data.technology).toBeUndefined()
  })

  it('has nothing to inherit from a subject that never said', () => {
    expect(attach(card('relational-db'), REPLICA, 'b').node.data.technology).toBeUndefined()
  })
})

describe('what a thing can have done to it', () => {
  it('is its shelf row, so shelf-mates offer the same verbs', () => {
    expect(actionsFor(card('worker'))).toBe(actionsFor(card('api-service')))
  })

  it('is nothing at all for a frame, which is enclosed in rather than acted on', () => {
    const frame = { ...card('system-boundary'), type: 'boundary' } as ElementNodeType
    expect(actionsFor(frame)).toEqual([])
  })

  // The bargain fields.ts makes: a shelf with no line here is a compile error,
  // and every row it does have has to name a type the registry owns.
  it('drops only types the registry knows', () => {
    for (const rows of Object.values(ACTIONS))
      for (const action of rows as Action[]) expect(TYPES[action.type]).toBeTruthy()
  })
})
