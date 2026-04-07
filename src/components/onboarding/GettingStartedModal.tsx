'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, X, Mail } from 'lucide-react'

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', width: '100%' }

const TOTAL_STEPS = 1

interface Props {
  companyName: string
  ownerEmail: string
  sessionToken: string
  onComplete: () => void
}

export default function GettingStartedModal({ ownerEmail, sessionToken, onComplete }: Props) {
  const [inviteEmails, setInviteEmails] = useState(['', '', '', '', ''])
  const [finishing, setFinishing] = useState(false)
  const domain = ownerEmail?.split('@')[1] || 'company.com'

  // Lock body scroll and mark body as having onboarding open so other UI can hide
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('lumio-onboarding-open')
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.classList.remove('lumio-onboarding-open')
    }
  }, [])

  async function handleFinish() {
    if (finishing) return
    setFinishing(true)
    // Mark the tenant as onboarded — fire-and-forget, we don't block the UI on it.
    // NOTE: intentionally no workspace rebuild / demo reseed here.
    if (sessionToken) {
      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': sessionToken },
        }).catch(() => {})
      } catch { /* continue */ }
    }
    onComplete()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="w-full rounded-2xl flex flex-col" style={{ position: 'relative', zIndex: 100000, maxWidth: 640, maxHeight: '92vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <p className="text-xs font-semibold tracking-widest" style={{ color: '#0D9488' }}>STEP 1 OF {TOTAL_STEPS}</p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className="h-1 rounded-full" style={{ width: 40, backgroundColor: '#0D9488' }} />
              ))}
            </div>
          </div>
          <button onClick={onComplete} style={{ color: '#4B5563' }}><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Invite your team</h2>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Everyone gets their own magic link. Optional — you can do this later.</p>
            </div>
            <div className="space-y-2">
              {inviteEmails.map((email, i) => (
                <input
                  key={i}
                  value={email}
                  onChange={e => { const next = [...inviteEmails]; next[i] = e.target.value; setInviteEmails(next) }}
                  placeholder={`colleague${i + 1}@${domain}`}
                  style={S}
                />
              ))}
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                <Mail size={11} className="inline mr-1" style={{ color: '#0D9488' }} />
                Each invited person gets an email with a magic link to access the workspace instantly.
              </p>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 12, textAlign: 'center' }}>
              📷 You&apos;ll also find a personal photo frame on your dashboard — add your favourite photos once you&apos;re in.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: finishing ? 0.6 : 1 }}
          >
            Continue to your dashboard <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
