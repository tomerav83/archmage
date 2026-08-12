import { ELEMENTS, type ElementKey, type ElementKind, GROUPS, Sigil } from './c4'
import { setDraggedKind } from './dragAndDrop'

const KINDS = Object.entries(ELEMENTS) as [ElementKey, ElementKind][]

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
        {GROUPS.map((group) => (
          <details key={group} open>
            <summary>{group}</summary>
            {/* A list, because that is what it is: the kinds this group offers. */}
            <ul className="blocks">
              {KINDS.filter(([, el]) => el.group === group).map(([key, el]) => (
                <li
                  key={key}
                  className="block"
                  style={{ '--accent': el.accent }}
                  draggable
                  onDragStart={(e) => setDraggedKind(e.dataTransfer, key)}
                >
                  <Sigil kind={el} />
                  {el.title}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </aside>
  )
}
