'use client'

// Coach-branded PWA install nudge + service-worker registration.
//
// Why net-new rather than reusing src/components/PwaInstaller.tsx: that shared
// component's `sport` prop is a closed union ('tennis'|'golf'|'darts'|'boxing')
// with per-sport labels/theme and no 'coach' entry, so it can't be consumed for
// the coach portal without editing shared PWA infra (out of scope). This mirrors
// its behaviour — prod-only /sw.js registration, a beforeinstallprompt card on
// Android/Chrome, and an iOS Share → Add to Home Screen hint — coach-branded via
// the portal's T/accent tokens. Installability itself comes from the manifest +
// layout metadata; this is just the nudge + SW.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const KEY = 'lumio_coach_pwa_dismissed'

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return iOS && webkit
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function CoachPwaInstaller({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(true)   // hidden until effects decide
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(KEY) === 'true')
    setShowIosHint(isIosSafari() && !isStandalone())
  }, [])

  useEffect(() => {
    // Service worker is prod-only — in dev it would cache stale HTML and serve
    // an offline fallback after recompiles. Mirrors the shared installer.
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      } else {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => {})
      }
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => { localStorage.setItem(KEY, 'true'); setDismissed(true) }
  const showInstallCard = !!installPrompt && !dismissed
  const showIosCard = showIosHint && !dismissed && !showInstallCard
  if (!showInstallCard && !showIosCard) return null

  const card: React.CSSProperties = {
    position: 'fixed', left: 12, right: 12, bottom: 'calc(64px + 22px + env(safe-area-inset-bottom) + 10px)',
    zIndex: 60, borderRadius: 14, padding: 14,
    background: T.panel, border: `1px solid ${accent.border}`, boxShadow: '0 20px 50px -16px rgba(0,0,0,0.6)',
  }

  return (
    <div style={card} role="dialog" aria-label="Install Lumio Coach">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>Install Lumio Coach</div>
          {showInstallCard ? (
            <div style={{ fontSize: 11.5, color: T.text3 }}>Add it to your home screen for a full-screen, app-like experience.</div>
          ) : (
            <div style={{ fontSize: 11.5, color: T.text3 }}>Tap <strong style={{ color: T.text }}>Share</strong> ⬆︎ → <strong style={{ color: T.text }}>Add to Home Screen</strong> to install.</div>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" style={{ flexShrink: 0, background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      {showInstallCard && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={async () => {
              if (!installPrompt) return
              await installPrompt.prompt()
              const { outcome } = await installPrompt.userChoice
              if (outcome === 'dismissed') dismiss()
              setInstallPrompt(null)
            }}
            style={{ flex: 1, appearance: 'none', border: 0, padding: '9px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            Install
          </button>
          <button onClick={dismiss} style={{ appearance: 'none', padding: '9px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>
            Not now
          </button>
        </div>
      )}
    </div>
  )
}
