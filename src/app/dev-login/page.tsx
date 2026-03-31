'use client'

import { useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

function DevLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') || '/home'

  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 3) inputRefs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 4) {
      submitPin(next.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      setDigits(pasted.split(''))
      inputRefs.current[3]?.focus()
      submitPin(pasted)
    }
  }

  async function submitPin(pin: string) {
    setError(false)
    setLoading(true)
    try {
      const res = await fetch('/api/dev-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (res.ok) {
        router.push(redirectTo)
      } else {
        setError(true)
        setShake(true)
        setDigits(['', '', '', ''])
        setTimeout(() => { setShake(false); inputRefs.current[0]?.focus() }, 500)
      }
    } catch {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07080F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 360, width: '100%', padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 140, height: 'auto', margin: '0 auto', objectFit: 'contain' }} />
        </div>

        <h1 style={{ color: '#F9FAFB', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Dev Preview</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>Enter the 4-digit PIN to access the dev environment</p>

        <div
          style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, animation: shake ? 'devShake 0.4s ease-in-out' : undefined }}
          onPaste={handlePaste}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
              style={{
                width: 56, height: 64, textAlign: 'center', fontSize: 24, fontWeight: 700,
                backgroundColor: '#111318', border: error ? '2px solid #EF4444' : '2px solid #1F2937',
                borderRadius: 12, color: '#F9FAFB', outline: 'none', caretColor: 'transparent',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = error ? '#EF4444' : '#6C3FC5' }}
              onBlur={e => { e.currentTarget.style.borderColor = error ? '#EF4444' : '#1F2937' }}
            />
          ))}
        </div>

        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>Incorrect PIN</p>
        )}

        <button
          onClick={() => { const pin = digits.join(''); if (pin.length === 4) submitPin(pin) }}
          disabled={loading || digits.some(d => !d)}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12,
            backgroundColor: '#6C3FC5', color: '#F9FAFB', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: loading || digits.some(d => !d) ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>

        <p style={{ color: '#374151', fontSize: 11, marginTop: 24 }}>This gate only applies to dev/preview environments</p>
      </div>

      <style>{`
        @keyframes devShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

export default function DevLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#07080F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6B7280' }}>Loading...</p>
      </div>
    }>
      <DevLoginContent />
    </Suspense>
  )
}
