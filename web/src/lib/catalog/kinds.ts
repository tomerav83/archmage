// What kinds of block exist and what properties each one carries. Shared code:
// nothing here reaches into a feature or the app layer, which is what lets the
// board, the review and the canvas all read it without importing each other.

/** IcePanel's six model object types. Every block kind specializes one of them. */
export type Base = 'actor' | 'group' | 'system' | 'app' | 'store' | 'component'

export type PropSpec = { type?: 'string' | 'boolean' | 'number'; enum?: string[]; default?: unknown }
type KindSpec = { kind: string; base: Base; label: string; icon?: string; props?: Record<string, PropSpec> }
type EdgeKindSpec = { kind: string; label: string; props?: Record<string, PropSpec> }
type CatalogFile = { nodes?: KindSpec[]; edges?: EdgeKindSpec[] }

import core from './data/core.json'

// Null prototype: an imported board names its own kinds, and "constructor" or
// "toString" has to miss rather than hand back something off Object.prototype.
export const KINDS: Record<string, KindSpec> = Object.create(null)
export const EDGE_KINDS: Record<string, EdgeKindSpec> = Object.create(null)

// One file per block family; a new family is a new import on this list.
for (const file of [core as CatalogFile]) {
  for (const k of file.nodes ?? []) KINDS[k.kind] = k
  for (const e of file.edges ?? []) EDGE_KINDS[e.kind] = e
}

export const defaults = (spec?: KindSpec): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(spec?.props ?? {})
      .filter(([, p]) => p.default !== undefined)
      .map(([k, p]) => [k, p.default]),
  )

/** The wire's on-canvas text for a kind: the catalog's label, or the raw kind for one
 *  the catalog doesn't have (an imported board can name any string). */
export const edgeLabel = (kind: string): string => EDGE_KINDS[kind]?.label ?? kind
