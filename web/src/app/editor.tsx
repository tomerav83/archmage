import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BlockMenu, Canvas, nodeTypes, WireGhost } from '@/features/canvas'
import { Inspector } from '@/features/board'
import type { BlockNode } from '@/lib/board'
import { Findings } from '@/features/review'
import { DRAG_KEY, Palette } from './palette'
import { useBoard } from './useBoard'

// Orthogonal wires with rounded elbows; colour stays reserved for the objects.
const EDGE_STYLE = { type: 'smoothstep', pathOptions: { borderRadius: 12 } } as const
const DELETE_KEYS = ['Backspace', 'Delete']

/** Layout and composition only — the document lives in useBoard, the rules in review. */
function Shell() {
  const board = useBoard()
  const { addBlock, connect, focus, nodes, edges, removeNode, snapshot } = board
  // the block we are wiring from, and the right-click menu: which block, and where
  const [wireFrom, setWireFrom] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const pane = useRef<HTMLElement>(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const selectedNode = nodes.find((n) => n.selected)
  const selectedEdge = edges.find((e) => e.selected)

  /** Where a block lands is a layout question, so it is answered here: a drop lands
   *  where the pointer is, a click or an Enter on a chip in the middle of the view. */
  const place = useCallback(
    (kind: string, at?: { x: number; y: number }) => {
      const box = pane.current?.getBoundingClientRect()
      addBlock(
        kind,
        at ?? { x: (box?.left ?? 0) + (box?.width ?? 0) / 2, y: (box?.top ?? 0) + (box?.height ?? 0) / 2 },
      )
    },
    [addBlock],
  )

  const deleteBlock = useCallback(
    (id: string) => {
      removeNode(id)
      setWireFrom((f) => (f === id ? null : f))
    },
    [removeNode],
  )

  const onDrop = useCallback(
    (ev: DragEvent) => {
      ev.preventDefault()
      place(ev.dataTransfer.getData(DRAG_KEY), { x: ev.clientX, y: ev.clientY })
    },
    [place],
  )

  /** Second click of a connect: land the wire on whatever block was clicked. */
  const onNodeClick = useCallback(
    (_: unknown, n: BlockNode) => {
      setMenu(null)
      if (!wireFrom || n.id === wireFrom) return
      connect({ source: wireFrom, target: n.id })
      setWireFrom(null)
    },
    [wireFrom, connect],
  )

  const canvas = useMemo(() => ({ flags: board.flags, wiring: wireFrom }), [board.flags, wireFrom])

  return (
    <Canvas.Provider value={canvas}>
      <div className="app">
        <header>
          <h1>Archmage</h1>
          <input
            className="board-name"
            aria-label="Board name"
            placeholder="Board name"
            value={board.name}
            onChange={(e) => board.setName(e.target.value)}
          />
          <button type="button" onClick={() => fileInput.current?.click()}>
            Open…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void board.openBoard(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button type="button" className="primary" onClick={board.exportBoard}>
            Export
          </button>
          {board.undoable ? (
            <button type="button" onClick={board.undo}>
              Undo
            </button>
          ) : null}
          {board.error ? (
            <p className="error" role="alert">
              {board.error}
              <button
                type="button"
                className="dismiss"
                aria-label="Dismiss message"
                onClick={board.dismissError}
              >
                ×
              </button>
            </p>
          ) : null}
        </header>

        <Palette onAdd={place} />

        <main ref={pane} className={wireFrom ? 'wiring' : undefined}>
          {/* the drop handlers ride on ReactFlow, not on <main>: a landmark is not a
              control, and this is React Flow's own drag-and-drop shape */}
          <ReactFlow
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={board.onNodesChange}
            onEdgesChange={board.onEdgesChange}
            onConnect={connect}
            onNodeClick={onNodeClick}
            onBeforeDelete={() => {
              snapshot()
              return Promise.resolve(true)
            }}
            onNodeContextMenu={(e, n) => {
              e.preventDefault()
              setMenu({ id: n.id, x: e.clientX, y: e.clientY })
            }}
            onPaneClick={() => {
              setWireFrom(null)
              setMenu(null)
            }}
            onPaneContextMenu={() => setMenu(null)}
            onMoveStart={() => setMenu(null)}
            defaultEdgeOptions={EDGE_STYLE}
            colorMode="dark"
            deleteKeyCode={DELETE_KEYS}
            // a board is only bounded by the 4 MB import cap, so cull off-screen tiles
            onlyRenderVisibleElements
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
            {/* keyed: re-Connect from another block has to re-anchor the ghost */}
            {wireFrom ? <WireGhost key={wireFrom} from={wireFrom} /> : null}
          </ReactFlow>

          {menu ? (
            <BlockMenu
              x={menu.x}
              y={menu.y}
              onConnect={() => {
                setWireFrom(menu.id)
                setMenu(null)
              }}
              onDelete={() => {
                deleteBlock(menu.id)
                setMenu(null)
              }}
              onClose={closeMenu}
            />
          ) : null}
        </main>

        <Inspector
          node={selectedNode}
          edge={selectedEdge}
          nodes={nodes}
          onPatchNode={board.patchNode}
          onNodeProp={board.setNodeProp}
          onEdgeKind={board.setEdgeKind}
          onEdgeProp={board.setEdgeProp}
          onConnect={(from, to) => connect({ source: from, target: to })}
          onDelete={deleteBlock}
        />

        <Findings findings={board.findings} onFocus={focus} />
      </div>
    </Canvas.Provider>
  )
}

/** React Flow's hooks need its provider above them, so the feature ships the pair. */
export function Editor() {
  return (
    <ReactFlowProvider>
      <Shell />
    </ReactFlowProvider>
  )
}
