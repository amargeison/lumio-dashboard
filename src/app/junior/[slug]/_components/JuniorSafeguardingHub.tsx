'use client'

// Junior Football — Safeguarding & Consent Hub.
//
// The compliance flagship module: it gates imagery across the portal, so
// it ships first per the standing instruction. Surfaces:
//   - Per-child consent records (photography / filming / data-sharing /
//     match-day transport / medical), with one child carrying a restricted
//     care-order flag that automatically excludes them from imagery and
//     publication surfaces.
//   - DBS register (staff-side).
//   - FA Charter Standard (Junior) compliance scorecard.
//   - Incident log (staff-side).
//   - Welfare Officer dashboard summary (staff-side).
//
// Role scoping (enforced in this component, not just by sidebar hide):
//   - welfare_officer / chairman / team_manager / coach: full hub.
//   - parent_guardian:
//       * Only their own child's consent records (child-scoped).
//       * No DBS register.
//       * No incident log.
//       * No Welfare Officer dashboard.
//
// Mirrors the Women's PlayerWelfareHub structural pattern (Card +
// SectionHead + tabbed surface) but re-themed green and authored against
// junior consent semantics. All demo data is canned; the restricted-flag
// exclusion is demo behaviour for now (real RLS enforcement is Workstream
// B).

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

// ─── Theme tokens (junior green) ─────────────────────────────────────────────

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDeep: '#166534',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  goodDim:    'rgba(34,197,94,0.15)',
  warn:       '#F59E0B',
  warnDim:    'rgba(245,158,11,0.15)',
  bad:        '#EF4444',
  badDim:     'rgba(239,68,68,0.15)',
} as const

type Rag = 'green' | 'amber' | 'red'

const ragColor = (r: Rag) => r === 'red' ? T.bad : r === 'amber' ? T.warn : T.good
const ragDim   = (r: Rag) => r === 'red' ? T.badDim : r === 'amber' ? T.warnDim : T.goodDim

// ─── Demo data ───────────────────────────────────────────────────────────────

interface ChildConsentRecord {
  id: string
  name: string
  ageBand: string
  team: string
  parent: string
  consents: {
    photography:   'current' | 'expired' | 'declined' | 'restricted'
    filming:       'current' | 'expired' | 'declined' | 'restricted'
    dataSharing:   'current' | 'expired' | 'declined'
    matchTransport:'current' | 'expired' | 'declined'
    medical:       'current' | 'expired'
  }
  /**
   * Restricted = care-order or other safeguarding restriction in place.
   * Child name + likeness must NOT appear in published imagery, match
   * highlights, social media, or programme content. Demo behaviour for
   * now — real enforcement is RLS-layer (Workstream B).
   */
  restricted: boolean
  lastReviewed: string
}

interface DbsRecord {
  id: string
  name: string
  role: string
  status: 'current' | 'expiring_soon' | 'expired'
  expires: string
  certificateRef: string
}

interface IncidentRecord {
  id: string
  date: string
  team: string
  type: 'concern' | 'allegation' | 'first-aid' | 'safeguarding-referral'
  summary: string
  status: 'open' | 'in_review' | 'closed'
  raisedBy: string
}

const CHILD_CONSENTS: ChildConsentRecord[] = [
  {
    id: 'jack-carter',
    name: 'Jack Carter',
    ageBand: 'U11',
    team: 'U11 Lions',
    parent: 'Emma Carter',
    consents: {
      photography: 'current',
      filming: 'current',
      dataSharing: 'current',
      matchTransport: 'current',
      medical: 'current',
    },
    restricted: false,
    lastReviewed: '2026-04-02',
  },
  {
    id: 'amira-okafor',
    name: 'Amira Okafor',
    ageBand: 'U9',
    team: 'U9 Tigers',
    parent: 'Tunde Okafor',
    consents: {
      photography: 'current',
      filming: 'expired',
      dataSharing: 'current',
      matchTransport: 'current',
      medical: 'current',
    },
    restricted: false,
    lastReviewed: '2025-08-14',
  },
  {
    id: 'noah-baxter',
    name: 'Noah Baxter',
    ageBand: 'U14',
    team: 'U14 Eagles',
    parent: 'Lara Baxter (Guardian — Court Order in place)',
    consents: {
      photography: 'restricted',
      filming: 'restricted',
      dataSharing: 'declined',
      matchTransport: 'declined',
      medical: 'current',
    },
    restricted: true,
    lastReviewed: '2026-03-18',
  },
  {
    id: 'sophie-mahan',
    name: 'Sophie Mahan',
    ageBand: 'U13',
    team: 'U13 Falcons',
    parent: 'Reza Mahan',
    consents: {
      photography: 'current',
      filming: 'current',
      dataSharing: 'declined',
      matchTransport: 'current',
      medical: 'current',
    },
    restricted: false,
    lastReviewed: '2026-01-22',
  },
  {
    id: 'tom-pereira',
    name: 'Tom Pereira',
    ageBand: 'U7',
    team: 'U7 Cubs',
    parent: 'Beatriz Pereira',
    consents: {
      photography: 'current',
      filming: 'current',
      dataSharing: 'current',
      matchTransport: 'expired',
      medical: 'current',
    },
    restricted: false,
    lastReviewed: '2025-11-04',
  },
]

const DBS_REGISTER: DbsRecord[] = [
  { id: 'm-hutchings', name: 'Mark Hutchings',  role: 'Lead Coach (paid)',        status: 'current',        expires: '2027-02-18', certificateRef: 'DBS-001-23719' },
  { id: 'j-holroyd',   name: 'Jenna Holroyd',   role: 'Welfare Officer',          status: 'current',        expires: '2027-06-30', certificateRef: 'DBS-001-23811' },
  { id: 'p-rolfe',     name: 'Pat Rolfe',       role: 'U7 Cubs Coach (volunteer)',status: 'current',        expires: '2026-12-12', certificateRef: 'DBS-001-24006' },
  { id: 'a-singh',     name: 'Anil Singh',      role: 'U11 Lions Asst. Coach',    status: 'expiring_soon',  expires: '2026-07-08', certificateRef: 'DBS-001-24112' },
  { id: 'k-atherton',  name: 'Kim Atherton',    role: 'U14 Eagles Team Manager',  status: 'current',        expires: '2027-09-22', certificateRef: 'DBS-001-24201' },
  { id: 'k-amari',     name: 'Kofi Amari',      role: 'Casual matchday volunteer',status: 'expired',        expires: '2026-04-05', certificateRef: 'DBS-001-23644' },
]

const INCIDENTS: IncidentRecord[] = [
  { id: 'inc-001', date: '2026-04-21', team: 'U11 Lions',  type: 'first-aid',           summary: 'Minor head contact in training; HEADCASE protocol followed, parent contacted, returned to play after assessment.', status: 'closed', raisedBy: 'M. Hutchings' },
  { id: 'inc-002', date: '2026-05-03', team: 'U13 Falcons', type: 'concern',            summary: 'Parent reported sideline conduct of opposition supporter at away fixture. Logged with league; no player welfare impact.',         status: 'in_review', raisedBy: 'G. Yardley' },
  { id: 'inc-003', date: '2026-05-10', team: 'U14 Eagles',  type: 'safeguarding-referral', summary: 'Routine welfare referral for Noah Baxter — court-order liaison check-in confirmed all conditions in place. No action required.', status: 'closed', raisedBy: 'J. Holroyd' },
]

const CHARTER_CRITERIA: { label: string; status: Rag; note: string }[] = [
  { label: 'Welfare Officer in post + current DBS',          status: 'green', note: 'Jenna Holroyd · DBS valid to 2027-06-30' },
  { label: 'Every coach DBS-checked (current)',              status: 'amber', note: '5 of 6 current · 1 expired (K. Amari), 1 expiring within 90 days (A. Singh)' },
  { label: 'Coach education — minimum FA Level 1 / Intro',    status: 'green', note: '8 of 8 coaching staff at FA Intro or above' },
  { label: 'Annual safeguarding refresher',                  status: 'green', note: 'Last completed 2026-02-11; next due Feb 2027' },
  { label: 'Photography / filming consent on file per child', status: 'amber', note: '4 of 5 fully current · 1 expired (Amira filming), 1 restricted (Noah, by design)' },
  { label: 'Adopted FA Respect Codes (parent + player)',     status: 'green', note: 'Signed at registration; refresh due Aug 2026' },
  { label: 'First-aid trained matchday lead per team',       status: 'green', note: '8 of 8 teams covered' },
  { label: 'Incident reporting log maintained',              status: 'green', note: 'Log up to date · last entry 2026-05-10' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function consentBadge(status: ChildConsentRecord['consents']['photography']) {
  switch (status) {
    case 'current':    return { label: 'Current',    color: 'green' as Rag }
    case 'expired':    return { label: 'Expired',    color: 'amber' as Rag }
    case 'declined':   return { label: 'Declined',   color: 'red'   as Rag }
    case 'restricted': return { label: 'Restricted', color: 'red'   as Rag }
  }
}

function dbsBadge(status: DbsRecord['status']) {
  switch (status) {
    case 'current':       return { label: 'Current',       color: 'green' as Rag }
    case 'expiring_soon': return { label: 'Expiring soon', color: 'amber' as Rag }
    case 'expired':       return { label: 'Expired',       color: 'red'   as Rag }
  }
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function Pill({ label, color }: { label: string; color: Rag }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide"
      style={{ backgroundColor: ragDim(color), color: ragColor(color), border: `1px solid ${ragColor(color)}33` }}
    >
      {label}
    </span>
  )
}

function ConsentRow({ child, parentScope }: { child: ChildConsentRecord; parentScope: boolean }) {
  const fields: { key: keyof ChildConsentRecord['consents']; label: string }[] = [
    { key: 'photography',   label: 'Photography' },
    { key: 'filming',       label: 'Filming' },
    { key: 'dataSharing',   label: 'Data sharing' },
    { key: 'matchTransport',label: 'Match transport' },
    { key: 'medical',       label: 'Medical' },
  ]
  return (
    <div
      className="rounded-lg p-4 mb-3"
      style={{
        backgroundColor: child.restricted ? 'rgba(239,68,68,0.05)' : T.panelAlt,
        border: child.restricted ? `1px solid ${T.bad}55` : `1px solid ${T.borderSoft}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: T.text }}>{child.name}</p>
          <p className="text-[11px]" style={{ color: T.text3 }}>
            {child.ageBand} · {child.team} · Parent / Guardian: {child.parent}
          </p>
        </div>
        {child.restricted && (
          <span
            className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider"
            style={{ backgroundColor: T.badDim, color: T.bad, border: `1px solid ${T.bad}55` }}
            title="Care-order / safeguarding restriction in place. Imagery and publication automatically excluded."
          >
            🔒 Restricted
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {fields.map(f => {
          const status = child.consents[f.key]
          const b = consentBadge(status as ChildConsentRecord['consents']['photography'])
          return (
            <div key={f.key} className="rounded p-2" style={{ backgroundColor: T.panel, border: `1px solid ${T.borderSoft}` }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.text4 }}>{f.label}</p>
              <Pill label={b.label} color={b.color} />
            </div>
          )
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
        Last reviewed {child.lastReviewed}
        {child.restricted && parentScope === false && (
          <> · imagery excluded across portal · publication blocked at the gate</>
        )}
      </p>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
  /** Demo child for parent scoping. Provided by the page when known. */
  demoChild?: { name: string; ageBand: string; team: string }
}

type Tab = 'consents' | 'dbs' | 'charter' | 'incidents' | 'dashboard'

export default function JuniorSafeguardingHub({ session, demoChild }: Props) {
  // Parent / Guardian role: child-scoped only. Force the consents tab and
  // hide the rest. For everyone else: full hub, default to dashboard.
  const isParent = session.role === 'parent_guardian'
  const [tab, setTab] = useState<Tab>(isParent ? 'consents' : 'dashboard')

  // For the parent view: filter to their own child only. In demo mode
  // we use the canonical demo child (Jack Carter — see DEMO_CLUBS in
  // page.tsx) when present, else fall back to the first record. Real
  // RLS enforcement is Workstream B.
  const parentChild =
    isParent
      ? CHILD_CONSENTS.find(c => demoChild && c.name === demoChild.name) ?? CHILD_CONSENTS[0]
      : null

  const consentsToShow = isParent && parentChild ? [parentChild] : CHILD_CONSENTS

  const tabs: { id: Tab; label: string; icon: string }[] = isParent
    ? [
        { id: 'consents', label: "My child's consent", icon: '🛡️' },
      ]
    : [
        { id: 'dashboard', label: 'Welfare dashboard',  icon: '📊' },
        { id: 'consents',  label: 'Child consents',     icon: '🛡️' },
        { id: 'dbs',       label: 'DBS register',       icon: '🪪' },
        { id: 'charter',   label: 'FA Charter (Junior)',icon: '✅' },
        { id: 'incidents', label: 'Incident log',       icon: '📒' },
      ]

  const restrictedCount = CHILD_CONSENTS.filter(c => c.restricted).length
  const expiredConsentCount = CHILD_CONSENTS.reduce((n, c) => {
    return n + (Object.values(c.consents).filter(v => v === 'expired').length > 0 ? 1 : 0)
  }, 0)
  const dbsExpired = DBS_REGISTER.filter(d => d.status === 'expired').length
  const dbsExpiringSoon = DBS_REGISTER.filter(d => d.status === 'expiring_soon').length
  const openIncidents = INCIDENTS.filter(i => i.status !== 'closed').length

  return (
    <div className="space-y-4">
      {/* Header / hero strip */}
      <div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
              {isParent ? 'Safeguarding · Your child' : 'Safeguarding & Consent Hub'}
            </p>
            <h2 className="text-lg font-bold" style={{ color: T.text }}>
              {isParent
                ? `${parentChild?.name ?? 'Your child'}'s consent records`
                : 'Compliance flagship · gates imagery and publication across the portal'}
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
              {isParent
                ? "Review or update your child's photography, filming, data-sharing and transport consents. Changes take effect immediately across the club."
                : `${CHILD_CONSENTS.length} children on register · ${restrictedCount} with active restriction · ${dbsExpired} DBS expired · ${dbsExpiringSoon} expiring within 90d · ${openIncidents} open incidents.`}
            </p>
          </div>
          <div className="shrink-0 text-3xl" aria-hidden>🛡️</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: T.border }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold transition-all"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {/* Tab body */}
      {tab === 'dashboard' && !isParent && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>Children on register</p>
              <p className="text-2xl font-bold mt-1" style={{ color: T.text }}>{CHILD_CONSENTS.length}</p>
              <p className="text-[10px] mt-1" style={{ color: T.text3 }}>across all teams</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>Restricted (imagery excluded)</p>
              <p className="text-2xl font-bold mt-1" style={{ color: restrictedCount > 0 ? T.bad : T.good }}>{restrictedCount}</p>
              <p className="text-[10px] mt-1" style={{ color: T.text3 }}>
                {restrictedCount > 0 ? 'Automatic exclusion in place' : 'No active restrictions'}
              </p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>DBS to action</p>
              <p className="text-2xl font-bold mt-1" style={{ color: (dbsExpired + dbsExpiringSoon) > 0 ? T.warn : T.good }}>
                {dbsExpired + dbsExpiringSoon}
              </p>
              <p className="text-[10px] mt-1" style={{ color: T.text3 }}>{dbsExpired} expired · {dbsExpiringSoon} expiring soon</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>Open incidents</p>
              <p className="text-2xl font-bold mt-1" style={{ color: openIncidents > 0 ? T.warn : T.good }}>{openIncidents}</p>
              <p className="text-[10px] mt-1" style={{ color: T.text3 }}>in review or open</p>
            </Card>
          </div>

          <Card>
            <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Action queue (highest priority)</p>
            <ul className="space-y-2 text-xs">
              {dbsExpired > 0 && (
                <li className="flex items-start gap-2 pb-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <Pill label="Urgent" color="red" />
                  <span style={{ color: T.text2 }}>
                    DBS expired for K. Amari (casual matchday volunteer) — must not assist on matchday until renewed. Open the DBS register to action.
                  </span>
                </li>
              )}
              {dbsExpiringSoon > 0 && (
                <li className="flex items-start gap-2 pb-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <Pill label="Soon" color="amber" />
                  <span style={{ color: T.text2 }}>
                    DBS expires within 90 days for A. Singh (U11 Lions Asst.) — renewal pack issued, awaiting return.
                  </span>
                </li>
              )}
              {expiredConsentCount > 0 && (
                <li className="flex items-start gap-2 pb-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <Pill label="Chase" color="amber" />
                  <span style={{ color: T.text2 }}>
                    {expiredConsentCount} child consent record(s) with at least one expired field — chase notice queued in parent comms.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Pill label="Watch" color="amber" />
                <span style={{ color: T.text2 }}>
                  Charter Standard re-accreditation evidence pack — 6 of 8 criteria green, 2 amber. Cleared by end of season target.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      )}

      {tab === 'consents' && (
        <div>
          {isParent ? (
            <Card className="mb-3">
              <p className="text-[11px]" style={{ color: T.text3 }}>
                You can see your own child&apos;s consent records only. The club-wide
                DBS register, incident log and Welfare Officer dashboard are not
                visible from a parent / guardian login. To update a consent, contact
                the Welfare Officer ({DBS_REGISTER.find(d => d.role === 'Welfare Officer')?.name ?? 'the Welfare Officer'}).
              </p>
            </Card>
          ) : (
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-[11px]" style={{ color: T.text3 }}>
                {CHILD_CONSENTS.length} children · {restrictedCount} restricted (imagery excluded automatically)
              </p>
              <button
                type="button"
                className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
              >
                Send chase notices (demo)
              </button>
            </div>
          )}

          {consentsToShow.map(c => (
            <ConsentRow key={c.id} child={c} parentScope={isParent} />
          ))}
        </div>
      )}

      {tab === 'dbs' && !isParent && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>DBS register</p>
              <p className="text-[11px]" style={{ color: T.text3 }}>
                Enhanced DBS with child barred-list check. Every coach, team manager and welfare officer in scope.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              Issue renewal pack (demo)
            </button>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Name</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Role</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Status</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Expires</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {DBS_REGISTER.map(d => {
                  const b = dbsBadge(d.status)
                  return (
                    <tr key={d.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <td className="p-3 text-xs font-semibold" style={{ color: T.text }}>{d.name}</td>
                      <td className="p-3 text-[11px]" style={{ color: T.text2 }}>{d.role}</td>
                      <td className="p-3"><Pill label={b.label} color={b.color} /></td>
                      <td className="p-3 text-[11px] font-mono" style={{ color: T.text3 }}>{d.expires}</td>
                      <td className="p-3 text-[11px] font-mono" style={{ color: T.text4 }}>{d.certificateRef}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'charter' && !isParent && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>FA Charter Standard (Junior) — compliance scorecard</p>
              <p className="text-[11px]" style={{ color: T.text3 }}>
                Eight criteria from the FA Charter Standard development-club tier. Used as the
                Charter re-accreditation evidence pack.
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {CHARTER_CRITERIA.map(c => (
              <li
                key={c.label}
                className="rounded-lg p-3 flex items-start gap-3"
                style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}
              >
                <div className="shrink-0">
                  <Pill label={c.status === 'green' ? 'Met' : c.status === 'amber' ? 'Partial' : 'Below'} color={c.status} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: T.text }}>{c.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: T.text3 }}>{c.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'incidents' && !isParent && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>Incident log</p>
              <p className="text-[11px]" style={{ color: T.text3 }}>
                Concerns, allegations, safeguarding referrals and first-aid entries. All entries
                visible to Welfare Officer + Chair; club-wide audit trail.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              Log new entry (demo)
            </button>
          </div>
          <ul className="space-y-2">
            {INCIDENTS.map(i => {
              const statusColor: Rag = i.status === 'open' ? 'amber' : i.status === 'in_review' ? 'amber' : 'green'
              const typeBadge =
                i.type === 'safeguarding-referral' ? { label: 'Safeguarding', color: 'red' as Rag } :
                i.type === 'allegation'            ? { label: 'Allegation',    color: 'red' as Rag } :
                i.type === 'concern'               ? { label: 'Concern',       color: 'amber' as Rag } :
                                                     { label: 'First-aid',     color: 'green' as Rag }
              return (
                <li
                  key={i.id}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono" style={{ color: T.text4 }}>{i.date}</span>
                      <Pill label={typeBadge.label} color={typeBadge.color} />
                      <span className="text-[11px]" style={{ color: T.text3 }}>· {i.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill
                        label={i.status === 'open' ? 'Open' : i.status === 'in_review' ? 'In review' : 'Closed'}
                        color={statusColor}
                      />
                      <span className="text-[10px]" style={{ color: T.text4 }}>by {i.raisedBy}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: T.text2 }}>{i.summary}</p>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
