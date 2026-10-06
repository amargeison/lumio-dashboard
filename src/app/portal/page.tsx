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
import { StudentPortal, type PortalPlayer } from './_components/StudentPortal'
import { CoachPortal } from './_components/CoachPortal'
import { clearPrivateCaches } from '@/components/PwaInstaller'

const supa = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const BG = '#0B0F17', CARD = '#0F1623', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0'
// Where this device remembers which player's page was last open.
const PICK_KEY = 'lumio_portal_player'
const primary: React.CSSProperties = { width: '100%', appearance: 'none', border: 0, borderRadius: 10, padding: '11px', background: ACCENT, color: '#06223f', fontSize: 14, fontWeight: 700, cursor: 'pointer' }

// The academy's badge in the tab (and on the home screen, if a family adds the
// app to it) once we know which academy this is. The layout starts with
// Lumio's, since it cannot know the academy before the session is read.
function useAcademyIcon(brand: { name: string; iconUrl: string } | null | undefined) {
  useEffect(() => {
    if (!brand) return
    const set = (rel: string, href: string, sizes?: string) => {
      const found = document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)
      if (found.length) { found.forEach(l => { l.href = href; if (sizes) l.sizes.value = sizes }); return }
      const l = document.createElement('link')
      l.rel = rel; l.href = href
      if (sizes) l.sizes.value = sizes
      document.head.appendChild(l)
    }
    set('icon', `${brand.iconUrl}&size=64`, '64x64')
    set('shortcut icon', `${brand.iconUrl}&size=64`)
    set('apple-touch-icon', `${brand.iconUrl}&size=180`)
    document.title = `${brand.name} — your coaching`
  }, [brand])
}

export default function PortalSignIn() {
  const [stage, setStage] = useState<'loading' | 'in' | 'noaccess'>('loading')
  const [email, setEmail] = useState('')
  type Brand = { name: string; iconUrl: string } | null
  const [member, setMember] = useState<{ role: string; brand?: Brand; players?: (PortalPlayer & { brand?: Brand })[] } | null>(null)
  // Why there is nothing to show, when there is nothing to show.
  const [why, setWhy] = useState<{ code?: string; academyName?: string }>({})
  const [err, setErr] = useState('')
  // Which player's page is open. A parent can have several (siblings, or
  // children at two academies); the choice is remembered on this device only.
  // It is a convenience, not a permission — the server checks every request.
  const [picked, setPicked] = useState('')
  const players = member?.players || []
  const current = players.find(p => p.playerId === picked) || players[0] || null
  useAcademyIcon(current?.brand ?? member?.brand)
  const choose = (id: string) => { setPicked(id); try { localStorage.setItem(PICK_KEY, id) } catch { /* private mode */ } }

  const loadMe = async () => {
    // A phone can still be running an older service worker that kept the last
    // family's answers and replays them to whoever signs in next. Empty its
    // store before the first request, and ask in a way it cannot have a copy of.
    await clearPrivateCaches()
    const r = await fetch(`/api/portal/me?t=${Date.now()}`, { cache: 'no-store' })
    const d = await r.json().catch(() => ({}))
    if (r.ok) {
      setMember(d)
      try { setPicked(localStorage.getItem(PICK_KEY) || '') } catch { /* private mode */ }
      setStage('in')
    } else { setWhy({ code: d.code, academyName: d.academyName }); setStage('noaccess') }
  }
  // Signed out → the one sign-in page, which comes back here afterwards.
  const toSignIn = () => { window.location.href = '/sports-login?redirectTo=/portal' }

  useEffect(() => {
    supa.auth.getSession().then(({ data }) => {
      if (data.session) { setEmail(data.session.user.email || ''); loadMe() }
      else toSignIn()
    })
  }, [])

  // clearPrivateCaches: a shared phone must hold nothing of this family's once they sign out.
  const signOut = async () => { await supa.auth.signOut().finally(clearPrivateCaches); setMember(null); toSignIn() }

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

  // Three different reasons, three different things to do about it. One message
  // for all of them ("No access yet") told a family whose access had been
  // removed, or whose child had left the roster, that they had never had any.
  if (stage === 'noaccess') {
    const who = <strong style={{ color: TEXT }}>{email || 'this email address'}</strong>
    const academy = why.academyName || 'your academy'
    const [title, text] = why.code === 'revoked'
      ? ['Your access has ended', <>{academy} has removed access for {who}. If you think this is a mistake, please speak to your coach.</>]
      : why.code === 'app_off'
        ? ['Not available at the moment', <>{academy} has switched its player app off for now. Your coach can tell you more.</>]
        : ['Nothing to show for this email', <>You’re signed in as {who}, but it does not have access to a player’s page at the moment. If you were expecting to see one, ask your coach to send a new invite to this address.</>]
    return wrap(<>
      <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>{title}</h1>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{text}</p>
      <button onClick={signOut} style={primary}>Sign in with a different email</button>
    </>)
  }

  // Signed in + a member — render the scoped portal for their role.
  // 'student' and 'parent' are the stored role values from migration 141. They
  // are database strings, not a claim about anyone's age — an adult club player
  // booking their own lessons is a 'student' here.
  if (current) return <StudentPortal onSignOut={signOut} players={players} playerId={current.playerId} onSelect={choose} />
  if (member?.role === 'coach') return <CoachPortal onSignOut={signOut} />
  return wrap(<>
    <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: TEXT }}>You’re signed in</h1>
    <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>Your portal isn’t set up yet — ask your coach to check your access.</p>
    <button onClick={signOut} style={{ ...primary, background: 'transparent', border: `1px solid ${BORDER}`, color: TEXT }}>Sign out</button>
  </>)
}
