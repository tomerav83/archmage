// jsdom lays nothing out, so every card measures 0×0 and React Flow keeps a
// card it has not measured hidden — and draws no edge to it. One size for
// everything is enough: the suite asks what a line says and how it is drawn,
// never where it runs.
for (const [prop, size] of [
  ['offsetWidth', 200],
  ['offsetHeight', 80],
] as const)
  Object.defineProperty(HTMLElement.prototype, prop, { get: () => size })

// React Flow reads the viewport's zoom off its transform matrix, and jsdom has
// no matrix to read. Unzoomed is the truth on a board nothing has panned.
globalThis.DOMMatrixReadOnly = class {
  m22 = 1
} as unknown as typeof DOMMatrixReadOnly

// jsdom has none and React Flow measures every node with one, so every suite
// that renders a board needs it. It reports the moment it is asked to watch,
// which is what hands React Flow the handle bounds an edge is drawn between —
// zeroes, since jsdom lays nothing out, but present, which is the difference
// between an edge in the DOM and no edge at all.
globalThis.ResizeObserver = class {
  cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
  }
  observe(target: Element) {
    const entry = { target, contentRect: target.getBoundingClientRect() }
    this.cb([entry as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}
