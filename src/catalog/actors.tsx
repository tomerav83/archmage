import { shelf } from './shelf'

// Actors & Externals. Who and what is outside the thing you are drawing.
export const ACTORS = shelf('Actors & Externals', {
  person: {
    title: 'Person',
    level: 'context',
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
    sigil: (
      <>
        <path d="M12 2.6 20.1 7.3v9.4L12 21.4 3.9 16.7V7.3Z" />
        <circle cx="12" cy="12" r="2.1" />
      </>
    ),
  },
})
