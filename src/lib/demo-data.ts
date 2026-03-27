/**
 * Demo data builder for Lumio Demo Ltd — a realistic UK tech company based in London.
 * All dates are computed relative to "now" so the data always feels fresh.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function setTime(d: Date, h: number, m = 0): Date {
  const r = new Date(d)
  r.setHours(h, m, 0, 0)
  return r
}

function monthStart(now: Date, monthsAgo: number): string {
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
    .toISOString()
    .split('T')[0]
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildDemoData(businessId: string) {
  const now = new Date()

  // ── Employees (10) ──────────────────────────────────────────────────────

  const employees = [
    { business_id: businessId, name: 'Arron Margeison', email: 'arron@lumiodemo.co.uk', role: 'CEO & Founder', department: 'Executive', salary: 85000, start_date: '2024-01-15', leave_balance_days: 28, status: 'active', avatar: 'AM', is_demo: true },
    { business_id: businessId, name: 'Sarah Mitchell', email: 'sarah@lumiodemo.co.uk', role: 'Head of HR', department: 'HR', salary: 62000, start_date: '2024-03-01', leave_balance_days: 25, status: 'active', avatar: 'SM', is_demo: true },
    { business_id: businessId, name: 'Oliver Bennett', email: 'oliver@lumiodemo.co.uk', role: 'Head of Sales', department: 'Sales', salary: 65000, start_date: '2024-02-15', leave_balance_days: 22, status: 'active', avatar: 'OB', is_demo: true },
    { business_id: businessId, name: 'Charlotte Davies', email: 'charlotte@lumiodemo.co.uk', role: 'Senior Account Executive', department: 'Sales', salary: 48000, start_date: '2024-06-01', leave_balance_days: 25, status: 'active', avatar: 'CD', is_demo: true },
    { business_id: businessId, name: 'George Harrison', email: 'george@lumiodemo.co.uk', role: 'Head of Finance', department: 'Finance', salary: 68000, start_date: '2024-01-15', leave_balance_days: 20, status: 'active', avatar: 'GH', is_demo: true },
    { business_id: businessId, name: 'Alexander Jones', email: 'alex@lumiodemo.co.uk', role: 'Head of IT', department: 'IT', salary: 58000, start_date: '2024-04-01', leave_balance_days: 25, status: 'active', avatar: 'AJ', is_demo: true },
    { business_id: businessId, name: 'Sophia Brown', email: 'sophia@lumiodemo.co.uk', role: 'Head of Marketing', department: 'Marketing', salary: 55000, start_date: '2024-05-01', leave_balance_days: 18, status: 'on_leave', avatar: 'SB', is_demo: true },
    { business_id: businessId, name: 'Priya Kapoor', email: 'priya@lumiodemo.co.uk', role: 'Frontend Developer', department: 'Engineering', salary: 52000, start_date: '2025-03-17', leave_balance_days: 25, status: 'active', avatar: 'PK', is_demo: true },
    { business_id: businessId, name: 'James Okafor', email: 'james@lumiodemo.co.uk', role: 'Sales Development Rep', department: 'Sales', salary: 35000, start_date: '2025-03-03', leave_balance_days: 25, status: 'probation', avatar: 'JO', is_demo: true },
    { business_id: businessId, name: 'Tom Ashworth', email: 'tom@lumiodemo.co.uk', role: 'Marketing Executive', department: 'Marketing', salary: 32000, start_date: '2025-03-17', leave_balance_days: 25, status: 'probation', avatar: 'TA', is_demo: true },
  ]

  // ── Meetings (6) — relative to today ────────────────────────────────────

  const meetings = [
    { business_id: businessId, title: 'Team Standup', starts_at: setTime(now, 9, 0).toISOString(), duration_minutes: 15, attendees: ['All team'], location: 'Slack Huddle', type: 'internal', source: 'google', is_demo: true },
    { business_id: businessId, title: 'Client Demo — Oakridge Schools', starts_at: setTime(addDays(now, 1), 11, 0).toISOString(), duration_minutes: 45, attendees: ['Charlotte D.', 'Oliver B.'], location: 'Zoom', type: 'video', source: 'google', link: 'https://zoom.us', is_demo: true },
    { business_id: businessId, title: 'Investor Update Call', starts_at: setTime(addDays(now, 1), 14, 0).toISOString(), duration_minutes: 60, attendees: ['Arron M.'], location: 'Google Meet', type: 'call', source: 'outlook', link: 'https://meet.google.com', is_demo: true },
    { business_id: businessId, title: 'Weekly Sales Review', starts_at: setTime(addDays(now, 2), 10, 0).toISOString(), duration_minutes: 30, attendees: ['Oliver B.', 'Charlotte D.', 'James O.'], location: 'Meeting Room 1', type: 'internal', source: 'google', is_demo: true },
    { business_id: businessId, title: 'HR Policy Review', starts_at: setTime(addDays(now, 3), 14, 0).toISOString(), duration_minutes: 30, attendees: ['Sarah M.', 'Arron M.'], location: 'Google Meet', type: 'video', source: 'google', link: 'https://meet.google.com', is_demo: true },
    { business_id: businessId, title: 'Board Meeting — Q1 Review', starts_at: setTime(addDays(now, 5), 9, 0).toISOString(), duration_minutes: 120, attendees: ['Arron M.', 'George H.', 'Sarah M.'], location: 'Lumio HQ, Shoreditch', type: 'in-person', source: 'outlook', is_demo: true },
  ]

  // ── Finance — last 6 months ─────────────────────────────────────────────

  const financeMonthly = [
    { business_id: businessId, month: monthStart(now, 5), revenue: 38000, expenses: 31000, is_demo: true },
    { business_id: businessId, month: monthStart(now, 4), revenue: 42000, expenses: 33000, is_demo: true },
    { business_id: businessId, month: monthStart(now, 3), revenue: 47500, expenses: 34500, is_demo: true },
    { business_id: businessId, month: monthStart(now, 2), revenue: 51000, expenses: 36000, is_demo: true },
    { business_id: businessId, month: monthStart(now, 1), revenue: 54200, expenses: 37500, is_demo: true },
    { business_id: businessId, month: monthStart(now, 0), revenue: 58000, expenses: 38000, is_demo: true },
  ]

  // ── Invoices (4) ────────────────────────────────────────────────────────

  const invoices = [
    { business_id: businessId, invoice_number: 'INV-2026-001', company: 'Greenfield Academy', amount: 42000, due_date: isoDate(addDays(now, 15)), status: 'unpaid', is_demo: true },
    { business_id: businessId, invoice_number: 'INV-2026-002', company: 'Bramble Hill Trust', amount: 8200, due_date: isoDate(addDays(now, -20)), status: 'overdue', is_demo: true },
    { business_id: businessId, invoice_number: 'INV-2026-003', company: 'Oakridge Schools Ltd', amount: 28000, due_date: isoDate(addDays(now, 30)), status: 'unpaid', is_demo: true },
    { business_id: businessId, invoice_number: 'INV-2026-004', company: 'Whitestone College', amount: 12400, due_date: isoDate(addDays(now, -34)), status: 'overdue', is_demo: true },
  ]

  // ── Tasks (6) ───────────────────────────────────────────────────────────

  const tasks = [
    { business_id: businessId, title: 'Review and respond to Bramble Hill invoice dispute', description: 'They queried the September charge. Email from George Harrison at 11pm.', due: '12:00', priority: 'critical', category: 'Finance', source: 'lumio', assignee: 'George Harrison', done: false, overdue: false, is_demo: true },
    { business_id: businessId, title: 'Finalise testing guide sign-off', description: 'Phase 5 review due today. 13 flagged gaps to resolve.', due: '14:00', priority: 'high', category: 'Operations', source: 'notion', assignee: 'Arron Margeison', done: false, overdue: false, is_demo: true },
    { business_id: businessId, title: 'Send investor deck to Marcus', description: 'Promised by end of day.', due: '17:00', priority: 'high', category: 'Finance', source: 'manual', assignee: 'Arron Margeison', done: false, overdue: false, is_demo: true },
    { business_id: businessId, title: 'Approve payroll pack for review', description: 'HR-07 generated the pack. Needs sign-off before Friday.', due: '16:00', priority: 'medium', category: 'HR', source: 'workflow', assignee: 'Sarah Mitchell', done: false, overdue: false, linked_workflow: 'HR-07', is_demo: true },
    { business_id: businessId, title: 'Update Calendly link in nav buttons', description: 'Currently showing placeholder URL.', due: 'Any time', priority: 'medium', category: 'Tech', source: 'manual', assignee: 'Priya Kapoor', done: false, overdue: false, is_demo: true },
    { business_id: businessId, title: 'Register Lumio Ltd at Companies House', description: 'Required before signing any customer contracts. £12 online, instant.', due: 'Any time', priority: 'high', category: 'Legal', source: 'manual', assignee: 'Arron Margeison', done: false, overdue: false, is_demo: true },
  ]

  // ── Compliance logs (3) ─────────────────────────────────────────────────

  const complianceLogs = [
    { business_id: businessId, log_type: 'gdpr', title: 'GDPR data retention audit — Q1', description: 'Quarterly review of data retention policies. All customer data reviewed and purged where retention period exceeded. 47 records archived.', severity: 'medium', status: 'resolved', reported_by: 'Alexander Jones', reported_at: addDays(now, -30).toISOString(), resolved_at: addDays(now, -25).toISOString(), is_demo: true },
    { business_id: businessId, log_type: 'health_safety', title: 'Office H&S inspection due', description: 'Annual health and safety inspection for Lumio HQ, Shoreditch. Fire extinguisher check and DSE assessment overdue.', severity: 'low', status: 'open', reported_by: 'Sarah Mitchell', reported_at: addDays(now, -5).toISOString(), is_demo: true },
    { business_id: businessId, log_type: 'data_breach', title: 'Data processing agreement review — Xero', description: 'DPA with Xero needs reviewing following their updated terms. Legal review in progress.', severity: 'high', status: 'in_progress', reported_by: 'George Harrison', reported_at: addDays(now, -10).toISOString(), is_demo: true },
  ]

  // ── HR onboardings (new starters) ──────────────────────────────────────

  const onboardings = [
    { business_id: businessId, first_name: 'Priya', last_name: 'Kapoor', job_title: 'Frontend Developer', department: 'Engineering', start_date: '2025-03-17', manager: 'Alexander Jones', equipment: ['MacBook Pro', 'Monitor'], software: ['VS Code', 'Figma', 'Slack'], status: 'In Progress', is_demo: true },
    { business_id: businessId, first_name: 'Tom', last_name: 'Ashworth', job_title: 'Marketing Executive', department: 'Marketing', start_date: '2025-03-17', manager: 'Sophia Brown', equipment: ['MacBook Air'], software: ['HubSpot', 'Canva', 'Slack'], status: 'In Progress', is_demo: true },
    { business_id: businessId, first_name: 'James', last_name: 'Okafor', job_title: 'Sales Development Rep', department: 'Sales', start_date: '2025-03-03', manager: 'Oliver Bennett', equipment: ['MacBook Air', 'Headset'], software: ['HubSpot', 'Slack', 'Zoom'], status: 'In Progress', is_demo: true },
    { business_id: businessId, first_name: 'Fatima', last_name: 'Al-Hassan', job_title: 'Data Analyst', department: 'Engineering', start_date: isoDate(addDays(now, 25)), manager: 'Alexander Jones', equipment: ['MacBook Pro', 'Monitor'], software: ['Python', 'Jupyter', 'Slack'], status: 'Pending', is_demo: true },
    { business_id: businessId, first_name: 'Liam', last_name: 'Brennan', job_title: 'Head of Partnerships', department: 'Sales', start_date: isoDate(addDays(now, 11)), manager: 'Arron Margeison', equipment: ['MacBook Pro'], software: ['HubSpot', 'Slack', 'Notion'], status: 'Pending', is_demo: true },
  ]

  // ── HR leave requests ──────────────────────────────────────────────────

  const leaveRequests = [
    { business_id: businessId, employee_name: 'Sophia Brown', leave_type: 'Annual Leave', start_date: isoDate(addDays(now, -3)), end_date: isoDate(addDays(now, 1)), total_days: 5, covering_colleague: 'Tom Ashworth', status: 'Approved', is_demo: true },
    { business_id: businessId, employee_name: 'Charlotte Davies', leave_type: 'Annual Leave', start_date: isoDate(addDays(now, 10)), end_date: isoDate(addDays(now, 14)), total_days: 5, covering_colleague: 'Oliver Bennett', status: 'Pending', is_demo: true },
    { business_id: businessId, employee_name: 'Alexander Jones', leave_type: 'Sick Leave', start_date: isoDate(addDays(now, -1)), end_date: isoDate(addDays(now, -1)), total_days: 1, status: 'Approved', is_demo: true },
    { business_id: businessId, employee_name: 'Priya Kapoor', leave_type: 'Annual Leave', start_date: isoDate(addDays(now, 20)), end_date: isoDate(addDays(now, 24)), total_days: 5, status: 'Pending', is_demo: true },
  ]

  // ── HR performance reviews ─────────────────────────────────────────────

  const performanceReviews = [
    { business_id: businessId, employee_name: 'James Okafor', job_title: 'Sales Development Rep', department: 'Sales', manager: 'Oliver Bennett', review_type: 'Probation', due_date: isoDate(addDays(now, 7)), review_period: 'First 3 months', self_assessment: true, peer_feedback: false, status: 'In Progress', is_demo: true },
    { business_id: businessId, employee_name: 'Priya Kapoor', job_title: 'Frontend Developer', department: 'Engineering', manager: 'Alexander Jones', review_type: 'Probation', due_date: isoDate(addDays(now, 14)), review_period: 'First 3 months', self_assessment: true, peer_feedback: true, peer_reviewers: 'Tom Ashworth', status: 'In Progress', is_demo: true },
    { business_id: businessId, employee_name: 'Tom Ashworth', job_title: 'Marketing Executive', department: 'Marketing', manager: 'Sophia Brown', review_type: 'Probation', due_date: isoDate(addDays(now, 14)), review_period: 'First 3 months', self_assessment: true, peer_feedback: false, status: 'Pending', is_demo: true },
  ]

  // ── CRM deals (10) ─────────────────────────────────────────────────────

  const deals = [
    { business_id: businessId, company: 'Greenfield Academy', value_annual: 42000, stage: 'closing', heat: 'hot', owner: 'Oliver Bennett', next_action: 'Send contract', next_action_date: isoDate(addDays(now, 2)), is_demo: true },
    { business_id: businessId, company: 'Hopscotch Learning', value_annual: 28500, stage: 'proposal', heat: 'warm', owner: 'Charlotte Davies', next_action: 'Follow up on proposal', next_action_date: isoDate(addDays(now, 3)), is_demo: true },
    { business_id: businessId, company: 'Bramble Hill Trust', value_annual: 76000, stage: 'qualified', heat: 'warm', owner: 'Oliver Bennett', next_action: 'Schedule discovery call', next_action_date: isoDate(addDays(now, 1)), is_demo: true },
    { business_id: businessId, company: 'Crestview Academy', value_annual: 19200, stage: 'proposal', heat: 'warm', owner: 'James Okafor', next_action: 'Send revised pricing', next_action_date: isoDate(addDays(now, 4)), is_demo: true },
    { business_id: businessId, company: 'Oakridge Schools Ltd', value_annual: 55000, stage: 'closing', heat: 'hot', owner: 'Charlotte Davies', next_action: 'Demo follow-up', next_action_date: isoDate(addDays(now, 1)), is_demo: true },
    { business_id: businessId, company: 'Elmfield Institute', value_annual: 33400, stage: 'qualified', heat: 'cold', owner: 'James Okafor', next_action: 'Re-engage contact', next_action_date: isoDate(addDays(now, 5)), is_demo: true },
    { business_id: businessId, company: 'Whitestone College', value_annual: 91000, stage: 'won', heat: 'hot', owner: 'Oliver Bennett', won_at: addDays(now, -2).toISOString(), is_demo: true },
    { business_id: businessId, company: 'Sunfield Trust', value_annual: 14800, stage: 'proposal', heat: 'warm', owner: 'Charlotte Davies', next_action: 'Send case study', next_action_date: isoDate(addDays(now, 3)), is_demo: true },
    { business_id: businessId, company: 'Pinebrook Primary', value_annual: 22000, stage: 'lost', heat: 'cold', owner: 'James Okafor', lost_at: addDays(now, -7).toISOString(), lost_reason: 'Chose competitor — budget constraints', is_demo: true },
    { business_id: businessId, company: 'Riverdale Education', value_annual: 48000, stage: 'qualified', heat: 'warm', owner: 'Oliver Bennett', next_action: 'Book discovery call', next_action_date: isoDate(addDays(now, 2)), is_demo: true },
  ]

  return {
    employees,
    meetings,
    financeMonthly,
    invoices,
    tasks,
    complianceLogs,
    onboardings,
    leaveRequests,
    performanceReviews,
    deals,
  }
}

/** All tables that hold demo data, used by both load and clear */
export const DEMO_TABLES = [
  'business_employees',
  'business_meetings',
  'business_finance_monthly',
  'business_invoices',
  'business_tasks',
  'business_compliance_logs',
  'hr_onboardings',
  'hr_leave_requests',
  'hr_performance_reviews',
  'crm_deals',
] as const
