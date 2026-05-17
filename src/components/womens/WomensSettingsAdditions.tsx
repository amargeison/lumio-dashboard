'use client'

import { useState } from 'react'
import {
  ShieldCheck, ScrollText, Building2, Lock, Users2, ArrowRight, Download, Trash2, X,
} from 'lucide-react'

// Women's-portal-specific Settings augmentations.
//
// Rendered via SportsSettings' `extraSections` prop at the bottom of
// the standard Settings layout. Three pink-themed blocks:
//   1. Compliance Summary  — read-only status tiles with sidebar-nav
//      links to FSR Dashboard, Game Standards, Club Licensing. Club
//      Licensing remains the single source of truth; this is a
//      cross-link only.
//   2. Privacy & Welfare Visibility — read-only matrices for cycle
//      opt-in, pregnancy & RTP visibility scope, data-sharing scope
//      per role. Plus a functional GDPR export trigger and a demo
//      purge button that surfaces a confirm dialog only — NEVER fires
//      any real purge API.
//   3. Roles & Permissions — read-only display of each WOMENS_ROLE_
//      CONFIG entry (sidebar scope + hidden-tab scope), with disabled
//      "Edit — Demo" buttons. No localStorage role override, no
//      mutation of the role-template plumbing.

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#EC4899',
  accentDeep: '#BE185D',
  accentDim:  'rgba(236,72,153,0.12)',
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
  /** Pass WOMENS_ROLE_CONFIG verbatim — rendered read-only. */
  roleConfig: Record<string, RoleEntry>
  /** Demo data points (kept in sync with the linked modules manually). */
  cycleOptInRate?: string
  fsrStatus?: { label: string; rag: Rag; sub?: string }
  gameStandardsStatus?: { label: string; rag: Rag; sub?: string }
  clubLicensingStatus?: { label: string; rag: Rag; sub?: string }
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
    {children}
  </div>
)

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : C.good
const ragDim   = (r: Rag) => r === 'red' ? 'rgba(239,68,68,0.15)' : r === 'amber' ? C.warnDim : C.goodDim
const ragLabel = (r: Rag) => r === 'red' ? 'BELOW STANDARD' : r === 'amber' ? 'PARTIAL' : 'COMPLIANT'

export default function WomensSettingsAdditions({
  onNavigate,
  roleConfig,
  cycleOptInRate = '14 of 22',
  fsrStatus = { label: 'SAFE', rag: 'green', sub: '£380k headroom · 78% spend' },
  gameStandardsStatus = { label: 'On track', rag: 'amber', sub: '4 of 5 sub-recommendations compliant' },
  clubLicensingStatus = { label: 'PROVISIONAL', rag: 'amber', sub: '4 of 6 categories green · 2 amber' },
}: Props) {
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purgeAck, setPurgeAck] = useState(false)
  const [exportTip, setExportTip] = useState(false)

  const summaryTiles: Array<{ key: string; label: string; status: { label: string; rag: Rag; sub?: string }; nav: string; icon: typeof ShieldCheck }> = [
    { key: 'fsr',            label: 'FSR Compliance',  status: fsrStatus,           nav: 'fsr',            icon: ShieldCheck },
    { key: 'game-standards', label: 'Game Standards',   status: gameStandardsStatus, nav: 'game-standards', icon: ScrollText  },
    { key: 'licensing',      label: 'Club Licensing',   status: clubLicensingStatus, nav: 'licensing',      icon: Building2   },
  ]

  const visibilityMatrix = [
    { role: 'Player',               sees: 'All of her own clinical and contractual records. Grants / revokes access at any time.' },
    { role: 'Club Doctor',          sees: 'Clinical clearance status only — pelvic-floor, MSK, postpartum screening outcomes.' },
    { role: 'Welfare Lead',         sees: 'Pathway stage, leave dates, contract obligations, PFA referral status. No clinical detail.' },
    { role: 'Club Director / CEO',  sees: 'Aggregated status only — leave start, expected return, contractual compliance flag.' },
    { role: 'Head Coach',           sees: 'Availability status only — on leave / in RTP / available for selection.' },
    { role: 'Wider staff',          sees: 'Nothing without explicit player consent.' },
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
            <p className="text-[11px]" style={{ color: C.text4 }}>Read-only snapshot — Club Licensing remains the source of truth for licence status.</p>
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
          Settings does not edit licensing status. Use Club Licensing → Action Plan to track workstreams against amber criteria.
        </p>
      </Card>

      {/* ── 2. Privacy & Welfare Visibility ─────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
            <Lock size={18} style={{ color: C.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Privacy &amp; Welfare Visibility</p>
            <p className="text-[11px]" style={{ color: C.text4 }}>Who sees what across cycle, pregnancy and welfare records — auditable at a glance.</p>
          </div>
        </div>

        {/* Cycle opt-in snapshot */}
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}55` }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold" style={{ color: '#FBCFE8' }}>Cycle Tracking opt-in</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#FBCFE8' }}>
                {cycleOptInRate} players consented · cycle data role-gated to Player, Club Doctor, Welfare Lead. Consent revocable at any time via Lumio Cycle.
              </p>
            </div>
            <button
              onClick={() => onNavigate('cycle')}
              className="text-[10px] px-2.5 py-1 rounded font-semibold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#FBCFE8', border: `1px solid ${C.accent}55` }}
            >
              Open Cycle Tracking →
            </button>
          </div>
        </div>

        {/* Pregnancy & RTP visibility matrix (mirrors WomensPregnancyRtpView) */}
        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.text4 }}>Pregnancy &amp; Return-to-Play — visibility scope</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {visibilityMatrix.map(row => (
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
              Export a copy of all club-held welfare and operational records. Purge requests must be confirmed in person by the Welfare Lead.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => { setExportTip(true); window.setTimeout(() => setExportTip(false), 2500) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                style={{ backgroundColor: C.accentDim, color: '#F9A8D4', border: `1px solid ${C.accent}55` }}
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
            <p className="text-[11px]" style={{ color: C.text4 }}>Read-only — current sidebar and tab scope for each Women&apos;s portal role.</p>
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
          Role templates are defined in code and not editable from the demo. Sponsor view is enabled separately by the portal&apos;s isSponsor session flag.
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
                  Purge requests for welfare, medical and cycle records require dual sign-off (Welfare Lead + Club Doctor) and a confirmed identity check with the player.
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
                    style={{ backgroundColor: C.accentDim, color: '#F9A8D4', border: `1px solid ${C.accent}55` }}
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
                    style={{ backgroundColor: C.accentDim, color: '#F9A8D4', border: `1px solid ${C.accent}55` }}
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
