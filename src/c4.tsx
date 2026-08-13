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

  // Data Stores. What it holds is the mark; what it runs is the technology —
  // Postgres and MySQL are one type here, told apart in the field beneath the
  // name. The drum is spent on Container, so a relation draws as a table.
  'relational-db': {
    title: 'Relational Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 4.8h17.2v14.4H3.4Z" />
        <path d="M3.4 9.6h17.2M12 9.6v9.6" />
      </>
    ),
  },
  'document-db': {
    title: 'Document Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M5.8 3.2h8.6l4.2 4.2v13.4H5.8Z" />
        <path d="M14.4 3.2v4.2h4.2" />
      </>
    ),
  },
  'key-value-store': {
    title: 'Key-Value Store',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <circle cx="7.4" cy="12" r="3.8" />
        <path d="M11.2 12h9.4M17.6 12v3.4M14.6 12v2.6" />
      </>
    ),
  },
  'wide-column-store': {
    title: 'Wide-Column Store',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 4.8h17.2v14.4H3.4Z" />
        <path d="M9.2 4.8v14.4M14.8 4.8v14.4" />
      </>
    ),
  },
  'graph-db': {
    title: 'Graph Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <circle cx="12" cy="5.8" r="2.6" />
        <circle cx="5.6" cy="17.6" r="2.6" />
        <circle cx="18.4" cy="17.6" r="2.6" />
        <path d="M10.7 8.1 6.9 15.3M13.3 8.1l3.8 7.2M8.2 17.6h7.6" />
      </>
    ),
  },
  'timeseries-db': {
    title: 'Time-Series Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.8 3.8v16.4h16.4" />
        <path d="M6.6 16.4 10.4 11l3.4 2.6 5.2-6.4" />
      </>
    ),
  },
  'vector-db': {
    title: 'Vector Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.8 20.2 15.8 8.2M10.6 8.2h5.2v5.2" />
        <circle cx="6.2" cy="7.6" r="1.3" />
        <circle cx="19" cy="18.4" r="1.3" />
      </>
    ),
  },
  'search-index': {
    title: 'Search Index',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <circle cx="10.4" cy="10.4" r="6.4" />
        <path d="M15.2 15.2 20.6 20.6" />
      </>
    ),
  },
  'object-store': {
    title: 'Blob / Object Store',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.6 5.6h16.8l-1.8 14.8H5.4Z" />
        <path d="M4.2 10.4h15.6" />
      </>
    ),
  },
  'file-system': {
    title: 'File System',
    level: 'container',
    category: 'Data Stores',
    sigil: <path d="M3.4 5.2h6.2l2 2.8h9v12H3.4Z" />,
  },
  'data-warehouse': {
    title: 'Data Warehouse',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 10.6 12 4.2l8.6 6.4v9.4H3.4Z" />
        <path d="M9.2 20v-5.8h5.6V20" />
      </>
    ),
  },
  'data-lake': {
    title: 'Data Lake',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 7.6q2.15-2 4.3 0t4.3 0 4.3 0 4.3 0" />
        <path d="M3.4 13q2.15-2 4.3 0t4.3 0 4.3 0 4.3 0" />
        <path d="M3.4 18.4q2.15-2 4.3 0t4.3 0 4.3 0 4.3 0" />
      </>
    ),
  },

  // Caching. A copy kept nearer than the thing it copies, so the marks stay
  // close too: chip, chips, screen, and the drum reading off a leader.
  'memory-cache': {
    title: 'In-Memory Cache',
    level: 'container',
    category: 'Caching',
    sigil: (
      <>
        <path d="M6.8 6.8h10.4v10.4H6.8Z" />
        <path d="M9.8 6.8V3.6M14.2 6.8V3.6M9.8 20.4v-3.2M14.2 20.4v-3.2M6.8 9.8H3.6M6.8 14.2H3.6M20.4 9.8h-3.2M20.4 14.2h-3.2" />
      </>
    ),
  },
  'distributed-cache': {
    title: 'Distributed Cache',
    level: 'container',
    category: 'Caching',
    sigil: (
      <>
        <path d="M3.4 8.4h6.6v7.2H3.4Z" />
        <path d="M14 8.4h6.6v7.2H14Z" />
        <path d="M10 12h4" />
      </>
    ),
  },
  'client-cache': {
    title: 'Client Cache',
    level: 'container',
    category: 'Caching',
    sigil: (
      <>
        <path d="M3.4 4.6h17.2v11.2H3.4Z" />
        <path d="M12 15.8v4.4M8.8 20.2h6.4" />
      </>
    ),
  },
  'read-replica': {
    title: 'Read Replica',
    level: 'container',
    category: 'Caching',
    sigil: (
      <>
        <ellipse cx="8.2" cy="6.2" rx="4.8" ry="2.4" />
        <path d="M3.4 6.2v9.6c0 1.33 2.15 2.4 4.8 2.4s4.8-1.07 4.8-2.4V6.2" />
        <path d="M15.6 12h5M18 9.6l2.6 2.4-2.6 2.4" />
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
