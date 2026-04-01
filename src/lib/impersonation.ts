/**
 * Impersonation context helper.
 * When admin is impersonating a staff member, all data fetches
 * should use the impersonated user's identity, not the owner's.
 */

export interface ImpersonationContext {
  isImpersonating: boolean
  email: string
  name: string
  role: string
  roleLevel: number
}

export function getImpersonationContext(): ImpersonationContext {
  if (typeof window === 'undefined') return { isImpersonating: false, email: '', name: '', role: 'user', roleLevel: 4 }

  const isImpersonating = localStorage.getItem('lumio_impersonated_from_admin') === 'true'
  if (!isImpersonating) {
    return {
      isImpersonating: false,
      email: localStorage.getItem('lumio_user_email') || '',
      name: localStorage.getItem('lumio_user_name') || '',
      role: 'user',
      roleLevel: 4,
    }
  }

  return {
    isImpersonating: true,
    email: localStorage.getItem('lumio_impersonated_user_email') || '',
    name: localStorage.getItem('lumio_impersonated_user_name') || '',
    role: localStorage.getItem('lumio_impersonated_user_role') || 'user',
    roleLevel: parseInt(localStorage.getItem('lumio_impersonated_user_role_level') || '4'),
  }
}

/**
 * When impersonating, integration data should only show if
 * the impersonated user has their own connected tokens.
 * Since most staff won't have OAuth tokens, this returns false
 * for impersonated users unless they've connected their own tools.
 */
export function shouldShowIntegrationData(): boolean {
  if (typeof window === 'undefined') return false
  const ctx = getImpersonationContext()
  if (!ctx.isImpersonating) return true // owner sees their own data
  // Impersonated users don't have their own tokens — hide integration data
  return false
}
