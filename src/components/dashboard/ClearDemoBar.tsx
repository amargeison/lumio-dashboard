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
        className="flex items-center justify-between px-4 py-2.5 text-xs mx-4 mt-4 rounded-lg"
        style={{ background: 'linear-gradient(135deg, #1e1040 0%, #1a1050 40%, #0d3a3a 100%)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <span style={{ color: '#F9FAFB' }}>
          You&apos;re viewing demo data — clear it any time in Settings
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-xs font-medium transition-colors"
            style={{ color: 'rgba(249,250,251,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(249,250,251,0.6)' }}
          >
            Go to Settings →
          </Link>
          <button
            onClick={() => setShowConvert(true)}
            className="rounded-lg px-3 py-1 text-xs font-semibold transition-all"
            style={{ backgroundColor: 'rgba(13,148,136,0.3)', color: '#5EEAD4', border: '1px solid rgba(13,148,136,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.3)' }}
          >
            🚀 Go Live
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg px-3 py-1 text-xs font-semibold transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(249,250,251,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
          >
            ✕ Clear Demo Data
          </button>
        </div>
      </div>
      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}
    </>
  )
}
