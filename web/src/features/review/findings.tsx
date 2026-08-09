import { memo } from 'react'
import { findingKey, type Finding } from './review'
import './findings.css'

// A board this noisy is telling you something the 101st row will not.
const MAX_FINDING_ROWS = 100

/** Memoized: a drag re-renders the editor every frame, and this list is up to a
 *  hundred rows that the drag cannot have changed — findings run off the settled board. */
export const Findings = memo(function Findings({
  findings,
  onFocus,
}: {
  findings: Finding[]
  onFocus: (f: Finding) => void
}) {
  const shown = findings.slice(0, MAX_FINDING_ROWS)
  return (
    <footer className="findings">
      {/* <output> is a live region by default, so a changed count is announced */}
      <h2>
        Review <output className="count">{findings.length}</output>
      </h2>
      {findings.length === 0 ? (
        <p className="hint">Nothing to flag.</p>
      ) : (
        <ul>
          {shown.map((f) => (
            <li key={findingKey(f)}>
              <button
                type="button"
                className={`finding ${f.severity}`}
                data-sev={f.severity}
                onClick={() => onFocus(f)}
              >
                <b>{f.title}</b>
                <span>{f.why}</span>
              </button>
            </li>
          ))}
          {findings.length > shown.length ? (
            <li className="hint">and {findings.length - shown.length} more</li>
          ) : null}
        </ul>
      )}
    </footer>
  )
})
