// The catalog's public API — pure data and pure functions, so anything may read it.
// The types stay in schema.ts: no feature has needed to name one, and the day one
// does is the day to export it.
export { defaults, edgeLabel, EDGE_KINDS, KINDS, propsSchema } from './kinds'
export { BASES } from './schema'
