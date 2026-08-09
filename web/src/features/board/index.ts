// The whole public surface is one hook. The codec became internals the moment the
// state hook moved in beside it — nothing outside builds or parses a board by hand.
export { useBoard } from './use-board'
