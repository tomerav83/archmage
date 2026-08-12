import type { Board, BlockEdge, BlockNode } from '@/lib/board-types'

// The bridge from React Flow's live editing state back to the Board document.
// The shapes live in @/lib/board-types. There is no other direction yet: nothing
// loads a board, so nothing turns one into React Flow's state.

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`

// What each side owns is what each side names: React Flow holds a node's id and
// position and an edge's id and ends, and everything else rides through as `data`.
export const toBoard = (name: string, nodes: BlockNode[], edges: BlockEdge[]): Board => ({
  name,
  nodes: nodes.map((n) => ({
    id: n.id,
    ...n.data,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
  })),
  // An edge React Flow made itself has no data; ours always does.
  edges: edges.map((e) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    ...(e.data ?? { kind: 'uses', props: {} }),
  })),
})
