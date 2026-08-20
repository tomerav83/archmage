import type { Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { faces, place } from './DiagramCanvas'
import type { ElementNodeType } from './ElementNode'

// A card at the given position, 200×80 like the stylesheet makes them.
const card = (x: number, y: number, width = 200, height = 80) =>
  ({ position: { x, y }, measured: { width, height } }) as Node

describe('which faces an edge joins', () => {
  it('leaves the flank when the cards are set side by side', () => {
    expect(faces(card(0, 0), card(400, 0))).toEqual(['r', 'l'])
    expect(faces(card(400, 0), card(0, 0))).toEqual(['l', 'r'])
  })

  it('leaves the top or the foot when one card sits above the other', () => {
    expect(faces(card(0, 0), card(0, 400))).toEqual(['b', 't'])
    expect(faces(card(0, 400), card(0, 0))).toEqual(['t', 'b'])
  })

  it('gives the axis to the wider gap', () => {
    expect(faces(card(0, 0), card(100, 400))).toEqual(['b', 't'])
    expect(faces(card(0, 0), card(400, 100))).toEqual(['r', 'l'])
  })

  it('measures centre to centre, not corner to corner', () => {
    // Corner to corner the second card is off to the right; from the middle of
    // a wide card it is mostly below.
    expect(faces(card(0, 0, 400, 40), card(250, 200, 40, 40))).toEqual(['b', 't'])
  })

  it('takes a card the board has not measured yet as a point', () => {
    const justDropped = { position: { x: 400, y: 0 } } as Node
    expect(faces(card(0, 0), justDropped)).toEqual(['r', 'l'])
  })
})

// Only the two things place() reads: what kind of node it is, and which one it
// is once it is on the board.
const dropped = (id: string, type: 'element' | 'boundary') =>
  ({ id, type, position: { x: 0, y: 0 }, data: {} }) as unknown as ElementNodeType

describe('where a new node joins the board', () => {
  it('puts a frame at the front, so it is painted behind what it holds', () => {
    const board = place([dropped('card', 'element')], dropped('zone', 'boundary'))
    expect(board.map((n) => n.id)).toEqual(['zone', 'card'])
  })

  it('puts a card at the back, so a frame dropped first still stands behind it', () => {
    const board = place([dropped('zone', 'boundary')], dropped('card', 'element'))
    expect(board.map((n) => n.id)).toEqual(['zone', 'card'])
  })

  it('keeps every frame ahead of every card, however they were dropped', () => {
    // The invariant nesting will need of it: React Flow only accepts a parent
    // that stands before its children in the array, and warns to the console
    // rather than failing when it does not.
    const board = [
      dropped('card-1', 'element'),
      dropped('zone-1', 'boundary'),
      dropped('card-2', 'element'),
      dropped('zone-2', 'boundary'),
    ].reduce<ElementNodeType[]>((nds, n) => place(nds, n), [])
    expect(board.map((n) => n.id)).toEqual(['zone-2', 'zone-1', 'card-1', 'card-2'])
  })
})
