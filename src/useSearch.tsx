import { useState } from 'react'
import { type ElementType, TYPES, type TypeKey } from './c4'

const ROWS = Object.entries(TYPES) as [TypeKey, ElementType][]

/**
 * Twelve shelves of eighty-two is a catalogue you look things up in, not one
 * you scroll. The query never leaves here: what the rail wants back is which
 * types to shelve, whether the shelves stand open, and a box to put on top.
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const hit = query.trim().toLowerCase()

  return {
    // The type's own name and nothing else. Matching the shelf too meant one
    // letter of "Applications" brought back every application.
    found: ROWS.filter(([, t]) => t.title.toLowerCase().includes(hit)),
    // Shut, until you type: twelve open shelves is a scroll, not a palette,
    // and a search is already a statement of what you want open.
    open: !!hit,
    box: (
      <input
        className="rail-search"
        type="search"
        aria-label="Search elements"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    ),
  }
}
