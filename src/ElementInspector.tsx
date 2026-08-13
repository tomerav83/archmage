import { useReactFlow } from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import { LEVELS, Sigil, TYPES } from './c4'
import type { ElementNodeType } from './ElementNode'
import { CATALOG, COMMON, type FieldKey, fieldsFor } from './fields'

// The right rail is a spec sheet of what this element says, and one line of it
// is open for typing. Clicking another line moves the caret there and shuts the
// one behind it, so the open field is the only lit thing in the panel and there
// is nothing else to hunt for — which is also why every field is a row here and
// nothing is folded away.

// The open control takes the caret as it mounts, so the click that opens a row
// is the only click it costs.
const caret = (el: HTMLElement | null) => {
  el?.focus()
  // Selected, so a fresh drop is renamed by typing over the type's own title.
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select()
}

export function ElementInspector({
  node,
  onClose,
}: {
  node?: ElementNodeType
  onClose: () => void
}) {
  const { updateNodeData } = useReactFlow()
  // Held so the panel has something to draw while it slides away.
  const last = useRef(node)
  if (node) last.current = node
  const shown = node ?? last.current
  const open = node?.id
  // Exactly one row is open. Opening another is what closes it.
  const [editing, setEditing] = useState<FieldKey>('label')

  // A panel that has just opened wants its name typed, whatever row was left
  // open last time. Keyed on the id and not on the node, which is a new object
  // after every keystroke.
  useEffect(() => {
    if (open) setEditing('label')
  }, [open])

  // Escape closes wherever the caret is — the board stays live behind the
  // panel, so the press that shuts it need not have landed in it.
  useEffect(() => {
    if (!open) return
    const shut = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', shut)
    return () => document.removeEventListener('keydown', shut)
  }, [open, onClose])

  // Mounted always, so it can slide; empty until something has been opened.
  if (!shown) return <aside className="inspector" />

  const type = TYPES[shown.data.type]
  const level = LEVELS[type.level]
  // Two fields everything has, then the ones this type has, then the four the
  // catalogue wants — all one line each, so none of them has to be hidden.
  const fields = [...COMMON, ...fieldsFor(shown.data.type), ...CATALOG]

  return (
    <aside
      className="inspector"
      data-open={open ? true : undefined}
      style={{ '--accent': level.accent, '--accent-ink': level.ink }}
    >
      <div className="inspector-band">
        <Sigil type={type} />
        <span>
          {level.title} · {type.title}
        </span>
        <button type="button" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="inspector-body">
        {fields.map((f) => {
          const value = shown.data[f.key] ?? ''
          const write = (e: { target: { value: string } }) =>
            updateNodeData(shown.id, { [f.key]: e.target.value })
          return f.key === editing ? (
            // Keyed on the row as well as the element, so opening another row —
            // or another element — mounts a fresh control, which is what hands
            // it the caret.
            <div key={`${shown.id}-${f.key}`} className="open">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: the label wraps the control one branch down, so the engraved title names it for a screen reader as well as for the eye */}
              <label className="field">
                <span>{f.title}</span>
                {f.input === 'area' ? (
                  <textarea ref={caret} rows={3} value={value} onChange={write} />
                ) : f.input === 'pick' ? (
                  <select ref={caret} value={value} onChange={write}>
                    {/* unset is a value: a status nobody has decided yet */}
                    <option value="" />
                    {f.options?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input ref={caret} placeholder={f.hint} value={value} onChange={write} />
                )}
              </label>
            </div>
          ) : (
            <button key={f.key} type="button" className="row" onClick={() => setEditing(f.key)}>
              <span>{f.title}</span>
              {/* the row's own label names the field, so an empty value column
                  only has to say empty */}
              <span className={value ? 'val' : 'val empty'}>{value || '—'}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
