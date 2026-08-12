import {
  createContext,
  type PointerEvent as ReactPointerEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

// A connection in progress: the node whose ward is open, and the two ways it
// ends — the next press either lands on a node or falls on the pane. The canvas
// provides it and holds which ward is open; the card draws the figure and
// reports the press.
export const WardContext = createContext<{
  from: string | null
  open: (id: string) => void
  // Same node cancels, another node joins.
  land: (id: string) => void
  cancel: () => void
}>({ from: null, open: () => {}, land: () => {}, cancel: () => {} })

// How long the press holds before the ward closes and the ports open. Kept in
// step with --hold in index.css, which paces the drawing of the figure.
const HOLD_MS = 420
// Past this the press was a node drag all along, so the ward never closes. The
// canvas hands React Flow the same number as its nodeDragThreshold, so one
// press can't be a drag and a connect at once — under it, neither happens and a
// shaky hand still gets its ward.
export const DRAG_SLOP_PX = 9

/**
 * Press and hold a card to draw its ward; the press after that answers it.
 *
 *   idle    --down--------------> holding
 *   holding --up | move past slop-> idle
 *   holding --HOLD_MS-----------> armed         (the canvas holds which card)
 *   armed   --down on itself----> idle          called off
 *   armed   --down on another---> idle + edge
 *   armed   --click on the pane-> idle
 *
 * Every rung turns on a pointerdown, never a click: the press that draws a ward
 * ends in a click on the very card it opened, so a click can't say which press
 * it belongs to and would answer the ward the instant it appeared. A
 * pointerdown can only be the next press.
 *
 * The press is captured, so it keeps reporting to the card it started on even
 * when it wanders off the card or off the canvas — and the events still bubble
 * on to React Flow, which drags the node as it always did.
 */
export function useWard(id: string) {
  const origin = useRef({ x: 0, y: 0 })
  const timer = useRef(0)
  const [holding, setHolding] = useState(false)
  const { from, open, land } = useContext(WardContext)

  const drop = () => {
    clearTimeout(timer.current)
    setHolding(false)
  }
  // Only the timer outlives the card. Dropping the whole of drop() in here
  // would set state on a card that is already gone.
  useEffect(() => () => clearTimeout(timer.current), [])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    // A ward is open somewhere and this press answers it. Nothing else to do:
    // the canvas has already frozen dragging and panning board-wide.
    if (from) return land(id)
    origin.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      open(id)
    }, HOLD_MS)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const { x, y } = origin.current
    if (holding && Math.hypot(e.clientX - x, e.clientY - y) > DRAG_SLOP_PX) drop()
  }

  return {
    // One value, so armed-and-holding can't be said at all.
    state: from === id ? 'armed' : holding ? 'holding' : 'idle',
    onPointerDown,
    onPointerMove,
    onPointerUp: drop,
    onPointerCancel: drop,
  }
}
