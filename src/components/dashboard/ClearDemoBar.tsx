'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import DataConnectionsModal from './DataConnectionsModal'
import { invalidateWorkspaceCache } from '@/hooks/useWorkspace'

export default function ClearDemoBar({ variant = 'business' }: { variant?: 'business' | 'schools' }) {
  const [visible, setVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setVisible(
      localStorage.getItem('lumio_demo_active') === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (!visible || dismissed) return null

  function clearDemo() {
    const savedLogo = localStorage.getItem('lumio_company_logo')
    const savedWsLogo = localStorage.getItem('workspace_company_logo')
    const savedPhoto = localStorage.getItem('lumio_user_photo')
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_demo_active', 'false')
    localStorage.removeItem('lumio-photo-frame')
    if (savedLogo) localStorage.setItem('lumio_company_logo', savedLogo)
    if (savedWsLogo) localStorage.setItem('workspace_company_logo', savedWsLogo)
    if (savedPhoto) localStorage.setItem('lumio_user_photo', savedPhoto)
    invalidateWorkspaceCache()
    window.location.reload()
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 40, zIndex: 9999, backgroundColor: '#0D9488', color: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 120px 0 16px', fontSize: 13 }}>
        <div className="flex items-center gap-2">
          <Clock size={13} />
          <span className="font-medium">Demo workspace — exploring with sample data</span>
          <span className="hidden sm:inline opacity-75">· Connect your real tools to see live insights</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="hidden sm:inline font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
            Connect Tools
          </button>
          <button onClick={clearDemo} className="hidden sm:inline font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
            Clear Demo Data
          </button>
          <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      </div>
      <div style={{ height: 40, flexShrink: 0 }} />
      {showModal && <DataConnectionsModal onClose={() => setShowModal(false)} variant={variant} />}
    </>
  )
}
