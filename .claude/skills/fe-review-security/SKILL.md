---
name: fe-review-security
description: Security pass of a frontend review — XSS sinks, URL and link injection, untrusted input parsing, secrets in client code, storage of sensitive data, CSP, postMessage/iframe, third-party and dependency risk. Use when reviewing frontend code for security, or as pass 4 of /frontend-review.
---

# Security pass (SEC)

Client-side trust boundaries: anything from the user, the URL, storage, a file,
a message, or a third-party response. JSX escaping covers text interpolation
and nothing else.

| ID | Check | How to verify | Default sev |
|---|---|---|---|
| SEC-01 | No unsanitized HTML sink | `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` fed by anything not a literal — must pass through DOMPurify or equivalent | blocker |
| SEC-02 | URLs are validated before use | Data-derived `href`/`src`/`action`/`window.open`/`location` assignment must reject `javascript:`, `data:`, `vbscript:` — allowlist the scheme | blocker |
| SEC-03 | Cross-origin links are isolated | `target="_blank"` carries `rel="noopener noreferrer"`. No `target="_blank"` authored anywhere in scope → **`N/A`**, reason `no new-tab links` — the construct governs, do not record a free `PASS` | minor |
| SEC-04 | No secrets in the client | API keys, tokens, private endpoints in source or in `VITE_`/`NEXT_PUBLIC_`-prefixed env vars — those ship to the browser | blocker |
| SEC-05 | Sensitive data is not in web storage | Tokens, credentials or personal data in `localStorage`/`sessionStorage`; sessions belong in `httpOnly; Secure; SameSite` cookies | blocker |
| SEC-06 | Untrusted input is validated after parsing | For `JSON.parse` of storage, a URL param, an uploaded file or a response: list every field the validator touches, then list every field the app later reads or calls a method on. **A field that is presence-checked or defaulted but never type-checked, and is later passed to a string/array/number method, is a `FAIL`** — `?? ''` does not stop a number from reaching `.trim()`. Also require: the parse is guarded against throwing, and attacker keys (`__proto__`, `constructor`, `prototype`) cannot reach an object merge or a `Record` lookup | blocker |
| SEC-07 | File and drag input is constrained | Uploaded/dropped files are checked for type and size before reading; `dataTransfer` payloads are treated as untrusted; no unbounded `file.text()` into memory | major |
| SEC-08 | Cross-document messaging is checked | `postMessage` listeners verify `event.origin` and payload shape; `postMessage` calls target a specific origin, not `*`; third-party `iframe`s carry `sandbox` and a minimal `allow` | major |
| SEC-09 | CSP exists and is strict | Three independent clauses — verdict each, then report the row on the weakest, naming which clause failed. (i) A policy is served at all; absent is a `FAIL` at `major`. (ii) No `unsafe-inline`/`unsafe-eval`. (iii) `frame-ancestors` and `object-src 'none'` present **and** effective. `frame-ancestors` is ignored in a `<meta>` policy by spec, so judge it on **what the production artefact ships**: a header emitted by the app's own production server or deploy config is effective; a header emitted only by a dev or preview server the deployment does not run is not, and meta-only delivery fails clause (iii) however good the string is. Say which artefact you checked. **Forced relaxation:** `style-src 'unsafe-inline'` that a rendering library requires for inline style *attributes* and that is narrowed by a stricter `style-src-elem` is a `PASS` on clause (ii) — the attribute channel is not a script sink and no alternative exists. An unnarrowed `unsafe-inline`, or any `unsafe-eval`, is a `FAIL`; grade it `minor` when the rest of the policy is strict, `major` otherwise | major |
| SEC-10 | No dynamic code execution | `eval`, `new Function`, `setTimeout`/`setInterval` with a string body | blocker |
| SEC-11 | Third-party code is accounted for | Every runtime script/asset origin is intentional; remote scripts pinned with SRI; no unexpected analytics or CDN calls | major |
| SEC-12 | Dependencies are current and clean | Run `npm audit --production` if the lockfile is present; flag unmaintained, duplicated, or pre-release/`^`-drifting critical deps | major |
| SEC-13 | Errors do not leak internals | User-facing error text does not print stack traces, file paths, tokens or raw upstream responses; no `console.log` of sensitive values in production paths | minor |
| SEC-14 | Authorization is enforced, not just hidden | Hiding a control is presentation, not access control. For every role/permission-gated action, the guard sits on the action itself (the handler or the request), the client treats the server as the authority, and role/permission facts come from the server rather than from client state a user can edit. `FAIL` on a UI that only conditionally renders the button, on a route guard with no corresponding check on the action, or on a permission flag read from `localStorage`/a URL param. `N/A` only when the app has no notion of roles or permissions | blocker |
