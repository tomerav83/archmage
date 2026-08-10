import { describe, expect, it } from 'vitest'
import { insertNode, selectOnlyNode, updateNodeData } from './node-actions'
import type { BlockNode } from '@/lib/board-types'

const node = (id: string, over: Partial<BlockNode> = {}): BlockNode => ({
  id,
  type: 'block',
  position: { x: 0, y: 0 },
  data: { kind: 'app', name: id, parent: null, props: {} },
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

describe('updateNodeData', () => {
  it('replaces top-level fields and merges props key by key', () => {
    const out = updateNodeData(
      [node('n1', { data: { kind: 'app', name: 'A', parent: null, props: { a: 1 } } })],
      'n1',
      { name: 'B', props: { b: 2 } },
    )
    expect(out[0]?.data).toEqual({ kind: 'app', name: 'B', parent: null, props: { a: 1, b: 2 } })
  })

  it('leaves other nodes untouched', () => {
    const out = updateNodeData([node('n1'), node('n2')], 'n1', { name: 'changed' })
    expect(out[1]?.data.name).toBe('n2')
  })
})

describe('selectOnlyNode', () => {
  it('selects exactly the matching id', () => {
    const out = selectOnlyNode([node('n1'), node('n2')], 'n2')
    expect(out.map((n) => n.selected)).toEqual([false, true])
  })

  it('selects nothing when the id is undefined', () => {
    const out = selectOnlyNode([node('n1')], undefined)
    expect(out[0]?.selected).toBe(false)
  })
})
