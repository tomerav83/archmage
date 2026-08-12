import { describe, expect, it } from 'vitest'
import { defaults, KINDS } from './kinds'
import { node } from './schema'

describe('catalog', () => {
  // The blueprint's real job is done at build time, so the assertions here are the
  // expect-error directives: tsc fails if a line below stops being an error.
  it('checks an entry against the blueprint', () => {
    const meta = { kind: 'x', base: 'app', label: 'X' } as const
    const ok = node({ ...meta, props: { description: { type: 'string' } } })
    // @ts-expect-error — the blueprint has no "colour"
    node({ ...meta, props: { colour: { type: 'string' } } })
    // @ts-expect-error — external is a boolean property
    node({ ...meta, props: { external: { type: 'string' } } })
    // @ts-expect-error — "archived" is not a status the blueprint admits
    node({ ...meta, props: { status: { type: 'string', enum: ['live'], default: 'archived' } } })
    // @ts-expect-error — the glyph is the component, not a name to look up
    node({ ...meta, icon: 'lucide:rocket', props: {} })
    expect(ok.props.description.type).toBe('string')
  })

  it('starts a block on the defaults its kind declares', () => {
    expect(defaults(KINDS['actor'])).toEqual({ external: true })
    expect(defaults(KINDS['system'])).toEqual({ external: false, status: 'live' })
    expect(defaults(KINDS['group'])).toEqual({})
  })

  it('loads the core kinds', () => {
    expect(Object.keys(KINDS).sort()).toEqual(['actor', 'app', 'component', 'group', 'store', 'system'])
  })

  it('does not answer for keys off Object.prototype', () => {
    expect(KINDS['constructor']).toBeUndefined()
    expect(KINDS['__proto__']).toBeUndefined()
  })
})
