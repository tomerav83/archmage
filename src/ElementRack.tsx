import { useState } from 'react'
import { LEVELS, Sigil, TYPES } from './c4'
import { setDraggedType } from './dragAndDrop'
import { CATEGORIES, type Category } from './fields'
import { useSearch } from './useSearch'

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

// A shelf with nothing on it is not a shelf: Boundaries and Deployment get
// their tabs when their mechanics land.
const SHELVES = CATEGORIES.filter((category) =>
  Object.values(TYPES).some((t) => t.category === category),
)

/**
 * The rack. The catalogue faced along the bottom sill, one shelf at a time —
 * devices on a board, not files in a drawer. A tab stands its shelf, the same
 * tab shuts it, and a search stands every shelf at once. A faceplate drags
 * onto the board the same as the rail's blocks ever did.
 */
export function ElementRack() {
  const { found, open, box } = useSearch()
  const [shelf, setShelf] = useState<Category | null>(null)

  const faced = open ? found : found.filter(([, t]) => t.category === shelf)

  return (
    <aside className="rack" onKeyDown={(e) => e.key === 'Escape' && setShelf(null)}>
      <header className="rack-bar">
        <BrandMark />
        <span className="rack-name">Archmage</span>
        <nav className="rack-tabs">
          {SHELVES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={category === shelf}
              onClick={() => setShelf(category === shelf ? null : category)}
            >
              {category}
            </button>
          ))}
        </nav>
        {box}
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
              <Sigil type={t} />
              <span className="fp-name">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
