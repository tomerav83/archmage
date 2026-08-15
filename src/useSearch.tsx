import { useState } from 'react'
import { type ElementType, TYPES, type TypeKey } from './c4'

const ROWS = Object.entries(TYPES) as [TypeKey, ElementType][]

/**
 * Twelve shelves of eighty-two is a catalogue you look things up in, not one
 * you page through. The query never leaves here: what the rack wants back is
 * which types to face, whether it stands open over every shelf, and a box to
 * put in the bar.
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const hit = query.trim().toLowerCase()

  return {
    // The type's own name and nothing else. Matching the shelf too meant one
    // letter of "Applications" brought back every application.
    found: ROWS.filter(([, t]) => t.title.toLowerCase().includes(hit)),
    // Shut, until you type: a search is already a statement of what you want
    // standing.
    open: !!hit,
    box: (
      <input
        className="rack-search"
        type="search"
        aria-label="Search elements"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    ),
  }
}
