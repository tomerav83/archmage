import { useCallback, useRef, type DragEvent } from 'react'

// The interaction layer: the only place that knows about screen coordinates, the
// pane's bounding box, or the browser's drag-and-drop API. Everything it learns
// gets turned into one call to addBlock — the board never sees a DragEvent.

/** `dragKey` is the dataTransfer key a drag source writes its kind under; the caller
 *  owns that constant since it also owns the drag source. */
export function useBlockDrop(
  addBlock: (kind: string, at: { x: number; y: number }) => void,
  dragKey: string,
) {
  const pane = useRef<HTMLElement>(null)

  /** A drop lands where the pointer is; a click or an Enter on a palette chip lands
   *  in the middle of the view. */
  const place = useCallback(
    (kind: string, at?: { x: number; y: number }) => {
      const box = pane.current?.getBoundingClientRect()
      addBlock(
        kind,
        at ?? { x: (box?.left ?? 0) + (box?.width ?? 0) / 2, y: (box?.top ?? 0) + (box?.height ?? 0) / 2 },
      )
    },
    [addBlock],
  )

  const onDrop = useCallback(
    (ev: DragEvent) => {
      ev.preventDefault()
      place(ev.dataTransfer.getData(dragKey), { x: ev.clientX, y: ev.clientY })
    },
    [place, dragKey],
  )

  const onDragOver = useCallback((ev: DragEvent) => {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
  }, [])

  return { pane, place, onDrop, onDragOver }
}
