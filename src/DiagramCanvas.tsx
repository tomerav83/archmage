import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type InternalNode,
  MarkerType,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { type DragEvent, type MouseEvent, useCallback, useMemo, useState } from 'react'
import { BoundaryNode } from './BoundaryNode'
import { TYPES, type TypeKey } from './c4'
import { readDraggedType } from './dragAndDrop'
import { ElementForm } from './ElementForm'
import { ElementNode, type ElementNodeType } from './ElementNode'
import { Enclose } from './Enclose'
import { enclose, frameAround, frameAt, nest, place, reparent } from './nesting'
import { RelationshipEdge, type RelationshipEdgeType } from './RelationshipEdge'
import { RelationshipForm } from './RelationshipForm'
import { DRAG_SLOP_PX, WardContext } from './useWard'

const nodeTypes = { element: ElementNode, boundary: BoundaryNode } satisfies NodeTypes

const edgeTypes = { relationship: RelationshipEdge } satisfies EdgeTypes

// No colour here: the stroke comes from --xy-edge-stroke in index.css, so
// selection can repaint an edge without an inline style outranking it.
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'relationship',
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
}

// Board coordinates, never the node's own: a nested card's position is said
// relative to the frame that holds it, and two cards in different frames would
// otherwise be compared in two different grids.
const centre = (n: InternalNode) => ({
  x: n.internals.positionAbsolute.x + (n.measured?.width ?? 0) / 2,
  y: n.internals.positionAbsolute.y + (n.measured?.height ?? 0) / 2,
})

// Which faces an edge leaves and lands on. The wider gap picks the axis, so
// cards set side by side join flank to flank rather than over the top.
export const faces = (a: InternalNode, b: InternalNode) => {
  const dx = centre(b).x - centre(a).x
  const dy = centre(b).y - centre(a).y
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? (['r', 'l'] as const) : (['l', 'r'] as const)
  return dy > 0 ? (['b', 't'] as const) : (['t', 'b'] as const)
}

// What a frame is given to hold before anybody sizes it: room for three or four
// cards, which is what a boundary usually turns out to hold.
const FRAME = { width: 360, height: 240 }

export function DiagramCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ElementNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdgeType>([])
  const { screenToFlowPosition, getInternalNode } = useReactFlow()
  // The node whose ward is open, waiting for the press that answers it.
  const [from, setFrom] = useState<string | null>(null)
  // The node or edge the form follows. It follows one, and it is not modal.
  const [editing, setEditing] = useState<string | null>(null)
  const close = useCallback(() => setEditing(null), [])
  // Where the enclose menu stands, and what it would enclose.
  const [menu, setMenu] = useState<{ x: number; y: number; ids: string[] } | null>(null)
  const summon = (e: MouseEvent, ids: string[]) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, ids })
  }

  const ward = useMemo(
    () => ({
      from,
      open: setFrom,
      cancel: () => setFrom(null),
      // Back on the node that opened the ward, the connection is called off.
      land: (target: string) => {
        setFrom(null)
        const a = from && getInternalNode(from)
        const b = getInternalNode(target)
        if (!a || !b || a.id === b.id) return
        const [sourceHandle, targetHandle] = faces(a, b)
        // Minted here rather than left to addEdge, so the line just drawn is
        // the one the form opens on — the same bargain the drop makes.
        const id = crypto.randomUUID()
        setEdges((eds) =>
          addEdge({ id, source: a.id, target: b.id, sourceHandle, targetHandle }, eds),
        )
        setEditing(id)
      },
    }),
    [from, getInternalNode, setEdges],
  )

  // What the menu is for: a frame drawn around what is already on the board,
  // which is how a boundary is usually arrived at.
  const encloseIn = (type: TypeKey) => {
    const ids = menu?.ids ?? []
    const id = crypto.randomUUID()
    setNodes((nds) => {
      const frame = frameAround(nds, ids, id, type)
      return frame ? enclose(nds, ids, frame) : nds
    })
    setMenu(null)
    // The frame you have just made is the one you want to name.
    setEditing(id)
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    const type = readDraggedType(e.dataTransfer)
    if (!type) return
    const id = crypto.randomUUID()
    const frame = TYPES[type].frame
    const at = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setNodes((nds) =>
      // Dropped over a frame is dropped into it, on the cursor rather than on
      // the middle of a card nothing has measured yet.
      nest(
        place(nds, {
          id,
          type: frame ? 'boundary' : 'element',
          position: at,
          // A card is as big as what it says; a frame is as big as what it
          // holds, so it is the one node that carries a size and is resized.
          ...(frame && FRAME),
          data: { type, label: TYPES[type].title },
        }),
        [id],
        frameAt(nds, at)?.id,
      ),
    )
    // The element you just placed is the one you want to name.
    setEditing(id)
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
        // Selection is registration marks and brass grips, never height: a
        // selected frame lifted over the board would cover the very cards it
        // holds, and swallow the presses meant for them.
        elevateNodesOnSelect={false}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // The card catches the double-click, not the text under the cursor:
        // the ward captures the pointer on every press, so the browser aims
        // click and dblclick at the card, which bubbles it on to React Flow.
        onNodeDoubleClick={(_, node) => setEditing(node.id)}
        // A dragged node is taken by whatever frame it was let go over, and
        // every node dragged with it is asked the same question.
        onNodeDragStop={(_, __, dragged) =>
          setNodes((nds) =>
            reparent(
              nds,
              dragged.map((n) => n.id),
            ),
          )
        }
        // The gesture: select, right-click, say what they add up to. Right-click
        // one node for the same menu over one thing, and empty ground for
        // nothing — an empty frame is what the rack's shelf is for.
        onNodeContextMenu={(e, node) => summon(e, [node.id])}
        onSelectionContextMenu={(e, nodes) =>
          summon(
            e,
            nodes.map((n) => n.id),
          )
        }
        onPaneContextMenu={(e) => {
          e.preventDefault()
          setMenu(null)
        }}
        onEdgeDoubleClick={(_, edge) => setEditing(edge.id)}
        // Empty ground — or an edge — calls off an open ward. A frame carries
        // no ward of its own, so as far as an open one is concerned it is
        // ground too, and it covers too much of the board not to say so.
        onPaneClick={ward.cancel}
        onEdgeClick={ward.cancel}
        onNodeClick={(_, node) => node.type === 'boundary' && ward.cancel()}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        {/* Brass-tinted major rule every fifth square, slate dots on top. */}
        <Background id="major" variant={BackgroundVariant.Lines} gap={105} color="#3f403d" />
        <Background id="minor" gap={21} size={1} color="#414950" />
      </ReactFlow>
      {/* Over the board rather than beside it, so opening the panel doesn't
          reflow the canvas under the cursor. Both rails are mounted and only
          one is ever pointed at anything — an id is a node's or an edge's —
          so each slides on its own instead of one popping in where the other
          was. */}
      <Enclose at={menu} onPick={encloseIn} onClose={() => setMenu(null)} />
      <ElementForm node={nodes.find((n) => n.id === editing)} onClose={close} />
      <RelationshipForm edge={edges.find((e) => e.id === editing)} onClose={close} />
    </WardContext.Provider>
  )
}
