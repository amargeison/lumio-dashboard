'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ConvertModal from '@/app/(demo-workspace)/components/ConvertModal'

export default function ClearDemoBar() {
  const [visible, setVisible] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem('lumio_demo_active') === 'true')
  }, [])

  if (!visible) return null

  function handleClear() {
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      fetch('/api/onboarding/clear-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
      }).catch(() => {})
    }
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
        style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.25)' }}
      >
        <span style={{ color: '#FBBF24' }}>
          You&apos;re viewing demo data — clear it any time in Settings
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs font-medium transition-colors"
            style={{ color: 'rgba(251,191,36,0.7)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#FBBF24' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(251,191,36,0.7)' }}
          >
            Go to Settings →
          </Link>
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
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.15)' }}
          >
            ✕ Clear Demo Data
          </button>
        </div>
      </div>
      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}
    </>
  )
}
