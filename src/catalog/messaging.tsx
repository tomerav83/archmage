import { shelf } from './shelf'

// Messaging & Streaming. C4-PlantUML has one Queue stereotype for all of this,
// which is why every async system it draws looks the same. The envelope is the
// message and the flap is what tells it from the dead letter beneath it.
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
  'dead-letter-queue': {
    title: 'Dead-Letter Queue',
    sigil: <path d="M3.4 6.4h17.2v11.2H3.4ZM8.4 9.4l7.2 5.2M15.6 9.4l-7.2 5.2" />,
  },
  'change-data-capture': {
    title: 'Change Data Capture',
    sigil: <path d="M9 5.2 15.6 16.4H2.4ZM17.6 10.8h4.2M19.6 8.6l2.2 2.2-2.2 2.2" />,
  },
})
