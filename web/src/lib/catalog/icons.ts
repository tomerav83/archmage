// Every glyph the catalog names, registered up front: Iconify only calls
// api.iconify.design for names it does not already hold, so nothing on the
// canvas waits on a third-party request or breaks when it is unreachable.
//
// Bodies are copied verbatim from @iconify-json/lucide (a devDependency, kept
// for provenance). To add one:
//   node -e "console.log(require('@iconify-json/lucide/icons.json').icons['NAME'].body)"
import { addCollection } from '@iconify/react'

const stroke =
  'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"'

addCollection({
  prefix: 'lucide',
  width: 24,
  height: 24,
  icons: {
    user: {
      body: `<g ${stroke}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g>`,
    },
    box: {
      body: `<g ${stroke}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7l8.7 5l8.7-5M12 22V12"/></g>`,
    },
    'app-window': {
      body: `<g ${stroke}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M10 4v4M2 8h20M6 4v4"/></g>`,
    },
    database: {
      body: `<g ${stroke}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></g>`,
    },
    puzzle: {
      body: `<path ${stroke} d="M15.39 4.39a1 1 0 0 0 1.68-.474a2.5 2.5 0 1 1 3.014 3.015a1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474a2.5 2.5 0 1 0-3.014 3.015a1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474a2.5 2.5 0 1 1-3.014-3.015a1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474a2.5 2.5 0 1 0 3.014-3.015a1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>`,
    },
    group: {
      body: `<g ${stroke}><path d="M3 7V5c0-1.1.9-2 2-2h2m10 0h2c1.1 0 2 .9 2 2v2m0 10v2c0 1.1-.9 2-2 2h-2M7 21H5c-1.1 0-2-.9-2-2v-2"/><rect width="7" height="5" x="7" y="7" rx="1"/><rect width="7" height="5" x="10" y="12" rx="1"/></g>`,
    },
  },
})
