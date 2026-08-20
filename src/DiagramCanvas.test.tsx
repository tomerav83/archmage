import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type InternalNode, ReactFlowProvider } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DiagramCanvas, faces } from './DiagramCanvas'
import { setDraggedType } from './dragAndDrop'

afterEach(cleanup)

// A card at the given place on the board, 200×80 like the stylesheet makes
// them. The board is what an internal node carries: position is the node's own,
// and it stops meaning board coordinates the moment a frame holds it.
const card = (x: number, y: number, width = 200, height = 80) =>
  ({
    position: { x: 0, y: 0 },
    internals: { positionAbsolute: { x, y } },
    measured: { width, height },
  }) as unknown as InternalNode

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
    const justDropped = {
      position: { x: 0, y: 0 },
      internals: { positionAbsolute: { x: 400, y: 0 } },
    } as unknown as InternalNode
    expect(faces(card(0, 0), justDropped)).toEqual(['r', 'l'])
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
