// The public surface: the state hook, and the interaction hook that turns DOM events
// into calls on it. codec.ts and the two *-actions.ts files are internals — nothing
// outside builds, parses or mutates a board by hand.
export { useBoard } from './use-board'
export { useBlockDrop } from './use-block-drop'
