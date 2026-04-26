import { useWallet } from '../hooks/useWallet'

// CarbonChain glyph — two chain links
function ChainGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="9" height="12" rx="2.5" stroke="#0ea5e9" strokeWidth="1.6" />
      <rect x="13" y="6" width="9" height="12" rx="2.5" stroke="#7dd3fc" strokeWidth="1.6" />
      <line x1="11" y1="12" x2="13" y2="12" stroke="#0ea5e9" strokeWidth="1.6" />
      <circle cx="6.5" cy="12" r="1" fill="#0ea5e9" />
      <circle cx="17.5" cy="12" r="1" fill="#7dd3fc" />
    </svg>
  )
}

function MetaMaskGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path d="M3 4 L11 8 L9 12 Z" fill="#f59e0b" />
      <path d="M21 4 L13 8 L15 12 Z" fill="#d97706" />
      <path d="M5 18 L9 16 L9 14 L5 14 Z" fill="#94a3b8" />
      <path d="M19 18 L15 16 L15 14 L19 14 Z" fill="#64748b" />
      <path d="M9 14 L15 14 L15 16 L9 16 Z" fill="#cbd5e1" />
    </svg>
  )
}

const NAV_LINKS = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'register',  label: 'Register'  },
  { name: 'report',    label: 'Report'     },
]

export default function Navbar({ route, setRoute }) {
  const { address, isConnected, wrongNetwork, shortAddress, connect, disconnect } = useWallet()

  return (
    <>
      <header
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5"
        style={{
          height: 56, backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
        }}
      >
        {/* brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => setRoute({ name: 'dashboard' })}
        >
          <ChainGlyph />
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "'IBM Plex Serif', serif", fontWeight: 700, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              CarbonChain
            </span>
            <span className="hidden sm:inline text-[9px] tracking-[0.22em]" style={{ color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
              CLIMATE · INTELLIGENCE
            </span>
          </div>
        </div>

        {/* nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ name, label }) => {
            const active = route.name === name
            return (
              <button
                key={name}
                onClick={() => setRoute({ name })}
                className="relative px-3 py-1.5 text-xs rounded transition-colors"
                style={{
                  fontFamily: 'Inter, sans-serif', fontWeight: 500,
                  color: active ? '#f1f5f9' : '#64748b',
                  backgroundColor: active ? 'rgba(14,165,233,0.08)' : 'transparent',
                  letterSpacing: '0.03em',
                }}
              >
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[1.5px]"
                    style={{ backgroundColor: '#0ea5e9' }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* wallet + network */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] tracking-widest" style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#10b981' }} />
            SEPOLIA
          </div>

          {isConnected ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors"
              style={{
                backgroundColor: wrongNetwork ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.08)',
                border: `1px solid ${wrongNetwork ? '#ef444440' : '#0ea5e940'}`,
                color: wrongNetwork ? '#ef4444' : '#7dd3fc',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <MetaMaskGlyph />
              {shortAddress}
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: wrongNetwork ? '#ef4444' : '#10b981' }} />
            </button>
          ) : (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors"
              style={{
                backgroundColor: 'rgba(14,165,233,0.1)',
                border: '1px solid rgba(14,165,233,0.3)',
                color: '#7dd3fc',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <MetaMaskGlyph />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* network warning banner */}
      {wrongNetwork && (
        <div
          className="absolute z-20 left-0 right-0 flex items-center justify-center gap-3 px-4 py-1.5 text-xs"
          style={{ top: 56, backgroundColor: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.3)' }}
        >
          <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>⚠ WRONG NETWORK</span>
          <span style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Switch to Sepolia to interact with the contract.</span>
        </div>
      )}
    </>
  )
}
