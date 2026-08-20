import { useEffect, useRef } from 'react'
import { type ElementType, LEVELS, Sigil, TYPES, type TypeKey } from './c4'

// Every type that holds other elements, in catalogue order. The deployment
// frames join this list by landing in the registry with a frame flag on them,
// not by being named here.
const FRAMES = (Object.entries(TYPES) as [TypeKey, ElementType][]).filter(([, t]) => t.frame)

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

  // Escape, or the next press anywhere but in it. The press that opened it was
  // the right-click, which is already over by the time this listens.
  useEffect(() => {
    if (!at) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const press = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', press)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', press)
    }
  }, [at, onClose])

  if (!at) return null

  return (
    <div ref={menu} className="menu" style={{ left: at.x, top: at.y }}>
      <div className="menu-title">{title}</div>
      {FRAMES.map(([key, type], i) => (
        <button
          key={key}
          type="button"
          // The first row takes the caret as the menu mounts, the way an open
          // field does in the rail: the right-click is the only press it costs.
          ref={i === 0 ? (el) => el?.focus() : undefined}
          style={{ '--accent-ink': LEVELS[type.level].ink }}
          onClick={() => onPick(key)}
        >
          <Sigil type={type} />
          <span>{type.title}</span>
        </button>
      ))}
    </div>
  )
}
