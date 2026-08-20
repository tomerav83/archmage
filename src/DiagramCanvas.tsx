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
  ViewportPortal,
  type XYPosition,
} from '@xyflow/react'
import {
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { BoundaryNode } from './BoundaryNode'
import { TYPES, type TypeKey } from './c4'
import { readDraggedType } from './dragAndDrop'
import { ElementForm } from './ElementForm'
import { ElementNode, type ElementNodeType } from './ElementNode'
import { Enclose } from './Enclose'
import {
  enclose,
  frameAround,
  frameAt,
  frameFrom,
  nest,
  rectBetween,
  reparent,
  within,
} from './nesting'
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
  // Where the enclose menu stands, and which door it was opened by: `ids` is
  // what was already chosen when something was right-clicked, `anchor` the
  // point an empty-ground right-click fixed as the rectangle's first corner.
  // One or the other, never both — two ways to a boundary, one picker — and
  // the union says so, rather than two optional fields that could be neither.
  const [menu, setMenu] = useState<
    ({ x: number; y: number } & ({ ids: string[] } | { anchor: XYPosition })) | null
  >(null)
  const summon = (e: MouseEvent, ids: string[]) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, ids })
  }

  // Once a type is picked from that menu: the type, and the same anchor,
  // carried over. Stable for the whole gesture — only the corner below moves —
  // so the pointer-tracking effect mounts once per gesture and not once a move.
  const [drawing, setDrawing] = useState<{ type: TypeKey; anchor: XYPosition } | null>(null)
  // The rectangle's live far corner, while it is still being dragged.
  const [corner, setCorner] = useState<XYPosition | null>(null)

  // Escape while a rectangle is being tracked calls it off — the menu already
  // has its own Escape while it is the thing showing; this covers the gesture
  // after a type has been picked, once that menu is gone.
  useEffect(() => {
    if (!drawing) return
    const cancel = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setDrawing(null)
      setCorner(null)
    }
    document.addEventListener('keydown', cancel)
    return () => document.removeEventListener('keydown', cancel)
  }, [drawing])

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

  // The pick. With a selection behind it the frame is drawn around what is
  // already on the board and finished on the spot, which is how a boundary is
  // usually arrived at. With an anchor instead there is nothing to enclose
  // yet, so the pick arms the gesture rather than finishing it: the next press
  // draws the rectangle from the point that was right-clicked.
  const pick = (type: TypeKey) => {
    // Non-null: the picker only renders while the menu stands, so a pick is
    // only ever made against one.
    const chosen = menu as NonNullable<typeof menu>
    setMenu(null)
    if ('anchor' in chosen) return setDrawing({ type, anchor: chosen.anchor })
    const { ids } = chosen
    const id = crypto.randomUUID()
    setNodes((nds) => {
      const frame = frameAround(nds, ids, id, type)
      return frame ? enclose(nds, ids, frame) : nds
    })
    // The frame you have just made is the one you want to name.
    setEditing(id)
  }

  // The press that follows a pick: captured, so the rectangle keeps growing
  // even once the pointer wanders off the canvas — over the rack, say — the
  // same bargain the ward strikes with a press of its own.
  const onPointerDown = (e: PointerEvent) => {
    if (!drawing) return
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drawing) return
    setCorner(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }

  // Release finishes it: too small a drag reads as a plain click through the
  // menu, and falls back to FRAME rather than minting something too small to
  // hold anything.
  const onPointerUp = (e: PointerEvent) => {
    if (!drawing) return
    const at = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const drawn = rectBetween(drawing.anchor, at)
    const rect =
      drawn.width < DRAG_SLOP_PX && drawn.height < DRAG_SLOP_PX
        ? { x: drawing.anchor.x, y: drawing.anchor.y, ...FRAME }
        : drawn
    const id = crypto.randomUUID()
    setNodes((nds) => {
      const frame = frameFrom(nds, id, drawing.type, rect)
      return enclose(nds, within(nds, rect, frame.parentId), frame)
    })
    setDrawing(null)
    setCorner(null)
    // The frame you have just drawn is the one you want to name.
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
    const at = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setNodes((nds) =>
      // Dropped over a frame is dropped into it, on the cursor rather than on
      // the middle of a card nothing has measured yet. Always a card: the rack
      // faces no frame, so nothing that holds things can arrive by drag.
      nest(
        [...nds, { id, type: 'element', position: at, data: { type, label: TYPES[type].title } }],
        [id],
        frameAt(nds, at)?.id,
      ),
    )
    // The element you just placed is the one you want to name.
    setEditing(id)
  }

  // The rectangle as it stands, while the pointer is still drawing it.
  const drawn = drawing && corner && rectBetween(drawing.anchor, corner)

  return (
    <WardContext.Provider value={ward}>
      <ReactFlow
        colorMode="dark"
        // Says, at a glance, that the next press means something different.
        className={drawing ? 'drawing' : undefined}
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
        nodesDraggable={!from && !drawing}
        panOnDrag={!from && !drawing}
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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
          setMenu({
            x: e.clientX,
            y: e.clientY,
            anchor: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
          })
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
        {/* The rectangle itself, live, in the same coordinate system as every
            node — a plain div in the viewport's own transform rather than a
            screen-space overlay this would otherwise have to keep in sync
            with panning and zoom by hand. */}
        {drawn && (
          <ViewportPortal>
            <div
              className="draw-rect"
              style={{
                transform: `translate(${drawn.x}px, ${drawn.y}px)`,
                width: drawn.width,
                height: drawn.height,
              }}
            />
          </ViewportPortal>
        )}
      </ReactFlow>
      {/* Over the board rather than beside it, so opening the panel doesn't
          reflow the canvas under the cursor. Both rails are mounted and only
          one is ever pointed at anything — an id is a node's or an edge's —
          so each slides on its own instead of one popping in where the other
          was. */}
      <Enclose
        at={menu}
        title={menu && 'ids' in menu ? 'Enclose in' : 'New Boundary'}
        onPick={pick}
        onClose={() => setMenu(null)}
      />
      <ElementForm node={nodes.find((n) => n.id === editing)} onClose={close} />
      <RelationshipForm edge={edges.find((e) => e.id === editing)} onClose={close} />
    </WardContext.Provider>
  )
}
