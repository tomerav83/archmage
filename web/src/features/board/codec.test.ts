import { describe, expect, it } from 'vitest'
import { toBoard } from './codec'
import type { BlockEdge, BlockNode } from '@/lib/board-types'

const rfNode = (id: string, x: number, y: number): BlockNode => ({
  id,
  type: 'block',
  position: { x, y },
  data: { kind: 'app', name: id, parent: null, props: {} },
})

describe('toBoard', () => {
  it('rounds positions and flattens data onto the document', () => {
    expect(toBoard('test', [rfNode('n1', 10.4, -3.6)], [])).toEqual({
      name: 'test',
      nodes: [{ id: 'n1', kind: 'app', name: 'n1', parent: null, x: 10, y: -4, props: {} }],
      edges: [],
    })
  })

  it('gives an edge React Flow made itself the default kind', () => {
    const bare = { id: 'e1', source: 'n1', target: 'n2' } as BlockEdge
    expect(toBoard('test', [], [bare]).edges).toEqual([
      { id: 'e1', from: 'n1', to: 'n2', kind: 'uses', props: {} },
    ])
  })
})
