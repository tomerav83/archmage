import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ELEMENTS, GROUPS } from './c4'
import { ElementSidebar } from './ElementSidebar'

afterEach(cleanup)

describe('the rail', () => {
  it('sets out every element kind, one section per C4 group', () => {
    const { container } = render(<ElementSidebar />)
    expect(container.querySelectorAll('details')).toHaveLength(GROUPS.length)
    expect(container.querySelectorAll('.block')).toHaveLength(Object.keys(ELEMENTS).length)
    // Sections in the declared order, not whatever the registry happens to hold.
    expect([...container.querySelectorAll('summary')].map((s) => s.textContent)).toEqual([
      ...GROUPS,
    ])
  })

  it('hands the canvas the kind that was dragged', () => {
    render(<ElementSidebar />)
    const written: Record<string, string> = {}
    const dataTransfer = {
      effectAllowed: '',
      setData: (k: string, v: string) => {
        written[k] = v
      },
    }

    fireEvent.dragStart(screen.getByText('Person'), { dataTransfer })

    expect(written).toEqual({ 'application/x-archmage-element': 'person' })
  })
})
