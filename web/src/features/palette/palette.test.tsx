import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Palette } from './palette'

describe('palette', () => {
  it('places a block from the keyboard, not only from a drag', async () => {
    const onAdd = vi.fn()
    render(<Palette onAdd={onAdd} />)
    const chip = screen.getByRole('button', { name: 'Store' })
    chip.focus()
    await userEvent.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledWith('store')
  })
})
