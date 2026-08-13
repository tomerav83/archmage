import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LEVELS, TYPES } from './c4'
import { ElementSidebar } from './ElementSidebar'

afterEach(cleanup)

// By summary: "Container" is both a section heading and a block in it.
const section = (title: string) =>
  screen.getByText(title, { selector: 'summary' }).closest('details')

describe('the rail', () => {
  it('sets out one section per level, in the declared order', () => {
    const { container } = render(<ElementSidebar />)
    expect([...container.querySelectorAll('summary')].map((s) => s.textContent)).toEqual(
      Object.values(LEVELS).map((l) => l.title),
    )
  })

  it('offers every type in the section its level names', () => {
    const { container } = render(<ElementSidebar />)
    expect(container.querySelectorAll('.block')).toHaveLength(Object.keys(TYPES).length)
    expect(section('Context')?.textContent).toContain('Person')
    expect(section('Container')?.textContent).not.toContain('Person')
  })

  it('hands the canvas the type that was dragged', () => {
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
