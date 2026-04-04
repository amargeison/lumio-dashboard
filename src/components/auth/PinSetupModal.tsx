'use client'

import { useState, useRef } from 'react'
import { X, Check, Loader2, Lock, Mail } from 'lucide-react'

interface Props {
  email: string
  type: 'business' | 'school'
  onComplete: () => void
  onSkip: () => void
}

export default function PinSetupModal({ email, type, onComplete, onSkip }: Props) {
  const [step, setStep] = useState<'choose' | 'enter' | 'confirm' | 'done'>('choose')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleDigit(digits: string[], setDigits: (d: string[]) => void, refs: typeof inputRefs, index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(digits: string[], refs: typeof inputRefs, index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
  }

  async function handleSubmit() {
    const pinStr = pin.join('')
    const confirmStr = confirmPin.join('')
    if (pinStr !== confirmStr) { setError('PINs do not match'); setConfirmPin(['', '', '', '', '', '']); setTimeout(() => confirmRefs.current[0]?.focus(), 100); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: pinStr, type }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to set PIN'); setLoading(false); return }
      setStep('done')
      setTimeout(onComplete, 2000)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  function DigitBoxes({ digits, setDigits, refs }: { digits: string[]; setDigits: (d: string[]) => void; refs: typeof inputRefs }) {
    return (
      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <input key={i} ref={el => { refs.current[i] = el }} type="password" inputMode="numeric" maxLength={1}
            value={d} onChange={e => handleDigit(digits, setDigits, refs, i, e.target.value)}
            onKeyDown={e => handleKeyDown(digits, refs, i, e)}
            className="w-12 h-14 text-center text-xl font-bold rounded-xl"
            style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>
              {step === 'done' ? 'PIN set!' : 'Set up quick login'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {step === 'choose' ? 'How would you like to log in next time?' : step === 'done' ? 'You can change this in Settings' : 'Choose a 6-digit PIN'}
            </p>
          </div>
          {step !== 'done' && <button onClick={onSkip} className="p-1 rounded-lg" style={{ color: '#6B7280' }}><X size={18} /></button>}
        </div>

        <div className="p-6">
          {step === 'choose' && (
            <div className="space-y-3">
              <button onClick={() => { setStep('enter'); setTimeout(() => inputRefs.current[0]?.focus(), 100) }}
                className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-colors"
                style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                  <Lock size={18} style={{ color: '#0D9488' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>🔑 Set a PIN</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Choose a 6-digit PIN for instant access</p>
                </div>
              </button>
              <button onClick={onSkip}
                className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-colors"
                style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C3FC5' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
                  <Mail size={18} style={{ color: '#A78BFA' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>📧 Email code</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Send me a code each time</p>
                </div>
              </button>
            </div>
          )}

          {step === 'enter' && (
            <div className="space-y-5">
              <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>Enter a 6-digit PIN</p>
              <DigitBoxes digits={pin} setDigits={setPin} refs={inputRefs} />
              <button onClick={() => { if (pin.join('').length < 6) { setError('Enter all 6 digits'); return }; setError(''); setStep('confirm'); setTimeout(() => confirmRefs.current[0]?.focus(), 100) }}
                disabled={pin.join('').length < 6}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Next →
              </button>
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-5">
              <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>Confirm your PIN</p>
              <DigitBoxes digits={confirmPin} setDigits={setConfirmPin} refs={confirmRefs} />
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button onClick={handleSubmit} disabled={loading || confirmPin.join('').length < 6}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                {loading ? <><Loader2 size={14} className="animate-spin" /> Setting PIN...</> : 'Set PIN →'}
              </button>
              <button onClick={() => { setStep('enter'); setConfirmPin(['', '', '', '', '', '']); setError('') }}
                className="block mx-auto text-xs underline" style={{ color: '#6B7280' }}>
                Go back
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Check size={28} style={{ color: '#22C55E' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>PIN set!</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>You can always change this in Settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
