'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
    setStep('otp'); setLoading(false)
  }

  async function handleVerify() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return }
    localStorage.setItem('admin_session_token', data.session_token)
    localStorage.setItem('admin_name', data.admin.name || '')
    localStorage.setItem('admin_role', data.admin.role || '')
    localStorage.setItem('admin_email', data.admin.email || '')
    router.replace('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#07080F' }}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <Image src="/lumio-logo-primary.png" alt="Lumio" width={240} height={120} style={{ width: 140, height: 'auto', margin: '0 auto' }} />
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
            Admin Portal
          </div>
        </div>

        {step === 'email' ? (
          <div className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email address"
              className="w-full rounded-xl px-4 py-3 text-sm text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}
              onKeyDown={e => e.key === 'Enter' && handleSendCode()} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={handleSendCode} disabled={loading || !email} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              {loading ? <Loader2 size={14} className="inline animate-spin" /> : 'Send Login Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: '#6B7280' }}>Code sent to {email}</p>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"
              className="w-full rounded-xl px-4 py-3 text-2xl font-bold text-center tracking-[0.3em]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={handleVerify} disabled={loading || code.length < 6} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              {loading ? <Loader2 size={14} className="inline animate-spin" /> : 'Verify & Sign In'}
            </button>
            <button onClick={() => { setStep('email'); setCode(''); setError('') }} className="text-xs" style={{ color: '#6B7280' }}>Use a different email</button>
          </div>
        )}
      </div>
    </div>
  )
}
