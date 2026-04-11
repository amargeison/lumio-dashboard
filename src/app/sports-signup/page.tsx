'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPORTS = [
  { id: 'tennis', label: 'Tennis', icon: '🎾', color: '#7C3AED' },
  { id: 'golf', label: 'Golf', icon: '⛳', color: '#15803D' },
  { id: 'darts', label: 'Darts', icon: '🎯', color: '#dc2626' },
  { id: 'boxing', label: 'Boxing', icon: '🥊', color: '#dc2626' },
  { id: 'rugby', label: 'Rugby', icon: '🏉', color: '#7C3AED' },
  { id: 'cricket', label: 'Cricket', icon: '🏏', color: '#FBBF24' },
]

export default function SportsSignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'info'|'profile'|'done'>('info')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sport, setSport] = useState('')
  const [brandName, setBrandName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    if (!name || !email || !password || !sport) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sports-auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: name, sport, brandName }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signup failed.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07080F' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Lumio_Sports_logo.png" alt="Lumio Sports" style={{ height: 60, margin: '0 auto', objectFit: 'contain' }} />
          <div className="mt-4">
            <h1 className="text-2xl font-black text-white">Apply for Founding Access</h1>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
              We&apos;re onboarding our first 20 athletes free — no card, just feedback.
            </p>
          </div>
        </div>

        {step === 'info' && (
          <div className="rounded-2xl p-8 space-y-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex Rivera"
                className="w-full px-4 py-3 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Your sport</label>
              <div className="grid grid-cols-3 gap-2">
                {SPORTS.map(s => (
                  <button key={s.id} onClick={() => setSport(s.id)}
                    className="rounded-xl p-3 text-center transition-all"
                    style={{ backgroundColor: sport === s.id ? `${s.color}20` : '#111318', border: sport === s.id ? `1px solid ${s.color}` : '1px solid #1F2937' }}>
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-xs font-semibold" style={{ color: sport === s.id ? s.color : '#9CA3AF' }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password"
                className="w-full px-4 py-3 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Club / Brand name (optional)</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Team Rivera, Rolex partnership"
                className="w-full px-4 py-3 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={handleSignup} disabled={loading || !name || !email || !password || !sport}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: sport ? SPORTS.find(s => s.id === sport)?.color || '#7C3AED' : '#374151' }}>
              {loading ? 'Creating your account...' : 'Apply for Free Founding Access →'}
            </button>
            <p className="text-[11px] text-center" style={{ color: '#4B5563' }}>
              No credit card. No trial timer. Free founding access in exchange for feedback.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to Lumio Sports!</h2>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              Your founding member account is ready. You&apos;re one of our first 20 athletes.
            </p>
            <Link href={`/${sport}/${sport}-demo`}
              className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: SPORTS.find(s => s.id === sport)?.color || '#7C3AED' }}>
              Open your {SPORTS.find(s => s.id === sport)?.label} portal →
            </Link>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/sports" className="text-xs hover:underline" style={{ color: '#6B7280' }}>
            ← Back to Lumio Sports
          </Link>
        </div>
      </div>
    </div>
  )
}
