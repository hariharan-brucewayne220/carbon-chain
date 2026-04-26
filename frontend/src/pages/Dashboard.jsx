import { useState } from 'react'
import MapView from '../components/MapView'
import ComplianceBadge from '../components/ComplianceBadge'
import { STATUS_META } from '../lib/constants'
import { fmtNum } from '../data/seed'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-lg px-4 py-3.5" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold" style={{ color: color || '#f1f5f9', fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{sub}</div>}
    </div>
  )
}

function SidebarFilter({ label, children }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] mb-1.5" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{label}</div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded px-2.5 py-1.5 text-xs"
      style={{
        backgroundColor: '#334155', border: '1px solid #475569',
        color: '#f1f5f9', fontFamily: 'Inter, sans-serif', outline: 'none',
      }}
    >
      {options.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  )
}

function FacilityRow({ f, onClick }) {
  const latest = f.reports[f.reports.length - 1]
  const m = STATUS_META[f.status || 'nodata']
  return (
    <button
      onClick={() => onClick(f)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors hover:bg-carbon-elevated"
      style={{ borderBottom: '1px solid #0f172a' }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.fg, boxShadow: `0 0 5px ${m.fg}` }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate" style={{ color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>{f.facilityName}</div>
        <div className="text-[10px] truncate" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{f.orgName}</div>
      </div>
      {latest && (
        <span className="text-[10px] shrink-0" style={{ color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
          {fmtNum(latest.co2Tonnes)} t
        </span>
      )}
    </button>
  )
}

export default function Dashboard({ facilities, onOpenFacility }) {
  const [statusFilter, setStatusFilter]   = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [search, setSearch]               = useState('')
  const [selectedId, setSelectedId]       = useState(null)

  const compliant    = facilities.filter((f) => f.status === 'compliant').length
  const nonCompliant = facilities.filter((f) => f.status === 'violation').length
  const totalCO2     = facilities.reduce((s, f) => {
    const r = f.reports[f.reports.length - 1]
    return s + (r ? r.co2Tonnes : 0)
  }, 0)

  const industries = ['all', ...Array.from(new Set(facilities.map((f) => f.industryType)))]

  const filtered = facilities.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false
    if (industryFilter !== 'all' && f.industryType !== industryFilter) return false
    if (search && !f.orgName.toLowerCase().includes(search.toLowerCase()) &&
        !f.facilityName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleSelectFacility(f, openDetail = false) {
    setSelectedId(f.id)
    if (openDetail) onOpenFacility(f)
  }

  return (
    <div className="absolute inset-0" style={{ top: 56 }}>
      {/* map */}
      <MapView
        facilities={filtered}
        selectedId={selectedId}
        onSelectFacility={handleSelectFacility}
      />

      {/* sidebar */}
      <div
        className="absolute top-0 left-0 bottom-0 flex flex-col scrollable"
        style={{ width: 300, backgroundColor: 'rgba(15,23,42,0.95)', borderRight: '1px solid #1e293b', zIndex: 10 }}
      >
        {/* stats */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b" style={{ borderColor: '#1e293b' }}>
          <StatCard label="Facilities" value={facilities.length} />
          <StatCard label="Compliant" value={`${Math.round(compliant / Math.max(facilities.length, 1) * 100)}%`} color="#10b981" />
          <StatCard label="Non-Compliant" value={nonCompliant} color="#ef4444" />
          <StatCard label="Total CO₂" value={`${(totalCO2 / 1000).toFixed(0)}k t`} />
        </div>

        {/* filters */}
        <div className="p-3 space-y-3 border-b" style={{ borderColor: '#1e293b' }}>
          <SidebarFilter label="Search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Org or facility name…"
              className="w-full rounded px-2.5 py-1.5 text-xs"
              style={{
                backgroundColor: '#334155', border: '1px solid #475569',
                color: '#f1f5f9', fontFamily: 'Inter, sans-serif', outline: 'none',
              }}
            />
          </SidebarFilter>
          <SidebarFilter label="Status">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'compliant',  label: 'Compliant' },
                { value: 'improving',  label: 'Improving' },
                { value: 'violation',  label: 'Non-Compliant' },
                { value: 'nodata',     label: 'No Data' },
              ]}
            />
          </SidebarFilter>
          <SidebarFilter label="Industry">
            <Select
              value={industryFilter}
              onChange={setIndustryFilter}
              options={industries.map((i) => ({ value: i, label: i === 'all' ? 'All industries' : i }))}
            />
          </SidebarFilter>
        </div>

        {/* facility list */}
        <div className="flex-1 scrollable">
          <div className="px-3 py-2 text-[9px] uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} facilities
          </div>
          {filtered.map((f) => (
            <FacilityRow key={f.id} f={f} onClick={(fac) => onOpenFacility(fac)} />
          ))}
        </div>
      </div>
    </div>
  )
}
