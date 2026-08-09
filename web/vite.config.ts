import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 'unsafe-inline' on style-src is not optional: React Flow writes the viewport
// transform to a style attribute, and so do the block menu and the wire ghost.
// style-src-elem takes back what that gave away — the build links its CSS and
// never inlines a <style> element — while style *attributes* keep falling back
// to style-src, so a browser that does not know the directive still works.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "style-src-elem 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

// The one directive a <meta> policy cannot carry — the spec says to ignore it there —
// so it has to arrive as a header. On its own it is safe to send in dev too, where the
// full policy would block Vite's inline React Refresh preamble.
const FRAME = "frame-ancestors 'none'"

/** Build only: the dev server serves an inline React Refresh preamble that
 *  script-src 'self' would block. */
const csp = (): Plugin => ({
  name: 'archmage-csp',
  apply: 'build',
  // after the charset, which the parser wants inside the first bytes of the document
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="utf-8" />',
      `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    ),
  // frame-ancestors only counts as a header, so dist/ carries a host config for one
  // rather than leaving the artefact to be deployed without it. Emitted from the same
  // string as the meta tag, so the two cannot drift apart.
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: '_headers',
      source: `/*\n  Content-Security-Policy: ${CSP}\n`,
    })
  },
})

export default defineConfig({
  plugins: [react(), csp()],
  // One feature reaches another by name, never by counting ../ back up the tree.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Both hosts this repo owns send the framing directive as a header: docker compose
  // runs the dev server, and `vite preview` serves dist/. Policies combine, so the
  // preview header and the built meta tag both apply.
  // ponytail: a real host in front of dist/ has to send CSP itself — see the README.
  server: { headers: { 'Content-Security-Policy': FRAME } },
  preview: { headers: { 'Content-Security-Policy': CSP } },
  test: { environment: 'jsdom', globals: true },
})
