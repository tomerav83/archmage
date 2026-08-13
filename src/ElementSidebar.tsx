import { type ElementType, LEVELS, Sigil, TYPES, type TypeKey } from './c4'
import { setDraggedType } from './dragAndDrop'

const ROWS = Object.entries(TYPES) as [TypeKey, ElementType][]
const SECTIONS = Object.entries(LEVELS)

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
  return (
    <aside className="rail">
      <header className="rail-head">
        <BrandMark />
        <span>Archmage</span>
      </header>
      <div className="rail-body">
        {SECTIONS.map(([level, { title, accent }]) => (
          <details key={level} open>
            <summary>{title}</summary>
            {/* A list, because that is what it is: the types legal at this level. */}
            <ul className="blocks">
              {ROWS.filter(([, t]) => t.level === level).map(([key, t]) => (
                <li
                  key={key}
                  className="block"
                  style={{ '--accent': accent }}
                  draggable
                  onDragStart={(e) => setDraggedType(e.dataTransfer, key)}
                >
                  <Sigil type={t} />
                  {t.title}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </aside>
  )
}
