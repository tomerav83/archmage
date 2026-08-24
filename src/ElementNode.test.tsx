import { act, cleanup, render, screen } from '@testing-library/react'
import { ReactFlow, ReactFlowProvider, useNodesState } from '@xyflow/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BoundaryNode } from './BoundaryNode'
import { ElementNode, type ElementNodeType } from './ElementNode'

// One hand-written brand, so jsdom never parses the catalogue's five megabytes
// to answer whether the card hangs a mark on the line. What the match itself
// does with the string is technology.test.tsx.
vi.mock('simple-icons', () => ({
  siPostgresql: { title: 'PostgreSQL', slug: 'postgresql', hex: '4169E1', path: 'M0 0h24v24H0z' },
}))

afterEach(cleanup)

const nodeTypes = { element: ElementNode, boundary: BoundaryNode }

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

  it('says so when a frame is holding it', () => {
    // The board is one flat layer of nodes — a held card is nowhere inside its
    // frame in the DOM — so the card is the only thing that can say it stands
    // on sunken ground rather than on the canvas.
    const { container } = render(
      <ReactFlowProvider>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={[
            {
              id: 'f',
              type: 'boundary',
              position: { x: 0, y: 0 },
              width: 360,
              height: 240,
              data: { type: 'system-boundary', label: 'Internet Banking' },
            },
            {
              id: 'a',
              type: 'element',
              parentId: 'f',
              position: { x: 30, y: 60 },
              data: { type: 'container', label: 'Orders' },
            },
          ]}
        />
      </ReactFlowProvider>,
    )
    expect(container.querySelector('.c4-node')?.getAttribute('data-nested')).toBe('f')
  })

  it('says a deprecated element is deprecated', () => {
    const { container } = render(
      <Board data={{ type: 'container', label: 'Orders', status: 'Deprecated' }} />,
    )
    expect(container.querySelector('.c4-node')?.getAttribute('data-status')).toBe('Deprecated')
  })
})

// Three of a thing is one card that says three, not three cards. The stack is
// the stylesheet's; what the card owes is the count and the flag under it.
describe('a card standing for more than one', () => {
  it('says how many, and asks to be drawn as a stack', () => {
    render(<Board data={{ type: 'api-service', label: 'Orders', instances: '3' }} />)
    expect(screen.getByText('×3')).toBeTruthy()
    expect(document.querySelector('.c4-node')?.getAttribute('data-stacked')).toBe('3')
  })

  it('says nothing at all where there is one of it', () => {
    render(<Board data={{ type: 'api-service', label: 'Orders' }} />)
    expect(screen.queryByText(/^×/)).toBeNull()
    expect(document.querySelector('.c4-node')?.getAttribute('data-stacked')).toBeNull()
  })
})
