import { EDGE_KINDS, KINDS, type Base, type PropSpec } from '@/lib/catalog'
import type { BlockEdge, BlockNode } from '@/lib/board'

const CONTAINERS = new Set<Base>(['system', 'group', 'app'])
const MAX_PICKER_OPTIONS = 200

function Field({
  label,
  spec,
  value,
  onChange,
}: {
  label: string
  spec: PropSpec
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (spec.enum)
    return (
      <label>
        {label}
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {spec.enum.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  if (spec.type === 'boolean')
    return (
      <label className="check">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    )
  const num = spec.type === 'number'
  return (
    <label>
      {label}
      <input
        type={num ? 'number' : 'text'}
        value={value == null ? '' : String(value)}
        onChange={(e) =>
          onChange(num ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)
        }
      />
    </label>
  )
}

/** One option per block, capped: past a couple of hundred a native select is no way
 *  to find anything, and an uncapped list re-renders every option on every drag frame. */
function NodeOptions({ nodes }: { nodes: BlockNode[] }) {
  const shown = nodes.slice(0, MAX_PICKER_OPTIONS)
  return (
    <>
      {shown.map((n) => (
        <option key={n.id} value={n.id}>
          {n.data.name || n.id}
        </option>
      ))}
      {nodes.length > shown.length ? (
        <option disabled>and {nodes.length - shown.length} more, not shown</option>
      ) : null}
    </>
  )
}

export function Inspector({
  node,
  edge,
  nodes,
  onPatchNode,
  onPatchEdge,
  onConnect,
  onDelete,
}: {
  node: BlockNode | undefined
  edge: BlockEdge | undefined
  nodes: BlockNode[]
  onPatchNode: (id: string, patch: Partial<BlockNode['data']>) => void
  onPatchEdge: (id: string, patch: { kind?: string; props?: Record<string, unknown> }) => void
  onConnect: (from: string, to: string) => void
  onDelete: (id: string) => void
}) {
  if (node) {
    const spec = KINDS[node.data.kind]
    return (
      <aside className="inspector" aria-label="Inspector">
        <h2>{spec?.label ?? node.data.kind}</h2>
        <label>
          name
          <input value={node.data.name} onChange={(e) => onPatchNode(node.id, { name: e.target.value })} />
        </label>
        <label>
          inside
          <select
            value={node.data.parent ?? ''}
            onChange={(e) => onPatchNode(node.id, { parent: e.target.value || null })}
          >
            <option value="">— board root —</option>
            <NodeOptions
              nodes={nodes.filter((n) => {
                const base = KINDS[n.data.kind]?.base
                return n.id !== node.id && base !== undefined && CONTAINERS.has(base)
              })}
            />
          </select>
        </label>
        {/* the keyboard route to a connection: right-click then click needs a mouse */}
        <label>
          connect to
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onConnect(node.id, e.target.value)
            }}
          >
            <option value="">— pick a block —</option>
            <NodeOptions nodes={nodes.filter((n) => n.id !== node.id)} />
          </select>
        </label>
        {Object.entries(spec?.props ?? {}).map(([key, propSpec]) => (
          <Field
            key={key}
            label={key}
            spec={propSpec}
            value={node.data.props[key]}
            onChange={(v) => onPatchNode(node.id, { props: { [key]: v } })}
          />
        ))}
        <button type="button" className="wide" onClick={() => onDelete(node.id)}>
          Delete block
        </button>
      </aside>
    )
  }

  if (edge) {
    const kind = edge.data?.kind ?? 'uses'
    return (
      <aside className="inspector" aria-label="Inspector">
        <h2>Connection</h2>
        <label>
          type
          <select value={kind} onChange={(e) => onPatchEdge(edge.id, { kind: e.target.value })}>
            {Object.values(EDGE_KINDS).map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        {Object.entries(EDGE_KINDS[kind]?.props ?? {}).map(([key, propSpec]) => (
          <Field
            key={key}
            label={key}
            spec={propSpec}
            value={edge.data?.props[key]}
            onChange={(v) => onPatchEdge(edge.id, { props: { [key]: v } })}
          />
        ))}
      </aside>
    )
  }

  return (
    <aside className="inspector" aria-label="Inspector">
      <p className="hint">
        Drag a block onto the canvas, or click one in the palette to drop it in the middle. Click a block to
        edit it; right-click it for Connect and Delete.
      </p>
    </aside>
  )
}
