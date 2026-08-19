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

The native answer is a `<datalist>`, and it loses twice: it cannot put a mark
in its rows, and its popup is unstylable browser chrome in an app whose whole
point is the faceplate. (form.md kept a datalist as a follow-on; this
supersedes it.)

One flag on the one shared descriptor in `fields.ts` arms every category that
carries the field — the edge's protocol line in `RELATIONSHIP` is its own
object and stays plain text, because gRPC-the-protocol is not a product:

```ts
const TECHNOLOGY: Field = { key: 'technology', title: 'Technology', hint: 'PostgreSQL 16', input: 'tech' }
```

`Form.tsx` grows one branch beside `area` and `pick`. The fallback is today's
input, typeable during the cold-start second before the chunk lands; both
controls take `ref={caret}`, so focus survives the swap.

```tsx
) : f.input === 'tech' ? (
  <Suspense fallback={<input ref={caret} placeholder={f.hint} value={value} onChange={write} />}>
    <TechInput caret={caret} hint={f.hint} value={value} write={(v) => shown.write(f.key, v)} />
  </Suspense>
) : (
```

And the control itself. The form's one-open-row design has already paid the
combobox's hardest bills: the row unmounts when another opens, so there is no
outside-click or blur choreography, no stacking, and Escape keeps its one
meaning — shutting the rail.

```tsx
import { useReactFlow } from '@xyflow/react'
import { type Ref, use, useState } from 'react'
import type { ElementNodeType } from './ElementNode'
import { search, TECH, TechLogo } from './technology'

// The technology row's line of text with the catalog standing under it. No
// open flag: the list stands while the value names more than exactly itself,
// and picking writes the canonical title — which is what shuts it.
export function TechInput({ caret, hint, value, write }: {
  caret: Ref<HTMLInputElement>
  hint?: string
  value: string
  write: (v: string) => void
}) {
  const { marks } = use(TECH)
  const { getNodes } = useReactFlow<ElementNodeType>()
  const [active, setActive] = useState(0)

  const q = value.trim().toLowerCase()
  // What the board already says stands first: your own "PostgreSQL 16"
  // outranks the catalog's bare "PostgreSQL".
  const yours = [...new Set(getNodes().flatMap((n) => n.data.technology || []))]
    .filter((t) => t !== value && t.toLowerCase().includes(q))
  const hits = q
    ? [...new Set([...yours, ...search(marks, q).map((i) => i.title)])].slice(0, 8)
    : []
  const shown = hits.length === 1 && hits[0] === value ? [] : hits
  const at = Math.max(0, Math.min(active, shown.length - 1))

  return (
    <>
      <input
        ref={caret}
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls="tech-list"
        aria-activedescendant={shown.length ? `tech-opt-${at}` : undefined}
        placeholder={hint}
        value={value}
        onChange={(e) => {
          setActive(0)
          write(e.target.value)
        }}
        onKeyDown={(e) => {
          if (!shown.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((at + 1) % shown.length)
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((at + shown.length - 1) % shown.length)
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            write(shown[at])
          }
        }}
      />
      {shown.length > 0 && (
        <ul className="tech-list" id="tech-list" role="listbox">
          {shown.map((title, i) => (
            <li key={title} id={`tech-opt-${i}`} role="option" aria-selected={i === at}>
              <button type="button" tabIndex={-1} onClick={() => write(title)}>
                <TechLogo name={title} />
                <span>{title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
```

`.tech-list` in `index.css` is the rail's own materials: slate ground, brass
hairline, the active row lit the way the open row is.

## Testing

`vi.mock('simple-icons')` with three hand-written entries, so jsdom never
parses five megabytes. The match is data — "PostgreSQL 16" hits PostgreSQL,
"Apache Kafka consumer" hits Apache Kafka before Apache, unknown text hits
nothing — which is why `logoFor` is exported. The picker rides the
`ElementForm` harness: type "post", the list stands, Enter writes the
canonical title, the card takes the mark, and a value already on the board
stands above the catalog's.

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

**Categories in the picker.** IcePanel's picker browses by category because
its catalog is the whole model. Here the category already lives on the
element type; the picker only finishes a string.

**Tech-aware rack search.** "postgres" in the rack suggesting Relational
Database means hand-curating a product-to-type table — the pipeline again,
per entry. The rack searches types; the form searches products.

**Aliases.** The 448 KB data JSON knows "Golang"; the runtime objects do not.
Merge it into the search index only if the misses grate.
