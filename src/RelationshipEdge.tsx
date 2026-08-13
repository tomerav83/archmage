import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react'
import type { FieldKey } from './fields'

// A line from Orders Service to Kafka has to be able to say *publishes
// OrderPlaced* over gRPC, and to say whether anybody waits for the answer.
// Flat and keyed like a node's data, so the form writes to both the same way.
export type RelationshipEdgeType = Edge<Partial<Record<FieldKey, string>>, 'relationship'>

export function RelationshipEdge({
  data,
  markerEnd,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps<RelationshipEdgeType>) {
  const [path, x, y] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      {/* Dashed is the one thing about a line everybody already reads the same
          way: nobody is waiting at the other end. */}
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={data?.interaction === 'Async' ? { strokeDasharray: '6 4' } : undefined}
      />
      {(data?.label || data?.technology) && (
        <EdgeLabelRenderer>
          <div
            className="rel-label"
            style={{ transform: `translate(-50%,-50%) translate(${x}px,${y}px)` }}
          >
            {data.label && <div className="rel-name">{data.label}</div>}
            {/* the user's words in sans, the system's engraved in mono — the
                same division the card makes */}
            {data.technology && <div className="rel-tech">{data.technology}</div>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
