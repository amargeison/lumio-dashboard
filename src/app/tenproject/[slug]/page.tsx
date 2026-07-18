'use client'

// ─── TEN PROJECT PORTAL — DEMO SHELL ────────────────────────────────────────
// URL: /tenproject/[slug] (demo slug: /tenproject/demo)
// First build slice per docs Ten_Project_Portal_Scoping_v2.docx: PIN gate
// (071711, matching all sport portals), five-role switcher, four surfaces —
// HQ dashboard, School fundraising, Parent app, Coach + TENOR registers.
// All data is fictional demo data (src/data/tenproject/demo-data.ts).
// Standard portal zoom 0.9 — sidebar compensates with calc(100vh / 0.9).

import React, { use, useEffect, useRef, useState } from 'react'
import { Lock, LayoutDashboard, School, Smartphone, ClipboardList, Users, LogOut } from 'lucide-react'
import { TP_RED, TP_DARK, TP_PAPER } from '@/data/tenproject/demo-data'
import { DemoBadge } from './_components/ui'
import HQView from './_components/HQView'
import SchoolView from './_components/SchoolView'
import ParentApp from './_components/ParentApp'
import { CoachView, TenorView } from './_components/RegisterViews'

const DEMO_PIN = '071711'
const STORE_KEY = 'lumio_tenproject_demo_active'

type Role = 'hq' | 'school' | 'parent' | 'coach' | 'tenor'

const ROLES: { id: Role; label: string; desc: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }[] = [
  { id: 'hq', label: 'Ten Project HQ', desc: 'Programme health, schools, funnel, fundraising oversight', icon: LayoutDashboard },
  { id: 'school', label: 'School', desc: 'St Clement’s — fundraising dashboard & events', icon: School },
  { id: 'parent', label: 'Parent', desc: 'The family app — booklet, sessions, messages', icon: Smartphone },
  { id: 'coach', label: 'Coach', desc: 'In-school session, one-tap register, skill taps', icon: ClipboardList },
  { id: 'tenor', label: 'TENOR', desc: 'Weekend venue, QR scan-in, live count', icon: Users },
]

const ROLE_TITLES: Record<Role, { title: string; sub: string }> = {
  hq: { title: 'HQ — Programme Health', sub: 'Everything across schools, coaches, venues and funders' },
  school: { title: 'St Clement’s Primary — School view', sub: 'Ran Ten Project 2025/26 · fundraising to bring it back for 2026/27' },
  parent: { title: 'Parent app', sub: 'Sarah Whitfield · Mia (7) & Tom (5) · Oakridge Primary' },
  coach: { title: 'Coach — Natalie Brooks', sub: 'Today’s in-school session and register' },
  tenor: { title: 'TENOR — David Okafor', sub: 'Saturday family session at Kingsmead Rec Ground' },
}

export default function TenProjectPortal({ params }: { params: Promise<{ slug: string }> }) {
  use(params) // slug reserved for future founder/demo gating parity with other portals
  const [phase, setPhase] = useState<'loading' | 'pin' | 'ready'>('loading')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [lockedRole, setLockedRole] = useState<Role | null>(null)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPhase(localStorage.getItem(STORE_KEY) ? 'ready' : 'pin')
    // Deep-link support: /tenproject/demo?role=parent lands straight on that
    // role after the PIN AND locks the session to it — a parent following the
    // website CTA never sees HQ/School/Coach/TENOR (mirrors real role-based
    // access). The unrestricted demo stays at /tenproject/demo with no param.
    const wanted = new URLSearchParams(window.location.search).get('role')
    if (wanted && ROLES.some(r => r.id === wanted)) {
      setRole(wanted as Role)
      setLockedRole(wanted as Role)
    }
  }, [])

  const navRoles = lockedRole ? ROLES.filter(r => r.id === lockedRole) : ROLES

  function handleChange(i: number, val: string) {
    const c = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = c
    setDigits(next)
    if (c && i < 5) refs.current[i + 1]?.focus()
    if (c && i === 5) {
      if (next.join('') === DEMO_PIN) {
        localStorage.setItem(STORE_KEY, '1')
        setError('')
        setPhase('ready')
      } else {
        setError('Incorrect PIN')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => refs.current[0]?.focus(), 100)
      }
    }
  }

  // ── PIN gate ──
  if (phase === 'loading') return <div style={{ minHeight: '100vh', background: TP_PAPER }} />
  if (phase === 'pin') {
    return (
      <div style={{ minHeight: '100vh', background: TP_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ width: 170, height: 'auto', display: 'block', margin: '0 auto' }} />
          <div style={{ color: '#C9C4BE', fontSize: 13, margin: '14px 0 22px' }}>Portal demo — enter the PIN to continue</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el }}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus() }}
                inputMode="numeric"
                style={{ width: 44, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 800, borderRadius: 10, border: `2px solid ${d ? TP_RED : '#3A3A42'}`, background: '#22222A', color: '#fff', outline: 'none' }}
              />
            ))}
          </div>
          {error && <div style={{ color: TP_RED, fontSize: 12.5, marginTop: 12, fontWeight: 700 }}>{error}</div>}
          <div style={{ color: '#6B6560', fontSize: 11.5, marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Lock size={12} /> Private demo for Ten Project · LEARN. PLAY. TOGETHER.
          </div>
        </div>
      </div>
    )
  }

  // ── Role picker ──
  if (!role) {
    return (
      <div style={{ minHeight: '100vh', background: TP_PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tenproject_logo.png" alt="Ten Project" style={{ width: 190, height: 'auto', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK, letterSpacing: 2 }}>PORTAL</div>
            <div style={{ color: '#6B6560', fontSize: 13.5, marginTop: 6 }}>
              One platform · five roles. Pick a view to explore. <DemoBadge />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {ROLES.map(r => {
              const Icon = r.icon
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{ background: '#fff', border: '1px solid #E7E2DC', borderRadius: 14, padding: 18, cursor: 'pointer', textAlign: 'left', transition: 'transform .1s' }}
                >
                  <Icon size={22} style={{ color: TP_RED }} />
                  <div style={{ fontSize: 14.5, fontWeight: 900, color: TP_DARK, marginTop: 8 }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4 }}>{r.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Portal shell ──
  const meta = ROLE_TITLES[role]
  return (
    <div style={{ zoom: 0.9, minHeight: 'calc(100vh / 0.9)', background: TP_PAPER, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 224, background: TP_DARK, position: 'sticky', top: 0, height: 'calc(100vh / 0.9)', display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 0 }}>
        <div style={{ padding: '20px 18px 14px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ width: 116, height: 'auto', display: 'block' }} />
          <div style={{ fontSize: 10, color: '#8A847E', marginTop: 7, letterSpacing: 1 }}>PORTAL · DEMO</div>
        </div>
        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 10px' }}>
          {navRoles.map(r => {
            const Icon = r.icon
            const active = role === r.id
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: active ? TP_RED : 'none', color: active ? '#fff' : '#C9C4BE', border: 'none', borderRadius: 9, padding: '10px 12px', fontSize: 12.5, fontWeight: active ? 800 : 600, cursor: 'pointer', marginBottom: 3, textAlign: 'left' }}
              >
                <Icon size={16} /> {r.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: 12 }}>
          <button
            onClick={() => { localStorage.removeItem(STORE_KEY); setRole(null); setPhase('pin'); setDigits(['', '', '', '', '', '']) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', color: '#8A847E', border: '1px solid #33333B', borderRadius: 9, padding: '9px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
          >
            <LogOut size={14} /> Exit demo
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: '22px 26px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 900, color: TP_DARK }}>{meta.title}</div>
            <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 3 }}>{meta.sub}</div>
          </div>
          <DemoBadge />
        </div>
        {role === 'hq' && <HQView />}
        {role === 'school' && <SchoolView />}
        {role === 'parent' && <ParentApp />}
        {role === 'coach' && <CoachView />}
        {role === 'tenor' && <TenorView />}
      </main>
    </div>
  )
}
