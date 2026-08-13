import { LEVELS, Sigil } from './c4'
import { setDraggedType } from './dragAndDrop'
import { CATEGORIES } from './fields'
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

export function ElementSidebar() {
  const { found, open, box } = useSearch()

  return (
    <aside className="rail">
      <header className="rail-head">
        <BrandMark />
        <span>Archmage</span>
      </header>
      {box}
      <div className="rail-body">
        {CATEGORIES.map((category) => {
          const rows = found.filter(([, t]) => t.category === category)
          // A shelf with nothing on it is not a shelf.
          if (!rows.length) return null
          return (
            <details key={category} open={open}>
              <summary>{category}</summary>
              {/* A list, because that is what it is: the types on this shelf. */}
              <ul className="blocks">
                {rows.map(([key, t]) => (
                  <li
                    key={key}
                    className="block"
                    style={{ '--accent': LEVELS[t.level].accent }}
                    draggable
                    onDragStart={(e) => setDraggedType(e.dataTransfer, key)}
                  >
                    <Sigil type={t} />
                    {t.title}
                  </li>
                ))}
              </ul>
            </details>
          )
        })}
      </div>
    </aside>
  )
}
