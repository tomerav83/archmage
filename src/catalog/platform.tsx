import { shelf } from './shelf'

// Platform & Security. What every service on the diagram leans on and nobody
// draws: who you are, what you may do, and where the secret came from.
export const PLATFORM = shelf('Platform & Security', {
  'identity-provider': {
    title: 'Identity Provider',
    sigil: (
      <>
        <circle cx="9.4" cy="10.4" r="2.2" />
        <path d="M3.4 4.8h17.2v14.4H3.4ZM14.2 9.6h3.8M14.2 13.2h3.8M5.8 16.4c0-2 1.6-3.4 3.6-3.4s3.6 1.4 3.6 3.4" />
      </>
    ),
  },
  'auth-service': {
    title: 'Auth / Session Service',
    sigil: (
      <>
        <path d="M4.6 4.6h14.8v14.8H4.6ZM12 12.4v3.6" />
        <circle cx="12" cy="10.2" r="2.1" />
      </>
    ),
  },
  'secrets-manager': {
    title: 'Secrets Manager',
    sigil: <path d="M4.8 10.4h14.4v9.8H4.8ZM8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8M12 13.6v3.4" />,
  },
  'kms-certificates': {
    title: 'KMS / Certificates',
    sigil: (
      <>
        <path d="M3.6 3.6h16.8v11.2H3.6ZM7 7.2h10M7 10.6h6" />
        <circle cx="15.6" cy="17.2" r="2.6" />
      </>
    ),
  },
  'policy-service': {
    title: 'Policy / AuthZ Service',
    sigil: (
      <path d="M12 2.8 20 5.8v6.4c0 4.2-3.6 7.2-8 8.6-4.4-1.4-8-4.4-8-8.6V5.8ZM8.6 11.8l2.6 2.6 4.4-4.8" />
    ),
  },
  'service-registry': {
    title: 'Service Registry',
    sigil: (
      <path d="M4.4 4.6h15.2v14.8H4.4ZM9 8.4h7M9 12h7M9 15.6h7M6.6 8.4h.8M6.6 12h.8M6.6 15.6h.8" />
    ),
  },
  'config-service': {
    title: 'Config Service',
    sigil: <path d="M8.4 3.6v16.8M15.6 3.6v16.8M6.2 9h4.4M13.4 14.2h4.4" />,
  },
  'feature-flag-service': {
    title: 'Feature Flag Service',
    sigil: <path d="M6.4 3.4v17.2M6.4 4.8h12.2l-2.8 3.9 2.8 3.9H6.4" />,
  },
})
