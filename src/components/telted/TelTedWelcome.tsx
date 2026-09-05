'use client'

// TEL TED portal welcome page — the first screen a coordinator sees on sign-in.
// Modelled on the OxEd portal landing page (title, notice banner, five image cards)
// but built from the portal's own tabs, with live counts and a real notice strip.
// Toggle on/off in Settings → Dashboard; "Go to my dashboard" skips it for the session.

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Info, TriangleAlert, CalendarClock, Sparkles } from 'lucide-react'

export type WelcomeTarget =
  | { kind: 'tab'; tab: string }
  | { kind: 'page'; page: string }
  | { kind: 'assess' }
  | { kind: 'report'; report: string }

export type WelcomeNotice = { tone: 'alert' | 'info' | 'due'; text: string; target?: WelcomeTarget; cta?: string }

export type WelcomeLast = { label: string; target: WelcomeTarget; at: number } | null

type CardLink = { label: string; target: WelcomeTarget }
type Card = {
  id: string
  title: string
  blurb: string
  badge?: string
  badgeTone?: 'accent' | 'alert' | 'ok'
  art: React.ReactNode
  tint: string       // header background
  primary: CardLink
  links: CardLink[]
}

// ── Flat illustrations (one per card) ───────────────────────────────────────
const Art = {
  assess: (
    <svg viewBox="0 0 200 110" width="100%" height="100%" aria-hidden>
      <circle cx="150" cy="30" r="26" fill="#fff" opacity=".55" />
      <rect x="44" y="18" width="70" height="84" rx="8" fill="#fff" stroke="#1778F2" strokeWidth="2.5" />
      <rect x="64" y="10" width="30" height="14" rx="5" fill="#1778F2" />
      <rect x="56" y="40" width="46" height="5" rx="2.5" fill="#B9D6FB" />
      <rect x="56" y="52" width="36" height="5" rx="2.5" fill="#B9D6FB" />
      <rect x="56" y="64" width="42" height="5" rx="2.5" fill="#B9D6FB" />
      <path d="M58 82 l6 6 l12 -13" fill="none" stroke="#5CA131" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M124 48 h44 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-24 l-10 9 v-9 h-10 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10z" fill="#17A2B5" />
      <circle cx="138" cy="67" r="3.5" fill="#fff" /><circle cx="150" cy="67" r="3.5" fill="#fff" /><circle cx="162" cy="67" r="3.5" fill="#fff" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 200 110" width="100%" height="100%" aria-hidden>
      <circle cx="42" cy="34" r="24" fill="#fff" opacity=".55" />
      <rect x="40" y="86" width="120" height="3" rx="1.5" fill="#B9D6FB" />
      <rect x="52" y="54" width="18" height="32" rx="3" fill="#7FB2F7" />
      <rect x="78" y="40" width="18" height="46" rx="3" fill="#1778F2" />
      <rect x="104" y="60" width="18" height="26" rx="3" fill="#7FB2F7" />
      <rect x="130" y="28" width="18" height="58" rx="3" fill="#17A2B5" />
      <path d="M61 46 L87 32 L113 52 L139 18" fill="none" stroke="#5CA131" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="139" cy="18" r="5" fill="#5CA131" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  training: (
    <svg viewBox="0 0 200 110" width="100%" height="100%" aria-hidden>
      <circle cx="156" cy="72" r="26" fill="#fff" opacity=".55" />
      <path d="M100 26 L164 50 L100 74 L36 50 Z" fill="#1778F2" />
      <path d="M62 60 v22 c0 8 18 14 38 14 s38 -6 38 -14 v-22" fill="none" stroke="#1778F2" strokeWidth="6" strokeLinecap="round" />
      <path d="M100 74 L100 100" stroke="#17A2B5" strokeWidth="3" strokeLinecap="round" />
      <path d="M164 50 v26" stroke="#17A2B5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="164" cy="80" r="5" fill="#17A2B5" />
    </svg>
  ),
  resources: (
    <svg viewBox="0 0 200 110" width="100%" height="100%" aria-hidden>
      <circle cx="46" cy="70" r="26" fill="#fff" opacity=".55" />
      <rect x="54" y="30" width="26" height="66" rx="4" fill="#1778F2" />
      <rect x="86" y="18" width="26" height="78" rx="4" fill="#17A2B5" />
      <rect x="118" y="38" width="26" height="58" rx="4" fill="#5CA131" transform="rotate(-8 131 67)" />
      <rect x="60" y="42" width="14" height="4" rx="2" fill="#fff" opacity=".8" />
      <rect x="92" y="30" width="14" height="4" rx="2" fill="#fff" opacity=".8" />
      <rect x="40" y="96" width="120" height="4" rx="2" fill="#B9D6FB" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 200 110" width="100%" height="100%" aria-hidden>
      <circle cx="100" cy="56" r="34" fill="#fff" opacity=".55" />
      <path d="M40 30 h72 a10 10 0 0 1 10 10 v22 a10 10 0 0 1 -10 10 h-46 l-14 12 v-12 h-12 a10 10 0 0 1 -10 -10 v-22 a10 10 0 0 1 10 -10z" fill="#1778F2" />
      <path d="M88 52 h72 a10 10 0 0 1 10 10 v22 a10 10 0 0 1 -10 10 h-12 v12 l-14 -12 h-46 a10 10 0 0 1 -10 -10 v-22 a10 10 0 0 1 10 -10z" fill="#17A2B5" />
      <circle cx="62" cy="51" r="3.5" fill="#fff" /><circle cx="76" cy="51" r="3.5" fill="#fff" /><circle cx="90" cy="51" r="3.5" fill="#fff" />
      <rect x="104" y="70" width="44" height="5" rx="2.5" fill="#fff" opacity=".85" />
      <rect x="104" y="80" width="30" height="5" rx="2.5" fill="#fff" opacity=".6" />
    </svg>
  ),
}

export function buildWelcomeCards(counts: { assessmentsDue: number; reportsDue: number; trainingPct: number; resources: number }): Card[] {
  return [
    {
      id: 'assess', title: 'LanguageScreen Assessments', tint: 'linear-gradient(135deg,#E8F1FE,#D6E7FD)',
      blurb: 'Assess a student in about ten minutes and get a standard score, percentile and recommendation straight away.',
      badge: counts.assessmentsDue ? `${counts.assessmentsDue} due` : 'Up to date', badgeTone: counts.assessmentsDue ? 'alert' : 'ok', art: Art.assess,
      primary: { label: 'Assess a student', target: { kind: 'assess' } },
      links: [{ label: 'View LanguageScreen results', target: { kind: 'tab', tab: 'languagescreen' } }, { label: 'Classes', target: { kind: 'tab', tab: 'classes' } }],
    },
    {
      id: 'reports', title: 'Reports', tint: 'linear-gradient(135deg,#E6F6F8,#D2EEF2)',
      blurb: 'Term summaries, student progress, at-risk lists and parent letters — generated from live assessment data.',
      badge: counts.reportsDue ? `${counts.reportsDue} due` : undefined, badgeTone: 'accent', art: Art.reports,
      primary: { label: 'Generate a report', target: { kind: 'tab', tab: 'reports' } },
      links: [{ label: 'School term summary', target: { kind: 'report', report: 'term-summary' } }, { label: 'Insights', target: { kind: 'page', page: 'insights' } }],
    },
    {
      id: 'training', title: 'TEL TED Training', tint: 'linear-gradient(135deg,#EAF3FF,#DCEBFF)',
      blurb: 'Coordinator and assistant courses, certification tracking and the TEL TED learning library.',
      badge: `${counts.trainingPct}% complete`, badgeTone: 'accent', art: Art.training,
      primary: { label: 'Continue training', target: { kind: 'tab', tab: 'training' } },
      links: [{ label: 'TEL TED Learning', target: { kind: 'tab', tab: 'telted' } }, { label: 'Staff', target: { kind: 'tab', tab: 'staff-tab' } }],
    },
    {
      id: 'resources', title: 'Digital Resources', tint: 'linear-gradient(135deg,#EEF8E9,#DFF1D6)',
      blurb: 'Session materials, Special Words, stories of the week, picture cards and parent handouts — all in one place.',
      badge: counts.resources ? `${counts.resources} files` : undefined, badgeTone: 'ok', art: Art.resources,
      primary: { label: 'Open resources', target: { kind: 'tab', tab: 'resources' } },
      links: [{ label: 'This week’s session plan', target: { kind: 'tab', tab: 'today' } }],
    },
    {
      id: 'support', title: 'Support & Mentoring', tint: 'linear-gradient(135deg,#E6F6F8,#DDEFF3)',
      blurb: 'Announcements, guidance from your TEL TED mentor and everything you need for an inspection visit.',
      art: Art.support,
      primary: { label: 'Announcements', target: { kind: 'tab', tab: 'dont-miss' } },
      links: [{ label: 'Inspection Mode', target: { kind: 'page', page: 'inspection' } }, { label: 'Settings', target: { kind: 'page', page: 'settings' } }],
    },
  ]
}

const noticeStyle: Record<WelcomeNotice['tone'], { bg: string; fg: string; Icon: typeof Info }> = {
  alert: { bg: 'var(--tt-red-soft)', fg: 'var(--tt-red)', Icon: TriangleAlert },
  info:  { bg: 'color-mix(in srgb, var(--tt-accent2) 12%, transparent)', fg: 'var(--tt-accent2-deep)', Icon: Info },
  due:   { bg: 'var(--tt-amber-soft)', fg: 'var(--tt-amber)', Icon: CalendarClock },
}

export function TelTedWelcomePage({ userName, school, district, cards, notices, last, onOpen, onContinue, onDisable }: {
  userName: string
  school: string
  district: string
  cards: Card[]
  notices: WelcomeNotice[]
  last: WelcomeLast
  onOpen: (t: WelcomeTarget, label: string) => void
  onContinue: () => void
  onDisable: () => void
}) {
  const [greeting, setGreeting] = useState('Welcome')
  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
    setDateStr(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])
  const first = userName.split(' ')[0]

  return (
    <div className="space-y-5 tt-welcome">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8, padding: '28px 32px 24px' }}>
        {/* Right padding keeps the title clear of the fixed theme/bell/avatar cluster in the top-right corner */}
        <div style={{ paddingRight: 300 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--tt-text)', margin: 0, letterSpacing: '-0.01em' }}>Welcome to the Horizon Education Portal</h1>
          <p style={{ fontSize: 15, color: 'var(--tt-dim)', margin: '8px 0 0' }}>
            {greeting}, {first}. Here’s where things stand at <strong style={{ color: 'var(--tt-text)', fontWeight: 600 }}>{school}</strong> · {district}{dateStr ? ` · ${dateStr}` : ''}
          </p>
          <button onClick={onContinue} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold mt-4"
            style={{ backgroundColor: 'var(--tt-accent)', color: '#fff', borderRadius: 8, border: '1px solid var(--tt-accent)', cursor: 'pointer' }}>
            Go to my dashboard <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Notice banner(s) */}
      {notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n, i) => {
            const s = noticeStyle[n.tone]
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: s.bg, borderLeft: `4px solid ${s.fg}`, borderRadius: 8 }}>
                <s.Icon size={18} style={{ color: s.fg, flexShrink: 0 }} />
                <span className="text-sm flex-1" style={{ color: 'var(--tt-text)' }}>{n.text}</span>
                {n.target && (
                  <button onClick={() => onOpen(n.target!, n.cta || 'Open')} className="text-sm font-semibold inline-flex items-center gap-1 shrink-0" style={{ color: s.fg, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {n.cta || 'Open'} <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Continue where you left off */}
      {last && (
        <button onClick={() => onOpen(last.target, last.label)} className="w-full flex items-center gap-3 px-4 py-3 text-left"
          style={{ backgroundColor: 'var(--tt-card)', border: '1px dashed var(--tt-accent-border)', borderRadius: 8, cursor: 'pointer' }}>
          <Sparkles size={16} style={{ color: 'var(--tt-accent)' }} />
          <span className="text-sm" style={{ color: 'var(--tt-dim)' }}>Continue where you left off:</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--tt-accent)' }}>{last.label}</span>
          <ChevronRight size={14} style={{ color: 'var(--tt-accent)', marginLeft: 'auto' }} />
        </button>
      )}

      {/* Cards */}
      <style>{`.tt-welcome-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}@media(min-width:1200px){.tt-welcome-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}`}</style>
      <div className="tt-welcome-grid">
        {cards.map(c => (
          <div key={c.id} className="flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8 }}>
            <div style={{ background: c.tint, height: 128, position: 'relative', padding: '10px 14px' }}>
              {c.art}
              {c.badge && (
                <span className="absolute top-2.5 right-2.5 text-[11px] font-bold px-2 py-0.5" style={{
                  borderRadius: 999,
                  backgroundColor: c.badgeTone === 'alert' ? 'var(--tt-red)' : c.badgeTone === 'ok' ? 'var(--tt-green-deep)' : 'var(--tt-accent)',
                  color: '#fff',
                }}>{c.badge}</span>
              )}
            </div>
            <div className="flex flex-col flex-1" style={{ padding: '14px 16px 16px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tt-text)', margin: 0 }}>{c.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--tt-dim)', margin: '6px 0 12px', lineHeight: 1.45, flex: 1 }}>{c.blurb}</p>
              <button onClick={() => onOpen(c.primary.target, c.primary.label)} className="inline-flex items-center gap-1.5 text-sm font-semibold self-start" style={{ color: 'var(--tt-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                {c.primary.label} <ArrowRight size={14} />
              </button>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {c.links.map(l => (
                  <button key={l.label} onClick={() => onOpen(l.target, l.label)} className="text-xs" style={{ color: 'var(--tt-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>{l.label}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
        <p className="text-xs" style={{ color: 'var(--tt-muted)' }}>This page shows each time you sign in. You can turn it off in Settings → Dashboard, or reopen it any time from the school name in the sidebar.</p>
        <button onClick={onDisable} className="text-xs font-semibold" style={{ color: 'var(--tt-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Don’t show this on sign-in</button>
      </div>
    </div>
  )
}
