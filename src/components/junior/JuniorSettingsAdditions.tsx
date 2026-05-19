'use client'

import { useState } from 'react'
import {
  ShieldCheck, ScrollText, Award, Lock, Users2, ArrowRight, Download, Trash2, X,
} from 'lucide-react'

// Junior-portal-specific Settings augmentations.
//
// Rendered via SportsSettings' `extraSections` prop at the bottom of the
// standard Settings layout. Three green-themed blocks, modelled on
// WomensSettingsAdditions but recast for junior club semantics:
//   1. Compliance Summary — read-only status tiles with sidebar-nav links
//      to Safeguarding & Consent, FA Charter Standard (Junior), and the
//      Club & Team admin surface. Safeguarding remains the single source
//      of truth for consent + DBS state; these tiles are cross-links only.
//   2. Privacy & Imagery — read-only visibility matrix showing how
//      restricted children are auto-excluded across the portal, plus a
//      data-sharing-by-role matrix. GDPR export and demo purge controls
//      mirror the Women's pattern.
//   3. Roles & Permissions — read-only display of each JUNIOR_ROLE_CONFIG
//      entry (sidebar scope + hidden-tab scope) with disabled "Edit — Demo"
//      buttons. No localStorage role override, no mutation of the
//      role-template plumbing.

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
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  goodDim:    'rgba(34,197,94,0.15)',
  warn:       '#F59E0B',
  warnDim:    'rgba(245,158,11,0.15)',
  bad:        '#EF4444',
}

type Rag = 'green' | 'amber' | 'red'

interface RoleEntry {
  label: string
  icon: string
  accent: string
  sidebar: 'all' | string[]
  hiddenTabs: string[]
  message: string | null
}

interface Props {
  /** Navigate to a sidebar section. Used by the Compliance Summary cross-links. */
  onNavigate: (sectionId: string) => void
  /** Pass JUNIOR_ROLE_CONFIG verbatim — rendered read-only. */
  roleConfig: Record<string, RoleEntry>
  /** Demo data points (kept in sync with the linked modules manually). */
  safeguardingStatus?:  { label: string; rag: Rag; sub?: string }
  charterStatus?:       { label: string; rag: Rag; sub?: string }
  clubAdminStatus?:     { label: string; rag: Rag; sub?: string }
  consentCoverage?:     string
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
    {children}
  </div>
)

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : C.good
const ragDim   = (r: Rag) => r === 'red' ? 'rgba(239,68,68,0.15)' : r === 'amber' ? C.warnDim : C.goodDim
const ragLabel = (r: Rag) => r === 'red' ? 'BELOW STANDARD' : r === 'amber' ? 'PARTIAL' : 'COMPLIANT'

export default function JuniorSettingsAdditions({
  onNavigate,
  roleConfig,
  safeguardingStatus = { label: 'CURRENT',    rag: 'green', sub: '5/6 DBS current · 1 restricted child (imagery excluded)' },
  charterStatus      = { label: 'ACHIEVED',   rag: 'green', sub: '6 of 8 criteria green · 2 amber (re-accreditation evidence pack in build)' },
  clubAdminStatus    = { label: 'NORMAL',     rag: 'green', sub: 'Whole Game System sync healthy · GDPR-compliant comms in place' },
  consentCoverage    = '4 of 5',
}: Props) {
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purgeAck, setPurgeAck] = useState(false)
  const [exportTip, setExportTip] = useState(false)

  const summaryTiles: Array<{ key: string; label: string; status: { label: string; rag: Rag; sub?: string }; nav: string; icon: typeof ShieldCheck }> = [
    { key: 'safeguarding', label: 'Safeguarding & Consent', status: safeguardingStatus, nav: 'safeguarding', icon: ShieldCheck },
    { key: 'charter',      label: 'FA Charter (Junior)',     status: charterStatus,      nav: 'safeguarding', icon: Award      },
    { key: 'club_team',    label: 'Club & Team admin',       status: clubAdminStatus,    nav: 'club_team',    icon: ScrollText },
  ]

  // Junior-specific imagery visibility matrix. The restricted-flag rule
  // is the headline behaviour — a child with an active safeguarding
  // restriction is automatically excluded from all imagery, video and
  // publication surfaces.
  const imageryMatrix = [
    { surface: 'Match highlights & social posts',     who: 'All restricted children excluded automatically. Names never appear in batch parent comms.' },
    { surface: 'Match Video (in-portal)',             who: 'Restricted children blurred at the gate. Visible only to Welfare Officer + (where applicable) parent / guardian.' },
    { surface: 'Programme & matchday printed media',  who: 'Restricted children omitted from squad lists used for printed programme.' },
    { surface: 'Coach Toolkit (internal player cards)', who: 'Restricted children still appear to in-club staff (squad management requires it), with a Restricted badge.' },
    { surface: 'Parent App / Match Recap',            who: 'Parent / guardian sees only their own child. Other children are never named.' },
  ]

  // Data-sharing scope per role — separate from the imagery rule.
  const dataSharingMatrix = [
    { role: 'Welfare Officer',     sees: 'All consent records, DBS register, incident log, FA Charter evidence pack.' },
    { role: 'Volunteer Chair',     sees: 'Full club-wide safeguarding dashboard. Same scope as Welfare Officer for accountability.' },
    { role: 'Team Manager',        sees: 'Squad + consent flags for own team. No DBS register, no club-wide incident log.' },
    { role: 'Lead / Volunteer Coach', sees: 'Squad + per-player restrictions affecting selection / training. No incident detail.' },
    { role: 'Parent / Guardian',   sees: 'Own child only. Photography / filming / data-sharing / transport / medical consent records.' },
    { role: 'Wider volunteers',    sees: 'Nothing identifying without explicit role assignment.' },
  ]

  const sidebarLabel = (s: 'all' | string[]) => s === 'all' ? 'All sidebar sections' : `${s.length} sections`

  return (
    <>
      {/* ── 1. Compliance Summary ────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
            <ShieldCheck size={18} style={{ color: C.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Compliance Summary</p>
            <p className="text-[11px]" style={{ color: C.text4 }}>Read-only snapshot — Safeguarding remains the source of truth for consent + DBS status.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {summaryTiles.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => onNavigate(t.nav)}
                className="text-left rounded-lg p-4 transition-colors"
                style={{ backgroundColor: C.panelAlt, border: `1px solid ${ragColor(t.status.rag)}55`, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#161A22' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.panelAlt }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: ragDim(t.status.rag) }}>
                      <Icon size={14} style={{ color: ragColor(t.status.rag) }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: C.text }}>{t.label}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: C.text3 }} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black" style={{ color: ragColor(t.status.rag) }}>{t.status.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide" style={{ backgroundColor: ragDim(t.status.rag), color: ragColor(t.status.rag) }}>{ragLabel(t.status.rag)}</span>
                </div>
                {t.status.sub && <p className="text-[11px]" style={{ color: C.text3 }}>{t.status.sub}</p>}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
          Settings does not edit safeguarding state. Use Safeguarding & Consent → DBS register / Consent records to action.
        </p>
      </Card>

      {/* ── 2. Privacy & Imagery ─────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
            <Lock size={18} style={{ color: C.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Privacy &amp; Imagery</p>
            <p className="text-[11px]" style={{ color: C.text4 }}>How restricted children are auto-excluded from imagery, video and publication.</p>
          </div>
        </div>

        {/* Consent coverage snapshot */}
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}55` }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold" style={{ color: C.good }}>Photography &amp; filming consent</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.text2 }}>
                {consentCoverage} children fully current · 1 child with a care-order restriction (imagery automatically excluded across the portal). Consent revocable by the parent / guardian at any time.
              </p>
            </div>
            <button
              onClick={() => onNavigate('safeguarding')}
              className="text-[10px] px-2.5 py-1 rounded font-semibold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: C.good, border: `1px solid ${C.accent}55` }}
            >
              Open Safeguarding →
            </button>
          </div>
        </div>

        {/* Imagery visibility matrix */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.text4 }}>Restricted-child imagery — automatic exclusion scope</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {imageryMatrix.map(row => (
              <div key={row.surface} className="rounded-lg p-3" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderSoft}` }}>
                <p className="text-[11px] font-semibold mb-1" style={{ color: C.text }}>{row.surface}</p>
                <p className="text-[11px]" style={{ color: C.text3 }}>{row.who}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data-sharing matrix */}
        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.text4 }}>Data-sharing scope by role</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dataSharingMatrix.map(row => (
              <div key={row.role} className="rounded-lg p-3" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderSoft}` }}>
                <p className="text-[11px] font-semibold mb-1" style={{ color: C.text }}>{row.role}</p>
                <p className="text-[11px]" style={{ color: C.text3 }}>{row.sees}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GDPR controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap mt-4 pt-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: C.text }}>GDPR data controls</p>
            <p className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
              Export a copy of all club-held junior records (consent, DBS, incident log, fixtures, parent comms). Purge requests must be confirmed in person by the Welfare Officer.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => { setExportTip(true); window.setTimeout(() => setExportTip(false), 2500) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                style={{ backgroundColor: C.accentDim, color: C.good, border: `1px solid ${C.accent}55` }}
              >
                <Download size={12} /> Export Data
              </button>
              {exportTip && (
                <div className="absolute right-0 top-full mt-1 text-[10px] px-2 py-1 rounded whitespace-nowrap" style={{ backgroundColor: C.panelAlt, color: C.text2, border: `1px solid ${C.border}` }}>
                  Demo: export bundle prepared (no file written).
                </div>
              )}
            </div>
            <button
              onClick={() => { setPurgeOpen(true); setPurgeAck(false) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: C.bad, border: `1px solid ${C.bad}55` }}
            >
              <Trash2 size={12} /> Request data purge
            </button>
          </div>
        </div>
      </Card>

      {/* ── 3. Roles & Permissions (read-only) ──────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
            <Users2 size={18} style={{ color: C.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Roles &amp; Permissions</p>
            <p className="text-[11px]" style={{ color: C.text4 }}>Read-only — current sidebar and tab scope for each junior portal role.</p>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.panelAlt, borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Role</th>
                <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Sidebar scope</th>
                <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Hidden tabs</th>
                <th className="text-right p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(roleConfig).map(([key, role]) => (
                <tr key={key} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{role.icon}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: C.text }}>{role.label}</div>
                        <div className="text-[10px] font-mono" style={{ color: C.text4 }}>{key}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-[11px]" style={{ color: C.text3 }}>
                    {sidebarLabel(role.sidebar)}
                    {Array.isArray(role.sidebar) && (
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: C.text4 }}>
                        {role.sidebar.slice(0, 4).join(', ')}{role.sidebar.length > 4 ? `, +${role.sidebar.length - 4} more` : ''}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-[11px]" style={{ color: C.text3 }}>
                    {role.hiddenTabs.length === 0
                      ? <span style={{ color: C.text4 }}>—</span>
                      : <span className="font-mono text-[10px]">{role.hiddenTabs.join(', ')}</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      disabled
                      className="text-[10px] px-2.5 py-1 rounded font-semibold cursor-not-allowed"
                      style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: C.text4, border: `1px solid ${C.borderSoft}` }}
                    >
                      Edit — Demo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
          Role templates are defined in code and not editable from the demo. Junior Player profile mode is age-gated and exposed through the Parent App, not the role switcher.
        </p>
      </Card>

      {/* ── Purge confirm dialog — demo stub, no API ────────────────────── */}
      {purgeOpen && (
        <>
          <div className="fixed inset-0 z-[200]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setPurgeOpen(false)} />
          <div
            className="fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
            style={{ width: 'min(480px, 92vw)', backgroundColor: C.panelAlt, border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
                  <Trash2 size={16} style={{ color: C.bad }} />
                </div>
                <h3 className="text-sm font-bold" style={{ color: C.text }}>Request data purge</h3>
              </div>
              <button onClick={() => setPurgeOpen(false)} aria-label="Close" style={{ color: C.text3 }}>
                <X size={16} />
              </button>
            </div>
            {!purgeAck ? (
              <>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.text2 }}>
                  Purge requests for junior records require dual sign-off (Welfare Officer + Volunteer Chair) and a confirmed identity check with the parent / guardian.
                </p>
                <div className="rounded-lg p-3 mb-4 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: C.warn, border: `1px solid ${C.warn}55` }}>
                  ⚠ Demo mode — this dialog will <strong>not</strong> queue a real purge. Use the live Lumio account workflow for actual purge requests.
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setPurgeOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: C.panel, color: C.text3, border: `1px solid ${C.border}` }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setPurgeAck(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: C.accentDim, color: C.good, border: `1px solid ${C.accent}55` }}
                  >
                    Acknowledge — close dialog
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs mb-4" style={{ color: C.text2 }}>
                  Acknowledged. No purge has been queued (demo).
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => { setPurgeOpen(false); setPurgeAck(false) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: C.accentDim, color: C.good, border: `1px solid ${C.accent}55` }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
