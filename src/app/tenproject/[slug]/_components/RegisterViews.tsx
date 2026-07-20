'use client'

import React, { useEffect, useState } from 'react'
import { QrCode, WifiOff, CheckCircle, Users, ClipboardList, Sparkles, PlayCircle, BookOpen, ShieldAlert, Package, Phone, FileText, BarChart3, MapPin, GraduationCap, CalendarDays, Send, Navigation, Printer, Share2, School } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import UpcomingCalendar from './UpcomingCalendar'
import { SendMessageWizard } from './CommsTab'
import { openResourceDoc, openSessionCardDoc } from '../_lib/resource-docs'
import { TP_RED, TP_DARK, COHORT_CHILDREN, WEEKEND_FAMILIES, VENUES, CURRICULUM, WEEK4_SESSION_PLAN, WEEK4_SCHOOL_PLAN, OAKRIDGE_ADDRESS, TENOR_RESOURCES, COACH_STATS, COACH_WEEKEND, COACH_RESOURCES, VENUE_DETAILS } from '@/data/tenproject/demo-data'

// ─── Shared session run-sheet card (used by Coach today/weekend + TENOR) ────
function SessionRunSheet({ plan, context, onPrint }: {
  plan: typeof WEEK4_SESSION_PLAN
  context: string
  onPrint: () => void
}) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub={`${context} — ${plan.skill} week, ${plan.duration}`}>
          <ClipboardList size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Session card — Week {plan.week}: {plan.skill}
        </SectionTitle>
        <button onClick={onPrint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
          <Printer size={13} /> Print
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {plan.blocks.map(b => (
          <div key={b.time} style={{ display: 'flex', gap: 12, background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ flexShrink: 0, width: 74 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_RED }}>{b.time}</div>
              <div style={{ fontSize: 10, color: '#8A847E', fontWeight: 700 }}>{b.mins} min</div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{b.title}</div>
              <div style={{ fontSize: 12, color: '#5B554F', marginTop: 2, lineHeight: 1.5 }}>{b.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginTop: 14 }}>
        <div style={{ background: '#FDE8E8', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: TP_RED, letterSpacing: 0.6, marginBottom: 6 }}>COACHING POINTS</div>
          {plan.coachingPoints.map(cp => <div key={cp} style={{ fontSize: 11.5, color: TP_DARK, marginBottom: 4 }}>• {cp}</div>)}
        </div>
        <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.6, marginBottom: 6 }}>
            <Package size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />EQUIPMENT
          </div>
          {plan.equipment.map(eq => <div key={eq} style={{ fontSize: 11.5, color: '#5B554F', marginBottom: 4 }}>• {eq}</div>)}
        </div>
        <div style={{ background: '#FCF1DC', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#9A6A0B', letterSpacing: 0.6, marginBottom: 6 }}>
            <ShieldAlert size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />SAFETY & SAFEGUARDING
          </div>
          {plan.safety.map(s => <div key={s} style={{ fontSize: 11.5, color: '#5B554F', marginBottom: 4 }}>• {s}</div>)}
        </div>
        <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.6, marginBottom: 6 }}>
            <PlayCircle size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />THIS WEEK’S VIDEOS
          </div>
          {plan.videos.map(v => (
            <div key={v.title} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#5B554F', marginBottom: 4 }}>
              <span>▸ {v.title}</span>
              <span style={{ color: '#8A847E', fontWeight: 700 }}>{v.length}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export type CoachSection = 'stats' | 'today' | 'weekend' | 'resources'
export const COACH_SECTIONS: { id: CoachSection; label: string }[] = [
  { id: 'stats', label: 'My stats' },
  { id: 'today', label: 'Schools' },
  { id: 'weekend', label: 'Weekend sessions' },
  { id: 'resources', label: 'Resources' },
]

export type TenorSection = 'session' | 'resources'
export const TENOR_SECTIONS: { id: TenorSection; label: string }[] = [
  { id: 'session', label: 'Today’s session' },
  { id: 'resources', label: 'Resources' },
]

// ─── COACH: today / weekend / stats / resources ─────────────────────────────
export function CoachView({ section }: { section?: CoachSection }) {
  const [children, setChildren] = useState(COHORT_CHILDREN)
  const [skillTapped, setSkillTapped] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'today' | 'weekend' | 'stats' | 'resources'>(section ?? 'stats')
  const [wizard, setWizard] = useState(false)
  const controlled = section !== undefined
  useEffect(() => { if (section !== undefined) setTab(section) }, [section])
  const present = children.filter(c => c.present).length
  const block = CURRICULUM[1]
  const maxTrend = Math.max(...COACH_STATS.attendanceTrend)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Tabs (hidden when the sidebar drives sections) + send message */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {!controlled && ([
          { id: 'stats' as const, label: 'My stats', icon: BarChart3 },
          { id: 'today' as const, label: 'Schools', icon: School },
          { id: 'weekend' as const, label: 'Weekend sessions', icon: CalendarDays },
          { id: 'resources' as const, label: 'Resources', icon: BookOpen },
        ]).map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: active ? TP_DARK : '#fff', color: active ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
        <button onClick={() => setWizard(true)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <Send size={14} /> Send message
        </button>
      </div>
      {wizard && <SendMessageWizard onClose={() => setWizard(false)} defaultRecipient="Oakridge Primary" />}

      {/* ── WEEKEND ── */}
      {tab === 'weekend' && (<>
        <Card style={{ background: TP_DARK, border: 'none' }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 900 }}>Your weekend — 2 sessions</div>
          <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>{COACH_WEEKEND.setupDuty}</div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[COACH_WEEKEND.lead, COACH_WEEKEND.support].map(s => {
            const vd = VENUE_DETAILS[s.venue.includes('Kingsmead') ? 'kingsmead' : 'elmwood']
            const q = encodeURIComponent(`${vd.address}, ${vd.postcode}`)
            return (
              <Card key={s.venue}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 900, color: TP_DARK }}>
                      <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />{s.venue}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B6560', marginTop: 3 }}>{s.day} {s.time} · {vd.courts}</div>
                    <div style={{ fontSize: 11.5, color: '#8A847E', marginTop: 3 }}>{vd.address}, {vd.postcode}</div>
                  </div>
                  <Pill tone={s.role === 'Session lead' ? 'red' : 'dark'}>{s.role.toUpperCase()}</Pill>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                  <a href={`https://maps.google.com/?q=${q}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F7F5F2', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '6px 11px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                    <MapPin size={12} /> Map
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F7F5F2', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '6px 11px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                    <Navigation size={12} /> Directions
                  </a>
                </div>
                <div style={{ fontSize: 12, color: '#5B554F', marginTop: 10, background: '#F7F5F2', borderRadius: 10, padding: '10px 12px' }}>{s.note}</div>
                <div style={{ display: 'grid', gap: 5, marginTop: 10, fontSize: 11.5, color: '#6B6560' }}>
                  <div><Users size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />TENORs: {s.tenors.join(', ')}</div>
                  <div><Package size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Storage: {vd.storage}</div>
                  <div><QrCode size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Access: {vd.access} · last register: <strong style={{ color: TP_RED }}>{s.lastCount}</strong> children · {vd.familiesRegistered} families registered</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => openResourceDoc('Week 4 session plan — BACKHAND (family)')} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>Open session plan</button>
                  <button onClick={() => setWizard(true)} style={{ background: '#fff', color: TP_DARK, border: '1.5px solid #E7E2DC', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>Message TENORs</button>
                </div>
              </Card>
            )
          })}
        </div>

        <SessionRunSheet
          plan={WEEK4_SESSION_PLAN}
          context="Saturday's family session at Kingsmead — you lead, TENORs run the register"
          onPrint={openSessionCardDoc}
        />
      </>)}

      {/* ── MY STATS ── */}
      {tab === 'stats' && (<>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {COACH_STATS.headline.map(h => (
            <Card key={h.label} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: TP_RED }}>{h.value}</div>
              <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2, fontWeight: 600 }}>{h.label}</div>
            </Card>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="Attendance and sticker progress across your four cohorts">Your cohorts</SectionTitle>
            <div style={{ display: 'grid', gap: 10 }}>
              {COACH_STATS.cohortProgress.map(c => (
                <div key={c.cohort} style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>
                    <span>{c.cohort}</span>
                    <span style={{ color: c.week === 10 ? '#187A3C' : TP_RED }}>{c.week === 10 ? 'COMPLETE' : `Week ${c.week}`}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: '#6B6560', marginTop: 4 }}>
                    <span>Attendance <strong style={{ color: TP_DARK }}>{c.attendance}%</strong></span>
                    <span>Stickers awarded <strong style={{ color: TP_DARK }}>{c.stickers}</strong></span>
                  </div>
                  <div style={{ background: '#EFEBE6', borderRadius: 999, height: 7, marginTop: 7 }}>
                    <div style={{ width: `${(c.week / 10) * 100}%`, height: '100%', background: c.week === 10 ? '#187A3C' : TP_RED, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card>
              <SectionTitle sub="% attendance, your last 10 sessions">Attendance trend</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
                {COACH_STATS.attendanceTrend.map((v, i) => (
                  <div key={i} style={{ flex: 1, height: `${(v / maxTrend) * 100}%`, background: i === COACH_STATS.attendanceTrend.length - 1 ? TP_RED : '#E8B4B3', borderRadius: '4px 4px 0 0' }} title={`${v}%`} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#6B6560', marginTop: 8 }}>Latest: {COACH_STATS.attendanceTrend[COACH_STATS.attendanceTrend.length - 1]}% — above the programme average of 91%.</div>
            </Card>
            <Card>
              <SectionTitle sub="HQ sees this too — expiries flagged before they bite">
                <GraduationCap size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />My compliance
              </SectionTitle>
              <div style={{ display: 'grid', gap: 7 }}>
                {COACH_STATS.compliance.map(c => (
                  <div key={c.item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: TP_DARK, fontWeight: 700 }}>{c.item}</span>
                    <Pill tone={c.status === 'valid' ? 'green' : 'amber'}>{c.note}</Pill>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <UpcomingCalendar role="coach" />
      </>)}

      {/* ── RESOURCES ── */}
      {tab === 'resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {([
            { title: 'Curriculum & session plans', icon: ClipboardList, items: COACH_RESOURCES.curriculum },
            { title: 'Development & pathway', icon: GraduationCap, items: COACH_RESOURCES.development },
            { title: 'Admin & safeguarding', icon: ShieldAlert, items: COACH_RESOURCES.admin },
          ]).map(col => {
            const Icon = col.icon
            return (
              <Card key={col.title}>
                <SectionTitle><Icon size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />{col.title}</SectionTitle>
                <div style={{ display: 'grid', gap: 7 }}>
                  {col.items.map(r => (
                    <button key={r.title} onClick={() => openResourceDoc(r.title)} style={{ background: '#F7F5F2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{r.title} <span style={{ color: TP_RED }}>▸</span></div>
                      <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── SCHOOLS ── */}
      {tab === 'today' && (<>
      {/* My schools strip */}
      <Card>
        <SectionTitle sub="The schools you deliver — today’s live session is highlighted">
          <School size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />My schools
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
          {COACH_STATS.cohortProgress.map((c, i) => (
            <div key={c.cohort} style={{ background: i === 0 ? '#FDE8E8' : '#F7F5F2', border: i === 0 ? `1.5px solid ${TP_RED}44` : '1.5px solid transparent', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{c.cohort}</div>
                {i === 0 && <Pill tone="red">TODAY</Pill>}
              </div>
              <div style={{ fontSize: 11, color: '#6B6560', marginTop: 3 }}>
                {c.week === 10 ? 'Complete' : `Week ${c.week} of 10`} · {c.attendance}% attendance · {c.stickers} stickers
              </div>
              <div style={{ background: '#EFEBE6', borderRadius: 999, height: 6, marginTop: 7 }}>
                <div style={{ width: `${(c.week / 10) * 100}%`, height: '100%', background: c.week === 10 ? '#187A3C' : TP_RED, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>Oakridge Primary — Y3 Falcons · Week 4 of 10</div>
        <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>
          Today 1.15–2.15pm · {block.skill} block · Mrs Patel (PE lead) assisting — hand-over segment in together time
        </div>
        <div style={{ color: '#C9C4BE', fontSize: 12, marginTop: 6 }}>
          <MapPin size={12} style={{ verticalAlign: '-1px', marginRight: 5, color: TP_RED }} />{OAKRIDGE_ADDRESS} · sign in at reception
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(OAKRIDGE_ADDRESS)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#22222A', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
            <MapPin size={12} /> Map
          </a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(OAKRIDGE_ADDRESS)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#22222A', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
            <Navigation size={12} /> Directions
          </a>
          <Pill tone="red">{present} / {children.length} PRESENT</Pill>
          <Pill tone="grey">KIT: 24 rackets · red balls · cones</Pill>
          <Pill tone="grey">NEXT: Y4 Kestrels 2.20pm</Pill>
        </div>
      </Card>

      <Card>
        <SectionTitle sub="One tap = attendance. Second tap = this week’s skill recorded — the parent sees the sticker mirrored tonight.">
          <ClipboardList size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Register — tap to mark
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
          {children.map(c => (
            <div key={c.id} style={{ border: '1px solid #F0EBE5', borderRadius: 10, padding: '10px 12px', background: c.present ? '#fff' : '#F7F5F2' }}>
              <button
                onClick={() => setChildren(prev => prev.map(x => x.id === c.id ? { ...x, present: !x.present } : x))}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: c.present ? TP_DARK : '#9A948E' }}>
                  {c.present ? '✓ ' : ''}{c.name}
                </div>
                <div style={{ fontSize: 10.5, color: '#8A847E' }}>{c.year} · {c.stickers}/6 stickers</div>
              </button>
              {c.present && (
                <button
                  onClick={() => setSkillTapped(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                  style={{ marginTop: 6, width: '100%', background: skillTapped[c.id] ? '#187A3C' : '#FDE8E8', color: skillTapped[c.id] ? '#fff' : TP_RED, border: 'none', borderRadius: 7, padding: '5px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  {skillTapped[c.id] ? '★ BACKHAND recorded' : '+ record BACKHAND'}
                </button>
              )}
            </div>
          ))}
        </div>
        <button style={{ marginTop: 12, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Sparkles size={14} /> AI cohort summary for the school (demo)
        </button>
      </Card>

      <SessionRunSheet
        plan={WEEK4_SCHOOL_PLAN}
        context="Everything you need for today's in-school session"
        onPrint={() => openResourceDoc('Week 4 session plan — BACKHAND (school)')}
      />
      </>)}
    </div>
  )
}

// ─── TENOR: weekend venue + QR scan-in feed + resources ─────────────────────
export function TenorView({ section }: { section?: TenorSection }) {
  const [families, setFamilies] = useState(WEEKEND_FAMILIES)
  const [tab, setTab] = useState<'session' | 'resources'>(section ?? 'session')
  const [wizard, setWizard] = useState(false)
  const controlled = section !== undefined
  useEffect(() => { if (section !== undefined) setTab(section) }, [section])
  const [shared, setShared] = useState(false)
  const venue = VENUES[0]
  const vd = VENUE_DETAILS[venue.id]
  const mapQ = encodeURIComponent(`${vd.address}, ${vd.postcode}`)
  const checkedIn = families.filter(f => f.checkedIn)
  const childCount = checkedIn.reduce((n, f) => n + f.children.split('+').length, 0)
  const plan = WEEK4_SESSION_PLAN

  async function shareCard() {
    const text = `Ten Project — Week ${plan.week} ${plan.skill} session card: ${plan.blocks.map(b => `${b.time} ${b.title}`).join(' · ')}`
    try {
      if (navigator.share) await navigator.share({ title: 'Session card — Week 4', text })
      else { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2000) }
    } catch { /* cancelled */ }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Session / Resources tabs (hidden when the sidebar drives sections) + send message */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {!controlled && ([
          { id: 'session' as const, label: 'Today’s session', icon: ClipboardList },
          { id: 'resources' as const, label: 'Resources', icon: BookOpen },
        ]).map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: active ? TP_DARK : '#fff', color: active ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
        <button onClick={() => setWizard(true)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <Send size={14} /> Send message
        </button>
      </div>
      {wizard && <SendMessageWizard onClose={() => setWizard(false)} defaultRecipient="Kingsmead families" />}

      {tab === 'resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="The shot videos and session cards for every week of the programme">
              <PlayCircle size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Video library
            </SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {TENOR_RESOURCES.weeks.map(w => (
                <div key={w.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: w.current ? '#FDE8E8' : '#F7F5F2', border: w.current ? `1px solid ${TP_RED}44` : '1px solid transparent', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>
                    {w.label} {w.current && <Pill tone="red">THIS WEEK</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6B6560', fontWeight: 700 }}>{w.videos} videos ▸</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card>
              <SectionTitle>
                <FileText size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Guides
              </SectionTitle>
              <div style={{ display: 'grid', gap: 7 }}>
                {TENOR_RESOURCES.guides.map(g => (
                  <button key={g.title} onClick={() => openResourceDoc(g.title)} style={{ background: '#F7F5F2', border: 'none', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{g.title} <span style={{ color: TP_RED }}>▸</span></div>
                    <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{g.desc}</div>
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle>
                <Phone size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Who to call
              </SectionTitle>
              <div style={{ display: 'grid', gap: 8 }}>
                {TENOR_RESOURCES.contacts.map(c => (
                  <div key={c.name} style={{ fontSize: 12.5 }}>
                    <span style={{ fontWeight: 800, color: TP_DARK }}>{c.name}</span>
                    <span style={{ color: '#8A847E' }}> — {c.role}</span>
                    <div style={{ fontSize: 11.5, color: '#6B6560' }}>{c.note}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'session' && (<>
      {/* eslint-disable-next-line no-lone-blocks */}
      <Card style={{ background: TP_DARK, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 900 }}>{venue.name} — Family Session</div>
            <div style={{ color: '#C9C4BE', fontSize: 12.5, marginTop: 4 }}>{venue.day} {venue.time} · you + 2 TENORs on duty · equipment in the green store box</div>
            <div style={{ color: '#C9C4BE', fontSize: 12, marginTop: 6 }}>
              <MapPin size={12} style={{ verticalAlign: '-1px', marginRight: 5, color: TP_RED }} />{vd.address}, {vd.postcode}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
              <a href={`https://maps.google.com/?q=${mapQ}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#22222A', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                <MapPin size={12} /> Map
              </a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${mapQ}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#22222A', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                <Navigation size={12} /> Directions
              </a>
            </div>
          </div>
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: '10px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: TP_RED }}>{childCount}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B6560' }}>children on court</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Families scan the gate QR themselves — you just sanity-check the live count and tap in anyone without a phone">
            <Users size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Today’s register
          </SectionTitle>
          <div style={{ display: 'grid', gap: 7 }}>
            {families.map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: f.checkedIn ? '#F7F5F2' : '#fff', border: '1px solid #F0EBE5', borderRadius: 10, padding: '9px 12px' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{f.family} family</div>
                  <div style={{ fontSize: 11, color: '#6B6560' }}>{f.children}</div>
                </div>
                {f.checkedIn ? (
                  <Pill tone={f.via === 'QR' ? 'green' : 'dark'}>{f.via === 'QR' ? '✓ QR SCAN' : '✓ TENOR TAP'}</Pill>
                ) : (
                  <button
                    onClick={() => setFamilies(prev => prev.map(x => x.id === f.id ? { ...x, checkedIn: true, via: 'TENOR' } : x))}
                    style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 11px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Tap in
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Card style={{ textAlign: 'center' }}>
            <SectionTitle sub="Printed on the gate sign — venue- and date-aware">The gate QR</SectionTitle>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 130, height: 130, background: '#F7F5F2', borderRadius: 12, border: '1px solid #E7E2DC' }}>
              <QrCode size={92} style={{ color: TP_DARK }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <WifiOff size={13} /> Works offline — check-ins sync when signal returns
            </div>
          </Card>
          <Card>
            <SectionTitle>This week at a glance</SectionTitle>
            <div style={{ fontSize: 12.5, color: TP_DARK }}>
              Week {plan.week} — {plan.skill} · {plan.duration}. Full run-sheet below; videos in the Resources tab.
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 10, padding: '9px 11px' }}>
              <CheckCircle size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: '#187A3C' }} />
              Register auto-submits at 3pm — no paperwork, no chasing.
            </div>
          </Card>
        </div>
      </div>

      {/* Full session run-sheet */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <SectionTitle sub={`Everything you need to run today — ${plan.skill} week, ${plan.duration}`}>
            <ClipboardList size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Session card — Week {plan.week}: {plan.skill}
          </SectionTitle>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={openSessionCardDoc} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
              <Printer size={13} /> Print
            </button>
            <button onClick={shareCard} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 13px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
              <Share2 size={13} /> {shared ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {plan.blocks.map(b => (
            <div key={b.time} style={{ display: 'flex', gap: 12, background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ flexShrink: 0, width: 74 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_RED }}>{b.time}</div>
                <div style={{ fontSize: 10, color: '#8A847E', fontWeight: 700 }}>{b.mins} min</div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{b.title}</div>
                <div style={{ fontSize: 12, color: '#5B554F', marginTop: 2, lineHeight: 1.5 }}>{b.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginTop: 14 }}>
          <div style={{ background: '#FDE8E8', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: TP_RED, letterSpacing: 0.6, marginBottom: 6 }}>COACHING POINTS</div>
            {plan.coachingPoints.map(cp => (
              <div key={cp} style={{ fontSize: 11.5, color: TP_DARK, marginBottom: 4 }}>• {cp}</div>
            ))}
          </div>
          <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.6, marginBottom: 6 }}>
              <Package size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />EQUIPMENT
            </div>
            {plan.equipment.map(eq => (
              <div key={eq} style={{ fontSize: 11.5, color: '#5B554F', marginBottom: 4 }}>• {eq}</div>
            ))}
          </div>
          <div style={{ background: '#FCF1DC', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#9A6A0B', letterSpacing: 0.6, marginBottom: 6 }}>
              <ShieldAlert size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />SAFETY & SAFEGUARDING
            </div>
            {plan.safety.map(s => (
              <div key={s} style={{ fontSize: 11.5, color: '#5B554F', marginBottom: 4 }}>• {s}</div>
            ))}
          </div>
          <div style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK, letterSpacing: 0.6, marginBottom: 6 }}>
              <PlayCircle size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />THIS WEEK’S VIDEOS
            </div>
            {plan.videos.map(v => (
              <div key={v.title} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#5B554F', marginBottom: 4 }}>
                <span>▸ {v.title}</span>
                <span style={{ color: '#8A847E', fontWeight: 700 }}>{v.length}</span>
              </div>
            ))}
            <button onClick={() => setTab('resources')} style={{ marginTop: 6, background: 'none', border: 'none', color: TP_RED, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', padding: 0 }}>
              Open Resources tab →
            </button>
          </div>
        </div>
      </Card>

      <UpcomingCalendar role="tenor" />
      </>)}
    </div>
  )
}
