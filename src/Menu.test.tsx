import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ElementNodeType } from './ElementNode'
import { Actions, Enclose } from './Menu'

afterEach(cleanup)

const menu = (onPick = vi.fn(), onClose = vi.fn()) => ({
  onPick,
  onClose,
  ...render(<Enclose at={{ x: 40, y: 40 }} title="Enclose in" onPick={onPick} onClose={onClose} />),
})

describe('the enclose menu', () => {
  it('offers every type that holds other elements, and nothing that does not', () => {
    menu()
    expect(screen.getByText('System Boundary')).toBeTruthy()
    expect(screen.getByText('Trust Zone')).toBeTruthy()
    expect(screen.queryByText('Relational Database')).toBeNull()
  })

  // The menu reads the flag, never a shelf, so the deployment frames arrived in
  // it by being written down — and Instance, which shares their shelf and holds
  // nothing, stayed out for the same reason.
  it('spans the shelves, because it is the flag it asks about and not the shelf', () => {
    menu()
    expect(screen.getByText('Cluster / Orchestrator')).toBeTruthy()
    expect(screen.getByText('Region / Zone')).toBeTruthy()
    expect(screen.queryByText('Instance')).toBeNull()
  })

  it('hands back the type that was picked', () => {
    const { onPick } = menu()
    fireEvent.click(screen.getByText('Domain / Bounded Context'))
    expect(onPick).toHaveBeenCalledWith('domain')
  })

  // Escape and the press outside are the popover's to answer, so what is left
  // worth asking is that the menu asks for them — and that it passes on the
  // dismissal, since a board still holding an open menu would never reopen it.
  it('leaves the dismissing to the platform, and passes it on when it happens', () => {
    const { onClose, container } = menu()
    const el = container.querySelector('.menu') as HTMLElement
    expect(el.getAttribute('popover')).toBe('auto')
    expect(onClose).not.toHaveBeenCalled()

    fireEvent(el, Object.assign(new Event('toggle'), { newState: 'closed' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('is not there at all until something is right-clicked', () => {
    const { container } = render(
      <Enclose at={null} title="Enclose in" onPick={vi.fn()} onClose={vi.fn()} />,
    )
    expect(container.querySelector('.menu')).toBeNull()
  })

  it('says what it is for, so the same picker reads differently empty-handed', () => {
    render(<Enclose at={{ x: 0, y: 0 }} title="New Boundary" onPick={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('New Boundary')).toBeTruthy()
  })
})

const subject = {
  id: 'a',
  type: 'element',
  position: { x: 0, y: 0 },
  data: { type: 'container', label: 'Orders Service' },
} as ElementNodeType

describe('the actions menu', () => {
  it('offers the moves the type carries, and nothing else', () => {
    render(<Actions at={{ x: 40, y: 40 }} subject={subject} onAct={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Add cache')).toBeTruthy()
    expect(screen.queryByText('Add read replica')).toBeNull()
    // The other menu's half. This one does not enclose anything.
    expect(screen.queryByText('System Boundary')).toBeNull()
  })

  it('stands over the card it was opened on, and hands back the move', () => {
    const onAct = vi.fn()
    render(<Actions at={{ x: 40, y: 40 }} subject={subject} onAct={onAct} onClose={vi.fn()} />)
    expect(screen.getByText('Orders Service')).toBeTruthy()
    fireEvent.click(screen.getByText('Add cache'))
    expect(onAct).toHaveBeenCalledWith(expect.objectContaining({ type: 'distributed-cache' }))
  })
})
