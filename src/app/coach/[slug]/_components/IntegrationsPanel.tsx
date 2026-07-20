'use client'

// Settings → Connected accounts. Lets a coach connect their Google / Outlook
// mailbox + calendar (OAuth) or iCloud (app-specific password) for calendar
// two-way sync and sending email as their own address. Talks to the
// /api/coach/integrations + /api/coach/oauth/* routes; never sees raw tokens.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

type Provider = 'google' | 'microsoft' | 'icloud'
type Connection = { provider: Provider; email_address: string | null; capabilities: string[]; status: string }
type Status = { connections: Connection[]; configured: Record<Provider, boolean> }

const META: { id: Provider; name: string; icon: string; blurb: string }[] = [
  { id: 'google',    name: 'Google (Gmail & Calendar)', icon: '🟦', blurb: 'Two-way calendar sync + send as your Gmail address.' },
  { id: 'microsoft', name: 'Outlook (Microsoft 365)',   icon: '🟧', blurb: 'Two-way calendar sync + send as your Outlook address.' },
  { id: 'icloud',    name: 'Apple iCloud',              icon: '⚪', blurb: 'Two-way calendar sync + send-as email, via an app-specific password.' },
]

export function IntegrationsPanel({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const [data, setData] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<{ provider: string; status: string } | null>(null)
  // iCloud form
  const [appleId, setAppleId] = useState('')
  const [appPw, setAppPw] = useState('')
  const [icloudBusy, setIcloudBusy] = useState(false)
  const [icloudErr, setIcloudErr] = useState('')

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
    window.location.href = `/api/coach/oauth/${p}/start?return=${encodeURIComponent(ret || '/')}`
  }
  const disconnect = async (p: Provider) => {
    await fetch(`/api/coach/integrations?provider=${p}`, { method: 'DELETE' })
    load()
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
      setAppleId(''); setAppPw(''); load()
    } catch { setIcloudErr('Network error') }
    setIcloudBusy(false)
  }

  const bannerText = banner && ({
    connected: `✓ ${banner.provider} connected.`,
    not_configured: `${banner.provider} isn't set up yet — add its OAuth credentials to the environment.`,
    denied: `${banner.provider} connection was cancelled.`,
    state: 'Security check failed — please try connecting again.',
    exchange: `Couldn't complete the ${banner.provider} connection. Try again.`,
    signin: 'Please sign in first, then reconnect.',
    store_error: 'Connected, but saving failed — try again.',
  } as Record<string, string>)[banner.status]

  const btn = (bg: string, color: string): React.CSSProperties => ({ appearance: 'none', border: 0, borderRadius: 9, padding: '8px 13px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', background: bg, color })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: T.text3, lineHeight: 1.5 }}>
        Connect a mailbox and calendar so bookings sync both ways and lesson summaries can send from your own address.
        Reading your inbox into Lumio is a later phase (it needs extra Google/Microsoft review).
      </p>

      {bannerText && (
        <div style={{ fontSize: 12, fontWeight: 600, padding: '9px 12px', borderRadius: 9, color: banner!.status === 'connected' ? T.good : T.warn, background: `${banner!.status === 'connected' ? T.good : T.warn}1a` }}>{bannerText}</div>
      )}

      {loading && <div style={{ fontSize: 12, color: T.text3 }}>Loading…</div>}

      {!loading && META.map(m => {
        const conn = connFor(m.id)
        const isOn = !!conn
        const ok = configured(m.id)
        return (
          <div key={m.id} style={{ border: `1px solid ${isOn ? accent.border : T.border}`, background: isOn ? accent.dim : T.panel2, borderRadius: 12, padding: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{isOn ? `Connected · ${conn!.email_address || 'account linked'}` : m.blurb}</div>
              </div>
              {isOn ? (
                <button onClick={() => disconnect(m.id)} style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}` }}>Disconnect</button>
              ) : m.id === 'icloud' ? null : ok ? (
                <button onClick={() => connect(m.id)} style={btn(accent.hex, T.btnText)}>Connect</button>
              ) : (
                <span style={{ fontSize: 10.5, color: T.text3, textAlign: 'right', maxWidth: 130 }}>Add OAuth credentials to enable</span>
              )}
            </div>

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
