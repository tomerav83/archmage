import { describe, expect, it } from 'vitest'
import type { ElementNodeType } from './ElementNode'
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

// A card is measured by the board; a frame is given a size at the drop. Both
// carry the position they were last written with, which is relative to their
// parent wherever they have one.
const card = (id: string, x: number, y: number, parentId?: string) =>
  ({
    id,
    type: 'element',
    position: { x, y },
    measured: { width: 200, height: 80 },
    ...(parentId && { parentId }),
    data: { type: 'container', label: id },
  }) as ElementNodeType

const frame = (id: string, x: number, y: number, width = 400, height = 300, parentId?: string) =>
  ({
    id,
    type: 'boundary',
    position: { x, y },
    width,
    height,
    ...(parentId && { parentId }),
    data: { type: 'system-boundary', label: id },
  }) as ElementNodeType

const at = (nodes: ElementNodeType[], id: string) => nodes.find((n) => n.id === id)

describe('taking a node into a frame', () => {
  it('keeps the place it holds on the board, said relative to the frame', () => {
    const nested = nest([frame('z', 100, 100), card('a', 340, 260)], ['a'])
    expect(at(nested, 'a')?.position).toEqual({ x: 340, y: 260 })

    const taken = nest([frame('z', 100, 100), card('a', 340, 260)], ['a'], 'z')
    expect(at(taken, 'a')?.position).toEqual({ x: 240, y: 160 })
  })

  it('holds it without caging it: it can always be dragged back out', () => {
    const taken = nest([frame('z', 100, 100), card('a', 340, 260)], ['a'], 'z')
    // No extent, ever. React Flow would clip a child to its frame for one
    // property, and a clipped child cannot be dragged out of it again.
    expect(at(taken, 'a')?.extent).toBeUndefined()

    const freed = nest(taken, ['a'])
    expect(at(freed, 'a')?.parentId).toBeUndefined()
    // and it has not moved on the board
    expect(at(freed, 'a')?.position).toEqual({ x: 340, y: 260 })
  })

  it('reads through a chain of frames, not just the one above', () => {
    // An outer frame at 100, an inner one 50 into it, a card 30 into that: the
    // card stands at 180 on the board and is 80 into the outer frame.
    const board = [
      frame('outer', 100, 100),
      frame('inner', 50, 50, 300, 200, 'outer'),
      card('a', 30, 30, 'inner'),
    ]
    expect(at(nest(board, ['a'], 'outer'), 'a')?.position).toEqual({ x: 80, y: 80 })
    expect(at(nest(board, ['a']), 'a')?.position).toEqual({ x: 180, y: 180 })
  })

  it('stands every parent ahead of its children, whatever order they came in', () => {
    // The rule React Flow only warns about: a child seen before its parent is
    // dropped from the board with a console message.
    const board = nest(
      [card('a', 0, 0), frame('inner', 0, 0), frame('outer', 0, 0)],
      ['inner'],
      'outer',
    )
    const nested = nest(board, ['a'], 'inner')
    expect(nested.map((n) => n.id)).toEqual(['outer', 'inner', 'a'])
  })
})

describe('which frame a point is in', () => {
  const board = [
    frame('outer', 0, 0, 600, 600),
    frame('inner', 100, 100, 200, 200, 'outer'),
    card('a', 20, 20),
  ]

  it('takes the innermost, since a region holds a cluster holds a node', () => {
    expect(frameAt(board, { x: 150, y: 150 })?.id).toBe('inner')
    expect(frameAt(board, { x: 450, y: 450 })?.id).toBe('outer')
  })

  it('is nothing at all off the frames', () => {
    expect(frameAt(board, { x: 900, y: 900 })).toBeUndefined()
  })

  it('never hands a frame to itself or to one it holds', () => {
    // Dragging the outer frame over its own child is the one arrangement React
    // Flow cannot draw.
    expect(frameAt(board, { x: 150, y: 150 }, 'outer')).toBeUndefined()
    expect(frameAt(board, { x: 150, y: 150 }, 'inner')?.id).toBe('outer')
  })
})

describe('after a drag', () => {
  it('gives the node to the frame its middle was let go over', () => {
    // The card's own middle is at 200,190 — inside the frame, though its corner
    // is not.
    const board = [frame('z', 150, 150), card('a', 100, 150)]
    expect(at(reparent(board, ['a']), 'a')?.parentId).toBe('z')
  })

  it('gives it back to the board when it is dragged clear', () => {
    const taken = nest([frame('z', 150, 150), card('a', 200, 200)], ['a'], 'z')
    const moved = taken.map((n) => (n.id === 'a' ? { ...n, position: { x: 900, y: 900 } } : n))
    expect(at(reparent(moved, ['a']), 'a')?.parentId).toBeUndefined()
  })

  it('leaves the board alone when nothing changed hands', () => {
    const board = [frame('z', 900, 900), card('a', 0, 0)]
    expect(reparent(board, ['a'])).toBe(board)
  })
})

describe('enclosing what is already on the board', () => {
  const board = [card('a', 100, 100), card('b', 400, 300)]

  it('draws the frame around the selection, with room over it for its name', () => {
    const drawn = frameAround(board, ['a', 'b'], 'z', 'system-boundary')
    // 100,100 to 600,380 across both cards, padded 28 either side and 48 above
    expect(drawn?.position).toEqual({ x: 72, y: 52 })
    expect(drawn?.width).toBe(556)
    expect(drawn?.height).toBe(356)
  })

  it('hands the frame what it was drawn around, each keeping its place', () => {
    const drawn = frameAround(board, ['a', 'b'], 'z', 'system-boundary') as ElementNodeType
    const enclosed = enclose(board, ['a', 'b'], drawn)
    expect(enclosed.map((n) => n.id)).toEqual(['z', 'a', 'b'])
    expect(at(enclosed, 'a')?.parentId).toBe('z')
    // 100,100 on the board, and the frame stands at 72,52
    expect(at(enclosed, 'a')?.position).toEqual({ x: 28, y: 48 })
  })

  it('stands inside whatever holds the selection', () => {
    // Two components inside a system boundary enclose into a container
    // boundary inside that boundary, not over it.
    const held = nest(
      [frame('outer', 100, 100, 800, 800), card('a', 200, 200), card('b', 300, 300)],
      ['a', 'b'],
      'outer',
    )
    const drawn = frameAround(held, ['a', 'b'], 'z', 'container-boundary')
    expect(drawn?.parentId).toBe('outer')
    // 172,152 on the board, said relative to a frame standing at 100,100
    expect(drawn?.position).toEqual({ x: 72, y: 52 })
  })

  it('stands on the board when the selection does not agree on one parent', () => {
    const held = nest(
      [frame('outer', 0, 0, 800, 800), card('a', 200, 200), card('b', 300, 300)],
      ['a'],
      'outer',
    )
    expect(frameAround(held, ['a', 'b'], 'z', 'domain')?.parentId).toBeUndefined()
  })

  it('draws nothing around nothing', () => {
    expect(frameAround(board, [], 'z', 'domain')).toBeUndefined()
  })
})

describe('the rectangle between two points', () => {
  it('reads the same box whichever corner was dragged from', () => {
    expect(rectBetween({ x: 100, y: 100 }, { x: 300, y: 250 })).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    })
    expect(rectBetween({ x: 300, y: 250 }, { x: 100, y: 100 })).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    })
  })
})

describe('a frame at exactly the rectangle drawn for it', () => {
  it('stands wherever that rectangle was, sized to it', () => {
    const drawn = frameFrom([], 'z', 'system-boundary', { x: 120, y: 80, width: 300, height: 200 })
    expect(drawn.position).toEqual({ x: 120, y: 80 })
    expect(drawn.width).toBe(300)
    expect(drawn.height).toBe(200)
    expect(drawn.parentId).toBeUndefined()
  })

  it('takes the frame its own middle falls in, the same rule a drag answers with', () => {
    const board = [frame('outer', 0, 0, 800, 800)]
    const drawn = frameFrom(board, 'z', 'container-boundary', {
      x: 200,
      y: 200,
      width: 100,
      height: 100,
    })
    expect(drawn.parentId).toBe('outer')
    // 200,200 on the board, said relative to a frame standing at 0,0
    expect(drawn.position).toEqual({ x: 200, y: 200 })
  })
})

describe('which nodes a drawn rectangle takes', () => {
  const board = [card('a', 50, 50), card('b', 500, 500)]

  it('takes whatever its middle falls inside, and leaves what it does not', () => {
    const ids = within(board, { x: 0, y: 0, width: 300, height: 300 })
    expect(ids).toEqual(['a'])
  })

  it('can take a frame too, the same as a card', () => {
    const board2 = [frame('inner', 100, 100, 50, 50), card('a', 500, 500)]
    expect(within(board2, { x: 0, y: 0, width: 300, height: 300 })).toEqual(['inner'])
  })

  it('never takes its own parent, or anything that parent itself stands inside', () => {
    // A rectangle drawn near the middle of a big region can have that
    // region's own middle fall inside it — adopting an ancestor as a child
    // would be a cycle, not a nesting, and depth() would spin on it forever.
    const outer = frame('outer', 0, 0, 1000, 1000) // middle at 500,500
    const drawn = { x: 400, y: 400, width: 200, height: 200 } // catches outer's middle
    expect(within([outer], drawn, 'outer')).toEqual([])

    // Two levels up: a rectangle inside the inner frame, drawn where the
    // outer frame's middle happens to fall too.
    const inner = frame('inner', 300, 300, 400, 400, 'outer') // middle at 500,500 on the board
    expect(within([outer, inner], drawn, 'inner')).toEqual([])
  })

  it('draws nothing around an empty rectangle', () => {
    expect(within(board, { x: 900, y: 900, width: 10, height: 10 })).toEqual([])
  })
})

describe('enclosing what a drawn rectangle caught', () => {
  it('goes the whole way: frame, then whatever within() found, adopted', () => {
    const board = [card('a', 50, 50), card('b', 500, 500)]
    const rect = { x: 0, y: 0, width: 300, height: 300 }
    const frame = frameFrom(board, 'z', 'system-boundary', rect)
    const enclosed = enclose(board, within(board, rect, frame.parentId), frame)
    // b never enters the rect, so it stays at depth 0 and sorts ahead of a —
    // the same parents-before-children rule everything else in this file uses.
    expect(enclosed.map((n) => n.id)).toEqual(['z', 'b', 'a'])
    expect(enclosed.find((n) => n.id === 'a')?.parentId).toBe('z')
    expect(enclosed.find((n) => n.id === 'b')?.parentId).toBeUndefined()
  })
})
