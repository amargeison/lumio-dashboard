'use client'

// JuniorCoachesTab — Club Profile sub-tab listing every coach + manager
// across the 9 age-band teams (U7 Cubs → U16 Wolves). Renders one
// SectionCard per age band containing 1–2 coach cards.
//
// Role-gated: parent_guardian role sees name + avatar + role + age band
// + FA qualification + binary DBS/First-aid pills + years at club only.
// Staff roles (chairman, coach, team_manager, welfare_officer, academy_lead)
// see everything including DBS/first-aid renewal dates + contact phone/email.
//
// Photos fall back to initials-based avatar circles (same pattern as
// JuniorAvatarDropdown). The `photo?` field on JuniorCoach is reserved
// for future asset wiring — no coach headshots exist in /public/ today.

import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import { JUNIOR_COACHES, JUNIOR_AGE_BANDS, type JuniorCoach } from '../_lib/junior-club-data'

const C = {
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
  accentLight:'#22C55E',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  teal:       '#14B8A6',
  tealDim:    'rgba(20,184,166,0.18)',
  greyDim:    'rgba(107,114,128,0.18)',
} as const

interface Props {
  session: SportsDemoSession
}

// 3-month window for "DBS renewal due" amber pill. Anchor date is the
// canonical Phase 2 demo date (24 May 2026). Anything renewing inside
// that window from anchor is flagged.
const ANCHOR = new Date('2026-05-24')
const WINDOW_MS = 1000 * 60 * 60 * 24 * 90

function parseRenewalDate(d: string): Date | null {
  const parsed = new Date(d)
  return isNaN(parsed.getTime()) ? null : parsed
}

function dbsDueSoon(renewalDate: string): boolean {
  const d = parseRenewalDate(renewalDate)
  if (!d) return false
  const diff = d.getTime() - ANCHOR.getTime()
  return diff <= WINDOW_MS && diff >= -WINDOW_MS  // also flag overdue within last 3 months
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function JuniorCoachesTab({ session }: Props) {
  const isParent = session.role === 'parent_guardian'

  return (
    <div className="space-y-4">
      {JUNIOR_AGE_BANDS.map(({ band, teamName }) => {
        const coaches = JUNIOR_COACHES.filter(c => c.ageBands.includes(band))
        const title = `${band} ${teamName}`
        return (
          <SectionCard key={band} title={title}>
            {coaches.length === 0 ? (
              <p className="text-xs italic" style={{ color: C.text3 }}>
                Coaching role open · contact Volunteer Coordinator
              </p>
            ) : (
              <div className={`grid gap-3 ${coaches.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {coaches.map(coach => (
                  <CoachCard key={coach.id} coach={coach} isParent={isParent} />
                ))}
              </div>
            )}
          </SectionCard>
        )
      })}

      {!isParent && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}
        >
          <p className="text-xs" style={{ color: C.text3 }}>
            🛡️ DBS renewal due dates and contact info are staff-visible.
            Parents see name, photo, role, qualification and binary status only.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Coach card ─────────────────────────────────────────────────────────────

function CoachCard({ coach, isParent }: { coach: JuniorCoach; isParent: boolean }) {
  const dbsAmber = !coach.dbsStatus.current || dbsDueSoon(coach.dbsStatus.renewalDate)

  return (
    <div
      className="p-3 rounded-lg flex items-start gap-3"
      style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderSoft}` }}
    >
      <Avatar name={coach.name} photo={coach.photo} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: C.text }}>{coach.name}</p>
          <RoleBadge role={coach.role} />
        </div>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <QualBadge qualification={coach.faQualification} />
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StatusPill
            kind={dbsAmber ? 'amber' : 'green'}
            label={dbsAmber ? 'DBS renewal due' : 'DBS current'}
          />
          <StatusPill
            kind={coach.firstAid.certified ? 'green' : 'grey'}
            label={coach.firstAid.certified ? 'First aid ✓' : 'First aid pending'}
          />
        </div>

        <p className="text-[11px] mt-2" style={{ color: C.text3 }}>
          {coach.yearsAtClub} {coach.yearsAtClub === 1 ? 'year' : 'years'} at club
        </p>

        {!isParent && (
          <>
            <p className="text-[10px] mt-1 font-mono" style={{ color: C.text4 }}>
              DBS renews {coach.dbsStatus.renewalDate}
              {coach.firstAid.certified && coach.firstAid.renewalDate
                ? ` · First aid renews ${coach.firstAid.renewalDate}`
                : ' · First aid pending'}
            </p>
            {(coach.contact.phone || coach.contact.email) && (
              <p className="text-[10px] mt-1 font-mono" style={{ color: C.text4 }}>
                {coach.contact.phone ?? ''}
                {coach.contact.phone && coach.contact.email ? ' · ' : ''}
                {coach.contact.email ?? ''}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Atoms ──────────────────────────────────────────────────────────────────

function Avatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className="w-12 h-12 rounded-full object-cover shrink-0" />
  }
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
      style={{ backgroundColor: C.accentDim, color: C.accentLight, border: `1px solid ${C.accent}55` }}
    >
      {initialsOf(name)}
    </div>
  )
}

function RoleBadge({ role }: { role: JuniorCoach['role'] }) {
  const styles: Record<JuniorCoach['role'], { bg: string; fg: string }> = {
    'Head Coach':       { bg: C.accentDim, fg: C.accentLight },
    'Assistant Coach':  { bg: C.greyDim,   fg: C.text3 },
    'Team Manager':     { bg: C.tealDim,   fg: C.teal },
  }
  const s = styles[role]
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {role}
    </span>
  )
}

function QualBadge({ qualification }: { qualification: JuniorCoach['faQualification'] }) {
  // FA Level 2 + FA Youth Award read as "earned senior cert" → accent.
  // Level 1 → muted accent. Volunteer / In progress → neutral.
  const isSenior = qualification === 'Level 2' || qualification === 'FA Youth Award'
  const isLevel1 = qualification === 'Level 1'
  const styles = isSenior
    ? { bg: C.accentDim,                   fg: C.accentLight }
    : isLevel1
    ? { bg: 'rgba(22,163,74,0.06)',        fg: C.accent }
    : { bg: C.greyDim,                     fg: C.text3 }
  const label = qualification === 'Level 1'      ? 'FA Level 1'
              : qualification === 'Level 2'      ? 'FA Level 2'
              : qualification === 'FA Youth Award' ? 'FA Youth Award'
              : qualification === 'In progress'  ? 'Cert in progress'
              :                                    'Volunteer'
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded font-semibold"
      style={{ backgroundColor: styles.bg, color: styles.fg }}
    >
      {label}
    </span>
  )
}

function StatusPill({ kind, label }: { kind: 'green' | 'amber' | 'grey'; label: string }) {
  const styles: Record<'green' | 'amber' | 'grey', { bg: string; fg: string }> = {
    green: { bg: 'rgba(34,197,94,0.14)',  fg: C.good },
    amber: { bg: 'rgba(245,158,11,0.18)', fg: C.warn },
    grey:  { bg: C.greyDim,               fg: C.text3 },
  }
  const s = styles[kind]
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {label}
    </span>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <p className="text-sm font-bold" style={{ color: C.text }}>{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
