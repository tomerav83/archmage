import { TYPES, type TypeKey } from './c4'

// Wire format for palette → canvas drags. Kept in one place so the MIME type
// and the validation of what comes back can't drift apart.
const MIME = 'application/x-archmage-element'

export function setDraggedType(dt: DataTransfer, key: TypeKey) {
  dt.setData(MIME, key)
  dt.effectAllowed = 'move'
}

export function readDraggedType(dt: DataTransfer): TypeKey | null {
  const key = dt.getData(MIME)
  // hasOwn, not `in`: `in` walks the prototype, so a drag carrying "toString"
  // would pass and hand the canvas a function for an element type.
  return Object.hasOwn(TYPES, key) ? (key as TypeKey) : null
}
