import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { LEVELS, Sigil, TYPES, type TypeKey } from './c4'
import { type FieldKey, fieldsFor } from './fields'
import { useWard } from './useWard'
import { Ward } from './Ward'

// Flat, and keyed by what the panel can render: label is the element's own name
// — "Orders Service"; technology is what it is built from — "Go 1.22"; the rest
// are the fields its category carries. type stays a key into the registry.
export type ElementNodeType = Node<
  { type: TypeKey; label: string } & Partial<Record<FieldKey, string>>,
  'element'
>

const PORTS = [
  ['t', Position.Top],
  ['r', Position.Right],
  ['b', Position.Bottom],
  ['l', Position.Left],
] as const

// A card is a thing on a board; the inspector is where you talk about it. So
// this reads and never writes: band, name, and one line under it.
export function ElementNode({ id, data }: NodeProps<ElementNodeType>) {
  const type = TYPES[data.type]
  const level = LEVELS[type.level]
  const { state, ...press } = useWard(id)
  // The card has room for one field besides the name, and its category says
  // which: Technology for most, Role for a person, nothing for a boundary.
  const subtitle = fieldsFor(data.type)[0]

  return (
    <div
      className={`c4-node ${state}`}
      // Planned draws dashed, Deprecated dims: a status that renders nowhere is
      // a field nobody fills in.
      data-status={data.status}
      style={{ '--accent': level.accent, '--accent-ink': level.ink }}
      {...press}
    >
      <Ward id={id} />
      <div className="c4-band">
        <Sigil type={type} />
        <span>
          {level.title} · {type.title}
        </span>
      </div>
      <div className="c4-body">
        <div className="c4-name">{data.label}</div>
        {subtitle && data[subtitle.key] && <div className="c4-subtitle">{data[subtitle.key]}</div>}
      </div>
      {/* Not ports — anchors. Nothing is dragged from them and CSS hides them,
          but an edge is drawn to a handle's box, so every face keeps one. */}
      {PORTS.map(([side, position]) => (
        <Handle key={side} id={side} type="source" position={position} />
      ))}
    </div>
  )
}
