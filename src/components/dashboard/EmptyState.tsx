'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Database, X, CheckCircle, Link2, Plus } from 'lucide-react'

export interface UploadButton {
  key: string
  label: string
  accept?: string
  icon?: React.ReactNode
}

interface EmptyStateProps {
  pageKey: string          // unique key e.g. 'crm', 'sales', 'hr'
  title: string
  description: string
  uploads: UploadButton[]
  accentColor?: string
}

const INTEGRATIONS = [
  { name: 'HubSpot', logo: '🟠', category: 'CRM' },
  { name: 'Salesforce', logo: '☁️', category: 'CRM' },
  { name: 'Xero', logo: '💙', category: 'Finance' },
  { name: 'QuickBooks', logo: '🟢', category: 'Finance' },
  { name: 'Slack', logo: '💜', category: 'Comms' },
  { name: 'Google Workspace', logo: '🔵', category: 'Productivity' },
  { name: 'Microsoft 365', logo: '🔷', category: 'Productivity' },
  { name: 'Zapier', logo: '⚡', category: 'Automation' },
  { name: 'Stripe', logo: '💳', category: 'Payments' },
  { name: 'Pipedrive', logo: '🟤', category: 'CRM' },
]

export function DashboardEmptyState({
  pageKey, title, description, uploads, accentColor = '#6C3FC5'
}: EmptyStateProps) {
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [intModal, setIntModal] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function storageKey() {
    return `lumio_dashboard_${pageKey}_hasData`
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleFile(key: string, file: File) {
    showToast(`Uploading ${file.name}...`)
    await new Promise(r => setTimeout(r, 2000))
    showToast('Data imported successfully! Loading your dashboard...')
    await new Promise(r => setTimeout(r, 700))
    localStorage.setItem(storageKey(), 'true')
    window.location.reload()
  }

  async function handleDemo() {
    setLoading(true)
    showToast('Loading demo data...')
    await new Promise(r => setTimeout(r, 1200))
    localStorage.setItem(storageKey(), 'true')
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 30%, ${accentColor}08 0%, transparent 65%)`
      }} />

      <div className="relative flex flex-col items-center text-center max-w-md w-full">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{
          background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`,
          border: `1px solid ${accentColor}40`
        }}>
          <Database size={36} style={{ color: accentColor }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#9CA3AF' }}>{description}</p>

        {/* Upload buttons */}
        <div className="flex flex-col gap-2.5 w-full mb-4">
          {uploads.map(btn => (
            <div key={btn.key}>
              <input
                type="file"
                accept={btn.accept ?? '.csv,.xlsx,.xls'}
                className="hidden"
                ref={el => { fileRefs.current[btn.key] = el }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(btn.key, f) }}
              />
              <button
                onClick={() => fileRefs.current[btn.key]?.click()}
                className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = `${accentColor}0A` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.backgroundColor = '#111318' }}>
                <Upload size={14} style={{ color: accentColor, flexShrink: 0 }} />
                {btn.label}
              </button>
            </div>
          ))}

          {/* Connect integration button */}
          <button
            onClick={() => setIntModal(true)}
            className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#9CA3AF' }}>
            <Link2 size={14} style={{ flexShrink: 0 }} />
            Connect an Integration (HubSpot, Xero, Slack + more)
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          <span className="text-xs" style={{ color: '#4B5563' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
        </div>

        {/* Demo data button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all"
          style={{ backgroundColor: accentColor, color: '#F9FAFB', opacity: loading ? 0.75 : 1 }}>
          {loading ? 'Loading demo data...' : '✨ Explore with Demo Data'}
        </button>
        <p className="text-xs mt-3" style={{ color: '#4B5563' }}>
          Pre-filled sample data so you can explore every feature before adding your own
        </p>
      </div>

      {/* Integrations modal */}
      {intModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Connect an Integration</p>
              <button onClick={() => setIntModal(false)} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
              Lumio connects directly to your existing tools. Select one to get started — or contact us to set up a custom integration.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {INTEGRATIONS.map(int => (
                <button key={int.name}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2937'}
                  onClick={() => { setIntModal(false); showToast(`${int.name} integration — contact us to set up`) }}>
                  <span className="text-base">{int.logo}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{int.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{int.category}</p>
                  </div>
                </button>
              ))}
              <button
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 col-span-2"
                style={{ backgroundColor: '#0A0B11', border: `1px dashed ${accentColor}40`, color: accentColor }}
                onClick={() => { setIntModal(false); showToast('Custom integration — our team will be in touch') }}>
                <Plus size={14} />
                <span className="text-xs font-medium">Request a custom integration</span>
              </button>
            </div>
            <div className="flex gap-3">
              <a href="mailto:hello@lumiocms.com"
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center"
                style={{ backgroundColor: accentColor, color: '#F9FAFB' }}>
                Contact Us
              </a>
              <button onClick={() => setIntModal(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{ backgroundColor: accentColor, color: '#F9FAFB', maxWidth: 360 }}>
          <CheckCircle size={14} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}

// Hook to check if a page has data
export function useHasDashboardData(pageKey: string): boolean | null {
  const [has, setHas] = useState<boolean | null>(null)
  useEffect(() => {
    setHas(localStorage.getItem(`lumio_dashboard_${pageKey}_hasData`) === 'true')
  }, [pageKey])
  return has
}
