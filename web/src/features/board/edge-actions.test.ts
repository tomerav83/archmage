import { describe, expect, it } from 'vitest'
import { insertEdge, selectOnlyEdge, updateEdgeData } from './edge-actions'
import type { BlockEdge } from '@/lib/board-types'

const edge = (id: string, over: Partial<BlockEdge> = {}): BlockEdge => ({
  id,
  source: 'n1',
  target: 'n2',
  data: { kind: 'uses', props: {} },
  ...over,
})

describe('insertEdge', () => {
  it('connects two nodes as a "uses" edge', () => {
    const out = insertEdge([], 'e1', { source: 'a', target: 'b' })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'e1', source: 'a', target: 'b', data: { kind: 'uses' } })
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

describe('selectOnlyEdge', () => {
  it('selects exactly the matching id', () => {
    const out = selectOnlyEdge([edge('e1'), edge('e2')], 'e2')
    expect(out.map((e) => e.selected)).toEqual([false, true])
  })

  it('selects nothing when the id is undefined', () => {
    const out = selectOnlyEdge([edge('e1')], undefined)
    expect(out[0]?.selected).toBe(false)
  })
})
