import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inspector } from './inspector'
import type { BlockNode } from '@/lib/board'

const node = (id: string, name = id): BlockNode => ({
  id,
  type: 'block',
  position: { x: 0, y: 0 },
  data: { kind: 'app', name, parent: null, props: {} },
})

const inspector = (over: Partial<Parameters<typeof Inspector>[0]> = {}) => {
  const props = {
    node: node('n1', 'Checkout'),
    edge: undefined,
    nodes: [node('n1', 'Checkout'), node('n2', 'Ledger')],
    onPatchNode: vi.fn(),
    onPatchEdge: vi.fn(),
    onConnect: vi.fn(),
    onDelete: vi.fn(),
    ...over,
  }
  render(<Inspector {...props} />)
  return props
}

describe('inspector', () => {
  it('connects two blocks without a pointer', async () => {
    const { onConnect } = inspector()
    await userEvent.selectOptions(screen.getByLabelText('connect to'), 'n2')
    expect(onConnect).toHaveBeenCalledWith('n1', 'n2')
  })

  it('deletes the selected block without a right-click', async () => {
    const { onDelete } = inspector()
    await userEvent.click(screen.getByRole('button', { name: 'Delete block' }))
    expect(onDelete).toHaveBeenCalledWith('n1')
  })

  it('guides a first-time user when nothing is selected', () => {
    inspector({ node: undefined })
    expect(screen.getByText(/Drag a block onto the canvas/)).toBeTruthy()
  })
})
