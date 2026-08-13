import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ReactFlow, ReactFlowProvider, useNodesState } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ElementNode, type ElementNodeType } from './ElementNode'

afterEach(cleanup)

// jsdom has none and React Flow measures every node with one.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const nodeTypes = { element: ElementNode }

// One card on a real board, because a rename has to travel the whole way: the
// card writes to node data, the canvas holds it, the card reads it back.
function Board() {
  const [nodes, , onNodesChange] = useNodesState<ElementNodeType>([
    {
      id: 'a',
      type: 'element',
      position: { x: 0, y: 0 },
      data: { kind: 'container', label: 'Orders' },
    },
  ])
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={nodes} nodeTypes={nodeTypes} onNodesChange={onNodesChange} />
    </ReactFlowProvider>
  )
}

// On the card, not on the name under the cursor: the ward captures the pointer
// on every press, so the browser aims the dblclick at the element holding the
// capture. Opening it off the name passes here and does nothing in a browser.
const openTheCard = () =>
  fireEvent.doubleClick(screen.getByText('Orders').closest('.c4-node') as Element)
const type = (field: string, value: string) =>
  fireEvent.change(screen.getByLabelText(field), { target: { value } })

describe('naming a card', () => {
  it('reads level · type in the band', () => {
    render(<Board />)
    expect(screen.getByText('Container · Container')).toBeTruthy()
  })

  it('keeps the name and the technology after the fields close', () => {
    render(<Board />)
    openTheCard()
    type('Name', 'Orders Service')
    type('Technology', 'Go 1.22')
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Enter' })

    expect(screen.queryByLabelText('Name')).toBeNull()
    expect(screen.getByText('Orders Service')).toBeTruthy()
    expect(screen.getByText('Go 1.22')).toBeTruthy()
  })

  it('leaves the caret where it was put', () => {
    render(<Board />)
    openTheCard()
    const tech = screen.getByLabelText('Technology')
    tech.focus()
    type('Technology', 'Go')

    // The name field takes the caret when the fields open, and never again.
    expect(document.activeElement).toBe(tech)
  })

  it('holds the fields open while focus moves between them', () => {
    render(<Board />)
    openTheCard()
    fireEvent.blur(screen.getByLabelText('Name'), {
      relatedTarget: screen.getByLabelText('Technology'),
    })

    expect(screen.getByLabelText('Name')).toBeTruthy()
  })

  it('closes the fields when focus leaves the card', () => {
    render(<Board />)
    openTheCard()
    fireEvent.blur(screen.getByLabelText('Name'), { relatedTarget: document.body })

    expect(screen.queryByLabelText('Name')).toBeNull()
  })
})
