import { useCallback, useMemo, useRef, type DragEvent } from 'react'
import {
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBoard } from '@/features/board'
import { FlagsContext, nodeTypes } from '@/features/canvas'
import { Inspector } from '@/features/inspector'
import { DRAG_KEY, Palette } from '@/features/palette'
import { Findings, review, worstPerNode } from '@/features/review'

// Orthogonal wires with rounded elbows; colour stays reserved for the objects.
const EDGE_STYLE = { type: 'smoothstep', pathOptions: { borderRadius: 12 } } as const
const DELETE_KEYS = ['Backspace', 'Delete']

/** Layout and composition only — the document lives in useBoard, the rules in review.
 *  Connecting is React Flow's own: drag handle to handle, or click one then the other. */
function Shell() {
  const board = useBoard()
  const { addBlock, connect, focus, nodes, edges, removeNode, snapshot } = board
  // where the document meets the rules: one feature's output wired into the other's input
  const findings = useMemo(() => review(board.doc), [board.doc])
  const flags = useMemo(() => worstPerNode(findings), [findings])
  const fileInput = useRef<HTMLInputElement>(null)
  const pane = useRef<HTMLElement>(null)

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

  const onDrop = useCallback(
    (ev: DragEvent) => {
      ev.preventDefault()
      place(ev.dataTransfer.getData(DRAG_KEY), { x: ev.clientX, y: ev.clientY })
    },
    [place],
  )

  return (
    <FlagsContext.Provider value={flags}>
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

        <main ref={pane}>
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
            onBeforeDelete={() => {
              snapshot()
              return Promise.resolve(true)
            }}
            defaultEdgeOptions={EDGE_STYLE}
            connectionLineType={ConnectionLineType.SmoothStep}
            colorMode="dark"
            deleteKeyCode={DELETE_KEYS}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </main>

        <Inspector
          node={selectedNode}
          edge={selectedEdge}
          nodes={nodes}
          onPatchNode={board.patchNode}
          onPatchEdge={board.patchEdge}
          onConnect={(from, to) => connect({ source: from, target: to })}
          onDelete={removeNode}
        />

        <Findings findings={findings} onFocus={focus} />
      </div>
    </FlagsContext.Provider>
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
