# Element fields and the form

A Person has no technology. A cache has a TTL that nothing else on the board
has. A trust zone has neither. Eighty-two types do not want one form, and they
certainly do not want eighty-two.

This is the field model that keeps the count at one, and the panel that renders
it. Read it beside [taxonomy.md](taxonomy.md); the categories here are that
document's categories.

## What the four tools agree on

Every source in taxonomy.md was read for its field list, not just its type list.
They disagree about almost nothing.

| Field | Structurizr | C4-PlantUML | Backstage | IcePanel |
| --- | --- | --- | --- | --- |
| Name | ✓ | `label` | `metadata.name` | ✓ |
| Description | ✓ | `descr` | ✓ | ✓ display + detailed |
| Technology | container, component, deployment, infrastructure **only** | `techn`, and only on Container and Component | — | ✓ technology choices |
| Tags | ✓ | `tags` | ✓ | ✓ |
| Link | `url` | `link` | `links[]` | ✓ custom links |
| Owner | — | — | `spec.owner`, **required** | ✓ ownership team |
| Status | — | — | `spec.lifecycle`, **required** | ✓ live / future / deprecated |
| External | — | `_Ext` macros | — | ✓ internal / external |
| Instances | ✓ deployment nodes only | — | — | — |
| Free key/value | ✓ `properties` | — | `labels`, `annotations` | — |

Two things fall out of that table, and both are load-bearing.

**Not one of them has a per-category field.** Every element in all four tools
gets the same six or seven slots, and anything else goes in a free-text
technology or an arbitrary property bag. The only exception in the whole survey
is Structurizr's `instances`, which it allows on deployment nodes and nowhere
else. So the category tier below is ours, it is not standard practice, and it
has to stay small enough to be obviously worth it.

**Structurizr and C4-PlantUML scope technology exactly the way the premise
here demanded.** `System()` takes no `techn` at all in C4-PlantUML; only
`Container()` and `Component()` do. A person having no technology is not a
special case to code around — it is the rule, and the field is the exception.

The other half of the table is the honest answer to *are there more fields you
need*: **Owner, Status, Link and Tags**, present in all four tools in some form,
absent from the first draft of this plan. Owner and Status are empty for the two
older tools and required in the newest — they are what a catalog wants and what
a drawing traditionally did not. Take them anyway. A diagram that cannot say
*this one is on the way out* is a diagram that gets redrawn from scratch.

## Three tiers, and four more fields

```
core, always      : Name, Description                      2 fields
core, by category : what this category is made of          0–2 fields
core, by type     : where one type disagrees               1 exception today
catalogue, always : Owner, Status, Link, Tags              4 fields
```

The lookup is one line — `CATEGORY_FIELDS[category]`, with `system` branched
out ahead of it — because the catalog breaks the category rule in its own first
three rows. Person's examples are *Customer, support agent, admin*, which is a
role; External System's are *Stripe, Salesforce, HMRC*, which is a technology.
One category, two shapes. (C4 proper would give External System nothing, since a
system has no `techn`. The catalog already wrote *Stripe* in that column and
IcePanel agrees with the catalog, so it keeps it.)

That exception is a branch and not a table because there is one of it. The
second type to disagree — Load Balancer saying *L4 or L7* — is what buys a
`TYPE_FIELDS` table, and it can buy it then.

There is no fold. The panel that shipped is a sheet of one-line rows, so four
more fields cost four lines rather than four inputs — the height the fold was
invented to save. See [The panel](#the-panel).

## The core: what each category carries

Beyond Name and Description, which everything takes.

| Category | Adds | Why |
| --- | --- | --- |
| Actors & Externals | Role — *except* External System, which takes Technology | A person is a job, not a stack |
| Applications | Technology | Rails, Go, Lambda |
| APIs & Contracts | Technology, Endpoint | The address is half of what an API is |
| Data Stores | Technology, Classification | The second question about a store is what is in it |
| Caching | Technology, TTL | The only question ever asked of a cache |
| Messaging & Streaming | Technology, Delivery | at-most-once / at-least-once / exactly-once |
| Edge & Traffic | Technology | nginx, Envoy, CloudFront |
| Platform & Security | Technology | Vault, Okta, OPA |
| Observability & Ops | Technology | Prometheus, Loki, Argo CD |
| Analytics & ML | Technology | Flink, vLLM, Feast |
| Boundaries & Zones | — | A boundary is a name and a reason |
| Deployment & Infrastructure | Technology, Instances | EKS ×3 — Structurizr's one per-kind field, kept where it put it |

Eight of the twelve are the bare Technology field. That repetition is the whole
argument: this is a table with one value repeated, not twelve forms that happen
to look alike.

Classification earns its row off the threat-modelling reading rather than the
architecture one — every element in a data-flow diagram carries a trust level,
and stores carry a sensitivity. The catalog already models Trust Zone as a type,
so the vocabulary is half there. It is also the first row on the cut line below.

## The catalogue four: what everything carries

| Field | Input | Taken from |
| --- | --- | --- |
| Owner | text — *Payments team* | Backstage `spec.owner`, IcePanel ownership team |
| Status | pick — Live / Planned / Deprecated | Backstage `spec.lifecycle`, IcePanel status |
| Link | url — repo, runbook, dashboard | Structurizr `url`, C4-PlantUML `link` |
| Tags | text, comma separated | all four |

Status is the one of these that changes the card: Planned draws a dashed
border, Deprecated dims it. Two CSS rules, and they land in the same branch —
a status that renders nowhere is a field nobody fills in.

Tags stay a comma-separated string rather than a chip control. Splitting on a
comma is one line; a chip control is the most boilerplate-heavy input in any
form, and the consumer that would want real tags — Structurizr-style themes
mapping tags to vendor icons — is out of scope in taxonomy.md.

`external` is not here because taxonomy.md gives it to `feature/taxonomy-model`.
When that lands it appends one line to this table.

## The table

```ts
type Field = {
  key: FieldKey
  title: string                            // what the panel engraves over the input
  input?: 'text' | 'area' | 'pick' | 'url' // text unless said otherwise
  hint?: string                            // placeholder, lifted from the catalog tables
  options?: string[]                       // pick only
}

const COMMON = [
  { key: 'label', title: 'Name', hint: 'Orders Service' },
  { key: 'description', title: 'Description', input: 'area' },
]

const CATALOG = [
  { key: 'owner', title: 'Owner', hint: 'Payments team' },
  { key: 'status', title: 'Status', input: 'pick', options: ['Live', 'Planned', 'Deprecated'] },
  { key: 'link', title: 'Link', input: 'url', hint: 'https://github.com/…' },
  { key: 'tags', title: 'Tags', hint: 'pci, tier-1' },
]

const TECHNOLOGY = { key: 'technology', title: 'Technology', hint: 'PostgreSQL 16' }

// To give a category a field: add it to its line.
const CATEGORY_FIELDS = {
  'Actors & Externals': [{ key: 'role', title: 'Role', hint: 'Support agent' }],
  Applications: [TECHNOLOGY],
  Caching: [TECHNOLOGY, { key: 'ttl', title: 'TTL', hint: '5m' }],
  …
} satisfies Record<Category, Field[]>

// To let one type disagree with its category: add it here.
const TYPE_FIELDS = {
  'external-system': [TECHNOLOGY],
} satisfies Partial<Record<TypeKey, Field[]>>
```

Thirteen keys exist in total — `label`, `description`, `technology`, `role`,
`endpoint`, `ttl`, `delivery`, `instances`, `classification`, `owner`, `status`,
`link`, `tags` — and any one element shows two to four of them plus a shut fold.

`FieldKey` is derived from the tables, so a field the panel can render is a
field the node data has a place for, checked at compile time. Node data stays
flat — `{ kind, label, technology?, ttl?, … }` — so the panel writes with the
`updateNodeData(id, { [key]: value })` that already works, and export in
`feature/persistence` is the data object as it stands, with no bag to unwrap.

The card keeps printing the **first** core field under the name: Technology for
most, Role for a person, nothing for a boundary — the line `ElementNode` already
renders, now told what to put in it.

## The panel

A rail on the right, mirroring the one on the left: 288px, slate, brass hairline
down its inner edge, mono engraved labels over sans inputs. The left rail is
what you take *from*; the right is what you say *about* what you took. Same
instrument, two faces.

It is a sheet of what the element says, with **one row open for typing**. A
press on another row moves the caret there and shuts the one behind it, so the
open field is the only lit thing in the rail and there is nothing else to hunt
for. Rows are buttons, so the sheet is walkable on Tab.

```
┌──────────────────────────────┐
│ CONTAINER · RELATIONAL DB  ✕ │  band, same pigment as the card
├──────────────────────────────┤
│ NAME                         │  the open row: cut below the panel,
│ [ Orders DB               ]  │  lit brass along its top edge
├──────────────────────────────┤
│ DESCRIPTION  The orders …    │
│ TECHNOLOGY   PostgreSQL 16   │
│ CLASSIF…     Confidential    │
│ OWNER        —               │  nothing said yet
│ STATUS       Live            │
│ LINK         —               │
│ TAGS         pci, tier-1     │
└──────────────────────────────┘
```

Every field is a row, which is what killed the fold: four more fields cost four
lines, not four inputs. It is also why an empty field reads as an em dash — the
row's own gutter already names it, so the value column only has to say empty.

**Opens** on a drop — the element you just placed is the one you want to name —
and on a double-click of any node. Both are one line in `DiagramCanvas`: the
drop handler already mints the id, and `onNodeDoubleClick` fires on the card.
That last part is not obvious: `useWard` captures the pointer on every press, so
the browser aims `click` and `dblclick` at the card rather than at whatever is
under the cursor. Verified in Chromium — the event still bubbles from the card
to React Flow's node wrapper, so the built-in handler sees it.

**Closes** on Escape, on the ✕, and on nothing else. It is not modal: the board
stays live behind it, panning and dragging as usual, and dropping another
element re-points the panel rather than stacking a second one.

**Mounted always**, slid out by `transform: translateX(100%)` with `visibility`
transitioned alongside so it takes no focus when shut. The last opened node is
held in a ref so the panel has something to draw while it slides away.
`prefers-reduced-motion` drops the transition.

**The name row is the open one on every open**, with its text selected, so a
fresh drop is named by typing whatever row was left open last time. A control
asks for the caret as it mounts, which is one callback ref for all of it: the
click that opens a row is the only click that row costs. It asks a task later
rather than in the ref itself — a panel opened by a drop mounts while the drag
is still running, and a browser ignores focus asked for mid-drag, which quietly
cost the first thing typed after a drop.

## Relationships take the same shape

Structurizr gives a relationship description, technology, tags, url and
properties. C4-PlantUML's `Rel()` takes label, techn, descr, tags and link. That
is the element list with the category tier removed — which means
`feature/relationship-detail` is not a second editor, it is this panel pointed at
an edge, with `[label, technology, interaction]` for its fields and
dashed-versus-solid falling out of `interaction`. Not `style`: that is the word
Structurizr keeps for appearance, and both it and C4-PlantUML put the fact on
the model and derive the line from it, which is the same division this document
makes everywhere else.

So it moves after the form rather than before it. Building click-an-edge
editing first means building it twice.

## What this deletes

`feature/element-identity` put the fields on the card. The panel replaces them,
and `ElementNode` gives back its `editing` state, both inputs, the caret ref,
the keydown handler and its own double-click handler — the component returns to
rendering a card and nothing else. `.c4-edit` leaves `index.css` with it.

The card is read-only after this: band, name, first field. That is the right
division. A card is a thing on a board; the panel is where you talk about it.

## Where it lands

After `feature/taxonomy-model`, which is what creates the categories the table
is keyed by — landing it earlier means keying it to the four kinds that exist
today and rekeying it a branch later. And before `feature/relationship-detail`,
for the reason above. `feature/persistence` is no longer a deadline: it now
lands after nesting, which is the branch that actually finishes the schema.

It went in ahead of the catalogue itself: the table is what eighty-three
types would otherwise have needed eighty-three forms for.

## The cut line

If the panel reads long, drop rows in this order. Each is one line.

1. **Classification** — the security diagram's field, not the architecture
   diagram's. No tool in the survey carries it.
2. **Endpoint** — an API's path is often in its name already.
3. **Tags** — no consumer until a theme layer exists, and taxonomy.md puts that
   out of scope.
4. **Owner** — free text standing in for an org chart nothing here reads.

Name, Description, Technology, Role, TTL, Delivery, Instances, Status and Link
are not on it.

## Testing

The field table is data: one test that every category resolves to a list, and
that every key in every list is a `FieldKey` — the second is a `satisfies`, so
it costs a compile rather than a test. The panel gets the harness from
`ElementNode.test.tsx`: opens on drop, opens on double-click, a write reaches
node data, a press on a row opens it and shuts the one behind it, a catalogue
field writes the same way, Escape closes. Dispatch the
double-click at the card, not at the text under it — a test that aims at the
text passes while the app does nothing.

That is a second file needing the `ResizeObserver` stub, so it moves to a vitest
`setupFiles` when this lands.

## Out of scope

**A free key/value bag.** Structurizr has `properties`, Backstage has `labels`
and `annotations`, and every catalog grows one eventually — it is the honest
answer to *my org needs a field you did not think of*, and it is why being
stingy above is safe rather than final. It wants a repeater control, which is
the most boilerplate-heavy input there is. Not until someone asks.

**Structurizr's perspectives.** Named viewpoints — security, performance,
ownership — each with their own description per element. A second axis over
every field in this document, for the price of the whole document again.

**Links as an array.** Backstage carries many; one covers the repo or the
runbook, and a repeater control costs more than the second link is worth.

**Criticality tiers, SLOs, on-call.** Datadog and Port carry all three. They
describe how a service is *run*, and nothing here reads them.

**Changing an element's type from the panel.** Dropping the wrong one and
deleting it is two clicks. Revisit if it turns out to be four.

**Multi-select.** The panel follows one node.

**A `<datalist>` over technologies already typed.** Superseded by
[technology.md](technology.md): the picker there suggests from the full brand
catalog with values already on the board standing first, and a datalist could
not have put a mark in its rows anyway.

**Per-type placeholders.** The catalog tables already hold three examples for
each of the 82 types, so the data is written — it is a column in the `TYPES`
table when someone wants it, and the hint falls back to the category's until
then.
