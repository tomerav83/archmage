import Form from '@rjsf/core'
import { CONTAINER_BASES, EDGE_KINDS, KINDS, propsSchema, validator } from '@/lib/catalog'
import type { BlockEdge, BlockNode } from '@/lib/board-types'
import './inspector.css'

const MAX_PICKER_OPTIONS = 200

// No submit button (every field commits live) and no error list — a bad value shows
// up as a review finding, the same place every other rule violation shows up.
const PROPS_UI_SCHEMA = { 'ui:submitButtonOptions': { norender: true } }

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
                return n.id !== node.id && base !== undefined && CONTAINER_BASES.has(base)
              })}
            />
          </select>
        </label>
        {/* the keyboard route to a connection: dragging a handle needs a mouse */}
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
        <Form
          key={node.id}
          schema={propsSchema(spec)}
          uiSchema={PROPS_UI_SCHEMA}
          validator={validator}
          showErrorList={false}
          formData={node.data.props}
          onChange={(e) => onPatchNode(node.id, { props: e.formData ?? {} })}
        />
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
        <Form
          key={edge.id}
          schema={propsSchema(EDGE_KINDS[kind])}
          uiSchema={PROPS_UI_SCHEMA}
          validator={validator}
          showErrorList={false}
          formData={edge.data?.props ?? {}}
          onChange={(e) => onPatchEdge(edge.id, { props: e.formData ?? {} })}
        />
      </aside>
    )
  }

  return (
    <aside className="inspector" aria-label="Inspector">
      <p className="hint">
        Drag a block onto the canvas, or click one in the palette to drop it in the middle. Click a block to
        edit, connect or delete it.
      </p>
    </aside>
  )
}
