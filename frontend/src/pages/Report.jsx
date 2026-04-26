import { useState } from 'react'
import EmissionChart from '../components/EmissionChart'
import ComplianceBadge from '../components/ComplianceBadge'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import { PERIODS, ETHERSCAN_BASE } from '../lib/constants'
import { fmtNum } from '../data/seed'

export default function Report({ facilities, fireToast }) {
  const { isConnected, address } = useWallet()
  const { pending, txHash, reportEmissions } = useContract()
  const [facilityId, setFacilityId] = useState('')
  const [period, setPeriod]         = useState(PERIODS[PERIODS.length - 1])
  const [co2, setCo2]               = useState('')

  // In demo: all facilities are "owned" if wallet connected, else first 2
  const owned = isConnected ? facilities : facilities.slice(0, 2)
  const selected = facilities.find((f) => String(f.id) === String(facilityId)) || owned[0]

  const co2Num  = Number(co2.replace(/,/g, ''))
  const target  = selected ? Math.round(selected.baselineEmissions * (1 - selected.reductionTarget / 100)) : 0
  const valid   = selected && co2Num > 0

  const meetsTarget = co2Num > 0 && co2Num <= target
  const improving   = co2Num > 0 && co2Num <= (selected?.baselineEmissions || 0) && !meetsTarget
  const status = co2Num <= 0 ? null : meetsTarget ? 'compliant' : improving ? 'improving' : 'violation'

  const pctVsBaseline = selected && co2Num > 0
    ? Math.abs(((co2Num - selected.baselineEmissions) / selected.baselineEmissions) * 100).toFixed(1)
    : null
  const isReduction = co2Num > 0 && co2Num < (selected?.baselineEmissions || 0)

  async function submit() {
    if (!isConnected) { fireToast({ kind: 'error', title: 'Connect wallet first' }); return }
    try {
      const { txHash: hash } = await reportEmissions({
        facilityId: selected.id, co2Tonnes: co2Num, period,
      })
      fireToast({ kind: 'success', title: 'Report submitted', body: `${period} · ${fmtNum(co2Num)} t CO₂` })
      setCo2('')
    } catch (e) {
      fireToast({ kind: 'error', title: 'Transaction failed', body: e.message?.slice(0, 60) })
    }
  }

  const previewHistory = selected ? [
    ...selected.reports,
    ...(co2Num > 0 ? [{ period: `${period} (preview)`, co2Tonnes: co2Num, meetsTarget, isReduction, percentChange: pctVsBaseline }] : []),
  ] : []

  return (
    <div className="absolute inset-0 scrollable" style={{ top: 56, backgroundColor: '#0f172a' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#0ea5e9', fontFamily: "'JetBrains Mono', monospace" }}>
            On-Chain Reporting
          </div>
          <h1 style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 700, fontSize: 28, color: '#f1f5f9', letterSpacing: '-0.01em', margin: 0 }}>
            Report Emissions
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif', maxWidth: 500 }}>
            Submit a quarterly or annual emission record. Immutable once confirmed.
          </p>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '360px 1fr' }}>
          {/* form */}
          <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            {/* facility select */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                Facility <span style={{ color: '#475569' }}>· {owned.length} registered</span>
              </label>
              <select
                value={facilityId || String(selected?.id || '')}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', outline: 'none' }}
              >
                {owned.map((f) => (
                  <option key={f.id} value={String(f.id)}>{f.facilityName} — {f.orgName}</option>
                ))}
              </select>
            </div>

            {/* period */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                Reporting Period
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PERIODS.map((p) => {
                  const hasReport = selected?.reports.some((r) => r.period === p)
                  return (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className="relative py-2 rounded text-xs text-center"
                      style={{
                        backgroundColor: period === p ? 'rgba(14,165,233,0.15)' : '#334155',
                        border: `1px solid ${period === p ? '#0ea5e9' : '#475569'}`,
                        color: period === p ? '#7dd3fc' : '#94a3b8',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {p}
                      {hasReport && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-1 text-[9px]" style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                Green dot = report already submitted for this period
              </div>
            </div>

            {/* co2 input */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                CO₂ Reported <span style={{ color: '#475569' }}>· tonnes CO₂e</span>
              </label>
              <div className="relative">
                <input
                  value={co2}
                  onChange={(e) => setCo2(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="e.g. 32100"
                  className="w-full rounded px-3 py-2 text-sm"
                  style={{
                    backgroundColor: '#334155', border: '1px solid #475569',
                    color: '#f1f5f9', outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace", paddingRight: '4rem',
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                  t CO₂
                </span>
              </div>
            </div>

            {/* live compliance preview */}
            {co2Num > 0 && selected && (
              <div className="rounded-md p-3 anim-fade-up" style={{ backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}>
                <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Compliance Preview</div>
                <div className="flex items-center justify-between mb-2">
                  <ComplianceBadge status={status} />
                  <span className="text-xs" style={{ color: isReduction ? '#10b981' : '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>
                    {isReduction ? '↓' : '↑'} {pctVsBaseline}% vs baseline
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <div>
                    <div style={{ color: '#475569' }}>Baseline</div>
                    <div style={{ color: '#94a3b8' }}>{fmtNum(selected.baselineEmissions)} t</div>
                  </div>
                  <div>
                    <div style={{ color: '#475569' }}>Target</div>
                    <div style={{ color: '#7dd3fc' }}>{fmtNum(target)} t</div>
                  </div>
                  <div>
                    <div style={{ color: '#475569' }}>Reported</div>
                    <div style={{ color: status === 'compliant' ? '#10b981' : status === 'improving' ? '#f59e0b' : '#ef4444' }}>
                      {fmtNum(co2Num)} t
                    </div>
                  </div>
                </div>
              </div>
            )}

            {txHash && (
              <div className="rounded-md p-3" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.3)' }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#7dd3fc' }}>Submitted</div>
                <a href={`${ETHERSCAN_BASE}/tx/${txHash}`} target="_blank" rel="noreferrer"
                  className="text-xs underline" style={{ color: '#0ea5e9', fontFamily: "'JetBrains Mono', monospace" }}>
                  {txHash.slice(0, 20)}…
                </a>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!valid || pending}
              className="w-full py-2.5 rounded-md text-sm font-semibold"
              style={{
                backgroundColor: !valid || pending ? '#1e3a4a' : '#0ea5e9',
                color: !valid || pending ? '#475569' : '#fff',
                fontFamily: 'Inter, sans-serif', cursor: !valid || pending ? 'not-allowed' : 'pointer', border: 'none',
              }}
            >
              {pending ? 'Submitting on-chain…' : 'Submit Report'}
            </button>
            <div className="flex items-center justify-between text-[9px]" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Gas: ~0.0021 ETH</span>
              <span>Network: Sepolia</span>
            </div>
          </div>

          {/* chart preview */}
          <div>
            <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Emission Trajectory</div>
                  <div className="text-base mt-0.5" style={{ color: '#f1f5f9', fontFamily: "'IBM Plex Serif', serif", fontWeight: 600 }}>
                    {selected?.facilityName || '—'}
                  </div>
                </div>
                {selected && (
                  <div className="text-xs text-right" style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    <div>Baseline: {fmtNum(selected.baselineEmissions)} t</div>
                    <div>Target: {fmtNum(target)} t</div>
                  </div>
                )}
              </div>
              {selected ? (
                <EmissionChart
                  reports={previewHistory}
                  baseline={selected.baselineEmissions}
                  target={target}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center" style={{ height: 300, color: '#475569', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  Select a facility to preview trajectory.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
