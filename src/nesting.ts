import type { XYPosition } from '@xyflow/react'
import { TYPES, type TypeKey } from './c4'
import type { ElementNodeType } from './ElementNode'

/**
 * What holds what. Everything here is pure and everything here works in board
 * coordinates, which is the one fact that earns the file: a node's own position
 * is relative to whatever holds it the moment anything does, so every question
 * worth asking — which frame is this in, where would it sit if that frame took
 * it — has to convert first and convert back.
 */

const index = (nodes: ElementNodeType[]) => new Map(nodes.map((n) => [n.id, n]))
type Index = ReturnType<typeof index>

// A plain rectangle in board coordinates — what a rect() lookup answers for
// one node, and what a drawn selection answers for a whole gesture.
export type Rect = { x: number; y: number; width: number; height: number }

// Where a node stands on the board, rather than inside its parent.
const absolute = (at: Index, node: ElementNodeType): XYPosition => {
  const parent = node.parentId ? at.get(node.parentId) : undefined
  if (!parent) return node.position
  const held = absolute(at, parent)
  return { x: held.x + node.position.x, y: held.y + node.position.y }
}

// A frame is given a size at the drop and resized by its grips; a card is as
// big as what it says, so the board measures it.
const size = (n: ElementNodeType) => ({
  width: n.width ?? n.measured?.width ?? 0,
  height: n.height ?? n.measured?.height ?? 0,
})

const rect = (at: Index, n: ElementNodeType) => ({ ...absolute(at, n), ...size(n) })

const mid = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 })

const depth = (at: Index, node: ElementNodeType) => {
  let deep = 0
  for (let p = node.parentId; p; p = at.get(p)?.parentId) deep++
  return deep
}

// Would taking this frame put a node inside itself? Walking up from the frame
// is the cheap way to ask, and it is the one arrangement React Flow cannot draw.
const under = (at: Index, frame: ElementNodeType, id?: string) => {
  for (let p: string | undefined = frame.id; p; p = at.get(p)?.parentId) if (p === id) return true
  return false
}

const inside = (r: Rect, at: XYPosition) =>
  at.x >= r.x && at.x <= r.x + r.width && at.y >= r.y && at.y <= r.y + r.height

// Parents before children: React Flow accepts a parent only where it stands
// ahead of its children, and warns to the console rather than failing when it
// does not. A sort by depth is the whole of that rule, and it is stable, so a
// frame keeps the front of the array it was put at inside its own rank.
const ordered = (nodes: ElementNodeType[]) => {
  const at = index(nodes)
  return [...nodes].sort((a, b) => depth(at, a) - depth(at, b))
}

// Hand these nodes to that frame — or back to the board — each keeping the
// place it holds on the board.
//
// No extent: React Flow will clip a child to its parent for the price of one
// property, and the price is that the child can never be dragged out again —
// the drag stops at the edge, the middle stays in, and the frame has caged it.
// A boundary holds what is put in it; it does not keep it.
export function nest(nodes: ElementNodeType[], ids: string[], parent?: string): ElementNodeType[] {
  const at = index(nodes)
  const held = parent ? absolute(at, at.get(parent) as ElementNodeType) : { x: 0, y: 0 }
  const taken = new Set(ids)

  return ordered(
    nodes.map((n) => {
      if (!taken.has(n.id)) return n
      const { x, y } = absolute(at, n)
      return { ...n, parentId: parent, position: { x: x - held.x, y: y - held.y } }
    }),
  )
}

// The frame a point falls in: the innermost, since a region holds a cluster
// holds a node.
export function frameAt(nodes: ElementNodeType[], at: XYPosition, moving?: string) {
  const idx = index(nodes)
  return nodes
    .filter((n) => n.type === 'boundary' && !under(idx, n, moving) && inside(rect(idx, n), at))
    .sort((a, b) => depth(idx, b) - depth(idx, a))[0]
}

// After a drag: whichever frame a node's middle now falls in takes it, and one
// dragged clear of every frame goes back to the board. The middle decides, not
// the cursor and not an overlap — a card half out of a zone touches two of them.
export const reparent = (nodes: ElementNodeType[], ids: string[]) =>
  ids.reduce((nds, id) => {
    const at = index(nds)
    const node = at.get(id)
    if (!node) return nds
    const frame = frameAt(nds, mid(rect(at, node)), id)
    // Same frame it was already in — including no frame at all, which is most
    // drags. Nothing to rewrite, and nothing to re-render.
    return frame?.id === node.parentId ? nds : nest(nds, [id], frame?.id)
  }, nodes)

// Room for the band and the name over what is enclosed, an even hand elsewhere.
const PAD = { top: 48, side: 28, foot: 28 }

// A frame standing at that rectangle, said relative to whatever holds it. The
// two makers below are the same node twice over; all they disagree about is
// where the rectangle comes from and which frame takes the new one.
const framed = (
  at: Index,
  id: string,
  type: TypeKey,
  box: Rect,
  parent?: string,
): ElementNodeType => {
  const held = parent ? absolute(at, at.get(parent) as ElementNodeType) : { x: 0, y: 0 }
  return {
    id,
    type: 'boundary',
    position: { x: box.x - held.x, y: box.y - held.y },
    width: box.width,
    height: box.height,
    ...(parent && { parentId: parent }),
    data: { type, label: TYPES[type].title },
  }
}

/**
 * A frame drawn around what is already on the board. This is how most
 * boundaries are made — the boxes are drawn first and only then does anybody
 * say what they add up to — so it takes the selection's own bounds rather than
 * a rectangle somebody dragged.
 *
 * It joins whatever holds the selection, so enclosing two components inside a
 * system boundary leaves the new frame inside that boundary rather than over
 * it. Where the selection does not agree on one parent, the frame stands on
 * the board and everything it takes keeps the place it had.
 */
export function frameAround(
  nodes: ElementNodeType[],
  ids: string[],
  id: string,
  type: TypeKey,
): ElementNodeType | undefined {
  const at = index(nodes)
  const taken = ids.map((i) => at.get(i)).filter((n) => !!n)
  const [first] = taken
  if (!first) return

  const rects = taken.map((n) => rect(at, n))
  const x = Math.min(...rects.map((r) => r.x)) - PAD.side
  const y = Math.min(...rects.map((r) => r.y)) - PAD.top
  const right = Math.max(...rects.map((r) => r.x + r.width)) + PAD.side
  const foot = Math.max(...rects.map((r) => r.y + r.height)) + PAD.foot

  const parent = taken.every((n) => n.parentId === first.parentId) ? first.parentId : undefined
  return framed(at, id, type, { x, y, width: right - x, height: foot - y }, parent)
}

// Put that frame on the board and hand it what it was drawn around. At the
// front: React Flow paints the array in the order it is given, and a frame
// stands behind what it holds. Among frames it is drawing order, which is all
// it can be.
export const enclose = (nodes: ElementNodeType[], ids: string[], frame: ElementNodeType) =>
  nest([frame, ...nodes], ids, frame.id)

// The rectangle between two points, whichever way it was dragged — a right-
// click fixes one corner and the pointer that follows fixes the other.
export const rectBetween = (a: XYPosition, b: XYPosition): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
})

/**
 * A frame at exactly the rectangle drawn for it — the other way a boundary is
 * made, next to frameAround's "already-selected" one: here the rectangle
 * comes first and the membership follows from it, via within() below.
 *
 * It takes its parent the way a drag would: whichever frame the rectangle's
 * own middle falls in, the same rule frameAt answers everywhere else, so a
 * boundary drawn inside a system boundary stands inside it too.
 */
export function frameFrom(
  nodes: ElementNodeType[],
  id: string,
  type: TypeKey,
  drawn: Rect,
): ElementNodeType {
  return framed(index(nodes), id, type, drawn, frameAt(nodes, mid(drawn))?.id)
}

/**
 * Which existing nodes a drawn rectangle takes: whatever's middle falls
 * inside it, the same rule a drag already answers with — a frame half in view
 * is taken exactly when a card would be.
 *
 * `parent` is the frame the rectangle is about to stand inside, from
 * frameFrom above. Excluded from what it takes, along with everything it
 * itself stands inside: a rectangle drawn near the middle of a big region can
 * have that region's own middle fall inside it too, and adopting an ancestor
 * as a child is not a nesting, it is a cycle depth() would spin on forever.
 */
export function within(nodes: ElementNodeType[], box: Rect, parent?: string): string[] {
  const at = index(nodes)
  const guard = parent ? at.get(parent) : undefined
  return nodes
    .filter((n) => inside(box, mid(rect(at, n))))
    .filter((n) => !(guard && under(at, guard, n.id)))
    .map((n) => n.id)
}
