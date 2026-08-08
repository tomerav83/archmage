import type { Edge as RFEdge, Node as RFNode } from '@xyflow/react'

// ---------------------------------------------------------------- board

/** IcePanel's six model object types. Every block kind specializes one of them. */
export type Base = 'actor' | 'group' | 'system' | 'app' | 'store' | 'component'
export type Shape = 'rect' | 'cylinder' | 'person' | 'boundary'

export type PropSpec = { type?: 'string' | 'boolean' | 'number'; enum?: string[]; default?: unknown }
export type KindSpec = {
  kind: string
  base: Base
  label: string
  icon?: string
  shape?: Shape
  props?: Record<string, PropSpec>
}
export type EdgeKindSpec = { kind: string; label: string; dashed?: boolean; props?: Record<string, PropSpec> }

export type BoardNode = {
  id: string
  kind: string
  name: string
  parent?: string | null
  x: number
  y: number
  props: Record<string, unknown>
}
export type BoardEdge = { id: string; kind: string; from: string; to: string; props: Record<string, unknown> }
export type Board = { id: string; name: string; nodes: BoardNode[]; edges: BoardEdge[] }

export type Severity = 'error' | 'warn' | 'info'
export type Finding = { nodeId?: string; edgeId?: string; severity: Severity; title: string; why: string }
export type Rule = (b: Board) => Finding[]

// ---------------------------------------------------------------- catalog
// One file per block family, merged here. Adding a family is adding a file.

type CatalogFile = { nodes?: KindSpec[]; edges?: EdgeKindSpec[] }

export const KINDS: Record<string, KindSpec> = {}
export const EDGE_KINDS: Record<string, EdgeKindSpec> = {}

for (const file of Object.values(
  import.meta.glob<CatalogFile>('./catalog/*.json', { eager: true, import: 'default' }),
)) {
  for (const k of file.nodes ?? []) KINDS[k.kind] = k
  for (const e of file.edges ?? []) EDGE_KINDS[e.kind] = e
}

export const RULES: Rule[] = Object.values(
  import.meta.glob<{ rules?: Rule[] }>('./rules/*.ts', { eager: true }),
).flatMap((m) => m.rules ?? [])

const WORST_FIRST: Record<Severity, number> = { error: 0, warn: 1, info: 2 }

export const review = (b: Board): Finding[] =>
  RULES.flatMap((r) => r(b)).sort((a, z) => WORST_FIRST[a.severity] - WORST_FIRST[z.severity])

export const defaults = (spec?: KindSpec): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(spec?.props ?? {})
      .filter(([, p]) => p.default !== undefined)
      .map(([k, p]) => [k, p.default]),
  )

// ---------------------------------------------------------------- storage & io

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`

export const blankBoard = (): Board => ({ id: newId('b'), name: 'Untitled board', nodes: [], edges: [] })

const KEY = 'archmage.board'

export const saveBoard = (b: Board) => localStorage.setItem(KEY, JSON.stringify(b))

export function loadBoard(): Board {
  const raw = localStorage.getItem(KEY)
  if (!raw) return blankBoard()
  try {
    return parseBoard(raw)
  } catch {
    return blankBoard()
  }
}

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0

/** A board can arrive from a file someone else wrote, so check it before trusting it. */
export function parseBoard(text: string): Board {
  const b = JSON.parse(text)
  if (!b || typeof b !== 'object' || !Array.isArray(b.nodes) || !Array.isArray(b.edges))
    throw new Error('Not a board: expected an object with "nodes" and "edges" arrays.')

  b.nodes.forEach((n: BoardNode, i: number) => {
    if (!str(n?.id) || !str(n?.kind)) throw new Error(`node ${i}: needs a non-empty id and kind`)
    if (typeof n.x !== 'number' || typeof n.y !== 'number')
      throw new Error(`node ${i} (${n.id}): needs numeric x and y`)
  })
  b.edges.forEach((e: BoardEdge, i: number) => {
    if (!str(e?.id) || !str(e?.kind) || !str(e?.from) || !str(e?.to))
      throw new Error(`edge ${i}: needs a non-empty id, kind, from and to`)
  })

  return {
    id: str(b.id) ? b.id : newId('b'),
    name: str(b.name) ? b.name : 'Untitled board',
    nodes: b.nodes.map((n: BoardNode) => ({ ...n, name: n.name ?? '', props: n.props ?? {} })),
    edges: b.edges.map((e: BoardEdge) => ({ ...e, props: e.props ?? {} })),
  }
}

// ---------------------------------------------------------------- react flow bridge
// The board is the document; React Flow's nodes/edges are the live editing state.

export type BlockData = { kind: string; name: string; parent: string | null; props: Record<string, unknown> }
export type EdgeData = { kind: string; props: Record<string, unknown> }
export type BlockNode = RFNode<BlockData, 'block'>
export type BlockEdge = RFEdge<EdgeData>

export const toRF = (b: Board): { nodes: BlockNode[]; edges: BlockEdge[] } => ({
  nodes: b.nodes.map((n) => ({
    id: n.id,
    type: 'block' as const,
    position: { x: n.x, y: n.y },
    data: { kind: n.kind, name: n.name, parent: n.parent ?? null, props: n.props ?? {} },
  })),
  edges: b.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: EDGE_KINDS[e.kind]?.label ?? e.kind,
    data: { kind: e.kind, props: e.props ?? {} },
  })),
})

export const toBoard = (id: string, name: string, nodes: BlockNode[], edges: BlockEdge[]): Board => ({
  id,
  name,
  nodes: nodes.map((n) => ({
    id: n.id,
    kind: n.data.kind,
    name: n.data.name,
    parent: n.data.parent,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
    props: n.data.props,
  })),
  edges: edges.map((e) => ({
    id: e.id,
    kind: e.data?.kind ?? 'uses',
    from: e.source,
    to: e.target,
    props: e.data?.props ?? {},
  })),
})
