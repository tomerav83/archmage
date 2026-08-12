import { BrandMark } from './BrandMark'
import { ELEMENTS, GROUPS, Sigil, type ElementKey, type ElementKind } from '../../c4'
import { setDraggedKind } from './dragAndDrop'

const KINDS = Object.entries(ELEMENTS) as [ElementKey, ElementKind][]

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
