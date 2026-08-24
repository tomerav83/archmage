import { shelf } from './shelf'

// Deployment & Infrastructure. The twelfth shelf and the only one split down
// the middle: an environment, a region, a cluster and a compute node hold what
// is deployed in them, an infrastructure node and an instance stand in one. The
// whole shelf names its level, because it is the only shelf where every type is
// legal at exactly one and it is not the container level.
export const DEPLOYMENT = shelf('Deployment & Infrastructure', {
  environment: {
    title: 'Deployment Environment',
    level: 'deployment',
    frame: true,
    // The deployment node as both source tools draw it: a box with a lid, which
    // is the one mark on the board that is not flat.
    sigil: <path d="M3.2 8.6h13.6v11.8H3.2ZM3.2 8.6 7 4.8h13.6v11.8l-3.8 3.8M16.8 8.6l3.8-3.8" />,
  },
  region: {
    title: 'Region / Zone',
    level: 'deployment',
    frame: true,
    sigil: (
      <>
        <circle cx="12" cy="12" r="8.4" />
        <path d="M3.6 12h16.8" />
        {/* the slice of the globe a zone is, and it is drawn as a drawn line */}
        <path strokeDasharray="2.6 2.4" d="M9.2 4.2v15.6M14.8 4.2v15.6" />
      </>
    ),
  },
  cluster: {
    title: 'Cluster / Orchestrator',
    level: 'deployment',
    frame: true,
    sigil: (
      <>
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="12" cy="4.8" r="1.6" />
        <circle cx="18.2" cy="15.6" r="1.6" />
        <circle cx="5.8" cy="15.6" r="1.6" />
        <path d="M12 6.4v3.4M13.9 13.1l2.9 1.7M10.1 13.1l-2.9 1.7" />
      </>
    ),
  },
  'compute-node': {
    title: 'Compute Node',
    level: 'deployment',
    frame: true,
    sigil: (
      <path d="M7.6 7.6h8.8v8.8H7.6ZM10 3.6v4M14 3.6v4M10 16.4v4M14 16.4v4M3.6 10h4M3.6 14h4M16.4 10h4M16.4 14h4" />
    ),
  },
  'infra-node': {
    title: 'Infrastructure Node',
    level: 'deployment',
    sigil: (
      <>
        <path d="M3.6 5.2h16.8v5H3.6ZM3.6 13.8h16.8v5H3.6Z" />
        <circle cx="6.6" cy="7.7" r="0.9" />
        <circle cx="6.6" cy="16.3" r="0.9" />
      </>
    ),
  },
  instance: {
    title: 'Instance',
    level: 'deployment',
    // One of a thing, standing in front of the thing it is one of.
    sigil: <path d="M8.2 8.2h11.6v11.6H8.2ZM8.2 15.8H4.2V4.2h11.6v4" />,
  },
})
