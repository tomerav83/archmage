import { shelf } from './shelf'

// Boundaries & Zones. The one shelf whose types hold other elements rather than
// standing beside them, so every mark on it is a frame with what it frames
// drawn inside — the family reads as frames at 13px, before the band is read.
export const BOUNDARIES = shelf('Boundaries & Zones', {
  enterprise: {
    title: 'Enterprise Boundary',
    level: 'context',
    frame: true,
    sigil: (
      <>
        <path d="M2.8 5.2h18.4v13.6H2.8Z" />
        <path d="M6.4 9.4h4v5.4h-4ZM13.6 9.4h4v5.4h-4Z" />
      </>
    ),
  },
  'system-boundary': {
    title: 'System Boundary',
    frame: true,
    sigil: (
      <>
        <path d="M2.8 5.2h18.4v13.6H2.8Z" />
        {/* the system's own hexagon, framed */}
        <path d="M12 8.2l3.6 2.1v3.4L12 15.8l-3.6-2.1v-3.4Z" />
      </>
    ),
  },
  'container-boundary': {
    title: 'Container Boundary',
    level: 'component',
    frame: true,
    sigil: (
      <>
        <path d="M2.8 5.2h18.4v13.6H2.8Z" />
        <path d="M8 9.4h8v5.2H8ZM8 11.4h8" />
      </>
    ),
  },
  domain: {
    title: 'Domain / Bounded Context',
    level: 'context',
    frame: true,
    sigil: <path d="M2.8 5.2h18.4v13.6H2.8ZM9.4 5.2v13.6" />,
  },
  'trust-zone': {
    title: 'Trust Zone',
    // A VPC, a subnet, a DMZ: the one boundary drawn around machines rather
    // than around software, so it is the one that levels with them.
    level: 'deployment',
    frame: true,
    sigil: (
      <>
        {/* a perimeter that is a policy rather than a wall — the WAF's mark is
            the wall — so this one line is drawn broken */}
        <path strokeDasharray="2.6 2.4" d="M2.8 5.2h18.4v13.6H2.8Z" />
        <circle cx="12" cy="11" r="1.9" />
        <path d="M12 12.9v2.4" />
      </>
    ),
  },
  team: {
    title: 'Team / Ownership Group',
    level: 'context',
    frame: true,
    sigil: (
      <>
        <path d="M2.8 5.2h18.4v13.6H2.8Z" />
        <circle cx="9.3" cy="9.9" r="1.5" />
        <circle cx="14.7" cy="9.9" r="1.5" />
        {/* clear of the heads by more than the stroke, or the three shapes
            close into one blob at 13px */}
        <path d="M7.6 16.4c0-2 2-3.2 4.4-3.2s4.4 1.2 4.4 3.2" />
      </>
    ),
  },
})
