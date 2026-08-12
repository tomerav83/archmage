// What kinds of block exist and what properties each one carries. Shared code:
// nothing here reaches into a feature or the app layer, which is what lets the
// board, the review and the canvas all read it without importing each other.
import type { RJSFSchema } from '@rjsf/utils'
import { CORE_EDGES, CORE_NODES, type CoreEdge, type CoreNode } from './data/core'
import type { Props, PropValues } from './schema'

/** Any catalog entry, block or wire — what the two lookups below hold and what the
 *  functions at the bottom read. A new family is a new data file and a new member
 *  here and on those lookups. */
export type Spec = CoreNode | CoreEdge

// Null prototype: an imported board names its own kinds, and "constructor" or
// "toString" has to miss rather than hand back something off Object.prototype. The
// lookup key stays a raw string for that same reason — the union types the entries,
// not what an untrusted document asks for.
export const KINDS: Record<string, CoreNode> = Object.create(null)
export const EDGE_KINDS: Record<string, CoreEdge> = Object.create(null)

// One file per block family; a new family is a new import concatenated onto these two.
for (const spec of CORE_NODES) KINDS[spec.kind] = spec
for (const spec of CORE_EDGES) EDGE_KINDS[spec.kind] = spec

/** The values a new block of this kind starts with. `fromEntries` can't keep the
 *  key-to-value binding the blueprint has, so the cast puts it back — the blueprint
 *  is what makes it honest. */
export const defaults = (spec?: Spec): PropValues => {
  const props: Props = spec?.props ?? {}
  return Object.fromEntries(
    Object.entries(props).flatMap(([name, p]) => (p?.default === undefined ? [] : [[name, p.default]])),
  ) as PropValues
}

/** The object schema a kind's props must satisfy — what the inspector's form renders
 *  from and what the review validates against. */
export const propsSchema = (spec?: Spec): RJSFSchema => ({
  type: 'object',
  properties: spec?.props ?? {},
})

/** The wire's on-canvas text for a kind: the catalog's label, or the raw kind for one
 *  the catalog doesn't have (an imported board can name any string). */
export const edgeLabel = (kind: string): string => EDGE_KINDS[kind]?.label ?? kind
