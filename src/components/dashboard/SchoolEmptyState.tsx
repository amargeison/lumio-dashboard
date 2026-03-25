'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Database, X, Link2 } from 'lucide-react'

export interface SchoolUploadButton {
  key: string
  label: string
  accept?: string
}

interface SchoolEmptyStateProps {
  pageKey: string
  title: string
  description: string
  uploads: SchoolUploadButton[]
  accentColor?: string
}

const SCHOOL_INTEGRATIONS = [
  { name: 'SIMS', logo: '🏫', category: 'MIS' },
  { name: 'Bromcom', logo: '📊', category: 'MIS' },
  { name: 'Arbor', logo: '🌳', category: 'MIS' },
  { name: 'ScholarPack', logo: '📚', category: 'MIS' },
  { name: 'Google Workspace', logo: '🔵', category: 'Productivity' },
  { name: 'Microsoft 365', logo: '🔷', category: 'Productivity' },
  { name: 'ParentPay', logo: '💳', category: 'Finance' },
  { name: 'CPOMS', logo: '🛡️', category: 'Safeguarding' },
  { name: 'Ofsted Dashboard', logo: '📋', category: 'Compliance' },
  { name: 'DfE Data', logo: '🏛️', category: 'Compliance' },
]

export function SchoolEmptyState({
  pageKey, title, description, uploads, accentColor = '#0D9488'
}: SchoolEmptyStateProps) {
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [intModal, setIntModal] = useState(false)
  const [showDevButton, setShowDevButton] = useState(false)
  const [showClearDemo, setShowClearDemo] = useState(false)

  useEffect(() => {
    setShowDevButton(
      process.env.NODE_ENV === 'development' ||
      window.location.hostname.includes('vercel.app')
    )
    setShowClearDemo(localStorage.getItem('lumio_school_demo_active') === 'true')
  }, [])

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function storageKey() {
    return `lumio_school_${pageKey}_hasData`
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleFile(key: string, file: File) {
    showToast(`Uploading ${file.name}...`)
    await new Promise(r => setTimeout(r, 2000))
    showToast('Data imported successfully! Loading your portal...')
    await new Promise(r => setTimeout(r, 700))
    localStorage.setItem(storageKey(), 'true')
    window.location.reload()
  }

  function clearDemoData() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_school_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_school_demo_active', 'false')
    window.location.reload()
  }

  async function handleDemo() {
    setLoading(true)
    showToast('Loading demo data...')
    await new Promise(r => setTimeout(r, 1200))
    localStorage.setItem(storageKey(), 'true')
    localStorage.setItem('lumio_school_demo_active', 'true')
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
                multiple
                accept={btn.accept ?? '.csv,.xlsx,.xls'}
                className="hidden"
                ref={el => { fileRefs.current[btn.key] = el }}
                onChange={e => {
                  const files = e.target.files
                  if (files && files.length > 0) handleFile(btn.key, files[0])
                }}
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
            Connect your MIS (SIMS, Bromcom, Arbor + more)
          </button>
        </div>

        {/* Clear demo data */}
        {showClearDemo && (
          <button
            onClick={clearDemoData}
            className="text-xs mt-1 mb-3"
            style={{ color: '#4B5563' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563' }}>
            ✕ Clear demo data
          </button>
        )}

        {/* Demo data button */}
        {showDevButton && (
          <button
            onClick={handleDemo}
            disabled={loading}
            className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}40`,
              color: accentColor,
              opacity: loading ? 0.6 : 1
            }}>
            {loading ? '...' : '⚡ Load demo data'}
          </button>
        )}
      </div>

      {/* Integration modal */}
      {intModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <button onClick={() => setIntModal(false)} className="absolute top-4 right-4" style={{ color: '#6B7280' }}>
              <X size={16} />
            </button>
            <h3 className="text-base font-bold mb-1" style={{ color: '#F9FAFB' }}>Connect an integration</h3>
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Import your school data automatically.</p>
            <div className="flex flex-col gap-1.5">
              {SCHOOL_INTEGRATIONS.map(int => (
                <button key={int.name}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}>
                  <span className="text-base">{int.logo}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{int.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{int.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl px-4 py-3 shadow-2xl z-50"
          style={{ backgroundColor: '#111318', border: `1px solid ${accentColor}40`, color: '#F9FAFB' }}>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
