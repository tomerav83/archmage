import type { Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { faces } from './DiagramCanvas'

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
