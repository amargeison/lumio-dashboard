'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function ActivatePage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading')
  const [slug, setSlug] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('error'); return }

    fetch(`/api/activate?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSlug(data.slug)
          setStatus('success')
          setTimeout(() => router.push(`/${data.slug}`), 2500)
        } else if (data.expired) {
          setStatus('expired')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [token, router])

  async function handleResend() {
    setResending(true)
    try {
      const email = prompt('Enter your account email to resend the activation link:')
      if (!email) { setResending(false); return }
      const res = await fetch('/api/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setResent(true)
    } catch { /* ignore */ }
    setResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#07080F' }}>
      <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {status === 'loading' && (
          <>
            <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: '#0D9488' }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Activating your account...</h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Just a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: '#22C55E' }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Account activated</h1>
            <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>Taking you to your dashboard...</p>
            {slug && (
              <a href={`/${slug}`} className="text-sm font-medium" style={{ color: '#0D9488' }}>
                Go to dashboard now
              </a>
            )}
          </>
        )}

        {status === 'expired' && (
          <>
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#F59E0B' }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>This link has expired</h1>
            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
              Activation links are valid for 24 hours. Request a new one below.
            </p>
            {resent ? (
              <p className="text-sm font-medium" style={{ color: '#22C55E' }}>New activation email sent — check your inbox.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: resending ? 0.6 : 1 }}
              >
                {resending ? 'Sending...' : 'Resend activation email'}
              </button>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#EF4444' }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Invalid activation link</h1>
            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
              This link is no longer valid. If you need a new one, enter your email below.
            </p>
            {resent ? (
              <p className="text-sm font-medium" style={{ color: '#22C55E' }}>New activation email sent — check your inbox.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: resending ? 0.6 : 1 }}
              >
                {resending ? 'Sending...' : 'Resend activation email'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
