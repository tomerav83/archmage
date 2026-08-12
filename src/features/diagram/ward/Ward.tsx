import { useMemo } from 'react'
import './ward.css'

// A seventeen-mark alphabet on a 12×12 box centred on the origin. Chisel
// strokes, not calligraphy — they set beside the engraved type on the card.
const RUNES = [
  'M-4-6V6M-4 0 3-6',
  'M-4-6H4M0-6V6',
  'M-4 6 0-6 4 6M-2 1H2',
  'M-4-6V6H3M-4 0H2',
  'M4-6H-4V6H4',
  'M0-6V6M-4-2H4',
  'M-4-6 4 6M4-6-4 6',
  'M-4-6V6M-4-6 3 0-4 4',
  'M-3-6a3 3 0 1 0 0 6M-3 0V6',
  'M-4-6 0 0-4 6M0 0H4',
  'M-4-4H4M-4 4H4M0-6V6',
  'M-4-6H4L-4 6H4',
  'M0-6-4 2H4Z',
  'M-4-6V6M4-6V6M-4 0H4',
  'M-3-6H3M0-6V6M-3 6H3',
  'M0-6V6M0-2 4-6M0-2-4-6',
  'M-4 0 0-6 4 0 0 6Z',
]

// Everything is drawn on a 100-unit radius. The card covers the middle, so the
// figure lives in the ring outside it — nothing is inscribed where it can't be
// seen. 0° is north; the ward reads clockwise from there.
const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [+(r * Math.sin(a)).toFixed(2), +(-r * Math.cos(a)).toFixed(2)] as const
}

// Same element, same ward, every time — but no two elements share one.
const hash = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function Ward({ id }: { id: string }) {
  const { runes, seats } = useMemo(() => {
    const seed = hash(id)
    return {
      runes: Array.from({ length: 40 }, (_, i) => ({
        a: i * 9,
        d: RUNES[(seed + i * 5) % RUNES.length],
      })),
      seats: [0, 120, 240].map((a, i) => ({
        a,
        p: pt(62, a),
        d: RUNES[(seed * 3 + i * 6 + 1) % RUNES.length],
      })),
    }
  }, [id])

  return (
    <svg className="c4-ward" viewBox="-115 -115 230 230" aria-hidden>
      {/* the rule, drawn once round clockwise from north as the press is held */}
      <circle
        className="c4-ward-rule"
        r="100"
        strokeWidth="1.5"
        pathLength="1"
        strokeDasharray="1"
        transform="rotate(-90)"
      />

      <g className="c4-ward-runes">
        <circle className="c4-ward-dim" r="96" strokeWidth="1" />
        <circle className="c4-ward-dim" r="85" strokeWidth="1" />
        <circle className="c4-ward-dim" r="98" strokeWidth="3.4" strokeDasharray="0.8 5" />
        {runes.map(({ a, d }) => (
          <path
            key={a}
            d={d}
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${a}) translate(0 -90.5) scale(0.85)`}
          />
        ))}
      </g>

      <g className="c4-ward-inner">
        <circle className="c4-ward-dim" r="78" strokeWidth="1" />
        <path
          className="c4-ward-dim"
          d={`M${seats.map(({ p }) => p.join(' ')).join('L')}Z`}
          strokeWidth="1.2"
        />
        {[60, 180, 300].map((a) => {
          const [x1, y1] = pt(66, a)
          const [x2, y2] = pt(85, a)
          return (
            <line key={a} className="c4-ward-dim" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.1" />
          )
        })}
        {seats.map(({ a, p: [cx, cy], d }) => (
          <g key={a}>
            <circle className="c4-ward-disc" cx={cx} cy={cy} r="15" />
            <circle cx={cx} cy={cy} r="15" strokeWidth="1.4" />
            <circle className="c4-ward-dim" cx={cx} cy={cy} r="12" strokeWidth="0.8" />
            <path
              d={d}
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`translate(${cx} ${cy}) rotate(${a}) scale(1.05)`}
            />
          </g>
        ))}
      </g>
    </svg>
  )
}
