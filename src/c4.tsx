import type { ReactNode } from 'react'

// Sidebar section order. Declared rather than derived from the registry, so a
// typo'd group is a compile error instead of a phantom section.
export const GROUPS = ['Context', 'Container', 'Component'] as const

// Everything the app knows about one C4 element kind.
//
// Named ElementKind, not Element: in C4 an *element* is an instance on the
// diagram ("Support Agent"), while this describes its kind. It also keeps the
// DOM's global Element out of the shadow.
export type ElementKind = {
  group: (typeof GROUPS)[number]
  title: string
  accent: string // stripe and band tint
  ink: string // the same pigment, lifted for 8px type on a dark card
  sigil: ReactNode // paths only — the <svg> chrome lives in <Sigil>
}

// To add an element kind: add a line here.
export const ELEMENTS = {
  person: {
    group: 'Context',
    title: 'Person',
    accent: '#c25a45',
    ink: '#d97663',
    sigil: (
      <>
        <circle cx="12" cy="7.6" r="4" />
        <path d="M3.6 21c0-4.6 3.8-7.4 8.4-7.4s8.4 2.8 8.4 7.4" />
      </>
    ),
  },
  system: {
    group: 'Context',
    title: 'Software System',
    accent: '#4a7fc1',
    ink: '#6f9fd8',
    sigil: (
      <>
        <path d="M12 2.6 20.1 7.3v9.4L12 21.4 3.9 16.7V7.3Z" />
        <circle cx="12" cy="12" r="2.1" />
      </>
    ),
  },
  container: {
    group: 'Container',
    title: 'Container',
    accent: '#3f9e8c',
    ink: '#56bda9',
    sigil: (
      <>
        <ellipse cx="12" cy="6.2" rx="7.4" ry="3" />
        <path d="M4.6 6.2v11.6c0 1.66 3.31 3 7.4 3s7.4-1.34 7.4-3V6.2" />
        <path d="M4.6 12c0 1.66 3.31 3 7.4 3s7.4-1.34 7.4-3" />
      </>
    ),
  },
  component: {
    group: 'Component',
    title: 'Component',
    accent: '#cf9b3c',
    ink: '#e0b358',
    sigil: (
      <>
        <path d="M7.8 4.4h12.6v15.2H7.8Z" />
        <path d="M3.6 8.6h4.2M3.6 15.4h4.2" />
      </>
    ),
  },
} satisfies Record<string, ElementKind>

export type ElementKey = keyof typeof ELEMENTS

// Every mark is drawn on the same 24-unit grid at the same stroke, so they set
// evenly beside 8px engraved type. The sigil carries the element kind; the
// pigment only confirms it — a diagram still reads in greyscale.
export function Sigil({ kind }: { kind: ElementKind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      aria-hidden="true"
    >
      {kind.sigil}
    </svg>
  )
}
