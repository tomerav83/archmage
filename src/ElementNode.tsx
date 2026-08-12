import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { ELEMENTS, type ElementKey, Sigil } from './c4'
import { useWard } from './useWard'
import { Ward } from './Ward'

export type ElementNodeType = Node<{ kind: ElementKey; label: string }, 'element'>

const PORTS = [
  ['t', Position.Top],
  ['r', Position.Right],
  ['b', Position.Bottom],
  ['l', Position.Left],
] as const

export function ElementNode({ id, data }: NodeProps<ElementNodeType>) {
  const kind = ELEMENTS[data.kind]
  const { state, ...press } = useWard(id)

  return (
    <div
      className={`c4-node ${state}`}
      style={{ '--accent': kind.accent, '--accent-ink': kind.ink }}
      {...press}
    >
      <Ward id={id} />
      <div className="c4-band">
        <Sigil kind={kind} />
        <span>{kind.title}</span>
      </div>
      <div className="c4-body">
        <div className="c4-name">{data.label}</div>
      </div>
      {/* Not ports — anchors. Nothing is dragged from them and CSS hides them,
          but an edge is drawn to a handle's box, so every face keeps one. */}
      {PORTS.map(([side, position]) => (
        <Handle key={side} id={side} type="source" position={position} />
      ))}
    </div>
  )
}
