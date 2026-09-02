'use client'

// The customer portal.
//
// Who lands here: an adult who books their own coaching or a camp place, and a
// parent following a child's. Same account either way — parenting is something
// an account CAN do, not a separate kind of user. Most coaches using this run
// adults, so nothing on this page should assume a child is involved.
//
// It no longer signs anybody in. Everyone — head coaches, assistant coaches and
// customers — signs in at /sports-login, the one page that knows about all of
// them. This page used to carry a second sign-in card, and keeping
// two of those in step is a job that never ends: they drifted on styling, and
// worse, this one called Supabase's own signInWithOtp, which emailed a LINK
// while the card asked for a code.
//
// Arriving here signed out now bounces to the real sign-in with a redirectTo, so
// the round trip is invisible.

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { StudentPortal } from './_components/StudentPortal'
import { CoachPortal } from './_components/CoachPortal'

const supa = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const BG = '#0B0F17', CARD = '#0F1623', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0'
const primary: React.CSSProperties = { width: '100%', appearance: 'none', border: 0, borderRadius: 10, padding: '11px', background: ACCENT, color: '#06223f', fontSize: 14, fontWeight: 700, cursor: 'pointer' }

export default function PortalSignIn() {
  const [stage, setStage] = useState<'loading' | 'in' | 'noaccess'>('loading')
  const [email, setEmail] = useState('')
  const [member, setMember] = useState<{ role: string } | null>(null)
  const [err, setErr] = useState('')

  const loadMe = async () => {
    const r = await fetch('/api/portal/me')
    if (r.ok) { setMember(await r.json()); setStage('in') }
    else setStage('noaccess')
  }
  // Signed out → the one sign-in page, which comes back here afterwards.
  const toSignIn = () => { window.location.href = '/sports-login?redirectTo=/portal' }

  useEffect(() => {
    supa.auth.getSession().then(({ data }) => {
      if (data.session) { setEmail(data.session.user.email || ''); loadMe() }
      else toSignIn()
    })
  }, [])

  const signOut = async () => { await supa.auth.signOut(); setMember(null); toSignIn() }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18 }}>Lumio</div>
        {children}
        {err && <div style={{ fontSize: 12.5, color: '#EF6A6A', marginTop: 12 }}>{err}</div>}
      </div>
    </div>
  )

  // Also what a signed-out visitor sees for the instant before the bounce.
  if (stage === 'loading') return wrap(<div style={{ fontSize: 13, color: MUTED }}>Loading…</div>)

  if (stage === 'noaccess') return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>No access yet</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>You’re signed in, but this email hasn’t been given access yet. Ask your coach to add <strong style={{ color: TEXT }}>{email || 'your email'}</strong>.</p>
    <button onClick={signOut} style={primary}>Sign in with a different email</button>
  </>)

  // Signed in + a member — render the scoped portal for their role.
  // 'student' and 'parent' are the stored role values from migration 141. They
  // are database strings, not a claim about anyone's age — an adult club player
  // booking their own lessons is a 'student' here.
  if (member?.role === 'parent' || member?.role === 'student') return <StudentPortal onSignOut={signOut} />
  if (member?.role === 'coach') return <CoachPortal onSignOut={signOut} />
  return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>You’re signed in</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>Your portal isn’t set up yet — ask your coach to check your access.</p>
    <button onClick={signOut} style={{ ...primary, background: 'transparent', border: `1px solid ${BORDER}`, color: TEXT }}>Sign out</button>
  </>)
}
