import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Enclose } from './Enclose'

afterEach(cleanup)

const menu = (onPick = vi.fn(), onClose = vi.fn()) => ({
  onPick,
  onClose,
  ...render(<Enclose at={{ x: 40, y: 40 }} onPick={onPick} onClose={onClose} />),
})

describe('the enclose menu', () => {
  it('offers every type that holds other elements, and nothing that does not', () => {
    menu()
    expect(screen.getByText('System Boundary')).toBeTruthy()
    expect(screen.getByText('Trust Zone')).toBeTruthy()
    expect(screen.queryByText('Relational Database')).toBeNull()
  })

  it('hands back the type that was picked', () => {
    const { onPick } = menu()
    fireEvent.click(screen.getByText('Domain / Bounded Context'))
    expect(onPick).toHaveBeenCalledWith('domain')
  })

  it('shuts on Escape and on the next press outside it, and stands under one inside', () => {
    const { onClose, container } = menu()
    fireEvent.pointerDown(container.querySelector('.menu') as Element)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.pointerDown(document.body)
    expect(onClose).toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('is not there at all until something is right-clicked', () => {
    const { container } = render(<Enclose at={null} onPick={vi.fn()} onClose={vi.fn()} />)
    expect(container.querySelector('.menu')).toBeNull()
  })
})
