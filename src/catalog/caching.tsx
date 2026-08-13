import type { ElementType } from '../c4'

// Caching. A copy kept nearer than the thing it copies, so the marks stay
// close too: chip, chips, screen, and the drum reading off a leader.
export const CACHING = {
  'memory-cache': {
    title: 'In-Memory Cache',
    level: 'container',
    category: 'Caching',
    sigil: (
      <path d="M6.8 6.8h10.4v10.4H6.8ZM9.8 6.8V3.6M14.2 6.8V3.6M9.8 20.4v-3.2M14.2 20.4v-3.2M6.8 9.8H3.6M6.8 14.2H3.6M20.4 9.8h-3.2M20.4 14.2h-3.2" />
    ),
  },
  'distributed-cache': {
    title: 'Distributed Cache',
    level: 'container',
    category: 'Caching',
    sigil: <path d="M3.4 8.4h6.6v7.2H3.4ZM14 8.4h6.6v7.2H14ZM10 12h4" />,
  },
  'client-cache': {
    title: 'Client Cache',
    level: 'container',
    category: 'Caching',
    sigil: <path d="M3.4 4.6h17.2v11.2H3.4ZM12 15.8v4.4M8.8 20.2h6.4" />,
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
