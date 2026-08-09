import { useCallback, useMemo, useState } from 'react'
import { addEdge, useEdgesState, useNodesState, useReactFlow, type Connection } from '@xyflow/react'
import { defaults, EDGE_KINDS, KINDS } from '@/lib/catalog'
import { msg, newId, parseBoard, toBoard, toRF } from '@/features/board'
import type { Board, BlockEdge, BlockNode, Severity } from '@/lib/board'
import { review, type Finding } from '@/features/review'

const MAX_IMPORT_BYTES = 4_000_000

/** The document: what is on the board, every way it changes, what the review makes of
 *  it, and the ways it gets in and out. Kept out of the editor component so that stays
 *  layout and composition only — nothing here reads the DOM or decides a layout.
 *
 *  Nothing is persisted — every load starts blank, and Open/Export carry a board. */
export function useBoard() {
  const [boardId, setBoardId] = useState(() => newId('b'))
  const [name, setName] = useState('Untitled board')
  const [nodes, setNodes, onNodesChange] = useNodesState<BlockNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<BlockEdge>([])
  const [error, setError] = useState('')
  const [undoable, setUndoable] = useState<Board | null>(null)
  const { screenToFlowPosition, deleteElements } = useReactFlow()

  /** The one document, rebuilt when anything on the board changes. The review, the
   *  undo snapshot and Export all read this same copy. */
  const doc = useMemo(() => toBoard(boardId, name, nodes, edges), [boardId, name, nodes, edges])
  const findings = useMemo(() => review(doc), [doc])

  // findings arrive worst-first, so the first hit per node is its worst severity.
  // Null prototype: node ids come from an imported board, and one named "__proto__"
  // or "toString" has to miss rather than hand a block something off Object.prototype.
  const flags = useMemo(() => {
    const worst: Record<string, Severity> = Object.create(null)
    for (const f of findings) if (f.nodeId && !worst[f.nodeId]) worst[f.nodeId] = f.severity
    return worst
  }, [findings])

  const replace = useCallback(
    (b: Board) => {
      const rf = toRF(b)
      setBoardId(b.id)
      setName(b.name)
      setNodes(rf.nodes)
      setEdges(rf.edges)
    },
    [setNodes, setEdges],
  )

  /** Take a copy before anything destructive, so there is always one step back. */
  const snapshot = useCallback(() => setUndoable(doc), [doc])

  const undo = useCallback(() => {
    if (!undoable) return
    replace(undoable)
    setUndoable(null)
    setError('')
  }, [undoable, replace])

  // ------------------------------------------------------------------ edits
  // ids are minted before the setter, never inside it: React runs an updater during
  // render and may run it more than once, and an id has to survive that.

  const connect = useCallback(
    (c: Connection | { source: string; target: string }) => {
      const id = newId('e')
      setEdges((es) =>
        addEdge<BlockEdge>(
          { ...c, id, label: EDGE_KINDS.uses?.label ?? 'uses', data: { kind: 'uses', props: {} } },
          es,
        ),
      )
    },
    [setEdges],
  )

  /** `at` is a screen point — the pointer for a drop, the middle of the pane for a
   *  click or an Enter on a palette chip. Which of the two is the caller's business. */
  const addBlock = useCallback(
    (kind: string, at: { x: number; y: number }) => {
      const spec = KINDS[kind]
      if (!spec) return
      const id = newId('n')
      setNodes((ns) =>
        ns.concat({
          id,
          type: 'block',
          position: screenToFlowPosition(at),
          data: { kind, name: spec.label, parent: null, props: defaults(spec) },
        }),
      )
    },
    [screenToFlowPosition, setNodes],
  )

  // deleteElements takes the attached edges with it, and runs the editor's
  // onBeforeDelete on the way — that hook is where the undo snapshot is taken.
  const removeNode = useCallback((id: string) => void deleteElements({ nodes: [{ id }] }), [deleteElements])

  /** Merge a patch into the node: top-level fields replace, `props` merge key by key. */
  const patchNode = useCallback(
    (id: string, patch: Partial<BlockNode['data']>) =>
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, ...patch, props: { ...n.data.props, ...patch.props } } }
            : n,
        ),
      ),
    [setNodes],
  )

  /** Same shape for edges; a changed kind also re-labels the wire. */
  const patchEdge = useCallback(
    (id: string, patch: { kind?: string; props?: Record<string, unknown> }) =>
      setEdges((es) =>
        es.map((e) => {
          if (e.id !== id) return e
          const kind = patch.kind ?? e.data?.kind ?? 'uses'
          return {
            ...e,
            label: EDGE_KINDS[kind]?.label ?? kind,
            data: { kind, props: { ...e.data?.props, ...patch.props } },
          }
        }),
      ),
    [setEdges],
  )

  /** Select what a finding points at, and nothing else. */
  const focus = useCallback(
    (f: Finding) => {
      setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === f.nodeId })))
      setEdges((es) => es.map((e) => ({ ...e, selected: e.id === f.edgeId })))
    },
    [setNodes, setEdges],
  )

  // ------------------------------------------------------------------ io

  const exportBoard = useCallback(() => {
    const json = JSON.stringify(doc, null, 2)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'board'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [doc, name])

  const openBoard = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      if (file.size > MAX_IMPORT_BYTES) {
        setError(`${file.name} is ${Math.round(file.size / 1e6)} MB — a board is JSON, well under 4 MB.`)
        return
      }
      try {
        const parsed = parseBoard(await file.text())
        snapshot()
        replace(parsed)
        setError('')
      } catch (e) {
        setError(`Could not open ${file.name}: ${msg(e)}.`)
      }
    },
    [replace, snapshot],
  )

  return {
    name,
    setName,
    nodes,
    onNodesChange,
    edges,
    onEdgesChange,
    findings,
    flags,
    error,
    dismissError: useCallback(() => setError(''), []),
    undoable,
    undo,
    snapshot,
    connect,
    addBlock,
    removeNode,
    patchNode,
    patchEdge,
    focus,
    exportBoard,
    openBoard,
  }
}
