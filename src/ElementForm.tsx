import { useReactFlow } from '@xyflow/react'
import { LEVELS, Sigil, TYPES } from './c4'
import type { ElementNodeType } from './ElementNode'
import { Form } from './Form'
import { CATALOG, COMMON, fieldsFor } from './fields'

// What an element says, and where it says it. The rail itself is Form.
export function ElementForm({ node, onClose }: { node?: ElementNodeType; onClose: () => void }) {
  const { updateNodeData } = useReactFlow()
  // Shut. The rail keeps drawing whatever it held while it slides away.
  if (!node) return <Form onClose={onClose} />

  const type = TYPES[node.data.type]
  const level = LEVELS[type.level]

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
        // the catalogue wants — all one line each, so none is hidden.
        fields: [...COMMON, ...fieldsFor(node.data.type), ...CATALOG],
        data: node.data,
        write: (key, value) => updateNodeData(node.id, { [key]: value }),
      }}
    />
  )
}
