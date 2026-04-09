'use client'

import { useState, useRef } from 'react'
import type { SportKey, SportsDemoSession } from './SportsDemoGate'

interface Props {
  sport: SportKey
  accentColor: string
  sportLabel: string
  defaultClubName: string
  roles: Array<{ id: string; label: string; icon: string }>
  onComplete: (session: SportsDemoSession) => void
}

type Step = 'email' | 'otp' | 'profile' | 'role' | 'card'

export default function SportsOnboarding({
  sport, accentColor, sportLabel, defaultClubName, roles, onComplete
}: Props) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [clubName, setClubName] = useState(defaultClubName)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState(roles[0].id)
  const [animating, setAnimating] = useState(false)

  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const logoRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const accent = accentColor

  const goTo = (next: Step) => {
    setAnimating(true)
    setTimeout(() => { setStep(next); setAnimating(false) }, 180)
  }

  const sendOtp = async () => {
    if (!email || !email.includes('@')) return
    setSending(true)
    try {
      const res = await fetch('/api/sports-demo/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sport }),
      })
      const data = await res.json()
      if (data.success) { goTo('otp') }
      else { setOtpError(data.error || 'Failed to send code') }
    } catch { setOtpError('Network error — please try again') }
    setSending(false)
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    setOtpError('')
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
    if (next.every(d => d !== '') && next.join('').length === 6) {
      verifyOtp(next.join(''))
    }
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  const verifyOtp = async (code: string) => {
    setVerifying(true)
    setOtpError('')
    try {
      const bypass = code === '000000' && process.env.NODE_ENV !== 'production'
      if (bypass) { goTo('profile'); setVerifying(false); return }
      const res = await fetch('/api/sports-demo/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, sport }),
      })
      const data = await res.json()
      if (data.success) { goTo('profile') }
      else { setOtpError(data.error || 'Invalid code — please try again') }
    } catch { setOtpError('Network error — please try again') }
    setVerifying(false)
  }

  const handleImageUpload = (file: File, setter: (url: string) => void, maxSize = 2 * 1024 * 1024) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > maxSize) return
    const reader = new FileReader()
    reader.onload = e => { if (e.target?.result) setter(e.target.result as string) }
    reader.readAsDataURL(file)
  }

  const complete = () => {
    onComplete({
      email,
      clubName: clubName || defaultClubName,
      logoUrl,
      userName: userName || email.split('@')[0],
      userPhoto,
      role: selectedRole,
      sport,
      createdAt: Date.now(),
    })
  }

  const inputCls = "w-full bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
  const btnCls = "w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"

  const steps: Step[] = ['email', 'otp', 'profile', 'role', 'card']
  const stepIdx = steps.indexOf(step)
  const progress = ((stepIdx + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,8,15,0.97)', backdropFilter: 'blur(8px)' }}>
      <div className={`w-full max-w-md transition-all duration-180 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

        <div className="text-center mb-8">
          <div className="text-3xl mb-2">
            {sport === 'rugby' ? '🏉' : sport === 'golf' ? '⛳' : sport === 'tennis' ? '🎾' :
             sport === 'cricket' ? '🏏' : sport === 'darts' ? '🎯' : '⚽'}
          </div>
          <h1 className="text-xl font-bold text-white">Lumio {sportLabel}</h1>
          <p className="text-sm text-gray-500 mt-1">Interactive demo</p>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-1 mb-8">
          <div className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: accent }} />
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Enter your email</h2>
              <p className="text-sm text-gray-500">We&apos;ll send a 6-digit code. No password needed.</p>
            </div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              placeholder="you@yourclub.com" className={inputCls} autoFocus />
            {otpError && <p className="text-xs text-red-400">{otpError}</p>}
            <button onClick={sendOtp} disabled={!email || sending} className={btnCls}
              style={{ background: email ? accent : undefined }}>
              {sending ? <><span className="animate-spin inline-block">⟳</span> Sending code...</> : 'Send access code →'}
            </button>
            <p className="text-[10px] text-gray-600 text-center">No account needed · Takes 60 seconds · Your data stays on your device</p>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Check your email</h2>
              <p className="text-sm text-gray-500">We sent a 6-digit code to <span className="text-white">{email}</span></p>
            </div>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input key={i} ref={el => { otpRefs.current[i] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-[#0d1117] border border-gray-700 rounded-xl text-white focus:outline-none transition-colors"
                  style={{ borderColor: digit ? accent : undefined }}
                  autoFocus={i === 0} />
              ))}
            </div>
            {otpError && <p className="text-xs text-red-400 text-center">{otpError}</p>}
            {verifying && <p className="text-sm text-center" style={{ color: accent }}><span className="animate-spin inline-block mr-1">⟳</span> Verifying...</p>}
            <button onClick={() => { setStep('email'); setOtp(['','','','','','']); setOtpError('') }}
              className="w-full text-xs text-gray-600 hover:text-gray-400 text-center">← Use a different email</button>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Make it yours</h2>
              <p className="text-sm text-gray-500">Add your club and your details.</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider">Club / team name</label>
              <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder={defaultClubName} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider">Club badge / logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-500 transition-colors"
                  onClick={() => logoRef.current?.click()}>
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="logo" /> : <span className="text-2xl">🛡️</span>}
                </div>
                <div>
                  <button onClick={() => logoRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                    {logoUrl ? 'Change logo' : 'Upload logo'}
                  </button>
                  <p className="text-[10px] text-gray-600 mt-1">PNG, JPG · Max 2MB</p>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], setLogoUrl) }} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider">Your name</label>
              <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g. Steve Whitfield" className={inputCls} />
            </div>
            <button onClick={() => goTo('role')} className={btnCls} style={{ background: accent }}>Next →</button>
          </div>
        )}

        {step === 'role' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">What&apos;s your role?</h2>
              <p className="text-sm text-gray-500">We&apos;ll show you the view most relevant to you. You can switch roles at any time.</p>
            </div>
            <div className="space-y-2">
              {roles.map(r => (
                <button key={r.id} onClick={() => setSelectedRole(r.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                    selectedRole === r.id ? 'border-opacity-100 text-white' : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                  style={selectedRole === r.id ? { borderColor: accent, background: `${accent}15` } : undefined}>
                  <span className="text-xl flex-shrink-0">{r.icon}</span>
                  <span className="text-sm font-medium">{r.label}</span>
                  {selectedRole === r.id && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: `${accent}30`, color: accent }}>Selected</span>}
                </button>
              ))}
            </div>
            <button onClick={() => goTo('card')} className={btnCls} style={{ background: accent }}>Next →</button>
          </div>
        )}

        {step === 'card' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Your club card</h2>
              <p className="text-sm text-gray-500">Add your photo and you&apos;re ready. This appears on your profile throughout the demo.</p>
            </div>
            <div className="flex justify-center">
              <div className="relative w-44 h-60 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}10, #0d1117)` }}>
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white leading-none">{roles.find(r => r.id === selectedRole)?.icon}</div>
                    <div className="text-[8px] text-white/60 uppercase tracking-widest mt-0.5">{roles.find(r => r.id === selectedRole)?.label.split(' ').pop()}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 flex items-center justify-center" style={{ background: `${accent}30` }}>
                    {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="logo" /> : <span className="text-lg">🛡️</span>}
                  </div>
                </div>
                <div className="absolute inset-x-0 top-12 bottom-16 flex items-center justify-center"
                  onClick={() => photoRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {userPhoto
                    ? <img src={userPhoto} className="w-28 h-32 object-cover rounded-xl" alt="you" />
                    : <div className="w-28 h-32 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-white/40 transition-colors">
                        <span className="text-3xl">📸</span>
                        <span className="text-[9px] text-white/40">Tap to add photo</span>
                      </div>}
                </div>
                <div className="absolute bottom-0 inset-x-0 px-3 py-2.5" style={{ background: `linear-gradient(to top, ${accent}60, transparent)` }}>
                  <div className="text-xs font-bold text-white truncate text-center">{userName || email.split('@')[0]}</div>
                  <div className="text-[9px] text-white/60 truncate text-center">{clubName || defaultClubName}</div>
                </div>
                <div className="absolute top-1 right-1 text-[7px] text-white/20 font-bold tracking-widest">LUMIO</div>
              </div>
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], setUserPhoto) }} />
            {!userPhoto && (
              <button onClick={() => photoRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:border-gray-500 hover:text-white transition-all">
                📸 Add your photo
              </button>
            )}
            <button onClick={complete} className={btnCls} style={{ background: accent }}>Enter the demo →</button>
            <p className="text-[10px] text-gray-600 text-center">Photo stays on your device only · Never uploaded to our servers</p>
          </div>
        )}
      </div>
    </div>
  )
}
