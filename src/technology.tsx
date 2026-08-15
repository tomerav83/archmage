import { use } from 'react'
import type { SimpleIcon } from 'simple-icons'

// What a box runs, wearing its brand. An element type says what kind of thing a
// box is; technology says what it is built from, and stays free text — the
// catalogue never enters the model, it decorates the string at render time. So
// nothing here is a field, a key or anything for a file format to migrate.

// IcePanel's thousands of entries, taken as a dependency instead of a data
// pipeline: 3,453 brands, each a title and a 24×24 path — the sigil grid. The
// type import erases at build; the module rides in its own chunk, fetched once
// behind first paint. Nothing awaits it but Suspense.
export const TECH = import('simple-icons').then((m) => {
  const marks = Object.values(m) as SimpleIcon[]
  return { marks, byTitle: new Map(marks.map((i) => [i.title.toLowerCase(), i])) }
})

// "PostgreSQL 16" wears the PostgreSQL mark: the longest leading run of words
// naming an entry, so a version rides along in the free text. Longest first, so
// "Apache Kafka consumer" finds Apache Kafka rather than Apache.
export const logoFor = (byTitle: Map<string, SimpleIcon>, value: string) => {
  const words = value.toLowerCase().split(/\s+/).filter(Boolean)
  for (let n = words.length; n > 0; n--) {
    const hit = byTitle.get(words.slice(0, n).join(' '))
    if (hit) return hit
  }
}

// The brand mark beside a technology, in whatever ink surrounds it — colour
// still belongs to the level, so the brand hex goes unread. Mount under
// <Suspense>: null until the chunk lands, null again for text the catalogue has
// no line for, which was never illegal.
export function TechLogo({ name }: { name: string }) {
  const hit = logoFor(use(TECH).byTitle, name)
  return hit ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={hit.path} fill="currentColor" />
    </svg>
  ) : null
}
