import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiagramCanvas } from './DiagramCanvas'

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

// jsdom has no pointer capture, and the ward takes it on every press.
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

// Two cards, then the ward: hold the first, press the second, and the line is
// drawn. The form is left pointing at it, which is what we came to type in.
const boardWithALine = () => {
  const { container } = render(
    <ReactFlowProvider>
      <DiagramCanvas />
    </ReactFlowProvider>,
  )
  const pane = container.querySelector('.react-flow') as Element
  for (const at of [100, 400])
    fireEvent.drop(pane, { clientX: at, clientY: at, dataTransfer: { getData: () => 'container' } })

  const cards = container.querySelectorAll('.c4-node')
  fireEvent.pointerDown(cards[0] as Element, { button: 0, pointerId: 1 })
  // out past the hold, so the ward is armed
  act(() => void vi.advanceTimersByTime(500))
  fireEvent.pointerDown(cards[1] as Element, { button: 0, pointerId: 2 })
  rail = container.querySelector('.form[data-open]') as HTMLElement
  return container
}

// Both rails are mounted; the open one is the line's. Scoped, so a row of the
// element rail behind it can't answer for one of these.
let rail: HTMLElement
const row = (title: string) => within(rail).getByRole('button', { name: new RegExp(`^${title}`) })
const write = (title: string, value: string) =>
  fireEvent.change(within(rail).getByLabelText(title), { target: { value } })

describe('a relationship', () => {
  it('opens the form on the line just drawn', () => {
    boardWithALine()

    expect(rail.textContent).toContain('Relationship')
    // A line takes a label and a protocol, and none of an element's catalogue.
    expect(row('Technology')).toBeTruthy()
    expect(within(rail).queryByRole('button', { name: /^Owner/ })).toBeNull()
  })

  it('draws what the line says, in sans over mono', () => {
    const container = boardWithALine()
    write('Label', 'publishes OrderPlaced')
    fireEvent.click(row('Technology'))
    write('Technology', 'Kafka')

    expect(container.querySelector('.rel-name')?.textContent).toBe('publishes OrderPlaced')
    expect(container.querySelector('.rel-tech')?.textContent).toBe('Kafka')
  })

  it('draws solid while anybody is waiting and dashed when nobody is', () => {
    const container = boardWithALine()
    const path = () => container.querySelector('.react-flow__edge-path') as SVGPathElement

    expect(path().style.strokeDasharray).toBe('')

    fireEvent.click(row('Interaction'))
    write('Interaction', 'Async')
    expect(path().style.strokeDasharray).toBe('6 4')
    expect(rail.textContent).toContain('Async')

    write('Interaction', 'Sync')
    expect(path().style.strokeDasharray).toBe('')
  })
})
