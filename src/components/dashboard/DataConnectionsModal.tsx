'use client'

import { useState } from 'react'
import { X, ExternalLink, Zap, Trash2, RotateCcw } from 'lucide-react'

const BUSINESS_CONNECTIONS = [
  'Gmail / Outlook', 'Slack', 'Microsoft Teams', 'Xero', 'QuickBooks', 'Google Calendar', 'HubSpot', 'LinkedIn',
]

const SCHOOL_CONNECTIONS = [
  'Google Workspace', 'Microsoft 365', 'Arbor MIS', 'SIMS', 'Bromcom', 'ParentPay', 'Google Classroom',
]

export default function DataConnectionsModal({ onClose, variant = 'business' }: { onClose: () => void; variant?: 'business' | 'schools' }) {
  const [toast, setToast] = useState<string | null>(null)
  const connections = variant === 'schools' ? SCHOOL_CONNECTIONS : BUSINESS_CONNECTIONS
  const isDemo = typeof window !== 'undefined' && (localStorage.getItem('lumio_demo_active') === 'true' || localStorage.getItem('lumio_schools_demo_loaded') === 'true')

  function clearDemo() {
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      fetch('/api/onboarding/clear-demo', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-workspace-token': token } }).catch(() => {})
    }
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_demo_active', 'false')
    localStorage.removeItem('lumio_schools_demo_loaded')
    sessionStorage.removeItem('lumio_crm_cache')
    window.location.reload()
  }

  function reloadDemo() {
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      fetch('/api/onboarding/load-demo', { method: 'POST', headers: { 'x-workspace-token': token } }).catch(() => {})
    }
    localStorage.setItem('lumio_demo_active', 'true')
    const pages = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','inbox','calendar','analytics','accounts','support','success','trials','operations','it']
    pages.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
    window.location.reload()
  }

  function goLive() {
    clearDemo()
    window.location.href = '/onboarding'
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full rounded-2xl flex flex-col" style={{ maxWidth: 520, maxHeight: '85vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Data & Connections</h2>
            <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1 — Demo Data */}
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Demo Data</h3>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Your workspace is currently loaded with demo data so you can explore all features.</p>
              <div className="flex gap-2">
                <button onClick={clearDemo} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <Trash2 size={12} /> Clear Demo Data
                </button>
                <button onClick={reloadDemo} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <RotateCcw size={12} /> Reload Demo Data
                </button>
              </div>
            </div>

            {/* Section 2 — Connect Real Data */}
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Connect Your Real Data</h3>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Ready to see Lumio with your actual data? Connect your tools to get started.</p>
              <div className="grid grid-cols-2 gap-2">
                {connections.map(name => (
                  <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{name}</span>
                    <button onClick={() => { setToast(isDemo ? 'Coming soon \u2014 available when you go live' : 'Opening connection...'); setTimeout(() => setToast(null), 2500) }}
                      className="text-xs px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                      Connect <ExternalLink size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={goLive} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <Zap size={14} /> Go Live \u2014 connect your real data \u2192
            </button>
          </div>
        </div>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200, backgroundColor: '#0D9488', color: '#F9FAFB', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}
    </>
  )
}
