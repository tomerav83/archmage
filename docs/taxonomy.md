# Element taxonomy

Archmage draws eighty-three kinds of element across twelve shelves, ten of them
ground that other elements stand on. This file is why those are the shelves and
why a type stands where it does. The rows themselves live in `src/catalog/`,
one file per shelf, and that is the only copy — the tables this file used to
repeat had drifted from the code by the time anybody read them again.

## Three axes, not one

C4-PlantUML, Structurizr, IcePanel and Backstage disagree on names and agree
completely on shape. What level you are zoomed to, what kind of thing it is, and
what it is actually built from are three independent fields, never one enum.

Backstage keeps `kind` separate from a free-string `spec.type`. Structurizr
keeps `technology` as free text and maps tags to icons, which is how its AWS,
Azure, GCP and Kubernetes themes work without adding a single element type.
IcePanel carries a catalog of thousands of technology choices as tags on six
object types.

The consequence is load-bearing here: **Postgres is not an element type.** It is
a `technology` on a Relational Database. That one decision is what makes
eighty-three types tractable instead of an icon-pack treadmill with no end.

```
level       : context | container | component | deployment   the zoom
type        : relational-db | api-gateway | event-stream | …  83 values
technology  : "PostgreSQL 16"                                 off the type's shortlist
```

A type is legal at exactly one level. The plan once gave every type a list of
them and a fourth axis besides, `external: boolean`; neither was ever built,
and nothing on a node says inside or outside — the boundary it stands in is
what says that.

`c4.tsx` holds two tables and the twelve shelf files fill the second. `LEVELS`
is four rows and carries the only pigment on the board; `TYPES` is eighty-three
and carries the sigil, the shelf and the level. Eighty-three accent colours
would be mud, so the colour tells you the level and the sigil tells you the
type, and a diagram still reads in greyscale. The file's promise holds one step
further out than it was written: to add a kind, add a line to its shelf; to add
a shelf, add a file under `catalog/` and a line in `c4.tsx`.

## The twelve shelves

In the rail's order. A shelf is a line in `fields.ts`'s field table and a face
in `catalog/marks.tsx`; a type is a line in `catalog/tech.ts`. Missing any of
the three is a compile error — the only bookkeeping this catalogue gets, and
the reason those three tables have not drifted the way a table in a document
did.

| Shelf | Types | Level | Frames |
| --- | --- | --- | --- |
| Actors & Externals | 2 | Context | — |
| Applications | 11 | Container, one Component | — |
| APIs & Contracts | 8 | Container | — |
| Data Stores | 12 | Container | — |
| Caching | 4 | Container | — |
| Messaging & Streaming | 7 | Container | — |
| Edge & Traffic | 8 | Container, one Deployment | — |
| Platform & Security | 8 | Container | — |
| Observability & Ops | 5 | Container | — |
| Analytics & ML | 6 | Container | — |
| Boundaries & Zones | 6 | all four | all six |
| Deployment & Infrastructure | 6 | Deployment | four of six |

**Actors & Externals** is Person and Software System — C4's two context
primitives, and the whole of what a context diagram has to name.

**Applications** is anything that runs, and it is where Container and Component
live. The sigil says where a thing runs rather than what it is written in:
Rails and Next.js are one Web Application told apart by its technology.

**APIs & Contracts** models the interface apart from whatever serves it —
Backstage makes `API` a first-class kind for the same reason.

**Caching** is only what is a box on a diagram. Write-through and cache-aside
are strategies, not elements, and belong in a description.

**Messaging & Streaming** is where C4-PlantUML has one Queue stereotype and
real systems need seven.

**Edge & Traffic** is the front door, in the order a request meets it: DNS,
CDN, load balancer, proxy, gateway, mesh. WAF / Firewall is the one row on the
shelf that levels with the machines instead.

**Boundaries & Zones** is the shelf whose types hold other elements rather than
standing beside them — a frame, not a card. Every one of them is drawn from a
right-click and none is ever dragged, so it is the one shelf with no tab on the
rack. See [nesting.md](nesting.md).

**Deployment & Infrastructure** is the only shelf split down the middle: an
environment, a region, a cluster and a compute node hold what is deployed in
them, while an infrastructure node and an instance stand in one — so it is the
one shelf that faces both a tab on the rack and rows in the enclose menu.

What a type is built from is a curated shortlist per type in `catalog/tech.ts`
— not free text, and not the brand set's 3,453 entries. See
[technology.md](technology.md).

## What is left

Eighteen branches built everything above, each on the one before it, each a
pull request: the shelves here, the panel in [form.md](form.md), the brand
marks in [technology.md](technology.md), the frames in
[nesting.md](nesting.md). They are in the git log, which is where a spent build
order belongs. One branch is still standing.

### Persistence

**`feature/persistence`**
Save to localStorage, import and export JSON. Last, because it is the only
branch that has to know the whole schema and nesting is what finishes it:
nesting gives a node a parent and the deployment branches give it an
instance-of, and a file format written before those is a file format migrated
after them. Everything already built only adds values to a string union, or
paint the file never carries.
Done when a diagram survives a reload and round-trips through export/import,
parents and all.
Touches `DiagramCanvas.tsx`, a new `model.ts`.

## Out of scope

**Vendor icon packs.** 500 AWS icons, 200 Azure icons. `technology` already
carries "PostgreSQL 16"; an icon per vendor buys recognition at the price of a
permanent treadmill. Structurizr solves this with themes mapping tags to icons.
If it is wanted later it is a theme layer, never element types. The brand marks
in [technology.md](technology.md) are that layer for products, taken as a
dependency; a cloud's own service iconography stays out — and since 2024, out
of the dataset as well.

**Code and level-4 diagrams.** IcePanel dropped them and points at source
instead. Nobody hand-maintains a class diagram.

**Dynamic and sequence views.** Numbered interaction steps are a different
editor with a different interaction model, not a taxonomy problem.

**Per-type accent colours.** Eighty-three pigments is mud. Colour carries the
level, the sigil carries the type, the band carries both as text.

## Sources

- [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) — stereotypes, boundaries, deployment macros
- [Structurizr DSL](https://docs.structurizr.com/dsl/language) and [themes](https://docs.structurizr.com/ui/diagrams/themes) — technology as free text, tags as icons
- [IcePanel modelling](https://docs.icepanel.io/core-features/modelling) — actor/group/system/app/store/component, internal vs external, status
- [Backstage descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/) — kind vs. spec.type, API as a first-class kind
- [System Design Primer](https://github.com/donnemartin/system-design-primer) — DNS, CDN, load balancer, proxy, cache, asynchronism
- [CNCF Landscape](https://landscape.cncf.io/) — streaming and messaging, service mesh, API gateway, observability
- [simple-icons](https://simpleicons.org) — 3,453 CC0 brand marks on a 24-unit grid, the technology catalog as a dependency
