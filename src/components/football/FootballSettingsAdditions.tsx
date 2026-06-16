'use client'

// Men's Pro — Settings extra sections (mirrors WomensSettingsAdditions):
//   1. Compliance Summary — read-only PSR / Game Standards / Club Licensing
//      status tiles with sidebar cross-links.
//   2. Privacy & Welfare Visibility — who-sees-what matrix across medical,
//      mental-health and concussion records, plus demo GDPR controls.
//   3. Roles & Permissions — read-only display of each portal role's sidebar
//      scope. Templates are code-defined; "Edit — Demo" is disabled.
// Blue accent. Demo only — no real data writes.

import { useState } from 'react'
import { ShieldCheck, ScrollText, Building2, Lock, Users2, Download, Trash2, X, ArrowRight } from 'lucide-react'

type Rag = 'red' | 'amber' | 'green'

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', borderSoft: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  accent: '#60A5FA', accentDim: 'rgba(0,61,165,0.18)',
  good: '#22C55E', goodDim: 'rgba(34,197,94,0.15)', warn: '#F59E0B', warnDim: 'rgba(245,158,11,0.12)', bad: '#EF4444',
}

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : C.good
const ragDim   = (r: Rag) => r === 'red' ? 'rgba(239,68,68,0.15)' : r === 'amber' ? C.warnDim : C.goodDim
const ragLabel = (r: Rag) => r === 'red' ? 'BELOW STANDARD' : r === 'amber' ? 'PARTIAL' : 'COMPLIANT'

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>{children}</div>
)

interface RoleEntry { label: string; icon: string; sidebar: 'all' | string[] }
interface Props {
  onNavigate: (sectionId: string) => void
  roleConfig: Record<string, RoleEntry>
}

export default function FootballSettingsAdditions({ onNavigate, roleConfig }: Props) {
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purgeAck, setPurgeAck] = useState(false)
  const [exportTip, setExportTip] = useState(false)

  const summaryTiles: Array<{ key: string; label: string; status: { label: string; rag: Rag; sub?: string }; nav: string; icon: typeof ShieldCheck }> = [
    { key: 'psr',            label: 'PSR Compliance',  status: { label: 'SAFE', rag: 'green', sub: '£1.5m headroom · within 3-yr cycle' },        nav: 'psr-scr-modeller', icon: ShieldCheck },
    { key: 'game-standards', label: 'Game Standards',  status: { label: 'On track', rag: 'amber', sub: '4 of 5 standards compliant' },           nav: 'game-standards',   icon: ScrollText  },
    { key: 'licensing',      label: 'Club Licensing',  status: { label: 'PROVISIONAL', rag: 'amber', sub: '4 of 6 categories green · 2 amber' },  nav: 'club-licensing',   icon: Building2   },
  ]

  const visibilityMatrix = [
    { role: 'Player',              sees: 'All of his own clinical and contractual records. Grants / revokes access at any time.' },
    { role: 'Club Doctor',         sees: 'Full clinical detail — injury, concussion (GRTP), medication and screening outcomes.' },
    { role: 'Welfare Lead',        sees: 'Mental-health referral status and welfare flags. No detailed clinical notes.' },
    { role: 'Chairman / CEO',      sees: 'Aggregated status only — availability, RTP stage and contractual compliance flag.' },
    { role: 'Manager',             sees: 'Availability status only — fit / in RTP / unavailable for selection.' },
    { role: 'Wider staff',         sees: 'Nothing without explicit player consent.' },
  ]

  const sidebarLabel = (s: 'all' | string[]) => s === 'all' ? 'All sidebar sections' : `${s.length} sections`

  return (
    <>
      {/* 1. Compliance Summary */}
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

      {/* 2. Privacy & Welfare Visibility */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
            <Lock size={18} style={{ color: C.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Privacy &amp; Welfare Visibility</p>
            <p className="text-[11px]" style={{ color: C.text4 }}>Who sees what across medical, mental-health and concussion records — auditable at a glance.</p>
          </div>
        </div>

        {/* Confidentiality snapshot */}
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}55` }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold" style={{ color: '#BFDBFE' }}>Clinical confidentiality</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#BFDBFE' }}>
                Mental-health and medical detail is role-gated to the Club Doctor and medical staff. Welfare Lead sees referral status only; coaching staff see availability only.
              </p>
            </div>
            <button
              onClick={() => onNavigate('mental-health')}
              className="text-[10px] px-2.5 py-1 rounded font-semibold whitespace-nowrap"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#BFDBFE', border: `1px solid ${C.accent}55` }}
            >
              Open Mental Health →
            </button>
          </div>
        </div>

        {/* Visibility matrix */}
        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.text4 }}>Medical &amp; welfare records — visibility scope</p>
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
                style={{ backgroundColor: C.accentDim, color: '#93C5FD', border: `1px solid ${C.accent}55` }}
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

      {/* 3. Roles & Permissions */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
            <Users2 size={18} style={{ color: C.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Roles &amp; Permissions</p>
            <p className="text-[11px]" style={{ color: C.text4 }}>Read-only — current sidebar scope for each Football portal role.</p>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.panelAlt, borderBottom: `1px solid ${C.border}` }}>
                <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Role</th>
                <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Sidebar scope</th>
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

      {/* Purge confirm dialog — demo stub */}
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
                  Purge requests for welfare and medical records require dual sign-off (Welfare Lead + Club Doctor) and a confirmed identity check with the player.
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
                    style={{ backgroundColor: C.accentDim, color: '#93C5FD', border: `1px solid ${C.accent}55` }}
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
                    style={{ backgroundColor: C.accentDim, color: '#93C5FD', border: `1px solid ${C.accent}55` }}
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
