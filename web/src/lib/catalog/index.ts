// The catalog's public API — pure data and pure functions, so anything may read it.
// Importing it registers the glyphs the catalog names, so no caller has to remember to.
import './icons'

export { defaults, EDGE_KINDS, KINDS, type Base, type PropSpec } from './kinds'
