export interface FootballRoleResult {
  role: 'board' | 'senior_management' | 'coaching' | 'support'
  role_level: 1 | 2 | 3 | 4
}

const BOARD_PATTERNS = /\b(chairman|chief executive|ceo|director of football|managing director|club owner|president|owner|board)\b/i
const SENIOR_MGMT_PATTERNS = /\b(head coach|manager|first team manager|assistant manager|head of operations|chief scout|head of medical|head of academy|head of recruitment|sporting director|technical director)\b/i
const COACHING_PATTERNS = /\b(first team coach|goalkeeper coach|fitness coach|lead scout|club doctor|physiotherapist|academy manager|head of media|head of analytics|set piece coach|u\d+ coach|u\d+ manager|lead physio|head physio)\b/i

export function detectFootballRole(jobTitle?: string): FootballRoleResult {
  if (!jobTitle) return { role: 'support', role_level: 4 }
  const t = jobTitle.trim()

  if (BOARD_PATTERNS.test(t)) return { role: 'board', role_level: 1 }
  if (SENIOR_MGMT_PATTERNS.test(t)) return { role: 'senior_management', role_level: 2 }
  if (COACHING_PATTERNS.test(t)) return { role: 'coaching', role_level: 3 }
  return { role: 'support', role_level: 4 }
}

export function getFootballRoleBadge(role: string): { emoji: string; label: string; color: string } | null {
  switch (role) {
    case 'board': return { emoji: '👑', label: 'Board', color: '#F1C40F' }
    case 'senior_management': return { emoji: '⚽', label: 'Senior Management', color: '#C0392B' }
    case 'coaching': return { emoji: '🎽', label: 'Coaching', color: '#E74C3C' }
    case 'support': return { emoji: '🔧', label: 'Support Staff', color: '#9CA3AF' }
    default: return null
  }
}

export const FOOTBALL_ROLES_SWITCHER = [
  { key: 'chairman', label: 'Chairman/CEO', emoji: '👑', level: 1 },
  { key: 'dof', label: 'Director of Football', emoji: '⚽', level: 1 },
  { key: 'head_coach', label: 'Head Coach', emoji: '🎽', level: 2 },
  { key: 'dept_head', label: 'Department Head', emoji: '📋', level: 3 },
  { key: 'support', label: 'Support Staff', emoji: '🔍', level: 4 },
]
