import { useReactFlow } from '@xyflow/react'
import { Form } from './Form'
import { RELATIONSHIP } from './fields'
import type { RelationshipEdgeType } from './RelationshipEdge'

// A line says less than a card: label, protocol, and whether anybody waits. No
// category tier, and brass for its pigment because an edge belongs to the frame
// rather than to any one level.
export function RelationshipForm({
  edge,
  onClose,
}: {
  edge?: RelationshipEdgeType
  onClose: () => void
}) {
  const { updateEdgeData } = useReactFlow()
  if (!edge) return <Form onClose={onClose} />

  const data = edge.data ?? {}

  return (
    <Form
      onClose={onClose}
      subject={{
        id: edge.id,
        accent: 'var(--brass)',
        ink: 'var(--brass-lit)',
        band: <span>Relationship · {data.interaction ?? 'Sync'}</span>,
        fields: RELATIONSHIP,
        data,
        write: (key, value) => updateEdgeData(edge.id, { [key]: value }),
      }}
    />
  )
}
