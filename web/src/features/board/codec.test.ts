import { describe, expect, it } from 'vitest'
import { parseBoard, toBoard, toRF } from './codec'
import type { Board } from '@/lib/board-types'

const board = (b: Partial<Board> = {}): Board => ({ id: 'b_1', name: 'test', nodes: [], edges: [], ...b })
const node = (id: string, over: Partial<Board['nodes'][number]> = {}) => ({
  id,
  kind: 'app',
  name: id,
  parent: null,
  x: 0,
  y: 0,
  props: {},
  ...over,
})

describe('parseBoard', () => {
  it('rejects anything that is not a board', () => {
    expect(() => parseBoard('{"nodes":[]}')).toThrow(/nodes.*edges/)
    expect(() => parseBoard('[]')).toThrow()
  })

  it('rejects a node missing an id, a kind or coordinates', () => {
    expect(() => parseBoard('{"nodes":[{"kind":"app","x":0,"y":0}],"edges":[]}')).toThrow(/node 0/)
    expect(() => parseBoard('{"nodes":[{"id":"n1","kind":"app","x":0}],"edges":[]}')).toThrow(
      /numeric x and y/,
    )
    expect(() => parseBoard('{"nodes":[{"id":"n1","kind":"app","x":0,"y":null}],"edges":[]}')).toThrow(
      /numeric x and y/,
    )
  })

  it('rejects an edge missing an endpoint', () => {
    expect(() => parseBoard('{"nodes":[],"edges":[{"id":"e1","kind":"uses","from":"n1"}]}')).toThrow(/edge 0/)
  })

  it('fills in a missing name, id and props', () => {
    const b = parseBoard('{"nodes":[{"id":"n1","kind":"app","x":1,"y":2}],"edges":[]}')
    expect(b.name).toBe('Untitled board')
    expect(b.id).toMatch(/^b_/)
    expect(b.nodes[0]?.props).toEqual({})
  })

  // the whole point: defaulting is not type-checking, and the rules call .trim() on a name
  it('coerces fields of the wrong type rather than letting them out of here', () => {
    const b = parseBoard(
      '{"name":7,"nodes":[{"id":"n1","kind":"app","x":0,"y":0,"name":123,"parent":{},"props":"nope"}],"edges":[]}',
    )
    expect(b.name).toBe('Untitled board')
    expect(b.nodes[0]?.name).toBe('')
    expect(b.nodes[0]?.parent).toBeNull()
    expect(b.nodes[0]?.props).toEqual({})
  })
})

describe('react flow bridge', () => {
  it('round-trips a board', () => {
    const before = board({
      nodes: [node('n1', { kind: 'store', props: { status: 'live' } }), node('n2')],
      edges: [{ id: 'e1', kind: 'uses', from: 'n2', to: 'n1', props: {} }],
    })
    const rf = toRF(before)
    expect(toBoard(before.id, before.name, rf.nodes, rf.edges)).toEqual(before)
  })
})
