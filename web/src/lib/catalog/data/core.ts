// The core family: IcePanel's six object types as block kinds, plus the plain "uses"
// wire. Still one file per family, but TypeScript rather than JSON — the entries are
// checked against the blueprint as they are written, and the union each file exports
// is derived from them, so a kind names its properties once.
//
// lucide-react ships each icon as its own component, so the bundle carries exactly
// the six named here and nothing phones home for the rest.
import { AppWindow, Box, Database, Group, Puzzle, User } from 'lucide-react'
import { description, edge, node, status } from '../schema'

export const CORE_NODES = [
  node({
    kind: 'actor',
    base: 'actor',
    label: 'Actor',
    icon: User,
    props: { description, external: { type: 'boolean', default: true } },
  }),
  node({
    kind: 'system',
    base: 'system',
    label: 'System',
    icon: Box,
    holdsChildren: true,
    props: { description, status, external: { type: 'boolean', default: false } },
  }),
  node({
    kind: 'app',
    base: 'app',
    label: 'App',
    icon: AppWindow,
    holdsChildren: true,
    props: { description, status },
  }),
  node({ kind: 'store', base: 'store', label: 'Store', icon: Database, props: { description, status } }),
  node({ kind: 'component', base: 'component', label: 'Component', icon: Puzzle, props: { description } }),
  node({
    kind: 'group',
    base: 'group',
    label: 'Group',
    icon: Group,
    holdsChildren: true,
    props: { description },
  }),
]

export const CORE_EDGES = [edge({ kind: 'uses', label: 'uses', props: {} })]

/** This family's kinds, each bound to the props that kind declares. */
export type CoreNode = (typeof CORE_NODES)[number]
export type CoreEdge = (typeof CORE_EDGES)[number]
