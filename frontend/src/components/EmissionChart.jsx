import { STATUS_META } from '../lib/constants'

export default function EmissionChart({ reports, baseline, target, height = 280 }) {
  const w = 560, h = height
  const padL = 56, padR = 80, padT = 24, padB = 36
  const innerW = w - padL - padR
  const innerH = h - padT - padB

  if (!reports || reports.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height, color: '#475569', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        No emission history yet.
      </div>
    )
  }

  const maxY = Math.max(baseline * 1.15, ...reports.map((r) => r.co2Tonnes))
  const yScale = (v) => padT + innerH - (v / maxY) * innerH
  const xStep  = innerW / Math.max(1, reports.length)
  const barW   = Math.min(44, xStep * 0.55)
  const ticks  = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxY * t))

  const barColor = (r) => {
    const t = baseline * (1 - (r.percentChange ? 0.2 : 0.2)) // approximate
    if (r.meetsTarget) return STATUS_META.compliant.fg
    if (r.isReduction) return STATUS_META.improving.fg
    return STATUS_META.violation.fg
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ display: 'block' }}>
      {/* grid lines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yScale(t)} x2={w - padR} y2={yScale(t)}
            stroke="#334155" strokeWidth="0.5" strokeDasharray={i === 0 ? '' : '2 4'} opacity="0.7" />
          <text x={padL - 6} y={yScale(t) + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="JetBrains Mono, monospace">
            {t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t}
          </text>
        </g>
      ))}

      {/* baseline dashed */}
      <line x1={padL} y1={yScale(baseline)} x2={w - padR} y2={yScale(baseline)}
        stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 4" />
      <rect x={w - padR + 2} y={yScale(baseline) - 8} width="72" height="14" fill="#1e293b" stroke="#475569" strokeWidth="0.5" rx="2" />
      <text x={w - padR + 38} y={yScale(baseline) + 2} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="JetBrains Mono, monospace">BASELINE</text>

      {/* target solid */}
      <line x1={padL} y1={yScale(target)} x2={w - padR} y2={yScale(target)}
        stroke="#0ea5e9" strokeWidth="1.2" />
      <rect x={w - padR + 2} y={yScale(target) - 1} width="72" height="14" fill="#1e293b" stroke="#0ea5e9" strokeWidth="0.5" rx="2" />
      <text x={w - padR + 38} y={yScale(target) + 9} textAnchor="middle" fontSize="8" fill="#7dd3fc" fontFamily="JetBrains Mono, monospace">TARGET</text>

      {/* bars */}
      {reports.map((r, i) => {
        const x    = padL + xStep * i + (xStep - barW) / 2
        const yTop = yScale(r.co2Tonnes)
        const yBot = yScale(0)
        const c    = barColor(r)
        return (
          <g key={i}>
            <rect x={x} y={yTop} width={barW} height={yBot - yTop} fill={c} fillOpacity="0.65" rx="1" />
            <rect x={x} y={yTop} width={barW} height="2" fill={c} rx="1" />
            <text x={x + barW / 2} y={yTop - 5} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontFamily="JetBrains Mono, monospace">
              {r.co2Tonnes >= 1000 ? `${(r.co2Tonnes / 1000).toFixed(1)}k` : r.co2Tonnes}
            </text>
            <text x={x + barW / 2} y={h - padB + 14} textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="JetBrains Mono, monospace">
              {r.period}
            </text>
          </g>
        )
      })}

      {/* axes */}
      <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#475569" strokeWidth="0.6" />
      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#475569" strokeWidth="0.6" />
      <text x={padL} y={padT - 8} fontSize="8" fill="#64748b" fontFamily="JetBrains Mono, monospace">t CO₂</text>
    </svg>
  )
}
