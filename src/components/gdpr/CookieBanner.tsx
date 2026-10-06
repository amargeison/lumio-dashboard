'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type ConsentLevel = 'all' | 'essential' | null

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)
  // How tall the notice is on screen, so the page can be given that much extra
  // room at the bottom (see the spacer below).
  const strip = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!show) return
    const el = strip.current
    if (!el) return
    const root = document.documentElement
    const measure = () => {
      const box = el.getBoundingClientRect()
      setHeight(Math.ceil(box.height))
      // For full-screen layers that scroll by themselves (the first-run wizard):
      // they add this to their own bottom padding. Measured from the bottom of
      // the window, so it includes a tab bar the notice is sitting above.
      root.style.setProperty('--lumio-cookie-h', `${Math.max(0, Math.ceil(window.innerHeight - box.top))}px`)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); root.style.removeProperty('--lumio-cookie-h') }
  }, [show, showDetails])

  useEffect(() => {
    // Client website previews (e.g. /oxed) carry their own branding — the Lumio banner must not appear there.
    if (/^\/oxed(\/|$)/.test(window.location.pathname)) return
    const consent = localStorage.getItem('lumio_cookie_consent')
    if (!consent) setShow(true)
  }, [])

  const accept = (level: ConsentLevel) => {
    const prefs = {
      essential: true,
      analytics: level === 'all' ? analytics : false,
      marketing: level === 'all' ? marketing : false,
      timestamp: new Date().toISOString(),
      level,
    }
    localStorage.setItem('lumio_cookie_consent', JSON.stringify(prefs))
    fetch('/api/gdpr/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    }).catch(() => {})
    setShow(false)
    // Lets anything that was waiting for this notice to go (the coach app's
    // install card) appear now rather than on the next visit.
    window.dispatchEvent(new Event('lumio:cookie-consent'))
  }

  if (!show) return null

  return (
    // --lumio-bottom-bar is set by an app shell that has a fixed bottom tab bar
    // (the coach phone app): the notice then sits above the bar, so the tabs
    // stay usable while it is showing. Everywhere else it is 0.
    //
    // The strip is as wide as the window but the card is centred in it, so the
    // strip itself must not take clicks: its empty ends sat over whatever was in
    // the page's bottom corners (the coach portal's profile menu, for one) and
    // swallowed every click there until the notice was answered.
    //
    // THE NOTICE MUST NEVER COVER A PAGE'S MAIN BUTTON. On a phone it sat over
    // "Book" on the booking page and "Send" on the camp sign-up, and under the
    // first-run wizard where it could not be answered at all. So:
    //   · it is a short bar on a phone (two lines and two buttons);
    //   · an empty block of the same height is added to the end of the page
    //     while it shows, so whatever is at the bottom can be scrolled clear;
    //   · it is drawn above everything else, wizard and dialogs included, so it
    //     can always be answered — and its height is published as
    //     --lumio-cookie-h for full-screen layers that scroll by themselves.
    <>
    <div aria-hidden style={{ height }} />
    <div ref={strip} className="fixed left-0 right-0 z-[10050] p-2 md:p-4 pointer-events-none" style={{ bottom: 'var(--lumio-bottom-bar, 0px)' }}>
      <div className="max-w-4xl mx-auto bg-gray-900 border border-white/15 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-2xl pointer-events-auto">
        {!showDetails ? (
          <div className="flex items-start gap-2 md:gap-4 flex-wrap md:flex-nowrap">
            {/* Full width on a phone, so the buttons drop underneath. Side by
                side, the text was squeezed into a ~110px column and the notice
                grew to half the screen. */}
            <div className="w-full md:w-auto md:flex-1 min-w-0">
              <p className="hidden md:block text-sm font-semibold text-white mb-1">🍪 Cookie preferences</p>
              <p className="text-xs text-gray-400 leading-snug md:leading-relaxed">
                {/* The short wording is the phone's: every line here is a line of
                    somebody's page that cannot be seen. */}
                <span className="md:hidden">We use essential cookies, and optional analytics cookies to improve Lumio.</span>
                <span className="hidden md:inline">We use essential cookies to make Lumio work, and optional analytics cookies to improve the product. We never use advertising cookies or sell your data.</span>{' '}
                <button onClick={() => setShowDetails(true)} className="text-purple-400 underline">Manage preferences</button>
                {' '}·{' '}
                <Link href="/cookies" className="text-purple-400 underline">Cookie policy</Link>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 w-full md:w-auto md:mt-1">
              <button
                onClick={() => accept('essential')}
                className="flex-1 md:flex-none px-4 py-2 border border-white/20 text-gray-300 text-xs rounded-lg font-medium hover:border-white/30 hover:text-white transition-colors"
              >
                Essential only
              </button>
              <button
                onClick={() => accept('all')}
                className="flex-1 md:flex-none px-4 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition-colors"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-white mb-4">Manage cookie preferences</h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-200">Essential cookies</span>
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">Always active</span>
                  </div>
                  <p className="text-xs text-gray-500">Required for authentication, security, and basic functionality. Cannot be disabled.</p>
                </div>
                <div className="w-10 h-5 bg-green-600 rounded-full flex-shrink-0 mt-1" />
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-200 block mb-1">Analytics cookies</span>
                  <p className="text-xs text-gray-500">Help us understand how Lumio is used so we can improve it. No personal data shared externally.</p>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-10 h-5 rounded-full flex-shrink-0 mt-1 transition-colors relative ${analytics ? 'bg-purple-600' : 'bg-white/15'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${analytics ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-200 block mb-1">Marketing cookies</span>
                  <p className="text-xs text-gray-500">Used to show relevant content about Lumio across the web. We never share with ad networks.</p>
                </div>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className={`w-10 h-5 rounded-full flex-shrink-0 mt-1 transition-colors relative ${marketing ? 'bg-purple-600' : 'bg-white/15'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${marketing ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => accept('essential')} className="flex-1 py-2.5 border border-white/20 text-gray-300 text-sm rounded-xl font-medium hover:border-white/30 transition-colors">
                Save (essential only)
              </button>
              <button onClick={() => accept('all')} className="flex-1 py-2.5 bg-purple-600 text-white text-sm rounded-xl font-bold hover:bg-purple-500 transition-colors">
                Save my preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
