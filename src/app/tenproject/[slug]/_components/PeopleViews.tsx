'use client'

// HQ Coaches + TENORs tabs — mapped from the Lumio Tennis Coach "Coaches"
// module (stat tiles row, attention banner, filter chips, people cards),
// re-themed to Ten Project red/black light style. Cards open full profile
// views (PersonDetail); Add coach is live and appends to the roster.

import React, { useState } from 'react'
import { AlertTriangle, Phone, Mail, UserPlus, ShieldCheck } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { PersonDetailView, AddCoachModal } from './PersonDetail'
import {
  TP_RED, TP_DARK, TP_COACHES, TP_COACH_STATS_ROW, TP_COACH_ATTENTION,
  TP_TENORS, TP_TENOR_STATS_ROW, TP_VENUE_READINESS,
  COACH_DETAILS, TENOR_DETAILS,
  type TpCoach, type TpTenor, type TpPersonDetail,
} from '@/data/tenproject/demo-data'

const DBS_PILL: Record<string, { tone: 'green' | 'amber' | 'red' | 'grey'; label: string }> = {
  'valid': { tone: 'green', label: 'DBS VALID' },
  'due-soon': { tone: 'amber', label: 'DBS DUE SOON' },
  'expired': { tone: 'red', label: 'DBS EXPIRED' },
  'missing': { tone: 'red', label: 'DBS MISSING' },
  'pending': { tone: 'amber', label: 'DBS PENDING' },
  'n/a': { tone: 'grey', label: 'DBS N/A' },
}

// Fallback profile for coaches added live in the demo
function fallbackDetail(name: string): TpPersonDetail {
  return {
    email: `${name.split(' ')[0].toLowerCase()}@tenproject.org.uk`,
    phone: '07700 900000',
    availability: 'To be confirmed at onboarding',
    dbsNumber: '— onboarding in progress', dbsIssued: '—', dbsExpiry: '—',
    safeguardingDate: 'to be booked', firstAid: 'to be verified', insurance: 'to be verified',
    assignments: [],
    cal: [],
  }
}

function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('') }

function Avatar({ name, online }: { name: string; online?: boolean }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: TP_DARK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
        {initials(name)}
      </div>
      {online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid #fff' }} />}
    </div>
  )
}

function StatsRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      {items.map(s => (
        <Card key={s.label} style={{ padding: '13px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{s.label}</div>
          <div style={{ fontSize: 23, fontWeight: 900, color: TP_DARK, marginTop: 3 }}>{s.value}</div>
        </Card>
      ))}
    </div>
  )
}

// ─── COACHES ────────────────────────────────────────────────────────────────
export function CoachesTab() {
  const [filter, setFilter] = useState<'All' | TpCoach['role']>('All')
  const [roster, setRoster] = useState<TpCoach[]>(TP_COACHES)
  const [selected, setSelected] = useState<TpCoach | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const coaches = filter === 'All' ? roster : roster.filter(c => c.role === filter)

  if (selected) {
    return (
      <PersonDetailView
        person={selected}
        detail={COACH_DETAILS[selected.id] ?? fallbackDetail(selected.name)}
        kind="coach"
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -50, marginBottom: 4, position: 'relative', zIndex: 1 }}>
        <button onClick={() => setShowAdd(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <UserPlus size={14} /> Add coach
        </button>
      </div>

      <StatsRow items={TP_COACH_STATS_ROW} />

      <div style={{ background: '#FCF1DC', border: '1px solid #E8CD9A', borderRadius: 12, padding: '12px 15px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={16} style={{ color: '#9A6A0B', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: '#9A6A0B' }}>DBS & certification attention needed</div>
          <div style={{ fontSize: 12, color: '#6B5A2E', marginTop: 2 }}>{TP_COACH_ATTENTION}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {(['All', 'Lead', 'Coach', 'Assistant', 'Apprentice'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? TP_DARK : '#fff', color: filter === f ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 999, padding: '6px 14px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {coaches.map(c => {
          const d = COACH_DETAILS[c.id] ?? fallbackDetail(c.name)
          return (
            <Card key={c.id} style={{ padding: 16, cursor: 'pointer' }}>
              <div onClick={() => setSelected(c)}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <Avatar name={c.name} online={c.online} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}>{c.name} <Pill tone={c.role === 'Lead' ? 'red' : 'grey'}>{c.role.toUpperCase()}</Pill></div>
                    <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{c.qual}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={`tel:${d.phone.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()} aria-label="Call" style={{ background: '#F7F5F2', borderRadius: 8, padding: 7, color: TP_RED, display: 'inline-flex' }}><Phone size={14} /></a>
                    <a href={`mailto:${d.email}`} onClick={e => e.stopPropagation()} aria-label="Contact" style={{ background: '#F7F5F2', borderRadius: 8, padding: 7, color: TP_DARK, display: 'inline-flex' }}><Mail size={14} /></a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <Pill tone={DBS_PILL[c.dbs].tone}>{DBS_PILL[c.dbs].label}</Pill>
                  {c.specialisms.map(s => <Pill key={s} tone="grey">{s}</Pill>)}
                </div>
                <div style={{ fontSize: 11, color: '#6B6560', marginTop: 8 }}>
                  DBS {c.dbsNote} · First Aid {c.firstAid}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, borderTop: '1px solid #F0EBE5', paddingTop: 10, alignItems: 'center' }}>
                  {[
                    [c.sessionsWeek, 'THIS WEEK'],
                    [c.childrenCovered, 'CHILDREN'],
                  ].map(([v, l]) => (
                    <div key={l as string}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: TP_RED }}>{v}</div>
                      <div style={{ fontSize: 8.5, color: '#8A847E', fontWeight: 800, letterSpacing: 0.5 }}>{l}</div>
                    </div>
                  ))}
                  <div style={{ flex: 1, fontSize: 11, color: '#6B6560' }}>{c.schools}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: TP_RED, flexShrink: 0 }}>View →</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showAdd && <AddCoachModal onClose={() => setShowAdd(false)} onAdd={c => setRoster(prev => [...prev, c])} />}
    </div>
  )
}

// ─── TENORS ─────────────────────────────────────────────────────────────────
export function TenorsTab() {
  const [selected, setSelected] = useState<TpTenor | null>(null)

  if (selected) {
    return (
      <PersonDetailView
        person={{ name: selected.name, dbs: selected.dbs, sessionsCovered: selected.sessionsCovered, inducted: selected.inducted }}
        detail={TENOR_DETAILS[selected.id] ?? fallbackDetail(selected.name)}
        kind="tenor"
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -50, marginBottom: 4, position: 'relative', zIndex: 1 }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <UserPlus size={14} /> Invite TENOR
        </button>
      </div>

      <StatsRow items={TP_TENOR_STATS_ROW} />

      <Card>
        <SectionTitle sub="Minimum two inducted TENORs per venue for a session to run">
          <ShieldCheck size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Venue readiness
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {TP_VENUE_READINESS.map(v => (
            <div key={v.venue} style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{v.venue}</div>
                <Pill tone={v.ready ? 'green' : 'red'}>{v.ready ? 'READY' : 'AT RISK'}</Pill>
              </div>
              <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4 }}>{v.tenors} TENORs (min {v.min}){v.note ? ` — ${v.note}` : ''}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {TP_TENORS.map(t => {
          const d = TENOR_DETAILS[t.id] ?? fallbackDetail(t.name)
          return (
            <Card key={t.id} style={{ padding: 16, cursor: 'pointer' }}>
              <div onClick={() => setSelected(t)}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <Avatar name={t.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{t.venue} · since {t.since}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={`tel:${d.phone.replace(/\s/g, '')}`} onClick={e => e.stopPropagation()} aria-label="Call" style={{ background: '#F7F5F2', borderRadius: 8, padding: 7, color: TP_RED, display: 'inline-flex' }}><Phone size={14} /></a>
                    <a href={`mailto:${d.email}`} onClick={e => e.stopPropagation()} aria-label="Contact" style={{ background: '#F7F5F2', borderRadius: 8, padding: 7, color: TP_DARK, display: 'inline-flex' }}><Mail size={14} /></a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <Pill tone={t.inducted ? 'green' : 'amber'}>{t.inducted ? 'INDUCTED' : 'INDUCTION PENDING'}</Pill>
                  <Pill tone={DBS_PILL[t.dbs].tone}>{DBS_PILL[t.dbs].label}</Pill>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, borderTop: '1px solid #F0EBE5', paddingTop: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: TP_RED }}>{t.sessionsCovered}</div>
                    <div style={{ fontSize: 8.5, color: '#8A847E', fontWeight: 800, letterSpacing: 0.5 }}>SESSIONS COVERED</div>
                  </div>
                  {t.note && <div style={{ flex: 1, fontSize: 11, color: '#6B6560' }}>{t.note}</div>}
                  <div style={{ fontSize: 11, fontWeight: 900, color: TP_RED, flexShrink: 0, marginLeft: 'auto' }}>View →</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
