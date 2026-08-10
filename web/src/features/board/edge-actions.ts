import { addEdge, type Connection } from '@xyflow/react'
import { EDGE_KINDS } from '@/lib/catalog'
import type { BlockEdge } from '@/lib/board-types'

// An edge's whole lifecycle: how one is created, how a patch lands on it (a changed
// kind also re-labels the wire), what "select only this one" means. use-board.ts
// mints the id before the updater runs, since setEdges may run it twice.

export function insertEdge(
  edges: BlockEdge[],
  id: string,
  c: Connection | { source: string; target: string },
): BlockEdge[] {
  return addEdge<BlockEdge>(
    { ...c, id, label: EDGE_KINDS.uses?.label ?? 'uses', data: { kind: 'uses', props: {} } },
    edges,
  )
}

export function updateEdgeData(
  edges: BlockEdge[],
  id: string,
  patch: { kind?: string; props?: Record<string, unknown> },
): BlockEdge[] {
  return edges.map((e) => {
    if (e.id !== id) return e
    const kind = patch.kind ?? e.data?.kind ?? 'uses'
    return {
      ...e,
      label: EDGE_KINDS[kind]?.label ?? kind,
      data: { kind, props: { ...e.data?.props, ...patch.props } },
    }
  })
}

export const selectOnlyEdge = (edges: BlockEdge[], id: string | undefined): BlockEdge[] =>
  edges.map((e) => ({ ...e, selected: e.id === id }))
