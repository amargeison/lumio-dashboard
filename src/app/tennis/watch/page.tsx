'use client'

// Public watch-setup page. Opened from the "Connect a watch" QR / link
// (/tennis/watch?t=<token>). Validates the token, greets the player, shows the
// wearable-consent status, and walks through installing the Lumio Apple
// Shortcut. No login — the token is the bearer credential.

import { useEffect, useState } from 'react'

const ACCENT = '#3A8EE0'
const INGEST = '/api/coach/watch/ingest'

export default function WatchSetupPage() {
  const [token, setToken] = useState('')
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading')
  const [player, setPlayer] = useState('')
  const [consent, setConsent] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t') || ''
    setToken(t)
    if (!t) { setState('invalid'); return }
    fetch(`${INGEST}?token=${encodeURIComponent(t)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.valid) { setPlayer(d.player || 'Player'); setConsent(!!d.consent); setState('ok') }
        else setState('invalid')
      })
      .catch(() => setState('invalid'))
  }, [])

  const endpoint = typeof window !== 'undefined' ? `${window.location.origin}${INGEST}` : INGEST
  const copyToken = () => navigator.clipboard?.writeText(token).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})

  const card: React.CSSProperties = { background: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 24 }
  const step = (n: number, title: string, body: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid #1a1f29' }}>
      <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{n}</span>
      <div><div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{title}</div><div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.55 }}>{body}</div></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', justifyContent: 'center', padding: '6vh 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tennis_coach_logo.png" alt="" style={{ height: 44, display: 'block', margin: '0 auto 16px' }} />

        {state === 'loading' && (
          <div style={{ ...card, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Checking your link…</div>
        )}

        {state === 'invalid' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>⌚</div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>This setup link isn&apos;t valid</h1>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>Ask your coach for a fresh &ldquo;Connect a watch&rdquo; link or QR code, then open it again on the iPhone paired with your watch.</p>
          </div>
        )}

        {state === 'ok' && (
          <>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Lumio · Connect a watch</div>
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '6px 0 6px' }}>Hi {player} 👋</h1>
              <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Set this up once and every tennis session you record on your Apple Watch will turn into XP towards your next racket.
              </p>
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: consent ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${consent ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}`, borderRadius: 999, padding: '5px 12px' }}>
                <span style={{ fontSize: 12.5, color: consent ? '#22C55E' : '#F59E0B', fontWeight: 700 }}>
                  {consent ? '✓ Wearable consent on file' : '⚠ Waiting on wearable consent — ask your coach'}
                </span>
              </div>
            </div>

            <div style={card}>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>Set up the Lumio shortcut</h2>
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 8px', lineHeight: 1.55 }}>On your iPhone, in the <b style={{ color: '#fff' }}>Shortcuts</b> app → <b style={{ color: '#fff' }}>Automation</b>:</p>

              {step(1, 'New personal automation', <>Tap <b style={{ color: '#fff' }}>+</b> → <b style={{ color: '#fff' }}>Create Personal Automation</b> → choose <b style={{ color: '#fff' }}>Workout</b> → <b style={{ color: '#fff' }}>When Workout Completed</b> (type: Tennis). Set it to run immediately.</>)}
              {step(2, 'Read the session', <>Add action <b style={{ color: '#fff' }}>Health → Find Workouts</b> (latest 1), then pull <b style={{ color: '#fff' }}>Duration</b>, <b style={{ color: '#fff' }}>Average Heart Rate</b>, <b style={{ color: '#fff' }}>Active Energy</b> and <b style={{ color: '#fff' }}>Distance</b>.</>)}
              {step(3, 'Send it to Lumio', <>Add <b style={{ color: '#fff' }}>Get Contents of URL</b> → POST to <code style={{ color: '#cbd5e1', fontSize: 12, wordBreak: 'break-all' }}>{endpoint}</code> with a JSON body containing your token and those values.</>)}
              {step(4, 'Done', <>Finish a tennis workout and your XP appears in the Lumio app. You&apos;ll get a notification with the points you earned.</>)}

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #1a1f29' }}>
                <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Your token</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <code style={{ flex: 1, minWidth: 200, color: '#cbd5e1', fontSize: 12, background: '#111318', border: '1px solid #374151', borderRadius: 8, padding: '9px 11px', wordBreak: 'break-all' }}>{token}</code>
                  <button onClick={copyToken} style={{ border: 'none', background: ACCENT, color: '#fff', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{copied ? 'Copied ✓' : 'Copy token'}</button>
                </div>
                <p style={{ color: '#6B7280', fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>Keep this private. It only sends effort data (heart rate, distance, calories, duration) — no location or court tracking. You can withdraw consent any time through your coach.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
