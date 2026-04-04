import type { RoleResult } from './detect-role'

// ─── Role labels & descriptions ──────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  director: 'Director / SLT',
  admin: 'Admin',
  manager: 'Manager',
  user: 'Standard User',
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  director: 'Full access to everything including Finance, HR sensitive data, and Directors Suite',
  admin: 'Full access to everything including user management and all financial data',
  manager: 'Access to their department and shared areas. Cannot see financial figures or Directors Suite',
  user: 'Access to their assigned department only. Cannot see sensitive financial or HR data',
}

// ─── Department access by role_level ─────────────────────────────────────────
// Lower number = higher access. 1=Director, 2=Admin, 3=Manager, 4=User

export const DEPT_ACCESS_LEVEL: Record<string, number> = {
  overview: 4,
  insights: 4,
  hr: 4,               // basic HR view
  'hr-sensitive': 1,   // salary, disciplinary, grievance data
  accounts: 1,         // all financial figures — director only
  sales: 3,
  'sales-pipeline': 2, // £ figures in pipeline
  marketing: 4,
  operations: 4,
  support: 4,
  success: 4,
  it: 4,
  projects: 4,
  partners: 3,
  trials: 3,
  crm: 3,
  strategy: 3,
  workflows: 3,
  directors: 1,        // Directors Suite — director/owner only
  settings: 2,         // admin+ only
}

export function canAccessDept(dept: string, roleLevel: number): boolean {
  const requiredLevel = DEPT_ACCESS_LEVEL[dept] ?? 4
  return roleLevel <= requiredLevel
}

export function canSeeSensitiveFinancials(roleLevel: number): boolean {
  return roleLevel <= 1
}

export function canSeeDirectorsSuite(roleLevel: number): boolean {
  return roleLevel <= 1
}

export function canSeeSensitiveHR(roleLevel: number): boolean {
  return roleLevel <= 1
}

export function canManageSettings(roleLevel: number): boolean {
  return roleLevel <= 2
}

// ─── Role cards for invite UI ────────────────────────────────────────────────

export const ROLE_CARDS: Array<{ value: RoleResult['role']; level: number; label: string; description: string; color: string }> = [
  { value: 'director', level: 1, label: 'Director / SLT', description: 'All departments including Finance, HR sensitive data, Directors Suite', color: '#8B5CF6' },
  { value: 'admin', level: 2, label: 'Admin', description: 'Full access including user management and all financial data', color: '#EF4444' },
  { value: 'manager', level: 3, label: 'Manager', description: 'All departments except Finance figures and Directors Suite', color: '#3B82F6' },
  { value: 'user', level: 4, label: 'Standard User', description: 'Assigned department only, no sensitive financial or HR data', color: '#10B981' },
]

// ─── Permission matrix for UI display ────────────────────────────────────────

export const PERMISSION_MATRIX: Array<{ label: string; minLevel: number }> = [
  { label: 'All standard departments', minLevel: 4 },
  { label: 'Sales & CRM pipeline data', minLevel: 3 },
  { label: 'Financial figures (Accounts)', minLevel: 1 },
  { label: 'HR sensitive data (salary, disciplinary)', minLevel: 1 },
  { label: 'Directors Suite', minLevel: 1 },
  { label: 'User management (Settings)', minLevel: 2 },
]
