import { describe, expect, it } from 'vitest'
import type { ElementNodeType } from './ElementNode'
import { enclose, frameAround, frameAt, nest, place, reparent } from './nesting'

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

describe('where a node joins the board', () => {
  it('puts a frame at the front, so it is painted behind what it holds', () => {
    expect(place([card('a', 0, 0)], frame('z', 0, 0)).map((n) => n.id)).toEqual(['z', 'a'])
  })

  it('puts a card at the back, so a frame dropped first still stands behind it', () => {
    expect(place([frame('z', 0, 0)], card('a', 0, 0)).map((n) => n.id)).toEqual(['z', 'a'])
  })
})

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
