import { addEdge, type Connection } from '@xyflow/react'
import { defaults, EDGE_KINDS, KINDS } from '@/lib/catalog'
import type { BlockEdge, BlockNode } from '@/lib/board-types'

// Every way the board's live editing state changes, as plain array-in array-out
// functions — no React, no React Flow instance, nothing that only exists once
// mounted. use-board.ts is the only caller: it does the two things a pure function
// can't — mint the id (setNodes/setEdges may run their updater twice, and a fresh
// random id has to survive that) and call screenToFlowPosition — then hands the
// rest through here.

export function insertNode(
  nodes: BlockNode[],
  id: string,
  kind: string,
  position: { x: number; y: number },
): BlockNode[] {
  const spec = KINDS[kind]
  if (!spec) return nodes
  return nodes.concat({
    id,
    type: 'block',
    position,
    data: { kind, name: spec.label, parent: null, props: defaults(spec) },
  })
}

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

/** Top-level fields replace, `props` merge key by key. */
export function updateNodeData(
  nodes: BlockNode[],
  id: string,
  patch: Partial<BlockNode['data']>,
): BlockNode[] {
  return nodes.map((n) =>
    n.id === id ? { ...n, data: { ...n.data, ...patch, props: { ...n.data.props, ...patch.props } } } : n,
  )
}

/** Same shape as updateNodeData; a changed kind also re-labels the wire. */
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

export const selectOnlyNode = (nodes: BlockNode[], id: string | undefined): BlockNode[] =>
  nodes.map((n) => ({ ...n, selected: n.id === id }))

export const selectOnlyEdge = (edges: BlockEdge[], id: string | undefined): BlockEdge[] =>
  edges.map((e) => ({ ...e, selected: e.id === id }))
