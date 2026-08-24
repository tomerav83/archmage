import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type Node, ReactFlowProvider } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DiagramCanvas, faces, place } from './DiagramCanvas'
import { setDraggedType } from './dragAndDrop'
import type { ElementNodeType } from './ElementNode'

afterEach(cleanup)

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

// Enough DataTransfer for the two calls a drop makes — jsdom's own is
// read-only, and fireEvent will not mint one.
const carrying = (key?: 'system-boundary' | 'container') => {
  const held = new Map<string, string>()
  const dt = {
    effectAllowed: '',
    dropEffect: '',
    setData: (type: string, value: string) => void held.set(type, value),
    getData: (type: string) => held.get(type) ?? '',
  } as unknown as DataTransfer
  if (key) setDraggedType(dt, key)
  return dt
}

// The rack's half of the drop is ElementRack.test.tsx; this is the board's
// half, and it is the only test that renders the canvas itself.
const board = () => {
  render(
    <ReactFlowProvider>
      <DiagramCanvas />
    </ReactFlowProvider>,
  )
  return document.querySelector('.react-flow__pane') as Element
}

const drop = (pane: Element, dt: DataTransfer) => {
  fireEvent.dragOver(pane, { dataTransfer: dt })
  fireEvent.drop(pane, { dataTransfer: dt })
}

describe('what a drop lands', () => {
  it('lands a frame for a type that holds things, and a card for one that does not', () => {
    const pane = board()
    drop(pane, carrying('system-boundary'))
    expect(document.querySelector('.c4-frame')).toBeTruthy()
    expect(screen.getByText('System Boundary')).toBeTruthy()

    cleanup()
    drop(board(), carrying('container'))
    expect(document.querySelector('.c4-frame')).toBeNull()
    expect(document.querySelector('.c4-node')).toBeTruthy()
  })

  it('lands nothing at all for a drag that carries none of ours', () => {
    // A file, a link, a drag out of another app: the board is left as it was.
    const pane = board()
    drop(pane, carrying())
    expect(document.querySelector('.react-flow__node')).toBeNull()
  })
})

describe('a frame is ground as far as an open ward is concerned', () => {
  it('calls one off when it is pressed, the way empty ground does', () => {
    const pane = board()
    drop(pane, carrying('system-boundary'))
    const frame = document.querySelector('.react-flow__node') as Element
    // No ward is open — a frame carries none of its own — so the press has
    // nothing to cancel and nothing to arm, which is the whole assertion.
    fireEvent.click(frame)
    expect(document.querySelector('.c4-frame')).toBeTruthy()
  })
})
