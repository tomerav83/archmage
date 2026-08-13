import { TYPES, type TypeKey } from './c4'

// A person has no technology, a cache has a TTL nothing else has, a boundary
// has neither. Eighty-two types do not want one form and they certainly do not
// want eighty-two: they want one table, keyed by category.

// Every slot an element can carry. Node data is flat and takes exactly these
// keys, so a field the panel can render is a field the node has a place for.
export type FieldKey =
  | 'label'
  | 'description'
  | 'technology'
  | 'role'
  | 'endpoint'
  | 'ttl'
  | 'delivery'
  | 'instances'
  | 'classification'
  | 'owner'
  | 'status'
  | 'link'
  | 'tags'

export type Field = {
  key: FieldKey
  title: string // what the panel engraves over the input
  input?: 'area' | 'pick' // a line of text unless said otherwise
  hint?: string // placeholder, lifted from the catalogue tables
  options?: string[] // pick only
}

// What every element takes, whatever it is.
export const COMMON: Field[] = [
  { key: 'label', title: 'Name', hint: 'Orders Service' },
  { key: 'description', title: 'Description', input: 'area' },
]

// What the catalogue wants of every element, whatever it is.
export const CATALOG: Field[] = [
  { key: 'owner', title: 'Owner', hint: 'Payments team' },
  { key: 'status', title: 'Status', input: 'pick', options: ['Live', 'Planned', 'Deprecated'] },
  { key: 'link', title: 'Link', hint: 'https://github.com/…' },
  { key: 'tags', title: 'Tags', hint: 'pci, tier-1' },
]

// Eight of the twelve categories take this and nothing else. That repetition is
// the argument: one table with a value repeated, not twelve forms alike.
const TECHNOLOGY: Field = { key: 'technology', title: 'Technology', hint: 'PostgreSQL 16' }

// The twelve shelves of the catalogue in docs/taxonomy.md, written once: a
// category is a line in this table and nothing else, and c4's Category is these
// keys. To give a category a field: add it to its line.
const CATEGORY_FIELDS = {
  'Actors & Externals': [{ key: 'role', title: 'Role', hint: 'Support agent' }],
  Applications: [TECHNOLOGY],
  'APIs & Contracts': [TECHNOLOGY, { key: 'endpoint', title: 'Endpoint', hint: '/v1/orders' }],
  'Data Stores': [
    TECHNOLOGY,
    {
      key: 'classification',
      title: 'Classification',
      input: 'pick',
      options: ['Public', 'Internal', 'Confidential', 'Restricted'],
    },
  ],
  Caching: [TECHNOLOGY, { key: 'ttl', title: 'TTL', hint: '5m' }],
  'Messaging & Streaming': [
    TECHNOLOGY,
    {
      key: 'delivery',
      title: 'Delivery',
      input: 'pick',
      options: ['at-most-once', 'at-least-once', 'exactly-once'],
    },
  ],
  'Edge & Traffic': [TECHNOLOGY],
  'Platform & Security': [TECHNOLOGY],
  'Observability & Ops': [TECHNOLOGY],
  'Analytics & ML': [TECHNOLOGY],
  'Boundaries & Zones': [], // a boundary is a name and a reason
  'Deployment & Infrastructure': [TECHNOLOGY, { key: 'instances', title: 'Instances', hint: '3' }],
} satisfies Record<string, Field[]>

// A type declaring a category the table has no line for is a compile error in
// c4.tsx — which is the only check the two files need of each other.
export type Category = keyof typeof CATEGORY_FIELDS

// Beyond Name and Description, which everything takes. The card prints the
// first of these under the name; the panel prints all of them. Role is the
// person's half of Actors & Externals; C4 gives a software system no
// technology, so a system takes a name and a description — the one type today
// that disagrees with its category. A second one wants a table, not a second
// branch here.
export const fieldsFor = (type: TypeKey): Field[] =>
  type === 'system' ? [] : CATEGORY_FIELDS[TYPES[type].category]
