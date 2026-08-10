import { useCallback, useMemo } from 'react'
import {
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBlockDrop, useBoard } from '@/features/board'
import { FlagsContext, HoldConnectContext, nodeTypes, useHoldConnect } from '@/features/canvas'
import { Inspector } from '@/features/inspector'
import { DRAG_KEY, Palette } from '@/features/palette'
import { Findings, review, worstPerNode } from '@/features/review'

// Orthogonal wires with rounded elbows; colour stays reserved for the objects.
const EDGE_STYLE = { type: 'smoothstep', pathOptions: { borderRadius: 12 } } as const
const DELETE_KEYS = ['Backspace', 'Delete']

/** Layout and composition only — the document lives in useBoard, the rules in review.
 *  Connecting is press-and-hold on a block, dragging to another (use-hold-connect). */
function Shell() {
  const board = useBoard()
  const { addBlock, connect, focus, nodes, edges, removeNode } = board
  // where the document meets the rules: one feature's output wired into the other's input
  const findings = useMemo(() => review(board.doc), [board.doc])
  const flags = useMemo(() => worstPerNode(findings), [findings])
  const { pane, place, onDrop, onDragOver } = useBlockDrop(addBlock, DRAG_KEY)
  const holdConnect = useHoldConnect(
    useCallback((from, to) => connect({ source: from, target: to }), [connect]),
    pane,
  )

  const selectedNode = nodes.find((n) => n.selected)
  const selectedEdge = edges.find((e) => e.selected)

  return (
    <HoldConnectContext.Provider
      value={{ holdingId: holdConnect.holdingId, beginHold: holdConnect.beginHold }}
    >
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
          </header>

          <Palette onAdd={place} />

          <main ref={pane}>
            {/* the drop handlers ride on ReactFlow, not on <main>: a landmark is not a
              control, and this is React Flow's own drag-and-drop shape */}
            <ReactFlow
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={board.onNodesChange}
              onEdgesChange={board.onEdgesChange}
              onNodeDragStart={holdConnect.onNodeDragStart}
              defaultEdgeOptions={EDGE_STYLE}
              connectionLineType={ConnectionLineType.SmoothStep}
              colorMode="dark"
              deleteKeyCode={DELETE_KEYS}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
              <svg ref={holdConnect.svgRef} className="hold-connect-overlay" />
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
    </HoldConnectContext.Provider>
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
