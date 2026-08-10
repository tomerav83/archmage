import { describe, expect, it } from 'vitest'
import {
  insertEdge,
  insertNode,
  selectOnlyEdge,
  selectOnlyNode,
  updateEdgeData,
  updateNodeData,
} from './actions'
import type { BlockEdge, BlockNode } from '@/lib/board-types'

const node = (id: string, over: Partial<BlockNode> = {}): BlockNode => ({
  id,
  type: 'block',
  position: { x: 0, y: 0 },
  data: { kind: 'app', name: id, parent: null, props: {} },
  ...over,
})

const edge = (id: string, over: Partial<BlockEdge> = {}): BlockEdge => ({
  id,
  source: 'n1',
  target: 'n2',
  data: { kind: 'uses', props: {} },
  ...over,
})

describe('insertNode', () => {
  it('places a new node of a known kind at the given position, defaults filled in', () => {
    const out = insertNode([], 'n1', 'app', { x: 10, y: 20 })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      id: 'n1',
      position: { x: 10, y: 20 },
      data: { kind: 'app', parent: null },
    })
  })

  it('is a no-op for a kind the catalog does not have', () => {
    expect(insertNode([node('n1')], 'n2', 'not-a-kind', { x: 0, y: 0 })).toHaveLength(1)
  })
})

describe('insertEdge', () => {
  it('connects two nodes as a "uses" edge', () => {
    const out = insertEdge([], 'e1', { source: 'a', target: 'b' })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'e1', source: 'a', target: 'b', data: { kind: 'uses' } })
  })
})

describe('updateNodeData', () => {
  it('replaces top-level fields and merges props key by key', () => {
    const out = updateNodeData(
      [node('n1', { data: { kind: 'app', name: 'A', parent: null, props: { a: 1 } } })],
      'n1',
      {
        name: 'B',
        props: { b: 2 },
      },
    )
    expect(out[0]?.data).toEqual({ kind: 'app', name: 'B', parent: null, props: { a: 1, b: 2 } })
  })

  it('leaves other nodes untouched', () => {
    const out = updateNodeData([node('n1'), node('n2')], 'n1', { name: 'changed' })
    expect(out[1]?.data.name).toBe('n2')
  })
})

describe('updateEdgeData', () => {
  it('re-labels the wire when the kind changes', () => {
    const out = updateEdgeData([edge('e1')], 'e1', { kind: 'sql' })
    expect(out[0]).toMatchObject({ label: 'sql', data: { kind: 'sql' } })
  })

  it('keeps the existing kind when only props change', () => {
    const out = updateEdgeData([edge('e1')], 'e1', { props: { p: 1 } })
    expect(out[0]?.data).toEqual({ kind: 'uses', props: { p: 1 } })
  })
})

describe('selectOnlyNode / selectOnlyEdge', () => {
  it('selects exactly the matching id', () => {
    const nodes = selectOnlyNode([node('n1'), node('n2')], 'n2')
    expect(nodes.map((n) => n.selected)).toEqual([false, true])
  })

  it('selects nothing when the id is undefined', () => {
    const edges = selectOnlyEdge([edge('e1')], undefined)
    expect(edges[0]?.selected).toBe(false)
  })
})
