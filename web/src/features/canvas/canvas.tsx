import { createContext, useContext } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ICONS, KINDS } from '@/lib/catalog'
import type { BlockNode, Severity } from '@/lib/board-types'
import './canvas.css'

/** What the review flagged, keyed by node — canvas state a block reads but does not
 *  own. Kept out of node data so a changed flag does not churn the document. */
export const FlagsContext = createContext<Record<string, Severity>>({})

function Block({ id, data, selected }: NodeProps<BlockNode>) {
  const spec = KINDS[data.kind]
  const flag = useContext(FlagsContext)[id]
  const Glyph = spec?.icon ? ICONS[spec.icon] : undefined
  // Both lines on the tile are cut to fit — the name is clamped, and the kind can be
  // any length at all, since an imported board names its own. One tooltip carries both.
  const label = spec?.label ?? data.kind
  return (
    <div
      className={`block${selected ? ' selected' : ''}`}
      data-base={spec?.base}
      data-flag={flag}
      title={data.name ? `${label} — ${data.name}` : label}
    >
      <Handle type="target" position={Position.Left} />
      <span className="block-kind">{label}</span>
      {Glyph ? <Glyph className="icon" aria-hidden /> : null}
      <div className="block-name">{data.name || '—'}</div>
      {/* the ring says it in colour; this says it in words, for anyone the colour misses */}
      {flag ? <span className="block-flag">{flag}</span> : null}
      {selected ? <span className="sr-only">selected</span> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export const nodeTypes = { block: Block }
