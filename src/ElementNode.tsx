import { Handle, type Node, type NodeProps, Position, useReactFlow } from '@xyflow/react'
import { useState } from 'react'
import { LEVELS, Sigil, TYPES, type TypeKey } from './c4'
import { useWard } from './useWard'
import { Ward } from './Ward'

// label is the element's own name — "Orders Service"; technology is what it is
// built from — "Go 1.22". type stays a key into the registry.
export type ElementNodeType = Node<{ type: TypeKey; label: string; technology?: string }, 'element'>

const PORTS = [
  ['t', Position.Top],
  ['r', Position.Right],
  ['b', Position.Bottom],
  ['l', Position.Left],
] as const

export function ElementNode({ id, data }: NodeProps<ElementNodeType>) {
  const type = TYPES[data.type]
  const level = LEVELS[type.level]
  const { state, ...press } = useWard(id)
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)

  return (
    // The double-click is caught here rather than on the body it opens: the
    // ward captures the pointer on every press, and a captured pointer aims its
    // click and dblclick at the element holding the capture, never at what is
    // under the cursor. This card is that element.
    <div
      className={`c4-node ${state}`}
      style={{ '--accent': level.accent, '--accent-ink': level.ink }}
      onDoubleClick={() => setEditing(true)}
      {...press}
    >
      <Ward id={id} />
      <div className="c4-band">
        <Sigil type={type} />
        <span>
          {level.title} · {type.title}
        </span>
      </div>
      {editing ? (
        // A press in a field must draw no ward (React events, stopped here) and
        // start no drag (React Flow's is native, and answers to nodrag).
        <div
          className="c4-body nodrag"
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={(e) => {
            // Moving between the two fields is not leaving them.
            if (!e.currentTarget.contains(e.relatedTarget)) setEditing(false)
          }}
        >
          {/* The field only exists because the user just asked for it, so it
              opens with the caret. Written straight into node data, so there is
              no draft and Enter only closes the fields. */}
          <input
            className="c4-edit c4-name"
            aria-label="Name"
            // biome-ignore lint/a11y/noAutofocus: mounts on the user's double-click, not page load
            autoFocus
            value={data.label}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          />
          <input
            className="c4-edit c4-tech"
            aria-label="Technology"
            placeholder="technology"
            value={data.technology ?? ''}
            onChange={(e) => updateNodeData(id, { technology: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          />
        </div>
      ) : (
        <div className="c4-body">
          <div className="c4-name">{data.label}</div>
          {data.technology && <div className="c4-tech">{data.technology}</div>}
        </div>
      )}
      {/* Not ports — anchors. Nothing is dragged from them and CSS hides them,
          but an edge is drawn to a handle's box, so every face keeps one. */}
      {PORTS.map(([side, position]) => (
        <Handle key={side} id={side} type="source" position={position} />
      ))}
    </div>
  )
}
