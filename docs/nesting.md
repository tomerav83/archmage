# Nesting

Twelve of the 82 types are not boxes on the board, they are the board under
other boxes: six Boundaries & Zones, six Deployment & Infrastructure.
taxonomy.md calls that "a new mechanic, not a new sigil", and defers it to the
end of the stack because it is the only thing left that is interaction work
rather than a table.

This is that mechanic. Read it beside [taxonomy.md](taxonomy.md); the branches
here are its Phase D.

## The mechanic, verified

React Flow, v12.11.3 as installed, read from `node_modules` rather than from
the guides:

- **`parentId` is the whole of sub-flows.** A child's `position` becomes
  parent-relative the moment it has one; `internals.positionAbsolute` is
  derived. Nothing else about a node changes.
- **`extent: 'parent'` clips a child to its frame, and cages it there.**
  `calculateChildXYZ` clamps the child on every frame of the drag, so a card
  put in a boundary can never be dragged out of one: the drag stops at the
  edge, the middle stays inside, and whatever decides the parent decides it is
  still in. Verified in the browser, not reasoned about. A boundary holds what
  is put in it and does not keep it, so nothing here sets an extent.
- **Parents must stand before their children in the `nodes` array.**
  `adoptUserNodes` walks it once, and a child seen first warns *Parent node …
  not found. Please make sure that parent nodes are in front of their child
  nodes*. That ordering is an invariant this code has to keep. One sort, below.
- **Depth handles z on its own.** Each root parent is lifted by 10 and every
  child sits above its parent, in the default `zIndexMode`. No node in this
  plan carries a `zIndex`, and a frame cannot cover the cards standing in it
  whatever order they were dropped in.
- **Nothing reparents by itself.** There is no drop-into-node event and no
  auto-adopt: `getIntersectingNodes(node, partially?)` on the instance is the
  hit test, in board coordinates, and the rest is ours. This is the branch's
  real content.
- **`NodeResizer` is already paid for.** It ships in the package's
  `additional-components`, and `App.tsx` already imports the stylesheet it
  wants. A frame with a size costs one component and two numbers.

## A frame is not a card

`BoundaryNode.tsx` is a band and a floor: the level·type strip across the top,
the name beside it, and beneath that nothing at all — the body is the ground
its children stand on.

It carries no subtitle, because `fields.ts` already gives Boundaries & Zones no
field beyond Name and Description — *a boundary is a name and a reason*. It
carries no handles and no ward: neither Structurizr nor C4-PlantUML draws a
relationship to a boundary, and a frame that answered a press with a ward would
arm itself every time somebody dragged the thing.

Node data is the element's, unchanged:

```ts
export type ElementNodeType = Node<
  { type: TypeKey; label: string } & Partial<Record<FieldKey, string>>,
  'element' | 'boundary'
>
```

One union member. `ElementForm`, `fieldsFor`, `updateNodeData` and the whole
drop path are untouched — a frame is edited by the same rail, off the same
table, because it is the same data with a different renderer.

Which renderer is a line in the registry, beside `level` and `category`:

```ts
export type ElementType = {
  …
  frame?: true // this type holds other elements — see docs/nesting.md
}
```

Not a category test. Deployment & Infrastructure is half frames and half cards
— a Cluster holds things, an Instance does not — so the fact belongs on the
type, which is where every other fact about a type already lives. The drop
reads it once:

```ts
type: TYPES[key].frame ? 'boundary' : 'element'
```

## Two gestures in, one mechanic underneath

A boundary is arrived at two ways, and both start with a right-click and a
dropdown rather than a trip to the rack.

**Enclose what is already selected.** Select first — shift-drag marquees,
ctrl-click adds, both React Flow's own — then right-click the selection.
`onSelectionContextMenu(event, nodes)` hands over exactly what was picked, so
the menu only has to name the kind:

```
shift-drag over the cards  →  right-click  →  Enclose in ▸ System Boundary
                              ↓
      a frame at the selection's own bounds, holding all of it, named in the rail
```

**Draw the rectangle instead.** Right-click empty ground first, before
selecting anything — the point clicked is the rectangle's fixed corner — pick
a kind, then press, drag and release to grow it from there:

```
right-click empty ground  →  New Boundary ▸ System Boundary  →  drag, release
        ↓ (anchor fixed here)                                        ↓
                                        a frame at exactly that rectangle,
                                        holding whatever's middle fell inside it
```

This is the one actually asked for — draw the box, catch what's in it — and
it is the door for a boundary with nothing in it yet, since a rectangle drawn
over empty ground still makes a frame. Escape calls it off before the release;
too small a drag (a plain click through the menu) falls back to the same
default size a rack drop starts a frame at, rather than minting something too
small to hold anything.

The press that grows the rectangle is captured — `setPointerCapture` on the
same pointerdown that arms it — so it keeps reporting even once the cursor
wanders off the canvas, over the rack say, the same bargain `useWard` already
strikes for its own press. `panOnDrag` and `nodesDraggable` freeze for the
gesture's whole span, from the moment a kind is picked, not just the drag
itself — otherwise that same press would also try to pan the board. The
rectangle itself renders live inside `<ViewportPortal>`, a plain div in the
flow's own transform, so panning and zooming mid-drag move it for free instead
of a screen-space overlay having to track the viewport by hand.

Both menus are one component, `Enclose.tsx`, told what to say by a `title`
prop — *Enclose in* over a selection, *New Boundary* over empty ground — and
both list every type in the registry with a `frame` flag, so Phase D's
deployment frames join either one by landing in a table.

Not a trip to the rack in the literal sense either: `PALETTE` in `c4.tsx` is
`TYPES` with every `frame` filtered out, and it is what the rack's shelves and
its search both read instead of `TYPES` directly, so a frame is unreachable
from the rack rather than merely uninvited. One filter, read from two places,
rather than two places each remembering to exclude the same six — and later
twelve — types on their own.

## `nesting.ts` — the reparenting, and all of it

Pure, so the hard part is tested without a canvas. Nine functions, all of them
working in board coordinates and converting at the edges:

```ts
place(nodes, node)                       // a frame joins at the front, a card at the back
nest(nodes, ids, parent?)                // hand these to that frame, or back to the board
frameAt(nodes, point, moving?)           // the innermost frame a point falls in
reparent(nodes, ids)                     // after a drag: whatever their middles are over
frameAround(nodes, ids, id, type)        // the frame a selection asks for
frameFrom(nodes, id, type, rect)         // the frame a drawn rectangle asks for
within(nodes, rect, parent?)             // which nodes that rectangle's middle caught
rectBetween(a, b)                        // the rectangle between two points, either way dragged
enclose(nodes, ids, frame)               // place it, then hand it what it was drawn around
```

Six decisions inside them:

- **The middle of the card decides, not the cursor and not an overlap.**
  `getIntersectingNodes` answers *which frames does this touch*, and a card
  half out of a zone touches two. Its middle answers *which frame is it in*,
  which is the question — and it is a `contains` on a rect this file computes
  itself, from positions it has already had to make absolute. `within` asks
  the identical question of a drawn rectangle rather than an existing frame.
- **Rebasing is subtraction, both ways.** Into a frame, the new position is the
  node's board position minus the frame's; out of one, it is the board position
  as it stands. Board position is walked up the `parentId` chain rather than
  read off `position`, which is exactly the value that changes meaning.
- **No extent.** See above: it is a cage, not a container.
- **The sort is by depth, and it is stable.** Parents before children is all
  React Flow asks; ordering within a rank is `place`'s, which is what a stable
  `Array.prototype.sort` preserves for free.
- **A frame is never handed itself or one of its own children.** Walking up
  from the candidate is the cheap way to ask, and it is the one arrangement
  React Flow cannot draw. `within` asks the same question in reverse — a
  rectangle drawn near the middle of a big region can have that region's own
  middle fall inside it, and adopting an ancestor as a child is the same
  cycle, just arrived at from a rectangle instead of a drag.
- **A drawn frame takes its parent the way a drag would.** `frameFrom` calls
  `frameAt` on the rectangle's own middle, so a boundary drawn inside a system
  boundary stands inside it too — the identical rule `frameAround` already
  applies to a selection's bounds, now applied to a rectangle nobody selected
  anything to produce.

Five callers: `onSelectionContextMenu` and `onNodeContextMenu` summon the
enclose menu; `onPaneContextMenu` summons the other one and fixes the anchor;
`onPointerDown/Move/Up` on the canvas track the rectangle once a kind is
picked; `onNodeDragStop` reparents everything that was dragged; and the rack's
drop lands in whichever frame is under the cursor.

## The bug nesting introduces

`faces()` in `DiagramCanvas` picks which sides an edge leaves and lands on from
`n.position`. That value is parent-relative the instant a node is nested, so an
edge from a card inside a boundary to one outside it would leave the wrong
flank — and it would do it silently, since the numbers stay plausible.

The fix is the same value in board coordinates: `positionAbsolute` off
`getInternalNode`, which is what that method is for. It lands in the nesting
branch, not a later one, because that is the branch that breaks it, and
`DiagramCanvas.test.ts` now has a nested card in its fixtures.

The edges themselves need nothing. An edge holds two ids and no coordinates, so
nesting cannot disturb it, and children move with their frame — the lines
follow because the anchors do.

One older bug surfaced with it, and is fixed here for the same reason: the rail
asks for the caret as the name field mounts, and a panel opened by a drop mounts
while the drag is still running, where a browser ignores it. The first thing
typed after a drop went on the floor perhaps two times in three. The caret is
now asked for a task later, after the drag has ended.

## Deployment is a level, not a mechanic

`c4.tsx` says it in a comment already: *there is no deployment level yet, so a
type the catalogue also gives a Dep stands as a container until the deployment
view lands*. This is that branch, and it is a table again once the frames work.

`LEVELS` gains its fourth and last pigment — violet, the one hue not spoken for
by context blue, container teal and component amber:

```ts
deployment: { title: 'Deployment', accent: '#8878c4', ink: '#a394e0' },
```

`catalog/deployment.tsx` is the twelfth shelf and the last one:
Deployment Environment, Region / Zone, Cluster / Orchestrator and Compute Node
are frames; Infrastructure Node and Instance are cards. `catalog/tech.ts` takes
twelve new lines with them — it is a `Record<TypeKey, string[]>`, so a type
without one is a compile error, which is the check working.

Two existing types move. WAF / Firewall and Trust Zone are Dep-only in the
catalogue and stand as containers today, which is what `c4.tsx` warns about in
the same comment. Each becomes `level: 'deployment'`, one word apiece.

The rack needs nothing. `SHELVES` already filters to the categories that have
types in them, so both shelves light up the moment their files exist.

## The one reference the model gains

An Instance is *a container or system, deployed here* — the first field in the
whole catalogue whose options are the board rather than the registry.

It costs a `FieldKey`, a line in `fields.ts`, and three in `ElementForm`, which
stamps the options from `getNodes()` exactly the way `fieldsFor` stamps the
technology shortlist from `TECH`. `Form.tsx` learns nothing: a pick with
options is a control that already exists.

It stores the **name**, not the id — every other field on the board is a
string, and persistence stays a dump of node data with nothing to resolve. The
ceiling is honest: rename the container and the reference goes stale. Ids the
day a reference has to survive a rename, and that is a migration of one field.

## The stack

Four branches. The first two are the interaction work; the last two are the
tables that ride on it.

**15. `feature/boundaries`** — the frame itself. `catalog/boundaries.tsx`,
`BoundaryNode.tsx`, `NodeResizer`, the `frame` flag, the union member, the
drop's one line. Nothing nests yet: a frame is a box you can drop, name and
size. Done when a System Boundary lands on the board, takes a name from the
rail and resizes.

**16. `feature/nesting`** — `nesting.ts`, `Enclose.tsx`, the drag in and out,
the drop into a frame, and the `faces()` fix. Done when two selected cards
enclose into a named system boundary and travel with it, a third dragged in
joins them and dragged out leaves, and an edge out of a nested card still
leaves the right flank.

**17. `feature/deployment-view`** — the fourth level, `catalog/deployment.tsx`,
twelve `tech.ts` lines, WAF re-levelled. Done when a compute node sits in a
cluster sits in a region.

**18. `feature/instance-of`** — the reference above. Done when an Instance in a
cluster can say which container it is, and the pick offers the containers on
the board.

Persistence follows, and is the reason the order is this one: it is the branch
that has to know `parentId` and `instanceOf`, and a file format written before
them is a file format migrated after them.

## Testing

`nesting.ts` is pure, and it is where the tests go: deepest frame wins, a frame
never adopts itself, a card's centre decides when it straddles an edge,
rebasing in and out is subtraction both ways, and the sorted board never puts a
child before its parent. That last one is worth an assertion of its own — it is
the invariant React Flow only tells you about in a console warning.

`BoundaryNode.test.tsx` takes the `ElementNode.test.tsx` harness: the band
reads *Container · System Boundary*, the name renders, and there are no
handles.

`DiagramCanvas.test.ts` gains the nested case for `faces()` — a card at
`position: {x: 20, y: 20}` inside a frame at `{x: 400, y: 0}` joins to the
right of a card at the origin, which is the assertion that fails today.

The drag-stop wiring itself is React Flow's, and it is asserted through the
pure function rather than through a synthesised pointer sequence over a
measured canvas — the same bargain `useWard` made.

## Out of scope

**Relationships to and from a boundary.** Neither source tool draws them; a
line to a zone means a line to something in it.

**`expandParent`.** One flag, and it makes a frame grow rather than clip when a
card is dragged past its edge. Clipping is the criterion in taxonomy.md and the
behaviour every C4 tool has; the flag is there the day the other one is wanted.

**Collapsing a frame to a card.** The zoom-out gesture every diagram tool
eventually grows. It wants hidden edges rerouted to the frame, which is a
graph problem, not a nesting one.

**Auto-layout inside a frame.** Nothing here places anything; the board is
hand-drawn, and taxonomy.md keeps it that way.

**A card in two zones.** `parentId` is one. A card that is in the PCI zone and
the EU region is a tags problem, and tags already exist.

**A marquee drawn without arming it first.** A plain drag over empty ground
still has to mean panning most of the time — the board is panned far more
often than a boundary is drawn — so the rectangle tool only takes over the
drag once a kind has been picked from the menu. Two ways in cover it: select
first and enclose, or right-click and draw. A third that free-drags a
rectangle before anyone has said what it is for would just be a worse way to
ask the same question the menu already asks first.

**Nesting a drawn frame by right-clicking an existing one's floor.** A
boundary node fills its own hit area, so a right-click anywhere inside it,
even where nothing is drawn, is a right-click *on that node* — the enclose
menu for it alone, not the empty-ground one. Dropping a fresh boundary from
the rack into an existing frame still nests it the ordinary way; only the
draw-a-rectangle gesture is out of reach from inside another frame's floor,
and it is a rarer case than the two doors already open.

**Releasing a node from its frame by menu.** Dragging it out is the gesture,
and it works because nothing is clipped. If clipping is ever wanted back, this
is the escape hatch it needs first.

**Deployment as a separate view.** Structurizr has views because it renders
from a model; this is one board, and a level is pigment on it. Filtering the
board by level is a rack question whenever somebody asks it.
