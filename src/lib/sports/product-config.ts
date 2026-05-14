/**
 * Product configuration for the four Lumio Sports team-sport products.
 *
 * Single source of truth for everything that varies across products:
 * the MODULES catalogue (with per-product tier states), compliance
 * variant, AI tone, pricing, badge colour. Per Path B spec section B4
 * (Product Mechanics), refined in Phase 4a.5.
 *
 * Scope: TEAM-SPORT products only (clubs with many users via
 * sports_memberships). Individual-athlete sports (darts/tennis/golf/
 * boxing) use src/lib/sports/features.ts — different problem.
 *
 * Phase 4a.5 changes vs Phase 4a:
 *  - New MODULES catalogue with per-product tier ('full' | 'lite' |
 *    'optional' | 'disabled'). Single source of truth for which
 *    modules each product surfaces and at what fidelity.
 *  - `enabled_modules` and `optional_modules` removed from
 *    ProductConfig — derived via getEnabledModules / getOptionalModules
 *    from MODULES.tiers instead.
 *  - 'strategy' removed from MODULE_IDS — it's a sub-tab of
 *    board_executive, not a top-level module.
 *  - New modules: tours_camps, staff_directory, junior_section.
 *  - youth_academy (elite pathway) is now mutually exclusive with
 *    junior_section (community youth ops): one or the other per
 *    product, never both.
 *
 * See docs/specs/path-b-rbac-architecture.md
 */

// ─── Product IDs ────────────────────────────────────────────────────────

/** All four Lumio Sports team-sport products. Matches the product_type
 *  enum in supabase/migrations/091_sports_clubs.sql. */
export const PRODUCT_IDS = [
  'lumio_pro',
  'lumio_club',
  'lumio_women',
  'lumio_grassroots',
] as const

export type ProductId = typeof PRODUCT_IDS[number]

// ─── Module IDs ─────────────────────────────────────────────────────────

/** All possible department / feature modules across all four products.
 *  Snake_case to match the SQL convention used in sports_memberships
 *  (primary_department / additional_departments columns).
 *
 *  Array order is the canonical default sidebar render order — individual
 *  portal sidebars may override this (e.g. Grassroots renders Settings
 *  at the bottom). Keep adjacency logical when adding new modules. */
export const MODULE_IDS = [
  // Generic departments (shared across the products that enable them)
  'overview',
  'insights',
  'board_executive',
  'football_operations',
  'cup_manager',
  'tours_camps',
  'performance_gps',
  'medical',
  'player_welfare',
  'recruitment_scouting',
  'youth_academy',
  'junior_section',
  'travel_logistics',
  'commercial_marketing',
  'fundraising',
  'ticketing_crm_fans',
  'media_comms',
  'facilities_grounds',
  'finance_hr_admin',
  'staff_directory',
  'community',
  'settings',
  // Compliance variants — one per product, label set on the module
  'psr_modeller',         // Lumio Pro
  'ground_grading_fsr',   // Lumio Club
  'wsl_handbook',         // Lumio Women
  'fa_charter',           // Lumio Grassroots
] as const

export type ModuleId = typeof MODULE_IDS[number]

/** Narrowed type for the four compliance variants. ComplianceId is a
 *  subset of ModuleId so the same value can appear as a product's
 *  compliance_module and as a regular MODULES entry. */
export type ComplianceId =
  | 'psr_modeller'
  | 'ground_grading_fsr'
  | 'wsl_handbook'
  | 'fa_charter'

// ─── Module tier + metadata ─────────────────────────────────────────────

/**
 * Per-product activation state for a module.
 *
 * - `full`     — on by default, full feature set.
 * - `lite`     — on by default, stripped-down variant (component reads
 *                the tier and conditionally renders).
 * - `optional` — off by default, offered as opt-in during onboarding.
 *                Per-club override stored elsewhere when enabled.
 * - `disabled` — not available to this product.
 */
export type ModuleTier = 'full' | 'lite' | 'optional' | 'disabled'

/** Static metadata for a module — label, description, per-product
 *  tiers. Labels and descriptions are one canonical string per module;
 *  variant rendering (e.g. "Board & Executive" surfacing as
 *  "Committee" for Grassroots) lives in the component layer. */
export type ModuleMeta = {
  readonly label: string
  readonly description: string
  readonly tiers: Readonly<Record<ProductId, ModuleTier>>
}

// ─── AI tone ────────────────────────────────────────────────────────────

export type AiTone = 'formal' | 'professional' | 'community' | 'volunteer'

// ─── ProductConfig type ─────────────────────────────────────────────────

/**
 * The full configuration for one Lumio Sports product.
 *
 * Module enablement is NOT stored here — it derives from
 * `MODULES[moduleId].tiers[productId]`. Use the helper functions
 * (`getEnabledModules`, `getOptionalModules`, `isModuleEnabled`)
 * in preference to indexing MODULES directly.
 *
 * - `base_price_gbp` is annual; `per_seat_price_gbp` is monthly.
 *   Two different time units — spec convention, documented here so
 *   call sites don't get it wrong.
 */
export type ProductConfig = {
  readonly id: ProductId
  readonly display_name: string
  readonly tier_label: string
  readonly compliance_module: ComplianceId
  readonly ai_tone: AiTone
  readonly default_seats: number
  /** Annual base price in GBP. */
  readonly base_price_gbp: number
  /** Monthly per-seat price in GBP, applied to seats beyond default_seats. */
  readonly per_seat_price_gbp: number
  /** Hex colour for the product badge in UI chrome. NOT a club's own
   *  brand colour — that lives on sports_clubs.brand_primary. */
  readonly badge_colour: string
}

// ─── The MODULES catalogue ──────────────────────────────────────────────

/**
 * Single source of truth for every module: label, description, and
 * per-product tier.
 *
 * Use the helper functions below in preference to indexing this
 * constant directly — they encode the rules (e.g. "enabled = full
 * or lite") consistently.
 */
export const MODULES: Readonly<Record<ModuleId, ModuleMeta>> = {
  overview: {
    label: 'Overview',
    description: 'Daily snapshot, headlines, today\'s matches and tasks',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  insights: {
    label: 'Insights',
    description: 'AI insights and analytics across club departments',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  board_executive: {
    label: 'Board & Executive',
    description: 'Board meetings, executive reports, and strategy planning',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  football_operations: {
    label: 'Football Operations',
    description: 'Squad, fixtures, training, matchday operations',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  cup_manager: {
    label: 'Cup Manager',
    description: 'Cup competitions, prize money modelling, TV income forecasting, ticketing surge management',
    // Grassroots 'lite' — basic cup fixture tracking only; prize money
    // and TV income modelling are not relevant at Sunday League scale.
    // Pattern matches tours_camps Grassroots tier.
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'lite' },
  },
  tours_camps: {
    label: 'Tours & Camps',
    description: 'Pre-season and mid-season camps, blocks, and commercial activation',
    // Grassroots 'lite' = pre-season planner only, no commercial
    // activation. Component reads the tier and renders the stripped-
    // down variant.
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'lite' },
  },
  performance_gps: {
    label: 'Performance & GPS',
    description: 'Performance data, GPS load, ACWR, training response',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'optional' },
  },
  medical: {
    label: 'Medical',
    description: 'Clinical injury management — physios, treatment, return-to-play protocols, injury records',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'disabled' },
  },
  player_welfare: {
    label: 'Player Welfare',
    description: 'Welfare command center — ACL risk monitoring, mental health, foreign player integration, women-specific welfare (cycle, maternity)',
    // Grassroots tier corrected to 'full' as part of the Phase 4a.6
    // medical_welfare split — welfare is community-relevant at all
    // tiers, only the clinical 'medical' module is disabled for
    // Grassroots (no physio infrastructure).
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  recruitment_scouting: {
    label: 'Recruitment & Scouting',
    description: 'Transfer pipeline, scouting reports, agent contacts',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'disabled' },
  },
  youth_academy: {
    label: 'Youth & Academy',
    description: 'Elite youth pathway and academy operations',
    // Phase 4a.5: youth_academy is the ELITE pathway (Pro/Club/Women).
    // Grassroots community youth ops live in the separate
    // junior_section module. The two modules are mutually exclusive
    // by product — never both enabled, never both disabled.
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'disabled' },
  },
  junior_section: {
    label: 'Junior Section',
    description: 'Grassroots youth football operation — separate from elite academy pathway',
    // Phase 4a.5: Grassroots-only counterpart to youth_academy. See
    // the youth_academy comment for the mutual-exclusion rule.
    tiers: { lumio_pro: 'disabled', lumio_club: 'disabled', lumio_women: 'disabled', lumio_grassroots: 'full' },
  },
  travel_logistics: {
    label: 'Travel & Logistics',
    description: 'Coach hire, hotels, away-day logistics',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  commercial_marketing: {
    label: 'Commercial & Marketing',
    description: 'Sponsorship, partnerships, brand activations',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  fundraising: {
    label: 'Fundraising',
    description: 'Event-based community revenue: 100 club, race nights, golf days, auctions, donation campaigns',
    // Distinct from commercial_marketing (B2B sponsorship) and
    // community (non-revenue programmes). Tier 'full' for all 4
    // products — fundraising is especially material at non-league /
    // grassroots scale.
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  ticketing_crm_fans: {
    label: 'Ticketing, CRM & Fans',
    description: 'Fan database, season tickets, matchday revenue',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'disabled' },
  },
  media_comms: {
    label: 'Media & Comms',
    description: 'Press, social media, media obligations',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  facilities_grounds: {
    label: 'Facilities & Grounds',
    description: 'Stadium, training ground, pitches, maintenance',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  finance_hr_admin: {
    label: 'Finance, HR & Admin',
    description: 'Budgets, payroll, contracts, HR records',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  staff_directory: {
    label: 'Staff Directory',
    description: 'People management — staff records, org chart, club info, player records',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  community: {
    label: 'Community',
    description: 'Foundation, community programmes, schools outreach',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  settings: {
    label: 'Settings',
    description: 'Club configuration and admin',
    tiers: { lumio_pro: 'full', lumio_club: 'full', lumio_women: 'full', lumio_grassroots: 'full' },
  },
  psr_modeller: {
    label: 'PSR Modeller',
    description: 'Profitability & Sustainability Rules compliance modelling',
    tiers: { lumio_pro: 'full', lumio_club: 'disabled', lumio_women: 'disabled', lumio_grassroots: 'disabled' },
  },
  ground_grading_fsr: {
    label: 'Ground Grading + FSR',
    description: 'Ground Grading + Financial Sustainability Regs compliance',
    tiers: { lumio_pro: 'disabled', lumio_club: 'full', lumio_women: 'disabled', lumio_grassroots: 'disabled' },
  },
  wsl_handbook: {
    label: 'WSL Handbook + Carney',
    description: 'WSL Handbook and Carney Review compliance',
    tiers: { lumio_pro: 'disabled', lumio_club: 'disabled', lumio_women: 'full', lumio_grassroots: 'disabled' },
  },
  fa_charter: {
    label: 'FA Charter',
    description: 'FA Charter Standard compliance',
    tiers: { lumio_pro: 'disabled', lumio_club: 'disabled', lumio_women: 'disabled', lumio_grassroots: 'full' },
  },
}

// ─── The 4-product configuration matrix ─────────────────────────────────

/**
 * The four Lumio Sports product configurations.
 *
 * Keyed by ProductId for direct lookup. Use the helper functions
 * below in preference to indexing this constant directly.
 */
export const PRODUCT_CONFIG: Record<ProductId, ProductConfig> = {
  lumio_pro: {
    id: 'lumio_pro',
    display_name: 'Lumio Pro',
    tier_label: 'Premier League / Championship',
    compliance_module: 'psr_modeller',
    ai_tone: 'formal',
    default_seats: 25,
    base_price_gbp: 18000,
    per_seat_price_gbp: 150,
    badge_colour: '#EF4444',
  },

  lumio_club: {
    id: 'lumio_club',
    display_name: 'Lumio Club',
    tier_label: 'League One/Two / National / Non-League',
    compliance_module: 'ground_grading_fsr',
    ai_tone: 'professional',
    default_seats: 8,
    base_price_gbp: 3000,
    per_seat_price_gbp: 40,
    badge_colour: '#14B8A6',
  },

  lumio_women: {
    id: 'lumio_women',
    display_name: 'Lumio Women',
    tier_label: 'WSL / WSL2 / Championship',
    compliance_module: 'wsl_handbook',
    // 'community' with implicit compliance-awareness (Women's compliance
    // surfaces independently via the wsl_handbook module — the AI tone
    // field is the voice register, not a compliance flag).
    ai_tone: 'community',
    default_seats: 12,
    base_price_gbp: 8000,
    per_seat_price_gbp: 80,
    // TODO: validate pink with women's contact; spec flags possible
    // change to purple (#7C3AED).
    badge_colour: '#EC4899',
  },

  lumio_grassroots: {
    id: 'lumio_grassroots',
    display_name: 'Lumio Grassroots',
    tier_label: 'Step 5+ / County / Lower-tier Women',
    compliance_module: 'fa_charter',
    ai_tone: 'volunteer',
    default_seats: 3,
    base_price_gbp: 0,
    per_seat_price_gbp: 15,
    badge_colour: '#10B981',
  },
} as const

// ─── Helper functions ───────────────────────────────────────────────────

/** Returns the full ProductConfig for a product. */
export function getProductConfig(product: ProductId): ProductConfig {
  return PRODUCT_CONFIG[product]
}

/** Returns the enabled modules (on by default — tier 'full' or 'lite')
 *  for a product, in canonical MODULE_IDS order. Does NOT include
 *  optional modules — for those use getOptionalModules. */
export function getEnabledModules(product: ProductId): readonly ModuleId[] {
  return MODULE_IDS.filter(id => {
    const tier = MODULES[id].tiers[product]
    return tier === 'full' || tier === 'lite'
  })
}

/** Returns the modules the onboarding wizard asks about for a product
 *  (tier 'optional'), in canonical MODULE_IDS order. Currently only
 *  Grassroots has any — Pro / Club / Women return []. */
export function getOptionalModules(product: ProductId): readonly ModuleId[] {
  return MODULE_IDS.filter(id => MODULES[id].tiers[product] === 'optional')
}

/** Returns the product's badge colour (hex). */
export function getBadgeColour(product: ProductId): string {
  return PRODUCT_CONFIG[product].badge_colour
}

/** Returns the compliance module ID for a product (psr_modeller,
 *  ground_grading_fsr, wsl_handbook, or fa_charter). */
export function getComplianceModuleId(product: ProductId): ComplianceId {
  return PRODUCT_CONFIG[product].compliance_module
}

/** True if a module is on by default for a product (tier 'full' or
 *  'lite'). Does NOT return true for 'optional' — those depend on
 *  per-club opt-in state stored elsewhere. */
export function isModuleEnabled(product: ProductId, moduleId: ModuleId): boolean {
  const tier = MODULES[moduleId].tiers[product]
  return tier === 'full' || tier === 'lite'
}
