import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTIONS } from './actions'
import { TYPES } from './c4'
import type { ElementNodeType } from './ElementNode'
import { Menu } from './Menu'

afterEach(cleanup)

const card = (type: string, label = 'Orders Service') =>
  ({ id: 'a', type: 'element', position: { x: 0, y: 0 }, data: { type, label } }) as ElementNodeType

const frame = () =>
  ({
    id: 'z',
    type: 'boundary',
    position: { x: 0, y: 0 },
    data: { type: 'system-boundary', label: 'Payments' },
  }) as ElementNodeType

// A card off whichever shelf has no row yet. The assertion below is about a
// shelf standing empty, not about which shelf that happens to be — every one
// of them takes rows as the table grows.
const bare = () => {
  for (const [shelf, rows] of Object.entries(ACTIONS)) {
    if (rows.length) continue
    const hit = Object.entries(TYPES).find(([, t]) => t.category === shelf && !t.frame)
    if (hit) return hit[0]
  }
  throw new Error('every shelf has a row: pick another way to say empty')
}

const menu = (props: Partial<Parameters<typeof Menu>[0]> = {}) => {
  const onPick = vi.fn()
  const onAct = vi.fn()
  const onClose = vi.fn()
  return {
    onPick,
    onAct,
    onClose,
    ...render(
      <Menu
        at={{ x: 40, y: 40 }}
        title="Enclose in"
        onPick={onPick}
        onAct={onAct}
        onClose={onClose}
        {...props}
      />,
    ),
  }
}

describe('the frames half', () => {
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

  it('says what it is for, so the same picker reads differently empty-handed', () => {
    menu({ title: 'New Boundary' })
    expect(screen.getByText('New Boundary')).toBeTruthy()
  })

  it('is not there at all until something is right-clicked', () => {
    const { container } = menu({ at: null })
    expect(container.querySelector('.menu')).toBeNull()
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
})

describe('the verbs half', () => {
  it('opens on the subject and its shelf, over the frames', () => {
    const { container } = menu({ subject: card('api-service') })
    expect(screen.getByText('Orders Service')).toBeTruthy()
    expect(screen.getByText('Add database')).toBeTruthy()
    expect(screen.getByText('Offload to queue')).toBeTruthy()
    // and the frames are still under them, behind a rule
    expect(container.querySelector('hr')).toBeTruthy()
    expect(screen.getByText('System Boundary')).toBeTruthy()
  })

  it('is the shelf row rather than one type, so shelf-mates offer the same', () => {
    menu({ subject: card('worker') })
    expect(screen.getByText('Add database')).toBeTruthy()
  })

  it('reads the subject own shelf, so a store offers what a store can do', () => {
    menu({ subject: card('relational-db') })
    expect(screen.getByText('Add read replica')).toBeTruthy()
    expect(screen.getByText('Add search index')).toBeTruthy()
    expect(screen.queryByText('Add database')).toBeNull()
  })

  it('offers a shelf with no row yet nothing but the frames', () => {
    const { container } = menu({ subject: card(bare()) })
    expect(container.querySelector('hr')).toBeNull()
    expect(screen.getByText('System Boundary')).toBeTruthy()
  })

  // A frame is what you put things in, never a thing to put something beside.
  it('offers a frame nothing but the frames', () => {
    const { container } = menu({ subject: frame() })
    expect(container.querySelector('hr')).toBeNull()
    expect(screen.queryByText('Payments')).toBeNull()
  })

  it('hands back the action that was pressed', () => {
    const { onAct } = menu({ subject: card('api-service') })
    fireEvent.click(screen.getByText('Add cache'))
    expect(onAct).toHaveBeenCalledWith(expect.objectContaining({ type: 'memory-cache' }))
  })
})
