import { defaults, KINDS } from '@/lib/catalog'
import type { BlockNode } from '@/lib/board-types'

// A node's whole lifecycle: how one is created, how a patch lands on it, what
// "select only this one" means. use-board.ts is the only caller — it does the one
// thing this can't (screenToFlowPosition) and mints the id before the updater runs,
// since setNodes may run it twice.

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

export const selectOnlyNode = (nodes: BlockNode[], id: string | undefined): BlockNode[] =>
  nodes.map((n) => ({ ...n, selected: n.id === id }))
