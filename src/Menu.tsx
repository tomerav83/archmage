import { type ReactNode, useEffect, useRef } from 'react'
import { type Action, actionsFor } from './actions'
import { FRAMES, LEVELS, Sigil, TYPES, type TypeKey } from './c4'
import type { ElementNodeType } from './ElementNode'

/**
 * The two menus a right-click opens. They stand the same way and share nothing
 * else: one names what boxes add up to, the other what to do to one box.
 */

// Escape, the next press elsewhere and standing over the board are all the
// platform's. Shown from here because the opener is a right-click, not a button
// popoverTarget could name — and the first row takes the caret only once it is
// open, since focus cannot land on a popover that is still shut.
function Standing({
  at,
  onClose,
  children,
}: {
  at: { x: number; y: number }
  onClose: () => void
  children: ReactNode
}) {
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = menu.current
    if (!el) return
    el.showPopover()
    el.querySelector('button')?.focus()
  }, [])

  return (
    <div
      ref={menu}
      popover="auto"
      className="menu"
      style={{ left: at.x, top: at.y }}
      // Light-dismissed by the platform, so the board is told it has gone.
      onToggle={(e) => e.newState === 'closed' && onClose()}
    >
      {children}
    </div>
  )
}

// Both menus offer the same row: the mark of the thing that will land, in the
// ink of the level it lands at.
function Row({ type, title, onClick }: { type: TypeKey; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      style={{ '--accent': LEVELS[TYPES[type].level].accent }}
      onClick={onClick}
    >
      <Sigil paths={TYPES[type].sigil} />
      <span>{title}</span>
    </button>
  )
}

/**
 * What a set of boxes adds up to, or what to draw next: the same picker answers
 * both. A boundary is nearly always drawn after the boxes it holds, so that is
 * how most of them are made, off a gesture the board already has (shift-drag
 * marquees, ctrl-click adds). Right-click empty ground and it names what you
 * are about to draw instead: DiagramCanvas takes the pick as the cue to stand
 * an empty frame at that same point, rather than enclosing anything.
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
  if (!at) return null

  return (
    <Standing at={at} onClose={onClose}>
      <div className="menu-title">{title}</div>
      {FRAMES.map(([key, type]) => (
        <Row key={key} type={key} title={type.title} onClick={() => onPick(key)} />
      ))}
    </Standing>
  )
}

/**
 * What you can do to the one card you right-clicked, off the table in
 * actions.ts. A move drops its element and draws the line described, so it does
 * not open the panel: the only reason to open it afterwards is that you
 * disagree, and a double-click already does that.
 */
export function Actions({
  at,
  subject,
  onAct,
  onClose,
}: {
  at: { x: number; y: number }
  subject: ElementNodeType
  onAct: (action: Action) => void
  onClose: () => void
}) {
  return (
    <Standing at={at} onClose={onClose}>
      <div className="menu-title">{subject.data.label}</div>
      {actionsFor(subject.data.type).map((action) => (
        <Row
          key={action.title}
          type={action.type}
          title={action.title}
          onClick={() => onAct(action)}
        />
      ))}
    </Standing>
  )
}
