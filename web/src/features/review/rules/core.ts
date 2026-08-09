// The core block family's rules. "core" is a family name, not filler: each later
// family (datastores, messaging, …) adds a sibling file here and an import in review.ts.
import { EDGE_KINDS, KINDS } from '@/lib/catalog'
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

export const rules: Rule[] = [unknownKinds, danglingRefs, duplicateNames, orphans]
