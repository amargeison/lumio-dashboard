/**
 * Product configuration for the four Lumio Sports team-sport products.
 *
 * Single source of truth for everything that varies across products:
 * enabled departments, compliance variant, AI tone, pricing, badge
 * colour. Per Path B spec section B4 (Product Mechanics).
 *
 * Scope: TEAM-SPORT products only (clubs with many users via
 * sports_memberships). Individual-athlete sports (darts/tennis/golf/
 * boxing) use src/lib/sports/features.ts — different problem.
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
 *  Array order is the canonical sidebar render order — keep
 *  matching when adding new modules.
 *
 *  Includes the four product-specific compliance variants — each
 *  product surfaces one of them as its flagship compliance module. */
export const MODULE_IDS = [
  // Generic departments (shared across all products that enable them)
  'overview',
  'insights',
  'board_executive',
  'football_operations',
  'performance_gps',
  'medical_welfare',
  'recruitment_scouting',
  'youth_academy',
  'travel_logistics',
  'commercial_marketing',
  'ticketing_crm_fans',
  'media_comms',
  'facilities_grounds',
  'finance_hr_admin',
  'community',
  'strategy',
  'settings',
  'workflows_library',
  'integrations',
  // Compliance variants — one per product, label set by the rendering UI
  'psr_modeller',         // Lumio Pro
  'ground_grading_fsr',   // Lumio Club
  'wsl_handbook',         // Lumio Women
  'fa_charter',           // Lumio Grassroots
] as const

export type ModuleId = typeof MODULE_IDS[number]

/** Narrowed type for the four compliance variants. ComplianceId is a
 *  subset of ModuleId so the same value can appear in enabled_modules
 *  and in compliance_module. */
export type ComplianceId =
  | 'psr_modeller'
  | 'ground_grading_fsr'
  | 'wsl_handbook'
  | 'fa_charter'

// ─── AI tone ────────────────────────────────────────────────────────────

export type AiTone = 'formal' | 'professional' | 'community' | 'volunteer'

// ─── ProductConfig type ─────────────────────────────────────────────────

/**
 * The full configuration for one Lumio Sports product.
 *
 * - `enabled_modules` includes the product's compliance variant.
 * - `optional_modules` is the set of modules the onboarding wizard
 *   asks about (Grassroots only — empty for Pro/Club/Women).
 * - `base_price_gbp` is annual; `per_seat_price_gbp` is monthly.
 *   Two different time units — spec convention, documented here so
 *   call sites don't get it wrong.
 */
export type ProductConfig = {
  readonly id: ProductId
  readonly display_name: string
  readonly tier_label: string
  readonly enabled_modules: readonly ModuleId[]
  readonly optional_modules: readonly ModuleId[]
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

// ─── The 4-product configuration matrix ─────────────────────────────────

// Generic modules enabled for Pro / Club / Women (the full 19). Each
// product appends its own compliance variant below.
const FULL_DEPARTMENT_SET: readonly ModuleId[] = [
  'overview',
  'insights',
  'board_executive',
  'football_operations',
  'performance_gps',
  'medical_welfare',
  'recruitment_scouting',
  'youth_academy',
  'travel_logistics',
  'commercial_marketing',
  'ticketing_crm_fans',
  'media_comms',
  'facilities_grounds',
  'finance_hr_admin',
  'community',
  'strategy',
  'settings',
  'workflows_library',
  'integrations',
] as const

/**
 * The four Lumio Sports product configurations.
 *
 * Keyed by ProductId for direct lookup. Use the helper functions
 * below in preference to indexing this constant directly — they
 * provide a typed, named API for the common queries.
 */
export const PRODUCT_CONFIG: Record<ProductId, ProductConfig> = {
  lumio_pro: {
    id: 'lumio_pro',
    display_name: 'Lumio Pro',
    tier_label: 'Premier League / Championship',
    enabled_modules: [...FULL_DEPARTMENT_SET, 'psr_modeller'],
    optional_modules: [],
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
    enabled_modules: [...FULL_DEPARTMENT_SET, 'ground_grading_fsr'],
    optional_modules: [],
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
    enabled_modules: [...FULL_DEPARTMENT_SET, 'wsl_handbook'],
    optional_modules: [],
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
    // Grassroots disables 4 modules entirely (medical_welfare,
    // recruitment_scouting, ticketing_crm_fans, strategy) and offers
    // 2 as opt-in at onboarding (performance_gps, integrations).
    enabled_modules: [
      'overview',
      'insights',
      'board_executive',
      'football_operations',
      'youth_academy',
      'travel_logistics',
      'commercial_marketing',
      'media_comms',
      'facilities_grounds',
      'finance_hr_admin',
      'community',
      'settings',
      'workflows_library',
      'fa_charter',
    ],
    optional_modules: ['performance_gps', 'integrations'],
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

/** Returns the enabled modules (the always-on set) for a product.
 *  Includes the product's compliance variant. Does NOT include
 *  optional modules — for those use getOptionalModules. */
export function getEnabledModules(product: ProductId): readonly ModuleId[] {
  return PRODUCT_CONFIG[product].enabled_modules
}

/** Returns the modules the onboarding wizard asks about for a product.
 *  Currently only Grassroots returns a non-empty array (performance_gps,
 *  integrations). Pro / Club / Women return []. */
export function getOptionalModules(product: ProductId): readonly ModuleId[] {
  return PRODUCT_CONFIG[product].optional_modules
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

/** True if a module is in the product's default enabled set. Does NOT
 *  return true for optional modules — those depend on per-club state
 *  (whether the club opted in at onboarding) and aren't visible from
 *  product config alone. */
export function isModuleEnabled(product: ProductId, moduleId: ModuleId): boolean {
  return PRODUCT_CONFIG[product].enabled_modules.includes(moduleId)
}
