import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DiagramCanvas } from './DiagramCanvas'

afterEach(cleanup)

// The whole way round, because that is the only interesting part: the panel
// writes to node data, the canvas holds it, the panel and the card read it back.
const board = () => {
  const { container } = render(
    <ReactFlowProvider>
      <DiagramCanvas />
    </ReactFlowProvider>,
  )
  return container
}

// What the rail hands over: a type key on the drag's own MIME type.
const drop = (container: HTMLElement, type = 'container') =>
  fireEvent.drop(container.querySelector('.react-flow') as Element, {
    dataTransfer: { getData: () => type },
  })

// A shut field is a row you press; an open one is a control you type in.
const row = (title: string) => screen.getByRole('button', { name: new RegExp(`^${title}`) })
const field = (title: string) => screen.getByLabelText(title) as HTMLInputElement
const write = (title: string, value: string) =>
  fireEvent.change(field(title), { target: { value } })
const isOpen = (container: HTMLElement) =>
  container.querySelector('.form')?.hasAttribute('data-open')

describe('the form', () => {
  it('opens on a drop with the name under the caret', () => {
    const container = board()
    drop(container)

    expect(isOpen(container)).toBe(true)
    // The type's own title, selected, so a fresh drop is named by typing.
    expect(field('Name').value).toBe('Container')
    expect(document.activeElement).toBe(field('Name'))
  })

  it('opens the row that was pressed and shuts the one behind it', () => {
    const container = board()
    drop(container)
    fireEvent.click(row('Technology'))

    expect(document.activeElement).toBe(field('Technology'))
    // Name went back to being a row, and its value is what it says there.
    expect(screen.queryByLabelText('Name')).toBeNull()
    expect(row('Name').textContent).toContain('Container')
  })

  it('writes what is typed through to the card', () => {
    const container = board()
    drop(container)
    write('Name', 'Orders Service')
    fireEvent.click(row('Technology'))
    write('Technology', 'Go 1.22')

    expect(container.querySelector('.c4-name')?.textContent).toBe('Orders Service')
    expect(container.querySelector('.c4-subtitle')?.textContent).toBe('Go 1.22')
  })

  it('takes a description in a field with room for one', () => {
    const container = board()
    drop(container)
    fireEvent.click(row('Description'))
    write('Description', 'Places and tracks orders.')
    fireEvent.click(row('Name'))

    expect(row('Description').textContent).toContain('Places and tracks orders.')
  })

  it('writes a catalogue field the same way', () => {
    const container = board()
    drop(container)
    fireEvent.click(row('Status'))
    write('Status', 'Deprecated')

    expect(container.querySelector('.c4-node')?.getAttribute('data-status')).toBe('Deprecated')
  })

  it('carries the fields the dropped type actually has', () => {
    const container = board()
    drop(container, 'person')

    // A person is a job, not a stack.
    expect(row('Role')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Technology/ })).toBeNull()
  })

  it('shows an empty field as empty rather than as a blank box', () => {
    const container = board()
    drop(container)

    expect(row('Owner').textContent).toContain('—')
  })

  it('closes on Escape', () => {
    const container = board()
    drop(container)
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(isOpen(container)).toBe(false)
  })

  it('closes on the cross', () => {
    const container = board()
    drop(container)
    fireEvent.click(screen.getByLabelText('Close'))

    expect(isOpen(container)).toBe(false)
  })

  it('reopens on a double-click, on the name whatever row was left open', () => {
    const container = board()
    drop(container)
    fireEvent.click(row('Owner'))
    fireEvent.keyDown(document, { key: 'Escape' })
    // At the card, not at the name under it: the ward captures the pointer, so
    // the browser aims the dblclick at the card. A test that aims at the text
    // passes while the app does nothing.
    fireEvent.doubleClick(container.querySelector('.c4-node') as Element)

    expect(isOpen(container)).toBe(true)
    expect(document.activeElement).toBe(field('Name'))
  })
})
