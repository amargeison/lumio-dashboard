'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleVerify() {
    if (code.length < 6) return
    setLoading(true); setError('')
    const res = await fetch('/api/admin/verify-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Invalid PIN'); setLoading(false); return }
    localStorage.setItem('admin_session_token', data.token)
    localStorage.setItem('admin_name', data.name || 'Admin')
    localStorage.setItem('admin_role', data.role || 'superadmin')
    localStorage.setItem('admin_email', data.email || 'admin@lumiocms.com')
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

        <div className="space-y-4">
          <p className="text-xs" style={{ color: '#6B7280' }}>Enter admin PIN to continue</p>
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            className="w-full rounded-xl px-4 py-4 text-2xl font-bold text-center tracking-[0.3em]"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleVerify}
            disabled={loading || code.length < 6}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}
          >
            {loading ? <Loader2 size={14} className="inline animate-spin" /> : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
