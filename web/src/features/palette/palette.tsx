import { DRAG_KEY } from '@/lib/board-types'
import { BASES, KINDS } from '@/lib/catalog'
import './palette.css'

/** Chips are buttons, not draggable divs: dragging one is the quick way to place it,
 *  clicking or pressing Enter drops it in the middle of the view. */
export function Palette({ onAdd }: { onAdd: (kind: string) => void }) {
  return (
    <aside className="palette" aria-label="Block palette">
      {BASES.map((base) => {
        const kinds = Object.values(KINDS).filter((k) => k.base === base)
        return kinds.length === 0 ? null : (
          <section key={base}>
            <h2>{base}</h2>
            {kinds.map((k) => {
              const Glyph = k.icon
              return (
                <button
                  key={k.kind}
                  type="button"
                  className="chip"
                  data-base={k.base}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_KEY, k.kind)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => onAdd(k.kind)}
                >
                  {Glyph ? <Glyph className="icon" aria-hidden /> : null}
                  {k.label}
                </button>
              )
            })}
          </section>
        )
      })}
    </aside>
  )
}
