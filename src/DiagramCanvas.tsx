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
  type XYPosition,
} from '@xyflow/react'
import { type DragEvent, type MouseEvent, useCallback, useMemo, useState } from 'react'
import { type Action, drops, place, wire } from './actions'
import { BoundaryNode } from './BoundaryNode'
import { TYPES, type TypeKey } from './c4'
import { readDraggedType } from './dragAndDrop'
import { ElementForm } from './ElementForm'
import { ElementNode, type ElementNodeType } from './ElementNode'
import { Menu } from './Menu'
import { enclose, frameAround, frameAt, frameFrom, nest, reparent } from './nesting'
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
  const { screenToFlowPosition, getInternalNode, updateNodeData } = useReactFlow()
  // The node whose ward is open, waiting for the press that answers it.
  const [from, setFrom] = useState<string | null>(null)
  // The node or edge the form follows. It follows one, and it is not modal.
  const [editing, setEditing] = useState<string | null>(null)
  const close = useCallback(() => setEditing(null), [])
  // Where the enclose menu stands, and which door it was opened by: `ids` is
  // what was already chosen when something was right-clicked, `anchor` the
  // point an empty-ground right-click stands the new frame at. One or the
  // other, never both — two ways to a boundary, one picker — and the union
  // says so, rather than two optional fields that could be neither.
  const [menu, setMenu] = useState<
    ({ x: number; y: number } & ({ ids: string[] } | { anchor: XYPosition })) | null
  >(null)
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

  // The one card the right-click landed on, where it landed on exactly one
  // and that one is a card. A selection has nothing to have done to it — an
  // action has a subject, which is the whole reason it is on the card and not
  // in a palette — and a frame is enclosed in rather than acted on.
  const subject =
    menu && 'ids' in menu && menu.ids.length === 1
      ? nodes.find((n) => n.id === menu.ids[0])
      : undefined

  // A move. The new element names itself off the table and the type it
  // dropped, and the line arrives already described, so the panel does not
  // open: the only reason to open it is that you disagree, and a double-click
  // already does that.
  const act = (action: Action) => {
    // Non-null: a row is only rendered where there is a subject to act on.
    const on = subject as ElementNodeType
    setMenu(null)
    // Scaling out drops nothing: the card it was asked of says three, and the
    // one line already drawn to it stays one line.
    if (!drops(action)) return updateNodeData(on.id, { instances: action.instances })

    const id = crypto.randomUUID()
    // A board is two lists, so the move is asked twice: what it stands, and
    // what it does to the lines. Both keep the functional form, since a move
    // is answered against the board as it is when the press lands.
    setNodes((nds) => [...nds, place(on, action, id)])
    setEdges((eds) => wire(eds, on, action, id))
  }

  // The pick. With a selection behind it the frame is drawn around what is
  // already on the board, which is how a boundary is usually arrived at: the
  // boxes first, and only then what they add up to. With an anchor instead
  // there is nothing to enclose, so an empty frame stands at the point that
  // was right-clicked, at the size a rack drop starts one at — the grips size
  // it from there, and a card dragged into it is taken in.
  const pick = (type: TypeKey) => {
    // Non-null: the picker only renders while the menu stands, so a pick is
    // only ever made against one.
    const chosen = menu as NonNullable<typeof menu>
    setMenu(null)
    const id = crypto.randomUUID()
    setNodes((nds) => {
      if ('anchor' in chosen)
        return enclose(nds, [], frameFrom(nds, id, type, { ...chosen.anchor, ...FRAME }))
      const frame = frameAround(nds, chosen.ids, id, type)
      return frame ? enclose(nds, chosen.ids, frame) : nds
    })
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
        // one node for the same menu over one thing, and empty ground for an
        // empty frame to fill.
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
      </ReactFlow>
      {/* Over the board rather than beside it, so opening the panel doesn't
          reflow the canvas under the cursor. Both rails are mounted and only
          one is ever pointed at anything — an id is a node's or an edge's —
          so each slides on its own instead of one popping in where the other
          was. */}
      <Menu
        at={menu}
        subject={subject}
        title={menu && 'ids' in menu ? 'Enclose in' : 'New Boundary'}
        onAct={act}
        onPick={pick}
        onClose={() => setMenu(null)}
      />
      <ElementForm node={nodes.find((n) => n.id === editing)} onClose={close} />
      <RelationshipForm edge={edges.find((e) => e.id === editing)} onClose={close} />
    </WardContext.Provider>
  )
}
