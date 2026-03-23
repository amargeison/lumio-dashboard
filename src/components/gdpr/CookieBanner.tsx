'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ConsentLevel = 'all' | 'essential' | null

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
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
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-white/15 rounded-2xl p-5 shadow-2xl">
        {!showDetails ? (
          <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white mb-1">🍪 Cookie preferences</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                We use essential cookies to make Lumio work, and optional analytics cookies to improve the product.
                We never use advertising cookies or sell your data.{' '}
                <button onClick={() => setShowDetails(true)} className="text-purple-400 underline">Manage preferences</button>
                {' '}·{' '}
                <Link href="/cookies" className="text-purple-400 underline">Cookie policy</Link>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 mt-1">
              <button
                onClick={() => accept('essential')}
                className="px-4 py-2 border border-white/20 text-gray-300 text-xs rounded-lg font-medium hover:border-white/30 hover:text-white transition-colors"
              >
                Essential only
              </button>
              <button
                onClick={() => accept('all')}
                className="px-4 py-2 bg-purple-600 text-white text-xs rounded-lg font-semibold hover:bg-purple-500 transition-colors"
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
  )
}
