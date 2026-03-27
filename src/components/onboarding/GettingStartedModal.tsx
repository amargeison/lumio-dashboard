'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, Users, Sparkles, X, Check, FileText, Loader2, Mail, ArrowRight, ArrowLeft, Play, Link2 } from 'lucide-react'

type Phase = 'welcome' | 'options' | 'upload' | 'it-team' | 'connect-apps' | 'demo-loading' | 'done'

interface Props {
  companyName: string
  ownerEmail: string
  sessionToken: string
  onComplete: () => void
}

export default function GettingStartedModal({ companyName, ownerEmail, sessionToken, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('welcome')
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
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
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
    // Set localStorage flags so department pages show content immediately
    localStorage.setItem('lumio_demo_active', 'true')
    const allPages = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','inbox','calendar','analytics','accounts','support','success','trials','operations','it']
    allPages.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
    setPhase('done')
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1838 0%, #0F1629 50%, #080c1a 100%)' }}>

      <div className="w-full max-w-3xl mx-auto px-6 py-12">

        {/* ── WELCOME PHASE ── */}
        {phase === 'welcome' && (
          <div className="flex flex-col items-center text-center" style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Logo */}
            <div className="mb-8">
              <Image src="/lumio-logo-primary.png" alt="Lumio" width={320} height={160} style={{ width: 180, height: 'auto' }} />
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-black mb-3" style={{ color: '#F9FAFB' }}>Welcome to Lumio</h1>
            <p className="text-lg mb-12" style={{ color: '#6B7280' }}>Let&apos;s get your workspace set up in 2 minutes</p>

            {/* Video cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mb-10">
              <div className="rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #3d2a0f, #1a1520)', border: '1px solid rgba(245,166,35,0.25)', minHeight: 225 }}>
                <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center relative"
                    style={{ backgroundColor: 'rgba(245,166,35,0.2)', border: '2px solid rgba(245,166,35,0.4)' }}>
                    <Play size={28} style={{ color: '#F5A623', marginLeft: 3 }} fill="#F5A623" />
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(245,166,35,0.1)' }} />
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Getting Started with Lumio</p>
                    <p className="text-sm mt-1" style={{ color: '#F5A623' }}>2 min intro</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: '#111318', border: '1px solid rgba(245,166,35,0.2)', minHeight: 225 }}>
                <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center relative"
                    style={{ backgroundColor: 'rgba(245,166,35,0.1)', border: '2px solid rgba(245,166,35,0.25)' }}>
                    <Play size={28} style={{ color: '#F5A623', marginLeft: 3 }} fill="#F5A623" />
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(245,166,35,0.08)', animationDelay: '0.5s' }} />
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Getting the Most Out of Lumio</p>
                    <p className="text-sm mt-1" style={{ color: '#F5A623' }}>2 min tips &amp; tricks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 w-full mb-8">
              <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
              <span className="text-sm font-medium" style={{ color: '#6B7280' }}>Ready to set up your workspace?</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
            </div>

            {/* CTA */}
            <button onClick={() => setPhase('options')}
              className="w-full py-4 rounded-xl text-lg font-bold transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              Get Started <ArrowRight size={18} className="inline ml-1" />
            </button>
          </div>
        )}

        {/* ── OPTIONS PHASE ── */}
        {phase === 'options' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button onClick={() => setPhase('welcome')} className="flex items-center gap-1 text-sm mb-8" style={{ color: '#6B7280' }}>
              <ArrowLeft size={14} /> Back
            </button>

            <h2 className="text-2xl font-black mb-2 text-center" style={{ color: '#F9FAFB' }}>How would you like to start?</h2>
            <p className="text-sm mb-8 text-center" style={{ color: '#6B7280' }}>Choose one to get going — you can always change this later in Settings</p>

            <div className="flex flex-col gap-4">
              {[
                { icon: '📤', title: 'Upload Your Own Data', desc: 'Import your files, spreadsheets, and documents', action: () => setPhase('upload') },
                { icon: '🔗', title: 'Connect Your Apps', desc: 'Sync Office 365, Slack, Google and more automatically', action: () => setPhase('connect-apps') },
                { icon: '👥', title: 'Work With Your IT Team', desc: "We'll send your IT team full setup instructions", action: () => setPhase('it-team') },
                { icon: '✨', title: 'Explore With Demo Data', desc: 'Load sample data and explore — clear it any time', action: handleLoadDemo },
              ].map(opt => (
                <button key={opt.title} onClick={opt.action}
                  className="flex items-center gap-5 rounded-xl px-6 py-5 text-left transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#F5A623'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2937'}>
                  <span className="text-4xl flex-shrink-0" style={{ width: 60, textAlign: 'center' }}>{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>{opt.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{opt.desc}</p>
                  </div>
                  <ArrowRight size={20} style={{ color: '#4B5563', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── UPLOAD PHASE ── */}
        {phase === 'upload' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button onClick={() => setPhase('options')} className="flex items-center gap-1 text-sm mb-8" style={{ color: '#6B7280' }}>
              <ArrowLeft size={14} /> Back
            </button>

            <h2 className="text-2xl font-black mb-6 text-center" style={{ color: '#F9FAFB' }}>Upload Your Data</h2>

            <div
              className="rounded-2xl p-12 text-center cursor-pointer transition-colors"
              style={{
                backgroundColor: dragOver ? 'rgba(245,166,35,0.06)' : '#111318',
                border: `2px dashed ${dragOver ? '#F5A623' : '#1F2937'}`,
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={40} style={{ color: '#F5A623', margin: '0 auto 16px' }} />
              <p className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Drop any files here</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Lumio will work out where everything goes</p>
              <p className="text-xs mt-3" style={{ color: '#4B5563' }}>CSV, XLSX, DOCX, PDF, images — anything</p>
              <input ref={fileRef} type="file" multiple className="hidden"
                onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
            </div>

            {files.length > 0 && (
              <div className="mt-5 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-center gap-3">
                      <FileText size={16} style={{ color: '#F5A623' }} />
                      <span className="text-sm" style={{ color: '#F9FAFB' }}>{f.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
                <button onClick={handleProcessUpload} disabled={uploading}
                  className="w-full py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-50 mt-4"
                  style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                  {uploading ? <><Loader2 size={16} className="inline animate-spin mr-2" /> Processing...</> : 'Process & Import'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── IT TEAM PHASE ── */}
        {phase === 'it-team' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button onClick={() => setPhase('options')} className="flex items-center gap-1 text-sm mb-8" style={{ color: '#6B7280' }}>
              <ArrowLeft size={14} /> Back
            </button>

            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(245,166,35,0.12)' }}>
                <Mail size={28} style={{ color: '#F5A623' }} />
              </div>
              <h2 className="text-2xl font-black mb-2" style={{ color: '#F9FAFB' }}>Send instructions to your IT team</h2>
              <p className="text-sm mb-8" style={{ color: '#6B7280' }}>They&apos;ll receive everything they need to connect your systems to Lumio.</p>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Your email</label>
                  <input type="email" value={ownerEmail} readOnly className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#6B7280' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>IT team email</label>
                  <input type="email" value={itEmail} onChange={e => setItEmail(e.target.value)} placeholder="it@yourcompany.com"
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ backgroundColor: '#111318', border: '1px solid #374151', color: '#F9FAFB' }} />
                </div>
              </div>

              <button onClick={handleSendIT} disabled={itSending || itSent}
                className="w-full py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-50 mt-6"
                style={{ backgroundColor: itSent ? '#22C55E' : '#F5A623', color: '#0A0B10' }}>
                {itSent ? <><Check size={16} className="inline mr-2" /> Sent!</> : itSending ? 'Sending...' : 'Send Instructions'}
              </button>
            </div>
          </div>
        )}

        {/* ── CONNECT APPS PHASE ── */}
        {phase === 'connect-apps' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button onClick={() => setPhase('options')} className="flex items-center gap-1 text-sm mb-8" style={{ color: '#6B7280' }}>
              <ArrowLeft size={14} /> Back
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(245,166,35,0.12)' }}>
                <Link2 size={28} style={{ color: '#F5A623' }} />
              </div>
              <h2 className="text-2xl font-black mb-2" style={{ color: '#F9FAFB' }}>Connect Your Apps</h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>Sync your existing tools so Lumio can pull in your data automatically</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { name: 'Office 365', icon: '📧', color: '#2563EB', desc: 'Email, Calendar, Teams' },
                { name: 'Slack', icon: '💬', color: '#7C3AED', desc: 'Messages & channels' },
                { name: 'Google Workspace', icon: '🔵', color: '#DC2626', desc: 'Gmail, Drive, Calendar' },
              ].map(app => (
                <div key={app.name} className="rounded-xl p-5 flex flex-col items-center text-center gap-3"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <span className="text-3xl">{app.icon}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{app.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{app.desc}</p>
                  </div>
                  <button
                    className="w-full py-2 rounded-lg text-xs font-semibold relative overflow-hidden"
                    style={{ backgroundColor: `${app.color}20`, color: app.color, border: `1px solid ${app.color}40` }}
                    onClick={() => {}}
                  >
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={onComplete}
              className="w-full text-center text-sm font-medium py-3 transition-colors"
              style={{ color: '#F5A623' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FBBF24' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#F5A623' }}
            >
              Configure all later in Settings →
            </button>
          </div>
        )}

        {/* ── DEMO LOADING PHASE ── */}
        {phase === 'demo-loading' && (
          <div className="flex flex-col items-center justify-center py-20 text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
            <Loader2 size={40} style={{ color: '#F5A623' }} className="animate-spin mb-6" />
            <p className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Loading sample data...</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>This takes a few seconds</p>
          </div>
        )}

        {/* ── DONE PHASE ── */}
        {phase === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-black mb-3" style={{ color: '#F9FAFB' }}>You&apos;re all set!</h2>
            {uploadResult.length > 0 && (
              <div className="rounded-xl p-5 text-left mb-6 w-full max-w-md" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                {uploadResult.map((s, i) => (
                  <p key={i} className="text-sm mb-1" style={{ color: '#9CA3AF' }}>{s}</p>
                ))}
              </div>
            )}
            <button onClick={onComplete}
              className="px-10 py-4 rounded-xl text-lg font-bold transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              Continue to your portal <ArrowRight size={18} className="inline ml-1" />
            </button>
          </div>
        )}

      </div>

      {/* Fade-in animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
