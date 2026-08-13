import { cleanup, render, screen } from '@testing-library/react'
import { ReactFlow, ReactFlowProvider, useNodesState } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ElementNode, type ElementNodeType } from './ElementNode'

afterEach(cleanup)

const nodeTypes = { element: ElementNode }

// One card on a real board: the card reads node data and nothing else, so what
// it prints is the whole of it.
function Board({ data }: { data: ElementNodeType['data'] }) {
  const [nodes, , onNodesChange] = useNodesState<ElementNodeType>([
    { id: 'a', type: 'element', position: { x: 0, y: 0 }, data },
  ])
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={nodes} nodeTypes={nodeTypes} onNodesChange={onNodesChange} />
    </ReactFlowProvider>
  )
}

describe('a card', () => {
  it('reads level · type in the band', () => {
    render(<Board data={{ type: 'container', label: 'Orders' }} />)
    expect(screen.getByText('Container · Container')).toBeTruthy()
  })

  it('prints the first field of its category under the name', () => {
    render(<Board data={{ type: 'container', label: 'Orders', technology: 'Go 1.22' }} />)
    expect(screen.getByText('Go 1.22')).toBeTruthy()
  })

  it('prints the field its own category carries, not technology', () => {
    // A person is a job, not a stack: Role is the first field of Actors &
    // Externals, so a technology written on a person has nowhere to print.
    render(
      <Board
        data={{ type: 'person', label: 'Ana', role: 'Support agent', technology: 'Go 1.22' }}
      />,
    )
    expect(screen.getByText('Support agent')).toBeTruthy()
    expect(screen.queryByText('Go 1.22')).toBeNull()
  })

  it('says a deprecated element is deprecated', () => {
    const { container } = render(
      <Board data={{ type: 'container', label: 'Orders', status: 'Deprecated' }} />,
    )
    expect(container.querySelector('.c4-node')?.getAttribute('data-status')).toBe('Deprecated')
  })
})
