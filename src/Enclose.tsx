import { useEffect, useRef } from 'react'
import { FRAMES, LEVELS, Sigil, type TypeKey } from './c4'

/**
 * What a set of boxes adds up to, or what to draw next: the same picker
 * answers both. Right-click a selection and it names what you already have —
 * a boundary is nearly always drawn after the boxes it holds, so that is how
 * most of them are made, off a gesture the board already has (shift-drag
 * marquees, ctrl-click adds). Right-click empty ground and it names what you
 * are about to draw instead: DiagramCanvas takes the pick as the cue to start
 * tracking a rectangle from that same point, rather than enclosing anything.
 */
export function Enclose({
  at,
  title,
  onPick,
  onClose,
}: {
  at: { x: number; y: number } | null
  title: string
  onPick: (type: TypeKey) => void
  onClose: () => void
}) {
  const menu = useRef<HTMLDivElement>(null)

  // A popover: Escape, the next press elsewhere and standing over the board
  // are all the platform's. Shown from here because the opener is a
  // right-click, not a button popoverTarget could name — and the first row
  // takes the caret only once it is open, since focus cannot land on a
  // popover that is still shut.
  useEffect(() => {
    const el = menu.current
    if (!el) return
    el.showPopover()
    el.querySelector('button')?.focus()
  }, [at])

  if (!at) return null

  return (
    <div
      ref={menu}
      popover="auto"
      className="menu"
      style={{ left: at.x, top: at.y }}
      // Light-dismissed by the platform, so the board is told it has gone.
      onToggle={(e) => e.newState === 'closed' && onClose()}
    >
      <div className="menu-title">{title}</div>
      {FRAMES.map(([key, type]) => (
        <button
          key={key}
          type="button"
          style={{ '--accent': LEVELS[type.level].accent }}
          onClick={() => onPick(key)}
        >
          <Sigil paths={type.sigil} />
          <span>{type.title}</span>
        </button>
      ))}
    </div>
  )
}
