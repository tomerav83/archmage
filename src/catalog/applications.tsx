import { shelf } from './shelf'

// Applications. Something that runs, and the mark says where it runs rather
// than what it is written in: Rails and Next.js are one Web Application told
// apart by its technology. The drum is spent here, on Container.
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
  'web-app': {
    title: 'Web Application',
    sigil: <path d="M3.4 4.8h17.2v14.4H3.4ZM3.4 9h17.2M6.6 6.9h1.4M10 6.9h1.4" />,
  },
  'single-page-app': {
    title: 'Single-Page App',
    sigil: <path d="M3.4 4.8h17.2v14.4H3.4ZM7.6 9h8.8v6H7.6Z" />,
  },
  'mobile-app': {
    title: 'Mobile App',
    sigil: <path d="M6.8 2.8h10.4v18.4H6.8ZM10.4 5.6h3.2M9.8 18.4h4.4" />,
  },
  'desktop-app': {
    title: 'Desktop App',
    sigil: <path d="M2.8 8.4h12.6v11.8H2.8ZM8 8.4V3.8h13.2v11.8h-5.8" />,
  },
  'api-service': {
    title: 'API Service',
    sigil: (
      <>
        <path d="M2.8 6.6h11.4v10.8H2.8ZM14.2 12h2.4" />
        <circle cx="19" cy="12" r="2.4" />
      </>
    ),
  },
  'serverless-function': {
    title: 'Serverless Function',
    sigil: <path d="M13.8 2.8 6.4 13.2h5.2l-1.6 8 7.6-10.6h-5.2Z" />,
  },
  worker: {
    title: 'Worker / Consumer',
    sigil: (
      <>
        <circle cx="12" cy="12" r="3.6" />
        <path d="M12 3.4v4.2M12 16.4v4.2M3.4 12h4.2M16.4 12h4.2" />
      </>
    ),
  },
  'scheduled-job': {
    title: 'Scheduled Job',
    sigil: (
      <>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M12 6.6V12l4 2.4" />
      </>
    ),
  },
  'batch-job': {
    title: 'Batch / ETL Job',
    sigil: <path d="M3.4 5.2h17.2l-6.6 7.6v6.2l-4-2.4v-3.8Z" />,
  },
})
