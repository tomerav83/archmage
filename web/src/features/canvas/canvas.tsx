import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Handle, Position, useReactFlow, ViewportPortal, type NodeProps } from '@xyflow/react'
import { Icon } from '@iconify/react'
import { KINDS } from '@/lib/catalog'
import type { BlockNode, Severity } from '@/lib/board'

const BLOCK_SIZE = 128 // matches .block in styles.css; only a fallback until measured
const GUTTER = 4 // how close the block menu may sit to a viewport edge

/** Canvas state a block reads but does not own: what the review flagged, keyed by
 *  node, and the block a wire is dangling from. Kept out of node data so a flag or
 *  a dangling wire does not churn the document. */
export const Canvas = createContext<{ flags: Record<string, Severity>; wiring: string | null }>({
  flags: {},
  wiring: null,
})

function Block({ id, data, selected }: NodeProps<BlockNode>) {
  const spec = KINDS[data.kind]
  const { flags, wiring } = useContext(Canvas)
  const flag = flags[id]
  // Both lines on the tile are cut to fit — the name is clamped, and the kind can be
  // any length at all, since an imported board names its own. One tooltip carries both.
  const label = spec?.label ?? data.kind
  return (
    <div
      className={`block${selected ? ' selected' : ''}`}
      data-base={spec?.base}
      data-flag={flag}
      data-wiring={wiring === id || undefined}
      title={data.name ? `${label} — ${data.name}` : label}
    >
      <Handle type="target" position={Position.Left} />
      <span className="block-kind">{label}</span>
      {spec?.icon ? <Icon className="icon" icon={spec.icon} aria-hidden /> : null}
      <div className="block-name">{data.name || '—'}</div>
      {/* the ring says it in colour; this says it in words, for anyone the colour misses */}
      {flag ? <span className="block-flag">{flag}</span> : null}
      {selected ? <span className="sr-only">selected</span> : null}
      {/* the wiring halo is a colour; this is the same state for anyone who cannot see it */}
      {wiring === id ? <span className="sr-only">wiring from here</span> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export const nodeTypes = { block: Block }

/** The loose end of a half-made wire. Its own component because the pointer position
 *  updates every frame — held in the editor it would re-render palette and inspector
 *  along with it — and because rAF collapses a burst of moves into one paint. */
export function WireGhost({ from }: { from: string }) {
  const { getNode, screenToFlowPosition } = useReactFlow()
  const [start] = useState(() => {
    const n = getNode(from)
    return n
      ? {
          x: n.position.x + (n.measured?.width ?? BLOCK_SIZE) / 2,
          y: n.position.y + (n.measured?.height ?? BLOCK_SIZE) / 2,
        }
      : { x: 0, y: 0 }
  })
  const [end, setEnd] = useState(start)

  useEffect(() => {
    let frame = 0
    let latest: { x: number; y: number } | null = null
    const onMove = (e: PointerEvent) => {
      latest = { x: e.clientX, y: e.clientY }
      frame ||= requestAnimationFrame(() => {
        frame = 0
        if (latest) setEnd(screenToFlowPosition(latest))
      })
    }
    addEventListener('pointermove', onMove)
    return () => {
      removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [screenToFlowPosition])

  return (
    <ViewportPortal>
      <svg
        className="wire-ghost"
        width="1"
        height="1"
        aria-hidden
        style={{ position: 'absolute', overflow: 'visible' }}
      >
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
        <circle cx={end.x} cy={end.y} r="4" />
      </svg>
    </ViewportPortal>
  )
}

/** One menu for every block. Per-kind entries would branch on the node's kind here.
 *  Right-click is a shortcut, not the only route — the inspector has both actions. */
export function BlockMenu({
  x,
  y,
  onConnect,
  onDelete,
  onClose,
}: {
  x: number
  y: number
  onConnect: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLMenuElement>(null)
  const [at, setAt] = useState({ left: x, top: y })

  // The pointer can be anywhere, including within a menu's width of an edge. Measure
  // once laid out and pull it back inside — before paint, so it never visibly jumps.
  useLayoutEffect(() => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    setAt({
      left: Math.max(GUTTER, Math.min(x, innerWidth - box.width - GUTTER)),
      top: Math.max(GUTTER, Math.min(y, innerHeight - box.height - GUTTER)),
    })
  }, [x, y])

  // A pointer opened this, so focus is still on whatever was clicked: take it, and
  // hand it back on the way out however the menu closes. Escape is bound to the
  // document rather than the menu so it works wherever focus has since wandered.
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.querySelector('button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [onClose])

  return (
    <menu ref={ref} className="block-menu" style={at}>
      <li>
        <button type="button" onClick={onConnect}>
          Connect
        </button>
      </li>
      <li>
        <button type="button" className="danger" onClick={onDelete}>
          Delete
        </button>
      </li>
    </menu>
  )
}
