import { shelf } from './shelf'

// Observability & Ops. The three signals and what wakes somebody when they go
// bad, so the marks are the signals themselves: bars, streams merging, spans
// down a clock.
export const OBSERVABILITY = shelf('Observability & Ops', {
  'metrics-store': {
    title: 'Metrics Store',
    sigil: <path d="M3.4 20.4h17.2M7 20.4v-8.2M12 20.4V6.6M17 20.4v-5.4" />,
  },
  'log-aggregator': {
    title: 'Log Aggregator',
    sigil: <path d="M3.4 6.6h5.2l4 5.4h7.8M3.4 12h15.2M3.4 17.4h5.2l4-5.4" />,
  },
  'tracing-backend': {
    title: 'Tracing Backend',
    sigil: <path d="M4.4 3.6v16.8M6.8 7h8.4M9.6 12h10M12.4 17h5.6" />,
  },
  alerting: {
    title: 'Alerting / On-call',
    sigil: (
      <path d="M6.2 17h11.6c-1.9-1.5-1.7-3.2-1.7-5.8 0-3.2-1.8-5.4-4.1-5.4S7.9 8 7.9 11.2c0 2.6.2 4.3-1.7 5.8ZM10.2 19.8h3.6M12 5.8V3.4" />
    ),
  },
  'cicd-pipeline': {
    title: 'CI/CD Pipeline',
    sigil: (
      <path d="M12 12c2-3 3.4-4.3 5.4-4.3a4.3 4.3 0 0 1 0 8.6c-2 0-3.4-1.3-5.4-4.3s-3.4-4.3-5.4-4.3a4.3 4.3 0 0 0 0 8.6c2 0 3.4-1.3 5.4-4.3Z" />
    ),
  },
})
