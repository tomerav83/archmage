// The rules that read a board and say what is wrong with it. The board's shape comes
// from shared code, so this feature never names the board feature at all.
import type { Board, Severity } from '@/lib/board-types'
import { rules as core } from './rules/core'

export type Finding = { nodeId?: string; edgeId?: string; severity: Severity; title: string; why: string }
export type Rule = (b: Board) => Finding[]

/** Content-derived and stable across a re-review, so a list row keeps its identity. */
export const findingKey = (f: Finding) => `${f.nodeId ?? ''}|${f.edgeId ?? ''}|${f.title}|${f.why}`

// One file per rule family; a new family is a new import on this list.
const RULES: Rule[] = [...core]

const WORST_FIRST: Record<Severity, number> = { error: 0, warn: 1 }

export const review = (b: Board): Finding[] =>
  RULES.flatMap((r) => r(b)).sort((a, z) => WORST_FIRST[a.severity] - WORST_FIRST[z.severity])

/** Worst severity per node, for flagging blocks on the canvas — findings arrive
 *  worst-first, so the first hit per node wins. Null prototype: node ids come from an
 *  imported board, and one named "__proto__" or "toString" has to miss rather than
 *  hand back something off Object.prototype. */
export const worstPerNode = (findings: Finding[]): Record<string, Severity> => {
  const worst: Record<string, Severity> = Object.create(null)
  for (const f of findings) if (f.nodeId && !worst[f.nodeId]) worst[f.nodeId] = f.severity
  return worst
}
