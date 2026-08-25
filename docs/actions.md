# Quick actions

Archmage draws 83 kinds of thing and 10 kinds of ground to stand them on. It
cannot do one single thing anybody actually *does* to a system.

Adding a read replica is fifteen presses. Putting a service behind a load
balancer and running three of it is thirty-one. Standing up a second region is
eighty-five, because nothing on this board copies. Walking one drawing from
launch day to a million users — the eight moves every system makes, in the order
every system makes them — costs three hundred and five presses, and not one of
them is the decision. The decisions are eight.

This is the table that closes that gap. Read it beside [fields.ts](../src/fields.ts):
the shape is the same one that file already won — **one table keyed by category,
not eighty-three forms** — and that is the whole argument for doing it this way.

## What a press costs today

Measured off the code, not guessed. Every number in this document is built from
these six rows.

| Gesture | Presses | Where |
| --- | --- | --- |
| Place one element from the rack | 2 | tab (`ElementRack`), drag the faceplate |
| Name it | 1 | the panel opens on Name, selected — type over it |
| Set Technology | 2 | click the row, pick from the shortlist (`TechPick`) |
| Set any other pick — Status, TTL, Delivery | 2 | click the row, pick |
| Draw one line | 2 | hold the source 420ms (`HOLD_MS`), press the target |
| Say what the line does | 3 | type the label, click Interaction, pick Async |

So a described element on the end of a described line is **11 presses**, and
every architectural move is two to nine of those. The rack is not the problem
and the panel is not the problem; both are good at what they do. The problem is
that the board has a vocabulary of *nouns* and the work is all *verbs*.

## Four verbs, and the table is data

Everything below is one of four moves. That is the ceiling the design is bought
at: no command bus, no plugin registry, no undo stack beyond the one React Flow
already keeps.

| Verb | What it does | Reuses |
| --- | --- | --- |
| `attach` | Drops an element beside the subject and wires it | `nest`, `addEdge`, `faces` |
| `front` | Inserts an element **upstream** and re-points every inbound line at it | `addEdge`, `faces` |
| `becomes` | Swaps the type in place, keeping lines, fields and position | `updateNodeData` |
| `replicate` | Clones a node — or a whole frame — into a fresh frame beside it | `frameAround`, `nest` |

`attach` and `front` carry the label and the interaction, so the line arrives
described. Both inherit the subject's `technology` where the new type's `TECH`
shortlist has a line for it: a replica off a PostgreSQL primary is a PostgreSQL
replica without anybody saying so.

A move is a row, and a row can hold a list — *Offload to queue* is three
`attach`es and nothing new. The four verbs never grow; the table does.

## The map

Twelve shelves, and what each one's types can have done to them. The categories
are `fields.ts`'s categories, and a shelf without a line here is a compile error
the same way a category without fields is.

| Shelf | Types | Quick actions |
| --- | --- | --- |
| Actors & Externals | 2 | Add client app · Expose API · Split into containers |
| Applications | 11 | **Scale out ×N** · **Put behind load balancer** · Add cache · Offload to queue · Add database · Extract service |
| APIs & Contracts | 8 | Put behind gateway · Add rate limit · Cut a v2 |
| Data Stores | 12 | **Add read replica** · Cache in front · **Shard ×N** · Add search index · Archive to warehouse |
| Caching | 4 | Make it distributed · Add replica · Warm from source |
| Messaging & Streaming | 7 | Add consumer pool ×N · **Add dead-letter queue** · Partition ×N · Pin a schema |
| Edge & Traffic | 8 | **Front with CDN** · Add WAF · Route by geography · Add a health-checked pool |
| Platform & Security | 8 | Put behind auth · Add secrets manager · Add feature flags |
| Observability & Ops | 5 | **Instrument** · Add on-call · Add CI/CD |
| Analytics & ML | 6 | Add feature store · Batch → stream · Serve a model |
| Boundaries & Zones | 10 frames | Enclose in ▸ *(shipped)* · **Replicate to region** |
| Deployment & Infrastructure | 6 | Scale cluster ±nodes · Replicate to zone · Deploy an instance of… |

The bolded rows are the eight moves the scaling ladder below is made of. They
ship first; the rest are lines in the same table.

## Where it renders

Nowhere new. `Enclose` is already a pick-list that stands at a screen point,
already closes on Escape or the next press elsewhere, and is already what a
right-click on a card opens. It becomes `Menu`, and a right-clicked card gets
its own verbs over the frames it can go in:

```
┌ Orders Service ─────────────┐
│ Scale out ×3                │   ← the type's shelf, from the table
│ Put behind load balancer    │
│ Add cache                   │
│ Offload to queue            │
├─────────────────────────────┤
│ Enclose in ▸                │   ← what the menu already did
└─────────────────────────────┘
```

Right-clicking empty ground is untouched — that is still *New Boundary*, and a
selection of several cards is still *Enclose in*.

An action does not open the panel. That is the point of it: the move names its
own element off the table and the type it dropped, so the only reason to open
the panel afterwards is that you disagree — and a double-click already does
that.

## The ladder: 0 → 1,000,000 users

Eight moves, in the order a real system makes them. Each one is a rung, each one
is one press-and-pick, and each one is what the branch below it buys.

| Users | The move | Presses now | After | Branch |
| --- | --- | --- | --- | --- |
| 100 | Split the app from its database | 9 | 2 | A |
| 1,000 | A load balancer, and three of the app | 31 | 4 | B, C |
| 10,000 | Cache-aside, and static off a CDN | 26 | 4 | A, B |
| 50,000 | Two read replicas, reads split off the primary | 29 | 4 | A |
| 100,000 | Queue, worker pool, dead-letter queue | 33 | 2 | A |
| 250,000 | A search index, fed by change data capture | 26 | 2 | A |
| 500,000 | A second region, and DNS that knows about it | 85 | 3 | E |
| 1,000,000 | Instrument every service; autoscale the cluster | 66 | 4 | F |
| | **The whole walk** | **305** | **25** | |

Twelve to one, and the twenty-five that remain are the eight decisions plus
the naming.

## The branches

One per pull request, in this order. Every one of them ships something usable on
its own, and the first three are the eighty per cent.

**A — The menu learns a second half.** `Enclose` becomes `Menu`; a right-clicked
card gets its type's actions above the frames. Ships `attach` alone, and the six
rows that only need it: add database, add cache, add read replica, add search
index, offload to queue, add dead-letter queue. *≈120 lines, one new file.*

**B — `front`, the upstream insert.** The one verb with real logic: mint the new
element, re-point every edge whose `target` is the subject, wire the new one on.
Unlocks load balancer, API gateway, CDN, WAF, reverse proxy — five rows for one
function. *≈30 lines.*

**C — `fanout`, and a card that can say ×3.** `instances` is already a field;
today only Deployment carries it. Widen it to Applications and Messaging, and
draw a card with `instances` as a stack with the count in the band. Scale out,
partition, consumer pool. *≈20 lines and a rule of CSS.*

**D — `becomes`, the swap in place.** In-memory cache → distributed, batch →
stream, REST → GraphQL. Keeps id, position, parent, lines and every field the
new type still has a slot for. *≈15 lines.*

**E — `replicate`, the second region.** Deep-clone a frame and everything under
it into a sibling `Region` frame, offset to the right, and hand the copy the
same lines the original had. The largest branch, and the one that turns eighty
presses into three. *≈60 lines.*

**F — Bundles.** A row whose `run` is a list of the other three verbs. Proves
itself on *Instrument* — metrics store, log aggregator, tracing backend,
alerting, and a line from every service inside the frame — which is a table
entry and no new machinery at all. *≈10 lines.*

**G — The same menu on a key.** Select a card, press `A`, and the menu stands at
it. Deferred: the right-click is already there, and this is the rung to add when
somebody who uses this every day asks for it.

## What this deliberately does not build

- **No command palette.** The menu is on the card, where the thing you are
  acting on already is. A palette is what you build when the action has no
  subject.
- **No parameters on an action.** *Scale out ×3* is three, and the panel is
  right there when it is meant to be five. A dialog per action is eighty-three
  forms wearing a different hat.
- **No layout engine.** New elements land at a fixed offset — downstream to the
  right, sidecar below — and `nest` puts them in whatever frame the subject
  stands in. A board somebody is already arranging by hand does not want an
  autolayout that moves what they placed.
- **No templates.** *"Drop a three-tier web stack"* is the same eight moves in a
  trench coat, and it teaches nobody the ladder.
