import { shelf } from './shelf'

// Caching. A copy kept nearer than the thing it copies, so the marks stay
// close too: chip, chips, and screen.
export const CACHING = shelf('Caching', {
  'memory-cache': {
    title: 'In-Memory Cache',
    sigil: (
      <path d="M6.8 6.8h10.4v10.4H6.8ZM9.8 6.8V3.6M14.2 6.8V3.6M9.8 20.4v-3.2M14.2 20.4v-3.2M6.8 9.8H3.6M6.8 14.2H3.6M20.4 9.8h-3.2M20.4 14.2h-3.2" />
    ),
  },
  'distributed-cache': {
    title: 'Distributed Cache',
    sigil: <path d="M3.4 8.4h6.6v7.2H3.4ZM14 8.4h6.6v7.2H14ZM10 12h4" />,
  },
  'client-cache': {
    title: 'Client Cache',
    sigil: <path d="M3.4 4.6h17.2v11.2H3.4ZM12 15.8v4.4M8.8 20.2h6.4" />,
  },
})
