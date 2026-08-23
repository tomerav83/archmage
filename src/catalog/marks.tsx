import type { ReactNode } from 'react'
import type { Category } from '../fields'

// What a shelf shows on the bar: a mark, and one word under it. Eleven
// catalogue names in 8.5px were the whole of the bar's navigation and they
// wrapped it onto a second row; a mark reads at arm's length where the type
// never could, and a cell is 64px whatever the shelf is called. Paths only —
// the <svg> chrome belongs to whoever draws it, as it does for a sigil.
//
// A mark is not a sigil: it stands for the shelf, never for a type on it, so
// none of these repeats a drawing off the shelf it opens. Person is one
// figure, so Actors is a pair; Graph Database is nodes and edges, so Analytics
// is a trend. The full name is on the button's title, and in docs/taxonomy.md.
//
// Every category has a line here, including the one with no tab — the same
// bargain fields.ts makes, so a new shelf is a compile error until it has a
// face.
export const MARKS: Record<Category, { short: string; mark: ReactNode }> = {
  'Actors & Externals': {
    short: 'Actors',
    mark: (
      <>
        <circle cx="9.4" cy="8.2" r="3.2" />
        <path d="M3.4 19.6c0-3.6 2.7-5.8 6-5.8s6 2.2 6 5.8" />
        <circle cx="17.4" cy="7.4" r="2.4" />
        <path d="M15.8 13.2c2.9-.4 4.8 1.8 4.8 4.6" />
      </>
    ),
  },
  Applications: {
    short: 'Apps',
    mark: (
      <path d="M4.2 4.2h6.2v6.2H4.2ZM13.6 4.2h6.2v6.2h-6.2ZM4.2 13.6h6.2v6.2H4.2ZM13.6 13.6h6.2v6.2h-6.2" />
    ),
  },
  'APIs & Contracts': {
    short: 'APIs',
    mark: (
      <path d="M9.2 4.4c-2.4 0-1.4 7.2-4.4 7.2 3 0 2 7.2 4.4 7.2M14.8 4.4c2.4 0 1.4 7.2 4.4 7.2-3 0-2 7.2-4.4 7.2" />
    ),
  },
  'Data Stores': {
    short: 'Data',
    mark: (
      <>
        <ellipse cx="12" cy="6.4" rx="6.8" ry="2.8" />
        <path d="M5.2 6.4v11.2c0 1.55 3.05 2.8 6.8 2.8s6.8-1.25 6.8-2.8V6.4" />
      </>
    ),
  },
  Caching: {
    short: 'Cache',
    mark: <path d="M13.6 2.8 5.8 13.2h5.2l-.6 8 7.8-10.4h-5.2Z" />,
  },
  'Messaging & Streaming': {
    short: 'Messaging',
    mark: <path d="M12 11.6v8.8M8.6 9.2a4.8 4.8 0 0 1 6.8 0M5.8 6.4a8.8 8.8 0 0 1 12.4 0" />,
  },
  'Edge & Traffic': {
    short: 'Edge',
    mark: (
      <>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M3.6 12h16.8M12 3.6c2.7 3.1 2.7 13.7 0 16.8M12 3.6c-2.7 3.1-2.7 13.7 0 16.8" />
      </>
    ),
  },
  'Platform & Security': {
    short: 'Platform',
    mark: <path d="M12 3.2 19.6 5.8v6.2c0 4.3-3.1 7.4-7.6 8.8-4.5-1.4-7.6-4.5-7.6-8.8V5.8Z" />,
  },
  'Observability & Ops': {
    short: 'Ops',
    mark: <path d="M3.8 17.6a8.2 8.2 0 0 1 16.4 0M12 17.6l4.6-5.4" />,
  },
  'Analytics & ML': {
    short: 'Analytics',
    mark: <path d="M3.8 3.6v16.6h16.4M7 16.4l3.8-4.4 3.2 2.6 4.4-6.2" />,
  },
  // No tab stands this shelf — a boundary is drawn, never dragged — but the
  // table is the catalogue's, not the bar's: four corners, a frame you draw.
  'Boundaries & Zones': {
    short: 'Boundaries',
    mark: <path d="M3.6 8.4V3.6h4.8M15.6 3.6h4.8v4.8M20.4 15.6v4.8h-4.8M8.4 20.4H3.6v-4.8" />,
  },
  'Deployment & Infrastructure': {
    short: 'Deploy',
    mark: <path d="M3.8 4.6h16.4v5.6H3.8ZM3.8 13.8h16.4v5.6H3.8ZM7 7.4h.1M7 16.6h.1" />,
  },
}
