import { useEffect, useRef } from 'react'
import { type Action, actionsFor } from './actions'
import { FRAMES, LEVELS, Sigil, TYPES, type TypeKey } from './c4'
import type { ElementNodeType } from './ElementNode'

/**
 * What you can do to a thing, and what you can put it in. The same picker
 * answers both, standing where the press landed.
 *
 * Right-click one card and it opens on that card's own verbs — its shelf's
 * row in `actions.ts` — with the frames it can go in under a rule. Right-click
 * a selection and there are no verbs to offer, so it names what the boxes add
 * up to: a boundary is nearly always drawn after the boxes it holds, off a
 * gesture the board already has. Right-click empty ground and it names what
 * you are about to draw instead, standing an empty frame at that same point.
 */
export function Menu({
  at,
  subject,
  title,
  onAct,
  onPick,
  onClose,
}: {
  at: { x: number; y: number } | null
  subject?: ElementNodeType
  title: string
  onAct: (action: Action) => void
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

  const actions = subject ? actionsFor(subject) : []

  return (
    <div
      ref={menu}
      popover="auto"
      className="menu"
      style={{ left: at.x, top: at.y }}
      // Light-dismissed by the platform, so the board is told it has gone.
      onToggle={(e) => e.newState === 'closed' && onClose()}
    >
      {actions.length > 0 && (
        <>
          {/* the thing being acted on, named, so the verbs have a subject */}
          <div className="menu-title">{subject?.data.label}</div>
          {actions.map((action) => (
            <button
              key={action.title}
              type="button"
              style={{ '--accent': LEVELS[TYPES[action.type].level].accent }}
              onClick={() => onAct(action)}
            >
              <Sigil paths={TYPES[action.type].sigil} />
              <span>{action.title}</span>
            </button>
          ))}
          <hr />
        </>
      )}
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
