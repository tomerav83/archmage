import { type NodeProps, NodeResizer } from '@xyflow/react'
import { LEVELS, Sigil, TYPES } from './c4'
import type { ElementNodeType } from './ElementNode'

// The ground other elements stand on. Same data as a card — the rail edits a
// frame off the same table it edits everything else — and everything a card
// does that a frame must not: no subtitle, because Boundaries & Zones carries
// no field past its name; no handles, because neither Structurizr nor
// C4-PlantUML draws a line to a boundary; no ward, because a frame that armed
// itself on a press would arm every time somebody dragged the thing.
export function BoundaryNode({ data, selected }: NodeProps<ElementNodeType>) {
  const type = TYPES[data.type]
  const level = LEVELS[type.level]

  return (
    <div
      className="c4-frame"
      // Same two as a card: the frame is drawn solid, so Planned has its dash
      // back, and Deprecated dims.
      data-status={data.status}
      style={{ '--accent': level.accent, '--accent-ink': level.ink }}
    >
      {/* A frame is sized rather than laid out, so it is the one thing on the
          board with grips. Brass, and only while it is the selected thing. */}
      <NodeResizer minWidth={200} minHeight={140} isVisible={selected} />
      <div className="c4-band">
        <Sigil paths={type.sigil} />
        <span>
          {level.title} · {type.title}
        </span>
      </div>
      <div className="c4-name">{data.label}</div>
    </div>
  )
}
