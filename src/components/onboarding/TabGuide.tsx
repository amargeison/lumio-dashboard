'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, X } from 'lucide-react'

interface Step {
  title: string
  body: string
  target?: string // CSS selector for the element to highlight
}

const STEPS: Step[] = [
  { title: 'Welcome', body: 'This is your Lumio portal. Everything your business needs, in one place.' },
  { title: 'Navigation', body: 'Use the sidebar to navigate between departments.', target: 'aside' },
  { title: 'Morning Briefing', body: 'Every morning, Lumio gives you a personalised briefing.', target: '[data-guide="banner"]' },
  { title: 'Voice Commands', body: "Say 'Hey Lumio' to control the portal hands-free.", target: '[data-guide="mic"]' },
  { title: 'Departments', body: 'Each department has its own workspace — HR, Finance, Operations and more.', target: 'nav' },
  { title: 'Settings', body: 'Manage your team, data, and integrations in Settings.', target: '[data-guide="settings"]' },
  { title: 'Get Started!', body: "You're all set. Let's go!" },
]

interface Props {
  onComplete: () => void
}

export default function TabGuide({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const updatePosition = useCallback(() => {
    if (!current.target) { setPos(null); return }
    const el = document.querySelector(current.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    } else {
      setPos(null)
    }
  }, [current.target])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [updatePosition])

  function next() {
    if (isLast) { onComplete(); return }
    setStep(s => s + 1)
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = pos
    ? { position: 'fixed', top: pos.top + pos.height + 12, left: Math.max(16, Math.min(pos.left, window.innerWidth - 340)), zIndex: 300 }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 300 }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[250]" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />

      {/* Spotlight */}
      {pos && (
        <div className="fixed z-[260] pointer-events-none" style={{
          top: pos.top - 4, left: pos.left - 4,
          width: pos.width + 8, height: pos.height + 8,
          borderRadius: 12,
          border: '2px solid #F5A623',
          boxShadow: '0 0 0 4000px rgba(0,0,0,0.6), 0 0 20px rgba(245,166,35,0.3)',
        }} />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} className="w-80 rounded-xl overflow-hidden shadow-2xl"
        css-bg="#111318" >
        <div style={{ backgroundColor: '#111318', border: '1px solid rgba(245,166,35,0.3)' }} className="rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
                {step + 1} / {STEPS.length}
              </span>
              <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{current.title}</span>
            </div>
            <button onClick={onComplete} style={{ color: '#4B5563' }}><X size={14} /></button>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-sm" style={{ color: '#D1D5DB' }}>{current.body}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1F2937' }}>
            {step > 0 ? (
              <button onClick={back} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#6B7280' }}>
                <ArrowLeft size={12} /> Back
              </button>
            ) : <div />}
            <button onClick={next}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold"
              style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              {isLast ? 'Get Started!' : <>Next <ArrowRight size={12} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
