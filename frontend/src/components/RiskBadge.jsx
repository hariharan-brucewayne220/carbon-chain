import { RISK_META } from '../lib/constants'

const RATING_COLOR = {
  'Very High':        '#ef4444',
  'Relatively High':  '#f59e0b',
  'Relatively Moderate': '#94a3b8',
  'Relatively Low':   '#64748b',
  'Very Low':         '#475569',
  'Unknown':          '#475569',
}

export default function RiskBadge({ kind, rating, nri }) {
  const m = RISK_META[kind]
  if (!m) return null
  const ratingColor = RATING_COLOR[rating] || '#64748b'
  return (
    <div
      className="flex items-center gap-3 rounded-md px-3 py-2.5"
      style={{ backgroundColor: `${m.bg}30`, border: `1px solid ${m.bg}60` }}
    >
      <span className="text-base leading-none">{m.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest font-medium" style={{ color: m.accent, fontFamily: 'Inter, sans-serif' }}>
          {m.label}
        </div>
        <div className="text-xs mt-0.5 truncate" style={{ color: ratingColor, fontFamily: 'Inter, sans-serif' }}>
          {rating || 'Unknown'}
        </div>
      </div>
      {nri != null && (
        <div className="text-right shrink-0">
          <div className="text-xs font-semibold" style={{ color: m.accent, fontFamily: "'JetBrains Mono', monospace" }}>
            {nri}
          </div>
          <div className="text-[9px]" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>NRI</div>
        </div>
      )}
    </div>
  )
}

export function RiskLevelTag({ level }) {
  const colors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' }
  const c = colors[level] || '#64748b'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest"
      style={{ backgroundColor: `${c}20`, color: c, border: `1px solid ${c}40` }}
    >
      {level}
    </span>
  )
}
