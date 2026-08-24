import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Field, FieldKey } from './fields'
import { TechPick } from './TechPick'

// The right rail is a spec sheet of what one thing on the board says, and one
// line of it is open for typing. Clicking another line moves the caret there and
// shuts the one behind it, so the open field is the only lit thing in the panel
// and there is nothing else to hunt for — which is also why every field is a row
// here and nothing is folded away.

// What the rail is pointed at. A node and an edge disagree about their band,
// their pigment, their fields and where a write lands, and about nothing else —
// so that is all this carries, and everything below it is written once.
export type Sheet = {
  id: string // what mounts a fresh control when the rail moves on
  accent: string // band tint; index.css lifts it for 8px type
  band: ReactNode // what the band says, sigil and all
  fields: Field[]
  data: Partial<Record<FieldKey, string>>
  write: (key: FieldKey, value: string) => void
}

// The open control takes the caret as it mounts, so the click that opens a row
// is the only click it costs.
//
// After the press that opened it, never inside it: a panel opened by a drop
// mounts while the drag is still running, and a browser ignores a focus asked
// for mid-drag — so the caret asked for on the ref alone was dropped on the
// floor along with the first thing typed. A task, not a frame: the drag ends
// after the frame does.
const caret = (el: HTMLElement | null) => {
  if (!el) return
  setTimeout(() => {
    // preventScroll, or the browser's own scroll-into-view runs on a panel
    // still off-screen at translateX(100%) — a transform still counts toward
    // the page's scrollable width even though the panel is display: hidden's
    // cousin, visibility: hidden, so the browser happily scrolls the whole
    // board sideways to reach it, and never scrolls back when the panel shuts.
    el.focus({ preventScroll: true })
    // Selected, so a fresh drop is renamed by typing over the type's own title.
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select()
  })
}

export function Form({ subject, onClose }: { subject?: Sheet; onClose: () => void }) {
  // Held so the panel has something to draw while it slides away.
  const last = useRef(subject)
  if (subject) last.current = subject
  const shown = subject ?? last.current
  const open = subject?.id
  // Exactly one row is open. Opening another is what closes it.
  const [editing, setEditing] = useState<FieldKey>('label')

  // A panel that has just opened wants its name typed, whatever row was left
  // open last time. Keyed on the id and not on the subject, which is a new
  // object after every keystroke.
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
  if (!shown) return <aside className="form" />

  return (
    <aside
      className="form"
      data-open={open ? true : undefined}
      style={{ '--accent': shown.accent }}
    >
      <div className="form-band">
        {shown.band}
        <button type="button" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="form-body">
        {shown.fields.map((f) => {
          const value = shown.data[f.key] ?? ''
          const write = (e: { target: { value: string } }) => shown.write(f.key, e.target.value)
          return f.key === editing ? (
            // Keyed on the row as well as the subject, so opening another row —
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
                ) : f.input === 'tech' ? (
                  // What this type is built from is a shortlist, not a blank
                  // line — and the shortlist's last row is the blank line.
                  <TechPick
                    caret={caret}
                    title={f.title}
                    options={f.options ?? []}
                    value={value}
                    write={(v) => shown.write(f.key, v)}
                  />
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
