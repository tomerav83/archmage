import { describe, expect, it } from 'vitest'
import { readDraggedType, setDraggedType } from './dragAndDrop'

// Enough DataTransfer for the two calls the module makes. jsdom's own is
// read-only, and a drop only ever hands us these two.
const transfer = () => {
  const held = new Map<string, string>()
  return {
    effectAllowed: '',
    setData: (type: string, value: string) => void held.set(type, value),
    getData: (type: string) => held.get(type) ?? '',
  } as unknown as DataTransfer
}

describe('palette drags', () => {
  it('round-trips an element key', () => {
    const dt = transfer()
    setDraggedType(dt, 'container')
    expect(readDraggedType(dt)).toBe('container')
  })

  it('refuses a drag that carries nothing of ours', () => {
    // A file, a link, or a drag out of another app: our MIME is empty.
    expect(readDraggedType(transfer())).toBeNull()
  })

  it('refuses a key the registry does not own', () => {
    const dt = transfer()
    dt.setData('application/x-archmage-element', 'wizard')
    expect(readDraggedType(dt)).toBeNull()
  })

  it('refuses a name off Object.prototype', () => {
    // `in` walks the prototype chain, so this is the payload that gets past a
    // naive check and lands a node whose kind is a function.
    const dt = transfer()
    dt.setData('application/x-archmage-element', 'toString')
    expect(readDraggedType(dt)).toBeNull()
  })
})
