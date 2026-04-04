'use client'

import { X, Users, Target, Calendar, Hash, Briefcase } from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

interface Person { name: string; role: string; email: string; status: 'Active' | 'Away' | 'Remote' }
interface Role { title: string; desc: string }
interface Priority { title: string; due: string; level: 'Critical' | 'High' | 'Medium'; status: string }
interface DeptData { manager: string; size: number; team: Person[]; roles: Role[]; priorities: Priority[]; budget: string; tools: string; okrs: string; cadence: string; slack: string }

const DATA: Record<string, DeptData> = {
  overview: { manager: 'James Hartley', size: 187, team: [{ name: 'James Hartley', role: 'CEO', email: 'james@company.com', status: 'Active' }, { name: 'Sophie Williams', role: 'COO', email: 'sophie@company.com', status: 'Active' }, { name: 'James Okafor', role: 'CTO', email: 'james@company.com', status: 'Remote' }], roles: [{ title: 'CEO', desc: 'Company strategy, investor relations, and executive leadership' }, { title: 'COO', desc: 'Day-to-day operations, process optimisation, and team coordination' }], priorities: [{ title: 'Q2 planning finalisation', due: '4 Apr', level: 'Critical', status: 'In Progress' }, { title: 'Board deck preparation', due: '10 Apr', level: 'High', status: 'Not Started' }, { title: 'All-hands meeting prep', due: '7 Apr', level: 'Medium', status: 'In Progress' }], budget: '£2.4M', tools: 'Lumio, Slack, Notion, Google Workspace', okrs: 'Grow ARR to £600k, Launch 3 new departments', cadence: 'Weekly leadership standup Mon 9am', slack: '#leadership' },
  insights: { manager: 'Priya Kapoor', size: 4, team: [{ name: 'Priya Kapoor', role: 'Head of Data', email: 'priya@company.com', status: 'Active' }, { name: 'Daniel Clarke', role: 'Data Analyst', email: 'daniel@company.com', status: 'Active' }], roles: [{ title: 'Head of Data', desc: 'Data strategy, pipeline architecture, and reporting frameworks' }, { title: 'Data Analyst', desc: 'Dashboard creation, metric tracking, and ad-hoc analysis' }], priorities: [{ title: 'Q1 board report', due: '5 Apr', level: 'Critical', status: 'In Progress' }, { title: 'New KPI dashboard', due: '12 Apr', level: 'High', status: 'In Progress' }], budget: '£120k', tools: 'Lumio, Snowflake, Metabase, dbt', okrs: 'Reduce report turnaround to <2hrs, 100% dept coverage', cadence: 'Bi-weekly data review Wed 2pm', slack: '#data-insights' },
  hr: { manager: 'Charlotte Davies', size: 6, team: [{ name: 'Charlotte Davies', role: 'Head of People', email: 'charlotte@company.com', status: 'Active' }, { name: 'Marcus Reid', role: 'HR Manager', email: 'marcus@company.com', status: 'Active' }, { name: 'Nadia Petrov', role: 'Recruitment Lead', email: 'nadia@company.com', status: 'Away' }, { name: 'Tom Ashworth', role: 'People Ops', email: 'tom@company.com', status: 'Remote' }], roles: [{ title: 'Head of People', desc: 'HR strategy, culture, and compliance oversight' }, { title: 'HR Manager', desc: 'Onboarding, leave management, and performance reviews' }, { title: 'Recruitment Lead', desc: 'Talent acquisition, job postings, and interview coordination' }], priorities: [{ title: '3 new starter onboardings', due: '7 Apr', level: 'Critical', status: 'In Progress' }, { title: 'Quarterly performance reviews', due: '15 Apr', level: 'High', status: 'Not Started' }, { title: 'GDPR audit', due: '30 Apr', level: 'Medium', status: 'Planned' }], budget: '£280k', tools: 'Lumio, BambooHR, DocuSign, Slack', okrs: 'Reduce onboarding time to <3 days, 95% review completion', cadence: 'Weekly HR standup Tue 10am', slack: '#people-team' },
  accounts: { manager: 'Oliver Chen', size: 5, team: [{ name: 'Oliver Chen', role: 'Finance Director', email: 'oliver@company.com', status: 'Active' }, { name: 'Rachel Evans', role: 'Accounts Manager', email: 'rachel@company.com', status: 'Active' }, { name: 'Ben Gallagher', role: 'Bookkeeper', email: 'ben@company.com', status: 'Remote' }], roles: [{ title: 'Finance Director', desc: 'Financial strategy, budgeting, and reporting to board' }, { title: 'Accounts Manager', desc: 'Invoicing, collections, and supplier payments' }], priorities: [{ title: 'Month-end close', due: '2 Apr', level: 'Critical', status: 'In Progress' }, { title: 'VAT return submission', due: '7 Apr', level: 'High', status: 'Not Started' }, { title: 'Annual audit prep', due: '30 Apr', level: 'Medium', status: 'Planned' }], budget: '£180k', tools: 'Lumio, Xero, Stripe, GoCardless', okrs: 'Reduce debtor days to <20, 100% invoice automation', cadence: 'Weekly finance review Mon 11am', slack: '#finance' },
  sales: { manager: 'James Okafor', size: 8, team: [{ name: 'James Okafor', role: 'VP Sales', email: 'james@company.com', status: 'Active' }, { name: 'Sophie Williams', role: 'Senior AE', email: 'sophie@company.com', status: 'Active' }, { name: 'Liam Brennan', role: 'SDR', email: 'liam@company.com', status: 'Active' }, { name: 'Emily Clarke', role: 'SDR', email: 'emily@company.com', status: 'Remote' }], roles: [{ title: 'VP Sales', desc: 'Revenue targets, team leadership, and pipeline strategy' }, { title: 'Account Executive', desc: 'Deal qualification, demos, and contract negotiation' }, { title: 'SDR', desc: 'Outbound prospecting, lead qualification, and meeting booking' }], priorities: [{ title: 'Q1 revenue target close', due: '31 Mar', level: 'Critical', status: 'In Progress' }, { title: 'Pipeline review', due: '3 Apr', level: 'High', status: 'Scheduled' }, { title: 'New territory planning', due: '15 Apr', level: 'Medium', status: 'Not Started' }], budget: '£420k', tools: 'Lumio CRM, Calendly, Loom, LinkedIn Sales Nav', okrs: 'Close £150k new ARR, 40% win rate', cadence: 'Daily standup 9:15am, Weekly forecast Fri 2pm', slack: '#sales' },
  crm: { manager: 'Sophie Williams', size: 4, team: [{ name: 'Sophie Williams', role: 'CRM Lead', email: 'sophie@company.com', status: 'Active' }, { name: 'Chris Ogunleye', role: 'CRM Analyst', email: 'chris@company.com', status: 'Active' }], roles: [{ title: 'CRM Lead', desc: 'CRM strategy, data quality, and automation rules' }, { title: 'CRM Analyst', desc: 'Pipeline reporting, contact enrichment, and deal tracking' }], priorities: [{ title: 'Data cleanup sprint', due: '8 Apr', level: 'High', status: 'In Progress' }, { title: 'ARIA model retraining', due: '15 Apr', level: 'Medium', status: 'Planned' }], budget: '£90k', tools: 'Lumio CRM, Clearbit, HubSpot (migrating)', okrs: '95% data accuracy, <5min lead response time', cadence: 'Weekly CRM review Thu 11am', slack: '#crm' },
  marketing: { manager: 'Amara Diallo', size: 5, team: [{ name: 'Amara Diallo', role: 'Head of Marketing', email: 'amara@company.com', status: 'Active' }, { name: 'Yuki Tanaka', role: 'Content Manager', email: 'yuki@company.com', status: 'Active' }, { name: 'Fatima Al-Hassan', role: 'Digital Marketing', email: 'fatima@company.com', status: 'Remote' }], roles: [{ title: 'Head of Marketing', desc: 'Brand strategy, campaigns, and marketing ops' }, { title: 'Content Manager', desc: 'Blog, case studies, social media, and SEO' }], priorities: [{ title: 'Q2 campaign launch', due: '5 Apr', level: 'Critical', status: 'In Progress' }, { title: 'Website refresh', due: '20 Apr', level: 'High', status: 'In Progress' }, { title: 'Case study: Oakridge Schools', due: '12 Apr', level: 'Medium', status: 'Drafting' }], budget: '£310k', tools: 'Lumio, Mailchimp, Canva, Google Ads, LinkedIn', okrs: '200 MQLs/month, 35% email open rate', cadence: 'Weekly marketing sync Mon 2pm', slack: '#marketing' },
  trials: { manager: 'Liam Brennan', size: 3, team: [{ name: 'Liam Brennan', role: 'Trials Manager', email: 'liam@company.com', status: 'Active' }, { name: 'Emily Clarke', role: 'Trial Success', email: 'emily@company.com', status: 'Active' }], roles: [{ title: 'Trials Manager', desc: 'Trial provisioning, conversion tracking, and engagement scoring' }, { title: 'Trial Success', desc: 'Day-3 and day-7 check-ins, demo booking, and conversion calls' }], priorities: [{ title: '5 trials expiring this week', due: '4 Apr', level: 'Critical', status: 'Active' }, { title: 'Conversion playbook update', due: '10 Apr', level: 'Medium', status: 'In Progress' }], budget: '£60k', tools: 'Lumio, Intercom, Calendly', okrs: '65% trial-to-paid conversion, <8s provisioning', cadence: 'Daily trial review 9:30am', slack: '#trials' },
  operations: { manager: 'Tom Ashworth', size: 4, team: [{ name: 'Tom Ashworth', role: 'Ops Manager', email: 'tom@company.com', status: 'Active' }, { name: 'Ben Gallagher', role: 'Procurement', email: 'ben@company.com', status: 'Active' }], roles: [{ title: 'Ops Manager', desc: 'Process design, supply chain, and vendor management' }, { title: 'Procurement', desc: 'Purchase orders, stock management, and supplier relations' }], priorities: [{ title: 'Overdue PO follow-up', due: '2 Apr', level: 'Critical', status: 'In Progress' }, { title: 'Q2 stock forecast', due: '8 Apr', level: 'High', status: 'Not Started' }, { title: 'Supplier contract renewals', due: '30 Apr', level: 'Medium', status: 'Planned' }], budget: '£150k', tools: 'Lumio, Notion, Xero, Royal Mail', okrs: 'Zero stockouts, <24hr PO turnaround', cadence: 'Weekly ops review Wed 10am', slack: '#operations' },
  support: { manager: 'Chris Ogunleye', size: 6, team: [{ name: 'Chris Ogunleye', role: 'Head of Support', email: 'chris@company.com', status: 'Active' }, { name: 'Amara Diallo', role: 'Support Lead', email: 'amara@company.com', status: 'Active' }, { name: 'Yuki Tanaka', role: 'Support Engineer', email: 'yuki@company.com', status: 'Active' }, { name: 'Rachel Evans', role: 'Support Engineer', email: 'rachel@company.com', status: 'Remote' }], roles: [{ title: 'Head of Support', desc: 'SLA management, team scheduling, and escalation handling' }, { title: 'Support Engineer', desc: 'Ticket resolution, live chat, and knowledge base maintenance' }], priorities: [{ title: 'SLA breach on SUP-0306', due: 'Today', level: 'Critical', status: 'Escalated' }, { title: 'KB article backlog (8 articles)', due: '10 Apr', level: 'High', status: 'In Progress' }, { title: 'CSAT survey analysis', due: '5 Apr', level: 'Medium', status: 'Planned' }], budget: '£220k', tools: 'Lumio, Zendesk, Intercom, Slack', okrs: '95% CSAT, <2hr avg response, 50% auto-resolution', cadence: 'Daily standup 9am, Weekly review Fri 11am', slack: '#support' },
  success: { manager: 'Sophie Williams', size: 4, team: [{ name: 'Sophie Williams', role: 'CS Lead', email: 'sophie@company.com', status: 'Active' }, { name: 'Marcus Reid', role: 'CSM', email: 'marcus@company.com', status: 'Active' }, { name: 'Nadia Petrov', role: 'CSM', email: 'nadia@company.com', status: 'Away' }], roles: [{ title: 'CS Lead', desc: 'Customer health scoring, renewal strategy, and upsell tracking' }, { title: 'CSM', desc: 'Account management, QBRs, and proactive outreach' }], priorities: [{ title: '4 at-risk accounts', due: 'Ongoing', level: 'Critical', status: 'Active' }, { title: 'Q1 QBR completion', due: '10 Apr', level: 'High', status: 'In Progress' }, { title: 'NPS survey launch', due: '15 Apr', level: 'Medium', status: 'Planned' }], budget: '£180k', tools: 'Lumio, ChurnZero, Slack, Loom', okrs: '95% renewal rate, NPS >60, <5% churn', cadence: 'Weekly CS review Tue 2pm', slack: '#customer-success' },
  it: { manager: 'Daniel Clarke', size: 4, team: [{ name: 'Daniel Clarke', role: 'IT Manager', email: 'daniel@company.com', status: 'Active' }, { name: 'Fatima Al-Hassan', role: 'SysAdmin', email: 'fatima@company.com', status: 'Active' }, { name: 'Liam Brennan', role: 'IT Support', email: 'liam@company.com', status: 'Active' }], roles: [{ title: 'IT Manager', desc: 'Infrastructure, security, and licence management' }, { title: 'SysAdmin', desc: 'Server management, access provisioning, and backups' }], priorities: [{ title: 'GitHub licence renewal', due: '1 Apr', level: 'Critical', status: 'Pending' }, { title: 'Quarterly access review', due: '8 Apr', level: 'High', status: 'Not Started' }, { title: 'MFA rollout completion', due: '15 Apr', level: 'Medium', status: 'In Progress' }], budget: '£160k', tools: 'Lumio, GitHub, Linear, 1Password, Cloudflare', okrs: 'Zero security incidents, <2min provisioning', cadence: 'Weekly IT review Thu 10am', slack: '#it-systems' },
  workflows: { manager: 'Priya Kapoor', size: 3, team: [{ name: 'Priya Kapoor', role: 'Automation Lead', email: 'priya@company.com', status: 'Active' }, { name: 'James Okafor', role: 'Workflow Engineer', email: 'james@company.com', status: 'Remote' }], roles: [{ title: 'Automation Lead', desc: 'Workflow design, n8n management, and integration architecture' }, { title: 'Workflow Engineer', desc: 'Building, testing, and monitoring automated workflows' }], priorities: [{ title: '5 new workflows this sprint', due: '8 Apr', level: 'High', status: 'In Progress' }, { title: 'Error rate reduction', due: '15 Apr', level: 'Medium', status: 'Planned' }], budget: '£80k', tools: 'Lumio, n8n, Supabase, Vercel', okrs: '50+ active workflows, <1% error rate', cadence: 'Sprint planning Mon 10am', slack: '#workflows' },
  partners: { manager: 'James Hartley', size: 2, team: [{ name: 'James Hartley', role: 'Partnerships Lead', email: 'james@company.com', status: 'Active' }], roles: [{ title: 'Partnerships Lead', desc: 'Partner acquisition, contract negotiation, and joint go-to-market' }], priorities: [{ title: 'DfE quarterly review', due: '15 Apr', level: 'High', status: 'Scheduled' }, { title: 'RGR integration kickoff', due: '1 May', level: 'Medium', status: 'Planned' }], budget: '£50k', tools: 'Lumio, Notion, DocuSign', okrs: '3 active partners, 1 new integration/quarter', cadence: 'Fortnightly partner sync', slack: '#partnerships' },
  strategy: { manager: 'James Hartley', size: 2, team: [{ name: 'James Hartley', role: 'Strategy Lead', email: 'james@company.com', status: 'Active' }, { name: 'Sophie Williams', role: 'Market Analyst', email: 'sophie@company.com', status: 'Active' }], roles: [{ title: 'Strategy Lead', desc: 'Competitive intelligence, market positioning, and pricing strategy' }, { title: 'Market Analyst', desc: 'Competitor monitoring, signal analysis, and threat assessment' }], priorities: [{ title: 'HubSpot pricing response', due: '5 Apr', level: 'Critical', status: 'In Progress' }, { title: 'Q2 positioning update', due: '15 Apr', level: 'High', status: 'Planned' }], budget: '£40k', tools: 'Lumio, G2, Capterra, LinkedIn', okrs: 'Monthly competitor brief, pricing review quarterly', cadence: 'Weekly strategy review Wed 3pm', slack: '#strategy' },
  projects: { manager: 'Tom Ashworth', size: 3, team: [{ name: 'Tom Ashworth', role: 'Project Lead', email: 'tom@company.com', status: 'Active' }, { name: 'Emily Clarke', role: 'Project Coordinator', email: 'emily@company.com', status: 'Active' }], roles: [{ title: 'Project Lead', desc: 'Project planning, resource allocation, and delivery oversight' }, { title: 'Project Coordinator', desc: 'Task tracking, stakeholder updates, and timeline management' }], priorities: [{ title: 'CRM v2 launch', due: '10 Apr', level: 'Critical', status: 'In Progress' }, { title: 'Website redesign', due: '30 Apr', level: 'High', status: 'In Progress' }, { title: 'API documentation', due: '20 Apr', level: 'Medium', status: 'Planned' }], budget: '£100k', tools: 'Lumio, Linear, Notion, Figma', okrs: '90% on-time delivery, <10% scope creep', cadence: 'Sprint review Fri 3pm', slack: '#projects' },
  settings: { manager: 'James Hartley', size: 0, team: [], roles: [], priorities: [], budget: '—', tools: 'Lumio', okrs: '—', cadence: '—', slack: '#general' },
}

const DEPT_LABELS: Record<string, string> = {
  overview: 'Overview', insights: 'Insights', hr: 'HR & People', accounts: 'Accounts',
  sales: 'Sales', crm: 'CRM', marketing: 'Marketing', trials: 'Trials',
  operations: 'Operations', support: 'Support', success: 'Customer Success',
  it: 'IT & Systems', workflows: 'Workflows Library', partners: 'Partners',
  strategy: 'Strategy', projects: 'Projects', settings: 'Settings',
}

const LEVEL_COLORS: Record<string, { color: string; bg: string }> = {
  Critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  High:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  Medium:   { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ImportedStaff { first_name?: string; last_name?: string; email?: string; job_title?: string; department?: string; phone?: string }

const DEPT_MATCH_PATTERNS: Record<string, RegExp> = {
  hr:         /\b(hr|human resources|people)\b/i,
  marketing:  /\b(marketing|comms|communications)\b/i,
  sales:      /\b(sales|business development)\b/i,
  accounts:   /\b(accounts|finance|accounting)\b/i,
  operations: /\b(operations|ops)\b/i,
  it:         /\b(it|tech|technology|systems|engineering)\b/i,
  success:    /\b(success|customer success)\b/i,
  support:    /\b(support|helpdesk|service desk)\b/i,
  strategy:   /\b(strategy|leadership)\b/i,
  crm:        /\b(crm|customer relationship)\b/i,
  trials:     /\b(trials|growth)\b/i,
  partners:   /\b(partner|partnerships)\b/i,
  projects:   /\b(project|pmo)\b/i,
  workflows:  /\b(workflow|automation)\b/i,
  insights:   /\b(data|analytics|insights)\b/i,
}

function filterStaffByDept(staff: ImportedStaff[], dept: string): ImportedStaff[] {
  const pattern = DEPT_MATCH_PATTERNS[dept]
  if (!pattern) return staff
  return staff.filter(s => s.department && pattern.test(s.department))
}

function groupStaffByDept(staff: ImportedStaff[]): Record<string, ImportedStaff[]> {
  const groups: Record<string, ImportedStaff[]> = {}
  for (const s of staff) {
    const dept = s.department || 'Other'
    if (!groups[dept]) groups[dept] = []
    groups[dept].push(s)
  }
  return groups
}

export default function DeptInfoModal({ dept, onClose, onViewTeam, importedStaff, isDirectorUser, demoDataActive }: {
  dept: string; onClose: () => void; onViewTeam?: () => void
  importedStaff?: ImportedStaff[]; isDirectorUser?: boolean; demoDataActive?: boolean
}) {
  const data = DATA[dept] || DATA.overview
  const label = DEPT_LABELS[dept] || dept
  const hasRealStaff = importedStaff && importedStaff.length > 0 && !demoDataActive
  const realDeptStaff = hasRealStaff ? (isDirectorUser ? importedStaff : filterStaffByDept(importedStaff!, dept)) : []
  const groupedStaff = hasRealStaff && isDirectorUser ? groupStaffByDept(importedStaff!) : null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              <Briefcase size={18} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{label}</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                {hasRealStaff
                  ? `${isDirectorUser ? importedStaff!.length : realDeptStaff.length} people${isDirectorUser ? ' across all departments' : ' in this department'}`
                  : `Managed by ${data.manager} · ${data.size} people`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Team — real staff when available, demo data otherwise */}
          {hasRealStaff ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F9FAFB' }}><Users size={14} style={{ color: '#0D9488' }} /> Team</h3>
                <span className="text-xs" style={{ color: '#6B7280' }}>{isDirectorUser ? `${importedStaff!.length} people across all departments` : `${realDeptStaff.length} people in this department`}</span>
              </div>
              {groupedStaff ? (
                /* Director view: grouped by department */
                Object.entries(groupedStaff).map(([deptName, members]) => (
                  <div key={deptName} className="mb-4">
                    <p className="text-xs font-semibold mb-2 px-1" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>{deptName.toUpperCase()}</p>
                    <div className="space-y-1.5">
                      {members.map((s, i) => {
                        const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown'
                        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
                        return (
                          <div key={`${s.email || i}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#07080F' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>{initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{name}</p>
                              <p className="text-xs truncate" style={{ color: '#6B7280' }}>{s.job_title || 'Team Member'}{s.email ? ` · ${s.email}` : ''}{s.phone ? ` · ${s.phone}` : ''}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : realDeptStaff.length > 0 ? (
                <div className="space-y-2">
                  {realDeptStaff.map((s, i) => {
                    const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown'
                    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
                    return (
                      <div key={`${s.email || i}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#07080F' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{name}</p>
                          <p className="text-xs truncate" style={{ color: '#6B7280' }}>{s.job_title || 'Team Member'}{s.email ? ` · ${s.email}` : ''}{s.phone ? ` · ${s.phone}` : ''}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: '#6B7280' }}>No staff in this department yet</p>
              )}
            </div>
          ) : data.team.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#F9FAFB' }}><Users size={14} style={{ color: '#0D9488' }} /> Team</h3>
                {onViewTeam && <button onClick={() => { onClose(); onViewTeam() }} className="text-xs font-medium" style={{ color: '#0D9488' }}>View in Org Chart →</button>}
              </div>
              <div className="space-y-2">
                {data.team.map(p => (
                  <div key={p.email} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#07080F' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>{p.name.split(' ').map(w => w[0]).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{p.name}</p>
                      <p className="text-xs truncate" style={{ color: '#6B7280' }}>{p.role} · {p.email}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: p.status === 'Active' ? 'rgba(34,197,94,0.1)' : p.status === 'Away' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: p.status === 'Active' ? '#22C55E' : p.status === 'Away' ? '#F59E0B' : '#3B82F6' }}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Roles */}
          {data.roles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#F9FAFB' }}><Target size={14} style={{ color: '#0D9488' }} /> Roles & Responsibilities</h3>
              <div className="space-y-2">
                {data.roles.map(r => (
                  <div key={r.title} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#07080F' }}>
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priorities */}
          {data.priorities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#F9FAFB' }}><Calendar size={14} style={{ color: '#0D9488' }} /> Current Priorities</h3>
              <div className="space-y-2">
                {data.priorities.map(p => {
                  const lc = LEVEL_COLORS[p.level] || LEVEL_COLORS.Medium
                  return (
                    <div key={p.title} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#07080F' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Due: {p.due} · {p.status}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: lc.bg, color: lc.color }}>{p.level}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Department Info */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#F9FAFB' }}><Hash size={14} style={{ color: '#0D9488' }} /> Department Info</h3>
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#07080F' }}>
              {[
                { label: 'Annual Budget', value: data.budget },
                { label: 'Key Tools', value: data.tools },
                { label: 'OKRs This Quarter', value: data.okrs },
                { label: 'Meeting Cadence', value: data.cadence },
                { label: 'Slack Channel', value: data.slack },
              ].map((row, i, arr) => (
                <div key={row.label} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: i < arr.length - 1 ? '1px solid #1F2937' : undefined }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{row.label}</span>
                  <span className="text-xs font-medium text-right" style={{ color: '#F9FAFB' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
