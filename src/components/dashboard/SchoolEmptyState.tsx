'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Database, CheckCircle } from 'lucide-react'

export interface SchoolUploadButton {
  key: string
  label: string
  accept?: string
}

interface Props {
  pageKey: string
  title: string
  description: string
  uploads: SchoolUploadButton[]
}

export default function SchoolEmptyState({ pageKey, title, description, uploads }: Props) {
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const accentColor = '#0D9488'

  useEffect(() => {
    setShowClear(localStorage.getItem('lumio_school_demo_active') === 'true')
  }, [])

  function storageKey() { return `lumio_school_${pageKey}_hasData` }
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function handleFile(_key: string, file: File) {
    showToast(`Uploading ${file.name}...`)
    await new Promise(r => setTimeout(r, 1500))
    localStorage.setItem(storageKey(), 'true')
    window.location.reload()
  }

  function clearDemo() {
    Object.keys(localStorage).filter(k => k.startsWith('lumio_school_')).forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  async function handleDemo() {
    setLoading(true)
    showToast('Loading demo data...')
    await new Promise(r => setTimeout(r, 1200))
    const ALL_SCHOOL_PAGES = ['school-office','hr-staff','curriculum','students','send-dsl','finance','safeguarding','facilities','admissions','wraparound','insights','workflows','reports']
    ALL_SCHOOL_PAGES.forEach(p => localStorage.setItem(`lumio_school_${p}_hasData`, 'true'))
    localStorage.setItem('lumio_school_demo_active', 'true')
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-6 relative">
      <div className="relative flex flex-col items-center text-center max-w-md w-full">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6"
          style={{ background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`, border: `1px solid ${accentColor}40` }}>
          <Database size={36} style={{ color: accentColor }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#9CA3AF' }}>{description}</p>
        <div className="flex flex-col gap-2.5 w-full mb-4">
          {uploads.map(btn => (
            <div key={btn.key}>
              <input type="file" multiple accept={btn.accept ?? '.csv,.xlsx,.xls'} className="hidden"
                ref={el => { fileRefs.current[btn.key] = el }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(btn.key, f) }} />
              <button onClick={() => fileRefs.current[btn.key]?.click()}
                className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-left"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}>
                <Upload size={14} style={{ color: accentColor }} />
                {btn.label}
              </button>
            </div>
          ))}
        </div>
        {showClear && (
          <button onClick={clearDemo} className="text-xs mt-1 mb-3" style={{ color: '#4B5563' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563' }}>
            ✕ Clear demo data
          </button>
        )}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          <span className="text-xs" style={{ color: '#4B5563' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
        </div>
        <button onClick={handleDemo} disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ backgroundColor: accentColor, color: '#F9FAFB', opacity: loading ? 0.75 : 1 }}>
          {loading ? 'Loading...' : '✨ Explore with Demo Data'}
        </button>
        <p className="text-xs mt-3" style={{ color: '#4B5563' }}>Pre-filled sample data so you can explore every feature</p>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{ backgroundColor: accentColor, color: '#F9FAFB' }}>
          <CheckCircle size={14} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}
