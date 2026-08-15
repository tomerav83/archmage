import { shelf } from './shelf'

// Analytics & ML. What reads the data back rather than serves it, so the marks
// are the work and not the box it runs in: an operator on a stream, batches
// gathered, a model answering. Spark is a Batch Processor here and a Batch /
// ETL Job in Applications — one is the engine, the other the thing you ran.
export const ANALYTICS = shelf('Analytics & ML', {
  'stream-processor': {
    title: 'Stream Processor',
    sigil: <path d="M2.6 12h5.6M12 8.2 15.8 12 12 15.8 8.2 12ZM15.8 12h5.6" />,
  },
  'batch-processor': {
    title: 'Batch Processor',
    sigil: (
      <path d="M2.8 4.4h5.4v5.4H2.8ZM2.8 14.2h5.4v5.4H2.8ZM13.8 8.8h7.4v6.4h-7.4ZM8.2 7.1h5.6v4M8.2 16.9h5.6v-4" />
    ),
  },
  'inference-endpoint': {
    title: 'Inference Endpoint',
    sigil: (
      <>
        <circle cx="5.4" cy="7.4" r="1.8" />
        <circle cx="5.4" cy="16.6" r="1.8" />
        <circle cx="12.8" cy="12" r="1.8" />
        <path d="M7 8.4 11.2 11M7 15.6 11.2 13M14.6 12h5.8M18 9.6l2.4 2.4-2.4 2.4" />
      </>
    ),
  },
  'training-pipeline': {
    title: 'Training Pipeline',
    sigil: <path d="M20 12a8 8 0 1 1-3.2-6.4M20.6 4.2v5.2h-5.2" />,
  },
  'feature-store': {
    title: 'Feature Store',
    sigil: (
      <path d="M4.4 4.6h15.2v14.8H4.4ZM4.4 8.6h15.2M9.4 8.6v10.8M14.6 8.6v10.8M11.2 11.4h1.6M11.2 14h1.6M11.2 16.6h1.6" />
    ),
  },
  'llm-service': {
    title: 'LLM / AI Service',
    sigil: (
      <path d="M9.4 3 11.2 8.2 16.4 10 11.2 11.8 9.4 17 7.6 11.8 2.4 10 7.6 8.2ZM17.2 14 18.2 16.8 21 17.8 18.2 18.8 17.2 21.6 16.2 18.8 13.4 17.8 16.2 16.8Z" />
    ),
  },
})
