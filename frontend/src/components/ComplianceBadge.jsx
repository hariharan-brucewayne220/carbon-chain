import { STATUS_META } from '../lib/constants'

export default function ComplianceBadge({ status, size = 'sm' }) {
  const m = STATUS_META[status] || STATUS_META.nodata
  const px = size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5'
  const fs = size === 'lg' ? 'text-xs' : 'text-[10px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${px} ${fs}`}
      style={{ backgroundColor: m.bg, color: m.fg, border: `1px solid ${m.fg}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.fg }} />
      {m.label}
    </span>
  )
}
