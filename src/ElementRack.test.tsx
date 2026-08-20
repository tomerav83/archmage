import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TYPES } from './c4'
import { ElementRack } from './ElementRack'

afterEach(cleanup)

const tab = (name: string) => screen.getByRole('button', { name })
const search = () => screen.getByRole('searchbox')
const names = (c: HTMLElement) => [...c.querySelectorAll('.fp-name')].map((n) => n.textContent)

describe('the rack', () => {
  it('offers a tab per stocked shelf, in catalogue order', () => {
    const { container } = render(<ElementRack />)
    expect([...container.querySelectorAll('.rack-tabs button')].map((b) => b.textContent)).toEqual([
      'Actors & Externals',
      'Applications',
      'APIs & Contracts',
      'Data Stores',
      'Caching',
      'Messaging & Streaming',
      'Edge & Traffic',
      'Platform & Security',
      'Observability & Ops',
      'Analytics & ML',
      'Boundaries & Zones',
    ])
  })

  it('stands one shelf at a time, and the same tab shuts it', () => {
    const { container } = render(<ElementRack />)
    expect(names(container)).toEqual([])

    fireEvent.click(tab('Caching'))
    expect(names(container)).toEqual([
      'In-Memory Cache',
      'Distributed Cache',
      'Client Cache',
      'Read Replica',
    ])

    fireEvent.click(tab('Actors & Externals'))
    expect(names(container)).toContain('Person')
    expect(names(container)).not.toContain('In-Memory Cache')

    fireEvent.click(tab('Actors & Externals'))
    expect(names(container)).toEqual([])
  })

  it('shuts the standing shelf on Escape, and stands through any other key', () => {
    const { container } = render(<ElementRack />)

    fireEvent.click(tab('Caching'))
    fireEvent.keyDown(tab('Caching'), { key: 'a' })
    expect(names(container)).toContain('In-Memory Cache')

    fireEvent.keyDown(tab('Caching'), { key: 'Escape' })
    expect(names(container)).toEqual([])
  })

  it('faces every type on some shelf', () => {
    const { container } = render(<ElementRack />)
    const seen = new Set<string>()
    for (const button of container.querySelectorAll('.rack-tabs button')) {
      fireEvent.click(button)
      for (const name of names(container)) seen.add(name ?? '')
    }
    expect(seen.size).toBe(Object.keys(TYPES).length)
  })

  it('stands every shelf at once when searched, matching types by their own name', () => {
    const { container } = render(<ElementRack />)

    fireEvent.change(search(), { target: { value: 'comp' } })
    expect(names(container)).toEqual(['Component'])

    // The shelf's name is not the goods on it: what is searched is the type.
    fireEvent.change(search(), { target: { value: 'data' } })
    expect(names(container)).toContain('Change Data Capture') // says data, off another shelf
    expect(names(container)).not.toContain('Key-Value Store') // on the shelf, does not say it
  })

  it('empties out when nothing matches', () => {
    const { container } = render(<ElementRack />)

    fireEvent.change(search(), { target: { value: 'kafka' } })

    expect(container.querySelectorAll('.fplate')).toHaveLength(0)
  })

  it('hands the canvas the type that was dragged, then shuts the shelf', () => {
    const { container } = render(<ElementRack />)
    const written: Record<string, string> = {}
    const dataTransfer = {
      effectAllowed: '',
      setData: (k: string, v: string) => {
        written[k] = v
      },
    }

    fireEvent.click(tab('Actors & Externals'))
    fireEvent.dragStart(screen.getByText('Person'), { dataTransfer })
    expect(written).toEqual({ 'application/x-archmage-element': 'person' })

    fireEvent.dragEnd(screen.getByText('Person'))
    expect(names(container)).toEqual([])
  })
})
