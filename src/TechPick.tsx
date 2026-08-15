import { type Ref, Suspense, useState } from 'react'
import { TechLogo } from './technology'

// The technology row: what this type is actually built from, offered as a list
// rather than a blank line. A Relational Database offers Postgres and MySQL,
// not the brand set's other 3,451 entries — the type is what narrows it, which
// is the one thing the brand set cannot do for us. See catalog/tech.ts.

// The list is the answer nine times out of ten; the search box is for the long
// shelves and the last row is for everything nobody wrote down.
export const OTHER = 'Other…'

export function TechPick({
  caret,
  options,
  value,
  write,
}: {
  caret: Ref<HTMLInputElement>
  options: string[]
  value: string
  write: (v: string) => void
}) {
  const [q, setQ] = useState('')
  // A value the list does not hold was written by hand, so the hand-written
  // line is already open when you come back to it. Derived on mount and kept
  // by hand after, because clicking Other on an empty field has to open it too.
  const [other, setOther] = useState(!!value && !options.includes(value))
  const [active, setActive] = useState(0)

  const hits = [...options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase())), OTHER]
  const at = Math.min(active, hits.length - 1)

  const take = (pick: string) => {
    setOther(pick === OTHER)
    // Other keeps whatever was there to be edited; a product replaces it.
    if (pick !== OTHER) write(pick)
  }

  return (
    <>
      <input
        ref={caret}
        // Named by the row's own engraved title: this is the Technology field,
        // and the box at the top of it is how you get through a long shelf.
        placeholder="Search"
        value={q}
        onChange={(e) => {
          setActive(0)
          setQ(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((at + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length)
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            // hits always holds Other, so the fallback is the row itself.
            take(hits[at] ?? OTHER)
          }
        }}
      />
      {/* Plain buttons rather than a listbox of options: every row is then
          reachable by Tab and named by its own text, and the arrows below are
          the fast path over it rather than the only way in. */}
      <ul className="tech-list">
        {hits.map((title, i) => (
          <li key={title} data-active={i === at || undefined}>
            <button
              type="button"
              aria-pressed={title === OTHER ? other : title === value}
              onClick={() => take(title)}
            >
              <Suspense>
                <TechLogo name={title} />
              </Suspense>
              <span>{title}</span>
            </button>
          </li>
        ))}
      </ul>
      {other && (
        <input
          className="tech-other"
          // Chosen from the list, so it takes the caret the way an opened row does.
          ref={(el) => el?.focus()}
          aria-label="Other technology"
          placeholder="What it runs"
          value={value}
          onChange={(e) => write(e.target.value)}
        />
      )}
    </>
  )
}
