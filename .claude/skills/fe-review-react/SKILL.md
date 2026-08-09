---
name: fe-review-react
description: React correctness pass of a frontend review — effect misuse and derived state, dependency and cleanup bugs, list keys, controlled inputs, refs, hook rules, state duplication, stale closures. Use when reviewing React component code, or as pass 3 of /frontend-review.
---

# React correctness pass (REACT)

An effect is for synchronising with something **outside** React. Anything
computable during render is a bug, not a style preference.

| ID | Check | How to verify | Default sev |
|---|---|---|---|
| REACT-01 | No effect computes derived state | Any `useEffect` whose only job is `setX(f(props, state))` — replace with a value computed in render or `useMemo` | major |
| REACT-02 | Dependency arrays are honest | Every reactive value read in the effect appears in its deps; no lint suppression; an empty array on an effect that reads props/state is a fail | major |
| REACT-03 | Effects clean up | If the app has effects but none creates a subscription, timer, listener or request, that is a `PASS` — only `N/A` when there are no effects at all. Otherwise each must tear down in the returned function, and async effects must handle the unmount/stale-response race | major |
| REACT-04 | Keys are identity, not position | Array index as `key` on a list that can reorder, filter, or delete from the middle | major |
| REACT-05 | One source of truth | The same fact is not stored in two states, or in state *and* derivable from another state/prop/URL; the derived copy must go | major |
| REACT-06 | Controlled inputs stay controlled | `value` is never `undefined`/`null`; no switching between `value` and `defaultValue`; every controlled input has an `onChange` | major |
| REACT-07 | Hooks obey the rules | No hook inside a condition, loop, callback or after an early return; hooks only in components/custom hooks | blocker |
| REACT-08 | Refs used correctly | Refs are not read or written during render for render-affecting data, DOM is not mutated behind React's back, `ref.current` null is handled | major |
| REACT-09 | No stale closures | Handlers or timers capturing state from an earlier render — updates that read previous state use the functional form of the setter | major |
| REACT-10 | State updates are immutable | No in-place `push`/`splice`/property assignment on state objects or arrays before setting them | blocker |
| REACT-11 | Promises are handled | Every async call in an event handler or effect has a rejection path. An explicit `void` discard counts as handled — flag only promises left dangling with no `void`, `await`, `catch` or `then` | major |
| REACT-12 | Components stay stable | No component or hook defined inside another component's render (remounts the subtree every render) | major |
| REACT-13 | Context is shaped sanely | Context carries what its consumers actually read; unrelated frequently-changing data is not bundled into one provider | minor |
| REACT-14 | Render is pure | No mutation of props/module state, no DOM reads/writes, no storage or network calls, no `Math.random()`/`Date.now()` used for identity, during render. **Carve-out:** a `useState`/`useRef` lazy initializer (`useState(loadFromStorage)`) runs once at mount, not on every render — reading storage, minting an id or repairing a corrupt value there is the documented pattern and a `PASS`. The rule is about work in the render body proper | major |
| REACT-15 | Boolean and index rendering guards | `{count && <X/>}` renders a literal `0`; `{list.length && ...}` same class of bug — use an explicit comparison | minor |
| REACT-16 | Expensive initial state is lazy | `useState(expensiveFn())` runs on every render and throws the result away; it must be `useState(() => expensiveFn())`. Same for `useRef(makeThing())` where the constructor is costly. `FAIL` only when the initializer parses, reads storage, builds a large structure, or walks data — a literal or a cheap object is a `PASS` | major |
| REACT-17 | No nested render functions | A `renderX()` helper returning JSX inside a component body: it grows unbounded, cannot be memoized, and hides a component that wants extracting. Extract it. A trivial one-line map callback inline in JSX is not this — `FAIL` on a named render helper defined in the component body | minor |
