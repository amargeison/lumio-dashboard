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

import { useEffect, useRef, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const KEY = 'lumio_coach_pwa_dismissed'
// "Not now" means not now, not never. The dismissal is remembered as a time,
// and the card is offered again after this long. (It used to store a plain
// "true" for ever, with no other way to install; that old value reads as
// "not a time", so those coaches are simply offered the card once more.)
const REOFFER_AFTER_MS = 30 * 24 * 60 * 60 * 1000

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(KEY))
    return Number.isFinite(at) && at > 0 && Date.now() - at < REOFFER_AFTER_MS
  } catch { return false }
}

// The cookie notice is answered first. Two cards at the bottom of a phone at
// once sat on top of each other; the install card can wait.
function cookieNoticeShowing(): boolean {
  try { return !localStorage.getItem('lumio_cookie_consent') } catch { return false }
}

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
  const [updateReady, setUpdateReady] = useState(false)   // a new SW is waiting to activate
  const reloadingRef = useRef(false)                      // set when the user opts to reload
  const [cookieNotice, setCookieNotice] = useState(true)  // hold back until the cookie notice is answered
  // Phone layout has the fixed bottom tab bar (same breakpoint as useIsMobile);
  // the cards sit above it. Wider screens have no bar: bottom-right corner.
  const [phone, setPhone] = useState(true)

  useEffect(() => {
    setDismissed(recentlyDismissed())
    setShowIosHint(isIosSafari() && !isStandalone())
    setCookieNotice(cookieNoticeShowing())
    const onConsent = () => setCookieNotice(false)
    window.addEventListener('lumio:cookie-consent', onConsent)
    const mql = window.matchMedia('(max-width: 767px)')
    const onSize = () => setPhone(mql.matches)
    onSize()
    mql.addEventListener('change', onSize)
    return () => {
      window.removeEventListener('lumio:cookie-consent', onConsent)
      mql.removeEventListener('change', onSize)
    }
  }, [])

  useEffect(() => {
    // Service worker is prod-only — in dev it would cache stale HTML and serve
    // an offline fallback after recompiles. Mirrors the shared installer.
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        // When the user opts to update, the waiting SW activates and takes
        // control → reload once so the fresh HTML/assets load. Only reload on a
        // user-initiated update (not the first-install claim).
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloadingRef.current) window.location.reload()
        })
        navigator.serviceWorker.register('/sw.js').then(reg => {
          // A newer SW was already waiting from a previous visit.
          if (reg.waiting && navigator.serviceWorker.controller) setUpdateReady(true)
          // A newer SW is downloaded while the app is open → offer to reload.
          // It stays "waiting" (public/sw.js no longer takes over by itself)
          // until Reload is tapped or every window of the app is closed.
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing
            if (!nw) return
            nw.addEventListener('statechange', () => {
              // "installed" + an existing controller ⇒ it's an update, not the
              // first install — safe to prompt for a reload.
              if (nw.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true)
            })
          })
          // Proactively check for an update on each mount/launch.
          reg.update().catch(() => {})
        }).catch(() => {})
      } else {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => {})
      }
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => { try { localStorage.setItem(KEY, String(Date.now())) } catch { /* private mode */ } setDismissed(true) }
  // Tell the waiting SW to activate; controllerchange (above) then reloads.
  const applyUpdate = () => {
    if (!('serviceWorker' in navigator)) { window.location.reload(); return }
    reloadingRef.current = true
    navigator.serviceWorker.getRegistration()
      .then(reg => { if (reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' }); else window.location.reload() })
      .catch(() => window.location.reload())
  }
  // One card at a time: an update prompt takes the slot, the install card
  // waits for it (and for the cookie notice).
  const canOffer = !dismissed && !cookieNotice && !updateReady
  const showInstallCard = !!installPrompt && canOffer
  const showIosCard = showIosHint && canOffer && !showInstallCard
  if (!showInstallCard && !showIosCard && !updateReady) return null

  // Both cards use the same slot: just ABOVE the 64px tab bar on a phone (the
  // update card used to be drawn over the bar, blocking the tabs), bottom-right
  // where there is no bar.
  const slot: React.CSSProperties = phone
    ? { position: 'fixed', left: 12, right: 12, bottom: 'calc(64px + env(safe-area-inset-bottom) + 10px)' }
    : { position: 'fixed', right: 16, bottom: 16, width: 360, maxWidth: 'calc(100vw - 32px)' }

  const card: React.CSSProperties = {
    // 50: above the page and the tab bar (40), BELOW every pop-up (60 and up).
    // At 60 it sat on top of an open Settings card and covered its Done button.
    ...slot, zIndex: 50, borderRadius: 14, padding: 14,
    background: T.panel, border: `1px solid ${accent.border}`, boxShadow: '0 20px 50px -16px rgba(0,0,0,0.6)',
  }

  const updateCard: React.CSSProperties = {
    ...slot, zIndex: 50, borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12,
    background: T.panel, border: `1px solid ${accent.hex}`, boxShadow: '0 20px 50px -16px rgba(0,0,0,0.6)',
  }

  return (
    <>
      {updateReady && (
        <div style={updateCard} role="dialog" aria-label="Update available">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Update available</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>A newer version of Lumio Coach is ready.</div>
          </div>
          <button onClick={() => setUpdateReady(false)} aria-label="Later" style={{ appearance: 'none', background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', fontSize: 12.5, minWidth: 44, minHeight: 40, padding: '0 6px' }}>Later</button>
          <button onClick={applyUpdate} style={{ appearance: 'none', border: 0, padding: '9px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reload</button>
        </div>
      )}
      {(showInstallCard || showIosCard) && (
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
        <button onClick={dismiss} aria-label="Dismiss" style={{ flexShrink: 0, background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', fontSize: 18, lineHeight: 1, width: 40, height: 40, margin: '-10px -10px -6px 0' }}>×</button>
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
      )}
    </>
  )
}
