// The core block family's rules. "core" is a family name, not filler: each later
// family (datastores, messaging, …) adds a sibling file here and an import in review.ts.
import validator from '@rjsf/validator-ajv8'
import { EDGE_KINDS, KINDS, propsSchema } from '@/lib/catalog'
import type { Finding, Rule } from '../review'

/** A board can reference a kind this build has no catalog entry for. Say so instead of guessing. */
const unknownKinds: Rule = (b) => [
  ...b.nodes
    .filter((n) => !KINDS[n.kind])
    .map((n) => ({
      nodeId: n.id,
      severity: 'error' as const,
      title: `Unknown block type "${n.kind}"`,
      why: 'No catalog entry defines it, so its properties and rules go unchecked.',
    })),
  ...b.edges
    .filter((e) => !EDGE_KINDS[e.kind])
    .map((e) => ({
      edgeId: e.id,
      severity: 'error' as const,
      title: `Unknown connection type "${e.kind}"`,
      why: 'No catalog entry defines it, so its rules go unchecked.',
    })),
]

const danglingRefs: Rule = (b) => {
  const ids = new Set(b.nodes.map((n) => n.id))
  const out: Finding[] = []
  for (const e of b.edges)
    for (const [end, id] of [
      ['from', e.from],
      ['to', e.to],
    ] as const)
      if (!ids.has(id))
        out.push({
          edgeId: e.id,
          severity: 'error',
          title: 'Connection points at a missing object',
          why: `Its ${end} is "${id}", which is not on the board.`,
        })
  for (const n of b.nodes)
    if (n.parent && !ids.has(n.parent))
      out.push({
        nodeId: n.id,
        severity: 'error',
        title: `${n.name || n.kind} sits inside a missing parent`,
        why: `Its parent "${n.parent}" is not on the board.`,
      })
  return out
}

/** IcePanel: only a system, group or app can hold children. The inspector already
 *  restricts the "inside" picker to those, but an imported board can still say anything. */
const invalidParent: Rule = (b) => {
  const byId = new Map(b.nodes.map((n) => [n.id, n]))
  const out: Finding[] = []
  for (const n of b.nodes) {
    if (!n.parent) continue
    const parent = byId.get(n.parent)
    const spec = parent && KINDS[parent.kind]
    if (spec && !spec.holdsChildren)
      out.push({
        nodeId: n.id,
        severity: 'error',
        title: `${n.name || n.kind} sits inside a block that can't hold children`,
        why: `Its parent "${parent.name || parent.kind}" is a ${KINDS[parent.kind]?.label ?? parent.kind}, and IcePanel doesn't let that hold anything.`,
      })
  }
  return out
}

/** A prop's value must match what its kind's catalog entry declares — the same JSON
 *  Schema the inspector's form renders from. The inspector's own fields can't produce
 *  a bad value; an imported board can. Empty fields ride as null, so they're stripped
 *  rather than checked against a type that doesn't include it. */
const invalidProps: Rule = (b) => {
  const out: Finding[] = []
  const check = (
    props: Record<string, unknown>,
    spec: Parameters<typeof propsSchema>[0],
    target: { nodeId?: string; edgeId?: string },
    label: string,
  ) => {
    const data = Object.fromEntries(Object.entries(props).filter(([, v]) => v != null))
    const { errors } = validator.validateFormData(data, propsSchema(spec))
    for (const err of errors)
      out.push({
        ...target,
        severity: 'error',
        title: `Invalid "${err.property?.replace(/^[./]/, '') || label}" on ${label}`,
        why: `${err.message ?? 'does not match the catalog schema'}.`,
      })
  }
  for (const n of b.nodes) check(n.props, KINDS[n.kind], { nodeId: n.id }, n.name || n.kind)
  for (const e of b.edges) check(e.props, EDGE_KINDS[e.kind], { edgeId: e.id }, e.kind)
  return out
}

/** IcePanel: each model object must have a unique name within its scope. */
const duplicateNames: Rule = (b) => {
  const seen = new Set<string>()
  const out: Finding[] = []
  for (const n of b.nodes) {
    const name = n.name.trim()
    if (!name) continue
    const scoped = `${n.parent ?? ''}|${name.toLowerCase()}`
    if (seen.has(scoped))
      out.push({
        nodeId: n.id,
        severity: 'warn',
        title: `Duplicate name "${name}"`,
        why: 'Two objects share a name in the same scope, so a reader cannot tell which one an arrow means.',
      })
    else seen.add(scoped)
  }
  return out
}

const orphans: Rule = (b) => {
  const connected = new Set(b.edges.flatMap((e) => [e.from, e.to]))
  const containers = new Set(b.nodes.map((n) => n.parent).filter(Boolean))
  return b.nodes
    .filter((n) => !connected.has(n.id) && !containers.has(n.id))
    .map((n) => ({
      nodeId: n.id,
      severity: 'warn' as const,
      title: `${n.name || n.kind} is not connected`,
      why: 'Nothing reaches it and it reaches nothing, so its role in the design is unstated.',
    }))
}

export const rules: Rule[] = [
  unknownKinds,
  danglingRefs,
  invalidParent,
  invalidProps,
  duplicateNames,
  orphans,
]
