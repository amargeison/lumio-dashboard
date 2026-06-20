'use client'

// ─── Connect a watch (Phase 1) ───────────────────────────────────────────────
// Shows a player their personal watch link + QR so they can set up the Lumio
// Apple Shortcut (see docs/specs/lumio-watch-shortcut-spec.md). Reused on both
// the coach side (player detail) and the student/parent app.
//
// QR is rendered client-side via a CDN library (qrcodejs) so we DON'T add an npm
// dependency that could break the build, and the token never leaves the browser
// (no third-party QR image service). If the library can't load, we degrade
// gracefully to the copy-link.

import { useEffect, useRef, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'

let _qrLoad: Promise<void> | null = null
function loadQrLib(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if ((window as any).QRCode) return Promise.resolve()
  if (_qrLoad) return _qrLoad
  _qrLoad = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('qr load failed'))
    document.head.appendChild(s)
  })
  return _qrLoad
}

function maskToken(t: string) {
  if (!t) return ''
  return t.length <= 12 ? t : `${t.slice(0, 6)}…${t.slice(-4)}`
}

export function WatchConnectPanel({
  T, accent, token, playerName, consentOk = true, onReset,
}: {
  T: ThemeTokens
  accent: AccentTokens
  token: string
  playerName?: string
  consentOk?: boolean
  // Coach side only: regenerate the token. Returns the new token (or void).
  onReset?: () => Promise<string | void>
}) {
  const [tok, setTok] = useState(token)
  const [url, setUrl] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedTok, setCopiedTok] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [qrOk, setQrOk] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setTok(token) }, [token])

  useEffect(() => {
    if (typeof window === 'undefined' || !tok) return
    setUrl(`${window.location.origin}/tennis/watch?t=${encodeURIComponent(tok)}`)
  }, [tok])

  useEffect(() => {
    if (!url || !qrRef.current) return
    let cancelled = false
    loadQrLib().then(() => {
      if (cancelled || !qrRef.current) return
      qrRef.current.innerHTML = ''
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const QR = (window as any).QRCode
        new QR(qrRef.current, { text: url, width: 168, height: 168, colorDark: '#0b0d12', colorLight: '#ffffff', correctLevel: QR.CorrectLevel?.M ?? 0 })
        setQrOk(true)
      } catch { setQrOk(false) }
    }).catch(() => setQrOk(false))
    return () => { cancelled = true }
  }, [url])

  const copy = (text: string, set: (b: boolean) => void) => {
    navigator.clipboard?.writeText(text).then(() => { set(true); setTimeout(() => set(false), 2000) }).catch(() => {})
  }

  const reset = async () => {
    if (!onReset) return
    if (!window.confirm('Reset this watch token? The old QR and link will stop working and the player will need the new one.')) return
    setResetting(true)
    try { const nt = await onReset(); if (typeof nt === 'string' && nt) setTok(nt) }
    finally { setResetting(false) }
  }

  const btn: React.CSSProperties = { appearance: 'none', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600 }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 15 }}>⌚</span>
        <h3 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Connect a watch</h3>
        <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rewards</span>
      </div>
      <p style={{ color: T.text3, fontSize: 12.5, margin: '0 0 14px', lineHeight: 1.5 }}>
        Scan the code{playerName ? ` for ${playerName}` : ''} (or open the link) on the iPhone paired with the watch, then follow the steps to set up the Lumio shortcut. Finished sessions turn into XP automatically.
      </p>

      {!consentOk && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '9px 13px', fontSize: 11.5, color: T.text2, marginBottom: 14 }}>
          ⚠ Wearable/heart-rate consent isn&apos;t recorded yet — sessions will be rejected until it is. Tick it on the Consent tab first.
        </div>
      )}

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ background: '#ffffff', borderRadius: 12, padding: 12, width: 168, height: 168, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {qrOk
            ? <div ref={qrRef} />
            : <span style={{ color: '#0b0d12', fontSize: 11, textAlign: 'center', padding: 8 }}>Use the link below to set up</span>}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Setup link</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input readOnly value={url} onFocus={e => e.currentTarget.select()} style={{ flex: 1, minWidth: 160, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.text2, fontSize: 12, fontFamily: 'monospace' }} />
            <button onClick={() => copy(url, setCopiedLink)} style={{ ...btn, border: 'none', background: accent.hex, color: T.btnText, fontWeight: 700 }}>{copiedLink ? 'Copied ✓' : 'Copy link'}</button>
          </div>

          <label style={{ display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Token</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ fontSize: 12.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px' }}>{maskToken(tok)}</code>
            <button onClick={() => copy(tok, setCopiedTok)} style={btn}>{copiedTok ? 'Copied ✓' : 'Copy token'}</button>
            {onReset && (
              <button onClick={reset} disabled={resetting} style={{ ...btn, color: '#EF4444', opacity: resetting ? 0.6 : 1 }}>{resetting ? 'Resetting…' : 'Reset token'}</button>
            )}
          </div>
          <p style={{ fontSize: 11, color: T.text3, marginTop: 10, lineHeight: 1.5 }}>
            Keep this private — anyone with the token can log sessions for this player. Reset it if it&apos;s ever shared by mistake.
          </p>
        </div>
      </div>
    </div>
  )
}
