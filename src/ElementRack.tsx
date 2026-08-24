import { useState } from 'react'
import { LEVELS, PALETTE, Sigil } from './c4'
import { MARKS } from './catalog/marks'
import { setDraggedType } from './dragAndDrop'
import { CATEGORIES, type Category } from './fields'

// The astrolabe. Brand chrome, not an element — it never appears on a node.
function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="square"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 2.8 21.2 12 12 21.2 2.8 12Z" />
      <path d="M2.8 12h18.4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// A shelf with nothing on it is not a shelf. Boundaries & Zones never gets one
// — every type on that shelf is a frame, and a frame is drawn by right-click,
// not dragged — and Deployment gets its tab once its own mechanics land.
const SHELVES = CATEGORIES.filter((category) => PALETTE.some(([, t]) => t.category === category))

/**
 * The rack. The catalogue faced along the bottom sill, one shelf at a time —
 * devices on a board, not files in a drawer. A tab stands its shelf, the same
 * tab shuts it, and a search stands every shelf at once. A faceplate drags
 * onto the board the same as the rail's blocks ever did.
 *
 * The tabs are a device front: a mark over one word, a cell of one width each,
 * the standing one lit. What a shelf is called in the catalogue is on the
 * button's title — see catalog/marks.tsx.
 */
export function ElementRack() {
  const [query, setQuery] = useState('')
  const [shelf, setShelf] = useState<Category | null>(null)

  // Searched, it is the type's own name and nothing else — matching the shelf
  // too meant one letter of "Applications" brought back every application.
  // Unsearched, it is the standing shelf, and shut until you type: a search is
  // already a statement of what you want standing.
  const hit = query.trim().toLowerCase()
  const faced = PALETTE.filter(([, t]) =>
    hit ? t.title.toLowerCase().includes(hit) : t.category === shelf,
  )

  return (
    <aside className="rack" onKeyDown={(e) => e.key === 'Escape' && setShelf(null)}>
      <header className="rack-bar">
        <BrandMark />
        <span className="rack-name">Archmage</span>
        <nav className="rack-tabs">
          {SHELVES.map((category) => {
            const { short, mark } = MARKS[category]
            return (
              <button
                key={category}
                type="button"
                title={category}
                aria-pressed={category === shelf}
                onClick={() => setShelf(category === shelf ? null : category)}
              >
                <Sigil paths={mark} />
                {short}
              </button>
            )
          })}
        </nav>
        <input
          className="rack-search"
          type="search"
          aria-label="Search elements"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>
      {faced.length > 0 && (
        <ul className="rack-row">
          {faced.map(([key, t]) => (
            <li
              key={key}
              className="fplate"
              style={{ '--accent': LEVELS[t.level].accent, '--accent-ink': LEVELS[t.level].ink }}
              draggable
              onDragStart={(e) => setDraggedType(e.dataTransfer, key)}
              // The shelf served its drag; the board is what you look at now.
              onDragEnd={() => setShelf(null)}
            >
              <span className="fp-level">{LEVELS[t.level].title}</span>
              <Sigil paths={t.sigil} />
              <span className="fp-name">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
