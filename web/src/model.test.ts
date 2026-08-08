import { describe, expect, it } from 'vitest'
import { KINDS, parseBoard, review, toBoard, toRF, type Board } from './model'

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

describe('catalog', () => {
  it('loads the core kinds from the glob', () => {
    expect(Object.keys(KINDS).sort()).toEqual(['actor', 'app', 'component', 'group', 'store', 'system'])
  })
})

describe('parseBoard', () => {
  it('rejects anything that is not a board', () => {
    expect(() => parseBoard('{"nodes":[]}')).toThrow(/nodes.*edges/)
    expect(() => parseBoard('[]')).toThrow()
  })

  it('rejects a node missing an id, a kind or coordinates', () => {
    expect(() => parseBoard('{"nodes":[{"kind":"app","x":0,"y":0}],"edges":[]}')).toThrow(/node 0/)
    expect(() => parseBoard('{"nodes":[{"id":"n1","kind":"app","x":0}],"edges":[]}')).toThrow(/numeric x and y/)
  })

  it('rejects an edge missing an endpoint', () => {
    expect(() => parseBoard('{"nodes":[],"edges":[{"id":"e1","kind":"uses","from":"n1"}]}')).toThrow(/edge 0/)
  })

  it('fills in a missing name, id and props', () => {
    const b = parseBoard('{"nodes":[{"id":"n1","kind":"app","x":1,"y":2}],"edges":[]}')
    expect(b.name).toBe('Untitled board')
    expect(b.id).toMatch(/^b_/)
    expect(b.nodes[0].props).toEqual({})
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

describe('review', () => {
  it('is quiet on a connected, well-named board', () => {
    expect(
      review(
        board({
          nodes: [node('n1'), node('n2', { kind: 'store' })],
          edges: [{ id: 'e1', kind: 'uses', from: 'n1', to: 'n2', props: {} }],
        }),
      ),
    ).toEqual([])
  })

  it('flags a kind with no catalog entry', () => {
    const found = review(board({ nodes: [node('n1', { kind: 'postgres' })] }))
    expect(found[0]).toMatchObject({ nodeId: 'n1', severity: 'error' })
    expect(found[0].title).toMatch(/^Unknown block type/)
  })

  it('flags an edge that points at nothing, worst first', () => {
    const found = review(
      board({
        nodes: [node('n1')],
        edges: [{ id: 'e1', kind: 'uses', from: 'n1', to: 'gone', props: {} }],
      }),
    )
    expect(found[0].severity).toBe('error')
    expect(found[0].edgeId).toBe('e1')
  })

  it('flags two objects sharing a name in one scope but not across scopes', () => {
    const same = review(
      board({
        nodes: [node('n1', { name: 'API' }), node('n2', { name: 'api' }), node('n3', { name: 'API' })],
      }),
    ).filter((f) => f.title.startsWith('Duplicate'))
    expect(same.map((f) => f.nodeId)).toEqual(['n2', 'n3'])

    const scoped = review(
      board({
        nodes: [
          node('sys', { kind: 'system', name: 'A' }),
          node('n1', { name: 'API', parent: 'sys' }),
          node('n2', { name: 'API' }),
        ],
      }),
    ).filter((f) => f.title.startsWith('Duplicate'))
    expect(scoped).toEqual([])
  })

  it('flags a disconnected block but leaves containers alone', () => {
    const found = review(
      board({ nodes: [node('sys', { kind: 'system' }), node('n1', { parent: 'sys' })] }),
    ).filter((f) => f.title.includes('not connected'))
    expect(found.map((f) => f.nodeId)).toEqual(['n1'])
  })
})
