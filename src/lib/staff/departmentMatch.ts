/**
 * Shared department matching logic — used by both Microsoft SSO and CSV import.
 * Matches a job title and/or department string against Lumio's standard departments.
 */

export const LUMIO_DEPARTMENTS: { slug: string; label: string; patterns: RegExp }[] = [
  { slug: 'hr',         label: 'HR & People',       patterns: /\b(hr|human resources|people|talent|recruitment)\b/i },
  { slug: 'sales',      label: 'Sales',             patterns: /\b(sales|business development|revenue)\b/i },
  { slug: 'marketing',  label: 'Marketing',         patterns: /\b(marketing|brand|communications|comms|content|digital)\b/i },
  { slug: 'accounts',   label: 'Finance',           patterns: /\b(finance|accounts|accounting|payroll|treasury)\b/i },
  { slug: 'operations', label: 'Operations',        patterns: /\b(operations|ops|logistics|supply chain|procurement)\b/i },
  { slug: 'it',         label: 'IT & Systems',      patterns: /\b(it|technology|tech|engineering|development|devops|infrastructure|systems)\b/i },
  { slug: 'legal',      label: 'Legal',             patterns: /\b(legal|compliance|governance|regulatory)\b/i },
  { slug: 'projects',   label: 'Projects',          patterns: /\b(project|pmo|delivery)\b/i },
  { slug: 'success',    label: 'Customer Success',  patterns: /\b(success|customer success|csm|account management)\b/i },
  { slug: 'support',    label: 'Support',           patterns: /\b(support|helpdesk|service desk|customer service)\b/i },
  { slug: 'workflows',  label: 'Workflows',         patterns: /\b(workflow|automation|process)\b/i },
  { slug: 'partners',   label: 'Partners',          patterns: /\b(partner|partnerships|alliances|channel)\b/i },
  { slug: 'strategy',   label: 'Strategy',          patterns: /\b(strategy|executive|leadership|c-suite|board)\b/i },
]

export interface DeptMatchResult {
  slug: string
  label: string
}

/**
 * Match a department/job title string against Lumio's standard departments.
 * Returns the matched department or null if no match found.
 */
export function matchDepartment(department?: string, jobTitle?: string): DeptMatchResult | null {
  const text = [department, jobTitle].filter(Boolean).join(' ')
  if (!text) return null
  for (const dept of LUMIO_DEPARTMENTS) {
    if (dept.patterns.test(text)) return { slug: dept.slug, label: dept.label }
  }
  return null
}

/**
 * Process a batch of staff records and return assignment stats.
 */
export function assignDepartments(staff: { department?: string; job_title?: string }[]): {
  assigned: number; pending: number
  results: { index: number; matched: DeptMatchResult | null }[]
} {
  let assigned = 0
  let pending = 0
  const results: { index: number; matched: DeptMatchResult | null }[] = []

  for (let i = 0; i < staff.length; i++) {
    const s = staff[i]
    const matched = matchDepartment(s.department, s.job_title)
    results.push({ index: i, matched })
    if (matched) assigned++; else pending++
  }

  return { assigned, pending, results }
}
