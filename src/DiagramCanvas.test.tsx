import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type InternalNode, ReactFlowProvider } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { TypeKey } from './c4'
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
const carrying = (key?: TypeKey) => {
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

const drop = (pane: Element, dt: DataTransfer, at = { clientX: 100, clientY: 100 }) => {
  fireEvent.dragOver(pane, { dataTransfer: dt, ...at })
  fireEvent.drop(pane, { dataTransfer: dt, ...at })
}

describe('what a drop lands', () => {
  it('lands a card, since the rack faces no frames', () => {
    const pane = board()
    drop(pane, carrying('container'))
    expect(document.querySelector('.c4-node')).toBeTruthy()
    expect(document.querySelector('.c4-frame')).toBeNull()
  })

  it('lands nothing at all for a drag that carries none of ours', () => {
    // A file, a link, a drag out of another app: the board is left as it was.
    drop(board(), carrying())
    expect(document.querySelector('.react-flow__node')).toBeNull()
  })
})

// The two doors to a boundary, driven end to end — nesting.test.ts already
// asks what the rules are, so this asks only that the gestures reach them.
describe('a boundary made on empty ground', () => {
  it('stands an empty frame where the board was right-clicked', () => {
    const pane = board()
    fireEvent.contextMenu(pane, { clientX: 20, clientY: 20 })
    fireEvent.click(screen.getByText('System Boundary'))
    expect(document.querySelector('.c4-frame')).toBeTruthy()
    expect(document.querySelector('.c4-node')).toBeNull()
  })
})

// A person has no moves of its own, so a right-click on one falls through to
// the frames — which is the gesture under test here. A card that does carry
// moves answers the same right-click with them instead; see the actions menu.
describe('enclosing what is already on the board', () => {
  it('draws the frame around the selection and takes it in', () => {
    const pane = board()
    drop(pane, carrying('person'))
    fireEvent.contextMenu(document.querySelector('.react-flow__node') as Element, {
      clientX: 100,
      clientY: 100,
    })
    fireEvent.click(screen.getByText('System Boundary'))
    expect(document.querySelector('.c4-frame')).toBeTruthy()
    expect(document.querySelector('.c4-node')?.getAttribute('data-nested')).toBeTruthy()
  })

  it('leaves an open ward alone for a card, and calls it off for a frame', () => {
    // A frame carries no ward of its own, so as far as an open one is
    // concerned it is ground, and it covers too much of the board not to say so.
    const pane = board()
    drop(pane, carrying('person'))
    fireEvent.click(document.querySelector('.react-flow__node') as Element)

    fireEvent.contextMenu(document.querySelector('.react-flow__node') as Element, {
      clientX: 100,
      clientY: 100,
    })
    fireEvent.click(screen.getByText('System Boundary'))
    fireEvent.click(document.querySelector('.react-flow__node') as Element)
    expect(document.querySelector('.c4-frame')).toBeTruthy()
  })
})

// The other right-click. actions.test.ts asks what a move does to the board;
// this asks only that the gesture reaches it, and that the line arrives said.
describe('a quick action', () => {
  it('drops the element it names and draws the line, in one press and pick', () => {
    const pane = board()
    drop(pane, carrying('container'))
    fireEvent.contextMenu(document.querySelector('.react-flow__node') as Element, {
      clientX: 100,
      clientY: 100,
    })
    fireEvent.click(screen.getByText('Add cache'))

    expect(document.querySelectorAll('.c4-node')).toHaveLength(2)
    expect(screen.getByText('Distributed Cache')).toBeTruthy()
    expect(screen.getByText('reads through')).toBeTruthy()
  })

  // The move names its own element, so there is nothing to fill in — the panel
  // opens on a double-click, for the times you disagree.
  it('does not open the panel', () => {
    const pane = board()
    drop(pane, carrying('container'))
    fireEvent.click(screen.getByLabelText('Close'))
    fireEvent.contextMenu(document.querySelector('.react-flow__node') as Element, {
      clientX: 100,
      clientY: 100,
    })
    fireEvent.click(screen.getByText('Add cache'))
    expect(document.querySelector('.form[data-open]')).toBeNull()
  })
})
