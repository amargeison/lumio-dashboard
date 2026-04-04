export interface RoleResult {
  role: 'director' | 'admin' | 'manager' | 'user'
  role_level: 1 | 2 | 3 | 4
}

const DIRECTOR_PATTERNS = /\b(md|managing director|ceo|chief executive|coo|chief operating|cfo|chief financial|fd|finance director|cto|chief technology|ciso|chief information security|cpo|chief product|chairman|president|founder|co-founder|owner|partner|principal)\b/i
const DIRECTOR_CONTAINS = /\b(director|chief|president|founder)\b/i

const ADMIN_PATTERNS = /\b(office manager|ea|executive assistant|pa|personal assistant|hr manager|people manager|operations manager)\b/i
const ADMIN_CONTAINS = /\b(head of|vp|vice president)\b/i

const MANAGER_CONTAINS = /\b(manager|lead|supervisor|team lead|senior)\b/i

export function detectRole(jobTitle?: string): RoleResult {
  if (!jobTitle) return { role: 'user', role_level: 4 }
  const t = jobTitle.trim()

  if (DIRECTOR_PATTERNS.test(t) || DIRECTOR_CONTAINS.test(t)) {
    return { role: 'director', role_level: 1 }
  }
  if (ADMIN_PATTERNS.test(t) || ADMIN_CONTAINS.test(t)) {
    return { role: 'admin', role_level: 2 }
  }
  if (MANAGER_CONTAINS.test(t)) {
    return { role: 'manager', role_level: 3 }
  }
  return { role: 'user', role_level: 4 }
}

export function getRoleBadge(role: string): { emoji: string; label: string; color: string } | null {
  switch (role) {
    case 'director': return { emoji: '👑', label: 'Director', color: '#F1C40F' }
    case 'admin': return { emoji: '🛡️', label: 'Admin', color: '#9CA3AF' }
    case 'manager': return { emoji: '🔹', label: 'Manager', color: '#0D9488' }
    default: return null
  }
}
