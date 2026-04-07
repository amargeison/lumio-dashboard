'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, X } from 'lucide-react'

const STEPS = [
  { title: 'Welcome', body: 'This is your Lumio portal. Everything your business needs, in one place.', target: '' },
  { title: 'Navigation', body: 'Use the sidebar to navigate between departments.', target: 'aside:not(.md\\:hidden)' },
  { title: 'Morning Briefing', body: 'Every morning, Lumio gives you a personalised briefing.', target: 'main' },
  { title: 'Departments', body: 'Each department has its own workspace — HR, Finance, Operations and more.', target: 'aside:not(.md\\:hidden) nav' },
  { title: 'Settings', body: 'Manage your team, data, and integrations in Settings.', target: '' },
  { title: 'Get Started!', body: "You're all set. Let's go!", target: '' },
]

const STORAGE_KEY = 'lumio_tabguide_step'

export default function TabGuide({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 0
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? Math.min(parseInt(saved) || 0, STEPS.length - 1) : 0
  })
  const [rect, setRect] = useState<DOMRect | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const findTarget = useCallback(() => {
    if (!current.target) { setRect(null); return }
    try {
      const el = document.querySelector(current.target)
      if (el) setRect(el.getBoundingClientRect())
      else setRect(null)
    } catch { setRect(null) }
  }, [current.target])

  useEffect(() => {
    findTarget()
    const timer = setTimeout(findTarget, 100) // retry after render
    window.addEventListener('resize', findTarget)
    return () => { window.removeEventListener('resize', findTarget); clearTimeout(timer) }
  }, [findTarget, step])

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, String(step))
  }, [step])

  function next() {
    if (isLast) { localStorage.removeItem(STORAGE_KEY); onComplete(); return }
    setStep(s => s + 1)
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  function dismiss() {
    localStorage.removeItem(STORAGE_KEY)
    onComplete()
  }

  // Tooltip position: below the target if found, centred if not
  let tooltipTop = '50%'
  let tooltipLeft = '50%'
  let tooltipTransform = 'translate(-50%, -50%)'

  if (rect && typeof window !== 'undefined') {
    const below = rect.bottom + 16
    const maxLeft = window.innerWidth - 340
    tooltipTop = `${Math.min(below, window.innerHeight - 200)}px`
    tooltipLeft = `${Math.max(16, Math.min(rect.left, maxLeft))}px`
    tooltipTransform = 'none'
  }

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[250]" style={{ backgroundColor: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />

      {/* Spotlight ring */}
      {rect && (
        <div className="fixed z-[255] pointer-events-none rounded-xl" style={{
          top: rect.top - 6, left: rect.left - 6,
          width: rect.width + 12, height: rect.height + 12,
          border: '2px solid #F5A623',
          boxShadow: '0 0 24px rgba(245,166,35,0.25)',
        }} />
      )}

      {/* Tooltip card */}
      <div className="fixed z-[260] w-80" style={{ top: tooltipTop, left: tooltipLeft, transform: tooltipTransform }}>
        <div className="rounded-xl shadow-2xl" style={{ backgroundColor: '#0F1629', border: '1px solid rgba(245,166,35,0.3)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
                {step + 1} / {STEPS.length}
              </span>
              <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{current.title}</span>
            </div>
            <button onClick={dismiss} className="p-1 rounded hover:bg-white/5" style={{ color: '#6B7280' }}><X size={14} /></button>
          </div>

          <div className="px-4 py-4">
            <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{current.body}</p>
          </div>

          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1F2937' }}>
            {step > 0 ? (
              <button onClick={back} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#6B7280' }}>
                <ArrowLeft size={12} /> Back
              </button>
            ) : <div />}
            <button onClick={next}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              {isLast ? 'Get Started!' : <>Next <ArrowRight size={12} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
