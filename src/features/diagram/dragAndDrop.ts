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
  return key in ELEMENTS ? (key as ElementKey) : null
}
