import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
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

  // toBoard walks every node and every edge, so it must not run on the urgent render:
  // a keystroke and a drag frame would each pay for the whole document before the next
  // paint. What gets deferred is the inputs — gathering those is one object literal —
  // and the document is built from the settled copy, along with the review and the save.
  const live = useMemo(() => ({ boardId, name, nodes, edges }), [boardId, name, nodes, edges])
  const settled = useDeferredValue(live)
  const board = useMemo(() => toBoard(settled.boardId, settled.name, settled.nodes, settled.edges), [settled])
  const findings = useMemo(() => review(board), [board])

  /** The document as it stands right now, built on demand. Undo and export are the two
   *  callers that cannot use a copy a frame behind, and neither is on a hot path. */
  const boardNow = useCallback(() => toBoard(boardId, name, nodes, edges), [boardId, name, nodes, edges])

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
  const snapshot = useCallback(() => setUndoable(boardNow()), [boardNow])

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

  // deleteElements takes the attached edges with it; the snapshot is the way back
  const removeNode = useCallback(
    (id: string) => {
      snapshot()
      void deleteElements({ nodes: [{ id }] })
    },
    [deleteElements, snapshot],
  )

  const patchNode = useCallback(
    (id: string, patch: Partial<BlockNode['data']>) =>
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))),
    [setNodes],
  )

  const setNodeProp = useCallback(
    (id: string, key: string, v: unknown) =>
      setNodes((ns) =>
        ns.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, props: { ...n.data.props, [key]: v } } } : n,
        ),
      ),
    [setNodes],
  )

  const setEdgeKind = useCallback(
    (id: string, kind: string) =>
      setEdges((es) =>
        es.map((e) =>
          e.id === id
            ? { ...e, label: EDGE_KINDS[kind]?.label ?? kind, data: { kind, props: e.data?.props ?? {} } }
            : e,
        ),
      ),
    [setEdges],
  )

  const setEdgeProp = useCallback(
    (id: string, key: string, v: unknown) =>
      setEdges((es) =>
        es.map((e) =>
          e.id === id
            ? { ...e, data: { kind: e.data?.kind ?? 'uses', props: { ...e.data?.props, [key]: v } } }
            : e,
        ),
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
    const json = JSON.stringify(boardNow(), null, 2)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'board'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [boardNow, name])

  // Two picks in quick succession are two reads in flight; only the newest may land.
  const importSeq = useRef(0)

  const openBoard = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      const seq = ++importSeq.current
      if (file.size > MAX_IMPORT_BYTES) {
        setError(`${file.name} is ${Math.round(file.size / 1e6)} MB — a board is JSON, well under 4 MB.`)
        return
      }
      if (file.type !== '' && file.type !== 'application/json') {
        setError(`${file.name} is ${file.type}, not JSON.`)
        return
      }
      try {
        const parsed = parseBoard(await file.text())
        if (seq !== importSeq.current) return
        snapshot()
        replace(parsed)
        setError('')
      } catch (e) {
        if (seq !== importSeq.current) return
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
    setNodeProp,
    setEdgeKind,
    setEdgeProp,
    focus,
    exportBoard,
    openBoard,
  }
}
