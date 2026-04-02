export interface StaffMember {
  first_name?: string; last_name?: string; email?: string
  job_title?: string; department?: string; phone?: string; start_date?: string
}

const DEPT_PATTERNS: Record<string, RegExp> = {
  sales: /\b(sales|business development|revenue)\b/i,
  hr: /\b(hr|human resources|people|talent|recruitment)\b/i,
  marketing: /\b(marketing|comms|communications|brand|content|growth)\b/i,
  accounts: /\b(accounts|finance|accounting|bookkeeping|payroll)\b/i,
  operations: /\b(operations|ops|logistics|supply chain|procurement)\b/i,
  it: /\b(it|technology|tech|engineering|development|devops|infrastructure)\b/i,
  support: /\b(support|helpdesk|customer service|service desk)\b/i,
  success: /\b(success|customer success|account management|client)\b/i,
  partners: /\b(partners|partnerships|alliances|channel)\b/i,
  strategy: /\b(strategy|planning|analytics|research|insights)\b/i,
  trials: /\b(trials|product|innovation|r&d|research)\b/i,
  crm: /\b(crm|sales ops|pipeline|deals)\b/i,
  projects: /\b(project|programme|pmo)\b/i,
}

// Staff is now fetched from Supabase only — no localStorage
export function getImportedStaff(): StaffMember[] {
  return []
}

export function getDeptStaff(dept: string, staffOverride?: StaffMember[]): StaffMember[] {
  const staff = staffOverride ?? getImportedStaff()
  const pattern = DEPT_PATTERNS[dept.toLowerCase()]
  if (!pattern) return staff.filter(s => (s.department || '').toLowerCase().includes(dept.toLowerCase()))
  return staff.filter(s => {
    const d = s.department || ''
    const t = s.job_title || ''
    return pattern.test(d) || pattern.test(t)
  })
}

export function getDeptLead(staff: StaffMember[]): StaffMember | null {
  if (!staff.length) return null
  const title = (s: StaffMember) => (s.job_title || '').toLowerCase()
  // C-Suite
  const csuite = staff.find(s => /\b(ceo|cto|cfo|coo|cpo|ciso|founder|owner|president|managing director)\b/i.test(title(s)))
  if (csuite) return csuite
  // Directors
  const director = staff.find(s => /\b(director|vp|vice president|head of)\b/i.test(title(s)))
  if (director) return director
  // Managers
  const manager = staff.find(s => /\b(manager|lead|principal|senior)\b/i.test(title(s)))
  if (manager) return manager
  return staff[0]
}

export function getStaffInitials(s: StaffMember): string {
  const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function getStaffName(s: StaffMember): string {
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email || 'Unknown'
}

export function getStaffShortName(s: StaffMember): string {
  return s.first_name ? `${s.first_name} ${(s.last_name || '')[0] || ''}`.trim() : getStaffName(s)
}
