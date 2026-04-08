'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'

const DEMO_PIN = '071711'
const ACCENT = '#6C63FF'
const ACCENT_BG = '#6C63FF1f'

type Phase = 'loading' | 'pin' | 'pick' | 'ready'

export default function FootballPinGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('lumio_football_demo_active')) {
      setPhase('ready')
    } else {
      setPhase('pin')
    }
  }, [])

  function handleChange(i: number, val: string) {
    const c = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = c
    setDigits(next)
    if (c && i < 5) refs.current[i + 1]?.focus()
    if (c && i === 5) {
      const pin = next.join('')
      if (pin === DEMO_PIN) {
        setError('')
        setPhase('pick')
      } else {
        setError('Incorrect PIN')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => refs.current[0]?.focus(), 100)
      }
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  function pickClub(slug: 'lumio-dev' | 'lumio-dev-afc') {
    localStorage.setItem('lumio_football_demo_active', 'true')
    localStorage.setItem('lumio_football_club', slug)
    setPhase('ready')
  }

  if (phase === 'loading') return <div />
  if (phase === 'ready') return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center" style={{ backgroundColor: '#07080F', color: '#F9FAFB', minHeight: '100vh' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT_BG }}>
            <Lock size={24} style={{ color: ACCENT }} />
          </div>
        </div>

        {phase === 'pin' && (
          <>
            <h1 className="text-lg font-bold text-center mb-1">Football Demo</h1>
            <p className="text-xs text-center mb-6" style={{ color: '#6B7280' }}>Enter the 6-digit PIN to access the demo portal</p>
            <div className="flex justify-center gap-2 mb-4">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-bold rounded-xl"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
                />
              ))}
            </div>
            {error && <p className="text-xs text-center mb-3" style={{ color: '#EF4444' }}>{error}</p>}
            <p className="text-[10px] text-center" style={{ color: '#4B5563' }}>Lumio Football &middot; Demo data pre-loaded</p>
          </>
        )}

        {phase === 'pick' && (
          <>
            <h1 className="text-lg font-bold text-center mb-1">Choose your demo club</h1>
            <p className="text-xs text-center mb-6" style={{ color: '#6B7280' }}>Pick which club identity to load</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => pickClub('lumio-dev')}
                className="w-full py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#6C63FF', color: '#FFFFFF', border: '1px solid #6C63FF' }}
              >
                Lumio FC
              </button>
              <button
                onClick={() => pickClub('lumio-dev-afc')}
                className="w-full py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0033A0', color: '#FFD700', border: '1px solid #0033A0' }}
              >
                AFC Wimbledon
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
