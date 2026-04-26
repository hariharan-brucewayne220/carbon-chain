import { useRef, useState, useCallback } from 'react'
import { STATUS_META } from '../lib/constants'
import { fmtNum } from '../data/seed'

// Equirectangular projection for CONUS bounding box
const MAP_BOUNDS = { w: 960, h: 560, minLng: -125, maxLng: -65, minLat: 22, maxLat: 50 }

function project(lng, lat) {
  const { w, h, minLng, maxLng, minLat, maxLat } = MAP_BOUNDS
  const x = ((lng - minLng) / (maxLng - minLng)) * w
  const y = h - ((lat - minLat) / (maxLat - minLat)) * h
  return [x, y]
}

// Simplified CONUS outline path (key waypoints)
const CONUS_PATH = (() => {
  const pts = [
    [-124.7,48.4],[-95,49],[-75,45],[-67.3,47],[-67,44.5],[-70,41.5],[-74,40.5],
    [-75.5,35.5],[-80.5,25.1],[-81.5,24.5],[-82,28],[-84,30],[-88,30],[-89,29.3],
    [-94,29.5],[-97.5,26],[-97,28],[-100,28],[-104,29],[-106,31.7],[-111,31.3],
    [-117,32.5],[-120.5,34.5],[-124.4,40.5],[-124.7,48.4],
  ]
  return pts.map(([lng, lat], i) => {
    const [x, y] = project(lng, lat)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ') + ' Z'
})()

function MarkerCircle({ f, isSelected, isHover, onHover, onClick }) {
  const [x, y] = project(f.lng, f.lat)
  const status = f.status || 'nodata'
  const m  = STATUS_META[status]
  const latest = f.reports[f.reports.length - 1]
  const sizeScale = latest ? Math.min(12, 6 + Math.log10(latest.co2Tonnes + 1) * 2) : 7
  const r = isSelected ? sizeScale + 2 : sizeScale

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(f)}
      onMouseEnter={() => onHover(f.id)}
      onMouseLeave={() => onHover(null)}
    >
      <circle cx={x} cy={y} r={r + 10} fill={m.fg} opacity={isSelected || isHover ? 0.15 : 0.06} />
      <circle cx={x} cy={y} r={r + 4} fill="none" stroke={m.fg} strokeWidth="0.8"
        opacity={isSelected ? 0.7 : 0.3} strokeDasharray={isSelected ? '' : '2 3'} />
      <circle cx={x} cy={y} r={r} fill={m.fg} fillOpacity="0.85" stroke="#0a1322" strokeWidth="1.5" />
      <circle cx={x} cy={y} r={r * 0.35} fill="#0a1322" />
    </g>
  )
}

function MapPopup({ facility, onClose, onViewDetail }) {
  if (!facility) return null
  const [x, y] = project(facility.lng, facility.lat)
  const latest = facility.reports[facility.reports.length - 1]
  const m = STATUS_META[facility.status || 'nodata']
  const boxW = 220, boxH = 130
  const px = Math.min(x + 14, MAP_BOUNDS.w - boxW - 4)
  const py = Math.max(y - boxH - 10, 4)

  return (
    <g>
      <line x1={x} y1={y} x2={px} y2={py + boxH} stroke="#0ea5e9" strokeWidth="1" opacity="0.5" />
      <foreignObject x={px} y={py} width={boxW} height={boxH + 20}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
            padding: '10px 12px', fontSize: 11, fontFamily: 'Inter, sans-serif', color: '#f1f5f9',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 700, fontSize: 13, lineHeight: 1.2, maxWidth: 160 }}>
              {facility.facilityName}
            </div>
            <button onClick={onClose} style={{ color: '#64748b', fontSize: 14, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}>×</button>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>{facility.orgName}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            <div>
              <div style={{ color: '#64748b', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Baseline</div>
              <div style={{ color: '#f1f5f9' }}>{fmtNum(facility.baselineEmissions)} t</div>
            </div>
            {latest && (
              <div>
                <div style={{ color: '#64748b', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Latest</div>
                <div style={{ color: m.fg }}>{fmtNum(latest.co2Tonnes)} t</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ background: m.bg, color: m.fg, border: `1px solid ${m.fg}40`, borderRadius: 99, padding: '1px 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {m.label}
            </span>
            <button
              onClick={() => onViewDetail(facility)}
              style={{ color: '#7dd3fc', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}
            >
              View Details →
            </button>
          </div>
        </div>
      </foreignObject>
    </g>
  )
}

export default function MapView({ facilities = [], onSelectFacility, selectedId, layers = {} }) {
  const [hoverId, setHoverId]   = useState(null)
  const [popup, setPopup]       = useState(null)
  const wrapRef                  = useRef(null)

  const handleMarkerClick = useCallback((f) => {
    setPopup(f)
    onSelectFacility?.(f)
  }, [onSelectFacility])

  const latLines = [25, 30, 35, 40, 45]
  const lngLines = [-120, -110, -100, -90, -80, -70]

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0a1322' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${MAP_BOUNDS.w} ${MAP_BOUNDS.h}`}
        preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        <defs>
          <pattern id="cc-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#13203a" strokeWidth="0.5" />
          </pattern>
          <pattern id="cc-dots" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.5" fill="#1a2a47" />
          </pattern>
          <radialGradient id="cc-glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#0e1a30" />
            <stop offset="100%" stopColor="#070d1c" />
          </radialGradient>
        </defs>

        {/* background */}
        <rect width={MAP_BOUNDS.w} height={MAP_BOUNDS.h} fill="url(#cc-glow)" />
        <rect width={MAP_BOUNDS.w} height={MAP_BOUNDS.h} fill="url(#cc-dots)" />
        <rect width={MAP_BOUNDS.w} height={MAP_BOUNDS.h} fill="url(#cc-grid)" />

        {/* graticule */}
        {latLines.map((lat) => {
          const [, y] = project(-90, lat)
          return (
            <g key={lat}>
              <line x1="0" y1={y} x2={MAP_BOUNDS.w} y2={y} stroke="#1a2a47" strokeWidth="0.5" strokeDasharray="2 6" />
              <text x="6" y={y - 2} fontSize="9" fill="#2a3a57" fontFamily="JetBrains Mono, monospace">{lat}°N</text>
            </g>
          )
        })}
        {lngLines.map((lng) => {
          const [x] = project(lng, 36)
          return (
            <g key={lng}>
              <line x1={x} y1="0" x2={x} y2={MAP_BOUNDS.h} stroke="#1a2a47" strokeWidth="0.5" strokeDasharray="2 6" />
              <text x={x + 2} y={MAP_BOUNDS.h - 4} fontSize="9" fill="#2a3a57" fontFamily="JetBrains Mono, monospace">{Math.abs(lng)}°W</text>
            </g>
          )
        })}

        {/* CONUS fill */}
        <path d={CONUS_PATH} fill="#101d35" stroke="#1e3358" strokeWidth="1" />

        {/* facility markers */}
        {facilities.map((f) => (
          <MarkerCircle
            key={f.id}
            f={f}
            isSelected={selectedId === f.id || popup?.id === f.id}
            isHover={hoverId === f.id}
            onHover={setHoverId}
            onClick={handleMarkerClick}
          />
        ))}

        {/* popup */}
        <MapPopup
          facility={popup}
          onClose={() => setPopup(null)}
          onViewDetail={(f) => { setPopup(null); onSelectFacility?.(f, true) }}
        />
      </svg>

      {/* coordinate legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <span className="text-[9px] tracking-widest" style={{ color: '#334155' }}>CONUS</span>
        <div className="h-px w-10" style={{ backgroundColor: '#1e3358' }} />
        <span className="text-[9px]" style={{ color: '#334155' }}>
          {facilities.length} facilities
        </span>
      </div>

      {/* layer legend */}
      <div className="absolute top-3 right-3 rounded-md px-3 py-2 flex flex-col gap-1.5"
        style={{ backgroundColor: 'rgba(15,23,42,0.85)', border: '1px solid #1e293b' }}>
        {[
          { key: 'compliant',  label: 'Compliant'      },
          { key: 'improving',  label: 'Improving'      },
          { key: 'violation',  label: 'Non-Compliant'  },
          { key: 'nodata',     label: 'No Data'        },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_META[key].fg }} />
            <span className="text-[9px] tracking-wide" style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
