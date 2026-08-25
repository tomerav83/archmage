import { describe, expect, it } from 'vitest'
import { ACTIONS, type Action, actionsFor, attach } from './actions'
import type { ElementNodeType } from './ElementNode'

const subject = (data: ElementNodeType['data'], parentId?: string): ElementNodeType => ({
  id: 'a',
  type: 'element',
  position: { x: 100, y: 40 },
  parentId,
  data,
})

// A row by name, so a test says which move it is driving rather than counting
// down the table.
const move = (title: string) => ACTIONS.find((a) => a.title === title) as Action

const dropped = (node: ElementNodeType, title = 'Add database') =>
  attach([node], node, move(title), 'b')[1] as ElementNodeType

describe('what a type can have done to it', () => {
  // Written per type rather than per shelf, so shelf-mates disagree: a
  // relational database replicates and a file system does not, and neither of
  // them is a matter of which shelf they stand on.
  it("is the type's own, not its category's", () => {
    expect(actionsFor('relational-db').map((a) => a.title)).toContain('Add read replica')
    expect(actionsFor('file-system')).toEqual([])
  })

  it('is empty for anything with nothing to do to it', () => {
    expect(actionsFor('person')).toEqual([])
    expect(actionsFor('system-boundary')).toEqual([])
  })
})

describe('attaching what the move names', () => {
  it('stands the new element beside the subject, in the frame the subject is in', () => {
    const held = dropped(subject({ type: 'container', label: 'Orders' }, 'frame'))
    expect(held.parentId).toBe('frame')
    expect(held.position.y).toBe(40)
    expect(held.position.x).toBeGreaterThan(100)
  })

  it('names it off the registry', () => {
    expect(dropped(subject({ type: 'container', label: 'Orders' })).data.label).toBe(
      'Relational Database',
    )
  })

  // The point of it: a replica off a PostgreSQL primary is a PostgreSQL replica
  // without anybody saying so.
  it('inherits the technology where the new type has a line for it', () => {
    const primary = subject({ type: 'relational-db', label: 'Orders DB', technology: 'PostgreSQL' })
    expect(dropped(primary, 'Add read replica').data.technology).toBe('PostgreSQL')
  })

  it('leaves it bare where it would be nonsense', () => {
    // Go is what the service is written in; the database it is handed is not
    // written in Go.
    const service = subject({ type: 'container', label: 'Orders', technology: 'Go' })
    expect(dropped(service).data.technology).toBeUndefined()
  })
})
