import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
// ponytail: icons resolve through the Iconify API at runtime. Swap in addCollection()
// with @iconify-json/* if this ever has to work offline.
import { Icon } from '@iconify/react'
import {
  defaults,
  EDGE_KINDS,
  KINDS,
  loadBoard,
  newId,
  parseBoard,
  review,
  saveBoard,
  toBoard,
  toRF,
  type Base,
  type BlockEdge,
  type BlockNode,
  type Finding,
  type PropSpec,
} from './model'

const DRAG_KEY = 'application/archmage-kind'
const PALETTE_ORDER: Base[] = ['actor', 'system', 'group', 'app', 'store', 'component']
const CONTAINERS = new Set<Base>(['system', 'group', 'app'])

function Block({ data, selected }: NodeProps<BlockNode>) {
  const spec = KINDS[data.kind]
  return (
    <div className={`block ${spec?.shape ?? 'rect'}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="block-kind">
        {spec?.icon ? <Icon icon={spec.icon} width={14} /> : null}
        {spec?.label ?? data.kind}
      </div>
      <div className="block-name">{data.name || '—'}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { block: Block }

function Palette() {
  return (
    <aside className="palette">
      {PALETTE_ORDER.map((base) => {
        const kinds = Object.values(KINDS).filter((k) => k.base === base)
        return kinds.length === 0 ? null : (
          <section key={base}>
            <h3>{base}</h3>
            {kinds.map((k) => (
              <div
                key={k.kind}
                className="chip"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_KEY, k.kind)
                  e.dataTransfer.effectAllowed = 'move'
                }}
              >
                {k.icon ? <Icon icon={k.icon} width={14} /> : null}
                {k.label}
              </div>
            ))}
          </section>
        )
      })}
    </aside>
  )
}

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
  if (spec.type === 'number')
    return (
      <label>
        {label}
        <input
          type="number"
          value={value == null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
    )
  return (
    <label>
      {label}
      <input value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function Editor() {
  const initial = useMemo(() => loadBoard(), [])
  const initialRF = useMemo(() => toRF(initial), [initial])
  const [boardId, setBoardId] = useState(initial.id)
  const [name, setName] = useState(initial.name)
  const [nodes, setNodes, onNodesChange] = useNodesState<BlockNode>(initialRF.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<BlockEdge>(initialRF.edges)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const board = useMemo(() => toBoard(boardId, name, nodes, edges), [boardId, name, nodes, edges])
  const findings = useMemo(() => review(board), [board])
  useEffect(() => saveBoard(board), [board])

  const selectedNode = nodes.find((n) => n.selected)
  const selectedEdge = edges.find((e) => e.selected)

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((es) =>
        addEdge<BlockEdge>(
          { ...c, id: newId('e'), label: EDGE_KINDS.uses.label, data: { kind: 'uses', props: {} } },
          es,
        ),
      ),
    [setEdges],
  )

  const onDrop = useCallback(
    (ev: DragEvent) => {
      ev.preventDefault()
      const kind = ev.dataTransfer.getData(DRAG_KEY)
      const spec = KINDS[kind]
      if (!spec) return
      setNodes((ns) =>
        ns.concat({
          id: newId('n'),
          type: 'block',
          position: screenToFlowPosition({ x: ev.clientX, y: ev.clientY }),
          data: { kind, name: spec.label, parent: null, props: defaults(spec) },
        }),
      )
    },
    [screenToFlowPosition, setNodes],
  )

  const patchNode = useCallback(
    (id: string, patch: Partial<BlockNode['data']>) =>
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))),
    [setNodes],
  )

  const setNodeProp = useCallback(
    (id: string, key: string, v: unknown) =>
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, props: { ...n.data.props, [key]: v } } } : n)),
      ),
    [setNodes],
  )

  const setEdgeKind = useCallback(
    (id: string, kind: string) =>
      setEdges((es) =>
        es.map((e) =>
          e.id === id
            ? { ...e, label: EDGE_KINDS[kind]?.label ?? kind, data: { kind, props: e.data?.props ?? {} } }
            : e,
        ),
      ),
    [setEdges],
  )

  const setEdgeProp = useCallback(
    (id: string, key: string, v: unknown) =>
      setEdges((es) =>
        es.map((e) =>
          e.id === id
            ? { ...e, data: { kind: e.data?.kind ?? 'uses', props: { ...e.data?.props, [key]: v } } }
            : e,
        ),
      ),
    [setEdges],
  )

  const focus = useCallback(
    (f: Finding) => {
      setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === f.nodeId })))
      setEdges((es) => es.map((e) => ({ ...e, selected: e.id === f.edgeId })))
    },
    [setNodes, setEdges],
  )

  const exportBoard = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.trim() || 'board'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openBoard = async (file: File | undefined) => {
    if (!file) return
    try {
      const b = parseBoard(await file.text())
      const rf = toRF(b)
      setBoardId(b.id)
      setName(b.name)
      setNodes(rf.nodes)
      setEdges(rf.edges)
      setError('')
    } catch (e) {
      setError(`Could not open ${file.name}: ${(e as Error).message}`)
    }
  }

  const edgeKind = selectedEdge?.data?.kind ?? 'uses'

  return (
    <div className="app">
      <header>
        <strong>Archmage</strong>
        <input
          className="board-name"
          aria-label="Board name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => fileInput.current?.click()}>Open…</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void openBoard(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button onClick={exportBoard}>Export</button>
        {error ? <span className="error">{error}</span> : null}
      </header>

      <Palette />

      <main
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </main>

      <aside className="inspector">
        {selectedNode ? (
          <>
            <h3>{KINDS[selectedNode.data.kind]?.label ?? selectedNode.data.kind}</h3>
            <label>
              name
              <input
                value={selectedNode.data.name}
                onChange={(e) => patchNode(selectedNode.id, { name: e.target.value })}
              />
            </label>
            <label>
              inside
              <select
                value={selectedNode.data.parent ?? ''}
                onChange={(e) => patchNode(selectedNode.id, { parent: e.target.value || null })}
              >
                <option value="">— board root —</option>
                {nodes
                  .filter((n) => {
                    const base = KINDS[n.data.kind]?.base
                    return n.id !== selectedNode.id && base !== undefined && CONTAINERS.has(base)
                  })
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data.name || n.id}
                    </option>
                  ))}
              </select>
            </label>
            {Object.entries(KINDS[selectedNode.data.kind]?.props ?? {}).map(([key, spec]) => (
              <Field
                key={key}
                label={key}
                spec={spec}
                value={selectedNode.data.props[key]}
                onChange={(v) => setNodeProp(selectedNode.id, key, v)}
              />
            ))}
          </>
        ) : selectedEdge ? (
          <>
            <h3>Connection</h3>
            <label>
              type
              <select value={edgeKind} onChange={(e) => setEdgeKind(selectedEdge.id, e.target.value)}>
                {Object.values(EDGE_KINDS).map((k) => (
                  <option key={k.kind} value={k.kind}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            {Object.entries(EDGE_KINDS[edgeKind]?.props ?? {}).map(([key, spec]) => (
              <Field
                key={key}
                label={key}
                spec={spec}
                value={selectedEdge.data?.props[key]}
                onChange={(v) => setEdgeProp(selectedEdge.id, key, v)}
              />
            ))}
          </>
        ) : (
          <p className="hint">Drag a block onto the canvas. Select one to edit it. Delete removes it.</p>
        )}
      </aside>

      <footer className="findings">
        <h3>
          Review <span className="count">{findings.length}</span>
        </h3>
        {findings.length === 0 ? (
          <p className="hint">Nothing to flag.</p>
        ) : (
          <ul>
            {findings.map((f, i) => (
              <li key={i}>
                <button className={`finding ${f.severity}`} onClick={() => focus(f)}>
                  <b>{f.title}</b>
                  <span>{f.why}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  )
}
