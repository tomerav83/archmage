import type { ElementType } from '../c4'

// Data Stores. What it holds is the mark; what it runs is the technology —
// Postgres and MySQL are one type here, told apart in the field beneath the
// name. The drum belongs to Container, so a relation draws as a table.
export const DATA_STORES = {
  'relational-db': {
    title: 'Relational Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 4.8h17.2v14.4H3.4Z" />
        <path d="M3.4 9.6h17.2M12 9.6v9.6" />
      </>
    ),
  },
  'document-db': {
    title: 'Document Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M5.8 3.2h8.6l4.2 4.2v13.4H5.8Z" />
        <path d="M14.4 3.2v4.2h4.2" />
      </>
    ),
  },
  'key-value-store': {
    title: 'Key-Value Store',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <circle cx="7.4" cy="12" r="3.8" />
        <path d="M11.2 12h9.4M17.6 12v3.4M14.6 12v2.6" />
      </>
    ),
  },
  'wide-column-store': {
    title: 'Wide-Column Store',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 4.8h17.2v14.4H3.4Z" />
        <path d="M9.2 4.8v14.4M14.8 4.8v14.4" />
      </>
    ),
  },
  'graph-db': {
    title: 'Graph Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <circle cx="12" cy="5.8" r="2.6" />
        <circle cx="5.6" cy="17.6" r="2.6" />
        <circle cx="18.4" cy="17.6" r="2.6" />
        <path d="M10.7 8.1 6.9 15.3M13.3 8.1l3.8 7.2M8.2 17.6h7.6" />
      </>
    ),
  },
  'timeseries-db': {
    title: 'Time-Series Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.8 3.8v16.4h16.4" />
        <path d="M6.6 16.4 10.4 11l3.4 2.6 5.2-6.4" />
      </>
    ),
  },
  'vector-db': {
    title: 'Vector Database',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.8 20.2 15.8 8.2M10.6 8.2h5.2v5.2" />
        <circle cx="6.2" cy="7.6" r="1.3" />
        <circle cx="19" cy="18.4" r="1.3" />
      </>
    ),
  },
  'search-index': {
    title: 'Search Index',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <circle cx="10.4" cy="10.4" r="6.4" />
        <path d="M15.2 15.2 20.6 20.6" />
      </>
    ),
  },
  'object-store': {
    title: 'Blob / Object Store',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.6 5.6h16.8l-1.8 14.8H5.4Z" />
        <path d="M4.2 10.4h15.6" />
      </>
    ),
  },
  'file-system': {
    title: 'File System',
    level: 'container',
    category: 'Data Stores',
    sigil: <path d="M3.4 5.2h6.2l2 2.8h9v12H3.4Z" />,
  },
  'data-warehouse': {
    title: 'Data Warehouse',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 10.6 12 4.2l8.6 6.4v9.4H3.4Z" />
        <path d="M9.2 20v-5.8h5.6V20" />
      </>
    ),
  },
  'data-lake': {
    title: 'Data Lake',
    level: 'container',
    category: 'Data Stores',
    sigil: (
      <>
        <path d="M3.4 7.6q2.15-2 4.3 0t4.3 0 4.3 0 4.3 0" />
        <path d="M3.4 13q2.15-2 4.3 0t4.3 0 4.3 0 4.3 0" />
        <path d="M3.4 18.4q2.15-2 4.3 0t4.3 0 4.3 0 4.3 0" />
      </>
    ),
  },
} satisfies Record<string, ElementType>
