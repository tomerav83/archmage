// The shapes every layer speaks: what a board is, the form React Flow holds it in while
// it is being edited, and how bad a finding is. Shared code, so the board, the canvas and
// the review can each name these without any of the three having to name another.
import type { Edge as RFEdge, Node as RFNode } from '@xyflow/react'

export type BoardNode = {
  id: string
  kind: string
  name: string
  parent: string | null
  x: number
  y: number
  props: Record<string, unknown>
}
export type BoardEdge = {
  id: string
  kind: string
  from: string
  to: string
  props: Record<string, unknown>
}
export type Board = { id: string; name: string; nodes: BoardNode[]; edges: BoardEdge[] }

// The board is the document; these two are the live editing state React Flow works on.
type BlockData = { kind: string; name: string; parent: string | null; props: Record<string, unknown> }
type EdgeData = { kind: string; props: Record<string, unknown> }
export type BlockNode = RFNode<BlockData, 'block'>
export type BlockEdge = RFEdge<EdgeData>

/** A flag rides on a block, so the word for one is vocabulary, not review internals. */
export type Severity = 'error' | 'warn'
