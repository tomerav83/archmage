import { EDGE_KINDS } from '@/lib/catalog'
import type { Board, BoardEdge, BoardNode, BlockEdge, BlockNode } from '@/lib/board'

// The document: how it is validated, how it is carried in and out, and how it maps onto
// React Flow's live editing state. The shapes themselves live in @/lib/board.
//
// Nothing is stored: every load starts on a blank board, and Export is how one is kept.

// ---------------------------------------------------------------- io

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`

/** JSON.parse throws a SyntaxError carrying a byte offset, which means nothing to a
 *  reader. Our own validator messages already name the field, so those pass through. */
export const msg = (e: unknown): string =>
  e instanceof SyntaxError ? 'it is not valid JSON' : e instanceof Error ? e.message : 'unknown error'

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const rec = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** A board arrives from storage or from a file someone else wrote, so every field the
 *  editor later calls a method on is type-checked here — defaulting is not checking,
 *  `?? ''` will happily let a number through to .trim(). */
export function parseBoard(text: string): Board {
  const b: unknown = JSON.parse(text)
  if (!rec(b) || !Array.isArray(b.nodes) || !Array.isArray(b.edges))
    throw new Error('it is not a board — expected an object with "nodes" and "edges" arrays')

  const nodes = b.nodes.map((n: unknown, i: number): BoardNode => {
    if (!rec(n) || !str(n.id) || !str(n.kind)) throw new Error(`node ${i}: needs a non-empty id and kind`)
    if (!num(n.x) || !num(n.y)) throw new Error(`node ${i} (${n.id}): needs numeric x and y`)
    return {
      id: n.id,
      kind: n.kind,
      name: typeof n.name === 'string' ? n.name : '',
      parent: str(n.parent) ? n.parent : null,
      x: n.x,
      y: n.y,
      props: rec(n.props) ? { ...n.props } : {},
    }
  })

  const edges = b.edges.map((e: unknown, i: number): BoardEdge => {
    if (!rec(e) || !str(e.id) || !str(e.kind) || !str(e.from) || !str(e.to))
      throw new Error(`edge ${i}: needs a non-empty id, kind, from and to`)
    return { id: e.id, kind: e.kind, from: e.from, to: e.to, props: rec(e.props) ? { ...e.props } : {} }
  })

  return {
    id: str(b.id) ? b.id : newId('b'),
    name: str(b.name) ? b.name : 'Untitled board',
    nodes,
    edges,
  }
}

// ---------------------------------------------------------------- react flow bridge

export const toRF = (b: Board): { nodes: BlockNode[]; edges: BlockEdge[] } => ({
  nodes: b.nodes.map((n) => ({
    id: n.id,
    type: 'block' as const,
    position: { x: n.x, y: n.y },
    data: { kind: n.kind, name: n.name, parent: n.parent, props: n.props },
  })),
  edges: b.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: EDGE_KINDS[e.kind]?.label ?? e.kind,
    data: { kind: e.kind, props: e.props },
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
