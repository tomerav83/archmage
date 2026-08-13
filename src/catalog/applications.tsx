import { shelf } from './shelf'

// Applications. Something that runs: the drum is spent here, on Container.
export const APPLICATIONS = shelf('Applications', {
  container: {
    title: 'Container',
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
    sigil: (
      <>
        <path d="M7.8 4.4h12.6v15.2H7.8Z" />
        <path d="M3.6 8.6h4.2M3.6 15.4h4.2" />
      </>
    ),
  },
})
