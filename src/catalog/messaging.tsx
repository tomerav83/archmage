import { shelf } from './shelf'

// Messaging & Streaming. C4-PlantUML has one Queue stereotype for all of this,
// which is why every async system it draws looks the same.
//
// A dead-letter queue stood here and is gone: it is an SQS queue, a Pub/Sub
// topic or a Kafka topic that happens to be on the receiving end of a
// dead-lettering line, and Kafka has no such thing at all. What made it a DLQ
// was always the edge. See docs/roles.md.
export const MESSAGING = shelf('Messaging & Streaming', {
  'message-queue': {
    title: 'Message Queue',
    sigil: <path d="M3.4 5.8h17.2v12.4H3.4ZM3.4 5.8 12 13.2l8.6-7.4" />,
  },
  'pubsub-topic': {
    title: 'Pub/Sub Topic',
    sigil: (
      <>
        <circle cx="12" cy="18.6" r="1.3" />
        <path d="M8.2 14.8a5.4 5.4 0 0 1 7.6 0M4.8 11.4a10.2 10.2 0 0 1 14.4 0" />
      </>
    ),
  },
  'event-stream': {
    title: 'Event Stream',
    sigil: <path d="M3.4 7.2h13M3.4 12h14.8M17 9.4 19.6 12 17 14.6M3.4 16.8h13" />,
  },
  'event-bus': {
    title: 'Event Bus',
    sigil: <path d="M3.4 12h17.2M7.6 12V6.4M12 12v5.6M16.4 12V6.4" />,
  },
  'task-queue': {
    title: 'Task Queue',
    sigil: <path d="M4.6 4.6h14.8v14.8H4.6ZM8.4 12l2.8 2.8L16 9" />,
  },
  'change-data-capture': {
    title: 'Change Data Capture',
    sigil: <path d="M9 5.2 15.6 16.4H2.4ZM17.6 10.8h4.2M19.6 8.6l2.2 2.2-2.2 2.2" />,
  },
})
