'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Mail, X } from 'lucide-react'

export default function ActivationBanner() {
  const [status, setStatus] = useState<'hidden' | 'banner' | 'blocking'>('hidden')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [email, setEmail] = useState('')
  const [blockingEmail, setBlockingEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    if (!token) return

    fetch('/api/workspace/activation-status', {
      headers: { 'x-workspace-token': token },
    })
      .then(r => r.json())
      .then(data => {
        if (data.activated) return // already activated
        if (data.accountAgeHours > 24) {
          setStatus('blocking')
          setBlockingEmail(data.email || '')
        } else {
          setStatus('banner')
        }
      })
      .catch(() => {})
  }, [])

  async function handleResend(emailAddr: string) {
    if (!emailAddr) return
    setResending(true)
    try {
      await fetch('/api/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr }),
      })
      setResent(true)
    } catch { /* ignore */ }
    setResending(false)
  }

  if (status === 'hidden' || dismissed) return null

  if (status === 'blocking') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
        <div className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: '#F59E0B' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Activate your account to continue</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
            Your activation link has expired. Enter your email below to receive a new one.
          </p>
          {resent ? (
            <p className="text-sm font-medium" style={{ color: '#22C55E' }}>
              Activation email sent — check your inbox.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={blockingEmail || email}
                onChange={e => { setEmail(e.target.value); setBlockingEmail(e.target.value) }}
                placeholder="your@email.com"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}
              />
              <button
                onClick={() => handleResend(blockingEmail || email)}
                disabled={resending}
                className="w-full px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: resending ? 0.6 : 1 }}
              >
                <Mail size={14} className="inline mr-2" />
                {resending ? 'Sending...' : 'Resend activation email'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Subtle amber banner
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
      style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
        <span style={{ color: '#F59E0B' }}>
          Please check your email and click the activation link to fully activate your account.
        </span>
        {resent ? (
          <span className="text-xs font-medium" style={{ color: '#22C55E' }}>Sent!</span>
        ) : (
          <button
            onClick={() => {
              const addr = prompt('Enter your account email:')
              if (addr) handleResend(addr)
            }}
            disabled={resending}
            className="text-xs font-semibold underline"
            style={{ color: '#F59E0B' }}
          >
            {resending ? 'Sending...' : 'Resend email'}
          </button>
        )}
      </div>
      <button onClick={() => setDismissed(true)} style={{ color: '#F59E0B' }}>
        <X size={14} />
      </button>
    </div>
  )
}
