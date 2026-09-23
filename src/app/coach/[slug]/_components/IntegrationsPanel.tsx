'use client'

// Settings → Connected accounts. Lets a coach connect their Google / Outlook
// mailbox + calendar (OAuth) or iCloud (app-specific password) for calendar
// sync and sending email as their own address. Talks to the
// /api/coach/integrations + /api/coach/oauth/* routes; never sees raw tokens.
//
// Calendar sync is ONE-WAY for every provider: Lumio bookings are written out to
// the connected calendar. Importing external events back into Lumio is not built,
// so no copy here may promise "two-way".
//
// Three things this panel exists to prevent, each learned the hard way:
//   1. A coach meeting Google's "hasn't verified this app" screen with no warning
//      and backing out, assuming Lumio is broken. Hence the heads-up BEFORE the
//      Connect button, not after.
//   2. A half-granted connection — calendar yes, Gmail no — reading as fully
//      connected while every email quietly goes out from the Lumio address.
//      Hence the capability chips.
//   3. A dead token looking exactly like a live one. Hence Reconnect, and the
//      test send that proves it rather than promising it.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

type Provider = 'google' | 'microsoft' | 'icloud'
type Connection = { provider: Provider; email_address: string | null; capabilities: string[]; status: string }
type Status = { connections: Connection[]; configured: Record<Provider, boolean> }

const META: { id: Provider; name: string; icon: string; blurb: string }[] = [
  { id: 'google',    name: 'Google (Gmail & Calendar)', icon: '🟦', blurb: 'Bookings → your Google Calendar, plus send as your Gmail address.' },
  { id: 'microsoft', name: 'Outlook (Microsoft 365)',   icon: '🟧', blurb: 'Bookings → your Outlook calendar, plus send as your Outlook address.' },
  { id: 'icloud',    name: 'Apple iCloud',              icon: '⚪', blurb: 'Bookings → your iCloud calendar, plus send-as email, via an app-specific password.' },
]

export function IntegrationsPanel({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [data, setData] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<{ provider: string; status: string } | null>(null)
  // Test send, per provider
  const [testing, setTesting] = useState<Provider | null>(null)
  const [testResult, setTestResult] = useState<{ provider: Provider; ok: boolean; text: string } | null>(null)
  // iCloud form
  const [appleId, setAppleId] = useState('')
  const [appPw, setAppPw] = useState('')
  const [icloudBusy, setIcloudBusy] = useState(false)
  const [icloudErr, setIcloudErr] = useState('')
  const [icloudNote, setIcloudNote] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/coach/integrations')
      if (res.ok) setData(await res.json())
    } catch { /* offline / not signed in */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  // Surface the ?integration=&status= the OAuth callback redirected back with.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const provider = q.get('integration'); const status = q.get('status')
    if (provider && status) setBanner({ provider, status })
  }, [])

  const connFor = (p: Provider) => data?.connections.find(c => c.provider === p)
  const configured = (p: Provider) => data?.configured?.[p] ?? (p === 'icloud')

  const connect = (p: Provider) => {
    const ret = window.location.pathname + window.location.search.replace(/[?&](integration|status)=[^&]*/g, '')
    // A full navigation, not a router push: the next stop is the provider's own
    // consent screen, which is not ours to render.
    window.location.assign(`/api/coach/oauth/${p}/start?return=${encodeURIComponent(ret || '/')}`)
  }
  const disconnect = async (p: Provider) => {
    await fetch(`/api/coach/integrations?provider=${p}`, { method: 'DELETE' })
    // Disconnect removes the stored row entirely, so a later reconnect re-runs
    // CalDAV discovery from scratch rather than reusing a stale calendar URL.
    if (p === 'icloud') { setIcloudNote(''); setIcloudErr('') }
    setTestResult(null)
    load()
  }
  const sendTest = async (p: Provider) => {
    setTesting(p); setTestResult(null)
    try {
      const res = await fetch('/api/coach/integrations/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: p }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) setTestResult({ provider: p, ok: false, text: j.error || 'The test send failed.' })
      else if (j.warning) setTestResult({ provider: p, ok: false, text: j.warning })
      else setTestResult({ provider: p, ok: true, text: `Sent to ${j.from || 'your address'} — check your inbox. If the From line is your own address, you’re set.` })
    } catch {
      setTestResult({ provider: p, ok: false, text: 'Network error — try again.' })
    }
    setTesting(null)
    load()   // a failed send may have flagged the connection for reconnection
  }
  const connectIcloud = async () => {
    setIcloudErr(''); setIcloudBusy(true)
    try {
      const res = await fetch('/api/coach/integrations/icloud', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appleId, appPassword: appPw }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setIcloudErr(j.error || 'Could not connect'); setIcloudBusy(false); return }
      // Name the calendar bookings will land in — so picking the wrong one is obvious now,
      // not after a booking quietly goes missing.
      setIcloudNote(j.calendarName ? `Connected — bookings will be added to your “${j.calendarName}” calendar.` : 'Connected.')
      setAppleId(''); setAppPw(''); load()
    } catch { setIcloudErr('Network error') }
    setIcloudBusy(false)
  }

  const bannerText = banner && ({
    connected: `✓ ${banner.provider} connected.`,
    partial_no_mail: 'Connected for calendar only — permission to send email wasn’t granted. Disconnect and connect again, leaving every box ticked.',
    partial_no_cal: 'Connected for email only — calendar permission wasn’t granted. Disconnect and connect again, leaving every box ticked.',
    not_configured: `${banner.provider} isn't set up yet — add its OAuth credentials to the environment.`,
    denied: `${banner.provider} connection was cancelled.`,
    state: 'Security check failed — please try connecting again.',
    exchange: `Couldn't complete the ${banner.provider} connection. Try again.`,
    signin: 'Please sign in first, then reconnect.',
    store_error: 'Connected, but saving failed — try again.',
  } as Record<string, string>)[banner.status]
  const bannerGood = banner?.status === 'connected'

  const btn = (bg: string, color: string): React.CSSProperties => ({ appearance: 'none', border: 0, borderRadius: 9, padding: '8px 13px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', background: bg, color })

  const chip = (on: boolean, text: string) => (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
      color: on ? T.good : T.text3, background: on ? `${T.good}1a` : T.panel,
      border: `1px solid ${on ? `${T.good}55` : T.border}`,
    }}>{on ? '✓' : '—'} {text}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: T.text3, lineHeight: 1.5 }}>
        Connect a mailbox and calendar so your Lumio bookings appear in your own calendar and emails to players send from your own address.
        Sync is one-way for now — bookings go out to your calendar; events you create in your calendar are not brought into Lumio.
        Reading your inbox into Lumio is a later phase (it needs extra Google/Microsoft review).
      </p>

      {bannerText && (
        <div style={{ fontSize: 12, fontWeight: 600, padding: '9px 12px', borderRadius: 9, lineHeight: 1.5, color: bannerGood ? T.good : T.warn, background: `${bannerGood ? T.good : T.warn}1a` }}>{bannerText}</div>
      )}

      {loading && <div style={{ fontSize: 12, color: T.text3 }}>Loading…</div>}

      {!loading && META.map(m => {
        const conn = connFor(m.id)
        const isOn = !!conn
        const needsReauth = conn?.status === 'reauth'
        const canMail = !!conn?.capabilities?.includes('send_email')
        const canCal = !!conn?.capabilities?.includes('calendar')
        const ok = configured(m.id)
        const showTest = testResult?.provider === m.id
        return (
          <div key={m.id} style={{
            border: `1px solid ${needsReauth ? T.warn : isOn ? accent.border : T.border}`,
            background: isOn ? accent.dim : T.panel2, borderRadius: 12, padding: 13,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: needsReauth ? T.warn : T.text3, marginTop: 2 }}>
                  {needsReauth
                    ? `Sign-in expired — reconnect to start syncing again${conn?.email_address ? ` (${conn.email_address})` : ''}`
                    : isOn ? `Connected · ${conn!.email_address || 'account linked'}` : m.blurb}
                </div>
              </div>
              {isOn ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  {needsReauth && m.id !== 'icloud' && (
                    <button onClick={() => connect(m.id)} style={btn(T.warn, T.btnText)}>Reconnect</button>
                  )}
                  <button onClick={() => disconnect(m.id)} style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}` }}>Disconnect</button>
                </div>
              ) : m.id === 'icloud' ? null : ok ? (
                <button onClick={() => connect(m.id)} style={btn(accent.hex, T.btnText)}>Connect</button>
              ) : (
                // Coach-facing, not developer-facing: this branch is what a coach
                // sees for a provider that is still parked (see providerLive).
                <span style={{ fontSize: 10.5, color: T.text3, textAlign: 'right', maxWidth: 130 }}>Coming soon</span>
              )}
            </div>

            {/* What this connection is actually allowed to do, and a way to prove it. */}
            {isOn && !needsReauth && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                {chip(canCal, 'Bookings → calendar')}
                {chip(canMail, 'Sends as you')}
                {canMail && (
                  <button onClick={() => sendTest(m.id)} disabled={testing === m.id}
                    style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}`, marginLeft: 'auto', padding: '6px 11px', fontSize: 11, opacity: testing === m.id ? 0.6 : 1 }}>
                    {testing === m.id ? 'Sending…' : 'Send test email'}
                  </button>
                )}
              </div>
            )}
            {showTest && (
              <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.5, color: testResult!.ok ? T.good : T.warn }}>{testResult!.text}</div>
            )}
            {isOn && !needsReauth && !canMail && (
              <div style={{ marginTop: 8, fontSize: 11, color: T.warn, lineHeight: 1.5 }}>
                Emails will go out from the Lumio address until this is reconnected with email permission.
              </div>
            )}

            {/* Google's consent screen is unmissable and alarming if nobody warned you. */}
            {m.id === 'google' && !isOn && ok && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.text3, lineHeight: 1.55 }}>
                Google will show a “Google hasn’t verified this app” screen — that appears until Google’s review of Lumio completes, and it is safe to continue.
                Choose <strong style={{ color: T.text2 }}>Advanced</strong> → <strong style={{ color: T.text2 }}>Go to Lumio</strong>, then leave both tick boxes on so bookings and email both work.
              </div>
            )}

            {m.id === 'icloud' && isOn && icloudNote && (
              <div style={{ marginTop: 9, fontSize: 11, color: T.good }}>{icloudNote}</div>
            )}

            {/* iCloud connect form (no OAuth) */}
            {m.id === 'icloud' && !isOn && (
              <div style={{ marginTop: 11, paddingTop: 11, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={appleId} onChange={e => setAppleId(e.target.value)} placeholder="Apple ID (email)" style={{ padding: '9px 11px', borderRadius: 9, fontSize: 12.5, color: T.text, background: T.panel, border: `1px solid ${T.borderHi}`, outline: 'none', fontFamily: FONT }} />
                <input value={appPw} onChange={e => setAppPw(e.target.value)} placeholder="App-specific password (appleid.apple.com)" style={{ padding: '9px 11px', borderRadius: 9, fontSize: 12.5, color: T.text, background: T.panel, border: `1px solid ${T.borderHi}`, outline: 'none', fontFamily: FONT }} />
                {icloudErr && <div style={{ fontSize: 11, color: T.bad }}>{icloudErr}</div>}
                <button onClick={connectIcloud} disabled={icloudBusy || !appleId.trim() || !appPw.trim()} style={{ ...btn(accent.hex, T.btnText), alignSelf: 'flex-start', opacity: icloudBusy || !appleId.trim() || !appPw.trim() ? 0.5 : 1 }}>{icloudBusy ? 'Connecting…' : 'Connect iCloud'}</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
