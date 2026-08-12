import { ELEMENTS, type ElementKey } from '../../c4'

// Wire format for palette → canvas drags. Kept in one place so the MIME type
// and the validation of what comes back can't drift apart.
const MIME = 'application/x-archmage-element'

export function setDraggedKind(dt: DataTransfer, key: ElementKey) {
  dt.setData(MIME, key)
  dt.effectAllowed = 'move'
}

export function readDraggedKind(dt: DataTransfer): ElementKey | null {
  const key = dt.getData(MIME)
  // hasOwn, not `in`: `in` walks the prototype, so a drag carrying "toString"
  // would pass and hand the canvas a function for an element kind.
  return Object.hasOwn(ELEMENTS, key) ? (key as ElementKey) : null
}
