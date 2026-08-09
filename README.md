# archmage
Archmage is an AI-powered system architecture assistant that understands, manages, and continuously improves your system design through RAG-powered knowledge retrieval.

## Board editor

    docker compose up -d      # http://localhost:5173
    docker compose logs -f
    docker compose down

    cd web && npm run check   # format, lint, typecheck, tests — what CI runs

### Layout

    web/src/
      lib/       shared types and the block catalog — imports nothing of ours
      features/  board (document state + codec), canvas, inspector, palette, review
      app/       editor.tsx composes the features; no logic of its own

Dependencies flow one way — lib → features → app — and oxlint fails the build on a
violation (`web/.oxlintrc.json`). Features never import each other at runtime; the
app layer wires them together. File names say what a module does (`codec.ts`,
`use-board.ts`); a file that wants a generic name (model, utils, helpers) is
usually two files. Each feature's styles live in a `.css` beside its component;
`styles.css` is only tokens and the app frame.

### Deploying `web/dist/`

The built HTML carries the Content-Security-Policy in a `<meta>` tag, which is enough
for every directive except `frame-ancestors` — the spec says to ignore that one there.
So the build also writes `dist/_headers`, which Netlify and Cloudflare Pages read to
send the same policy as a response header. On any other host, copy that file's policy
into the server config: on nginx it is one `add_header Content-Security-Policy` line.
The string has one source, `CSP` in `web/vite.config.ts`; `vite preview` sends it too.
