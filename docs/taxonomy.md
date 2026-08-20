# Element taxonomy

Archmage ships four element kinds: person, system, container, component. That
draws a C4 sketch. It cannot draw a Redis cache behind an API gateway, which is
what anyone actually wants to draw.

This is the catalog that closes the gap and the order the branches land in. Each
stage below is one branch on the one above and one pull request. Read your
stage; the catalog tables are the source rows to copy from.

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
a `technology` string on a Relational Database. That one decision is what makes
82 types tractable instead of an icon-pack treadmill with no end.

```
level       : context | container | component | deployment    zoom
type        : relational-db | cache | api-gateway | …         82 values
technology  : "PostgreSQL 16"                                 free text
external    : boolean                                         not a type
```

So `ELEMENTS` in `c4.tsx` becomes two tables. `LEVELS` is small and carries
pigment. `TYPES` is large and carries sigil, label, category, and which levels
the type is legal at. Colour comes from the level, the sigil from the type.
Eighty-two accent colours would be mud; twelve category pigments with
eighty-two marks stay legible, and the file's promise — to add a kind, add a
line here — survives.

## Two gaps make the catalog inert

`DiagramCanvas.tsx` sets `label` to the kind's own title at drop time and
`ElementNode.tsx` renders it in a plain div. There is no rename. Add all 82
types today and the board reads *Cache · Cache · Cache*, and `technology` has
nowhere to live.

`addEdge` is called with no label. A line from Orders Service to Kafka cannot
say *publishes OrderPlaced*, and cannot tell a synchronous gRPC call from an
async event. Half the catalog's meaning lives on the edges.

Identity and relationships come first. Everything after them is a table edit.

## The catalog

Twelve categories, 82 types. Levels: Ctx context, Cnt container, Cmp component,
Dep deployment. Technology examples are illustrative values for the free-text
field, never an enum.

### Actors & Externals (3)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Person | Ctx | Customer, support agent, admin |
| External Person | Ctx | Regulator, partner staff, auditor |
| External System | Ctx | Stripe, Salesforce, HMRC |

### Applications (9)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Web Application | Cnt | Rails, Django, Next.js SSR |
| Single-Page App | Cnt | React, Vue, SvelteKit |
| Mobile App | Cnt | Swift, Kotlin, React Native |
| Desktop App | Cnt | Electron, Tauri |
| API Service | Cnt, Cmp | Go, Spring Boot, FastAPI |
| Serverless Function | Cnt | Lambda, Cloud Run, Workers |
| Worker / Consumer | Cnt | Sidekiq, Celery, Kafka consumer |
| Scheduled Job | Cnt | cron, EventBridge Scheduler |
| Batch / ETL Job | Cnt | Spark, dbt, AWS Glue |

### APIs & Contracts (8)

The interface, modelled apart from whatever serves it — Backstage makes `API` a
first-class kind for the same reason.

| Type | Levels | Technology examples |
| --- | --- | --- |
| REST API | Cnt, Cmp | OpenAPI 3, JSON over HTTPS |
| GraphQL API | Cnt, Cmp | Apollo, Hasura, federation |
| gRPC Service | Cnt, Cmp | Protobuf, HTTP/2 |
| WebSocket Channel | Cnt | Socket.IO, Phoenix Channels |
| Webhook | Cnt | Outbound HTTP callback, Svix |
| Server-Sent Events | Cnt | text/event-stream |
| SOAP Service | Cnt | WSDL, XML — legacy integration |
| Event Contract | Cnt, Cmp | AsyncAPI, Avro, Schema Registry |

### Data Stores (12)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Relational Database | Cnt | PostgreSQL, MySQL, SQL Server |
| Document Database | Cnt | MongoDB, Couchbase, Firestore |
| Key-Value Store | Cnt | Redis, DynamoDB, etcd |
| Wide-Column Store | Cnt | Cassandra, Bigtable, ScyllaDB |
| Graph Database | Cnt | Neo4j, Neptune |
| Time-Series Database | Cnt | InfluxDB, TimescaleDB |
| Vector Database | Cnt | pgvector, Pinecone, Qdrant |
| Search Index | Cnt | Elasticsearch, OpenSearch, Typesense |
| Blob / Object Store | Cnt | S3, GCS, Azure Blob |
| File System | Cnt, Dep | NFS, EFS, mounted volume |
| Data Warehouse | Cnt | Snowflake, BigQuery, Redshift |
| Data Lake | Cnt | S3 + Iceberg, Delta Lake |

### Caching (4)

Only what is a box on a diagram. Write-through and cache-aside are strategies,
not elements, and belong in a description.

| Type | Levels | Technology examples |
| --- | --- | --- |
| In-Memory Cache | Cnt | Redis, Memcached |
| Distributed Cache | Cnt, Dep | Redis Cluster, Hazelcast |
| Client Cache | Cnt, Cmp | Browser cache, SWR, service worker |
| Read Replica | Cnt, Dep | Postgres replica, Aurora reader |

### Messaging & Streaming (7)

C4-PlantUML has one Queue stereotype for all of this. Real systems need seven.

| Type | Levels | Technology examples |
| --- | --- | --- |
| Message Queue | Cnt | SQS, RabbitMQ |
| Pub/Sub Topic | Cnt | SNS, Google Pub/Sub |
| Event Stream | Cnt | Kafka, Kinesis, Redpanda |
| Event Bus | Cnt | EventBridge, NATS |
| Task Queue | Cnt | Celery, BullMQ, Temporal |
| Dead-Letter Queue | Cnt | SQS DLQ, Kafka DLT |
| Change Data Capture | Cnt, Cmp | Debezium, logical replication |

### Edge & Traffic (8)

The front door, in the order a request meets it: client, CDN, load balancer,
gateway, mesh, service.

| Type | Levels | Technology examples |
| --- | --- | --- |
| DNS | Cnt, Dep | Route 53, Cloudflare DNS |
| CDN | Cnt, Dep | CloudFront, Cloudflare, Fastly |
| Load Balancer | Cnt, Dep | ALB, NLB, HAProxy — L4 or L7 |
| Reverse Proxy | Cnt, Dep | nginx, Envoy, Traefik |
| API Gateway | Cnt | Kong, AWS API Gateway, Apigee |
| Service Mesh | Cnt, Dep | Istio, Linkerd, Consul Connect |
| WAF / Firewall | Dep | Cloudflare WAF, AWS WAF |
| Ingress Controller | Cnt, Dep | nginx-ingress, Gateway API |

### Platform & Security (8)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Identity Provider | Ctx, Cnt | Okta, Auth0, Entra ID |
| Auth / Session Service | Cnt, Cmp | Keycloak, custom OIDC |
| Secrets Manager | Cnt, Dep | Vault, AWS Secrets Manager |
| KMS / Certificates | Cnt, Dep | AWS KMS, cert-manager, ACM |
| Policy / AuthZ Service | Cnt, Cmp | OPA, Cedar, SpiceDB |
| Service Registry | Cnt, Dep | Consul, Eureka, Kubernetes DNS |
| Config Service | Cnt | Consul KV, AppConfig |
| Feature Flag Service | Cnt | LaunchDarkly, Unleash |

### Observability & Ops (5)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Metrics Store | Cnt | Prometheus, Datadog |
| Log Aggregator | Cnt | Loki, Splunk, CloudWatch Logs |
| Tracing Backend | Cnt | Jaeger, Tempo, OTel Collector |
| Alerting / On-call | Cnt | PagerDuty, Alertmanager |
| CI/CD Pipeline | Cnt, Dep | GitHub Actions, Argo CD |

### Analytics & ML (6)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Stream Processor | Cnt | Flink, Kafka Streams, Materialize |
| Batch Processor | Cnt | Spark, dbt |
| Inference Endpoint | Cnt | SageMaker, Triton, vLLM |
| Training Pipeline | Cnt | Kubeflow, Vertex AI |
| Feature Store | Cnt | Feast, Tecton |
| LLM / AI Service | Ctx, Cnt | Claude API, Bedrock, Ollama |

### Boundaries & Zones (6)

These contain other elements. A new mechanic, not a new sigil.

| Type | Levels | Contains |
| --- | --- | --- |
| Enterprise Boundary | Ctx | Systems and people inside the org |
| System Boundary | Cnt | The containers of one system |
| Container Boundary | Cmp | The components of one container |
| Domain / Bounded Context | Ctx, Cnt | A business vertical's systems |
| Trust Zone | Dep | VPC, subnet, DMZ, air-gapped net |
| Team / Ownership Group | Ctx, Cnt, Cmp | Anything one team owns |

### Deployment & Infrastructure (6)

| Type | Levels | Technology examples |
| --- | --- | --- |
| Deployment Environment | Dep | Production, staging, development |
| Region / Zone | Dep | us-east-1, eu-west-1a |
| Cluster / Orchestrator | Dep | EKS, ECS, Nomad |
| Compute Node | Dep | EC2 instance, pod, bare metal |
| Infrastructure Node | Dep | A deployed LB, firewall or DNS |
| Instance | Dep | A container or system, deployed here |

## The stack

Nineteen branches, each on the one above, each a pull request.

### Phase A — foundations

Make one node worth naming, then give the elements and the lines between them
the fields they carry.

**1. `feature/element-identity`**
Double-click to rename a node. Add `technology` to node data, set in mono under
the name. The band reads *level · type*.
Done when a node can be named and given a technology, both survive a re-render,
and a test covers the rename.
Touches `ElementNode.tsx`, `DiagramCanvas.tsx`, `index.css`.

**2. `feature/taxonomy-model`**
Split `ELEMENTS` into `LEVELS` and `TYPES`. Add `category`, `levels[]` and the
`external` flag. Migrate the existing four kinds and the three Actors. No new
types — a pure reshape, so the diff stays reviewable.
Done when the four existing kinds render unchanged off the new tables and
`dragAndDrop` still rejects a key that is not a type.
Touches `c4.tsx`, `ElementNode.tsx`, `ElementSidebar.tsx`, `dragAndDrop.ts`.

**3. `feature/element-form`**
A rail on the right, opening on a drop and on a double-click, carrying the
fields a type actually has — a person a role, a cache a TTL, a boundary
neither. One table of field descriptors, one renderer, no form per type. Lands
on the branch above because the table is keyed by category, and takes the fields
off the card that branch 1 put there. See [form.md](form.md).
Done when dropping an element opens the panel with the caret in its name, and a
category's fields are one line to change.
Touches a new `ElementForm.tsx` and `fields.ts`, `ElementNode.tsx`,
`DiagramCanvas.tsx`, `index.css`.

**4. `feature/relationship-detail`**
Edge label and protocol text. Dashed for async, solid for sync. An edge carries
the same handful of fields an element does — description, technology, tags, link
in both Structurizr and C4-PlantUML — so it is edited in the panel above rather
than in an editor of its own. That is why it follows the form instead of
opening Phase A.
Done when an edge carries a label and a protocol, async draws dashed, and a test
covers the sync/async split.
Touches `DiagramCanvas.tsx`, a new `RelationshipEdge.tsx`, `ElementForm.tsx`,
`index.css`.

**5. `feature/palette-search`**
A search box and collapsed-by-default categories in the rail. Twelve sections
holding 82 items is unusable without it, and it has to exist before the batches
rather than after.
Done when typing "cache" in the rail narrows to the four caching types.
Touches `ElementSidebar.tsx`, `index.css`.

### Phase B — the catalog

Seven batches. Every one of them touches `c4.tsx` and nothing else but its
sigils, so they are independent of each other and the order is negotiable. Data
and messaging go first because they are what you reach for when you test-draw a
real system.

| Branch | Types | Rows |
| --- | --- | --- |
| `feature/types-data` | 16 | Data Stores + Caching |
| `feature/types-messaging` | 7 | Messaging & Streaming |
| `feature/types-edge` | 8 | Edge & Traffic |
| `feature/types-compute` | 9 | Applications |
| `feature/types-api` | 8 | APIs & Contracts |
| `feature/types-platform` | 13 | Platform & Security + Observability & Ops |
| `feature/types-analytics` | 6 | Analytics & ML |

Each is done when every row of its table is draggable onto the canvas and its
sigil reads at 13px beside 8px engraved type.

The real cost here is art, not code — 67 marks on the existing 24-unit grid at
1.4 stroke, matched to the four that exist. The registry lines are trivial. Two
ways out if it drags: draw one mark per category and let the type read as text
in the band, or ship placeholders and refine in a later pass. Both keep the
branches moving and neither changes the model.

### Phase C — the technology catalog

What a box runs, wearing its brand. The out-of-scope list held this on the
argument that thousands of entries are a data pipeline; the pipeline turned
out to be a dependency — `simple-icons`, 3,453 brands, CC0, released weekly,
every mark on the 24-unit sigil grid. `technology` stays a free string and the
catalog decorates it at render time, so the model, the drop and the file
format never learn it exists. See [technology.md](technology.md).

**13. `feature/technology-logos`**
The dependency, the match, the mark. "PostgreSQL 16" finds the PostgreSQL
mark by the longest leading run of words naming an entry, and the card's
subtitle wears it in the surrounding ink — colour stays the level's. Text the
catalog has no line for stays legal and goes unmarked, until the branch below
hands it two engraved letters instead. The module rides in its own lazy chunk
behind first paint, 2.1 MB gzipped, cached after.
Done when a hand-typed "PostgreSQL 16" puts the elephant on the card and a
test covers the version-stripping match with the module mocked.
Touches a new `technology.tsx`, `ElementNode.tsx`, `index.css`.

**14. `feature/technology-picker`**
The technology row stops being a blank line and becomes the shortlist for the
type you dropped — a Relational Database offers Postgres and MySQL, wearing
their marks, with a search box over them and no free-text line at all: a
product the shortlist does not hold is one the registry does not know, and the
panel says so. That keeps every technology on the board a canonical name, which
is what the field is worth to anything that reads the file later. The shortlist
is the one thing the brand set cannot supply, so it is curated per type in
`catalog/tech.ts`; one flag on the shared Technology descriptor arms every
category that carries the field, and the edge's protocol line is its own object
and stays plain text. Four products in ten have no brand mark and none is
coming, so those wear two engraved letters in the same slot — the column reads
as marks all the way down and the model still holds only the name.
Done when a dropped Relational Database offers PostgreSQL and not Pinecone,
"sql" narrows the list, a search that matches nothing says where to add it, and
Redpanda reaches the card wearing Re.
Touches a new `catalog/tech.ts` and `TechPick.tsx`, `technology.tsx`,
`fields.ts`, `Form.tsx`, `index.css`.

### Phase D — nesting

Twelve types are not boxes on the board but the board under other boxes, and
they are the last thing in the stack that is interaction work rather than a
table. React Flow's `parentId` carries the whole of it: a child's position goes
parent-relative, `extent: 'parent'` clips, and depth sorts out z on its own.
What it does not carry is the reparenting — nothing adopts anything by itself —
so the two branches that matter here are the frame and the mechanic, and the
two after them are tables riding on it. See [nesting.md](nesting.md).

**15. `feature/boundaries`**
The frame itself. Enterprise, system, container, domain, trust zone, team — a
band, a floor and a `NodeResizer`, with no subtitle, no handles and no ward. A
`frame` flag on the registry line says which types render this way; node data
is the element's, so the rail edits a boundary off the same table it edits
everything else.
Done when a System Boundary lands on the board, takes a name from the rail and
resizes.
Touches a new `catalog/boundaries.tsx` and `BoundaryNode.tsx`, `c4.tsx`,
`ElementNode.tsx`, `DiagramCanvas.tsx`, `index.css`.

**16. `feature/nesting`**
The mechanic, and the two gestures that reach for it, both off a right-click
and a dropdown rather than a trip to the rack. Select what belongs together
with the board's own marquee, right-click the selection, and say what it adds
up to — a frame appears at its bounds and takes it. Or right-click empty
ground first, pick a kind, and press-drag-release a rectangle from that same
point — a frame appears at exactly what was drawn, holding whatever's middle
fell inside it, live as the rectangle grows. Dragging into a frame and out of
one does the same work a card at a time, and a drop from the rack lands in
whatever frame is under the cursor. The hit test, the rebased position and the
parents-before-children sort are one pure module, which is also where the
tests go. Nothing is clipped: React Flow's `extent` would cage a card in the
frame it was put in. It carries two fixes with it — `faces()` reads
`position`, which stops meaning board coordinates the moment anything is
nested, and a panel opened by a drop asking for the caret mid-drag, where a
browser both ignores the focus and, once asked a task later instead, scrolls
the whole board sideways to reach a panel still off-screen at
`translateX(100%)`.
Done when two selected cards enclose into a named system boundary and travel
with it, a rectangle drawn over two more cards makes a second one that leaves
a third card outside it, a card dragged in joins either and dragged out
leaves, and an edge out of a nested card still leaves the right flank.
Touches a new `nesting.ts` and `Enclose.tsx`, `DiagramCanvas.tsx`, `Form.tsx`,
`index.css`.

**17. `feature/deployment-view`**
The fourth and last level, and the twelfth shelf: environments, regions,
clusters and compute nodes are frames, infrastructure nodes and instances are
cards. `LEVELS` takes its fourth pigment, `tech.ts` takes twelve lines, and WAF
/ Firewall and Trust Zone move to the level the catalogue always gave them.
Nesting is inherited, not reinvented.
Done when a compute node sits in a cluster sits in a region.
Touches a new `catalog/deployment.tsx`, `c4.tsx`, `catalog/tech.ts`,
`catalog/edge.tsx`.

**18. `feature/instance-of`**
The one reference the model gains: an Instance says which container it is. The
first field whose options are the board rather than the registry, stamped in
`ElementForm` the way the technology shortlist is stamped by type. It stores
the name, so every field on a node is still a string.
Done when an Instance in a cluster offers the containers on the board and takes
one.
Touches `fields.ts`, `ElementForm.tsx`.

### Phase E — persistence

**19. `feature/persistence`**
Save to localStorage, import and export JSON. Last, because it is the only
branch that has to know the whole schema and nesting is what finishes it:
nesting gives a node a parent and the deployment branches give it an instance-of,
and a file format written before those is a file format migrated after them.
Everything between here and Phase A only adds values to a string union or
paint the file never carries.
Done when a diagram survives a reload and round-trips through export/import,
parents and all.
Touches `DiagramCanvas.tsx`, a new `model.ts`.

## Out of scope

**Vendor icon packs.** 500 AWS icons, 200 Azure icons. `technology` already
carries "PostgreSQL 16"; an icon per vendor buys recognition at the price of a
permanent treadmill. Structurizr solves this with themes mapping tags to icons.
If it is wanted later it is a theme layer, never element types. Phase C's
brand marks are that layer for products, taken as a dependency; a cloud's own
service iconography stays out — and since 2024, out of the dataset as well.

**Code and level-4 diagrams.** IcePanel dropped them and points at source
instead. Nobody hand-maintains a class diagram.

**Dynamic and sequence views.** Numbered interaction steps are a different
editor with a different interaction model, not a taxonomy problem.

**Per-type accent colours.** Eighty-two pigments is mud. Colour carries the
level, the sigil carries the type, the band carries both as text.

## Sources

- [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) — stereotypes, boundaries, deployment macros
- [Structurizr DSL](https://docs.structurizr.com/dsl/language) and [themes](https://docs.structurizr.com/ui/diagrams/themes) — technology as free text, tags as icons
- [IcePanel modelling](https://docs.icepanel.io/core-features/modelling) — actor/group/system/app/store/component, internal vs external, status
- [Backstage descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/) — kind vs. spec.type, API as a first-class kind
- [System Design Primer](https://github.com/donnemartin/system-design-primer) — DNS, CDN, load balancer, proxy, cache, asynchronism
- [CNCF Landscape](https://landscape.cncf.io/) — streaming and messaging, service mesh, API gateway, observability
- [simple-icons](https://simpleicons.org) — 3,453 CC0 brand marks on a 24-unit grid, the technology catalog as a dependency
