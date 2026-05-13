/**
 * Role templates — the canonical RBAC role definitions per product.
 *
 * Used at two layers:
 *   - Onboarding: the admin-tool wizard pre-fills suggested roles per
 *     product (Path E).
 *   - Runtime: permission checks (canAccess / canEdit / canAdmin) gate
 *     access to UI surfaces and API routes.
 *
 * Phase 4b scope: 17 roles spanning the 4 Lumio Sports products. Adds
 * to product-config.ts (Phase 4a/4a.5) — that file owns the MODULES
 * catalogue (per-product tier), this one owns role grants on top of it.
 *
 * Two-layer role model:
 *
 *   PLATFORM roles (owner, admin): RBAC across the Lumio platform.
 *   Manage billing, invite staff, configure the club portal. A real
 *   person typically has exactly one platform role.
 *
 *   CLUB roles (ceo, chairman, manager, etc.): org-chart roles within
 *   the club. Map to football-org responsibilities. A real person
 *   typically has one club role, but Pro/Club founders might be both
 *   'owner' (platform) and 'ceo' (club) — two memberships, two roles.
 *
 *   Both layers compose: access = (platform_role grants admin) OR
 *   (club_role grants module-level permission).
 *
 * Access decisions almost always need BOTH of these checks:
 *   - role.canAccess(moduleId)            — does this role grant access?
 *   - product.isModuleEnabled(moduleId)   — is the module on for the product?
 *
 * Role IDs match the existing FOOTBALL_ROLES / FOOTBALL_ROLE_QUICK_ACTIONS
 * convention in src/data/football/ and src/app/(football)/ — same role
 * identity across demo view-switching, quick actions, and RBAC permissions.
 * Future consolidation: RoleSwitcher reads getAvailableRoles() from this file.
 *
 * See docs/specs/path-b-rbac-architecture.md
 */

import {
  type ProductId,
  type ModuleId,
  MODULE_IDS,
  PRODUCT_IDS,
} from './product-config'

// ─── Types ──────────────────────────────────────────────────────────────

/** Four-level permission ladder. Modules not listed in a role's
 *  permissions object default to 'none'. */
export type PermissionLevel = 'none' | 'view' | 'edit' | 'admin'

/** Free-form role identifier — the ROLE_TEMPLATES record below is the
 *  practical set, but the type is open so the admin tool and API
 *  routes can pass any string without compile-time narrowing. */
export type RoleId = string

/** Per-module permission grants for a role. Partial — modules not
 *  listed are implicitly 'none' (resolved as such by getPermission). */
export type RolePermissions = Readonly<Partial<Record<ModuleId, PermissionLevel>>>

/** A role definition. `products` is the list of products this role is
 *  available to (e.g. team_manager is grassroots-only). `is_admin_role`
 *  marks a role that can manage other roles + billing. `is_protected`
 *  marks a role that can't be removed or reassigned (owner only). */
export type RoleTemplate = {
  readonly id: RoleId
  readonly label: string
  readonly description: string
  readonly products: ReadonlyArray<ProductId>
  readonly permissions: RolePermissions
  readonly is_admin_role?: boolean
  readonly is_protected?: boolean
}

// ─── Internal: programmatic permission builder ──────────────────────────

/** Builds a permissions object that grants `level` to EVERY module in
 *  MODULE_IDS. Used for owner/admin so those roles stay in sync as
 *  new modules are added — change MODULE_IDS, owner/admin pick it up
 *  automatically. */
function allModulesAt(level: PermissionLevel): RolePermissions {
  const perms: Partial<Record<ModuleId, PermissionLevel>> = {}
  for (const id of MODULE_IDS) perms[id] = level
  return perms
}

// ─── Role catalogue ─────────────────────────────────────────────────────

/**
 * The canonical role catalogue. Keyed by role ID for direct lookup
 * but accessed via the helpers below for ergonomics.
 *
 * Order:
 *   - Platform roles first (owner, admin) — cross-product, RBAC layer.
 *   - Pro/Club/Women roles next, in org-chart top-down order. Of these,
 *     six are available to ALL THREE products (ceo, chairman, manager,
 *     commercial, head_operations, head_community); the four specialist
 *     Head-of roles (director_football, head_performance, head_medical,
 *     analyst) are Pro + Women only. Club's smaller operational
 *     footprint means specialist Head-of responsibilities are absorbed
 *     into Manager/Head Coach. Pro and Women run the full 10-role set;
 *     Club runs a 6-role subset. Founding members can request the full
 *     set unlocked if needed.
 *   - Grassroots-only roles last.
 */
export const ROLE_TEMPLATES: Readonly<Record<RoleId, RoleTemplate>> = {
  owner: {
    id: 'owner',
    label: 'Owner',
    description: 'Club owner. Full access to everything including billing and role assignment. Cannot be removed.',
    products: PRODUCT_IDS,
    permissions: allModulesAt('admin'),
    is_admin_role: true,
    is_protected: true,
  },

  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Club administrator. Full access to all modules. Cannot manage billing or assign Owner role.',
    products: PRODUCT_IDS,
    permissions: allModulesAt('admin'),
    is_admin_role: true,
  },

  // ─── Pro / Club / Women roles ─────────────────────────────────────────
  // Club's smaller operational footprint means specialist Head-of roles
  // are absorbed into Manager/Head Coach. Pro and Women run the full
  // 10-role set; Club runs a 6-role subset (ceo, chairman, manager,
  // commercial, head_operations, head_community). The four specialist
  // roles below (director_football, head_performance, head_medical,
  // analyst) are Pro + Women only. Founding members can request the
  // full set unlocked if needed.

  ceo: {
    id: 'ceo',
    label: 'CEO',
    description: 'Chief Executive Officer. Top-line club leadership across all departments.',
    products: ['lumio_pro', 'lumio_club', 'lumio_women'],
    // Compliance (Option A per Phase 4b decision): edit on all 4, filtered
    // by MODULES.tiers per product. Role-templates expresses intent ("CEO
    // engages with whichever compliance applies"); product-config filters
    // reality (only the product's flagship compliance is enabled). Callers
    // combine: canAccess(role, mod) && isModuleEnabled(product, mod).
    permissions: {
      board_executive: 'admin',
      football_operations: 'edit',
      finance_hr_admin: 'admin',
      commercial_marketing: 'admin',
      ticketing_crm_fans: 'admin',
      facilities_grounds: 'edit',
      travel_logistics: 'edit',
      tours_camps: 'edit',
      staff_directory: 'admin',
      media_comms: 'edit',
      community: 'edit',
      overview: 'view',
      insights: 'view',
      integrations: 'view',
      workflows_library: 'view',
      psr_modeller: 'edit',
      ground_grading_fsr: 'edit',
      wsl_handbook: 'edit',
      fa_charter: 'edit',
    },
  },

  chairman: {
    id: 'chairman',
    label: 'Chairman',
    description: 'Club Chairman. Board-level oversight, governance, strategic direction.',
    products: ['lumio_pro', 'lumio_club', 'lumio_women'],
    // Same Option A compliance pattern: chairman engages with compliance
    // at board sign-off level. MODULES.tiers filters to the product's
    // flagship variant at render time.
    permissions: {
      board_executive: 'admin',
      finance_hr_admin: 'view',
      commercial_marketing: 'view',
      football_operations: 'view',
      facilities_grounds: 'view',
      staff_directory: 'view',
      overview: 'view',
      insights: 'view',
      psr_modeller: 'view',
      ground_grading_fsr: 'view',
      wsl_handbook: 'view',
      fa_charter: 'view',
    },
  },

  manager: {
    id: 'manager',
    label: 'Manager / Head Coach',
    description: 'First-team manager. Squad selection, tactics, training, matchday.',
    products: ['lumio_pro', 'lumio_club', 'lumio_women'],
    permissions: {
      football_operations: 'admin',
      performance_gps: 'edit',
      medical_welfare: 'view',
      recruitment_scouting: 'edit',
      youth_academy: 'view',
      tours_camps: 'edit',
      travel_logistics: 'edit',
      media_comms: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  director_football: {
    id: 'director_football',
    label: 'Director of Football',
    description: 'Football strategy, transfers, recruitment pipeline, agent relationships.',
    // Pro + Women only — Club absorbs DoF responsibilities into Manager.
    products: ['lumio_pro', 'lumio_women'],
    permissions: {
      recruitment_scouting: 'admin',
      football_operations: 'edit',
      finance_hr_admin: 'edit', // transfer budgets
      youth_academy: 'edit',
      medical_welfare: 'view',
      performance_gps: 'view',
      travel_logistics: 'view',
      tours_camps: 'view',
      board_executive: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  head_performance: {
    id: 'head_performance',
    label: 'Head of Performance',
    description: 'Performance, GPS, sports science, training load.',
    products: ['lumio_pro', 'lumio_women'],
    permissions: {
      performance_gps: 'admin',
      medical_welfare: 'edit',
      football_operations: 'view',
      integrations: 'edit',
      tours_camps: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  head_medical: {
    id: 'head_medical',
    label: 'Head of Medical',
    description: 'Medical staff, injuries, return-to-play, player welfare.',
    products: ['lumio_pro', 'lumio_women'],
    permissions: {
      medical_welfare: 'admin',
      performance_gps: 'view',
      football_operations: 'view',
      travel_logistics: 'view',
      tours_camps: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  analyst: {
    id: 'analyst',
    label: 'Analyst / Head of Data',
    description: 'Performance analysis, opposition scouting, data and integrations.',
    products: ['lumio_pro', 'lumio_women'],
    permissions: {
      performance_gps: 'edit',
      integrations: 'admin',
      recruitment_scouting: 'view',
      football_operations: 'view',
      insights: 'edit',
      overview: 'view',
      staff_directory: 'view',
    },
  },

  commercial: {
    id: 'commercial',
    label: 'Commercial Director',
    description: 'Sponsorship, partnerships, brand, ticketing, fan revenue.',
    products: ['lumio_pro', 'lumio_club', 'lumio_women'],
    permissions: {
      commercial_marketing: 'admin',
      ticketing_crm_fans: 'admin',
      media_comms: 'edit',
      finance_hr_admin: 'view',
      board_executive: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  head_operations: {
    id: 'head_operations',
    label: 'Head of Operations',
    description: 'Facilities, matchday operations, travel, logistics, HR/admin.',
    products: ['lumio_pro', 'lumio_club', 'lumio_women'],
    permissions: {
      facilities_grounds: 'admin',
      travel_logistics: 'admin',
      tours_camps: 'admin',
      finance_hr_admin: 'edit',
      football_operations: 'view',
      staff_directory: 'admin',
      workflows_library: 'edit',
      overview: 'view',
      insights: 'view',
    },
  },

  head_community: {
    id: 'head_community',
    label: 'Head of Community',
    description: 'Community programmes, foundation, schools, fan engagement.',
    products: ['lumio_pro', 'lumio_club', 'lumio_women'],
    permissions: {
      community: 'admin',
      media_comms: 'edit',
      commercial_marketing: 'view',
      ticketing_crm_fans: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  // ─── Grassroots roles ─────────────────────────────────────────────────

  team_manager: {
    id: 'team_manager',
    label: 'Team Manager',
    description: 'Manages day-to-day team operations: fixtures, training, comms, away days.',
    products: ['lumio_grassroots'],
    permissions: {
      football_operations: 'admin',
      travel_logistics: 'admin',
      media_comms: 'edit',
      community: 'edit',
      facilities_grounds: 'edit',
      finance_hr_admin: 'view',
      board_executive: 'view',
      overview: 'view',
      insights: 'view',
      tours_camps: 'edit',
      staff_directory: 'edit',
    },
  },

  coach: {
    id: 'coach',
    label: 'Coach',
    description: 'Coaching staff. Manages training, squad selection, player development.',
    products: ['lumio_grassroots'],
    permissions: {
      football_operations: 'edit',
      tours_camps: 'edit',
      media_comms: 'view',
      travel_logistics: 'view',
      overview: 'view',
      insights: 'view',
      staff_directory: 'view',
    },
  },

  parent: {
    id: 'parent',
    label: 'Parent / Guardian',
    description: "Parent or guardian of a junior section player. Limited read access to their child's team info.",
    products: ['lumio_grassroots'],
    permissions: {
      junior_section: 'view',
      football_operations: 'view',
      media_comms: 'view',
      travel_logistics: 'view',
      overview: 'view',
    },
  },

  player: {
    id: 'player',
    label: 'Player',
    description: 'Senior player. Read access to their team and club info.',
    products: ['lumio_grassroots'],
    permissions: {
      football_operations: 'view',
      travel_logistics: 'view',
      media_comms: 'view',
      overview: 'view',
      community: 'view',
    },
  },

  volunteer: {
    id: 'volunteer',
    label: 'Volunteer',
    description: 'Club volunteer. Helps with matchday, facilities, events.',
    products: ['lumio_grassroots'],
    permissions: {
      football_operations: 'edit',
      facilities_grounds: 'edit',
      travel_logistics: 'view',
      media_comms: 'view',
      community: 'edit',
      overview: 'view',
    },
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Returns the RoleTemplate for a given roleId, or undefined if the
 *  role isn't defined. */
export function getRoleTemplate(roleId: RoleId): RoleTemplate | undefined {
  if (!(roleId in ROLE_TEMPLATES)) return undefined
  return ROLE_TEMPLATES[roleId]
}

/** Returns every role available to a given product, in catalogue order. */
export function getAvailableRoles(product: ProductId): ReadonlyArray<RoleTemplate> {
  return Object.values(ROLE_TEMPLATES).filter(t => t.products.includes(product))
}

/** Returns the permission level a role grants for a module. Returns
 *  'none' if the role doesn't exist or the role doesn't grant the
 *  module. */
export function getPermission(roleId: RoleId, moduleId: ModuleId): PermissionLevel {
  const tpl = getRoleTemplate(roleId)
  if (!tpl) return 'none'
  return tpl.permissions[moduleId] ?? 'none'
}

/** True if the role grants any access ('view', 'edit', or 'admin').
 *  Does NOT check module enablement for the product — combine with
 *  isModuleEnabled(product, moduleId) from product-config for the
 *  full access decision. */
export function canAccess(roleId: RoleId, moduleId: ModuleId): boolean {
  const p = getPermission(roleId, moduleId)
  return p === 'view' || p === 'edit' || p === 'admin'
}

/** True if the role grants write access ('edit' or 'admin'). */
export function canEdit(roleId: RoleId, moduleId: ModuleId): boolean {
  const p = getPermission(roleId, moduleId)
  return p === 'edit' || p === 'admin'
}

/** True if the role grants full admin access on a module. */
export function canAdmin(roleId: RoleId, moduleId: ModuleId): boolean {
  return getPermission(roleId, moduleId) === 'admin'
}
