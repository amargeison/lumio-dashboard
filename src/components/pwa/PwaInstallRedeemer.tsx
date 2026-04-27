'use client'

import { useEffect } from 'react'

// URL-bar handoff redeemer. Mounted in every per-sport [slug]/layout.tsx.
//
// On a normal Safari tab visit this component does nothing — the URL still
// carries ?pwa_install=<JWT> after OTP, but we leave the token alone so
// iOS captures it verbatim when the user does Share → Add to Home Screen.
//
// On the cold launch of the *installed* PWA we detect standalone display
// mode and redirect through /api/pwa/consume-token, which redeems the
// token, sets the sb-*-auth-token cookie in the PWA's own cookie jar, and
// 307s back to the clean /<sport>/<slug> URL. From that point on the PWA
// behaves like a fully signed-in session.
export function PwaInstallRedeemer() {
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    const isStandalone =
      nav.standalone === true ||
      (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches === true)

    if (!isStandalone) return

    const url = new URL(window.location.href)
    const token = url.searchParams.get('pwa_install')
    if (!token) return

    console.log('[pwa-redeemer] standalone-mode detected, redirecting to consume-token')
    const next = url.pathname
    window.location.replace(
      `/api/pwa/consume-token?t=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`,
    )
  }, [])

  return null
}
