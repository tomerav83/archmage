import { act, cleanup, type RenderResult, render } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { logoFor, TECH, TechLogo } from './technology'

// Three hand-written entries, so jsdom never parses five megabytes. The match
// is the thing under test and it is pure data — what the catalogue holds only
// has to be shaped like the real one.
vi.mock('simple-icons', () => ({
  siPostgresql: { title: 'PostgreSQL', slug: 'postgresql', hex: '4169E1', path: 'M0 0h24v24H0z' },
  siApache: { title: 'Apache', slug: 'apache', hex: 'D22128', path: 'M1 1h22v22H1z' },
  siApachekafka: {
    title: 'Apache Kafka',
    slug: 'apachekafka',
    hex: '231F20',
    path: 'M2 2h20v20H2z',
  },
}))

afterEach(cleanup)

const byTitle = async () => (await TECH).byTitle

describe('the match from free text to a mark', () => {
  it('sheds a version', async () => {
    expect(logoFor(await byTitle(), 'PostgreSQL 16')?.title).toBe('PostgreSQL')
  })

  it('takes the longest leading run of words, not the first', async () => {
    expect(logoFor(await byTitle(), 'Apache Kafka consumer')?.title).toBe('Apache Kafka')
  })

  it('ignores case and stray spacing', async () => {
    expect(logoFor(await byTitle(), '  postgresql  ')?.title).toBe('PostgreSQL')
  })

  it('leaves text the catalogue has no line for unmarked', async () => {
    expect(logoFor(await byTitle(), 'DynamoDB')).toBeUndefined()
    expect(logoFor(await byTitle(), '')).toBeUndefined()
  })

  // The version rides *behind* the name; a name behind other words is a
  // sentence, and the catalogue does not read sentences.
  it('does not match a name that is not leading', async () => {
    expect(logoFor(await byTitle(), 'managed PostgreSQL')).toBeUndefined()
  })
})

describe('the mark', () => {
  // Both at once, so one render answers both questions.
  // Rendered inside an awaited act, because the mark arrives a tick after the
  // first paint — which is the whole point of the lazy chunk.
  const draw = async () => {
    let view: RenderResult | undefined
    await act(async () => {
      view = render(
        <>
          <p title="known">
            <Suspense>
              <TechLogo name="PostgreSQL 16" />
            </Suspense>
          </p>
          <p title="unknown">
            <Suspense>
              <TechLogo name="DynamoDB" />
            </Suspense>
          </p>
        </>,
      )
    })
    return view as RenderResult
  }

  it('draws the brand path in the surrounding ink', async () => {
    const { container } = await draw()

    const path = container.querySelector('[title=known] path')
    expect(path?.getAttribute('d')).toBe('M0 0h24v24H0z')
    // Colour carries the level, never the brand.
    expect(path?.getAttribute('fill')).toBe('currentColor')
  })

  it('draws nothing for text it does not know', async () => {
    const { container } = await draw()

    // The known one landing is what says the chunk has arrived, so this one is
    // bare because the catalogue has no line for it.
    expect(container.querySelector('[title=known] svg')).toBeTruthy()
    expect(container.querySelector('[title=unknown] svg')).toBeNull()
  })
})
