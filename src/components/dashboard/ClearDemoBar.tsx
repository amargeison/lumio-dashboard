'use client'

import { useState, useEffect } from 'react'
import DataConnectionsModal from './DataConnectionsModal'

export default function ClearDemoBar({ variant = 'business' }: { variant?: 'business' | 'schools' }) {
  const [visible, setVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setVisible(
      localStorage.getItem('lumio_demo_active') === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (!visible) return null

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 mx-4 mt-3 rounded-xl text-xs"
        style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <span style={{ color: '#5EEAD4' }}>You&apos;re exploring with demo data</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal(true)} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            Clear Demo Data
          </button>
          <button onClick={() => setShowModal(true)} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            Connect your tools &rarr;
          </button>
        </div>
      </div>
      {showModal && <DataConnectionsModal onClose={() => setShowModal(false)} variant={variant} />}
    </>
  )
}
