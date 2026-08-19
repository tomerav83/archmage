import { act, cleanup, type RenderResult, render } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { logoFor, monogram, TECH, TechLogo } from './technology'

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

describe('the initials, for a product with no mark', () => {
  it('takes one letter from each of two words', () => {
    expect(monogram('Event Hubs')).toBe('EH')
  })

  it('takes two letters from one word', () => {
    expect(monogram('Redpanda')).toBe('Re')
  })

  // What tells Amazon SQS from Amazon SNS is never the word Amazon.
  it('drops the vendor the shortlist already drops', () => {
    expect(monogram('Amazon SQS')).toBe('SQ')
    expect(monogram('Amazon SNS')).toBe('SN')
    expect(monogram('Azure Event Grid')).toBe('EG')
  })

  it('does not count a version as a word', () => {
    expect(monogram('PostgreSQL 16')).toBe('Po')
    expect(monogram('Apache Kafka 3.7')).toBe('Ka')
  })

  it('marks a name that is only a version rather than drawing nothing', () => {
    expect(monogram('16')).toBe('16')
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

  it('wears initials where the catalogue has no line, never nothing', async () => {
    const { container } = await draw()

    // The known one landing is what says the chunk has arrived, so this one is
    // initialled because the catalogue has no line for it.
    expect(container.querySelector('[title=known] svg')).toBeTruthy()
    expect(container.querySelector('[title=unknown] svg')).toBeNull()
    expect(container.querySelector('[title=unknown] .mono-mark')?.textContent).toBe('Dy')
  })
})
