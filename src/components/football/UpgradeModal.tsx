'use client'

import { useEffect, useRef } from 'react'
import { FEATURE_MAP, TIER_RANK, getTierDisplayName, getTierPrice, getTierColour, type ClubTier } from '@/lib/feature-gates'

interface Props {
  isOpen: boolean
  onClose: () => void
  clubTier: ClubTier
  highlightFeature?: string | null
}

const TIERS: ClubTier[] = ['starter', 'professional', 'elite', 'enterprise']

const TIER_TAGLINES: Record<ClubTier, string> = {
  starter: 'Perfect for getting started',
  professional: 'For ambitious clubs',
  elite: 'For data-driven clubs',
  enterprise: 'For multi-club operations',
}

// Pretty feature names — fallback to feature key
const FEATURE_NAMES: Record<string, string> = {
  squad_management: 'Squad Management',
  basic_fixtures: 'Fixtures & Results',
  basic_insights: 'Dashboard Insights',
  csv_gps_upload: 'CSV GPS Upload',
  ai_press_conference: 'AI Press Conference',
  match_reports: 'Match Reports',
  fan_hub_basic: 'Fan Hub (Basic)',
  club_import_wizard: 'Club Import Wizard',
  api_football_live: 'API-Football Live Data',
  ai_transfer_researcher: 'AI Transfer Researcher',
  ai_opposition_report: 'AI Opposition Report',
  ai_post_match: 'AI Post-Match Analysis',
  transfer_pipeline: 'Transfer Pipeline',
  training_planner: 'Training Planner',
  fan_hub_advanced: 'Fan Hub Advanced',
  board_suite: 'Board Suite',
  pdf_export: 'PDF Export',
  white_label: 'White-Label Branding',
  gps_hardware_johansports: 'Johan Sports',
  opta_integration: 'Lumio Data Pro',
  statsbomb_integration: 'Lumio Data',
  wyscout_integration: 'Lumio Scout',
  club_comparison: 'Club Comparison',
  advanced_ai_scouting: 'AI Scouting Network',
  custom_reporting: 'Custom Reporting',
  multi_club: 'Multi-Club Management',
  api_access: 'Public API Access',
  custom_integrations: 'Custom Integrations',
  dedicated_support: 'Dedicated Support',
  data_warehouse: 'Data Warehouse',
}

export default function UpgradeModal({ isOpen, onClose, clubTier, highlightFeature }: Props) {
  const highlightRef = useRef<HTMLTableRowElement | null>(null)

  useEffect(() => {
    if (isOpen && highlightFeature && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isOpen, highlightFeature])

  if (!isOpen) return null

  const allFeatures = Object.entries(FEATURE_MAP)
  const grouped: Record<ClubTier, [string, ClubTier][]> = {
    starter: [], professional: [], elite: [], enterprise: [],
  }
  allFeatures.forEach(([k, t]) => grouped[t].push([k, t]))
  const ordered = [...grouped.starter, ...grouped.professional, ...grouped.elite, ...grouped.enterprise]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.8)', padding: '40px 20px' }} onClick={onClose}>
      <div className="w-full max-w-6xl rounded-2xl" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="p-5 flex items-start justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#F9FAFB' }}>⚡ Upgrade Lumio Football</h2>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Unlock the full power of your club's data</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#9CA3AF' }}>×</button>
        </div>

        {/* TIER COLUMNS */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          {TIERS.map((t) => {
            const isCurrent = clubTier === t
            const color = getTierColour(t)
            return (
              <div key={t} className="rounded-xl p-4 relative" style={{ backgroundColor: '#111318', border: `1px solid ${isCurrent ? color : '#1F2937'}` }}>
                {t === 'professional' && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#3B82F6', color: '#fff' }}>★ MOST POPULAR</div>
                )}
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{getTierDisplayName(t)}</div>
                <div className="text-xl font-black mt-1" style={{ color: '#F9FAFB' }}>{getTierPrice(t)}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{TIER_TAGLINES[t]}</div>
                <button
                  disabled={isCurrent}
                  className="w-full text-xs mt-3 px-3 py-2 rounded-lg font-semibold"
                  style={{
                    backgroundColor: isCurrent ? '#1F2937' : color,
                    color: isCurrent ? '#9CA3AF' : '#fff',
                    cursor: isCurrent ? 'not-allowed' : 'pointer',
                    opacity: isCurrent ? 0.6 : 1,
                  }}
                >
                  {isCurrent ? 'Current Plan' : t === 'enterprise' ? 'Contact Sales' : `Upgrade to ${getTierDisplayName(t)}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* COMPARISON TABLE */}
        <div className="px-5 pb-5">
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1F2937' }}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0A0B10' }}>
                <th className="text-left p-3" style={{ color: '#9CA3AF' }}>Feature</th>
                {TIERS.map((t) => (
                  <th key={t} className="text-center p-3" style={{ color: getTierColour(t) }}>{getTierDisplayName(t)}</th>
                ))}
              </tr></thead>
              <tbody>
                {ordered.map(([key, minTier]) => {
                  const isHighlight = highlightFeature === key
                  return (
                    <tr
                      key={key}
                      ref={isHighlight ? highlightRef : null}
                      style={{
                        borderBottom: '1px solid #1F2937',
                        backgroundColor: isHighlight ? 'rgba(139,92,246,0.10)' : undefined,
                      }}
                    >
                      <td className="p-3" style={{ color: '#F9FAFB' }}>{FEATURE_NAMES[key] ?? key}</td>
                      {TIERS.map((t) => {
                        const has = TIER_RANK[t] >= TIER_RANK[minTier]
                        return (
                          <td key={t} className="p-3 text-center text-base">
                            {has ? <span style={{ color: '#22C55E' }}>✓</span> : <span style={{ color: '#374151' }}>🔒</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 pb-5 text-center">
          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>All plans include: 14-day free trial · No setup fees · Cancel anytime</p>
          <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>Questions? <a href="mailto:sales@lumio.football" className="underline">Talk to our team →</a></p>
        </div>
      </div>
    </div>
  )
}
