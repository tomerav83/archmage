import { describe, expect, it } from 'vitest'
import type { Board } from '@/lib/board-types'
import { review } from './review'

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
    expect(found[0]?.title).toMatch(/^Unknown block type/)
  })

  it('flags an edge that points at nothing, worst first', () => {
    const found = review(
      board({
        nodes: [node('n1')],
        edges: [{ id: 'e1', kind: 'uses', from: 'n1', to: 'gone', props: {} }],
      }),
    )
    expect(found[0]?.severity).toBe('error')
    expect(found[0]?.edgeId).toBe('e1')
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

  it('flags a block parented to a kind that cannot hold children', () => {
    const found = review(
      board({ nodes: [node('db', { kind: 'store' }), node('n1', { parent: 'db' })] }),
    ).filter((f) => f.title.includes("can't hold children"))
    expect(found.map((f) => f.nodeId)).toEqual(['n1'])
  })

  it('flags a prop value the catalog does not allow', () => {
    const badEnum = review(
      board({ nodes: [node('sys', { kind: 'system', props: { status: 'on-fire' } })] }),
    ).filter((f) => f.title.startsWith('Invalid'))
    expect(badEnum).toHaveLength(1)

    const badType = review(
      board({ nodes: [node('a1', { kind: 'actor', props: { external: 'yes' } })] }),
    ).filter((f) => f.title.startsWith('Invalid'))
    expect(badType).toHaveLength(1)

    const ok = review(board({ nodes: [node('sys', { kind: 'system', props: { status: 'live' } })] })).filter(
      (f) => f.title.startsWith('Invalid'),
    )
    expect(ok).toEqual([])
  })
})
