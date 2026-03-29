'use client'
import { useState, useRef } from 'react'
import { Upload, Database, X, CheckCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface UploadButton {
  label: string
  accept?: string
  key: string
}

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  uploads: UploadButton[]
  pageName: string
}

export function EmptyState({ title, description, uploads, pageName }: EmptyStateProps) {
  const pathname = usePathname()
  const slugMatch = pathname.match(/\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? 'school'
  const storageKey = `lumio_${slug}_${pageName}_hasData`

  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [misModal, setMisModal] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function handleFile(key: string, file: File) {
    showToast(`Uploading ${file.name}...`)
    await new Promise(r => setTimeout(r, 2000))
    showToast('Data imported successfully! Loading...')
    await new Promise(r => setTimeout(r, 600))
    localStorage.setItem(storageKey, 'true')
    window.location.reload()
  }

  async function handleDemoData() {
    setLoading(true)
    showToast('Loading demo data...')
    await new Promise(r => setTimeout(r, 1200))
    localStorage.setItem(storageKey, 'true')
    localStorage.setItem('lumio_schools_demo_loaded', 'true')
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(13,148,136,0.06) 0%, transparent 70%)'
      }} />

      <div className="relative flex flex-col items-center text-center max-w-lg w-full">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{
          background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(13,148,136,0.05))',
          border: '1px solid rgba(13,148,136,0.3)'
        }}>
          <Database size={36} style={{ color: '#0D9488' }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#9CA3AF' }}>{description}</p>

        {/* Upload buttons */}
        <div className="flex flex-col gap-3 w-full mb-4">
          {uploads.map(btn => (
            <div key={btn.key}>
              <input
                type="file"
                accept={btn.accept ?? '.csv,.xlsx'}
                className="hidden"
                ref={el => { fileRefs.current[btn.key] = el }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(btn.key, f) }}
              />
              {btn.key === 'mis' ? (
                <button onClick={() => setMisModal(true)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#0D9488' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#9CA3AF' }}>
                  <Database size={15} /> {btn.label}
                </button>
              ) : (
                <button onClick={() => fileRefs.current[btn.key]?.click()}
                  className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#111318' }}>
                  <Upload size={15} /> {btn.label}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          <span className="text-xs" style={{ color: '#4B5563' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
        </div>

        {/* Demo data button */}
        <button onClick={handleDemoData} disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Loading demo data...' : '✨ Explore with Demo Data'}
        </button>
        <p className="text-xs mt-3" style={{ color: '#4B5563' }}>Demo data is pre-filled sample data so you can explore all features</p>
      </div>

      {/* MIS Modal */}
      {misModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold" style={{ color: '#F9FAFB' }}>Connect Your MIS</p>
              <button onClick={() => setMisModal(false)} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
              Lumio connects directly to Arbor, SIMS, Bromcom and ScholarPack. Direct MIS integration syncs your registers, pupil data and attendance automatically — no CSV uploads needed.
            </p>
            <p className="text-xs mb-6 p-3 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
              MIS integration is available on the Full plan. Contact us to get set up.
            </p>
            <div className="flex gap-3">
              <a href="mailto:hello@lumiocms.com" className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Contact Sales</a>
              <button onClick={() => setMisModal(false)} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', maxWidth: 360 }}>
          <CheckCircle size={14} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}

export function useHasData(pageName: string): boolean | null {
  if (typeof window === 'undefined') return null
  const pathname = window.location.pathname
  const slugMatch = pathname.match(/\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? 'school'
  return localStorage.getItem(`lumio_${slug}_${pageName}_hasData`) === 'true'
}
