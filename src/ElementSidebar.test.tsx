import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TYPES } from './c4'
import { ElementSidebar } from './ElementSidebar'

afterEach(cleanup)

// By summary: "Container" is both a section heading and a block in it.
const section = (title: string) =>
  screen.getByText(title, { selector: 'summary' }).closest('details')

const search = () => screen.getByRole('searchbox')

describe('the rail', () => {
  it('shelves the types by category, in catalogue order', () => {
    const { container } = render(<ElementSidebar />)
    expect([...container.querySelectorAll('summary')].map((s) => s.textContent)).toEqual([
      'Actors & Externals',
      'Applications',
      'Data Stores',
      'Caching',
    ])
  })

  it('offers every type on the shelf its category names', () => {
    const { container } = render(<ElementSidebar />)
    expect(container.querySelectorAll('.block')).toHaveLength(Object.keys(TYPES).length)
    expect(section('Actors & Externals')?.textContent).toContain('Person')
    expect(section('Applications')?.textContent).not.toContain('Person')
  })

  it('keeps the shelves shut until something is searched for', () => {
    const { container } = render(<ElementSidebar />)
    expect([...container.querySelectorAll('details')].some((d) => d.open)).toBe(false)

    fireEvent.change(search(), { target: { value: 'person' } })

    expect([...container.querySelectorAll('details')].every((d) => d.open)).toBe(true)
  })

  it('narrows to the types whose own name was typed', () => {
    const { container } = render(<ElementSidebar />)

    fireEvent.change(search(), { target: { value: 'comp' } })
    expect([...container.querySelectorAll('.block')].map((b) => b.textContent)).toEqual([
      'Component',
    ])

    // The shelf's name is not the goods on it: the Data Stores shelf holds
    // twelve, and only the seven saying so come back.
    fireEvent.change(search(), { target: { value: 'data' } })
    expect([...container.querySelectorAll('.block')].map((b) => b.textContent)).toEqual([
      'Relational Database',
      'Document Database',
      'Graph Database',
      'Time-Series Database',
      'Vector Database',
      'Data Warehouse',
      'Data Lake',
    ])
  })

  it('empties out when nothing matches', () => {
    const { container } = render(<ElementSidebar />)

    fireEvent.change(search(), { target: { value: 'kafka' } })

    expect(container.querySelectorAll('.block')).toHaveLength(0)
    expect(container.querySelectorAll('details')).toHaveLength(0)
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
