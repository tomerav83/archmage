import type { ReactNode } from 'react'
import { ACTORS } from './catalog/actors'
import { APPLICATIONS } from './catalog/applications'
import { CACHING } from './catalog/caching'
import { DATA_STORES } from './catalog/data-stores'
import type { Category } from './fields'

// An element sits on three independent axes, never one enum: what you are
// zoomed to, what kind of thing it is, and what it is built from. Postgres is
// not a type — it is a technology on a Relational Database, free text on the
// node. That is what keeps a large catalogue a table instead of an icon pack.

export type Level = {
  title: string
  accent: string // stripe and band tint
  ink: string // the same pigment, lifted for 8px type on a dark card
}

// The zoom, and the only thing carrying pigment: a colour per type would be
// mud, so the colour tells you the level and the sigil tells you the type. The
// rail is shelved by category, not by this — a level holds too much to browse.
export const LEVELS = {
  context: { title: 'Context', accent: '#4a7fc1', ink: '#6f9fd8' },
  container: { title: 'Container', accent: '#3f9e8c', ink: '#56bda9' },
  component: { title: 'Component', accent: '#cf9b3c', ink: '#e0b358' },
} satisfies Record<string, Level>

export type LevelKey = keyof typeof LEVELS

// What kind of thing it is. No colour here — see LEVELS.
export type ElementType = {
  title: string
  level: LevelKey // the level this type is legal at
  category: Category // which fields it carries — see fields.ts
  sigil: ReactNode // paths only — the <svg> chrome lives in <Sigil>
}

// One file per shelf under catalog/, merged here: eighty-two types in one
// table is a file nobody opens twice, and the shelf is the seam the rest of
// the app already cuts on — fields.ts is keyed by it and the rail browses by
// it. To add an element type: add a line to its shelf. To add a shelf: a file
// and a line here. The spread keeps TypeKey exact, so a key that is not a type
// stays a compile error everywhere it matters.
export const TYPES = {
  ...ACTORS,
  ...APPLICATIONS,
  ...DATA_STORES,
  ...CACHING,
} satisfies Record<string, ElementType>

export type TypeKey = keyof typeof TYPES

// Every mark is drawn on the same 24-unit grid at the same stroke, so they set
// evenly beside 8px engraved type. The sigil carries the type; the pigment only
// confirms the level — a diagram still reads in greyscale.
export function Sigil({ type }: { type: ElementType }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      aria-hidden="true"
    >
      {type.sigil}
    </svg>
  )
}
