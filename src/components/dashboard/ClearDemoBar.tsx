'use client'

import { useState, useEffect } from 'react'
import ConvertModal from '@/app/(demo-workspace)/components/ConvertModal'

export default function ClearDemoBar() {
  const [visible, setVisible] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem('lumio_demo_active') === 'true')
  }, [])

  if (!visible) return null

  function handleClear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_demo_active', 'false')
    window.location.reload()
  }

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2 text-xs"
        style={{ backgroundColor: 'rgba(108,63,197,0.12)', borderBottom: '1px solid rgba(108,63,197,0.25)' }}
      >
        <span style={{ color: 'rgba(167,139,250,0.7)' }}>
          You&apos;re viewing demo data
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConvert(true)}
            className="rounded-lg px-3 py-1 text-xs font-semibold transition-all"
            style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#5EEAD4', border: '1px solid rgba(13,148,136,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.2)' }}
          >
            🚀 Go Live
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg px-3 py-1 text-xs font-semibold transition-all"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(108,63,197,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(108,63,197,0.2)' }}
          >
            ✕ Clear Demo Data
          </button>
        </div>
      </div>
      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}
    </>
  )
}
