import { ICONS, KINDS, type Base } from '@/lib/catalog'

const PALETTE_ORDER: Base[] = ['actor', 'system', 'group', 'app', 'store', 'component']

/** The drag payload a chip writes and the canvas reads. One name, because a typo on
 *  either side would just look like a drop that silently did nothing. */
export const DRAG_KEY = 'application/archmage-kind'

/** Chips are buttons, not draggable divs: dragging one is the quick way to place it,
 *  clicking or pressing Enter drops it in the middle of the view. */
export function Palette({ onAdd }: { onAdd: (kind: string) => void }) {
  return (
    <aside className="palette" aria-label="Block palette">
      {PALETTE_ORDER.map((base) => {
        const kinds = Object.values(KINDS).filter((k) => k.base === base)
        return kinds.length === 0 ? null : (
          <section key={base}>
            <h2>{base}</h2>
            {kinds.map((k) => {
              const Glyph = k.icon ? ICONS[k.icon] : undefined
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
