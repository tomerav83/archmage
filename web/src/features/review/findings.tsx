import { memo } from 'react'
import { findingKey, type Finding } from './review'
import './findings.css'

/** Memoized: a drag re-renders the editor every frame, and none of these rows can have
 *  changed — findings run off the settled board. */
export const Findings = memo(function Findings({
  findings,
  onFocus,
}: {
  findings: Finding[]
  onFocus: (f: Finding) => void
}) {
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
          {findings.map((f) => (
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
        </ul>
      )}
    </footer>
  )
})
