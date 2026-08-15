# The technology catalog

An element type answers what kind of thing a box is. It cannot answer what the
box runs — taxonomy.md keeps Postgres out of the type table on purpose, as
free text on a Relational Database. IcePanel answers the same question with a
catalog of thousands of technology choices, each wearing its brand mark, and
that is the part worth having: a picker over the products, and the elephant on
the card.

taxonomy.md ruled this out as a data pipeline, not a feature. Inspected rather
than assumed, the pipeline is already run by someone else, and taking it is
two branches. Read this beside [taxonomy.md](taxonomy.md); the branches here
are its Phase C.

## The dependency, verified

`simple-icons`, v16.28.0 at the time of writing, pulled from npm and read
rather than trusted:

- **3,453 entries** — PostgreSQL, Apache Kafka, Kubernetes, nginx, Redis —
  each `{ title, slug, hex, path }`. Weekly releases for a decade; updating
  the catalog is `npm update`.
- **Every path sits on a 24×24 viewBox.** The sigil grid. A brand mark lands
  beside 8px engraved type with no scaling story at all.
- **CC0-1.0.** The data is public domain; the marks stay their owners'
  trademarks, shown to name a product — the same nominative use IcePanel and
  every editor with a brand picker relies on.
- **One ESM module: 5.0 MB raw, 2.1 MB gzipped, icons only** in the
  namespace, so `Object.values` of a dynamic import is the whole catalog.
- **No AWS or Azure marks.** Amazon pulled its brands from the set in 2024.
  taxonomy.md already rules vendor service iconography out of scope, so the
  dataset agrees with the plan: "DynamoDB" stays legal free text and goes
  unmarked.
- **Aliases are not on the runtime objects.** "Golang" finding Go means
  merging the package's 448 KB data JSON into the search index — a follow-on,
  taken only if the misses grate.

## The decision that keeps it small

`technology` stays a free string.

The catalog never enters the model. It is a render-time lookup from the
string to a mark — the Structurizr theme move taxonomy.md already endorses,
string in, icon out. No new FieldKey, no node-data change, nothing for
`feature/persistence` to migrate, and *Postgres is not an element type*
survives untouched. The picker's one job is to write canonical titles into
the same string, which is what turns render-time lookup from fuzzy matching
into an exact hit. Text the catalog has no line for was never illegal and
simply goes unmarked.

## `technology.tsx` — the data and the mark

The `c4.tsx` pattern: the table, and the one component that draws from it.

```tsx
import { use } from 'react'
import type { SimpleIcon } from 'simple-icons'

// IcePanel's thousands of entries, taken as a dependency instead of a data
// pipeline: 3,453 brands, each a title and a 24×24 path — the sigil grid.
// The type import erases at build; the module rides in its own chunk, fetched
// once behind first paint. Nothing awaits it but Suspense.
export const TECH = import('simple-icons').then((m) => {
  const marks = Object.values(m) as SimpleIcon[]
  return { marks, byTitle: new Map(marks.map((i) => [i.title.toLowerCase(), i])) }
})

// "PostgreSQL 16" wears the PostgreSQL mark: the longest leading run of words
// naming an entry, so a version rides along in the free text.
export const logoFor = (byTitle: Map<string, SimpleIcon>, value: string) => {
  const words = value.toLowerCase().split(/\s+/).filter(Boolean)
  for (let n = words.length; n > 0; n--) {
    const hit = byTitle.get(words.slice(0, n).join(' '))
    if (hit) return hit
  }
}

// The top of the catalog under a part-typed value, for the picker.
export const search = (marks: SimpleIcon[], q: string) =>
  marks.filter((i) => i.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8)

// The brand mark beside a technology, in whatever ink surrounds it — colour
// still belongs to the level. Mount under <Suspense>; null until the chunk
// lands, null again for text the catalog has no line for.
export function TechLogo({ name }: { name: string }) {
  const hit = logoFor(use(TECH).byTitle, name)
  return hit ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={hit.path} fill="currentColor" />
    </svg>
  ) : null
}
```

Three choices worth defending:

- **The promise is module-level.** The fetch starts when the app boots and
  runs behind the first paint, so by the time a panel opens the catalog is
  all but always resolved. `use()` under Suspense replaces the effect, the
  state and the loaded flag the same feature costs in pre-19 React.
- **Longest run of leading words, tried longest first.** "Apache Kafka
  consumer" finds Apache Kafka before Apache; "PostgreSQL 16" sheds its
  version; a miss costs one `Map.get` per word, bounded and cheap.
- **`currentColor`, not `hex`.** Colour carries the level and nothing else —
  the pigment law. The brand hex sits on every entry the day an
  IcePanel-coloured mode is wanted, and it is a fill attribute, not a
  migration.

## The mark on the card

`ElementNode` already prints the subtitle; the mark joins it only when the
subtitle is technology — Role and the other first-fields stay bare text.

```tsx
{subtitle && data[subtitle.key] && (
  <div className="c4-subtitle">
    {subtitle.key === 'technology' && (
      <Suspense>
        <TechLogo name={data.technology ?? ''} />
      </Suspense>
    )}
    {data[subtitle.key]}
  </div>
)}
```

Plus a rule in `index.css` sizing the svg to the subtitle line. The mark pops
in when the chunk lands; React Flow re-measures the node, so edges keep their
anchors.

## The picker

The native answer is a `<datalist>`, and it loses three times: it cannot put a
mark in its rows, its popup is unstylable browser chrome, and it can only
offer back what someone has already typed. (form.md kept a datalist as a
follow-on; this supersedes it.)

Nor is the answer a search box over all 3,453 brands. Dropping a Relational
Database and being offered Figma, Adidas and PostgreSQL alike is a catalogue,
not a field. **The element type is what narrows it** — and that mapping is the
one thing the brand set does not carry. Its entries are `title, slug, hex,
path` and nothing about what kind of thing a product is.

So it is written here: `catalog/tech.ts`, one line per type, the products that
type is actually built from.

```ts
export const TECH: Record<TypeKey, string[]> = {
  'relational-db': ['PostgreSQL', 'MySQL', 'MariaDB', 'Microsoft SQL Server', …],
  'pubsub-topic': ['Google Pub/Sub', 'Amazon SNS', 'Redis', 'NATS', …],
  person: [], // a person is a job, not a stack
}
```

Three things that table has to survive, and does:

- **A product belongs to several types.** Redis is an In-Memory Cache, a
  Key-Value Store, a Pub/Sub Topic and a Task Queue, so it stands on four
  lines. A list per type, not a type per product, is what makes that a
  non-question.
- **Nobody wrote your broker down.** Every shortlist ends in **Other…**, which
  opens a plain line and writes whatever you type. `technology` is still a free
  string, so the escape costs nothing and closes nothing off.
- **A name is spelled the way the brand set titles it** — "Apache Kafka", not
  "Kafka" — so the mark lands from the same render-time lookup the card uses.
  Products the set has no line for (Amazon pulled its own in 2024; Java, gRPC
  and HAProxy were never in it) are still good rows and simply stand bare.

The cost is honest and worth stating: 71 curated lines that a `npm update` does
not maintain. Staleness shows up as a missing row, and a missing row is Other,
which is a working field rather than a broken one.

## `TechPick.tsx` — the shortlist, searched

One flag on the one shared descriptor in `fields.ts` arms every category that
carries the field — the edge's protocol line in `RELATIONSHIP` is its own
object and stays plain text, because gRPC-the-protocol is not a product:

```ts
const TECHNOLOGY: Field = { key: 'technology', title: 'Technology', hint: 'PostgreSQL 16', input: 'tech' }
```

The shortlist is the *type's*, not the category's — Relational Database and
Vector Database share a shelf and share no products — so `fieldsFor` stamps it
on the descriptor at the one moment the type is known:

```ts
CATEGORY_FIELDS[TYPES[type].category].map((f) =>
  f.key === 'technology' ? { ...f, options: TECH[type] } : f)
```

Which means the panel needs no wiring at all: `options` is already a field, the
way it is for a pick. `Form.tsx` grows one branch beside `area` and `pick`, and
the control under it is a search box, a list of buttons, and a line behind
Other:

```tsx
const hits = [...options.filter((o) => o.toLowerCase().includes(q)), OTHER]

const take = (pick: string) => {
  setOther(pick === OTHER)
  if (pick !== OTHER) write(pick)   // Other keeps what was there to be edited
}
```

Two decisions inside it:

- **Plain buttons, not a listbox of options.** The ARIA combobox pattern wants
  `role="option"` rows that no key can reach except through the input's
  `aria-activedescendant`. Real buttons are reachable by Tab, named by their own
  text, and cost three lint suppressions less. The arrows and Enter are the fast
  path over the list, not the only way into it.
- **No open flag and no outside-click choreography.** The form's one-open-row
  design already pays that bill: the row unmounts when another opens, so Escape
  keeps its one meaning — shutting the rail.

`.tech-list` in `index.css` is the rail's own materials: slate ground, the row
under the arrows lit the way the open row is, the chosen row in brass.

## Testing

`vi.mock('simple-icons')` with hand-written entries, so jsdom never parses five
megabytes — `technology.test.tsx` for the match, `ElementNode.test.tsx` for the
mark on the card. The picker rides the `ElementForm` harness with the real
module, because what it asserts is the shortlist and not the paint: a dropped
Relational Database offers PostgreSQL and not Pinecone, "sql" narrows to two of
them, the arrows walk and Enter takes, Other writes free text through to the
card, and a hand-written value reopens on the line it was written on.

## What it costs, and the exit

The chunk is the whole cost: 2.1 MB gzipped, fetched once in the background,
cached after. For a local-first tool that is acceptable and invisible. If it
ever is not, the exit is a ten-line prebuild script writing
`{ title, path, hex }` to a static JSON — the maximal form of the pipeline
this plan refused to build by hand.

## Where it lands

Both branches sit on the form and on nothing later: the picker needs the
technology row, the mark needs the subtitle, and both are Phase A goods. It
stands as Phase C so two small decoration branches do not queue behind
nesting, which is the hardest interaction work in the stack.

## Out of scope

**Multiple technologies per element.** IcePanel tags many; the string holds
one product and its version. "React + Vite" stays legal text and the first
match wins the mark. Comma-splitting into several marks is a render change,
not a model change, whenever it is wanted.

**Brand-colour marks.** `hex` is on every entry; the pigment law says no. A
theme toggle, if ever.

**Values already on the board.** A "MyBroker 3" typed behind Other on one node
does not offer itself on the next. It is one `getNodes()` away whenever the
retyping grates; until then the shortlist is the answer, and a second, softer
list beside it is two things to read.

**Searching all 3,453 from the field.** The shortlist plus Other covers both
ends — the product you meant and the product nobody wrote down. A full-catalogue
search covers the middle, which is Figma offered to a database.

**Tech-aware rack search.** "postgres" in the rack suggesting Relational
Database is the same table read backwards, and backwards it does not work:
Redis stands on four lines here, so the rack would have to guess which. The
rack searches types; the form offers products.

**Aliases.** The 448 KB data JSON knows "Golang"; the runtime objects do not.
Any product worth a row is spelled the brand set's way in `tech.ts` instead,
which is the same fix for the rows that matter.
