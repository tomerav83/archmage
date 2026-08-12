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
export type Board = { name: string; nodes: BoardNode[]; edges: BoardEdge[] }

/** The dataTransfer key a drag source writes a kind under and the drop target reads it
 *  back from. Shared code because the two sides are different features, and a typo on
 *  either would just look like a drop that silently did nothing. */
export const DRAG_KEY = 'application/archmage-kind'

// The board is the document; these two are the live editing state React Flow works on.
// A React Flow node owns its id and position itself, and an edge its id and ends, so
// what rides in `data` is the rest of the document's own shape — derived from it, not
// retyped, or the two drift the day a block grows a field.
type BlockData = Omit<BoardNode, 'id' | 'x' | 'y'>
type EdgeData = Omit<BoardEdge, 'id' | 'from' | 'to'>
export type BlockNode = RFNode<BlockData, 'block'>
export type BlockEdge = RFEdge<EdgeData>

/** A flag rides on a block, so the word for one is vocabulary, not review internals.
 *  Worst first: the list is the order the findings list sorts by. */
export const SEVERITIES = ['error', 'warn'] as const
export type Severity = (typeof SEVERITIES)[number]
