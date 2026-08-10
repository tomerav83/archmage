import { describe, expect, it } from 'vitest'
import { toBoard, toRF } from './codec'
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
