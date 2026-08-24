import { cleanup, render, screen } from '@testing-library/react'
import { ReactFlow, ReactFlowProvider, useNodesState } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BoundaryNode } from './BoundaryNode'
import type { ElementNodeType } from './ElementNode'

afterEach(cleanup)

const nodeTypes = { boundary: BoundaryNode }

// One frame on a real board, sized the way the drop sizes it.
function Board({ data }: { data: ElementNodeType['data'] }) {
  const [nodes, , onNodesChange] = useNodesState<ElementNodeType>([
    { id: 'a', type: 'boundary', position: { x: 0, y: 0 }, width: 360, height: 240, data },
  ])
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={nodes} nodeTypes={nodeTypes} onNodesChange={onNodesChange} />
    </ReactFlowProvider>
  )
}

describe('a frame', () => {
  it('reads level · type in the band, and carries its name', () => {
    render(<Board data={{ type: 'system-boundary', label: 'Internet Banking' }} />)
    expect(screen.getByText('Container · System Boundary')).toBeTruthy()
    expect(screen.getByText('Internet Banking')).toBeTruthy()
  })

  it('says nothing under the name, whatever is written on it', () => {
    // Boundaries & Zones carries no field past its name, so a technology
    // written on a frame — by an import, or by the shelf it was copied from —
    // has nowhere to print.
    const { container } = render(
      <Board data={{ type: 'trust-zone', label: 'PCI', technology: 'Go 1.22' }} />,
    )
    expect(screen.queryByText('Go 1.22')).toBeNull()
    expect(container.querySelector('.c4-subtitle')).toBeNull()
  })

  it('hangs no handles: a line is drawn to what is in a zone, never to the zone', () => {
    const { container } = render(<Board data={{ type: 'domain', label: 'Payments' }} />)
    expect(container.querySelector('.react-flow__handle')).toBeNull()
  })

  it('dims when deprecated, and says nothing of planned — it is drawn dashed already', () => {
    const { container } = render(
      <Board data={{ type: 'enterprise', label: 'Big Bank', status: 'Deprecated' }} />,
    )
    expect(container.querySelector('.c4-frame')?.getAttribute('data-status')).toBe('Deprecated')

    cleanup()
    const planned = render(
      <Board data={{ type: 'enterprise', label: 'Big Bank', status: 'Planned' }} />,
    )
    expect(planned.container.querySelector('.c4-frame')?.getAttribute('data-status')).toBeNull()
  })
})
