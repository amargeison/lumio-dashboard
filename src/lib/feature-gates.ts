// ═══════════════════════════════════════════════════════════════════════════════
// Feature gate library — tier comparison + feature key lookup.
// Mirrors supabase/migrations/084_feature_tiers.sql seed.
// Pure functions, never throws.
// ═══════════════════════════════════════════════════════════════════════════════

export type ClubTier = 'starter' | 'professional' | 'elite' | 'enterprise'

export const TIER_RANK: Record<ClubTier, number> = {
  starter: 0,
  professional: 1,
  elite: 2,
  enterprise: 3,
}

export const FEATURE_MAP: Record<string, ClubTier> = {
  // STARTER
  squad_management: 'starter',
  basic_fixtures: 'starter',
  basic_insights: 'starter',
  csv_gps_upload: 'starter',
  ai_press_conference: 'starter',
  match_reports: 'starter',
  fan_hub_basic: 'starter',
  club_import_wizard: 'starter',
  // PROFESSIONAL
  api_football_live: 'professional',
  ai_transfer_researcher: 'professional',
  ai_opposition_report: 'professional',
  ai_post_match: 'professional',
  transfer_pipeline: 'professional',
  training_planner: 'professional',
  fan_hub_advanced: 'professional',
  board_suite: 'professional',
  pdf_export: 'professional',
  white_label: 'professional',
  // ELITE
  gps_hardware_catapult: 'elite',
  gps_hardware_statsports: 'elite',
  opta_integration: 'elite',
  statsbomb_integration: 'elite',
  wyscout_integration: 'elite',
  club_comparison: 'elite',
  advanced_ai_scouting: 'elite',
  custom_reporting: 'elite',
  // ENTERPRISE
  multi_club: 'enterprise',
  api_access: 'enterprise',
  custom_integrations: 'enterprise',
  dedicated_support: 'enterprise',
  data_warehouse: 'enterprise',
}

export interface TierInfo {
  tier: ClubTier
  tierExpires: string | null
  trialEnds: string | null
  isTrialing: boolean
  daysUntilExpiry: number | null
}

export function hasFeature(clubTier: ClubTier | null | undefined, featureKey: string): boolean {
  if (!clubTier) return true // fail open
  const required = FEATURE_MAP[featureKey]
  if (!required) return true // unknown key → fail open
  return TIER_RANK[clubTier] >= TIER_RANK[required]
}

export function getTierInfo(dbClub: { tier?: ClubTier | null; tier_expires_at?: string | null; trial_ends_at?: string | null } | null | undefined): TierInfo {
  if (!dbClub) {
    return { tier: 'starter', tierExpires: null, trialEnds: null, isTrialing: false, daysUntilExpiry: null }
  }
  const tier = (dbClub.tier ?? 'starter') as ClubTier
  const tierExpires = dbClub.tier_expires_at ?? null
  const trialEnds = dbClub.trial_ends_at ?? null
  const isTrialing = !!trialEnds && new Date(trialEnds).getTime() > Date.now()
  let daysUntilExpiry: number | null = null
  const target = trialEnds ?? tierExpires
  if (target) {
    const diff = new Date(target).getTime() - Date.now()
    daysUntilExpiry = diff > 0 ? Math.ceil(diff / 86400000) : 0
  }
  return { tier, tierExpires, trialEnds, isTrialing, daysUntilExpiry }
}

export function getUpgradeTarget(featureKey: string): ClubTier {
  return FEATURE_MAP[featureKey] ?? 'professional'
}

export function getTierDisplayName(tier: ClubTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function getTierPrice(tier: ClubTier): string {
  switch (tier) {
    case 'starter': return 'Free'
    case 'professional': return '£199/mo'
    case 'elite': return '£499/mo'
    case 'enterprise': return 'Custom'
  }
}

export function getTierColour(tier: ClubTier): string {
  switch (tier) {
    case 'starter': return '#6B7280'
    case 'professional': return '#3B82F6'
    case 'elite': return '#8B5CF6'
    case 'enterprise': return '#F59E0B'
  }
}

export function featuresForTier(tier: ClubTier): string[] {
  return Object.entries(FEATURE_MAP).filter(([, t]) => TIER_RANK[t] <= TIER_RANK[tier]).map(([k]) => k)
}
