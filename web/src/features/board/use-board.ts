import { useCallback, useMemo, useState } from 'react'
import { useEdgesState, useNodesState, useReactFlow, type Connection } from '@xyflow/react'
import { newId, toBoard } from './codec'
import {
  insertEdge,
  insertNode,
  selectOnlyEdge,
  selectOnlyNode,
  updateEdgeData,
  updateNodeData,
} from './actions'
import type { BlockEdge, BlockNode } from '@/lib/board-types'
import type { Finding } from '@/features/review' // type-only: erased, so the feature boundary holds

/** The document: what is on the board and every way it changes. Kept out of the editor
 *  component so that stays layout and composition only — nothing here reads the DOM,
 *  decides a layout, or knows what the review thinks.
 *
 *  React Flow owns the live nodes/edges arrays (useNodesState/useEdgesState is enough
 *  here — nothing needs writing from inside a node, and there's only ever one reader).
 *  Every state *transition* is a pure function in ./actions; this hook's only job is
 *  wiring them to the setters and to the one thing a pure function can't do itself,
 *  screenToFlowPosition, which only exists once React Flow is mounted.
 *
 *  Nothing is persisted or leaves the app — every load starts blank. */
export function useBoard() {
  const [boardId] = useState(() => newId('b'))
  const [name, setName] = useState('Untitled board')
  const [nodes, setNodes, onNodesChange] = useNodesState<BlockNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<BlockEdge>([])
  const { screenToFlowPosition, deleteElements } = useReactFlow()

  /** The one document, rebuilt when anything on the board changes; the app layer
   *  hands it to the review. */
  const doc = useMemo(() => toBoard(boardId, name, nodes, edges), [boardId, name, nodes, edges])

  // ------------------------------------------------------------------ edits
  // ids are minted before the setter, never inside it: React runs an updater during
  // render and may run it more than once, and an id has to survive that.

  const connect = useCallback(
    (c: Connection | { source: string; target: string }) => {
      const id = newId('e')
      setEdges((es) => insertEdge(es, id, c))
    },
    [setEdges],
  )

  /** `at` is a screen point — the pointer for a drop, the middle of the pane for a
   *  click or an Enter on a palette chip. Which of the two is the caller's business. */
  const addBlock = useCallback(
    (kind: string, at: { x: number; y: number }) => {
      const id = newId('n')
      setNodes((ns) => insertNode(ns, id, kind, screenToFlowPosition(at)))
    },
    [screenToFlowPosition, setNodes],
  )

  // deleteElements takes the attached edges with it.
  const removeNode = useCallback((id: string) => void deleteElements({ nodes: [{ id }] }), [deleteElements])

  const patchNode = useCallback(
    (id: string, patch: Partial<BlockNode['data']>) => setNodes((ns) => updateNodeData(ns, id, patch)),
    [setNodes],
  )

  const patchEdge = useCallback(
    (id: string, patch: { kind?: string; props?: Record<string, unknown> }) =>
      setEdges((es) => updateEdgeData(es, id, patch)),
    [setEdges],
  )

  /** Select what a finding points at, and nothing else. */
  const focus = useCallback(
    (f: Finding) => {
      setNodes((ns) => selectOnlyNode(ns, f.nodeId))
      setEdges((es) => selectOnlyEdge(es, f.edgeId))
    },
    [setNodes, setEdges],
  )

  return {
    name,
    setName,
    doc,
    nodes,
    onNodesChange,
    edges,
    onEdgesChange,
    connect,
    addBlock,
    removeNode,
    patchNode,
    patchEdge,
    focus,
  }
}
