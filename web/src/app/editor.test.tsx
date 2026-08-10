import { beforeAll, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from './editor'

// React Flow measures the DOM, and jsdom lays nothing out. These are the four
// things it asks for; without them the canvas throws on mount.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  ;(globalThis as never as { DOMMatrixReadOnly: unknown }).DOMMatrixReadOnly = class {
    m22 = 1
  }
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1200 })
  ;(SVGElement.prototype as never as { getBBox: unknown }).getBBox = () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
})

describe('editor', () => {
  it('opens a first run with guidance rather than a blank canvas', () => {
    render(<Editor />)
    expect(screen.getByRole('heading', { level: 1, name: 'Archmage' })).toBeTruthy()
    expect(screen.getByText(/Drag a block onto the canvas/)).toBeTruthy()
    expect(screen.getByText('Nothing to flag.')).toBeTruthy()
  })

  it('places a block from the keyboard, all the way onto the board', async () => {
    render(<Editor />)
    screen.getByRole('button', { name: 'Store' }).focus()
    await userEvent.keyboard('{Enter}')
    // one block, unconnected — which is exactly what the review should now say
    expect(await screen.findByText('Store is not connected')).toBeTruthy()
  })

  /** Two blocks on the board, each found by the tooltip its tile carries — "<kind> —
   *  <name>". The palette chip of the same name has no title, so this cannot pick the
   *  wrong element.
   *
   *  Node clicks below go through fireEvent, which puts a `view` on the event: d3-drag,
   *  under React Flow, reads `event.view.document`, and user-event leaves it null. */
  const twoBlocks = async () => {
    render(<Editor />)
    for (const kind of ['Store', 'App']) {
      screen.getByRole('button', { name: kind }).focus()
      await userEvent.keyboard('{Enter}')
    }
    return {
      store: await screen.findByTitle('Store — Store'),
      app: await screen.findByTitle('App — App'),
    }
  }

  it('wires two blocks through the inspector, no pointer needed', async () => {
    const { store } = await twoBlocks()
    fireEvent.click(store) // select it, so the inspector shows the block
    // "App" is also an option under "inside", so the query stays within one select
    const connectTo = screen.getByLabelText('connect to')
    await userEvent.selectOptions(connectTo, within(connectTo).getByRole('option', { name: 'App' }))
    // wired both ways round, so neither is an orphan any more
    await waitFor(() => expect(screen.getByText('Nothing to flag.')).toBeTruthy())
  })

  // press-and-hold connecting (use-hold-connect): a plain click must still just select
  it('does not start a connection on a quick tap', async () => {
    const { store } = await twoBlocks()
    fireEvent.pointerDown(store, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(store, { clientX: 10, clientY: 10, pointerId: 1 })
    // long past the hold threshold — if the timer had survived, this is where it'd fire
    await new Promise((r) => setTimeout(r, 420))
    expect(screen.getByText('Store is not connected')).toBeTruthy()
  })

  it('cancels the hold once the pointer drifts, so a drag-to-reposition still wins', async () => {
    const { store } = await twoBlocks()
    fireEvent.pointerDown(store, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 40, clientY: 10, pointerId: 1 })
    await new Promise((r) => setTimeout(r, 420))
    fireEvent.pointerUp(store, { clientX: 40, clientY: 10, pointerId: 1 })
    expect(screen.getByText('Store is not connected')).toBeTruthy()
  })
})
