import { useMemo, useState, type DragEvent } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import { ELEMENTS } from '../../c4'
import { ElementNode, type ElementNodeType } from './ElementNode'
import { DRAG_SLOP_PX, WardContext } from './ward/useWard'
import { readDraggedKind } from './dragAndDrop'

const nodeTypes = { element: ElementNode } satisfies NodeTypes

// No colour here: the stroke comes from --xy-edge-stroke in index.css, so
// selection can repaint an edge without an inline style outranking it.
const defaultEdgeOptions: DefaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
}

const centre = (n: Node) => ({
  x: n.position.x + (n.measured?.width ?? 0) / 2,
  y: n.position.y + (n.measured?.height ?? 0) / 2,
})

// Which faces an edge leaves and lands on. The wider gap picks the axis, so
// cards set side by side join flank to flank rather than over the top.
export const faces = (a: Node, b: Node) => {
  const dx = centre(b).x - centre(a).x
  const dy = centre(b).y - centre(a).y
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? (['r', 'l'] as const) : (['l', 'r'] as const)
  return dy > 0 ? (['b', 't'] as const) : (['t', 'b'] as const)
}

export function DiagramCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ElementNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition, getNode } = useReactFlow()
  // The node whose ward is open, waiting for the press that answers it.
  const [from, setFrom] = useState<string | null>(null)

  const ward = useMemo(
    () => ({
      from,
      open: setFrom,
      cancel: () => setFrom(null),
      // Back on the node that opened the ward, the connection is called off.
      land: (target: string) => {
        setFrom(null)
        const a = from && getNode(from)
        const b = getNode(target)
        if (!a || !b || a.id === b.id) return
        const [sourceHandle, targetHandle] = faces(a, b)
        setEdges((eds) => addEdge({ source: a.id, target: b.id, sourceHandle, targetHandle }, eds))
      },
    }),
    [from, getNode, setEdges],
  )

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    const kind = readDraggedKind(e.dataTransfer)
    if (!kind) return
    setNodes((nds) => [
      ...nds,
      {
        id: crypto.randomUUID(),
        type: 'element',
        position: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
        data: { kind, label: ELEMENTS[kind].title },
      },
    ])
  }

  return (
    <WardContext.Provider value={ward}>
      <ReactFlow
        colorMode="dark"
        // Every handle is declared a source, so only loose mode will let an
        // edge land on one.
        connectionMode={ConnectionMode.Loose}
        // Same slop the ward uses, so a press is a drag or a connect, never both.
        nodeDragThreshold={DRAG_SLOP_PX}
        // While a ward is open the board only answers it: the next press lands
        // the connection and nothing drags or pans in the meantime. The cards
        // don't each veto the press — the canvas does.
        // Selection stays on: React Flow writes a node's pointer-events inline
        // from selectable || draggable || onNodeClick, so switching those off
        // together leaves a card that can't be pressed at all, and the ward
        // could never land.
        nodesDraggable={!from}
        panOnDrag={!from}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // Empty ground — or an edge — calls off an open ward.
        onPaneClick={ward.cancel}
        onEdgeClick={ward.cancel}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        {/* Brass-tinted major rule every fifth square, slate dots on top. */}
        <Background id="major" variant={BackgroundVariant.Lines} gap={105} color="#3f403d" />
        <Background id="minor" gap={21} size={1} color="#414950" />
      </ReactFlow>
    </WardContext.Provider>
  )
}
