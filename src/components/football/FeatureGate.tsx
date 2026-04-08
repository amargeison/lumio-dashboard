'use client'

import type { ReactNode } from 'react'
import { hasFeature, getUpgradeTarget, getTierDisplayName, getTierPrice, getTierColour, type ClubTier } from '@/lib/feature-gates'

interface FeatureGateProps {
  featureKey: string
  clubTier: ClubTier | null | undefined
  children: ReactNode
  fallback?: ReactNode
  featureName?: string
  onUpgradeClick?: (featureKey: string) => void
}

export function FeatureGate({ featureKey, clubTier, children, fallback, featureName, onUpgradeClick }: FeatureGateProps) {
  if (hasFeature(clubTier, featureKey)) return <>{children}</>
  if (fallback !== undefined) return <>{fallback}</>
  return (
    <UpgradePrompt
      featureKey={featureKey}
      featureName={featureName ?? featureKey}
      requiredTier={getUpgradeTarget(featureKey)}
      onUpgradeClick={onUpgradeClick}
    />
  )
}

interface UpgradePromptProps {
  featureKey: string
  featureName: string
  requiredTier: ClubTier
  compact?: boolean
  onUpgradeClick?: (featureKey: string) => void
}

export function UpgradePrompt({ featureKey, featureName, requiredTier, compact = false, onUpgradeClick }: UpgradePromptProps) {
  const tierName = getTierDisplayName(requiredTier)
  const price = getTierPrice(requiredTier)
  const color = getTierColour(requiredTier)

  if (compact) {
    return (
      <button
        onClick={() => onUpgradeClick?.(featureKey)}
        className="text-[10px] px-2 py-1 rounded-full font-semibold inline-flex items-center gap-1"
        style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
      >
        🔒 {tierName} · Upgrade
      </button>
    )
  }

  return (
    <div
      className="rounded-xl p-8 text-center relative overflow-hidden"
      style={{ backgroundColor: '#111318', border: `1px solid ${color}55` }}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="text-5xl mb-3">🔒</div>
        <h3 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{featureName}</h3>
        <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Available on the {tierName} plan</p>
        <div className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mb-3" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}>{tierName} Plan</div>
        <div className="text-xs mb-4" style={{ color: '#9CA3AF' }}>From <span className="font-bold" style={{ color }}>{price}</span></div>
        <button
          onClick={() => onUpgradeClick?.(featureKey)}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          Upgrade to {tierName} →
        </button>
        <div className="mt-3">
          <button
            onClick={() => onUpgradeClick?.(featureKey)}
            className="text-[10px] underline"
            style={{ color: '#9CA3AF' }}
          >
            View all plans
          </button>
        </div>
      </div>
    </div>
  )
}

interface TierBadgeProps {
  tier: ClubTier
  showPrice?: boolean
}

export function TierBadge({ tier, showPrice = false }: TierBadgeProps) {
  const color = getTierColour(tier)
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {getTierDisplayName(tier)}
      {showPrice && <span style={{ color: '#9CA3AF' }}>· {getTierPrice(tier)}</span>}
    </span>
  )
}
