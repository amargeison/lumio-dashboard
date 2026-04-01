import { createClient } from '@supabase/supabase-js'
import { detectRole, type RoleResult } from './detect-role'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function getEmployeeRole(businessId: string, email: string): Promise<RoleResult & { isOwner: boolean }> {
  const supabase = getSupabase()

  // Check if this is the workspace owner
  const { data: business } = await supabase.from('businesses').select('owner_email, owner_role').eq('id', businessId).single()
  const isOwner = business?.owner_email?.toLowerCase() === email.toLowerCase()

  if (isOwner) {
    return { role: 'director', role_level: 1, isOwner: true }
  }

  // Check workspace_staff (primary source — has job_title, role, role_level)
  const { data: staff } = await supabase.from('workspace_staff').select('role, role_level, job_title').eq('business_id', businessId).eq('email', email.toLowerCase()).maybeSingle()

  if (staff?.role && staff?.role_level && staff.role !== 'user') {
    return { role: staff.role as RoleResult['role'], role_level: staff.role_level as RoleResult['role_level'], isOwner: false }
  }

  if (staff?.job_title) {
    return { ...detectRole(staff.job_title), isOwner: false }
  }

  return { role: 'user', role_level: 4, isOwner: false }
}

export function hasAccess(userLevel: number, requiredLevel: number): boolean {
  return userLevel <= requiredLevel
}

// Client-side role detection from localStorage
// Checks impersonated role first (for owner preview mode)
export function getClientRole(): RoleResult & { isOwner: boolean; impersonating: boolean } {
  if (typeof window === 'undefined') return { role: 'user', role_level: 4, isOwner: false, impersonating: false }

  // Check impersonation mode first
  const impersonatedRole = localStorage.getItem('lumio_impersonated_role')
  if (impersonatedRole && localStorage.getItem('lumio_user_is_owner') === 'true') {
    const roleMap: Record<string, { role: RoleResult['role']; role_level: RoleResult['role_level'] }> = {
      owner: { role: 'director', role_level: 1 },
      director: { role: 'director', role_level: 1 },
      admin: { role: 'admin', role_level: 2 },
      manager: { role: 'manager', role_level: 3 },
      user: { role: 'user', role_level: 4 },
    }
    const mapped = roleMap[impersonatedRole]
    if (mapped) return { ...mapped, isOwner: true, impersonating: true }
  }

  const cachedRole = localStorage.getItem('lumio_user_role_level')
  if (cachedRole) {
    const level = parseInt(cachedRole)
    const roleMap: Record<number, RoleResult['role']> = { 1: 'director', 2: 'admin', 3: 'manager', 4: 'user' }
    return { role: roleMap[level] || 'user', role_level: (level as RoleResult['role_level']) || 4, isOwner: localStorage.getItem('lumio_user_is_owner') === 'true', impersonating: false }
  }

  // Detect from imported staff
  try {
    const userName = (localStorage.getItem('lumio_user_name') || '').toLowerCase()
    const staff = JSON.parse(localStorage.getItem('lumio_staff_imported') || '[]')
    const match = staff.find((s: any) => {
      const full = [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase()
      return full === userName || (s.first_name && s.first_name.toLowerCase() === userName)
    })
    if (match?.job_title) {
      const detected = detectRole(match.job_title)
      localStorage.setItem('lumio_user_role_level', String(detected.role_level))
      return { ...detected, isOwner: false, impersonating: false }
    }
  } catch { /* ignore */ }

  return { role: 'user', role_level: 4, isOwner: false, impersonating: false }
}
