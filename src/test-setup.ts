// jsdom has none and React Flow measures every node with one, so every suite
// that renders a board needs it.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
