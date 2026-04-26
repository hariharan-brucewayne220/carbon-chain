import { useEffect, useState } from 'react'

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (toast) { setVisible(true) }
    else setVisible(false)
  }, [toast])

  if (!toast || !visible) return null

  const isSuccess = toast.kind === 'success'
  const color = isSuccess ? '#10b981' : '#ef4444'

  return (
    <div
      className="fixed bottom-6 right-6 z-50 anim-fade-up rounded-lg px-4 py-3 max-w-xs shadow-2xl"
      style={{ backgroundColor: '#1e293b', border: `1px solid ${color}50` }}
    >
      <div className="flex items-start gap-3">
        <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
            {toast.title}
          </div>
          {toast.body && (
            <div className="text-xs mt-0.5" style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
              {toast.body}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
