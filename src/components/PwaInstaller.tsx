'use client'

import { useEffect, useState } from 'react'

type Sport = 'tennis' | 'golf' | 'darts' | 'boxing'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const THEME_COLORS: Record<Sport, string> = {
  tennis: '#0EA5E9',
  golf:   '#15803D',
  darts:  '#dc2626',
  boxing: '#dc2626',
}

const SPORT_LABEL: Record<Sport, string> = {
  tennis: 'Lumio Tennis',
  golf:   'Lumio Golf',
  darts:  'Lumio Darts',
  boxing: 'Lumio Fight',
}

// Manifest link, theme-color, apple-web-app tags and apple-touch-icon are
// now all emitted at SSR time by each sport's [slug]/layout.tsx via
// generateMetadata. Previously this component injected them client-side,
// which caused iOS Safari to pick up the root /manifest.json in the
// initial HTML before the override ran — so the installed PWA opened at
// the root site instead of the sport portal. The SSR metadata API takes
// over that responsibility. This component now only handles SW
// registration, the install-prompt card, and the offline indicator.

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
    // iOS legacy prop — narrowed through a typed guard
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

// Call this when somebody signs out. A phone is shared: nothing the last
// person loaded may still be on the device for the next one. The service
// worker no longer stores anything private, but a phone can keep running an
// OLDER worker (one that did) until its app is next closed, so sign-out empties
// the caches itself rather than trusting whichever worker is in charge. The
// "lumio-static-…" cache is kept: it holds only the offline page and public
// logos, and without it there is no offline page until the next update. So is
// "lumio-assets-…": the app's own build files and public images, the same for
// everybody, which is what lets the app carry on with no signal.
// Never throws — signing out must not fail because a cache could not be cleared.
//
// Also called when somebody signs IN, and when a signed-in page starts, before
// its first request: an older worker answers from its store first, so the next
// person to sign in on a phone left on the sign-in page was shown the last
// family's child until they refreshed. With the store emptied there is nothing
// for it to answer with.
export async function clearPrivateCaches(): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => !k.startsWith('lumio-static-') && !k.startsWith('lumio-assets-')).map(async k => {
      await caches.delete(k)
      // An older worker's private store is left behind EMPTY rather than gone:
      // its name is how the new worker knows it is replacing one of those and
      // must take over at once (public/sw.js, install), and it deletes it then.
      if (k.startsWith('lumio-api-') || k.startsWith('lumio-html-')) await caches.open(k)
    }))
  } catch { /* nothing more we can do from the page */ }
}

export function PwaInstaller({ sport }: { sport: Sport }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  // iOS doesn't fire beforeinstallprompt — we render a static hint there
  // instead, telling the user to tap Share → Add to Home Screen. When
  // the Safari session is authenticated the manifest route mints an
  // install token into start_url on every request, so the user's next
  // Share tap re-fetches the manifest and picks up a fresh token.
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(`lumio_${sport}_pwa_dismissed`) === 'true')
    setIsOffline(typeof navigator !== 'undefined' && navigator.onLine === false)
    setShowIosHint(isIosSafari() && !isStandalone())
  }, [sport])

  useEffect(() => {
    // Never run a service worker in dev. Previously the SW would cache
    // stale dev HTML and then serve the offline fallback whenever the
    // dev server restarted or recompiled — so localhost would render
    // "You're offline" even while `next dev` was healthy. Keeping the
    // SW prod-only also auto-unregisters any worker already installed
    // on an existing dev machine, so no one has to hand-nuke storage.
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      } else {
        navigator.serviceWorker.getRegistrations()
          .then(regs => { regs.forEach(r => r.unregister()) })
          .catch(() => {})
        if ('caches' in window) {
          caches.keys()
            .then(keys => Promise.all(keys.map(k => caches.delete(k))))
            .catch(() => {})
        }
      }
    }

    const installHandler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    const onlineHandler  = () => setIsOffline(false)
    const offlineHandler = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', installHandler)
    window.addEventListener('online',  onlineHandler)
    window.addEventListener('offline', offlineHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', installHandler)
      window.removeEventListener('online',  onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  }, [sport])

  const showInstallCard = installPrompt && !dismissed
  const showIosCard = showIosHint && !dismissed
  const themeColor = THEME_COLORS[sport]

  return (
    <>
      {isOffline && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-xs font-semibold shadow-lg"
          style={{ backgroundColor: '#0d1117', color: '#FCD34D', border: '1px solid #F59E0B' }}
          role="status"
          aria-live="polite"
        >
          📡 You&apos;re offline — reconnect to carry on
        </div>
      )}

      {showInstallCard && (
        <div
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl p-4 shadow-2xl"
          style={{ backgroundColor: '#0d1117', border: `1px solid ${themeColor}` }}
        >
          <div className="text-sm font-bold text-white mb-1">Install {SPORT_LABEL[sport]}</div>
          <div className="text-xs text-gray-400 mb-3">
            Add it to your home screen to open your portal full-screen with one tap.
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!installPrompt) return
                await installPrompt.prompt()
                const { outcome } = await installPrompt.userChoice
                if (outcome === 'dismissed') {
                  localStorage.setItem(`lumio_${sport}_pwa_dismissed`, 'true')
                  setDismissed(true)
                }
                setInstallPrompt(null)
              }}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: themeColor }}
            >
              Install
            </button>
            <button
              onClick={() => {
                localStorage.setItem(`lumio_${sport}_pwa_dismissed`, 'true')
                setDismissed(true)
              }}
              className="py-2 px-3 rounded-lg text-xs text-gray-400 border border-gray-700"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {showIosCard && !showInstallCard && (
        <div
          className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-50 rounded-xl p-4 shadow-2xl"
          style={{ backgroundColor: '#0d1117', border: `1px solid ${themeColor}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-white mb-1">Install {SPORT_LABEL[sport]}</div>
              <div className="text-xs text-gray-400">
                Tap <span className="font-semibold text-white">Share</span>{' '}
                <span className="inline-block" aria-hidden>⬆︎</span>{' '}
                → <span className="font-semibold text-white">Add to Home Screen</span>. If you&apos;re signed in, the installed app opens straight into the portal — no code required.
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem(`lumio_${sport}_pwa_dismissed`, 'true')
                setDismissed(true)
              }}
              className="shrink-0 text-lg leading-none text-gray-500 hover:text-gray-300"
              aria-label="Dismiss install hint"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
