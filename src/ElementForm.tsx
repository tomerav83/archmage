import { useReactFlow } from '@xyflow/react'
import { LEVELS, Sigil, TYPES } from './c4'
import type { ElementNodeType } from './ElementNode'
import { Form } from './Form'
import { CATALOG, COMMON, fieldsFor } from './fields'

// What an element says, and where it says it. The rail itself is Form.
export function ElementForm({ node, onClose }: { node?: ElementNodeType; onClose: () => void }) {
  const { updateNodeData, getNodes } = useReactFlow<ElementNodeType>()
  // Shut. The rail keeps drawing whatever it held while it slides away.
  if (!node) return <Form onClose={onClose} />

  const type = TYPES[node.data.type]
  const level = LEVELS[type.level]
  // What an Instance can be one of: a card, not a frame, standing for a
  // container or a whole system — the two levels a deployment diagram points
  // back at. Itself excluded, so a thing is never deployed as an instance of
  // itself.
  const deployable = (n: ElementNodeType) =>
    n.id !== node.id &&
    n.type === 'element' &&
    (n.data.type === 'system' || TYPES[n.data.type].level === 'container')

  return (
    <Form
      onClose={onClose}
      subject={{
        id: node.id,
        accent: level.accent,
        ink: level.ink,
        // The same band the card wears, in the same pigment.
        band: (
          <>
            <Sigil paths={type.sigil} />
            <span>
              {level.title} · {type.title}
            </span>
          </>
        ),
        // Two fields everything has, then the ones this type has, then the four
        // the catalogue wants — all one line each, so none is hidden. Instance
        // of is the one field whose options are the board rather than the
        // registry, so — exactly like technology's shortlist in fieldsFor —
        // it is stamped here, where the other nodes are finally known.
        fields: [...COMMON, ...fieldsFor(node.data.type), ...CATALOG].map((f) =>
          f.key === 'instanceOf'
            ? {
                ...f,
                options: getNodes()
                  .filter(deployable)
                  .map((n) => n.data.label),
              }
            : f,
        ),
        data: node.data,
        write: (key, value) => updateNodeData(node.id, { [key]: value }),
      }}
    />
  )
}
