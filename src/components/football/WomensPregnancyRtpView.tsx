'use client'

import {
  Baby, Calendar, FileCheck, Heart, ShieldCheck, Stethoscope, Users,
  ClipboardList, BookOpen,
} from 'lucide-react'

// Pregnancy & Return-to-Play — Women's portal.
//
// Replaces the inline MaternityTrackerView. Framed as a care pathway,
// not surveillance: pregnancy is treated as a phase of a player's career
// the club has a duty to support, not a risk to monitor. No per-player
// RAG / red-amber-green risk colouring anywhere — supportive palette only.
//
// References: WSL maternity policy (26-week full pay + statutory rights
// + dedicated RTP programme), and FIFA Regulations on the Status and
// Transfer of Players Article 18quater (effective 1 Jan 2021 — minimum
// 14 weeks paid maternity leave for all players globally, with at least
// 8 weeks after the birth; club must reintegrate the player on return).
//
// Pink theme. Demo data inline; 3 player pathway cards at different
// stages (antenatal / postpartum RTP / fully returned).

const C = {
  bg: '#0F172A',
  card: '#0D1017',
  cardAlt: '#111318',
  border: '#1F2937',
  borderSoft: '#1A2030',
  text: '#F9FAFB',
  textSec: '#9CA3AF',
  muted: '#6B7280',
  mutedStrong: '#94A3B8',
  primary: '#EC4899',
  accent: '#BE185D',
  pinkSoft: '#F472B6',
  teal: '#2DD4BF',
  blue: '#60A5FA',
  cream: '#FDE68A',
} as const

// ─── Pathway stages ─────────────────────────────────────────────────────────
type StageGroup = 'Antenatal' | 'Leave' | 'Postpartum'
type Stage = { num: number; group: StageGroup; label: string; detail: string }

const PATHWAY: Stage[] = [
  { num: 1,  group: 'Antenatal',  label: 'Notification & confirmation',  detail: 'Player notifies Welfare Lead. Discretion respected — first-trimester disclosure is player-led.' },
  { num: 2,  group: 'Antenatal',  label: 'Clinical handover',            detail: 'Club doctor liaises with player\'s obstetrician. Joint care plan signed.' },
  { num: 3,  group: 'Antenatal',  label: 'Adapted training — T1',        detail: 'Continued participation at player discretion. No contact, no maximal lifting.' },
  { num: 4,  group: 'Antenatal',  label: 'Adapted training — T2',        detail: 'Modified S&C, individualised programme, no high-impact drills.' },
  { num: 5,  group: 'Antenatal',  label: 'Cessation of contact training', detail: 'Typically late T2 / early T3. Squad sessions replaced with adapted programme.' },
  { num: 6,  group: 'Leave',      label: 'Maternity leave commences',    detail: 'WSL 26-week full pay engaged. FIFA Art. 18quater minimum 14 weeks (8 post-birth) protected.' },
  { num: 7,  group: 'Postpartum', label: 'Postpartum medical clearance', detail: '6–8 week GP check + club doctor sign-off. Player-led timing — no pressure.' },
  { num: 8,  group: 'Postpartum', label: 'Pelvic floor & MSK screening', detail: 'Specialist pelvic-health physio. MSK baseline reassessed. Findings shared with player only.' },
  { num: 9,  group: 'Postpartum', label: 'Graduated RTP',                detail: 'Non-contact → contact progression, individualised. Welfare review at each milestone.' },
  { num: 10, group: 'Postpartum', label: 'Match selection cleared',      detail: 'Player and club doctor confirm readiness. Player decides when to make herself available.' },
]

const STAGE_GROUP_COLOR: Record<StageGroup, string> = {
  Antenatal:  C.pinkSoft,
  Leave:      C.cream,
  Postpartum: C.teal,
}

// ─── Postpartum clinical checkpoints ────────────────────────────────────────
type Checkpoint = { icon: typeof Heart; title: string; window: string; detail: string }

const CHECKPOINTS: Checkpoint[] = [
  { icon: ShieldCheck, title: 'Pelvic floor assessment',     window: '6–10 weeks postpartum', detail: 'Specialist pelvic-health physio. Findings confidential to player; club doctor receives clearance status only.' },
  { icon: Stethoscope, title: 'Postpartum medical screening', window: '6–8 weeks postpartum',  detail: 'GP check + club doctor review. Standard postnatal health questionnaire, BP, recovery from delivery.' },
  { icon: ClipboardList, title: 'MSK / core re-assessment',  window: '8–12 weeks postpartum', detail: 'Posture, abdominal separation (diastasis), spinal alignment, single-leg control. Baselines re-set, not compared to pre-pregnancy.' },
  { icon: Heart,       title: 'Cardiorespiratory baseline',   window: '10–14 weeks postpartum', detail: 'Submaximal aerobic re-baseline. Used to set RTP loading, not as a fitness gate.' },
  { icon: Users,       title: 'Mental health check-in',       window: 'Ongoing — every 4 weeks', detail: 'Postnatal depression screening (EPDS). Player-led — declined responses logged as declined, never inferred.' },
]

// ─── Per-player pathway cards (3 demo players) ──────────────────────────────
type Pathway = {
  name: string
  position: string
  status: 'Antenatal' | 'On leave' | 'Postpartum RTP' | 'Returned'
  currentStage: number
  badge: string
  contract: string
  expectedNext: string
  notes: string[]
}

const PLAYERS: Pathway[] = [
  {
    name: 'Sophie Lawson',
    position: 'RB',
    status: 'Postpartum RTP',
    currentStage: 9,
    badge: 'Stage 9 — Graduated RTP, non-contact → contact',
    contract: 'Full WSL maternity package — 26 weeks at full pay (completed). Role protected. PFA support engaged.',
    expectedNext: 'Stage 10 medical clearance window opens 28 May 2026 — player-led.',
    notes: [
      'Returned to club facility 06 Mar 2026 (player-set date).',
      'Pelvic floor + MSK screenings cleared 24 Apr 2026.',
      'Currently 4 weeks into individualised non-contact programme.',
      'Welfare check-ins fortnightly; no selection pressure communicated.',
    ],
  },
  {
    name: 'Ava Mitchell',
    position: 'CM',
    status: 'Antenatal',
    currentStage: 4,
    badge: 'Stage 4 — Adapted training, second trimester',
    contract: 'WSL 26 weeks full pay confirmed for May 2026 leave start. FIFA Art. 18quater protections noted on file. FA notified.',
    expectedNext: 'Stage 5 — cessation of contact training scheduled w/c 18 May 2026.',
    notes: [
      'Notified Welfare Lead 12 Feb 2026; club doctor handover complete.',
      'Joint care plan signed with obstetrician 02 Mar 2026.',
      'Adapted S&C programme in place; player participating at her discretion.',
      'Childcare allowance (club-specific augmentation) discussed and accepted.',
    ],
  },
  {
    name: 'Carla Porter',
    position: 'ST',
    status: 'Returned',
    currentStage: 10,
    badge: 'Stage 10 — Returned to full match selection',
    contract: 'Previous-cycle maternity package completed 2024/25. No outstanding contractual items.',
    expectedNext: '6-month post-return welfare check 14 Aug 2026 (standard).',
    notes: [
      'Postpartum RTP completed 22 Sep 2025.',
      'First competitive minutes 28 Sep 2025; first start 19 Oct 2025.',
      'No reported issues at 3-month and 6-month welfare check-ins.',
      'Player available for full WSL 2 and cup selection.',
    ],
  },
]

const statusColor = (s: Pathway['status']): string => (
  s === 'Antenatal'      ? C.pinkSoft :
  s === 'On leave'       ? C.cream :
  s === 'Postpartum RTP' ? C.teal :
                           C.blue
)

// ─── Card primitive ─────────────────────────────────────────────────────────
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl p-5 ${className ?? ''}`}
    style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
  >
    {children}
  </div>
)

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: typeof Heart; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.primary}1A` }}>
      <Icon size={18} style={{ color: C.primary }} />
    </div>
    <div>
      <h3 className="text-sm font-bold" style={{ color: C.text }}>{title}</h3>
      {subtitle && <p className="text-[11px]" style={{ color: C.muted }}>{subtitle}</p>}
    </div>
  </div>
)

// ─── Main view ──────────────────────────────────────────────────────────────
export default function WomensPregnancyRtpView() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.primary}1A` }}>
          <Baby size={20} style={{ color: C.primary }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Pregnancy &amp; Return-to-Play</h2>
          <p className="text-xs" style={{ color: C.muted }}>Pregnancy pathway · postpartum return-to-play · contractual protections</p>
        </div>
      </div>

      {/* Framing / scope banner */}
      <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ backgroundColor: `${C.primary}14`, border: `1px solid ${C.primary}40`, color: '#FBCFE8' }}>
        <strong style={{ color: '#F9A8D4' }}>How this section is used.</strong> Pregnancy is treated here as a phase of a player&apos;s career
        the club has a duty to support — not a risk to monitor. All clinical detail
        remains with the player and club doctor; this dashboard surfaces only what
        the Welfare Lead needs to administer policy obligations and protect contract terms.
        Player-led at every stage.
      </div>

      {/* Policy callout — WSL + FIFA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={ShieldCheck} title="WSL Policy" subtitle="Domestic minimum standard" />
          <ul className="space-y-2 text-xs" style={{ color: C.textSec }}>
            <li>• <strong style={{ color: C.text }}>26 weeks full pay</strong> during maternity leave.</li>
            <li>• Statutory rights protected — role on return guaranteed.</li>
            <li>• Dedicated, individualised return-to-play programme.</li>
            <li>• No selection pressure during recovery.</li>
            <li>• PFA support offered and accessible at every stage.</li>
          </ul>
        </Card>
        <Card>
          <SectionTitle icon={BookOpen} title="FIFA Art. 18quater" subtitle="International minimum (effective 1 Jan 2021)" />
          <ul className="space-y-2 text-xs" style={{ color: C.textSec }}>
            <li>• <strong style={{ color: C.text }}>Minimum 14 weeks paid maternity leave</strong> globally — at least 8 weeks after the birth.</li>
            <li>• Club must reintegrate the player on return.</li>
            <li>• Contract cannot be unilaterally terminated due to pregnancy.</li>
            <li>• Adoption and shared parental leave covered under equivalent provisions.</li>
            <li>• Applies to all clubs affiliated to FIFA — not just the WSL.</li>
          </ul>
        </Card>
      </div>

      {/* Pathway — 10 stages */}
      <Card>
        <SectionTitle icon={Calendar} title="Pregnancy &amp; Postpartum Pathway" subtitle="10 stages — antenatal · leave · postpartum" />
        <div className="space-y-2">
          {PATHWAY.map(s => (
            <div
              key={s.num}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.borderSoft}` }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 text-[11px] font-bold"
                style={{ backgroundColor: `${STAGE_GROUP_COLOR[s.group]}1F`, color: STAGE_GROUP_COLOR[s.group], border: `1px solid ${STAGE_GROUP_COLOR[s.group]}40` }}
              >
                {s.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{s.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${STAGE_GROUP_COLOR[s.group]}1A`, color: STAGE_GROUP_COLOR[s.group] }}>
                    {s.group}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: C.mutedStrong }}>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Postpartum clinical checkpoints */}
      <Card>
        <SectionTitle icon={Stethoscope} title="Postpartum Clinical Checkpoints" subtitle="Sequenced supports — player-led timing" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CHECKPOINTS.map(cp => {
            const Icon = cp.icon
            return (
              <div key={cp.title} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.borderSoft}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `${C.teal}1A` }}>
                    <Icon size={14} style={{ color: C.teal }} />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{cp.title}</div>
                </div>
                <div className="text-[10px] font-medium mb-1" style={{ color: C.teal }}>{cp.window}</div>
                <p className="text-[11px]" style={{ color: C.mutedStrong }}>{cp.detail}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Per-player pathway cards */}
      <div>
        <SectionTitle icon={Users} title="Player Pathways" subtitle="Three active records · supportive view" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PLAYERS.map(p => {
            const colour = statusColor(p.status)
            const stagePct = Math.min(100, Math.round((p.currentStage / PATHWAY.length) * 100))
            return (
              <div
                key={p.name}
                className="rounded-xl p-5"
                style={{ backgroundColor: C.card, border: `1px solid ${colour}40`, boxShadow: `0 0 0 1px ${colour}10` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-bold" style={{ color: C.text }}>{p.name}</div>
                    <div className="text-[11px]" style={{ color: C.muted }}>{p.position}</div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-medium"
                    style={{ backgroundColor: `${colour}1A`, color: colour, border: `1px solid ${colour}40` }}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] mb-3" style={{ color: C.mutedStrong }}>{p.badge}</div>

                {/* Stage progress bar — informational, not a gate */}
                <div className="mb-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.borderSoft }}>
                    <div className="h-full rounded-full" style={{ width: `${stagePct}%`, backgroundColor: colour }} />
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: C.muted }}>
                    Stage {p.currentStage} of {PATHWAY.length}
                  </div>
                </div>

                <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Contract</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: C.textSec }}>{p.contract}</div>
                </div>

                <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Next milestone</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: C.textSec }}>{p.expectedNext}</div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Recent notes</div>
                  <ul className="space-y-1">
                    {p.notes.map((n, i) => (
                      <li key={i} className="text-[11px]" style={{ color: C.mutedStrong }}>· {n}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contract & policy visibility */}
      <Card>
        <SectionTitle icon={FileCheck} title="Contract &amp; Policy Visibility" subtitle="What each role sees · what stays with the player" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { who: 'Player',            sees: 'All of her own clinical and contractual records. Can grant or revoke access at any time.' },
            { who: 'Club Doctor',        sees: 'Clinical clearance status only — pelvic-floor, MSK, postpartum screening outcomes (pass / partial / pending).' },
            { who: 'Welfare Lead',       sees: 'Pathway stage, leave dates, contract obligations status, PFA referral status. No clinical detail.' },
            { who: 'Club Director / CEO', sees: 'Aggregated status only — leave start, expected return, contractual compliance flag.' },
            { who: 'Head Coach',         sees: 'Availability status only — on leave / in RTP / available for selection.' },
            { who: 'Wider staff',         sees: 'Nothing without explicit player consent.' },
          ].map(row => (
            <div key={row.who} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.borderSoft}` }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: C.text }}>{row.who}</div>
              <div className="text-[11px]" style={{ color: C.mutedStrong }}>{row.sees}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[10px]" style={{ color: C.muted }}>
          GDPR scope: clinical data held under separate consent from operational status. Records purgable on request once contractual obligations are discharged.
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[10px]" style={{ color: C.muted }}>
          🔒 This section is visible to Welfare Lead, Club Doctor, and Club Director only.
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: `${C.primary}1F`, color: C.pinkSoft, border: `1px solid ${C.primary}40` }}
          >
            PFA referral workflow →
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: C.cardAlt, color: C.textSec, border: `1px solid ${C.border}` }}
          >
            Childcare-allowance policy
          </button>
        </div>
      </div>
    </div>
  )
}
