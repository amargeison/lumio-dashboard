'use client'

// Portal sign-in for students/parents + sub-coaches. Email one-time code (works
// inside the installed PWA, unlike a click-link), then a persistent Supabase
// session that auto-refreshes — sign in once, stay signed in. After sign-in we
// resolve the membership and land them on their scoped portal (P3/P4).

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { StudentPortal } from './_components/StudentPortal'
import { CoachPortal } from './_components/CoachPortal'

const supa = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const BG = '#0B0F17', CARD = '#0F1623', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0'
const field: React.CSSProperties = { width: '100%', background: '#0B1220', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 13px', fontSize: 15, boxSizing: 'border-box', outline: 'none' }
const primary: React.CSSProperties = { width: '100%', appearance: 'none', border: 0, borderRadius: 10, padding: '11px', background: ACCENT, color: '#06223f', fontSize: 14, fontWeight: 700, cursor: 'pointer' }

export default function PortalSignIn() {
  const [stage, setStage] = useState<'loading' | 'email' | 'code' | 'in' | 'noaccess'>('loading')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [member, setMember] = useState<{ role: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const loadMe = async () => {
    const r = await fetch('/api/portal/me')
    if (r.ok) { setMember(await r.json()); setStage('in') }
    else setStage('noaccess')
  }
  useEffect(() => { supa.auth.getSession().then(({ data }) => { if (data.session) loadMe(); else setStage('email') }) }, [])

  const sendCode = async () => {
    if (!email.trim() || busy) return
    setBusy(true); setErr('')
    const { error } = await supa.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    setBusy(false)
    if (error) setErr(error.message); else setStage('code')
  }
  const verify = async () => {
    if (!code.trim() || busy) return
    setBusy(true); setErr('')
    const { error } = await supa.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setErr('That code didn’t work — check it and try again.'); else loadMe()
  }
  const signOut = async () => { await supa.auth.signOut(); setMember(null); setStage('email') }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18 }}>Lumio</div>
        {children}
        {err && <div style={{ fontSize: 12.5, color: '#EF6A6A', marginTop: 12 }}>{err}</div>}
      </div>
    </div>
  )

  if (stage === 'loading') return wrap(<div style={{ fontSize: 13, color: MUTED }}>Loading…</div>)

  if (stage === 'email') return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>Sign in</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>Enter the email your coach invited — we’ll send you a 6-digit code.</p>
    <input type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={{ ...field, marginBottom: 12 }} onKeyDown={e => { if (e.key === 'Enter') sendCode() }} />
    <button onClick={sendCode} disabled={busy || !email.trim()} style={{ ...primary, opacity: busy || !email.trim() ? 0.5 : 1 }}>{busy ? 'Sending…' : 'Send code'}</button>
  </>)

  if (stage === 'code') return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>Enter your code</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>We sent a 6-digit code to <strong style={{ color: TEXT }}>{email}</strong>.</p>
    <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" style={{ ...field, marginBottom: 12, letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 }} onKeyDown={e => { if (e.key === 'Enter') verify() }} />
    <button onClick={verify} disabled={busy || code.length < 6} style={{ ...primary, opacity: busy || code.length < 6 ? 0.5 : 1 }}>{busy ? 'Checking…' : 'Sign in'}</button>
    <button onClick={() => { setStage('email'); setCode(''); setErr('') }} style={{ width: '100%', appearance: 'none', border: 0, background: 'transparent', color: MUTED, fontSize: 12.5, cursor: 'pointer', marginTop: 12 }}>Use a different email</button>
  </>)

  if (stage === 'noaccess') return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>No access yet</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>You’re signed in, but this email hasn’t been given portal access. Ask your coach to invite <strong style={{ color: TEXT }}>{email || 'your email'}</strong>.</p>
    <button onClick={signOut} style={primary}>Sign out</button>
  </>)

  // Signed in + a member — render the scoped portal for their role.
  if (member?.role === 'parent' || member?.role === 'student') return <StudentPortal onSignOut={signOut} />
  if (member?.role === 'coach') return <CoachPortal onSignOut={signOut} />
  return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>You’re signed in</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>Your portal isn’t set up yet — ask your coach to check your access.</p>
    <button onClick={signOut} style={{ ...primary, background: 'transparent', border: `1px solid ${BORDER}`, color: TEXT }}>Sign out</button>
  </>)
}
