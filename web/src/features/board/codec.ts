import { edgeLabel } from '@/lib/catalog'
import type { Board, BlockEdge, BlockNode } from '@/lib/board-types'

// The bridge between the Board document and React Flow's live editing state.
// The shapes live in @/lib/board-types.

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`

export const toRF = (b: Board): { nodes: BlockNode[]; edges: BlockEdge[] } => ({
  nodes: b.nodes.map((n) => ({
    id: n.id,
    type: 'block' as const,
    position: { x: n.x, y: n.y },
    data: { kind: n.kind, name: n.name, parent: n.parent, props: n.props },
  })),
  edges: b.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: edgeLabel(e.kind),
    data: { kind: e.kind, props: e.props },
  })),
})

export const toBoard = (id: string, name: string, nodes: BlockNode[], edges: BlockEdge[]): Board => ({
  id,
  name,
  nodes: nodes.map((n) => ({
    id: n.id,
    kind: n.data.kind,
    name: n.data.name,
    parent: n.data.parent,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
    props: n.data.props,
  })),
  edges: edges.map((e) => ({
    id: e.id,
    kind: e.data?.kind ?? 'uses',
    from: e.source,
    to: e.target,
    props: e.data?.props ?? {},
  })),
})
