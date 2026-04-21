'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check, X, ArrowRight, Users, TrendingUp, Headphones,
  Activity, Megaphone, Server, DollarSign, ChevronRight,
  Sparkles, GitBranch, Zap, Monitor, FlaskConical, Package, Layers,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkflowStep = { label: string; detail?: string; ai?: boolean }

interface Workflow {
  name: string
  trigger: string
  steps: WorkflowStep[]
  outcome: string
}

interface Dept {
  label: string
  icon: React.ElementType
  color: string
  tagline: string
  workflows?: Workflow[]
  isInsights?: boolean
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PAIN_CARDS = [
  {
    icon: '🔗',
    before: 'New customer? Update 7 systems manually.',
    beforeDetail: 'CRM, billing, portal, email, onboarding doc, calendar, comms — each one by hand. Takes 45 minutes per customer. Someone always misses one.',
    after: 'Deal closed → everything done in 90 seconds.',
    afterSteps: [
      'CRM deal flips to Won',
      'Customer portal provisioned',
      'Product access granted',
      'Invoice raised in your accounting platform',
      'Welcome email sent automatically',
      'Team notified in Slack',
    ],
  },
  {
    icon: '👤',
    before: 'New joiner? Email IT, HR, and payroll separately.',
    beforeDetail: 'Three separate requests. Someone forgets to CC payroll. The account is set up on day 3. The new hire sits idle on day 1.',
    after: 'Name entered once → everything provisioned.',
    afterSteps: [
      'New hire added to HR system',
      'Microsoft 365 or Google Workspace account created',
      'Role-based access granted instantly',
      'Payroll entry created',
      'Training modules assigned',
      'Day-one welcome email sent',
    ],
  },
  {
    icon: '💸',
    before: 'Invoice unpaid? Chase by hand every 10 days.',
    beforeDetail: 'Copy the invoice. Find the contact. Write a polite-but-firm email. Hope you remembered to check your accounting platform. Repeat until paid or given up on.',
    after: 'Accounting platform flags it → Claude chases it → done.',
    afterSteps: [
      'Invoice flagged as overdue',
      'Customer payment history checked',
      'Claude drafts personalised chase email',
      'Tone adjusted by days overdue',
      'Sent automatically on schedule',
      'Payment logged and team notified',
    ],
  },
]

const DEPT_TABS: Dept[] = [
  {
    label: 'HR & People',
    icon: Users,
    color: '#0D9488',
    tagline: 'Automate the admin. Keep the human touch.',
    workflows: [
      {
        name: 'New Joiner Onboarding',
        trigger: 'New hire added to HR system',
        steps: [
          { label: 'Microsoft 365 or Google Workspace account created', detail: 'Name, role, department auto-filled' },
          { label: 'Collaboration tools access granted', detail: 'Role-based permissions applied' },
          { label: 'Payroll entry created', detail: 'Start date, salary, tax code set' },
          { label: 'Training modules assigned', detail: 'Based on role and department' },
          { label: 'Welcome email sent', ai: true, detail: 'Claude personalises to their role' },
          { label: 'Manager notified in Slack', detail: 'With checklist of what\'s done' },
        ],
        outcome: 'New hire is productive from day one. Zero IT tickets. Zero missed steps.',
      },
      {
        name: 'Leave Management',
        trigger: 'Employee submits leave request',
        steps: [
          { label: 'Request received and validated', detail: 'Checks remaining allowance automatically' },
          { label: 'Manager notified in Slack', detail: 'Approve or reject in one click' },
          { label: 'Calendar blocked on approval', detail: 'Synced to the team calendar' },
          { label: 'Payroll notified', detail: 'Leave record created' },
          { label: 'Cover arranged if needed', ai: true, detail: 'Claude drafts handover note' },
        ],
        outcome: 'Leave managed end-to-end. No spreadsheet. No back-and-forth email chains.',
      },
      {
        name: 'Offboarding',
        trigger: 'Leaver date confirmed in HR system',
        steps: [
          { label: 'Accounts scheduled for deactivation', detail: 'On their last day at 17:00' },
          { label: 'Equipment return flagged', detail: 'IT notified with asset list' },
          { label: 'Payroll end date set', detail: 'Final pay calculated' },
          { label: 'Exit survey sent', ai: true, detail: 'Claude personalises based on tenure' },
          { label: 'CRM contacts reassigned', detail: 'Accounts moved to new owner' },
        ],
        outcome: 'Clean, compliant offboarding every time. Nothing left open.',
      },
    ],
  },
  {
    label: 'Sales & CRM',
    icon: TrendingUp,
    color: '#6C3FC5',
    tagline: 'From first touch to renewal — automated.',
    workflows: [
      {
        name: 'New Customer Onboarding',
        trigger: 'CRM deal marked Won',
        steps: [
          { label: 'Customer portal provisioned', detail: 'Access credentials generated and sent' },
          { label: 'Product access granted', detail: 'Licence count matched to contract' },
          { label: 'Invoice raised', detail: 'Payment terms from deal data' },
          { label: 'Welcome email sent', ai: true, detail: 'Claude personalises to their use case' },
          { label: 'CS lead assigned', detail: 'Based on account tier' },
          { label: '30-day check-in scheduled', detail: 'Calendar invite sent automatically' },
        ],
        outcome: 'Customer is live in 90 seconds. No dropped balls. No awkward handoffs.',
      },
      {
        name: 'Lead Qualification',
        trigger: 'New lead captured via form or CRM',
        steps: [
          { label: 'Lead data pulled and enriched', detail: 'Company size, sector, source' },
          { label: 'Claude scores hot / warm / cold', ai: true, detail: 'Based on ICP criteria and intent signals' },
          { label: 'Hot leads routed to senior rep', detail: 'Slack alert sent immediately' },
          { label: 'Warm leads added to nurture', detail: 'Sequence starts within 5 minutes' },
          { label: 'Cold leads tagged for review', detail: 'Reviewed in weekly pipeline call' },
        ],
        outcome: 'Reps spend time on the right leads. Response time drops from hours to minutes.',
      },
      {
        name: 'Demo Follow-Up',
        trigger: 'Demo call ends (calendar event closes)',
        steps: [
          { label: 'Claude summarises call notes', ai: true, detail: 'Key pain points, next steps, objections' },
          { label: 'Follow-up email drafted', ai: true, detail: 'Personalised to discussion specifics' },
          { label: 'Rep reviews and approves', detail: 'Edit or send in one click' },
          { label: 'CRM deal stage updated', detail: 'Activity logged automatically' },
          { label: 'Next step task created', detail: 'Due date set from call notes' },
        ],
        outcome: 'Follow-up lands within 30 minutes of the call ending. Prospects feel heard.',
      },
      {
        name: 'Renewal Workflow',
        trigger: '90 days before contract end date',
        steps: [
          { label: 'Health score pulled', detail: 'RAG status, NPS, usage data' },
          { label: 'Rep alerted in Slack', detail: 'With account summary and risk flags' },
          { label: 'Renewal email drafted by Claude', ai: true, detail: 'Tone adjusted for health score' },
          { label: 'Renewal opportunity created in CRM', detail: 'With correct pipeline value' },
          { label: 'Follow-up sequence triggered', detail: 'If no response after 14 days' },
        ],
        outcome: 'No renewal sneaks up on you. At-risk accounts get early attention.',
      },
    ],
  },
  {
    label: 'Support',
    icon: Headphones,
    color: '#3B82F6',
    tagline: 'Faster resolution. Fewer escalations.',
    workflows: [
      {
        name: 'Ticket Triage',
        trigger: 'New support ticket received',
        steps: [
          { label: 'Ticket content analysed', ai: true, detail: 'Claude identifies category and urgency' },
          { label: 'Priority set automatically', detail: 'Critical / High / Medium / Low' },
          { label: 'Routed to the right agent', detail: 'Based on expertise and current load' },
          { label: 'SLA clock started', detail: 'Tracked against response commitments' },
          { label: 'Auto-acknowledgement sent', ai: true, detail: 'Personalised with expected resolution time' },
        ],
        outcome: 'Every ticket acknowledged in under 60 seconds. Right agent, right priority, every time.',
      },
      {
        name: 'AI Auto-Reply',
        trigger: 'Common question detected in new ticket',
        steps: [
          { label: 'Question matched to knowledge base', ai: true, detail: 'Claude checks docs, FAQs, past tickets' },
          { label: 'Confidence score assessed', detail: 'High → auto-send; Low → draft for agent' },
          { label: 'Answer drafted and sent', ai: true, detail: 'Tailored to customer\'s context' },
          { label: 'Ticket marked resolved if accepted', detail: 'Or escalated if rejected' },
        ],
        outcome: '40%+ of routine tickets resolved without agent involvement.',
      },
      {
        name: 'SLA Escalation',
        trigger: 'Response time approaching SLA limit',
        steps: [
          { label: 'SLA breach risk detected', detail: '80% of time elapsed with no response' },
          { label: 'Assigned agent alerted', detail: 'Slack DM with ticket link' },
          { label: 'Team lead notified if breached', detail: 'Escalation chain triggered automatically' },
          { label: 'Customer updated proactively', ai: true, detail: 'Claude drafts apology + updated ETA' },
          { label: 'Breach logged for reporting', detail: 'CSAT and SLA dashboard updated' },
        ],
        outcome: 'Breaches are caught before they happen. Customers never wait in silence.',
      },
    ],
  },
  {
    label: 'Customer Success',
    icon: Activity,
    color: '#EC4899',
    tagline: 'Spot churn early. Act before it\'s too late.',
    workflows: [
      {
        name: 'RAG Health Scoring',
        trigger: 'Daily at 06:00',
        steps: [
          { label: 'Usage data pulled', detail: 'Logins, feature adoption, session length' },
          { label: 'Support volume checked', detail: 'Ticket frequency and sentiment' },
          { label: 'NPS and CSAT pulled', detail: 'Last 30 days weighted' },
          { label: 'RAG score calculated', ai: true, detail: 'Claude weights factors by account tier' },
          { label: 'Dashboard updated', detail: 'CS lead sees changes highlighted' },
          { label: 'Red accounts trigger alert', detail: 'CS lead notified in Slack immediately' },
        ],
        outcome: 'No account turns Red without the team knowing. Intervention starts early.',
      },
      {
        name: 'Recovery Sequence',
        trigger: 'Account health turns Red',
        steps: [
          { label: 'CS lead alerted immediately', detail: 'Slack message with account summary' },
          { label: 'Root cause pulled', ai: true, detail: 'Claude identifies likely reason from data' },
          { label: 'Personalised recovery email drafted', ai: true, detail: 'Empathetic, solution-focused' },
          { label: 'Emergency check-in scheduled', detail: 'Calendar invite sent to customer' },
          { label: 'Recovery plan document created', ai: true, detail: 'Specific to their situation' },
        ],
        outcome: 'Red accounts get a structured recovery plan within hours of the signal.',
      },
    ],
  },
  {
    label: 'Accounts',
    icon: DollarSign,
    color: '#F59E0B',
    tagline: 'Get paid faster. Know exactly where you stand.',
    workflows: [
      {
        name: 'Invoice Chasing',
        trigger: 'Invoice overdue in your accounting platform',
        steps: [
          { label: 'Invoice flagged as overdue', detail: 'Day 1, 10, 20 triggers set' },
          { label: 'Customer payment history checked', detail: 'Tone adjusted based on record' },
          { label: 'Chase email drafted by Claude', ai: true, detail: 'Personalised, not templated' },
          { label: 'Finance team reviews in one click', detail: 'Approve or edit before sending' },
          { label: 'Sent automatically on schedule', detail: 'Escalates to phone call at day 30' },
        ],
        outcome: 'Invoices chased consistently. Average debtor days cut by 30%.',
      },
      {
        name: 'Weekly Finance Report',
        trigger: 'Every Monday at 08:00',
        steps: [
          { label: 'Billing data pulled', detail: 'Revenue, outstanding invoices, overdue' },
          { label: 'MRR and ARR calculated', detail: 'Compared to prior week and month' },
          { label: 'Report generated by Claude', ai: true, detail: 'Plain-English summary with key flags' },
          { label: 'Sent to leadership in Slack', detail: '#finance channel with PDF attached' },
        ],
        outcome: 'Leadership knows the financial position every Monday morning. Automatically.',
      },
    ],
  },
  {
    label: 'IT & Systems',
    icon: Server,
    color: '#22C55E',
    tagline: 'Zero-ticket IT. Everything provisioned automatically.',
    workflows: [
      {
        name: 'Equipment Provisioning',
        trigger: 'New hire confirmed in HR system',
        steps: [
          { label: 'Equipment requirements checked', detail: 'Based on role and location' },
          { label: 'Order placed with supplier', detail: 'Automated purchase order generated' },
          { label: 'Delivery tracked', detail: 'Tracking number logged in asset register' },
          { label: 'Setup checklist sent', detail: 'New hire guided through device setup' },
        ],
        outcome: 'Laptop arrives on day one. No IT ticket needed.',
      },
      {
        name: 'Access Management',
        trigger: 'Role change or department transfer confirmed',
        steps: [
          { label: 'Role change detected in HR', detail: 'Old and new role compared' },
          { label: 'Microsoft 365 / Google permissions updated', detail: 'New groups added, old removed' },
          { label: 'Old access revoked', detail: 'Logged and timestamped for compliance' },
          { label: 'Audit log updated', detail: 'Full trail for GDPR and IT governance' },
        ],
        outcome: 'Access is always right. No stale permissions. No security gaps.',
      },
    ],
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    color: '#F97316',
    tagline: 'More pipeline. Less manual reporting.',
    workflows: [
      {
        name: 'MQL Handoff to Sales',
        trigger: 'Lead reaches MQL score threshold',
        steps: [
          { label: 'Lead score threshold hit', detail: 'Content, page visits, email opens' },
          { label: 'Lead enriched automatically', detail: 'Company size, sector, role verified' },
          { label: 'Claude writes sales brief', ai: true, detail: 'Key signals and recommended opener' },
          { label: 'Rep assigned and alerted in Slack', detail: 'With brief and public profile link' },
          { label: 'Follow-up task created', detail: 'Due within 4 business hours' },
        ],
        outcome: 'MQLs get a personalised follow-up within hours — not days.',
      },
      {
        name: 'Event Follow-Up',
        trigger: 'Event or webinar ends',
        steps: [
          { label: 'Attendee list pulled', detail: 'From your event or meeting platform' },
          { label: 'Attendees matched to CRM', detail: 'New contacts created for unknowns' },
          { label: 'Personalised follow-up drafted', ai: true, detail: 'Claude references the specific event' },
          { label: 'Sent within 2 hours', detail: 'Through your transactional email sender' },
        ],
        outcome: 'Event leads followed up while interest is still warm.',
      },
    ],
  },
  {
    label: 'Insights',
    icon: Sparkles,
    color: '#6C3FC5',
    tagline: 'Every answer, instantly.',
    isInsights: true,
    workflows: [],
  },
]

const KEY_FEATURES = [
  {
    icon: TrendingUp,
    color: '#0D9488',
    headline: 'Your entire sales cycle. Fully automated.',
    sub: 'From first lead to signed contract — Lumio handles every step without your team lifting a finger.',
    bullets: [
      'New lead → Claude scores it hot / warm / cold in seconds',
      'Hot lead → Slack alert fires, rep assigned, nurture sequence starts automatically',
      'Demo booked → personalised follow-up email drafted and sent within minutes',
      'Deal won → customer portal created, invoice raised, welcome sequence launched — all in 90 seconds',
      'Deal lost → win-back email automatically queued for 45 days later',
    ],
    stat: '6 sales workflows. Zero manual steps.',
    href: '/coming-soon/business',
    wide: true,
  },
  {
    icon: Megaphone,
    color: '#6C3FC5',
    headline: 'Social media, content, campaigns. All on autopilot.',
    sub: 'Your marketing runs itself. Lumio plans, schedules, publishes and reports — while your team focuses on strategy.',
    bullets: [
      'Content calendar auto-populated from your campaign themes',
      'Social posts drafted by Claude, scheduled across all platforms simultaneously',
      'Lead scores updated in real time as prospects engage with content',
      'Email campaigns triggered automatically based on behaviour',
      'Monthly performance report generated and sent without anyone touching a spreadsheet',
    ],
    stat: 'Never miss a post. Never chase a report. Ever again.',
    href: '/coming-soon/business',
    wide: false,
  },
  {
    icon: Monitor,
    color: '#0D9488',
    headline: 'New team member? Every system updated in 2 seconds.',
    sub: 'Stop adding people to 6 different systems one by one. Type a name once — Lumio does the rest.',
    bullets: [
      'Microsoft 365 or Google Workspace account created automatically',
      'Collaboration tools access provisioned instantly',
      'Training platform enrolled in seconds',
      'Payroll record created without HR touching finance',
      'IT asset register updated, equipment request sent',
      'When they leave — all access revoked across every system simultaneously',
    ],
    stat: 'What used to take 45 minutes now takes 2 seconds. Across every system.',
    href: '/coming-soon/business',
    wide: false,
  },
  {
    icon: FlaskConical,
    color: '#6C3FC5',
    headline: 'Trial set up in 2 seconds. Prospect has instant access.',
    sub: 'Stop making prospects wait. The moment a trial is created — they\'re in.',
    bullets: [
      'Trial created → portal environment spun up instantly',
      'Welcome email with login credentials sent automatically',
      'Day 3 check-in email triggered — personalised by Claude',
      'Day 7 engagement report generated — shows exactly what they\'ve done',
      'Trial ending → conversion email sequence starts automatically',
      'Convert to customer → full onboarding fires immediately — zero manual steps',
    ],
    stat: 'From trial created to prospect logged in: under 10 seconds.',
    href: '/coming-soon/business',
    wide: true,
  },
  {
    icon: Package,
    color: '#0D9488',
    headline: 'Stock, orders, suppliers. Managed automatically.',
    sub: 'Lumio watches your stock levels, raises orders before you run out, and keeps your operations running without anyone chasing anything.',
    bullets: [
      'Stock levels monitored in real time — alerts fire before you run out',
      'Purchase orders automatically drafted when stock hits reorder point',
      'Supplier emails sent automatically with correct quantities',
      'Delivery confirmations logged and stock levels updated instantly',
      'Weekly operations report generated and sent every Monday morning',
      'Supplier invoices matched to purchase orders automatically — no manual reconciliation',
    ],
    stat: 'Operations that used to need a full-time coordinator. Now handled automatically.',
    href: '/coming-soon/business',
    wide: false,
  },
  {
    icon: Layers,
    color: '#6C3FC5',
    headline: 'Project Management — Built for Every Team',
    sub: 'Plan sprints, track OKRs, manage your product roadmap and keep every project on time — all in one place.',
    bullets: [
      'Kanban board with drag-and-drop task management across sprints',
      'OKR tracking — set objectives, track key results, keep teams aligned',
      'Product roadmap — quarterly timeline view with initiative tracking',
      'Sprint planning with burndown charts and velocity tracking',
      'RICE-scored backlog prioritisation (Reach × Impact × Confidence ÷ Effort)',
      'Risk register — probability/impact matrix with mitigation tracking',
      'Team capacity dashboard — workload, utilisation and skill mapping',
      'AI-powered PM summary — daily intelligence briefing on all projects',
    ],
    stat: 'The project management tool your whole business actually uses.',
    href: '/coming-soon/business',
    wide: true,
  },
]

const STATS = [
  { value: '150',  label: 'Pre-built workflows on roadmap' },
  { value: '14',   label: 'Departments covered' },
  { value: '90s',  label: 'Avg. workflow run time' },
  { value: 'UK',   label: 'Data hosting' },
]

const INSIGHT_CARDS = [
  {
    role: 'Director',
    color: '#6C3FC5',
    emoji: '📈',
    desc: 'Full company health score, MRR trends, headcount, top customers, and workflow efficiency — all in one view.',
    metrics: ['Company health score', 'MRR & ARR trends', 'Top customers by value', 'Workflow ROI'],
  },
  {
    role: 'Manager',
    color: '#0D9488',
    emoji: '👥',
    desc: 'Team performance, SLA compliance, workflow completion rates, and open actions — filtered by your department.',
    metrics: ['Team performance KPIs', 'SLA compliance rate', 'Open action items', 'Workflow completion'],
  },
  {
    role: 'Finance',
    color: '#F59E0B',
    emoji: '💰',
    desc: 'Revenue, outstanding invoices, MRR, ARR projection, and overdue breakdown — real numbers, live.',
    metrics: ['Revenue vs target', 'Outstanding invoices', 'MRR & ARR projection', 'Overdue breakdown'],
  },
  {
    role: 'Operations',
    color: '#22C55E',
    emoji: '⚙️',
    desc: 'Workflow run stats, error rates, automation ROI, and system uptime — so you always know what\'s running.',
    metrics: ['Workflow run volume', 'Error & failure rates', 'Automation ROI', 'System uptime'],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlowStep({ step, index, total, color }: { step: WorkflowStep; index: number; total: number; color: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: step.ai ? 'rgba(108,63,197,0.2)' : `${color}22`, color: step.ai ? '#6C3FC5' : color }}>
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#1F2937', minHeight: 16 }} />
        )}
      </div>
      <div className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>{step.label}</span>
          {step.ai && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>
              <Sparkles size={10} /> AI
            </span>
          )}
        </div>
        {step.detail && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{step.detail}</p>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeDeptIdx, setActiveDeptIdx] = useState(0)
  const [activeWorkflowIdx, setActiveWorkflowIdx] = useState(0)

  const dept = DEPT_TABS[activeDeptIdx]
  const workflow = dept.workflows?.[activeWorkflowIdx]

  function switchDept(i: number) {
    setActiveDeptIdx(i)
    setActiveWorkflowIdx(0)
  }

  return (
    <div style={{ color: '#F9FAFB' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-32 overflow-hidden">
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 1100, height: 750,
          background: 'radial-gradient(ellipse at center, rgba(13,148,136,0.2) 0%, rgba(108,63,197,0.12) 40%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
          style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)', color: '#0D9488' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0D9488', display: 'inline-block' }} />
          Launching late 2026 — join the founding-customer waitlist
        </div>
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6 text-center mx-auto" style={{ maxWidth: 920 }}>
          Your business, fully connected.<br />
          <span style={{ background: 'linear-gradient(135deg, #0D9488 0%, #6C3FC5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Stop doing it manually. Start running on Lumio.
          </span>
        </h1>
        {/* Subheadline */}
        <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: '#9CA3AF', maxWidth: 680 }}>
          Lumio connects every tool your business runs on and automates the work between them. HR, Sales, Marketing, IT, Operations, Support — all running automatically from one intelligent dashboard. Founding-customer waitlist opens late 2026.
        </p>
        {/* Proof points */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
          {['150 pre-built workflows', '14 departments covered', 'UK data hosting · GDPR-first'].map(p => (
            <div key={p} className="flex items-center gap-2">
              <Check size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
              <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{p}</span>
            </div>
          ))}
        </div>
        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/coming-soon/business"
            className="px-7 py-3.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
            Join the Business waitlist <ArrowRight size={16} />
          </Link>
          <Link href="/coming-soon/schools"
            className="px-7 py-3.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
            style={{ border: '1px solid rgba(34,211,238,0.4)', color: '#22D3EE' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(34,211,238,0.7)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(34,211,238,0.4)' }}>
            Schools waitlist
          </Link>
        </div>
      </section>

      {/* ── Problem section ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The problem</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Sound familiar?</h2>
          <p className="text-base" style={{ color: '#6B7280', maxWidth: 560, margin: '0 auto' }}>
            Every growing business we&apos;ve spoken to is doing the same things manually. Here&apos;s what Lumio will do instead.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PAIN_CARDS.map(card => (
            <div key={card.before} className="rounded-xl overflow-hidden flex flex-col"
              style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="px-7 pt-7 pb-5" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="text-3xl mb-4">{card.icon}</div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#EF4444' }}>❌ Without Lumio</p>
                <p className="text-base font-semibold mb-2" style={{ color: '#F9FAFB' }}>{card.before}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{card.beforeDetail}</p>
              </div>
              <div className="px-7 pt-5 pb-7 flex-1">
                <p className="text-sm font-semibold mb-3" style={{ color: '#0D9488' }}>✓ With Lumio</p>
                <p className="text-sm font-semibold mb-4" style={{ color: '#D1D5DB' }}>{card.after}</p>
                <div className="space-y-2">
                  {card.afterSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <ChevronRight size={13} style={{ color: '#0D9488', flexShrink: 0 }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold mb-1"
                  style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}
                </div>
                <p className="text-sm" style={{ color: '#6B7280' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features tabs ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>One platform</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Every department, automated</h2>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Click a department. Pick a workflow. See exactly how Lumio will run it.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {DEPT_TABS.map((tab, i) => {
            const Icon = tab.icon
            const isActive = i === activeDeptIdx
            return (
              <button key={tab.label} onClick={() => switchDept(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? tab.color : '#111318',
                  color: isActive ? '#F9FAFB' : '#6B7280',
                  border: `1px solid ${isActive ? tab.color : '#1F2937'}`,
                }}>
                <Icon size={15} strokeWidth={1.75} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {dept.isInsights ? (
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid rgba(108,63,197,0.3)' }}>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4"
                style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.3)', color: '#A78BFA' }}>
                <Sparkles size={11} /> INSIGHTS
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Every answer. Instantly.</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 560 }}>
                Lumio Insights will give every person in your business the data they need — filtered by role, department, and region — without waiting for a report.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {INSIGHT_CARDS.map(card => (
                <div key={card.role} className="rounded-lg p-5 flex flex-col"
                  style={{ backgroundColor: '#111318', border: `1px solid ${card.color}33` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{card.emoji}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${card.color}18`, color: card.color }}>
                      {card.role}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: '#9CA3AF' }}>{card.desc}</p>
                  <ul className="flex flex-col gap-1.5">
                    {card.metrics.map(m => (
                      <li key={m} className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link href="/coming-soon/business"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#0D9488' }}>
              Join the waitlist <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: '#4B5563' }}>Workflows</p>
              {dept.workflows?.map((wf, i) => (
                <button key={wf.name} onClick={() => setActiveWorkflowIdx(i)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left"
                  style={{
                    backgroundColor: i === activeWorkflowIdx ? `${dept.color}18` : 'transparent',
                    color: i === activeWorkflowIdx ? dept.color : '#9CA3AF',
                    border: `1px solid ${i === activeWorkflowIdx ? `${dept.color}44` : '#1F2937'}`,
                  }}>
                  <GitBranch size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                  {wf.name}
                </button>
              ))}
            </div>

            {workflow && (
              <div className="lg:col-span-9 rounded-xl p-8"
                style={{ backgroundColor: '#0D0E16', border: `1px solid ${dept.color}33` }}>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{workflow.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${dept.color}18`, color: dept.color }}>
                        Trigger
                      </span>
                      <span className="text-sm" style={{ color: '#9CA3AF' }}>{workflow.trigger}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                    style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}>
                    {dept.label}
                  </span>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Automation steps</p>
                  <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                    {workflow.steps.map((step, i) => (
                      <FlowStep key={i} step={step} index={i} total={workflow.steps.length} color={dept.color} />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg px-5 py-4 flex items-start gap-3"
                  style={{ backgroundColor: `${dept.color}0f`, border: `1px solid ${dept.color}2a` }}>
                  <Check size={16} style={{ color: dept.color, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: dept.color }}>Outcome</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{workflow.outcome}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Key Features ─────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-28">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.35)', color: '#0D9488' }}>
              <Zap size={12} strokeWidth={2.5} />
              Why Lumio
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight tracking-tight">
              Stop doing things manually.<br />
              <span style={{ color: '#0D9488' }}>Start running automatically.</span>
            </h2>
            <p className="text-lg" style={{ color: '#6B7280', maxWidth: 560, margin: '0 auto' }}>
              Every process that eats your team&apos;s time — Lumio will automate it. Completely.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              { dept: 'Sales',               ...KEY_FEATURES[0] },
              { dept: 'Marketing',           ...KEY_FEATURES[1] },
              { dept: 'IT & Systems',        ...KEY_FEATURES[2] },
              { dept: 'Trials',              ...KEY_FEATURES[3] },
              { dept: 'Operations',          ...KEY_FEATURES[4] },
              { dept: 'Project Management',  ...KEY_FEATURES[5] },
            ].map(card => {
              const Icon = card.icon
              return (
                <div key={card.headline}
                  className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    backgroundColor: '#111318',
                    boxShadow: `inset 4px 0 0 ${card.color}`,
                    border: `1px solid ${card.color}33`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = `inset 4px 0 0 ${card.color}, 0 0 50px -12px ${card.color}66`
                    el.style.borderColor = `${card.color}55`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = `inset 4px 0 0 ${card.color}`
                    el.style.borderColor = `${card.color}33`
                  }}>
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between"
                      style={{ borderBottom: '1px solid #1F2937' }}>
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${card.color}18`, border: `1px solid ${card.color}33` }}>
                            <Icon size={18} style={{ color: card.color }} strokeWidth={1.75} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: card.color }}>{card.dept}</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight" style={{ color: '#F9FAFB' }}>{card.headline}</h3>
                        <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>{card.sub}</p>
                      </div>
                      <div className="mt-6 flex flex-col items-start gap-4">
                        <div className="rounded-xl px-5 py-3"
                          style={{ backgroundColor: `${card.color}12`, border: `1px solid ${card.color}33` }}>
                          <p className="text-sm font-bold leading-snug" style={{ color: card.color }}>{card.stat}</p>
                        </div>
                        <Link href={card.href}
                          className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                          style={{ color: card.color }}>
                          Join the waitlist <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                    <div className="lg:col-span-7 p-8 lg:p-10">
                      <ul className="flex flex-col gap-3">
                        {card.bullets.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-3 rounded-lg px-4 py-3"
                            style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${card.color}20` }}>
                              <Check size={11} style={{ color: card.color }} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm leading-snug" style={{ color: '#D1D5DB' }}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 rounded-2xl px-10 py-12 text-center"
            style={{ background: 'linear-gradient(135deg, #3B0764 0%, #0C4A6E 50%, #042F2E 100%)', border: '1px solid rgba(108,63,197,0.4)' }}>
            <p className="text-2xl md:text-4xl font-black mb-3 leading-tight" style={{ color: '#F9FAFB' }}>
              150 workflows. 14 departments.<br />
              <span style={{ color: '#5EEAD4' }}>Running automatically from day one.</span>
            </p>
            <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
              HR · Sales · Support · Trials · Finance · Customer Success · Marketing · IT · Operations · Legal · Executive · Procurement · Analytics · Projects
            </p>
            <Link href="/coming-soon/business"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}>
              Join the waitlist <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Insights section ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
              style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.3)', color: '#A78BFA' }}>
              <Sparkles size={12} />
              INSIGHTS
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">Every answer. Instantly.</h2>
            <p className="text-base leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 580, margin: '0 auto' }}>
              Lumio Insights will give every person in your business the data they need — filtered by role, department, and region — without waiting for a report.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-14">
            {INSIGHT_CARDS.map(card => (
              <div key={card.role} className="rounded-xl p-6 flex flex-col"
                style={{ backgroundColor: '#0D0E16', border: `1px solid ${card.color}33` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="text-sm font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${card.color}18`, color: card.color }}>
                    {card.role}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>{card.desc}</p>
                <div className="space-y-2 mt-auto">
                  {card.metrics.map(m => (
                    <div key={m} className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: card.color, flexShrink: 0, display: 'inline-block' }} />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-2xl p-8"
            style={{ backgroundColor: '#0D0E16', border: '1px solid rgba(108,63,197,0.25)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Key features</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  'Filter by region, product, district or team',
                  'Role-based access — everyone sees their view',
                  'Live data, not last month\'s spreadsheet',
                  'Export to PDF in one click',
                  'AI-generated highlights every Monday',
                  'Drill down from summary to individual record',
                ].map(feat => (
                  <div key={feat} className="flex items-center gap-2.5 text-sm" style={{ color: '#D1D5DB' }}>
                    <Check size={14} style={{ color: '#6C3FC5', flexShrink: 0 }} />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <Link href="/coming-soon/business"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#5B35A5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6C3FC5' }}>
                Join the waitlist <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow Library ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Workflow library</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            150 workflows. 14 departments.{' '}
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Every part of your business, automated.
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#6B7280', maxWidth: 620, margin: '0 auto' }}>
            From the moment someone applies for a job to the moment a customer renews — Lumio will have a workflow for it. Built by experts, activated in minutes, running forever.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 mb-14">
          {[
            { emoji: '👥', dept: 'HR & People',            count: 15, color: '#0D9488' },
            { emoji: '🤝', dept: 'Sales & CRM',            count: 15, color: '#6C3FC5' },
            { emoji: '🎧', dept: 'Customer Support',       count: 12, color: '#3B82F6' },
            { emoji: '🧪', dept: 'Trial & Onboarding',     count: 8,  color: '#6C3FC5' },
            { emoji: '💰', dept: 'Accounts & Finance',     count: 15, color: '#F59E0B' },
            { emoji: '🌟', dept: 'Customer Success',       count: 12, color: '#EC4899' },
            { emoji: '📢', dept: 'Marketing',              count: 15, color: '#F97316' },
            { emoji: '🔒', dept: 'IT & Security',          count: 12, color: '#22C55E' },
            { emoji: '⚙️', dept: 'Operations',             count: 10, color: '#0D9488' },
            { emoji: '⚖️', dept: 'Legal & Compliance',    count: 8,  color: '#A78BFA' },
            { emoji: '🎯', dept: 'Executive & Reporting',  count: 8,  color: '#6C3FC5' },
            { emoji: '🛒', dept: 'Procurement & Vendor',   count: 7,  color: '#F59E0B' },
            { emoji: '📊', dept: 'Analytics & Data',       count: 7,  color: '#0D9488' },
            { emoji: '📋', dept: 'Project Management',     count: 6,  color: '#3B82F6' },
          ].map(d => (
            <div key={d.dept} className="rounded-xl p-4 flex flex-col items-center text-center"
              style={{ backgroundColor: '#0D0E16', border: `1px solid ${d.color}33` }}>
              <div className="text-2xl mb-1">{d.emoji}</div>
              <div className="text-xs font-medium leading-snug mb-1" style={{ color: '#D1D5DB' }}>{d.dept}</div>
              <div className="text-xs font-bold" style={{ color: d.color }}>{d.count} workflows</div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-5 text-center" style={{ color: '#4B5563' }}>Featured workflows</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'HR-01 New Joiner Onboarding',    outcome: 'New employees arrive on Day 1 with everything ready. Zero IT tickets, zero emails to chase.' },
              { name: 'SA-03 Proposal Generation',       outcome: 'Boardroom-quality proposals in 90 seconds.' },
              { name: 'AC-08 VAT Return Preparation',    outcome: 'VAT returns compiled and filed automatically. No scramble at quarter end.' },
              { name: 'TR-03 Trial Usage Monitoring',    outcome: 'Sales knows which trials are hot before they go cold.' },
              { name: 'MK-04 SEO Content Engine',        outcome: 'Content pipeline running on autopilot.' },
              { name: 'EX-01 CEO Daily Briefing',        outcome: 'CEO starts every day informed in 2 minutes.' },
              { name: 'OP-WIKI-01 Wiki Builder',         outcome: 'Internal wiki generated from your connected documentation tools — live in minutes.' },
              { name: 'OP-FAQ-01 FAQ Builder',           outcome: 'FAQ auto-generated from your support ticket history. Updated every time your docs change.' },
              { name: 'HR-EVENTS-01 Team Events',        outcome: 'Describe the event, headcount, and budget — get ranked venues with ratings and a ready-to-send enquiry.' },
            ].map(wf => (
              <div key={wf.name} className="rounded-xl px-5 py-4"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#E5E7EB' }}>{wf.name}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{wf.outcome}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/coming-soon/business"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid rgba(13,148,136,0.4)', color: '#0D9488' }}>
              Join the waitlist to see the full library <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: '⚡', title: 'Activate in one click', desc: 'Connect your tools, pick a workflow, turn it on. It will run automatically from that moment.' },
            { icon: '🔧', title: 'Customise anything', desc: 'Every workflow is editable in the visual builder. Change triggers, steps, AI prompts, recipients — everything.' },
            { icon: '📈', title: 'New workflows weekly', desc: 'We&apos;ll ship new workflows every week. All customers get access the day they launch — at no extra cost.' },
          ].map(item => (
            <div key={item.title} className="rounded-xl p-6"
              style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Unified platform (replaces vendor comparison) ────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Why Lumio</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">One AI-native platform. Not a stack of tools.</h2>
          <p className="text-base leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 680, margin: '0 auto 28px' }}>
            Replace the stack of disconnected tools modern teams stitch together with one AI-native platform. CRM, team intelligence, department workflows and board reporting share the same data from day one — no brittle integration layer, no copy-paste between tabs.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Built-in Claude', 'Single contract', 'UK data hosting', 'GDPR-first', 'Role-based access', 'One dashboard'].map(p => (
              <span key={p} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(13,148,136,0.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lumio CRM teaser ─────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(108,63,197,0.35)' }}>
            <div className="px-10 pt-12 pb-8 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.15) 0%, rgba(13,148,136,0.08) 100%)', borderBottom: '1px solid rgba(108,63,197,0.2)' }}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', border: '1px solid rgba(108,63,197,0.4)', color: '#A78BFA' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#A78BFA', display: 'inline-block' }} />
                Coming late 2026
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Lumio CRM —{' '}
                <span style={{ background: 'linear-gradient(135deg, #A78BFA, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  built into the platform.
                </span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: '#9CA3AF', maxWidth: 680, margin: '0 auto 32px' }}>
                Contact enrichment, pipeline, deals, renewals and ARIA intelligence — connected to every Lumio workflow. No per-seat licence fee. Your data, your platform, deployed on your infrastructure if you want it that way.
              </p>
              <Link href="/coming-soon/business"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#5B35A5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6C3FC5' }}>
                Join the waitlist <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lumio Schools teaser ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
            style={{ backgroundColor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.35)', color: '#22D3EE' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#22D3EE', display: 'inline-block' }} />
            Coming late 2026 — Lumio Schools
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">A UK-first operating system for schools.</h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#9CA3AF', maxWidth: 620, margin: '0 auto 32px' }}>
            MIS sync, Google + Microsoft SSO, SEND, safeguarding, parent engagement and staff ops — built for the realities of UK schools, not adapted from generic edtech.
          </p>
          <Link href="/coming-soon/schools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#22D3EE', color: '#07080F' }}>
            Join the Schools waitlist <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to stop doing things{' '}
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              manually?
            </span>
          </h2>
          <p className="text-lg mb-10" style={{ color: '#6B7280' }}>
            Lumio Business opens its waitlist for founding customers in late 2026. Add your email now and we&apos;ll tell you the moment it&apos;s live.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/coming-soon/business"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
              Join the waitlist <ArrowRight size={18} />
            </Link>
            <Link href="/about"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-medium"
              style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#F9FAFB'; el.style.borderColor = '#374151' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#9CA3AF'; el.style.borderColor = '#1F2937' }}>
              Read the company story
            </Link>
          </div>
          <p className="text-xs mt-8" style={{ color: '#4B5563' }}>
            AI briefings across Lumio are powered by Claude from Anthropic.
          </p>
        </div>
      </section>

    </div>
  )
}
