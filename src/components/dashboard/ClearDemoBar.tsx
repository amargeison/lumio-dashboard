'use client'

import { useState, useEffect } from 'react'
import { Clock, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_demo_active', 'false')
    invalidateWorkspaceCache()
    window.location.reload()
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 text-sm shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
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
          <Link href="/pricing" className="font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            Buy <ArrowRight size={11} className="inline" />
          </Link>
          <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      </div>
      {showModal && <DataConnectionsModal onClose={() => setShowModal(false)} variant={variant} />}
    </>
  )
}
