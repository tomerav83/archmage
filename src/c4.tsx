import type { ReactNode } from 'react'
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

// To add an element type: add a line here.
export const TYPES = {
  person: {
    title: 'Person',
    level: 'context',
    category: 'Actors & Externals',
    sigil: (
      <>
        <circle cx="12" cy="7.6" r="4" />
        <path d="M3.6 21c0-4.6 3.8-7.4 8.4-7.4s8.4 2.8 8.4 7.4" />
      </>
    ),
  },
  system: {
    title: 'Software System',
    level: 'context',
    category: 'Actors & Externals',
    sigil: (
      <>
        <path d="M12 2.6 20.1 7.3v9.4L12 21.4 3.9 16.7V7.3Z" />
        <circle cx="12" cy="12" r="2.1" />
      </>
    ),
  },
  container: {
    title: 'Container',
    level: 'container',
    category: 'Applications',
    sigil: (
      <>
        <ellipse cx="12" cy="6.2" rx="7.4" ry="3" />
        <path d="M4.6 6.2v11.6c0 1.66 3.31 3 7.4 3s7.4-1.34 7.4-3V6.2" />
        <path d="M4.6 12c0 1.66 3.31 3 7.4 3s7.4-1.34 7.4-3" />
      </>
    ),
  },
  component: {
    title: 'Component',
    level: 'component',
    category: 'Applications',
    sigil: (
      <>
        <path d="M7.8 4.4h12.6v15.2H7.8Z" />
        <path d="M3.6 8.6h4.2M3.6 15.4h4.2" />
      </>
    ),
  },
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
