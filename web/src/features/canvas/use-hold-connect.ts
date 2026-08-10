import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useReactFlow } from '@xyflow/react'

const HOLD_MS = 380
const MOVE_CANCEL_PX = 6

export type PointerStart = { clientX: number; clientY: number; pointerId: number }

type Gesture = {
  originId: string
  startX: number
  startY: number
  holdTimer: ReturnType<typeof setTimeout> | null
  ghostLine: SVGLineElement | null
  hoverEl: HTMLElement | null
  draggableSuppressed: boolean
}

// The interaction layer for connecting: press and hold anywhere on a block, then
// drag to another block to wire them up. Nothing shows during the wait — the border
// switches on the instant the hold survives into a wire drag, and stays on for the
// rest of the gesture, through release or connect. The ghost wire and the target
// highlight are imperative DOM work on purpose: a 60fps drag shouldn't push a React
// re-render through the whole graph. The only thing that goes through React state is
// which block is mid-gesture, for the one class HoldConnectContext hands to Block.

export function useHoldConnect(
  onConnect: (from: string, to: string) => void,
  paneRef: RefObject<HTMLElement | null>,
) {
  const { screenToFlowPosition, getIntersectingNodes, updateNode } = useReactFlow()
  const [holdingId, setHoldingId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gestureRef = useRef<Gesture | null>(null)

  const cleanup = useCallback(() => {
    const g = gestureRef.current
    if (!g) return
    if (g.holdTimer) clearTimeout(g.holdTimer)
    g.ghostLine?.remove()
    g.hoverEl?.classList.remove('target-hover')
    // only the hold fired past re-enables this — a cancelled-before-fire gesture
    // never touched it, and re-setting it on every plain click is wasted work
    if (g.draggableSuppressed) updateNode(g.originId, { draggable: true })
    gestureRef.current = null
    setHoldingId(null)
  }, [updateNode])

  // which edge of the origin block to draw the ghost wire from — whichever side
  // faces the point the user is dragging towards
  const anchorFor = useCallback(
    (el: HTMLElement, towardsX: number) => {
      const pane = paneRef.current?.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const goingRight = towardsX > r.left + r.width / 2
      return {
        x: (goingRight ? r.right : r.left) - (pane?.left ?? 0),
        y: r.top + r.height / 2 - (pane?.top ?? 0),
      }
    },
    [paneRef],
  )

  const updateGhost = useCallback(
    (clientX: number, clientY: number) => {
      const g = gestureRef.current
      if (!g?.ghostLine) return
      const pane = paneRef.current?.getBoundingClientRect()
      g.ghostLine.setAttribute('x2', String(clientX - (pane?.left ?? 0)))
      g.ghostLine.setAttribute('y2', String(clientY - (pane?.top ?? 0)))

      const flowPos = screenToFlowPosition({ x: clientX, y: clientY })
      const hit = getIntersectingNodes({ x: flowPos.x, y: flowPos.y, width: 1, height: 1 }).find(
        (n) => n.id !== g.originId,
      )
      const hoverEl = hit
        ? (paneRef.current?.querySelector(`[data-id="${hit.id}"]`) as HTMLElement | null)
        : null
      if (hoverEl !== g.hoverEl) {
        g.hoverEl?.classList.remove('target-hover')
        hoverEl?.classList.add('target-hover')
        g.hoverEl = hoverEl
      }
    },
    [paneRef, screenToFlowPosition, getIntersectingNodes],
  )

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const g = gestureRef.current
      if (!g) return
      if (g.ghostLine) {
        updateGhost(e.clientX, e.clientY)
        return
      }
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_PX) cleanup()
    }
    function onUp() {
      const g = gestureRef.current
      if (!g) return
      const targetId = g.ghostLine ? g.hoverEl?.dataset.id : undefined
      if (targetId) onConnect(g.originId, targetId)
      cleanup()
    }
    function onCancel() {
      cleanup()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [updateGhost, onConnect, cleanup])

  const beginHold = useCallback(
    (id: string, el: HTMLElement, start: PointerStart) => {
      cleanup()
      const g: Gesture = {
        originId: id,
        startX: start.clientX,
        startY: start.clientY,
        holdTimer: null,
        ghostLine: null,
        hoverEl: null,
        draggableSuppressed: false,
      }
      gestureRef.current = g

      g.holdTimer = setTimeout(() => {
        g.holdTimer = null
        // the long press survived — turn the border on now, and leave it on; cleanup()
        // is the only place that turns it back off, whether that's a release or a connect
        setHoldingId(id)

        if (!svgRef.current) return
        // this is a wire drag now, not a reposition drag, and the very next pointermove
        // is otherwise indistinguishable from one to React Flow's own drag detector
        // (nodeDragThreshold defaults to 1px)
        updateNode(id, { draggable: false })
        g.draggableSuppressed = true
        const anchor = anchorFor(el, start.clientX)
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('class', 'wire-ghost')
        line.setAttribute('x1', String(anchor.x))
        line.setAttribute('y1', String(anchor.y))
        line.setAttribute('x2', String(anchor.x))
        line.setAttribute('y2', String(anchor.y))
        svgRef.current.appendChild(line)
        g.ghostLine = line
      }, HOLD_MS)
    },
    [cleanup, anchorFor, updateNode],
  )

  // a real React Flow drag beat the hold — the movement already told the story
  const onNodeDragStart = useCallback(() => {
    if (gestureRef.current && !gestureRef.current.ghostLine) cleanup()
  }, [cleanup])

  return { holdingId, beginHold, onNodeDragStart, svgRef }
}
