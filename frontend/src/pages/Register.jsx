import { useState } from 'react'
import MapView from '../components/MapView'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import { INDUSTRIES, ETHERSCAN_BASE } from '../lib/constants'
import { fmtNum } from '../data/seed'

function FieldLabel({ children, hint }) {
  return (
    <label className="block text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
      {children}
      {hint && <span className="ml-2 normal-case tracking-normal" style={{ color: '#475569' }}>· {hint}</span>}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, mono, suffix }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded px-3 py-2 text-sm"
        style={{
          backgroundColor: '#334155', border: '1px solid #475569',
          color: '#f1f5f9', outline: 'none',
          fontFamily: mono ? "'JetBrains Mono', monospace" : 'Inter, sans-serif',
          paddingRight: suffix ? '3rem' : undefined,
        }}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
          {suffix}
        </span>
      )}
    </div>
  )
}

function FieldSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded px-3 py-2 text-sm"
      style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', outline: 'none' }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function Register({ onSuccess, fireToast }) {
  const { isConnected } = useWallet()
  const { pending, txHash, registerFacility } = useContract()
  const [pin, setPin] = useState(null)
  const [form, setForm] = useState({
    org: '', name: '', industry: INDUSTRIES[0], baseline: '', target: 20,
  })

  const valid = form.org && form.name && form.baseline && pin
  const targetTonnes = form.baseline ? Math.round(Number(form.baseline.replace(/,/g, '')) * (1 - form.target / 100)) : 0

  async function submit() {
    if (!isConnected) { fireToast({ kind: 'error', title: 'Connect wallet first' }); return }
    try {
      const { txHash: hash } = await registerFacility({
        orgName: form.org, facilityName: form.name,
        industryType: form.industry,
        lat: pin.lat, lng: pin.lng,
        baselineEmissions: Number(form.baseline.replace(/,/g, '')),
        reductionTarget: form.target,
      })
      fireToast({ kind: 'success', title: 'Facility registered', body: `Tx: ${hash.slice(0, 10)}…` })
      setTimeout(onSuccess, 1000)
    } catch (e) {
      fireToast({ kind: 'error', title: 'Transaction failed', body: e.message?.slice(0, 60) })
    }
  }

  return (
    <div className="absolute inset-0 scrollable" style={{ top: 56, backgroundColor: '#0f172a' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
        {/* header */}
        <div style={{ marginBottom: 28 }}>
          <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#0ea5e9', fontFamily: "'JetBrains Mono', monospace" }}>
            On-Chain Registration
          </div>
          <h1 style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 700, fontSize: 28, color: '#f1f5f9', letterSpacing: '-0.01em', margin: 0 }}>
            Register Facility
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif', maxWidth: 500 }}>
            Record a facility permanently on Sepolia. The baseline and target are locked at registration.
          </p>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* form */}
          <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FieldLabel hint="Required">Organization</FieldLabel>
                <TextInput value={form.org} onChange={(v) => setForm({ ...form, org: v })} placeholder="e.g. Cascade Renewables LLC" />
              </div>
              <div className="col-span-2">
                <FieldLabel hint="Required">Facility Name</FieldLabel>
                <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Mojave Solar Array B" />
              </div>
              <div>
                <FieldLabel>Industry Type</FieldLabel>
                <FieldSelect value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} options={INDUSTRIES} />
              </div>
              <div>
                <FieldLabel hint="tonnes / year">Baseline Emissions</FieldLabel>
                <TextInput
                  value={form.baseline}
                  onChange={(v) => setForm({ ...form, baseline: v.replace(/[^\d.]/g, '') })}
                  placeholder="48200" mono suffix="t/yr"
                />
              </div>
              <div className="col-span-2">
                <FieldLabel hint={`${form.target}% reduction by 2030`}>Reduction Target</FieldLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={5} max={50} value={form.target}
                    style={{ '--p': `${((form.target - 5) / 45) * 100}%`, flex: 1 }}
                    onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                  />
                  <div className="flex items-baseline gap-1 px-3 py-1 rounded" style={{ backgroundColor: '#334155', border: '1px solid #475569', minWidth: 52 }}>
                    <span style={{ color: '#f1f5f9', fontFamily: "'JetBrains Mono', monospace", fontSize: 16 }}>{form.target}</span>
                    <span style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>%</span>
                  </div>
                </div>
                {form.baseline && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px]" style={{ color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>{fmtNum(Number(form.baseline))} t</span>
                    <span style={{ color: '#475569' }}>→</span>
                    <span style={{ color: '#7dd3fc' }}>{fmtNum(targetTonnes)} t target</span>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <FieldLabel hint={pin ? `${pin.lat.toFixed(4)}°N, ${Math.abs(pin.lng).toFixed(4)}°W` : 'click map to set'}>Location</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput value={pin ? pin.lat.toFixed(4) : ''} onChange={() => {}} placeholder="latitude" mono suffix="°N" />
                  <TextInput value={pin ? Math.abs(pin.lng).toFixed(4) : ''} onChange={() => {}} placeholder="longitude" mono suffix="°W" />
                </div>
              </div>
            </div>

            {/* tx info */}
            {txHash && (
              <div className="rounded-md p-3" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.3)' }}>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest mb-1" style={{ color: '#7dd3fc' }}>
                  <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#0ea5e9' }} />
                  Transaction Submitted
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>
                    {txHash.slice(0, 18)}…
                  </span>
                  <a
                    href={`${ETHERSCAN_BASE}/tx/${txHash}`}
                    target="_blank" rel="noreferrer"
                    className="text-[10px] underline" style={{ color: '#0ea5e9', fontFamily: 'Inter, sans-serif' }}
                  >
                    Etherscan →
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!valid || pending}
              className="w-full py-2.5 rounded-md text-sm font-semibold transition-all"
              style={{
                backgroundColor: !valid || pending ? '#1e3a4a' : '#0ea5e9',
                color: !valid || pending ? '#475569' : '#fff',
                fontFamily: 'Inter, sans-serif', cursor: !valid || pending ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {pending ? 'Confirming on-chain…' : 'Register on Blockchain'}
            </button>
            <div className="flex items-center justify-between text-[10px]" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Est. gas: 0.0042 ETH</span>
              <span>Network: Sepolia</span>
            </div>
          </div>

          {/* map picker */}
          <div>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #334155', backgroundColor: '#1e293b' }}>
                <div className="text-[9px] uppercase tracking-[0.18em]" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Click to Place</div>
                <span className="text-[10px]" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>CONUS</span>
              </div>
              <div className="relative" style={{ height: 300 }}>
                <MapPinSelector pin={pin} onPin={setPin} />
              </div>
            </div>

            {/* preview */}
            <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <div className="text-[9px] uppercase tracking-[0.18em] mb-3" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Transaction Preview</div>
              <div className="space-y-1.5 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {[
                  ['org',      form.org || '—'],
                  ['facility', form.name || '—'],
                  ['industry', form.industry],
                  ['baseline', form.baseline ? `${fmtNum(Number(form.baseline))} t/yr` : '—'],
                  ['target',   form.baseline ? `${fmtNum(targetTonnes)} t/yr (-${form.target}%)` : '—'],
                  ['lat,lng',  pin ? `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-3">
                    <span className="w-16 shrink-0 text-[10px] uppercase" style={{ color: '#64748b' }}>{k}</span>
                    <span style={{ color: v === '—' ? '#334155' : '#cbd5e1' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Minimal inline map pin selector
function MapPinSelector({ pin, onPin }) {
  const W = 560, H = 300
  const minLng = -125, maxLng = -65, minLat = 22, maxLat = 50
  function proj(lng, lat) {
    return [(((lng - minLng) / (maxLng - minLng)) * W).toFixed(1), (H - ((lat - minLat) / (maxLat - minLat)) * H).toFixed(1)]
  }
  function unproj(x, y) {
    return { lng: minLng + (x / W) * (maxLng - minLng), lat: minLat + (1 - y / H) * (maxLat - minLat) }
  }

  const CONUS = [[-124.7,48.4],[-95,49],[-75,45],[-67.3,47],[-67,44.5],[-70,41.5],[-74,40.5],
    [-75.5,35.5],[-80.5,25.1],[-81.5,24.5],[-82,28],[-84,30],[-88,30],[-89,29.3],
    [-94,29.5],[-97.5,26],[-97,28],[-100,28],[-104,29],[-106,31.7],[-111,31.3],
    [-117,32.5],[-120.5,34.5],[-124.4,40.5],[-124.7,48.4]]
  const path = CONUS.map(([lng, lat], i) => { const [x,y] = proj(lng, lat); return `${i?'L':'M'}${x} ${y}` }).join(' ') + ' Z'

  function onClick(e) {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const sx = (e.clientX - rect.left) / rect.width * W
    const sy = (e.clientY - rect.top) / rect.height * H
    onPin(unproj(sx, sy))
  }

  const pinXY = pin ? proj(pin.lng, pin.lat) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full cursor-crosshair" style={{ display: 'block', backgroundColor: '#0a1322' }} onClick={onClick}>
      <rect width={W} height={H} fill="#0a1322" />
      <path d={path} fill="#101d35" stroke="#1e3358" strokeWidth="1" />
      {pinXY && (
        <g>
          <circle cx={pinXY[0]} cy={pinXY[1]} r="14" fill="none" stroke="#0ea5e9" strokeOpacity="0.4" strokeDasharray="2 3" />
          <circle cx={pinXY[0]} cy={pinXY[1]} r="6" fill="#0ea5e9" stroke="#0a1322" strokeWidth="2" />
          <line x1={pinXY[0]} y1={Number(pinXY[1]) - 18} x2={pinXY[0]} y2={Number(pinXY[1]) - 8} stroke="#0ea5e9" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  )
}
