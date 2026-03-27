'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Users, Sparkles, X, Check, FileText, Loader2, Mail, ArrowRight } from 'lucide-react'

type Phase = 'videos' | 'options' | 'upload' | 'it-team' | 'demo-loading' | 'done'

interface Props {
  companyName: string
  ownerEmail: string
  sessionToken: string
  onComplete: () => void
}

function VideoPlaceholder({ title, subtitle, duration }: { title: string; subtitle: string; duration: string }) {
  return (
    <div className="flex-1 rounded-xl overflow-hidden relative" style={{ backgroundColor: '#0D0E14', border: '1px solid #1F2937', minHeight: 180 }}>
      <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.04) 0%, rgba(245,166,35,0.08) 50%, rgba(245,166,35,0.04) 100%)' }} />
      <div className="relative flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(245,166,35,0.15)', border: '2px solid rgba(245,166,35,0.3)' }}>
          <div className="w-0 h-0 ml-1" style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #F5A623' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</p>
          <p className="text-xs mt-1" style={{ color: '#F5A623' }}>{duration}</p>
        </div>
      </div>
    </div>
  )
}

function OptionCard({ icon: Icon, title, desc, onClick }: { icon: React.ElementType; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 rounded-xl p-5 text-left transition-all hover:scale-[1.02]"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#F5A623'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2937'}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(245,166,35,0.12)' }}>
        <Icon size={20} style={{ color: '#F5A623' }} />
      </div>
      <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{title}</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>{desc}</p>
    </button>
  )
}

export default function GettingStartedModal({ companyName, ownerEmail, sessionToken, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('videos')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string[]>([])
  const [itEmail, setItEmail] = useState('')
  const [itSending, setItSending] = useState(false)
  const [itSent, setItSent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...dropped])
  }, [])

  async function handleProcessUpload() {
    if (!files.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('files', f))
      fd.append('session_token', sessionToken)
      const res = await fetch('/api/onboarding/process-data', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        setUploadResult(data.summary || ['Files processed successfully'])
      }
    } catch { setUploadResult(['Upload complete — files will be processed shortly']) }
    setUploading(false)
    setPhase('done')
  }

  async function handleSendIT() {
    setItSending(true)
    try {
      await fetch('/api/onboarding/notify-it', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail, itEmail, companyName, sessionToken }),
      })
    } catch {}
    setItSent(true)
    setItSending(false)
    setTimeout(() => setPhase('done'), 1500)
  }

  async function handleLoadDemo() {
    setPhase('demo-loading')
    try {
      await fetch('/api/onboarding/load-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-token': sessionToken },
      })
    } catch {}
    setPhase('done')
  }

  function handleFinish() {
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1520, #0f1019)', borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Welcome to Lumio, {companyName} 🎉</h2>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Let&apos;s get your workspace set up</p>
            </div>
            <button onClick={handleFinish} style={{ color: '#4B5563' }}><X size={18} /></button>
          </div>
        </div>

        <div className="p-6">

          {/* Phase: Videos */}
          {phase === 'videos' && (
            <div className="space-y-5">
              <div className="flex gap-4">
                <VideoPlaceholder title="Getting Started with Lumio" subtitle="A quick intro to your new portal" duration="1 min" />
                <VideoPlaceholder title="Getting the Most Out of Lumio" subtitle="Tips, tricks and power features" duration="1 min" />
              </div>
              <button onClick={() => setPhase('options')} className="w-full py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                Getting Started <ArrowRight size={14} className="inline ml-1" />
              </button>
            </div>
          )}

          {/* Phase: Options */}
          {phase === 'options' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>How would you like to get started?</p>
              <div className="flex gap-3">
                <OptionCard icon={Upload} title="Upload Your Own Data" desc="Import your existing files and data" onClick={() => setPhase('upload')} />
                <OptionCard icon={Users} title="Work With IT" desc="Your IT team will set everything up — we'll send them instructions" onClick={() => setPhase('it-team')} />
                <OptionCard icon={Sparkles} title="Load Demo Data" desc="Explore Lumio with sample data — clear it any time" onClick={handleLoadDemo} />
              </div>
            </div>
          )}

          {/* Phase: Upload */}
          {phase === 'upload' && (
            <div className="space-y-4">
              <button onClick={() => setPhase('options')} className="text-xs" style={{ color: '#6B7280' }}>&larr; Back</button>
              <div
                className="rounded-xl p-8 text-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: dragOver ? 'rgba(245,166,35,0.08)' : '#0D0E14',
                  border: `2px dashed ${dragOver ? '#F5A623' : '#1F2937'}`,
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={32} style={{ color: '#F5A623', margin: '0 auto 12px' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Drop any files here</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Lumio will work out where everything goes</p>
                <p className="text-xs mt-2" style={{ color: '#4B5563' }}>CSV, XLSX, DOCX, PDF, images — anything</p>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{ color: '#F5A623' }} />
                        <span className="text-xs" style={{ color: '#F9FAFB' }}>{f.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                  <button onClick={handleProcessUpload} disabled={uploading}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                    {uploading ? <><Loader2 size={14} className="inline animate-spin mr-1" /> Processing...</> : 'Process & Import'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Phase: IT Team */}
          {phase === 'it-team' && (
            <div className="space-y-4">
              <button onClick={() => setPhase('options')} className="text-xs" style={{ color: '#6B7280' }}>&larr; Back</button>
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <Mail size={24} style={{ color: '#F5A623', marginBottom: 12 }} />
                <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>We&apos;ll email your IT team with setup instructions</p>
                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>They&apos;ll receive everything they need to connect your systems to Lumio.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>Your email</label>
                    <input type="email" value={ownerEmail} readOnly className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#6B7280' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>IT team email</label>
                    <input type="email" value={itEmail} onChange={e => setItEmail(e.target.value)} placeholder="it@yourcompany.com"
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
                  </div>
                </div>
              </div>
              <button onClick={handleSendIT} disabled={itSending || itSent}
                className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: itSent ? '#22C55E' : '#F5A623', color: '#0A0B10' }}>
                {itSent ? <><Check size={14} className="inline mr-1" /> Sent!</> : itSending ? 'Sending...' : 'Send Instructions'}
              </button>
            </div>
          )}

          {/* Phase: Demo Loading */}
          {phase === 'demo-loading' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 size={32} style={{ color: '#F5A623', margin: '0 auto' }} className="animate-spin" />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Loading sample data so you can explore Lumio...</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>This takes a few seconds</p>
            </div>
          )}

          {/* Phase: Done */}
          {phase === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>You&apos;re all set!</p>
              {uploadResult.length > 0 && (
                <div className="rounded-xl p-4 text-left" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  {uploadResult.map((s, i) => (
                    <p key={i} className="text-xs" style={{ color: '#9CA3AF' }}>{s}</p>
                  ))}
                </div>
              )}
              <button onClick={handleFinish} className="px-8 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                Continue to your portal <ArrowRight size={14} className="inline ml-1" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
