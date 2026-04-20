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

// Inject sport-specific manifest + apple-touch icon + theme-color into <head>.
// Page files are 'use client' so we can't use Next's metadata export — this is
// the cleanest mount-time injection.
function ensureHeadTags(sport: Sport) {
  if (typeof document === 'undefined') return

  const set = (selector: string, attrs: Record<string, string>, tag = 'meta') => {
    let el = document.head.querySelector<HTMLElement>(selector)
    if (!el) {
      el = document.createElement(tag)
      document.head.appendChild(el)
    }
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  }

  set('link[rel="manifest"]',                   { rel: 'manifest', href: `/manifest-${sport}.json` }, 'link')
  set('link[rel="apple-touch-icon"]',           { rel: 'apple-touch-icon', href: `/${sport}_logo.png` }, 'link')
  set('meta[name="theme-color"]',               { name: 'theme-color', content: THEME_COLORS[sport] })
  set('meta[name="apple-mobile-web-app-capable"]',          { name: 'apple-mobile-web-app-capable', content: 'yes' })
  set('meta[name="mobile-web-app-capable"]',                { name: 'mobile-web-app-capable', content: 'yes' })
  set('meta[name="apple-mobile-web-app-status-bar-style"]', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' })
  set('meta[name="apple-mobile-web-app-title"]',            { name: 'apple-mobile-web-app-title', content: SPORT_LABEL[sport] })
}

export function PwaInstaller({ sport }: { sport: Sport }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(`lumio_${sport}_pwa_dismissed`) === 'true')
    setIsOffline(typeof navigator !== 'undefined' && navigator.onLine === false)
  }, [sport])

  useEffect(() => {
    ensureHeadTags(sport)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
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
          📡 You&apos;re offline — showing cached data
        </div>
      )}

      {showInstallCard && (
        <div
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl p-4 shadow-2xl"
          style={{ backgroundColor: '#0d1117', border: `1px solid ${themeColor}` }}
        >
          <div className="text-sm font-bold text-white mb-1">Install {SPORT_LABEL[sport]}</div>
          <div className="text-xs text-gray-400 mb-3">
            Get the app on your home screen for offline access to your morning briefing and today&apos;s schedule.
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
    </>
  )
}
