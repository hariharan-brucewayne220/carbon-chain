import EmissionChart from '../components/EmissionChart'
import ComplianceBadge from '../components/ComplianceBadge'
import RiskBadge, { RiskLevelTag } from '../components/RiskBadge'
import { ETHERSCAN_BASE } from '../lib/constants'
import { fmtNum, fmtPct } from '../data/seed'

function DetailStat({ label, value, unit, sub, highlight, valueColor }) {
  return (
    <div className="px-6 py-5">
      <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: highlight ? '#7dd3fc' : '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span style={{ fontSize: 22, color: valueColor || '#f1f5f9', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, marginTop: 2, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{sub}</div>}
    </div>
  )
}

export default function FacilityDetail({ facility, allFacilities, onBack, onOpenFacility }) {
  if (!facility) return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ top: 56, backgroundColor: '#0f172a', color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
      Facility not found.
    </div>
  )

  const f        = facility
  const target   = Math.round(f.baselineEmissions * (1 - f.reductionTarget / 100))
  const latest   = f.reports[f.reports.length - 1]
  const pctChange = latest ? ((latest.co2Tonnes - f.baselineEmissions) / f.baselineEmissions * 100) : null
  const status   = f.status || 'nodata'

  // nearby = same region (simplified: same stateCode or within ±10° lat/lng)
  const nearby = allFacilities
    .filter((n) => n.id !== f.id && (n.stateCode === f.stateCode || (Math.abs(n.lat - f.lat) < 8 && Math.abs(n.lng - f.lng) < 8)))
    .slice(0, 6)

  return (
    <div className="absolute inset-0 scrollable" style={{ top: 56, backgroundColor: '#0f172a' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
        {/* back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-5 text-xs transition-colors"
          style={{ color: '#64748b', fontFamily: 'Inter, sans-serif', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Back to Dashboard
        </button>

        {/* hero card */}
        <div className="rounded-lg overflow-hidden mb-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          {/* header row */}
          <div className="px-7 py-6 flex items-start justify-between gap-6" style={{ borderBottom: '1px solid #0f172a' }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] mb-2" style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>{f.stateCode ? `FIPS-${f.stateCode}` : 'ON-CHAIN'}</span>
                <span>·</span>
                <span style={{ color: '#94a3b8' }}>{f.industryType}</span>
                <span>·</span>
                <span>{f.lat.toFixed(3)}°N {Math.abs(f.lng).toFixed(3)}°W</span>
              </div>
              <h1 style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 700, fontSize: 28, color: '#f1f5f9', letterSpacing: '-0.01em', margin: '0 0 4px' }}>
                {f.facilityName}
              </h1>
              <div style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif', fontSize: 15 }}>{f.orgName}</div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <ComplianceBadge status={status} size="lg" />
              {f.risk?.overall && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Overall risk</span>
                  <RiskLevelTag level={f.risk.overall} />
                </div>
              )}
            </div>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 divide-x" style={{ borderColor: '#0f172a' }}>
            <DetailStat
              label="Baseline Emissions"
              value={fmtNum(f.baselineEmissions)}
              unit="t CO₂ / yr"
              sub="Registered baseline"
            />
            <DetailStat
              label={`Latest · ${latest?.period || '—'}`}
              value={latest ? fmtNum(latest.co2Tonnes) : '—'}
              unit="t CO₂"
              sub={latest ? 'On-chain record' : 'Awaiting first report'}
              highlight
            />
            <DetailStat
              label="vs Baseline"
              value={pctChange != null ? `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%` : '—'}
              sub={pctChange != null ? (pctChange < 0 ? 'Reduction achieved' : 'Increase from baseline') : ''}
              valueColor={pctChange == null ? '#475569' : pctChange < 0 ? '#10b981' : '#ef4444'}
            />
          </div>
        </div>

        {/* main grid */}
        <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* chart */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Emission History</div>
                <div className="text-base mt-0.5" style={{ color: '#f1f5f9', fontFamily: "'IBM Plex Serif', serif", fontWeight: 600 }}>
                  {f.facilityName}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[9px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {['compliant', 'improving', 'violation'].map((s) => (
                  <span key={s} className="flex items-center gap-1.5" style={{ color: s === 'compliant' ? '#10b981' : s === 'improving' ? '#f59e0b' : '#ef4444' }}>
                    <span className="w-2 h-2 inline-block" style={{ backgroundColor: 'currentColor' }} />
                    {s === 'compliant' ? 'Compliant' : s === 'improving' ? 'Improving' : 'Violation'}
                  </span>
                ))}
              </div>
            </div>
            <EmissionChart reports={f.reports} baseline={f.baselineEmissions} target={target} height={280} />
          </div>

          {/* risk panel */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                FEMA Climate Risk
              </div>
              <span className="text-[9px]" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                NRI v1.20
              </span>
            </div>
            <div className="space-y-2">
              <RiskBadge kind="flood"     rating={f.risk?.flood?.rating}     nri={f.risk?.flood?.nri}     />
              <RiskBadge kind="wildfire"  rating={f.risk?.wildfire?.rating}  nri={f.risk?.wildfire?.nri}  />
              <RiskBadge kind="hurricane" rating={f.risk?.hurricane?.rating} nri={f.risk?.hurricane?.nri} />
            </div>
            {f.risk?.overall && (
              <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #334155' }}>
                <span className="text-[9px] uppercase tracking-widest" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Overall Risk</span>
                <RiskLevelTag level={f.risk.overall} />
              </div>
            )}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #334155' }}>
              <div className="text-[9px] uppercase tracking-[0.18em] mb-2" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Location</div>
              <div className="text-xs space-y-1" style={{ color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                <div>{f.lat.toFixed(4)}°N, {Math.abs(f.lng).toFixed(4)}°W</div>
                <div style={{ color: '#64748b' }}>{f.county && `${f.county}, `}{f.stateCode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* on-chain records + nearby */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* on-chain table */}
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #0f172a' }}>
              <div>
                <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>On-Chain Verification</div>
                <div className="text-base mt-0.5" style={{ color: '#f1f5f9', fontFamily: "'IBM Plex Serif', serif", fontWeight: 600 }}>
                  Immutable Records
                </div>
              </div>
              <span className="text-[9px]" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                Sepolia Testnet
              </span>
            </div>
            <table className="w-full text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr style={{ color: '#64748b', textAlign: 'left' }}>
                  {['Period', 'CO₂', 'Δ Baseline', 'Status', 'Tx Hash'].map((h) => (
                    <th key={h} className="px-6 py-2.5 text-[9px] uppercase tracking-widest font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {f.reports.length > 0 ? f.reports.map((r, i) => {
                  const delta = ((r.co2Tonnes - f.baselineEmissions) / f.baselineEmissions * 100)
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #0f172a' }}>
                      <td className="px-6 py-3" style={{ color: '#f1f5f9' }}>{r.period}</td>
                      <td className="px-6 py-3" style={{ color: '#cbd5e1' }}>{fmtNum(r.co2Tonnes)} t</td>
                      <td className="px-6 py-3" style={{ color: delta < 0 ? '#10b981' : '#ef4444' }}>
                        {delta < 0 ? '' : '+'}{delta.toFixed(1)}%
                      </td>
                      <td className="px-6 py-3"><ComplianceBadge status={r.meetsTarget ? 'compliant' : r.isReduction ? 'improving' : 'violation'} /></td>
                      <td className="px-6 py-3">
                        {r.txHash ? (
                          <a href={`${ETHERSCAN_BASE}/tx/${r.txHash}`} target="_blank" rel="noreferrer"
                            style={{ color: '#7dd3fc', textDecoration: 'underline' }}>
                            {r.txHash.slice(0, 10)}…
                          </a>
                        ) : (
                          <span style={{ color: '#334155' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center" style={{ color: '#475569' }}>
                      No on-chain records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* nearby */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="text-[9px] uppercase tracking-[0.18em] mb-4" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
              Nearby Facilities
            </div>
            <div className="space-y-2">
              {nearby.length > 0 ? nearby.map((n) => {
                const ns = n.status || 'nodata'
                const nLatest = n.reports[n.reports.length - 1]
                return (
                  <button
                    key={n.id}
                    onClick={() => onOpenFacility(n)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded text-left transition-colors"
                    style={{ border: '1px solid #334155', backgroundColor: 'transparent' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ns === 'compliant' ? '#10b981' : ns === 'improving' ? '#f59e0b' : ns === 'violation' ? '#ef4444' : '#64748b', boxShadow: `0 0 5px currentColor` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>{n.facilityName}</div>
                      <div className="text-[10px] truncate" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{n.orgName}</div>
                    </div>
                    {nLatest && (
                      <span className="text-[10px] shrink-0" style={{ color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtNum(nLatest.co2Tonnes)} t
                      </span>
                    )}
                  </button>
                )
              }) : (
                <div className="text-xs text-center py-6" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                  No nearby facilities found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
