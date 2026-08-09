# archmage
Archmage is an AI-powered system architecture assistant that understands, manages, and continuously improves your system design through RAG-powered knowledge retrieval.

## Board editor

    docker compose up -d      # http://localhost:5173
    docker compose logs -f
    docker compose down

    cd web && npm run check   # format, lint, typecheck, tests — what CI runs

### Deploying `web/dist/`

The built HTML carries the Content-Security-Policy in a `<meta>` tag, which is enough
for every directive except `frame-ancestors` — the spec says to ignore that one there.
So the build also writes `dist/_headers`, which Netlify and Cloudflare Pages read to
send the same policy as a response header. On any other host, copy that file's policy
into the server config: on nginx it is one `add_header Content-Security-Policy` line.
The string has one source, `CSP` in `web/vite.config.ts`; `vite preview` sends it too.
