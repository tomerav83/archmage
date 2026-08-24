import { TYPES, type TypeKey } from './c4'
import { TECH } from './catalog/tech'

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
  | 'instanceOf' // an instance only: the container or system deployed here
  | 'classification'
  | 'owner'
  | 'status'
  | 'link'
  | 'tags'
  | 'interaction' // an edge only: is anybody waiting for the answer

export type Field = {
  key: FieldKey
  title: string // what the panel engraves over the input
  input?: 'area' | 'pick' | 'tech' // a line of text unless said otherwise
  hint?: string // placeholder, lifted from the catalogue tables
  options?: string[] // pick and tech: the whole of a pick, the shortlist of a tech
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

// How many of this there are. It was Deployment's alone, where an Instance
// says how many of it run; an application scales out and a stream partitions,
// and both want to say the same thing in the same word. The card draws it as
// a stack rather than as three cards, because the model holds a count.
const INSTANCES: Field = { key: 'instances', title: 'Instances', hint: '3' }

// Eight of the twelve categories take this and nothing else. That repetition is
// the argument: one table with a value repeated, not twelve forms alike.
const TECHNOLOGY: Field = {
  key: 'technology',
  title: 'Technology',
  hint: 'PostgreSQL 16',
  input: 'tech',
}

// The twelve shelves of the catalogue in docs/taxonomy.md, written once: a
// category is a line in this table and nothing else, and c4's Category is these
// keys. To give a category a field: add it to its line.
const CATEGORY_FIELDS = {
  'Actors & Externals': [{ key: 'role', title: 'Role', hint: 'Support agent' }],
  Applications: [TECHNOLOGY, INSTANCES],
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
    INSTANCES,
  ],
  'Edge & Traffic': [TECHNOLOGY],
  'Platform & Security': [TECHNOLOGY],
  'Observability & Ops': [TECHNOLOGY],
  'Analytics & ML': [TECHNOLOGY],
  'Boundaries & Zones': [], // a boundary is a name and a reason
  'Deployment & Infrastructure': [TECHNOLOGY, INSTANCES],
} satisfies Record<string, Field[]>

// The one type that carries a field none of its shelf-mates do: an
// Infrastructure Node is the machine, an Instance is one of a thing running on
// it, so only the second wants to say which. Options are the board rather than
// the registry, so they are left empty and stamped in ElementForm, the way the
// technology shortlist is stamped by type.
const INSTANCE_OF: Field = { key: 'instanceOf', title: 'Instance of', input: 'pick', options: [] }

// An edge takes the element list with the category tier removed — which is why
// it is this panel pointed at a line rather than an editor of its own.
export const RELATIONSHIP: Field[] = [
  { key: 'label', title: 'Label', hint: 'publishes OrderPlaced' },
  { key: 'technology', title: 'Technology', hint: 'gRPC, JSON/HTTPS' },
  // Dashed or solid falls out of this, and nothing else does — the fact is
  // the model's, the line it draws is the picture's.
  { key: 'interaction', title: 'Interaction', input: 'pick', options: ['Sync', 'Async'] },
]

// A type declaring a category the table has no line for is a compile error in
// c4.tsx — which is the only check the two files need of each other.
export type Category = keyof typeof CATEGORY_FIELDS

// The shelves in catalogue order, which is the order they stand in the rail.
export const CATEGORIES = Object.keys(CATEGORY_FIELDS) as Category[]

// Beyond Name and Description, which everything takes. The card prints the
// first of these under the name; the panel prints all of them. Role is the
// person's half of Actors & Externals; C4 gives a software system no
// technology, so a system takes a name and a description — the one type that
// disagrees with its category outright, rather than carrying one field more
// than its shelf-mates the way an instance does.
//
// Technology is the one field whose options are the type's rather than the
// category's — Relational Database and Vector Database share a shelf and share
// no products — so the shortlist is stamped on the shared descriptor here,
// where the type is finally known. That is also why the panel needs no wiring
// for it: options is a field, exactly as it is for a pick.
export const fieldsFor = (type: TypeKey): Field[] =>
  type === 'system'
    ? []
    : CATEGORY_FIELDS[TYPES[type].category]
        .map<Field>((f) => (f.key === 'technology' ? { ...f, options: TECH[type] } : f))
        .concat(type === 'instance' ? INSTANCE_OF : [])
