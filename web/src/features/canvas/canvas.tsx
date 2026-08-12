import { createContext, useCallback, useContext, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { KINDS } from '@/lib/catalog'
import type { BlockNode, Severity } from '@/lib/board-types'
import type { PointerStart } from './use-hold-connect'
import './canvas.css'

/** What the review flagged, keyed by node — canvas state a block reads but does not
 *  own. Kept out of node data so a changed flag does not churn the document. */
export const FlagsContext = createContext<Record<string, Severity>>({})

/** Which block is mid-press-and-hold, and how to start one. Canvas state a block
 *  reads but does not own, same reasoning as FlagsContext — the hold's own progress
 *  is written straight onto the block's DOM node by use-hold-connect, never through
 *  here, so a 60fps hold doesn't push a React update through every block. */
export const HoldConnectContext = createContext<{
  holdingId: string | null
  beginHold: (id: string, el: HTMLElement, start: PointerStart) => void
}>({ holdingId: null, beginHold: () => {} })

function Block({ id, data, selected }: NodeProps<BlockNode>) {
  const spec = KINDS[data.kind]
  const flag = useContext(FlagsContext)[id]
  const { holdingId, beginHold } = useContext(HoldConnectContext)
  const ref = useRef<HTMLDivElement>(null)
  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0 || !ref.current) return
      beginHold(id, ref.current, { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId })
    },
    [id, beginHold],
  )
  const Glyph = spec?.icon
  // Both lines on the tile are cut to fit — the name is clamped, and the kind can be
  // any length at all, since an imported board names its own. One tooltip carries both.
  const label = spec?.label ?? data.kind
  return (
    <div
      ref={ref}
      className={`block${selected ? ' selected' : ''}${holdingId === id ? ' holding' : ''}`}
      data-base={spec?.base}
      data-flag={flag}
      title={data.name ? `${label} — ${data.name}` : label}
      onPointerDown={onPointerDown}
    >
      {/* connecting is press-and-hold on the tile now (use-hold-connect) — these stay
          as the visual anchor points React Flow routes wires to, nothing drags from them */}
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span className="block-kind">{label}</span>
      {Glyph ? <Glyph className="icon" aria-hidden /> : null}
      <div className="block-name">{data.name || '—'}</div>
      {/* the ring says it in colour; this says it in words, for anyone the colour misses */}
      {flag ? <span className="block-flag">{flag}</span> : null}
      {selected ? <span className="sr-only">selected</span> : null}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  )
}

export const nodeTypes = { block: Block }
