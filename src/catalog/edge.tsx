import { shelf } from './shelf'

// Edge & Traffic. The front door, in the order a request meets it, and the
// marks follow it: a request crosses the page left to right through every one
// of them.
export const EDGE = shelf('Edge & Traffic', {
  dns: {
    title: 'DNS',
    sigil: <path d="M12 3.4v17.2M12 5.6h6.8l2.4 2.4-2.4 2.4H12M12 13.2H5.2l-2.4 2.4 2.4 2.4H12" />,
  },
  cdn: {
    title: 'CDN',
    sigil: (
      <>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M3.6 12h16.8M12 3.6c3.2 3.4 3.2 13.4 0 16.8c-3.2-3.4-3.2-13.4 0-16.8" />
      </>
    ),
  },
  'load-balancer': {
    title: 'Load Balancer',
    sigil: <path d="M2.6 12h4.8M7.4 12 11.4 6.6h9.2M7.4 12h13.2M7.4 12l4 5.4h9.2" />,
  },
  'reverse-proxy': {
    title: 'Reverse Proxy',
    sigil: <path d="M9.4 7.4h5.2v9.2H9.4ZM2.6 12h6.8M14.6 12h6M18 9.6l2.6 2.4-2.6 2.4" />,
  },
  'api-gateway': {
    title: 'API Gateway',
    sigil: <path d="M6.6 3.6v16.8M17.4 3.6v16.8M8.8 12h5.6M12 9.6l2.4 2.4-2.4 2.4" />,
  },
  'service-mesh': {
    title: 'Service Mesh',
    sigil: <path d="M3.6 8.4h16.8M3.6 15.6h16.8M8.4 3.6v16.8M15.6 3.6v16.8" />,
  },
  waf: {
    // The one type on this shelf the catalogue only ever gives a Dep: a
    // firewall is a thing standing in a network, not a thing in an app.
    title: 'WAF / Firewall',
    level: 'deployment',
    sigil: (
      <path d="M3.4 5.6h17.2v12.8H3.4ZM3.4 9.8h17.2M3.4 14.2h17.2M9.2 5.6v4.2M15 5.6v4.2M6.3 9.8v4.4M12 9.8v4.4M17.7 9.8v4.4M9.2 14.2v4.2M15 14.2v4.2" />
    ),
  },
  'ingress-controller': {
    title: 'Ingress Controller',
    sigil: <path d="M12 4.6h8.4v14.8H12M2.6 12h8.6M8.8 9.6 11.2 12l-2.4 2.4" />,
  },
})
