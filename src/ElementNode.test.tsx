import { act, cleanup, render, screen } from '@testing-library/react'
import { ReactFlow, ReactFlowProvider, useNodesState } from '@xyflow/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ElementNode, type ElementNodeType } from './ElementNode'

// One hand-written brand, so jsdom never parses the catalogue's five megabytes
// to answer whether the card hangs a mark on the line. What the match itself
// does with the string is technology.test.tsx.
vi.mock('simple-icons', () => ({
  siPostgresql: { title: 'PostgreSQL', slug: 'postgresql', hex: '4169E1', path: 'M0 0h24v24H0z' },
}))

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

  // The subtitle is a product, so it wears the product's mark — a tick behind
  // the first paint, when the catalogue's chunk lands.
  it('hangs the brand mark on a technology it knows', async () => {
    let view: HTMLElement | undefined
    await act(async () => {
      view = render(
        <Board data={{ type: 'container', label: 'Orders', technology: 'PostgreSQL 16' }} />,
      ).container
    })

    expect(view?.querySelector('.c4-subtitle path')?.getAttribute('d')).toBe('M0 0h24v24H0z')
  })

  it('leaves a technology it does not know bare, and a role always', async () => {
    let view: HTMLElement | undefined
    await act(async () => {
      view = render(
        <Board data={{ type: 'container', label: 'Orders', technology: 'Go 1.22' }} />,
      ).container
    })
    expect(view?.querySelector('.c4-subtitle svg')).toBeNull()

    cleanup()
    // A person's first field is Role, which is a job and not a product: no
    // mark, and no initials either.
    await act(async () => {
      view = render(<Board data={{ type: 'person', label: 'Ana', role: 'PostgreSQL' }} />).container
    })
    expect(view?.querySelector('.c4-subtitle svg')).toBeNull()
    expect(view?.querySelector('.c4-subtitle .mono-mark')).toBeNull()
  })

  it('says a deprecated element is deprecated', () => {
    const { container } = render(
      <Board data={{ type: 'container', label: 'Orders', status: 'Deprecated' }} />,
    )
    expect(container.querySelector('.c4-node')?.getAttribute('data-status')).toBe('Deprecated')
  })
})
