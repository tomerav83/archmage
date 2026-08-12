import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { DRAG_SLOP_PX, WardContext, useWard } from './useWard'

const open = vi.fn()
const land = vi.fn()
const cancel = vi.fn()

// 'a' is the card under test; 'b' stands in for any other card on the board.
const setup = (from: string | null = null) =>
  renderHook(() => useWard('a'), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <WardContext.Provider value={{ from, open, land, cancel }}>{children}</WardContext.Provider>
    ),
  })

// The four things the hook reads off a pointer event, and the one thing it calls.
const press = (x = 0, y = 0, button = 0) =>
  ({
    button,
    clientX: x,
    clientY: y,
    pointerId: 1,
    currentTarget: { setPointerCapture: () => {} },
  }) as unknown as ReactPointerEvent

// Past the hold, whatever it is set to.
const waitOutTheHold = () => act(() => void vi.advanceTimersByTime(1000))

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})
afterEach(() => vi.useRealTimers())

describe('holding a card', () => {
  it('draws the ward once the hold is out', () => {
    const { result } = setup()
    act(() => result.current.onPointerDown(press()))
    expect(result.current.state).toBe('holding')

    waitOutTheHold()
    expect(open).toHaveBeenCalledWith('a')
  })

  it('opens nothing if the press ends early', () => {
    const { result } = setup()
    act(() => result.current.onPointerDown(press()))
    act(() => result.current.onPointerUp())

    waitOutTheHold()
    expect(open).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })

  it('drops a pending hold when the card leaves the board', () => {
    const { result, unmount } = setup()
    act(() => result.current.onPointerDown(press()))
    unmount()

    // The timer would otherwise open a ward on a card that is no longer there.
    waitOutTheHold()
    expect(open).not.toHaveBeenCalled()
  })

  it('is a drag, not a ward, once the press wanders past the slop', () => {
    const { result } = setup()
    act(() => result.current.onPointerDown(press(0, 0)))
    act(() => result.current.onPointerMove(press(DRAG_SLOP_PX + 1, 0)))

    waitOutTheHold()
    expect(open).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })

  it('still answers a shaky hand under the slop', () => {
    const { result } = setup()
    act(() => result.current.onPointerDown(press(0, 0)))
    act(() => result.current.onPointerMove(press(DRAG_SLOP_PX - 1, 0)))

    waitOutTheHold()
    expect(open).toHaveBeenCalledWith('a')
  })

  it('ignores a press that is not the left button', () => {
    const { result } = setup()
    act(() => result.current.onPointerDown(press(0, 0, 2)))

    waitOutTheHold()
    expect(open).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })
})

describe('answering an open ward', () => {
  it('lands the connection instead of starting another hold', () => {
    const { result } = setup('b')
    act(() => result.current.onPointerDown(press()))

    expect(land).toHaveBeenCalledWith('a')
    expect(open).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })

  it('shows itself armed while the open ward is its own', () => {
    const { result } = setup('a')
    expect(result.current.state).toBe('armed')
  })
})
