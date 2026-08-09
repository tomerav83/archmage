// The rules that read a board and say what is wrong with it. The board's shape comes
// from shared code, so this feature never names the board feature at all.
import type { Board, Severity } from '@/lib/board'

export type Finding = { nodeId?: string; edgeId?: string; severity: Severity; title: string; why: string }
export type Rule = (b: Board) => Finding[]

/** Content-derived and stable across a re-review, so a list row keeps its identity. */
export const findingKey = (f: Finding) => `${f.nodeId ?? ''}|${f.edgeId ?? ''}|${f.title}|${f.why}`

// One file per rule family, merged here. Adding a family is adding a file.
const RULES: Rule[] = Object.values(
  import.meta.glob<{ rules?: Rule[] }>('./rules/*.ts', { eager: true }),
).flatMap((m) => m.rules ?? [])

const WORST_FIRST: Record<Severity, number> = { error: 0, warn: 1 }

export const review = (b: Board): Finding[] =>
  RULES.flatMap((r) => r(b)).sort((a, z) => WORST_FIRST[a.severity] - WORST_FIRST[z.severity])
