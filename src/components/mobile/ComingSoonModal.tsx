'use client'
import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export type ComingSoonModalProps = {
  /** Action / feature label — e.g. "Send Message", "Audio briefing". */
  label: string
  onClose: () => void
}

/**
 * Class A placeholder dialog for mobile portal stubs. Reused by the speaker
 * icon, every Quick Action, the "All 18 →" link, the Reply button on message
 * sheets, and any other mobile control that needs to acknowledge a tap before
 * the underlying feature ships.
 *
 * Theme tokens (--violet, --fuchsia, --bg-card, --text-primary, etc.) are
 * provided by MobileSportLayout. Backdrop dismiss + close button + Escape key.
 */
export function ComingSoonModal({ label, onClose }: ComingSoonModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
      style={{
        background: 'rgba(6, 2, 12, 0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgb(22, 16, 43) 0%, rgb(30, 23, 57) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.32)',
          boxShadow: '0 24px 60px -12px rgba(168, 85, 247, 0.4)',
          padding: '28px 24px 24px',
          animation: 'mobileCardIn 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(168, 85, 247, 0.12)',
            color: 'rgba(245, 243, 255, 0.85)',
          }}
        >
          <X size={16} />
        </button>

        <div
          className="text-[11px] font-bold uppercase mb-3"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            letterSpacing: '1.6px',
            color: 'rgba(196, 181, 253, 0.85)',
          }}
        >
          {label}
        </div>
        <div
          className="text-xl font-bold mb-2"
          style={{ color: 'rgb(245, 243, 255)' }}
        >
          Coming soon
        </div>
        <p
          className="text-sm leading-relaxed mb-5"
          style={{ color: 'rgba(196, 181, 253, 0.75)' }}
        >
          This is a Class A placeholder while the underlying flow ships.
          Tap close to keep exploring.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, rgb(168, 85, 247), rgb(217, 70, 239))',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
