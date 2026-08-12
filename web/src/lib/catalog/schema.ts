// The catalog's type vocabulary: what a property declaration is, which properties
// exist at all, and what one catalog entry looks like. The data files are checked
// against these, so a kind that misspells a property, defaults outside its own enum
// or specializes a base that doesn't exist is a build error rather than a finding at
// review time. Types, plus the two identity functions a data file wraps entries in —
// they check the entry and hand back its exact shape, which is what lets each family
// derive its own union instead of transcribing one.
import type { LucideIcon } from 'lucide-react'

/** IcePanel's six model object types, outside-in — every block kind specializes one,
 *  and the palette shows its sections in this order. The list is the declaration and
 *  the type is read off it, so a base can't exist without a place to drag it from. */
export const BASES = ['actor', 'system', 'group', 'app', 'store', 'component'] as const
export type Base = (typeof BASES)[number]

/** How live a block is. The list is the declaration and the type is read off it, so
 *  the schema a board is validated against can't drift from the values it admits. */
export const STATUSES = ['live', 'future', 'deprecated', 'removed'] as const
export type NodeStatus = (typeof STATUSES)[number]

/** The document side: every property any kind may carry, and the value it holds.
 *  This is the list — a kind picks from it and cannot invent its own. */
export type PropertyValue = {
  description: string
  external: boolean
  status: NodeStatus
}

/** What a board object may hold in `props`. Every catalog property is optional: a
 *  block carries a value for one only once someone has filled it in. */
export type PropValues = Partial<PropertyValue>

/** The JSON Schema fragments a property can be declared with — one per value shape.
 *  An enum's members live in the type, so a default outside them doesn't compile. */
export type StringProperty = { type: 'string'; default?: string }
export type BooleanProperty = { type: 'boolean'; default?: boolean }
export type EnumProperty<V extends string> = { type: 'string'; enum: V[]; default?: V }

/** The schema side, keyed the same as PropertyValue. Pairing a property with the
 *  value it admits happens here, once, and nowhere else. */
export type PropertyBlueprint = {
  description: StringProperty
  external: BooleanProperty
  status: EnumProperty<NodeStatus>
}

/** What a kind may declare: any subset of the blueprint, and nothing else. */
export type Props = Partial<PropertyBlueprint>

// The fragments a kind reuses as-is, so "description" and "status" are one object
// rather than one per kind. `external` isn't here: which way it defaults is the
// kind's own call, so kinds declare that one themselves.
export const description = { type: 'string' } satisfies PropertyBlueprint['description']
export const status = {
  type: 'string',
  enum: [...STATUSES],
  default: 'live',
} satisfies PropertyBlueprint['status']

/** What every catalog entry carries, whatever it describes. The glyph is the
 *  component, not a name to look up: the catalog is shipped code, and nothing
 *  serializes it. */
type Meta<Kind extends string> = { kind: Kind; label: string; icon?: LucideIcon }

/** A block kind: its identity, the IcePanel object type it specializes, and exactly
 *  the properties it declares. `P` is the entry's own props, so each kind in the
 *  catalog union carries its own shape rather than the blueprint's. */
export type MetaNode<Kind extends string, B extends Base, P extends Props> = Meta<Kind> & {
  base: B
  /** IcePanel lets a system, group or app hold children, and nothing else. Left off
   *  is "no", so only the kinds that do have anything to say about it. */
  holdsChildren?: boolean
  props: P
}

/** A wire kind. Same metadata, no base — a wire is not a model object. */
export type MetaEdge<Kind extends string, P extends Props> = Meta<Kind> & { props: P }

// How a data file declares one entry. `const` keeps `kind: 'actor'` from widening to
// string, which is what lets each family read its union off its own entries; the
// constraint rejects a property the blueprint doesn't have, a wrong type or a default
// outside its enum.
// The return type hands back the metadata a kind is allowed to leave off, so a reader
// can ask any entry whether it holds children without first narrowing the union to the
// kinds that bothered to answer.
type Optional = Pick<MetaNode<string, Base, Props>, 'icon' | 'holdsChildren'>
export const node = <const S extends MetaNode<string, Base, Props>>(spec: S): S & Optional => spec
export const edge = <const S extends MetaEdge<string, Props>>(spec: S): S & Pick<Optional, 'icon'> => spec
