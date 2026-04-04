export interface SchoolRoleResult {
  role: 'slt' | 'admin' | 'teacher' | 'support'
  role_level: 1 | 2 | 3 | 4
  label: string
}

const SLT_PATTERNS = /\b(headteacher|head teacher|principal|executive head|deputy head|assistant head|vice principal)\b/i
const ADMIN_PATTERNS = /\b(school business manager|bursar|office manager|senco|dsl|designated safeguarding|head of year|pastoral lead|data manager|exams officer)\b/i
const TEACHER_PATTERNS = /\b(head of department|hod|subject lead|class teacher|teacher|qualified teacher|nqt|ect|lecturer)\b/i

export function detectSchoolRole(jobTitle?: string): SchoolRoleResult {
  if (!jobTitle) return { role: 'support', role_level: 4, label: 'Support Staff' }
  const t = jobTitle.trim()

  if (SLT_PATTERNS.test(t)) return { role: 'slt', role_level: 1, label: 'SLT' }
  if (ADMIN_PATTERNS.test(t)) return { role: 'admin', role_level: 2, label: 'Admin' }
  if (TEACHER_PATTERNS.test(t)) return { role: 'teacher', role_level: 3, label: 'Teacher' }
  return { role: 'support', role_level: 4, label: 'Support Staff' }
}

export function getSchoolRoleBadge(role: string): { emoji: string; label: string; color: string } | null {
  switch (role) {
    case 'slt': return { emoji: '🎓', label: 'SLT', color: '#0D9488' }
    case 'admin': return { emoji: '🛡️', label: 'Admin', color: '#3B82F6' }
    case 'teacher': return { emoji: '📚', label: 'Teacher', color: '#8B5CF6' }
    case 'support': return { emoji: '🤝', label: 'Support', color: '#6B7280' }
    default: return null
  }
}

export function getSchoolClientRole(): SchoolRoleResult & { isOwner: boolean } {
  if (typeof window === 'undefined') return { role: 'support', role_level: 4, label: 'Support Staff', isOwner: false }

  const impersonated = localStorage.getItem('lumio_school_impersonated_role')
  if (impersonated) {
    const level = parseInt(impersonated)
    const map: Record<number, SchoolRoleResult> = {
      1: { role: 'slt', role_level: 1, label: 'Headteacher' },
      2: { role: 'admin', role_level: 2, label: 'Admin' },
      3: { role: 'teacher', role_level: 3, label: 'Teacher' },
      4: { role: 'support', role_level: 4, label: 'Support Staff' },
    }
    return { ...(map[level] || map[4]), isOwner: localStorage.getItem('lumio_school_is_owner') === 'true' }
  }

  const cachedLevel = localStorage.getItem('lumio_school_role_level')
  if (cachedLevel) {
    const level = parseInt(cachedLevel)
    const map: Record<number, SchoolRoleResult> = {
      1: { role: 'slt', role_level: 1, label: 'SLT' },
      2: { role: 'admin', role_level: 2, label: 'Admin' },
      3: { role: 'teacher', role_level: 3, label: 'Teacher' },
      4: { role: 'support', role_level: 4, label: 'Support Staff' },
    }
    return { ...(map[level] || map[4]), isOwner: localStorage.getItem('lumio_school_is_owner') === 'true' }
  }

  return { role: 'support', role_level: 4, label: 'Support Staff', isOwner: false }
}
