import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Ward } from './Ward'

afterEach(cleanup)

const inscription = (id: string) =>
  [...render(<Ward id={id} />).container.querySelectorAll('path')].map((p) => p.getAttribute('d'))

describe('the ward', () => {
  it('inscribes the full band and its three medallions', () => {
    const { container } = render(<Ward id="a" />)
    expect(container.querySelectorAll('.c4-ward-runes path')).toHaveLength(40)
    expect(container.querySelectorAll('.c4-ward-disc')).toHaveLength(3)
  })

  it('draws one element the same way every time', () => {
    expect(inscription('a')).toEqual(inscription('a'))
  })

  it('draws no two elements alike', () => {
    // Ids are UUIDs in the app; these stand in for two cards on one board.
    expect(inscription('a')).not.toEqual(inscription('b'))
  })
})
