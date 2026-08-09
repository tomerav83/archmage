import { describe, expect, it } from 'vitest'
import { KINDS } from './kinds'

describe('catalog', () => {
  it('loads the core kinds', () => {
    expect(Object.keys(KINDS).sort()).toEqual(['actor', 'app', 'component', 'group', 'store', 'system'])
  })

  it('does not answer for keys off Object.prototype', () => {
    expect(KINDS['constructor']).toBeUndefined()
    expect(KINDS['__proto__']).toBeUndefined()
  })
})
