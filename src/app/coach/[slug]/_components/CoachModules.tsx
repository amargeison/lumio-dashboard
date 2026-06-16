'use client'

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  COACH_ORG, COACH_TOP_STATS, COACH_TODAY, COACH_AI_BRIEF,
  BELTS, ALL_SKILLS, MASTERY_LABELS, skillScore, LTA_MAP,
  PLAYERS, LESSONS, RESOURCES,
  PACKAGES, PAY_SUMMARY,
  CAMPS, CAMP_ATTENDEES, CAMP_TARGETS, buildCampItinerary, playerDevStats,
  WEEK_START,
  type Player, type Lesson, type Resource, type Camp, type Booking,
} from '../_lib/coach-data'
import { WeekCalendarGrid, bookingTypeColour, MonthAgenda, agendaDayLabel } from './WeekCalendar'
import { bookingCalItems } from '../_lib/schedule'
import { getAddedBookings, subscribe as subscribeBookings } from '../_lib/bookings-store'
import { AddBookingModal } from './AddBookingModal'
import { printBeltCertificate } from './BeltCertificate'
import { LessonShareMenu } from './ShareMenu'
import { CampEquipment, CampPlayerPacks } from './CampPacks'
import { LessonAiBrief, PlayerDetailModal, printLessonReport } from './CoachDetails'
import { NewSummaryModal } from './NewSummary'
import { getAllLessons, subscribe as subscribeLessons, consumeOpenLesson } from '../_lib/lessons-store'
import { BooksPanel } from './BooksPanel'
import { openResource } from './ResourceDocs'
import { DrillLibrary } from './DrillLibrary'
import { OfferedPackages, PackageProgressModal } from './Packages'
import { usedFromProgress, subscribe as subscribePackages } from '../_lib/packages-store'
import type { Package } from '../_lib/coach-data'
import { VideoModal } from './VideoModal'
import { getAddedResources, subscribe as subscribeResources } from '../_lib/resources-store'
import { AddResourceModal } from './AddResourceModal'
import { AddPlayerModal } from './AddPlayerModal'
import { printWelcomePack } from './WelcomePack'
import { getAddedPlayers, subscribe as subscribeRoster } from '../_lib/roster-store'
import { CoachSendMessage } from './SendMessage'
import { useAllPlayers } from '../_lib/use-roster'
import { SettingsPanel } from './SettingsPanel'
import { getSettings } from '../_lib/settings-store'
import { useCoachSettings } from '../_lib/use-settings'
import { getCamps, subscribe as subscribeCamps } from '../_lib/camps-store'
import { NewCampModal } from './NewCamp'
import {
  getMessages, subscribe as subscribeMessages, markRead, addReply, addForward,
  toggleReaction, softDelete, consumePendingOpen, type CoachInboxMessage,
} from '../_lib/messages-store'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Cross-view signal (in-memory): the dashboard "Needs attention" panel records
// which player to open, and DevelopmentView consumes it on mount so the CLICKED
// player is selected — not the default first player. Both live in this file.
let _pendingDevPlayerId: string | null = null
function openDevPlayer(id: string) { _pendingDevPlayerId = id }
function consumeDevPlayer(): string | null { const v = _pendingDevPlayerId; _pendingDevPlayerId = null; return v }

// ─── Shared primitives ──────────────────────────────────────────────────────
export function Card({ T, density, children, style, hover, onClick }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  const [h, setH] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        position: 'relative', background: T.panel,
        border: `1px solid ${h && hover ? T.borderHi : T.border}`,
        borderRadius: density.radius, padding: density.pad,
        boxShadow: T.cardShadow, transition: 'border-color .12s, transform .12s',
        transform: h && hover ? 'translateY(-1px)' : 'none',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}>{children}</div>
  )
}

export function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>{right}</div>
    </div>
  )
}

function Pill({ T, children, color, bg }: { T: ThemeTokens; children: ReactNode; color?: string; bg?: string }) {
  return <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: bg ?? T.hover, color: color ?? T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{children}</span>
}

function PageHead({ T, accent, title, sub, action }: Common & { title: string; sub: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>{sub}</p>
      </div>
      <div style={{ marginLeft: 'auto' }}>{action}</div>
    </div>
  )
}

function masteryColor(T: ThemeTokens, accent: AccentTokens, score: number): string {
  return [T.text4, T.warn, '#3A8EE0', T.good, accent.hex][score] ?? T.text4
}

function statusDot(T: ThemeTokens, s: 'green' | 'amber' | 'red') { return s === 'green' ? T.good : s === 'amber' ? T.warn : T.bad }

function pct(a: number, b: number) { return b ? Math.round((a / b) * 100) : 0 }

function Avatar({ accent, initials, size = 32 }: { accent: AccentTokens; initials: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: size * 0.34, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0 }}>{initials}</div>
}

// Belt completion: % of skills at Consistent (3) or higher for a player at beltIndex.
function beltProgress(player: Player, beltIndex: number): number {
  const threshold = getSettings().awardThreshold
  const belt = BELTS[beltIndex]
  const scores = belt.skills.map((_s, si) => skillScore(player.seed, beltIndex, si, player.beltIndex))
  const done = scores.filter(v => v >= threshold).length
  return Math.round((done / belt.skills.length) * 100)
}

function BeltChip({ beltIndex, size = 18 }: { beltIndex: number; size?: number }) {
  const b = BELTS[beltIndex]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: size, height: size * 0.62, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)', display: 'inline-block' }} />
      <span style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</span>
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
export function DashboardView({ T, accent, density, onNavigate }: Common & { onNavigate: (s: string) => void }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const settings = useCoachSettings()
  const [msgOpen, setMsgOpen] = useState(false)
  // Inbox preview reads the shared messages store; actions route through the
  // same store so reply/dismiss here sync to the Messages page and survive
  // reload. Rows expand INLINE (football InteractiveFootballInbox pattern) so
  // the coach acts without leaving the dashboard — only "All →" opens the page.
  const [messages, setMessages] = useState<CoachInboxMessage[]>([])
  useEffect(() => { const r = () => setMessages(getMessages()); r(); return subscribeMessages(r) }, [])
  const [inboxOpen, setInboxOpen] = useState<string | null>(null)
  const [inboxMode, setInboxMode] = useState<'idle' | 'replying' | 'forwarding'>('idle')
  const [inboxReply, setInboxReply] = useState('')
  const [inboxForwardTo, setInboxForwardTo] = useState(FORWARD_TARGETS[0])
  const openInboxMsg = (id: string) => {
    if (inboxOpen === id) { setInboxOpen(null); return }   // toggle closed
    setInboxOpen(id); setInboxMode('idle'); setInboxReply(''); markRead(id)
  }
  return (
    <div>
      {msgOpen && <CoachSendMessage T={T} accent={accent} onClose={() => setMsgOpen(false)} />}
      {/* Hero row — 8/4 split: the hero banner (span 8) sits beside a Today
          timeline (span 4), mirroring football's hero ‖ TodaySchedule pair.
          Reuses the cm-12 grid class so it collapses to one column at ≤768px.
          NB: we use `span N` (not football's explicit `1 / span 8` / `9 / span 4`
          line form) because this single DashboardView also renders inside the
          mobile shell — `span` clamps cleanly to one column, explicit start
          lines would spawn implicit tracks and break the mobile layout. */}
      <div className="cm-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap, marginBottom: density.gap }}>
      {/* Hero */}
      <Card T={T} density={density} style={{ gridColumn: 'span 8', overflow: 'hidden', padding: `${density.pad - 2}px ${density.pad + 4}px` }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}, {settings.coach.split(' ')[0]}</span>
              <span style={{ width: 1, height: 10, background: T.borderHi }} />
              <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>{settings.academy}</span>
            </div>
            <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 23, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>7 sessions, 4 racket assessments due</h1>
            <p style={{ marginTop: 5, marginBottom: 0, fontSize: 12.5, color: T.text2, maxWidth: 560 }}>{COACH_ORG.venue} · {settings.cert}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => onNavigate('lessons')} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon name="note" size={14} stroke={2} /> Lesson Summaries
              </button>
              <button onClick={() => onNavigate('calendar')} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon name="calendar" size={14} stroke={1.6} /> Open calendar
              </button>
              <button onClick={() => setMsgOpen(true)} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon name="megaphone" size={14} stroke={1.6} /> Send message
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 12 }}>
            <div className="tnum" style={{ color: T.text, fontSize: 13 }}>{COACH_ORG.date}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cloud" size={13} stroke={1.5} /> 21° · dry · light wind</div>
            <div style={{ fontSize: 10.5, color: T.text3 }}>All outdoor courts playable</div>
          </div>
        </div>
      </Card>

      {/* Today timeline — transplanted out of the old grid slot into the space
          beside the hero. Scrollable, mirrors football's FbTodaySchedule. */}
      <Card T={T} density={density} hover style={{ gridColumn: 'span 4' }}>
        <SectionHead T={T} title="Today" right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>{COACH_TODAY.length} blocks</span>} />
        <div style={{ maxHeight: 176, overflowY: 'auto', marginRight: -2, paddingRight: 2 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />
            {COACH_TODAY.map((it, i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', gap: 14, padding: '6px 0' }}>
                <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11, color: it.highlight ? accent.hex : T.text3, width: 44, paddingTop: 2 }}>{it.t}</div>
                <div style={{ position: 'absolute', left: 46, top: 9, width: 7, height: 7, borderRadius: '50%', background: it.highlight ? accent.hex : T.panel, border: `1.5px solid ${it.highlight ? accent.hex : T.borderHi}` }} />
                <div style={{ flex: 1, paddingLeft: 14 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: it.highlight ? 600 : 500 }}>{it.what}</div>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{it.where} · {it.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {COACH_TOP_STATS.map((s, i) => {
          const dot = s.tone === 'urgent' ? T.bad : s.tone === 'warn' ? T.warn : s.tone === 'ok' ? T.good : accent.hex
          return (
            <Card key={i} T={T} density={density} hover style={{ flex: '1 1 150px', padding: density.pad - 2 }}>
              <div style={{ position: 'absolute', top: density.pad - 2, right: density.pad, width: 6, height: 6, borderRadius: '50%', background: dot }} />
              <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: T.text, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.text2 }}>{s.sub}</div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Grid re-budget after Today moved up to the hero row. Spans sum to 12:
          Inbox (4) ‖ AI briefing (5) ‖ Needs attention (3). AI briefing keeps
          its span-5 width and slides into Today's vacated middle area. */}
      <div className="cm-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
        {/* Inbox — static preview of the latest 5 messages from the store.
            Read-only in Phase A (no click-to-open/reply yet — that's Phase B). */}
        <Card T={T} density={density} style={{ gridColumn: 'span 4' }}>
          <SectionHead T={T} title={<><Icon name="bell" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2 }} />Inbox</>}
            right={<button onClick={() => onNavigate('messages')} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 11, fontFamily: FONT, padding: 0 }}>All →</button>} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.slice(0, 5).map((m, i) => {
              const isOpen = inboxOpen === m.id
              return (
                <div key={m.id} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                  {/* Row — click expands inline (does NOT navigate). */}
                  <div onClick={() => openInboxMsg(m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', margin: '0 -4px', borderRadius: 6, cursor: 'pointer', background: isOpen ? T.panel2 : 'transparent' }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = T.hover }} onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: m.unread > 0 ? (m.urgent ? T.bad : accent.hex) : T.text4 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: T.text, fontWeight: m.unread > 0 ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.outbound ? `To ${m.from}` : m.from}</span>
                        <Pill T={T}>{m.outbound ? 'Sent' : m.role.split(' · ')[0]}</Pill>
                        {m.reactions.map(e => <span key={e} style={{ fontSize: 11 }}>{e}</span>)}
                      </div>
                      <div style={{ fontSize: 11, color: m.unread > 0 ? T.text2 : T.text3, whiteSpace: isOpen ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{m.last}</div>
                    </div>
                    <div className="tnum" style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, flexShrink: 0 }}>{m.time}</div>
                  </div>

                  {/* Expanded thread + actions — compact, scrollable so the card stays tidy. */}
                  {isOpen && (
                    <div style={{ padding: '2px 2px 10px' }}>
                      <div style={{ maxHeight: 132, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0 8px' }}>
                        {m.thread.length === 0 && <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>{m.body}</div>}
                        {m.thread.map((te, ti) => (
                          <div key={ti} style={{ display: 'flex', justifyContent: te.from === 'coach' ? 'flex-end' : 'flex-start' }}>
                            <div style={{ maxWidth: '85%', padding: '6px 9px', borderRadius: 9, fontSize: 11.5, lineHeight: 1.45, background: te.from === 'coach' ? accent.dim : T.panel, border: `1px solid ${te.from === 'coach' ? accent.border : T.border}`, color: T.text }}>{te.text}</div>
                          </div>
                        ))}
                      </div>
                      {m.forwards.map((f, fi) => <div key={fi} style={{ fontSize: 10.5, color: T.good, fontFamily: FONT_MONO, marginBottom: 4 }}>↪ Forwarded to {f.to} ✓</div>)}
                      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                        {MSG_REACTIONS.map(emoji => (
                          <ReactionButton key={emoji} T={T} accent={accent} emoji={emoji} active={m.reactions.includes(emoji)} count={m.reactions.includes(emoji) ? 1 : 0} onClick={() => toggleReaction(m.id, emoji)} />
                        ))}
                      </div>
                      {inboxMode === 'idle' && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => { setInboxMode('replying'); setInboxReply('') }} style={msgBtnGhost(T)}>Reply</button>
                          <button onClick={() => setInboxMode('forwarding')} style={msgBtnGhost(T)}>Forward</button>
                          <button onClick={() => { softDelete(m.id); setInboxOpen(null) }} style={{ ...msgBtnGhost(T), color: T.bad }}>Dismiss</button>
                        </div>
                      )}
                      {inboxMode === 'replying' && (
                        <div>
                          <textarea value={inboxReply} onChange={e => setInboxReply(e.target.value)} placeholder={`Reply to ${m.from}…`} rows={2} autoFocus
                            style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.borderHi}`, borderRadius: 8, padding: 8, fontSize: 12, fontFamily: FONT, resize: 'vertical', outline: 'none' }} />
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button onClick={() => { const t = inboxReply.trim(); if (!t) return; addReply(m.id, t); setInboxReply(''); setInboxMode('idle') }} disabled={!inboxReply.trim()} style={msgBtnPrimary(T, accent, !!inboxReply.trim())}>Send</button>
                            <button onClick={() => { setInboxMode('idle'); setInboxReply('') }} style={msgBtnGhost(T)}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {inboxMode === 'forwarding' && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <select value={inboxForwardTo} onChange={e => setInboxForwardTo(e.target.value)} style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 8px', fontSize: 11.5, fontFamily: FONT }}>
                            {FORWARD_TARGETS.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <button onClick={() => { addForward(m.id, inboxForwardTo); setInboxMode('idle') }} style={msgBtnPrimary(T, accent, true)}>Forward</button>
                          <button onClick={() => setInboxMode('idle')} style={msgBtnGhost(T)}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {messages.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>Inbox cleared.</div>}
          </div>
        </Card>

        {/* AI brief */}
        <Card T={T} density={density} style={{ gridColumn: 'span 5' }}>
          <SectionHead T={T} title={<><Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2 }} />Coach AI briefing</>} right={<span style={{ fontFamily: FONT_MONO }}>06:42</span>} />
          {COACH_AI_BRIEF.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <Pill T={T} color={it.pri === 'high' ? T.bad : T.text3} bg={it.pri === 'high' ? 'rgba(199,90,90,0.10)' : T.hover}>{it.tag}</Pill>
              <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{it.txt}</div>
            </div>
          ))}
        </Card>

        {/* Needs attention */}
        <Card T={T} density={density} style={{ gridColumn: 'span 3' }}>
          <SectionHead T={T} title="Needs attention" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLAYERS.filter(p => p.status !== 'green').map(p => (
              <div key={p.id} onClick={() => { openDevPlayer(p.id); onNavigate('development') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                <Avatar accent={accent} initials={p.initials} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: T.text, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.text3 }}>{p.status === 'red' ? 'Attendance & form down' : 'Watch progress'}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot(T, p.status) }} />
              </div>
            ))}
            <div onClick={() => onNavigate('belts')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', borderRadius: 6, background: accent.dim, border: `1px solid ${accent.border}`, cursor: 'pointer' }}>
              <Icon name="trophy" size={14} stroke={1.6} style={{ color: accent.hex }} />
              <div style={{ fontSize: 11.5, color: T.text, fontWeight: 600 }}>4 racket assessments due</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LESSON SUMMARIES  (master–detail)
// ════════════════════════════════════════════════════════════════════════════
export function LessonsView({ T, accent, density }: Common) {
  const players = useAllPlayers()
  const [allLessons, setAllLessons] = useState<Lesson[]>(LESSONS)
  useEffect(() => { const r = () => setAllLessons(getAllLessons()); r(); return subscribeLessons(r) }, [])
  const [selId, setSelId] = useState(LESSONS[0].id)
  // Open the lesson the player-card "View full summary" link asked for, if any.
  useEffect(() => { const id = consumeOpenLesson(); if (id) setSelId(id) }, [])
  const [shareOpen, setShareOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const sel = allLessons.find(l => l.id === selId) ?? allLessons[0]
  const skillNames = (ids: string[]) => ids.map(id => ALL_SKILLS.find(s => s.id === id)?.name ?? id)
  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Lesson Summaries" sub="What you covered, the key takeaways and the homework — ready to share with players and parents."
        action={<button onClick={() => setNewOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Icon name="plus" size={14} stroke={2} /> New summary</button>} />
      <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: density.gap }}>
        {/* List */}
        <Card T={T} density={density} style={{ padding: 8, alignSelf: 'start' }}>
          {allLessons.map(l => {
            const active = l.id === selId
            return (
              <div key={l.id} onClick={() => setSelId(l.id)} style={{ padding: '10px 10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar accent={accent} initials={l.player.split(' ').map(w => w[0]).join('')} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.player}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{l.date} · {l.type}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: active ? T.text : T.text2, marginTop: 6 }}>{l.focus}</div>
              </div>
            )
          })}
        </Card>

        {/* Detail */}
        <Card T={T} density={density}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar accent={accent} initials={sel.player.split(' ').map(w => w[0]).join('')} size={36} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{sel.player}</div>
                  <div style={{ fontSize: 11.5, color: T.text3 }}>{sel.date} · {sel.time} · {sel.duration} min · {sel.court}</div>
                </div>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Pill T={T} color={accent.hex} bg={accent.dim}>{sel.type}</Pill>
              <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < sel.rating ? accent.hex : T.text4, fontSize: 13 }}>★</span>)}</span>
            </div>
          </div>

          <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontFamily: FONT_MONO }}>Session focus</div>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginTop: 2 }}>{sel.focus}</div>
          </div>

          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <SubHead T={T} icon="check" accent={accent}>What we covered</SubHead>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{sel.covered.map((c, i) => <li key={i} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{c}</li>)}</ul>

              <SubHead T={T} icon="sparkles" accent={accent} mt>Key takeaways</SubHead>
              {sel.takeaways.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: T.text, padding: '4px 0' }}>
                  <span style={{ color: accent.hex }}>›</span>{t}
                </div>
              ))}
            </div>
            <div>
              <SubHead T={T} icon="flag" accent={accent}>Drills used</SubHead>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{sel.drills.map((d, i) => <span key={i} style={{ fontSize: 11.5, color: T.text2, padding: '4px 8px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}</div>

              <SubHead T={T} icon="trophy" accent={accent} mt>Skills worked (racket system)</SubHead>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{skillNames(sel.skillsWorked).map((s, i) => <Pill key={i} T={T} color={accent.hex} bg={accent.dim}>{s}</Pill>)}</div>

              <SubHead T={T} icon="home" accent={accent} mt>Homework</SubHead>
              <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{sel.homework}</div>
            </div>
          </div>

          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next session focus</div>
              <div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{sel.nextFocus}</div>
            </div>
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coach note (private)</div>
              <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3, fontStyle: 'italic' }}>{sel.coachNote}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setShareOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="megaphone" size={13} stroke={1.8} /> Share with parent</button>
            <button style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Duplicate</button>
            <button onClick={() => printLessonReport(sel)} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Export PDF</button>
            <button onClick={() => setShareOpen(true)} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: accent.hex, border: `1px solid ${accent.border}`, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="megaphone" size={13} stroke={1.8} /> Share</button>
          </div>

          <LessonAiBrief T={T} accent={accent} density={density} lesson={sel} />
        </Card>
      </div>
      {shareOpen && <LessonShareMenu T={T} accent={accent} lesson={sel} onClose={() => setShareOpen(false)} />}
      {newOpen && <NewSummaryModal T={T} accent={accent} density={density} players={players} onClose={() => setNewOpen(false)} onCreated={id => setSelId(id)} />}
    </div>
  )
}

function SubHead({ T, accent, icon, children, mt }: { T: ThemeTokens; accent: AccentTokens; icon: string; children: ReactNode; mt?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: mt ? '16px 0 8px' : '0 0 8px' }}><Icon name={icon} size={12} stroke={1.8} style={{ color: accent.hex }} />{children}</div>
}

// ════════════════════════════════════════════════════════════════════════════
// PLAYER DEVELOPMENT  (master–detail with skill radar-style bars)
// ════════════════════════════════════════════════════════════════════════════
export function DevelopmentView({ T, accent, density }: Common) {
  const players = useAllPlayers()
  const [selId, setSelId] = useState(PLAYERS[0].id)
  // Open the player the dashboard "Needs attention" panel asked for, if any.
  useEffect(() => { const id = consumeDevPlayer(); if (id) setSelId(id) }, [])
  const p = players.find(x => x.id === selId) ?? players[0]
  const belt = BELTS[p.beltIndex]
  const prog = beltProgress(p, p.beltIndex)
  const playerLessons = LESSONS.filter(l => l.playerId === p.id)
  // overall mastery across all earned + current skills
  const totalSkills = ALL_SKILLS.length
  const earned = ALL_SKILLS.filter(s => s.beltIndex < p.beltIndex).length
    + belt.skills.filter((_s, si) => skillScore(p.seed, p.beltIndex, si, p.beltIndex) >= 3).length
  const stats = playerDevStats(p)
  const devBoxes: { l: string; v: ReactNode; sub?: string; c?: string }[] = [
    { l: 'Current racket',  v: <BeltChip beltIndex={p.beltIndex} size={16} /> },
    { l: 'Racket progress', v: `${prog}%`, c: accent.hex, sub: `to ${BELTS[Math.min(p.beltIndex + 1, BELTS.length - 1)].name}` },
    { l: 'Attendance',    v: `${p.attendance}%`, c: p.attendance >= 90 ? T.good : p.attendance >= 80 ? T.warn : T.bad, sub: 'last 8 weeks' },
    { l: 'Skills earned', v: `${earned}/${totalSkills}`, sub: 'all rackets' },
    { l: 'Court hours',   v: stats.hoursTerm, sub: 'this term' },
    { l: 'Sessions',      v: stats.sessionsTerm, sub: `streak ${stats.streak}` },
    { l: 'Lessons',       v: stats.lessonsLogged, sub: 'logged' },
    { l: '1st serve %',   v: `${stats.serveNow}%`, c: T.good, sub: `▲ ${stats.serveGain} pts` },
    { l: 'Win rate',      v: `${stats.winPct}%`, sub: 'match play' },
    { l: 'Rally consistency', v: `${stats.rally}%`, sub: 'in rallies' },
  ]

  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Player Development" sub="Track every player's journey — current racket, skill mastery, goals and trajectory." />
      <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: density.gap }}>
        {/* Player list */}
        <Card T={T} density={density} style={{ padding: 8, alignSelf: 'start' }}>
          {players.map(pl => {
            const active = pl.id === selId
            return (
              <div key={pl.id} onClick={() => setSelId(pl.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 2 }}>
                <Avatar accent={accent} initials={pl.initials} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{pl.name}</div>
                  <div style={{ fontSize: 10.5, color: T.text3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 11, height: 7, borderRadius: 2, background: BELTS[pl.beltIndex].colour, border: '1px solid rgba(128,128,128,0.4)', display: 'inline-block' }} />
                    {BELTS[pl.beltIndex].name} · {pl.group}
                  </div>
                </div>
                <span style={{ fontSize: 12 }}>{pl.trend === 'up' ? '↑' : pl.trend === 'down' ? '↓' : '→'}</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot(T, pl.status) }} />
              </div>
            )
          })}
        </Card>

        {/* Player detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <Card T={T} density={density}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Avatar accent={accent} initials={p.initials} size={48} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.text3 }}>{p.group} · Age {p.age}{p.parent ? ` · Parent: ${p.parent}` : ''}</div>
              </div>
              <button onClick={() => printBeltCertificate(p, p.beltIndex)} title={`Print ${belt.name} racket certificate`}
                style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <Icon name="trophy" size={14} stroke={2} /> Racket certificate
              </button>
            </div>
            <div style={{ marginTop: 12, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="flag" size={13} stroke={1.8} style={{ color: accent.hex }} />
              <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Goal</span>
              <span style={{ fontSize: 12.5, color: T.text }}>{p.goal}</span>
            </div>
            {/* rich stat boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 10, marginTop: 12 }}>
              {devBoxes.map((b, i) => (
                <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.l}</div>
                  <div className="tnum" style={{ fontSize: 17, fontWeight: 600, color: b.c ?? T.text, marginTop: 3 }}>{b.v}</div>
                  {b.sub && <div style={{ fontSize: 9.5, color: b.c ?? T.text3, marginTop: 1 }}>{b.sub}</div>}
                </div>
              ))}
            </div>
          </Card>

          {/* Working belt skill bars */}
          <Card T={T} density={density}>
            <SectionHead T={T} title={<>Working racket · {belt.name} — {belt.theme}</>} right={<span style={{ fontFamily: FONT_MONO }}>{prog}% to award</span>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {belt.skills.map((s, si) => {
                const score = skillScore(p.seed, p.beltIndex, si, p.beltIndex)
                return (
                  <div key={s.id}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 10.5, color: T.text3, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.note}</div>
                      <div style={{ fontSize: 10.5, color: masteryColor(T, accent, score), fontFamily: FONT_MONO, fontWeight: 600 }}>{MASTERY_LABELS[score]}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map(lv => <div key={lv} style={{ flex: 1, height: 6, borderRadius: 3, background: lv <= score ? masteryColor(T, accent, score) : T.hover }} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Belt ladder mini + recent lessons */}
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
            <Card T={T} density={density}>
              <SectionHead T={T} title="Racket journey" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {BELTS.map((b, bi) => {
                  const state = bi < p.beltIndex ? 'done' : bi === p.beltIndex ? 'current' : 'locked'
                  return (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: state === 'locked' ? 0.4 : 1 }}>
                      <span style={{ width: 22, height: 14, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                      <span style={{ fontSize: 12, color: T.text, fontWeight: state === 'current' ? 700 : 500, flex: 1 }}>{b.name} <span style={{ color: T.text3, fontWeight: 400 }}>· {b.theme}</span></span>
                      {state === 'done' && <Icon name="check" size={13} stroke={2} style={{ color: T.good }} />}
                      {state === 'current' && <Pill T={T} color={accent.hex} bg={accent.dim}>now</Pill>}
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card T={T} density={density}>
              <SectionHead T={T} title="Recent lessons" right={<span style={{ fontFamily: FONT_MONO }}>{playerLessons.length}</span>} />
              {playerLessons.length ? playerLessons.map(l => (
                <div key={l.id} style={{ padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{l.focus}</div>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{l.date} · {l.duration} min · {l.type}</div>
                  <div style={{ fontSize: 11.5, color: T.text2, marginTop: 4 }}>{l.takeaways[0]}</div>
                </div>
              )) : <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '12px 0' }}>No lesson summaries logged yet.</div>}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ T, label, value, accent }: { T: ThemeTokens; label: string; value: ReactNode; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="tnum" style={{ fontSize: 15, fontWeight: 600, color: accent ?? T.text, marginTop: 2 }}>{value}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BELT PROGRESSION  (the full skill matrix)
// ════════════════════════════════════════════════════════════════════════════
export function BeltsView({ T, accent, density }: Common) {
  const players = useAllPlayers()
  const [open, setOpen] = useState<string>('white')
  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Racket Progression System" sub="A Kyu-Dan style ranking adapted for tennis. Nine rackets, each unlocking a cluster of skills — earn a racket when every skill is Consistent or better." />

      {/* LTA alignment note */}
      <Card T={T} density={density} style={{ marginBottom: density.gap, borderColor: accent.border, background: accent.dim }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="shield" size={16} stroke={1.7} style={{ color: accent.hex, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.5 }}>
            <strong>Aligned to the LTA Youth pathway.</strong> Each racket maps to a stage of the LTA Youth programme — the five official ball-colour stages <span style={{ color: T.text2 }}>Blue → Red → Orange → Green → Yellow</span>, then the LTA Youth Compete grades and the performance pathway. The racket is your academy ladder; the LTA stage is the national-framework equivalent shown on every racket below.
          </div>
        </div>
      </Card>

      {/* Belt ladder strip */}
      <Card T={T} density={density} style={{ marginBottom: density.gap }}>
        <SectionHead T={T} title="The ladder" right={<span style={{ fontFamily: FONT_MONO }}>White → Black · {ALL_SKILLS.length} skills</span>} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BELTS.map((b, bi) => (
            <div key={b.id} onClick={() => setOpen(b.id)} style={{ flex: '1 1 90px', cursor: 'pointer', padding: '10px 8px', borderRadius: 8, background: open === b.id ? accent.dim : T.panel2, border: `1px solid ${open === b.id ? accent.border : T.border}`, textAlign: 'center' }}>
              <div style={{ height: 22, borderRadius: 4, background: b.colour, border: '1px solid rgba(128,128,128,0.4)', marginBottom: 6 }} />
              <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>{bi + 1}. {b.name}</div>
              <div style={{ fontSize: 9.5, color: T.text3 }}>{b.theme}</div>
              <div style={{ marginTop: 4 }}><Pill T={T} color={ballColour(b.ball)} bg={`${ballColour(b.ball)}1f`}>{b.ball} ball</Pill></div>
              <div style={{ fontSize: 8.5, color: LTA_MAP[b.id]?.colour ?? T.text3, marginTop: 4, fontWeight: 600, letterSpacing: '0.02em' }}>{LTA_MAP[b.id]?.stage.replace('LTA Youth · ', '').replace('LTA Youth ', '')}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Expanded belt detail */}
      {BELTS.filter(b => b.id === open).map(b => (
        <Card key={b.id} T={T} density={density} style={{ marginBottom: density.gap }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ width: 40, height: 26, borderRadius: 5, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{b.name} racket — {b.theme}</div>
              <div style={{ fontSize: 11.5, color: T.text3 }}>{b.ageGuide} · {b.ball} ball stage</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Pill T={T} color={accent.hex} bg={accent.dim}>{b.skills.length} skills to master</Pill>
            </div>
          </div>
          {LTA_MAP[b.id] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${LTA_MAP[b.id].colour}`, borderRadius: 8, padding: '9px 12px', marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: LTA_MAP[b.id].colour, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LTA alignment</span>
              <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{LTA_MAP[b.id].stage}</span>
              <span style={{ fontSize: 11, color: T.text3 }}>· ages {LTA_MAP[b.id].ages}</span>
              <span style={{ fontSize: 11.5, color: T.text2, flexBasis: '100%' }}>{LTA_MAP[b.id].focus}</span>
            </div>
          )}
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {b.skills.map(s => (
              <div key={s.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: T.text2, marginTop: 3, lineHeight: 1.45 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Cohort matrix: players × belts */}
      <Card T={T} density={density}>
        <SectionHead T={T} title="Squad racket matrix" right={<span style={{ fontFamily: FONT_MONO }}>{players.length} players</span>} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Player</th>
                {BELTS.map(b => <th key={b.id} style={{ padding: '6px 4px' }}><div style={{ width: 20, height: 12, borderRadius: 2, background: b.colour, border: '1px solid rgba(128,128,128,0.4)', margin: '0 auto' }} title={b.name} /></th>)}
                <th style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase' }}>Now</th>
                <th style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 8px', textTransform: 'uppercase', textAlign: 'right' }}>Award</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar accent={accent} initials={p.initials} size={24} /><span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{p.name}</span></div>
                  </td>
                  {BELTS.map((b, bi) => {
                    let cell: ReactNode = null
                    if (bi < p.beltIndex) cell = <Icon name="check" size={12} stroke={2.4} style={{ color: T.good }} />
                    else if (bi === p.beltIndex) {
                      const prog = beltProgress(p, bi)
                      cell = <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, color: accent.hex, fontWeight: 700 }}>{prog}%</span>
                    }
                    return <td key={b.id} style={{ textAlign: 'center', padding: '8px 4px' }}>{cell}</td>
                  })}
                  <td style={{ padding: '8px 10px' }}><BeltChip beltIndex={p.beltIndex} size={16} /></td>
                  <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                    <button onClick={() => printBeltCertificate(p, p.beltIndex)} title={`Print ${BELTS[p.beltIndex].name} racket certificate`}
                      style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: accent.hex, borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      <Icon name="trophy" size={12} stroke={1.9} /> Certificate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="check" size={12} stroke={2.4} style={{ color: T.good }} /> racket earned</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700 }}>%</span> progress on current racket</span>
        </div>
      </Card>
    </div>
  )
}

function ballColour(b: string) { return b === 'Red' ? '#C75A5A' : b === 'Orange' ? '#E08A3C' : b === 'Green' ? '#4FAE72' : '#E5C76B' }

// ════════════════════════════════════════════════════════════════════════════
// BOOKING CALENDAR  (week grid)
// ════════════════════════════════════════════════════════════════════════════
export function CalendarView({ T, accent, density }: Common) {
  const [addOpen, setAddOpen] = useState(false)
  const [view, setView] = useState<'week' | 'month'>('week')
  // Added bookings from the store — loaded after mount (SSR-safe) and kept live.
  // BOTH views read this same source, so a new booking shows in week and month.
  const [addedBookings, setAddedBookings] = useState<Booking[]>([])
  useEffect(() => { const r = () => setAddedBookings(getAddedBookings()); r(); return subscribeBookings(r) }, [])
  const items = bookingCalItems(undefined, addedBookings)
  // Month view = 30 days from the start of the current week, grouped into the
  // shared MonthAgenda (the same component the Session Planner's month tab uses).
  const rangeEnd = (() => { const d = new Date(WEEK_START + 'T00:00:00'); d.setDate(d.getDate() + 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const monthItems = items.filter(it => it.date >= WEEK_START && it.date < rangeEnd)
  const monthGroups = Array.from(new Set(monthItems.map(it => it.date))).sort()
    .map(date => ({ date, label: agendaDayLabel(date), items: monthItems.filter(it => it.date === date).sort((a, b) => a.start.localeCompare(b.start)) }))
  const views: { id: 'week' | 'month'; label: string }[] = [{ id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]
  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Booking Calendar" sub="Your week across all courts — private lessons, group squads, cardio and match play."
        action={<button onClick={() => setAddOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Icon name="plus" size={14} stroke={2} /> Add booking</button>} />
      {/* Week / Month switcher — same pill-tab styling as the Session Planner. */}
      <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 16, width: 'fit-content' }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: view === v.id ? T.panel : 'transparent', color: view === v.id ? T.text : T.text2, fontWeight: view === v.id ? 600 : 400, boxShadow: view === v.id ? `0 0 0 1px ${T.border}` : 'none' }}>{v.label}</button>
        ))}
      </div>
      {view === 'week' ? (
        <Card T={T} density={density} style={{ padding: 0, overflowX: 'auto' }}>
          <WeekCalendarGrid T={T} accent={accent} density={density} items={items} />
        </Card>
      ) : (
        <MonthAgenda T={T} accent={accent} groups={monthGroups} empty="No bookings in the next 30 days — add one to get started." />
      )}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', fontSize: 11, color: T.text3 }}>
        {['Private', 'Group', 'Cardio', 'Match play', 'Block'].map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: bookingTypeColour(T, accent, t) }} />{t}</span>
        ))}
        <span style={{ marginLeft: 'auto' }}>{view === 'week' ? 'Faint fill = pending confirmation' : `Next 30 days · ${monthItems.length} bookings`}</span>
      </div>
      {addOpen && <AddBookingModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ROSTER
// ════════════════════════════════════════════════════════════════════════════
export function RosterView({ T, accent, density, onNavigate }: Common & { onNavigate?: (s: string) => void }) {
  const [group, setGroup] = useState<'All' | 'Junior' | 'Performance' | 'Adult'>('All')
  const [sel, setSel] = useState<Player | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [added, setAdded] = useState<Player[]>([])
  useEffect(() => { const r = () => setAdded(getAddedPlayers()); r(); return subscribeRoster(r) }, [])
  const allPlayers = [...PLAYERS, ...added]
  const list = group === 'All' ? allPlayers : allPlayers.filter(p => p.group === group)
  const tabs: typeof group[] = ['All', 'Junior', 'Performance', 'Adult']
  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Player Roster" sub="Everyone you coach, at a glance."
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8 }}>
              {tabs.map(t => <button key={t} onClick={() => setGroup(t)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: group === t ? T.panel : 'transparent', color: group === t ? T.text : T.text2, fontWeight: group === t ? 600 : 400, boxShadow: group === t ? `0 0 0 1px ${T.border}` : 'none' }}>{t}</button>)}
            </div>
            <button onClick={() => setAddOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}><Icon name="plus" size={14} stroke={2} /> Add player</button>
          </div>
        } />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: density.gap }}>
        {list.map(p => (
          <Card key={p.id} T={T} density={density} hover onClick={() => setSel(p)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar accent={accent} initials={p.initials} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.text3 }}>{p.group} · Age {p.age}</div>
              </div>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: statusDot(T, p.status) }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <BeltChip beltIndex={p.beltIndex} size={18} />
              <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>{beltProgress(p, p.beltIndex)}% to next</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: T.hover, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${beltProgress(p, p.beltIndex)}%`, height: '100%', background: accent.hex }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: T.text2 }}>
              <span><span style={{ color: T.text3 }}>Attendance</span> {p.attendance}%</span>
              <span><span style={{ color: T.text3 }}>Next</span> {p.nextSession}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.text3, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {p.goal}</span>
              <span style={{ color: accent.hex, fontWeight: 600, whiteSpace: 'nowrap' }}>View →</span>
            </div>
            <button onClick={e => { e.stopPropagation(); printWelcomePack(p) }} title="Create welcome & onboarding pack"
              style={{ width: '100%', marginTop: 8, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="note" size={13} stroke={1.8} style={{ color: accent.hex }} /> Welcome pack
            </button>
          </Card>
        ))}
      </div>
      {sel && <PlayerDetailModal T={T} accent={accent} density={density} player={sel} onClose={() => setSel(null)} onNavigate={onNavigate} />}
      {addOpen && <AddPlayerModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════════════════════
// Fixed reaction set (mirrors Junior's fixed-emoji approach — no picker).
const MSG_REACTIONS = ['👍', '❤️', '😂', '✅']
// Demo contacts the coach can forward a message to (players / parents / staff).
const FORWARD_TARGETS = [
  'Dan Pearce · Assistant Coach',
  'Riverside Desk · Venue',
  'Grace Okafor · Parent',
  'Lily Chen · Parent',
  'Performance Squad',
]

export function MessagesView({ T, accent, density }: Common) {
  // Reads the shared messages store (same source as the dashboard Inbox card).
  // Every action routes through the store so it persists AND syncs to the
  // dashboard card live. This is the deliberate difference from football/Junior,
  // which kept inbox actions in session-only useState.
  const [messages, setMessages] = useState<CoachInboxMessage[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [mode, setMode] = useState<'idle' | 'replying' | 'forwarding'>('idle')
  const [replyText, setReplyText] = useState('')
  const [forwardTo, setForwardTo] = useState(FORWARD_TARGETS[0])
  useEffect(() => { const r = () => setMessages(getMessages()); r(); return subscribeMessages(r) }, [])
  // If the dashboard card asked to open a specific thread, honour it on mount.
  useEffect(() => { const p = consumePendingOpen(); if (p) { setOpenId(p); setMode('idle'); markRead(p) } }, [])

  const open = (id: string) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id); setMode('idle'); setReplyText(''); markRead(id)
  }
  const sendReply = (id: string) => { const t = replyText.trim(); if (!t) return; addReply(id, t); setReplyText(''); setMode('idle') }
  const sendForward = (id: string) => { addForward(id, forwardTo); setMode('idle') }
  const remove = (id: string) => { softDelete(id); setOpenId(null) }

  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Messages" sub="Parents, players, groups and the venue — one inbox. Open a message to read, reply, forward or react." />
      <Card T={T} density={density} style={{ maxWidth: 720, padding: 8 }}>
        {messages.map((m, i) => {
          const isOpen = openId === m.id
          return (
            <div key={m.id} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              {/* Row header */}
              <div onClick={() => open(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', cursor: 'pointer', borderRadius: 8, background: isOpen ? T.panel2 : 'transparent' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar accent={accent} initials={m.from.split(' ').map(w => w[0]).join('').slice(0, 2)} size={36} />
                  {m.urgent && !m.read && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: T.bad, border: `2px solid ${T.panel}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: m.unread > 0 ? 700 : 600 }}>{m.outbound ? `To ${m.from}` : m.from}</span>
                    <Pill T={T} color={m.outbound ? accent.hex : undefined} bg={m.outbound ? accent.dim : undefined}>{m.outbound ? `Sent · ${m.channel ?? 'In-app'}` : m.role}</Pill>
                    {m.reactions.map(e => <span key={e} style={{ fontSize: 12 }}>{e}</span>)}
                  </div>
                  <div style={{ fontSize: 12, color: m.unread ? T.text2 : T.text3, whiteSpace: isOpen ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{m.last}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{m.time}</div>
                  {m.unread > 0 && <div style={{ marginTop: 4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, display: 'inline-grid', placeItems: 'center', fontSize: 10, fontWeight: 700, background: accent.dim, color: accent.hex }}>{m.unread}</div>}
                </div>
              </div>

              {/* Expanded thread + actions */}
              {isOpen && (
                <div style={{ padding: '4px 8px 14px 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0 10px' }}>
                    {m.thread.length === 0 && <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{m.body}</div>}
                    {m.thread.map((te, ti) => (
                      <div key={ti} style={{ display: 'flex', justifyContent: te.from === 'coach' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '78%', padding: '8px 11px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.5,
                          background: te.from === 'coach' ? accent.dim : T.panel2, border: `1px solid ${te.from === 'coach' ? accent.border : T.border}`,
                          color: T.text }}>
                          <div>{te.text}</div>
                          <div className="tnum" style={{ fontSize: 9.5, color: T.text3, fontFamily: FONT_MONO, marginTop: 3, textAlign: 'right' }}>{te.from === 'coach' ? `${COACH_ORG.coach.split(' ')[0]} · ${te.time}` : te.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Forward receipts */}
                  {m.forwards.map((f, fi) => (
                    <div key={fi} style={{ fontSize: 11, color: T.good, fontFamily: FONT_MONO, marginBottom: 4 }}>↪ Forwarded to {f.to} ✓ · {f.time}</div>
                  ))}

                  {/* Reactions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 10px' }}>
                    {MSG_REACTIONS.map(emoji => (
                      <ReactionButton key={emoji} T={T} accent={accent} emoji={emoji} active={m.reactions.includes(emoji)} count={m.reactions.includes(emoji) ? 1 : 0} onClick={() => toggleReaction(m.id, emoji)} />
                    ))}
                  </div>

                  {/* Action bar */}
                  {mode === 'idle' && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => { setMode('replying'); setReplyText('') }} style={msgBtnGhost(T)}><Icon name="note" size={12} stroke={1.8} style={{ verticalAlign: -2, marginRight: 4 }} />Reply</button>
                      <button onClick={() => setMode('forwarding')} style={msgBtnGhost(T)}><Icon name="megaphone" size={12} stroke={1.8} style={{ verticalAlign: -2, marginRight: 4 }} />Forward</button>
                      <button onClick={() => remove(m.id)} style={{ ...msgBtnGhost(T), color: T.bad }}>Delete</button>
                    </div>
                  )}
                  {mode === 'replying' && (
                    <div>
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={`Reply to ${m.from}…`} rows={3} autoFocus
                        style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.borderHi}`, borderRadius: 8, padding: 9, fontSize: 12.5, fontFamily: FONT, resize: 'vertical', outline: 'none' }} />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => sendReply(m.id)} disabled={!replyText.trim()} style={msgBtnPrimary(T, accent, !!replyText.trim())}>Send reply</button>
                        <button onClick={() => { setMode('idle'); setReplyText('') }} style={msgBtnGhost(T)}>Cancel</button>
                      </div>
                    </div>
                  )}
                  {mode === 'forwarding' && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11.5, color: T.text3 }}>Forward to:</span>
                      <select value={forwardTo} onChange={e => setForwardTo(e.target.value)}
                        style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 9px', fontSize: 12, fontFamily: FONT }}>
                        {FORWARD_TARGETS.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button onClick={() => sendForward(m.id)} style={msgBtnPrimary(T, accent, true)}>Forward</button>
                      <button onClick={() => setMode('idle')} style={msgBtnGhost(T)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {messages.length === 0 && <div style={{ fontSize: 12.5, color: T.text3, fontStyle: 'italic', padding: '20px 8px' }}>Inbox cleared — no messages.</div>}
      </Card>
    </div>
  )
}

function msgBtnGhost(T: ThemeTokens): CSSProperties {
  return { appearance: 'none', fontSize: 11.5, padding: '6px 11px', background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: FONT }
}
function msgBtnPrimary(T: ThemeTokens, accent: AccentTokens, enabled: boolean): CSSProperties {
  return { appearance: 'none', fontSize: 11.5, padding: '6px 12px', background: enabled ? accent.hex : T.hover, color: enabled ? T.btnText : T.text3, border: 0, borderRadius: 7, fontWeight: 600, cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: FONT }
}

// Reaction button — adapted from Junior's ReactionButton to the message shape.
function ReactionButton({ T, accent, emoji, active, count, onClick }: { T: ThemeTokens; accent: AccentTokens; emoji: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={active ? 'Remove reaction' : 'React'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
        background: active ? accent.dim : 'transparent', color: active ? accent.hex : T.text3,
        border: `1px solid ${active ? accent.border : T.border}` }}>
      <span>{emoji}</span>
      {count > 0 && <span style={{ fontSize: 10.5, fontWeight: 700 }}>{count}</span>}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RESOURCE CENTRE
// ════════════════════════════════════════════════════════════════════════════
export function ResourcesView({ T, accent, density }: Common) {
  const cats = ['All', 'Drill Library', 'Drill', 'Technique', 'Training plan', 'Fitness', 'Mental', 'Books'] as const
  const [cat, setCat] = useState<typeof cats[number]>('All')
  const [video, setVideo] = useState<Resource | null>(null)
  const [addedResources, setAddedResources] = useState<Resource[]>([])
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { const r = () => setAddedResources(getAddedResources()); r(); return subscribeResources(r) }, [])
  const allResources = [...RESOURCES, ...addedResources]
  const fullList = cat === 'All' || cat === 'Books' || cat === 'Drill Library'
  const hideGrid = cat === 'Books' || cat === 'Drill Library'
  const list = fullList ? allResources : allResources.filter(r => r.category === cat)
  const fmtIcon = (f: Resource['format']) => f === 'Video' ? 'play' : f === 'Plan' ? 'calendar' : f === 'Worksheet' ? 'note' : 'note'
  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Resource Centre" sub="Your drill library, technique videos, training plans, worksheets and recommended reading — tagged to the racket system."
        action={<button onClick={() => setAddOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Icon name="plus" size={14} stroke={2} /> Add resource</button>} />
      <div style={{ display: 'flex', gap: 6, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {cats.map(c => <button key={c} onClick={() => setCat(c)} style={{ appearance: 'none', border: `1px solid ${cat === c ? accent.border : T.border}`, padding: '6px 12px', borderRadius: 8, fontSize: 11.5, cursor: 'pointer', background: cat === c ? accent.dim : 'transparent', color: cat === c ? accent.hex : T.text2, fontWeight: cat === c ? 600 : 400 }}>{c === 'Books' ? '📚 Books' : c === 'Drill Library' ? '🎾 Drill Library' : c}</button>)}
      </div>
      {cat === 'Drill Library' && <DrillLibrary T={T} accent={accent} density={density} />}
      {cat === 'Books' && <BooksPanel T={T} accent={accent} density={density} />}
      {!hideGrid && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: density.gap }}>
        {list.map(r => {
          const isVideo = r.format === 'Video'
          const onClick = isVideo ? (r.video ? () => setVideo(r) : undefined) : () => openResource(r)
          return (
          <Card key={r.id} T={T} density={density} hover onClick={onClick}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}>
                <Icon name={fmtIcon(r.format)} size={16} stroke={1.7} style={{ color: accent.hex }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{r.title}</div>
                <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>{r.category} · {r.format} · {r.duration}</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 10, lineHeight: 1.45 }}>{r.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <Pill T={T} color={levelColour(T, r.level)} bg={`${levelColour(T, r.level)}1f`}>{r.level}</Pill>
              {r.belt && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.text3 }}><span style={{ width: 12, height: 8, borderRadius: 2, background: BELTS.find(b => b.id === r.belt)?.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{BELTS.find(b => b.id === r.belt)?.name}</span>}
              {r.tags.map(t => <span key={t} style={{ fontSize: 10, color: T.text3 }}>#{t}</span>)}
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}`, fontSize: 11.5, fontWeight: 600, color: (isVideo && !r.video) ? T.text3 : accent.hex }}>
              {isVideo ? (r.video ? '▶ Watch video →' : '▶ Video · preview coming soon') : `Open ${r.format.toLowerCase()} →`}
            </div>
          </Card>
          )
        })}
      </div>
      )}
      {video && <VideoModal T={T} accent={accent} resource={video} onClose={() => setVideo(null)} />}
      {addOpen && <AddResourceModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

function levelColour(T: ThemeTokens, l: string) { return l === 'Beginner' ? T.good : l === 'Intermediate' ? '#3A8EE0' : l === 'Advanced' ? T.bad : T.text2 }

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS & PACKAGES
// ════════════════════════════════════════════════════════════════════════════
export function PaymentsView({ T, accent, density }: Common) {
  const cfg = useCoachSettings()
  const statusTone = (s: string) => s === 'active' ? T.good : s === 'expiring' ? T.warn : T.bad
  const [selected, setSelected] = useState<Package | null>(null)
  const [, setTick] = useState(0)
  useEffect(() => subscribePackages(() => setTick(t => t + 1)), [])
  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Payments & Packages" sub={`Lesson packs, credits used and what's outstanding · Private £${cfg.privateRate}/hr`} />
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {[
          { label: 'Earned this month', value: `£${PAY_SUMMARY.mtd.toLocaleString()}`, tone: accent.hex },
          { label: 'Outstanding', value: `£${PAY_SUMMARY.outstanding}`, tone: T.bad },
          { label: 'Active packages', value: PAY_SUMMARY.packagesActive, tone: T.good },
          { label: 'Expiring soon', value: PAY_SUMMARY.expiringSoon, tone: T.warn },
        ].map((s, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 150px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: s.tone, marginTop: 4 }}>{s.value}</div>
          </Card>
        ))}
      </div>
      <OfferedPackages T={T} accent={accent} density={density} />

      <Card T={T} density={density}>
        <SectionHead T={T} title="Lesson packages" right="Tap a player to update their sessions" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                {['Player', 'Plan', 'Used', 'Status', 'Renews'].map(h => <th key={h} style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map((p, i) => {
                const used = usedFromProgress(p.id) ?? p.used
                return (
                <tr key={i} onClick={() => setSelected(p)} style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.hover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px', fontSize: 12.5, color: T.text, fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{p.player}<Icon name="chevron-right" size={13} stroke={1.8} style={{ color: T.text3 }} /></span>
                  </td>
                  <td style={{ padding: '10px', fontSize: 12, color: T.text2 }}>{p.plan}</td>
                  <td style={{ padding: '10px', minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.hover, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ width: `${(used / p.total) * 100}%`, height: '100%', background: used >= p.total ? T.bad : accent.hex }} />
                      </div>
                      <span className="tnum" style={{ fontSize: 11, color: T.text2, fontFamily: FONT_MONO }}>{used}/{p.total}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px' }}><Pill T={T} color={statusTone(p.status)} bg={`${statusTone(p.status)}1f`}>{p.status}</Pill></td>
                  <td style={{ padding: '10px', fontSize: 12, color: T.text2, fontFamily: FONT_MONO }}>{p.renews}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <PackageProgressModal T={T} accent={accent} density={density} pkg={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TRAINING CAMPS  (14-day paid camps — overview / itinerary / attendees / targets / finance)
// ════════════════════════════════════════════════════════════════════════════
export function CampsView({ T, accent, density }: Common) {
  const [camps, setCamps] = useState<Camp[]>(getCamps())
  useEffect(() => { setCamps(getCamps()); return subscribeCamps(() => setCamps(getCamps())) }, [])
  const [selId, setSelId] = useState(CAMPS[0].id)
  const [tab, setTab] = useState<'overview' | 'itinerary' | 'equipment' | 'attendees' | 'targets' | 'packs' | 'finance'>('overview')
  const [newOpen, setNewOpen] = useState(false)
  const camp = camps.find(c => c.id === selId) ?? camps[0]
  const attendees = CAMP_ATTENDEES.filter(a => a.campId === camp.id)
  const targets = CAMP_TARGETS[camp.id]
  const statusTone = (s: Camp['status']) => s === 'in-progress' ? T.good : s === 'upcoming' ? accent.hex : T.text3
  const selectCamp = (id: string) => { setSelId(id); setTab('overview') }

  return (
    <div>
      <PageHead T={T} accent={accent} density={density} title="Training Camps" sub="Run your 14-day camps in Spain and Portugal: bookings, itinerary, targets and finances in one place."
        action={<button onClick={() => setNewOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><Icon name="plus" size={14} stroke={2} /> New camp</button>} />

      {/* Camp selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: density.gap, marginBottom: density.gap }}>
        {camps.map(c => (
            <Card key={c.id} T={T} density={density} hover onClick={() => selectCamp(c.id)} style={{ borderColor: c.id === selId ? accent.border : undefined, background: c.id === selId ? accent.dim : T.panel }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{c.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{c.location}, {c.country}</div>
                </div>
                <Pill T={T} color={statusTone(c.status)} bg={`${statusTone(c.status)}1f`}>{c.status}</Pill>
              </div>
              <div style={{ fontSize: 11, color: T.text2, marginTop: 8 }}>{c.start} → {c.end} · {c.days} days</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.hover, overflow: 'hidden' }}>
                  <div style={{ width: `${pct(c.booked, c.capacity)}%`, height: '100%', background: c.booked >= c.capacity ? T.good : accent.hex }} />
                </div>
                <span className="tnum" style={{ fontSize: 10.5, color: T.text2, fontFamily: FONT_MONO }}>{c.booked}/{c.capacity}</span>
              </div>
            </Card>
        ))}
      </div>

      {/* Selected camp header */}
      <Card T={T} density={density} style={{ marginBottom: density.gap }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 34 }}>{camp.flag}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{camp.name}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{camp.resort} · {camp.location}, {camp.country} · {camp.surfaces} · {camp.courts} courts</div>
            <p style={{ fontSize: 12.5, color: T.text2, marginTop: 8, marginBottom: 0, maxWidth: 640, lineHeight: 1.5 }}>{camp.summary}</p>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Metric T={T} label="Dates" value={`${camp.days} days`} />
            <Metric T={T} label="Booked" value={`${camp.booked}/${camp.capacity}`} accent={camp.booked >= camp.capacity ? T.good : accent.hex} />
            <Metric T={T} label="Per head" value={`£${camp.pricePerHead.toLocaleString()}`} />
            <Metric T={T} label="Revenue" value={`£${(camp.booked * camp.pricePerHead).toLocaleString()}`} accent={T.good} />
          </div>
        </div>
      </Card>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {([['overview', 'Overview'], ['itinerary', '14-Day Itinerary'], ['equipment', 'Equipment'], ['attendees', `Attendees · ${attendees.length}`], ['targets', 'Targets'], ['packs', 'Player Packs'], ['finance', 'Finance']] as const).map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: `1px solid ${tab === id ? accent.border : T.border}`, padding: '7px 14px', borderRadius: 9, fontSize: 12, cursor: 'pointer', background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>{lbl}</button>
        ))}
      </div>

      {tab === 'overview' && <CampOverview T={T} accent={accent} density={density} camp={camp} attendees={attendees} targets={targets} />}
      {tab === 'itinerary' && <CampItinerary T={T} accent={accent} density={density} camp={camp} />}
      {tab === 'equipment' && <CampEquipment T={T} accent={accent} density={density} camp={camp} />}
      {tab === 'attendees' && <CampAttendees T={T} accent={accent} density={density} camp={camp} attendees={attendees} />}
      {tab === 'targets' && <CampTargets T={T} accent={accent} density={density} targets={targets} attendees={attendees} />}
      {tab === 'packs' && <CampPlayerPacks T={T} accent={accent} density={density} camp={camp} attendees={attendees} />}
      {tab === 'finance' && <CampFinance T={T} accent={accent} density={density} camp={camp} attendees={attendees} />}

      {newOpen && <NewCampModal T={T} accent={accent} density={density} onClose={() => setNewOpen(false)} onCreated={(id) => { setSelId(id); setTab('overview') }} />}
    </div>
  )
}

type CampSub = Common & { camp: Camp }

function CampOverview({ T, accent, density, camp, attendees, targets }: CampSub & { attendees: typeof CAMP_ATTENDEES; targets: typeof CAMP_TARGETS[string] }) {
  const collected = attendees.reduce((s, a) => s + (camp.pricePerHead - a.balance), 0)
  const outstanding = attendees.reduce((s, a) => s + a.balance, 0)
  const dayCamp = camp.country === 'England'
  const days = buildCampItinerary(camp)
  const sessionCount = days.reduce((s, d) => s + d.sessions.filter(x => x.type !== 'Logistics' && x.type !== 'Social' && x.type !== 'Culture').length, 0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }} className="cm-12">
      <Card T={T} density={density} style={{ gridColumn: 'span 7' }}>
        <SectionHead T={T} title="Camp at a glance" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            ['Location', `${camp.resort}`], ['Region', `${camp.location}, ${camp.country}`],
            ['Duration', `${camp.days} days · ${camp.start}–${camp.end}`], ['Courts', `${camp.courts} · ${camp.surfaces}`],
            ['Coaching sessions', `${sessionCount} across the camp`], ['Daily rhythm', dayCamp ? 'AM skills · PM games & match play' : 'AM technical · PM tactical/match · EVE video/fitness'],
            ['Capacity', `${camp.booked} of ${camp.capacity} booked`], ['Board', 'Full board at resort'],
          ].map(([k, v], i) => (
            <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card T={T} density={density} style={{ gridColumn: 'span 5' }}>
        <SectionHead T={T} title="Financial snapshot" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FinRow T={T} label="Projected revenue" value={`£${(camp.booked * camp.pricePerHead).toLocaleString()}`} tone={T.text} />
          <FinRow T={T} label="Collected" value={`£${collected.toLocaleString()}`} tone={T.good} />
          <FinRow T={T} label="Outstanding" value={`£${outstanding.toLocaleString()}`} tone={outstanding ? T.warn : T.text3} />
          <FinRow T={T} label="Spots remaining" value={`${camp.capacity - camp.booked}`} tone={accent.hex} />
        </div>
        <div style={{ marginTop: 12 }}>
          <SectionHead T={T} title="Top objectives" />
          {(targets?.group ?? []).slice(0, 3).map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: T.text2, padding: '4px 0' }}><span style={{ color: accent.hex }}>›</span>{g}</div>
          ))}
          {!targets && <div style={{ fontSize: 11.5, color: T.text3, padding: '4px 0' }}>No objectives set for this camp yet.</div>}
        </div>
      </Card>
    </div>
  )
}

function FinRow({ T, label, value, tone }: { T: ThemeTokens; label: string; value: string; tone: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.text3 }}>{label}</span>
      <span className="tnum" style={{ fontSize: 14, fontWeight: 600, color: tone, fontFamily: FONT_MONO }}>{value}</span>
    </div>
  )
}

function CampItinerary({ T, accent, density, camp }: CampSub) {
  const days = buildCampItinerary(camp)
  const dayCamp = camp.country === 'England'
  const slotColour = (type: string) => ({
    Technical: accent.hex, Tactical: '#3A8EE0', 'Match play': T.good, Video: '#E5C76B', Fitness: T.warn,
    Recovery: T.text3, Culture: '#3A8EE0', Social: '#E08A3C', Logistics: T.text3, Briefing: accent.hex, Review: accent.hex,
  } as Record<string, string>)[type] ?? T.text3
  return (
    <Card T={T} density={density} style={{ padding: density.pad }}>
      <SectionHead T={T} title={`${camp.days}-day itinerary — ${camp.name}`} right={<span style={{ fontFamily: FONT_MONO }}>{dayCamp ? 'AM · PM' : 'AM · PM · EVE'}</span>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days.map(d => (
          <div key={d.day} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, padding: '10px 0', borderTop: d.day > 1 ? `1px solid ${T.border}` : 'none', opacity: d.rest ? 0.85 : 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, margin: '0 auto', display: 'grid', placeItems: 'center', background: d.rest ? T.hover : accent.dim, border: `1px solid ${d.rest ? T.border : accent.border}` }}>
                <div style={{ fontSize: 9, color: T.text3, lineHeight: 1 }}>DAY</div>
                <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: d.rest ? T.text3 : accent.hex }}>{d.day}</div>
              </div>
              <div style={{ fontSize: 9.5, color: T.text3, fontFamily: FONT_MONO, marginTop: 3 }}>{d.date}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>{d.theme}{d.rest && <span style={{ color: T.text3, fontWeight: 400 }}> · rest day</span>}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="cm-3">
                {d.sessions.map((s, i) => (
                  <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${slotColour(s.type)}`, borderRadius: 7, padding: '7px 9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: slotColour(s.type), fontFamily: FONT_MONO }}>{s.slot}</span>
                      <span className="tnum" style={{ fontSize: 9.5, color: T.text3, fontFamily: FONT_MONO }}>{s.time}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: T.text, fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>{s.title}</div>
                    <div style={{ fontSize: 9.5, color: T.text3, marginTop: 2 }}>{s.type} · {s.where}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function CampAttendees({ T, accent, density, camp, attendees }: CampSub & { attendees: typeof CAMP_ATTENDEES }) {
  const payTone = (p: string) => p === 'paid' ? T.good : p === 'deposit' ? T.warn : T.bad
  return (
    <Card T={T} density={density}>
      <SectionHead T={T} title={`Attendees · ${attendees.length} of ${camp.capacity}`} right={<span style={{ fontFamily: FONT_MONO }}>{camp.capacity - camp.booked} spots left</span>} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              {['Player', 'Age', 'Level', 'Payment', 'Balance', 'Room', 'Arrival', 'Camp goal'].map(h => <th key={h} style={{ fontSize: 10, color: T.text3, fontWeight: 600, padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {attendees.map((a, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar accent={accent} initials={a.initials} size={26} /><span style={{ fontSize: 12.5, color: T.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{a.name}</span></div></td>
                <td style={{ padding: '8px', fontSize: 12, color: T.text2 }}>{a.age}</td>
                <td style={{ padding: '8px' }}><BeltChip beltIndex={a.beltIndex} size={15} /></td>
                <td style={{ padding: '8px' }}><Pill T={T} color={payTone(a.payment)} bg={`${payTone(a.payment)}1f`}>{a.payment}</Pill></td>
                <td style={{ padding: '8px', fontSize: 12, color: a.balance ? T.warn : T.text3, fontFamily: FONT_MONO }}>{a.balance ? `£${a.balance.toLocaleString()}` : '—'}</td>
                <td style={{ padding: '8px', fontSize: 11.5, color: T.text2, whiteSpace: 'nowrap' }}>{a.room}</td>
                <td style={{ padding: '8px', fontSize: 11, color: T.text3, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{a.arrival}</td>
                <td style={{ padding: '8px', fontSize: 11.5, color: T.text2, minWidth: 200 }}>{a.goal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: T.good }} /> paid in full</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: T.warn }} /> deposit only</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: T.bad }} /> unpaid</span>
      </div>
    </Card>
  )
}

function CampTargets({ T, accent, density, targets, attendees }: Common & { targets: typeof CAMP_TARGETS[string]; attendees: typeof CAMP_ATTENDEES }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }} className="cm-12">
      <Card T={T} density={density} style={{ gridColumn: 'span 6' }}>
        <SectionHead T={T} title="Camp targets" right={<Icon name="flag" size={13} stroke={1.7} style={{ color: accent.hex }} />} />
        {(targets?.group ?? []).map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{g}</div>
          </div>
        ))}
        {!targets && <div style={{ fontSize: 11.5, color: T.text3, padding: '9px 0' }}>No targets set for this camp yet — add them in coach-data.ts.</div>}
        <div style={{ marginTop: 14 }}>
          <SectionHead T={T} title="Camp outcomes" />
          {(targets?.outcomes ?? []).map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: T.text2, padding: '4px 0' }}><Icon name="check" size={13} stroke={2} style={{ color: T.good, flexShrink: 0, marginTop: 1 }} />{o}</div>
          ))}
        </div>
      </Card>
      <Card T={T} density={density} style={{ gridColumn: 'span 6' }}>
        <SectionHead T={T} title="Individual goals" right={<span style={{ fontFamily: FONT_MONO }}>{attendees.length} players</span>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {attendees.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <Avatar accent={accent} initials={a.initials} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: T.text2 }}>🎯 {a.goal}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CampFinance({ T, accent, density, camp, attendees }: CampSub & { attendees: typeof CAMP_ATTENDEES }) {
  const projected = camp.booked * camp.pricePerHead
  const collected = attendees.reduce((s, a) => s + (camp.pricePerHead - a.balance), 0)
  const outstanding = attendees.reduce((s, a) => s + a.balance, 0)
  // Indicative costs
  const costs = [
    { label: 'Resort & full board', amount: Math.round(camp.booked * 620) },
    { label: 'Court hire', amount: camp.days * camp.courts * 18 },
    { label: 'Assistant coaches', amount: camp.days * 2 * 140 },
    { label: 'Transfers & logistics', amount: Math.round(camp.booked * 55) },
  ]
  const totalCost = costs.reduce((s, c) => s + c.amount, 0)
  const margin = projected - totalCost
  return (
    <div>
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {[
          { label: 'Projected revenue', value: `£${projected.toLocaleString()}`, tone: T.text },
          { label: 'Collected', value: `£${collected.toLocaleString()}`, tone: T.good },
          { label: 'Outstanding', value: `£${outstanding.toLocaleString()}`, tone: outstanding ? T.warn : T.text3 },
          { label: 'Est. margin', value: `£${margin.toLocaleString()}`, tone: margin > 0 ? T.good : T.bad },
        ].map((s, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 150px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div className="tnum" style={{ fontSize: 23, fontWeight: 500, color: s.tone, marginTop: 4 }}>{s.value}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }} className="cm-12">
        <Card T={T} density={density} style={{ gridColumn: 'span 6' }}>
          <SectionHead T={T} title="Payment status" />
          {attendees.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <Avatar accent={accent} initials={a.initials} size={26} />
              <span style={{ flex: 1, fontSize: 12, color: T.text }}>{a.name}</span>
              <span className="tnum" style={{ fontSize: 11.5, color: T.text2, fontFamily: FONT_MONO }}>£{(camp.pricePerHead - a.balance).toLocaleString()} / £{camp.pricePerHead.toLocaleString()}</span>
              <Pill T={T} color={a.payment === 'paid' ? T.good : a.payment === 'deposit' ? T.warn : T.bad} bg={`${a.payment === 'paid' ? T.good : a.payment === 'deposit' ? T.warn : T.bad}1f`}>{a.payment}</Pill>
            </div>
          ))}
        </Card>
        <Card T={T} density={density} style={{ gridColumn: 'span 6' }}>
          <SectionHead T={T} title="Indicative costs" right={<span style={{ fontFamily: FONT_MONO }}>est.</span>} />
          {costs.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 12, color: T.text2 }}>{c.label}</span>
              <span className="tnum" style={{ fontSize: 12.5, color: T.text, fontFamily: FONT_MONO }}>£{c.amount.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4, borderTop: `1px solid ${T.borderHi}` }}>
            <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>Total cost</span>
            <span className="tnum" style={{ fontSize: 13.5, color: T.text, fontWeight: 700, fontFamily: FONT_MONO }}>£{totalCost.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0' }}>
            <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>Estimated margin</span>
            <span className="tnum" style={{ fontSize: 13.5, color: margin > 0 ? T.good : T.bad, fontWeight: 700, fontFamily: FONT_MONO }}>£{margin.toLocaleString()}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS (light placeholder)
// ════════════════════════════════════════════════════════════════════════════
export function SettingsView({ T, accent, density }: Common) {
  return <SettingsPanel T={T} accent={accent} density={density} />
}
