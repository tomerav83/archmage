# Roles

Draw a database, say it is Apache Cassandra, press *Add read replica*, and the
board gives you a second box you may label Redis. Every step is legal. The
result is not a system.

Nothing in the app is wrong about that line. The board checks one thing when an
edge is drawn — that a node is not joined to itself — and that permissiveness is
correct and stays: a human who draws Cassandra to Redis has made a claim, and it
may be a good one. What is wrong is that the *tool* made it. A quick action
mints the element, types it, names it, and writes the label, and then does not
open the panel. The user asserted "Cassandra". The table asserted "there is a
replica box here, and it replicates to it."

That is the test this document is built on. **Who typed the fact?** If the user
typed it, it is an opinion and the board should keep out of it. If the table
typed it, it is a claim the table has to be able to defend — and today it cannot,
because the table knows what a type is and nothing about what a type can *do*.

Five audits, one per shelf group, went through all eighty-three types and ten
frames and asked what each one really connects to. This is what they settled and
the order to build it in. It all lands before [actions.ts](../src/actions.ts),
which gets re-cut on top rather than patched.

## Five things the audits settled

**A role is a fact about a technology as often as about a type.** `relational-db`
holds PostgreSQL, which has a replica endpoint and a tappable WAL, and SQLite,
which has neither, and CockroachDB, which has neither by design. `key-value-store`
holds Redis (replica endpoint), Memcached (no replication at all) and DynamoDB
(no replica, but Streams). `timeseries-db` holds InfluxDB, which sits there, and
Prometheus, which opens connections to everything else on the board. The key a
menu reads is `(type, technology)`, and both halves already exist —
[tech.ts](../src/catalog/tech.ts) is the second half, already written, already
curated, already a compile error when a type is added without one.

**Half the candidate roleset was the shelf list wearing a hat.** Ten tags went
out; `stores-data`, `transports-messages`, `routes-traffic` and `observes` came
back carried by exactly one shelf each, which is a fact `TYPES[t].category`
already knows. A tag earns its place by *crossing* shelves and by changing what
the tool volunteers. `replicates-internally` fails a second way: it is true of
every broker and every managed store, and a tag that is always on can never fire
a menu item.

**Roles have no direction, and direction is where the errors are.** A capability
says what a thing can do, not which way the arrow points. Four of the five audits
found the same class of bug independently: `worker → message-queue` (a worker is
fed by a queue), `service → Prometheus` (Prometheus scrapes — the arrow points
the other way), `store → search-index` (nothing in Postgres writes Elasticsearch),
`worker → dead-letter-queue` (the broker moves the message, in every technology
but Kafka). Any rule the tool uses has to be a pair — what may be at each end —
never a single tag.

**Three types model a relationship as a noun.** `read-replica` and
`dead-letter-queue` have no roles of their own; each carries whatever its host
carries, which is the formal way of saying it is an edge label with a card drawn
round it. That is *why* a Redis replica of Cassandra is expressible at all. The
third, `event-bus`, survives — `routes-by-content` is a role no other type has,
and the bus decides its targets where a topic's subscribers decide for
themselves — but only once its shortlist is stripped to the three products that
actually route by content.

**Frames take no roles.** A role exists to decide what arrow to volunteer, and a
frame renders no handle, so no menu can ever volunteer one. What governs a frame
is containment, and containment wants a different axis: a *scope*, one of `org`,
`logical`, `physical`, `lifecycle`. Two rules over that axis do most of the work
— `org` holds `logical`, `lifecycle` holds `physical`, and a logical frame never
stands inside a physical one. The bridge between the two worlds is `instance`
and `instanceOf`, and both halves are already built.

## The roleset

Twelve, and every one of them names an action it gates. A role with no action to
gate is not written down yet — that is the discipline that keeps this from
becoming an ontology.

| Role | What it gates | Carried by |
| --- | --- | --- |
| `serves-requests` | can be fronted, can be called | apps, APIs via their host, stores, gateways |
| `interposes` | **may be inserted upstream** — the whole of `front` | cdn, load-balancer, reverse-proxy, api-gateway, ingress-controller, waf, service-mesh, and nothing else ever |
| `answers-lookup` | *suppresses* fronting and per-request edges | dns, service-registry, identity-provider, policy-service, config-service, feature-flag-service, secrets-manager, kms |
| `consumes-events` | the **feed** verb — the arrow points at it | worker, serverless-function, stream-processor, batch-processor |
| `triggered-by-clock` | suppresses front, load balancer, ×N | scheduled-job, batch-job, training-pipeline |
| `runs-on-user-device` | suppresses every direct store, queue and secret | single-page-app, mobile-app, desktop-app, client-cache |
| `stateless-scalable` | ×N and the `instances` field | container, web-app, api-service, worker — *not* scheduled-job, *not* serverless-function |
| `has-replica-endpoint` ⚑ | *Add read replica* | see the ground truth below |
| `emits-change-events` ⚑ | *Add CDC*, *feed a search index*, *trigger on upload* | postgres, mysql, mongo, dynamodb, s3, cassandra |
| `queues-work` · `retains-log` · `fans-out` | DLQ, consumer pool, subscriber — three tags, not one | message-queue/task-queue · event-stream · pubsub-topic/event-bus |
| `scrapes` ⚑ | which way the telemetry arrow points | prometheus, cloudwatch |
| `in-process` · `ambient` | **draw no card and no edge** | memory-cache (Caffeine), client-cache · service-mesh, secrets-manager, config-service, feature-flag-service |

⚑ resolved from `(type, technology)`, not from the type alone.

Two negatives belong on the Actors shelf and nowhere else: a `person` is `human`
— no technology, no instances, no deployment, no boundary that owns them — and a
`system` is a `black-box`, whose only legal move is to become a boundary. Every
app-shaped action skips both.

## The ground truth

Three tables the audits produced. They are the reason the roles above can be
written down at all, and they belong in the repo beside the roles they justify.

**Replication.** The test is not "does it replicate" — everything replicates. It
is *does the product expose a second thing an arrow can point at*.

| | |
| --- | --- |
| **A drawable replica** | PostgreSQL · MySQL · MariaDB · Aurora · SQL Server AG · Oracle ADG · MongoDB · DocumentDB · Redis · Valkey · Neo4j · Neptune · Timescale · pgvector |
| **Replicates, no second box** | Cassandra · ScyllaDB · Bigtable · HBase · Elasticsearch · OpenSearch · CockroachDB · etcd · Memcached · Pinecone · Qdrant · ClickHouse · every object store · every data lake |
| **Cross-region peer only** | DynamoDB Global Tables · S3 CRR · ES/OpenSearch CCR · Cassandra multi-DC · Couchbase XDCR · Snowflake · BigQuery |

The middle row is your Cassandra. The bottom row is a `region` frame move, not a
replica hanging off a primary — which is the same thing as saying it belongs to
the `replicate` verb, not to `attach`.

**The request path has an order, and `front` needs it.**

```
0  dns                 not a hop — resolved before the connection exists
1  cdn                 the outermost thing that answers; a hit never reaches origin
2  waf                 in front of, or attached to, the load balancer
3  load-balancer       the thing that owns the public IP
4  reverse-proxy | ingress-controller     one or the other, never both
5  api-gateway         auth, rate limit, contract routing
6  service-mesh        a sidecar on the callee, not a box upstream
7  the service
```

`front` as specified — mint the element, re-point every inbound edge — is
order-blind, and produces the right chain or the wrong one depending on which
row you pressed first. It must insert at the new type's **ordinal**, and it must
skip every inbound edge that is not traffic, or fronting a service with a load
balancer drags its config, secrets and metrics lines through the load balancer
too.

**Telemetry has a direction, and it is per technology.** Prometheus and
CloudWatch pull; OTLP, Datadog and every tracing backend receive a push;
Fluent Bit and Vector tail a file the app never knew about. Six strings and one
map. The fan-in of N services to one metrics box is the most-drawn wrong thing
in real diagrams and carries no information — telemetry is uniform by design,
and a uniform fact drawn N times is N lines of nothing.

## The pull requests

Nine, small, in this order. The first three delete or correct; nothing new is
built until the ground under it is true.

**1 — Delete `read-replica` and `dead-letter-queue`.** Two types, their two
`TECH` lines, their sigils. Nothing depends on them: the quick-actions table is
unreleased and the types have never been drawable from the rack in a way anybody
has a board full of. A type without a `TECH` line is already a compile error, so
the deletions travel together. *≈-50 lines.*

**2 — `tech.ts` corrections.** Pure data, no code. The systematic class first:
protocols, formats and frameworks filed as products — `MQTT`, `ONNX`,
`TensorFlow` under inference-endpoint, `OpenTelemetry` under tracing-backend,
`Grafana` under metrics-store, `Kubernetes` under compute-node *and* instance,
`Apache Kafka` under change-data-capture *and* worker, `Cloud Run` under
serverless-function, `HTMX` under single-page-app. Then the cache split, which is
one shelf written twice: `memory-cache` is in-process only, `distributed-cache`
takes Redis, Memcached, Valkey and Hazelcast. Then `event-bus` stripped to
EventBridge, Event Grid and RabbitMQ topic exchange, which is what makes it a
type again.

**3 — Say which way an arrow means.** One sentence in
[taxonomy.md](./taxonomy.md): the arrow is **data flow**, uniformly. With a
polled consumer — SQS, Kafka, Kinesis, Pub/Sub pull — who calls and where data
goes point opposite ways, and without this stated a person and a quick action
will draw the same Kafka consumer in opposite directions. `fields.ts` already
assumes it in its own hint; nothing else says it.

**4 — `roles.ts`.** The table above, one line per type beside the `TECH` line it
already has, `satisfies Record<TypeKey, Role[]>` so a new type without roles does
not compile. Data and a type, no behaviour. Its tests are the interesting part:
no type carries both `interposes` and `answers-lookup`; every `has-replica-endpoint`
type has a technology in list A; `in-process` and `ambient` types have no
outbound rows anywhere. *≈100 lines, most of them one word wide.*

**5 — The technology-conditional half.** `has-replica-endpoint`,
`emits-change-events` and `scrapes` resolved from `(type, technology)` — the A/B/C
list and the pull/push map, as data, keyed the way `TECH` is keyed. This is the
PR that answers the Cassandra question, and after it the answer is a lookup
rather than an argument.

**6 — Levels.** Ten of sixteen Edge & Platform types are declared at a level C4
does not put them at, and the load balancer is the flagship: C4 puts it in the
deployment view, which is the argument [edge.tsx](../src/catalog/edge.tsx)'s own
header already makes about the WAF. Level is the only pigment on a card, so this
one is visible and wants to ship alone.

**7 — The three missing types.** `telemetry-collector` — OTel Collector, Vector,
Fluent Bit, Datadog Agent have nowhere to go today, which forces every
agent-based architecture to draw a false edge, and it is exactly the node that
makes *Instrument* cost three edges instead of N. Then a schema registry, which
`holds-contract` currently points at with no box to land on, and a lake catalog
— Glue, Nessie, Polaris, Unity — which is the only part of a data lake that
serves a request.

**8 — Scope, and what may hold what.** The containment axis above, and the
matrix it generates. A Trust Zone may not hold a Region; a Domain holds no
physical frame at all; `region` nests in `region`, which is how an availability
zone gets drawn without a type of its own.

**9 — Re-cut `actions.ts` on the roles.** Only now. Every row states the roles
it needs at each end, `front` reads an ordinal, `attach` gains a `feed`
direction for the types whose defining relationship is inbound, and *Add search
index* mints the two nodes the pipeline actually has instead of an arrow Postgres
cannot make. The menu stops offering *Add read replica* on a Cassandra store —
not greyed, not warned about, simply not there, which is the register the `on:`
list already uses when it declines to offer a browser a database.

## What this deliberately does not build

- **No edge validation.** Not now, not with a warning badge. The freehand line
  is the half of the app that is already right, and a tool that second-guesses a
  deliberate human is one people leave.
- **No legality matrix.** Eighty-three types directed is 6,889 cells and 166
  more per type added. It would be filled `true` to stop the tool complaining,
  which is how validation dies.
- **No role the menu does not read.** Every tag above is cited by a row in step
  9. When one stops being cited, it goes.
- **No ontology.** Roles answer one question — *should the tool volunteer this?*
  — and they are wrong for anything else. Whether a Cassandra-to-Redis line is
  legitimate stays the architect's to answer.
