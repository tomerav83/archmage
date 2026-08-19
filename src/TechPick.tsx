import { type Ref, Suspense, useState } from 'react'
import { TechLogo } from './technology'

// The technology row: what this type is actually built from, offered as a list
// rather than a blank line. A Relational Database offers Postgres and MySQL,
// not the brand set's other 3,451 entries — the type is what narrows it, which
// is the one thing the brand set cannot do for us. See catalog/tech.ts.

// There is no line for free text on purpose. A product the shortlist does not
// hold is a product the registry does not know, and the fix is a line in
// catalog/tech.ts — which is what keeps every technology on the board a
// canonical name, for the eye now and for whatever reads the file later.

export function TechPick({
  caret,
  title,
  options,
  value,
  write,
}: {
  caret: Ref<HTMLInputElement>
  title: string
  options: string[]
  value: string
  write: (v: string) => void
}) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)

  const hits = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()))
  const at = Math.min(active, hits.length - 1)
  // Undefined exactly when the search has narrowed the shelf to nothing, which
  // is also when there is nothing for a key to do.
  const standing = hits[at]

  return (
    <>
      <input
        ref={caret}
        // The row's own engraved title, said again: the wrapping label holds a
        // list and a note as well as this box, and a field's name must not
        // wander when one of them appears.
        aria-label={title}
        placeholder="Search"
        value={q}
        onChange={(e) => {
          setActive(0)
          setQ(e.target.value)
        }}
        onKeyDown={(e) => {
          if (!standing) return
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((at + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length)
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            write(standing)
          }
        }}
      />
      {/* Plain buttons rather than a listbox of options: every row is then
          reachable by Tab and named by its own text, and the arrows below are
          the fast path over it rather than the only way in. */}
      <ul className="tech-list">
        {hits.map((title, i) => (
          <li key={title} data-active={i === at || undefined}>
            <button type="button" aria-pressed={title === value} onClick={() => write(title)}>
              <Suspense>
                <TechLogo name={title} />
              </Suspense>
              <span>{title}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* Where the policy is said, at the one moment anybody needs it. */}
      {!hits.length && <p className="tech-none">Not in the registry — add it to catalog/tech.ts</p>}
    </>
  )
}
