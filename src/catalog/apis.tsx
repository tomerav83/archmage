import { shelf } from './shelf'

// APIs & Contracts. The interface, drawn apart from whatever serves it —
// Backstage makes API a kind of its own for the same reason, and a REST API
// beside the service offering it is the picture that argues for the shelf.
export const APIS = shelf('APIs & Contracts', {
  'rest-api': {
    title: 'REST API',
    sigil: (
      <path d="M9.6 4.2q-2.8 0-2.8 2.8v2.6q0 2.4-2.4 2.4 2.4 0 2.4 2.4V17q0 2.8 2.8 2.8M14.4 4.2q2.8 0 2.8 2.8v2.6q0 2.4 2.4 2.4-2.4 0-2.4 2.4V17q0 2.8-2.8 2.8" />
    ),
  },
  'graphql-api': {
    title: 'GraphQL API',
    sigil: (
      <>
        <path d="M12 10.7V5.5M10.9 12.6 6.5 15.2M13.1 12.6l4.4 2.6" />
        <circle cx="12" cy="12" r="1.3" />
        <circle cx="12" cy="4.2" r="1.3" />
        <circle cx="5.4" cy="15.8" r="1.3" />
        <circle cx="18.6" cy="15.8" r="1.3" />
      </>
    ),
  },
  'grpc-service': {
    title: 'gRPC Service',
    sigil: (
      <path d="M3.4 8.4h13.2M14.2 6 16.6 8.4l-2.4 2.4M20.6 15.6H7.4M9.8 13.2 7.4 15.6l2.4 2.4" />
    ),
  },
  'websocket-channel': {
    title: 'WebSocket Channel',
    sigil: <path d="M4.6 8.4h5.6v7.2H4.6ZM10.2 10.6h3.4M10.2 13.4h3.4M13.6 6.4h5.8v11.2h-5.8" />,
  },
  webhook: {
    title: 'Webhook',
    sigil: <path d="M11.8 3.8h5.6M14.6 3.8v9.2a3.6 3.6 0 0 1-7.2 0V9" />,
  },
  'server-sent-events': {
    title: 'Server-Sent Events',
    sigil: <path d="M3.6 6.4h5.4v11.2H3.6ZM3.6 12h5.4M11 8.4l3 3.6-3 3.6M16 8.4l3 3.6-3 3.6" />,
  },
  'soap-service': {
    title: 'SOAP Service',
    sigil: <path d="M8.6 7.6 4.4 12l4.2 4.4M15.4 7.6 19.6 12l-4.2 4.4M13.6 6.4 10.4 17.6" />,
  },
  'event-contract': {
    title: 'Event Contract',
    sigil: <path d="M5.6 3.4h12.8v17.2H5.6ZM14 6.2 9.4 12.6h2.9l-1.3 5.2 4.6-6.4h-2.9Z" />,
  },
})
