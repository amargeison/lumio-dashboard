'use client'

import { useState } from 'react'
import { Check, X, Play } from 'lucide-react'

export default function TellMeMoreModal({ onClose, onStartTrial }: { onClose: () => void; onStartTrial: () => void }) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/demo/tell-me-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch { /* silent */ }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* Left — info + email capture */}
          <div className="p-8 flex flex-col gap-5">
            <button onClick={onClose} className="self-end p-1 -mt-2 -mr-2"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
              <X size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>See it in action</h2>
              <p className="text-sm mt-1.5" style={{ color: '#9CA3AF' }}>
                3-minute walkthrough of Lumio running for a real SMB — new customer onboarded, invoice chased, support ticket routed, all automatically.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                'New customer → every system updated in 90 seconds',
                'Invoice overdue → Claude drafts the chase email automatically',
                'New hire → IT, HR, and payroll all provisioned before day one',
                '150 workflows shown, any one activatable in 5 minutes',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#9CA3AF' }}>
                  <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#0D9488' }} />
                  {item}
                </li>
              ))}
            </ul>
            {!sent ? (
              <form onSubmit={submit} className="space-y-3">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
                  Send me the link
                </button>
              </form>
            ) : (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p className="text-sm font-medium" style={{ color: '#0D9488' }}>Video link sent ✓</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Check your inbox</p>
              </div>
            )}
            <button onClick={onStartTrial} className="text-sm font-medium" style={{ color: '#0D9488' }}>
              Skip the video — start your trial now →
            </button>
          </div>

          {/* Right — video embed */}
          <div className="flex items-center justify-center" style={{ backgroundColor: '#07080F', borderLeft: '1px solid #1F2937' }}>
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-3"
              style={{ color: '#6B7280' }}>
              {/* Replace this div with an <iframe> when your Loom/Vimeo is ready */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <Play size={24} style={{ color: '#0D9488' }} />
              </div>
              <p className="text-sm">Video walkthrough</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
