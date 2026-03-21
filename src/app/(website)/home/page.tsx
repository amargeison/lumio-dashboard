'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check, X, ArrowRight, Users, TrendingUp, Headphones,
  Activity, Megaphone, Server, DollarSign, ChevronRight,
  Sparkles, GitBranch, Filter, Zap, Monitor, FlaskConical, Package,
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

const SOCIAL_PROOF = ['Lighthouse Consulting', 'Meridian Recruitment', 'Apex Healthcare', 'Nova SaaS', 'Cornerstone Law']

const PAIN_CARDS = [
  {
    icon: '🔗',
    before: 'New customer? Update 7 systems manually.',
    beforeDetail: 'CRM, billing, portal, email, onboarding doc, calendar, Slack — each one by hand. Takes 45 minutes per customer. Someone always misses one.',
    after: 'Deal closed → everything done in 90 seconds.',
    afterSteps: [
      'CRM deal flips to Won',
      'Customer portal provisioned',
      'Product access granted',
      'Invoice raised in your billing tool',
      'Welcome email sent automatically',
      'Slack notifies the team',
    ],
  },
  {
    icon: '👤',
    before: 'New joiner? Email IT, HR, and payroll separately.',
    beforeDetail: 'Three separate requests. Someone forgets to CC payroll. The account is set up on day 3. The new hire sits idle on day 1.',
    after: 'Name entered once → everything provisioned.',
    afterSteps: [
      'New hire added to HR system',
      'M365 or Google account created',
      'Role-based access granted instantly',
      'Payroll entry created',
      'Training modules assigned',
      'Day-one welcome email sent',
    ],
  },
  {
    icon: '💸',
    before: 'Invoice unpaid? Chase by hand every 10 days.',
    beforeDetail: 'Copy the invoice. Find the contact. Write a polite-but-firm email. Hope you remembered to check Xero. Repeat until paid or given up on.',
    after: 'Billing tool flags it → Claude chases it → done.',
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
          { label: 'M365 or Google account created', detail: 'Name, role, department auto-filled' },
          { label: 'Teams & SharePoint access granted', detail: 'Role-based permissions applied' },
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
          { label: 'Calendar blocked on approval', detail: 'Updated across Outlook and Teams' },
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
        trigger: 'Invoice overdue in Xero / QuickBooks',
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
          { label: 'M365 / Google permissions updated', detail: 'New groups added, old removed' },
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
          { label: 'Rep assigned and alerted in Slack', detail: 'With brief and LinkedIn profile link' },
          { label: 'Follow-up task created', detail: 'Due within 4 business hours' },
        ],
        outcome: 'MQLs get a personalised follow-up within hours — not days.',
      },
      {
        name: 'Event Follow-Up',
        trigger: 'Event or webinar ends',
        steps: [
          { label: 'Attendee list pulled', detail: 'From Eventbrite, Zoom, or Teams' },
          { label: 'Attendees matched to CRM', detail: 'New contacts created for unknowns' },
          { label: 'Personalised follow-up drafted', ai: true, detail: 'Claude references the specific event' },
          { label: 'Sent within 2 hours', detail: 'Via Resend or HubSpot sequences' },
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
      'New HubSpot lead → Claude AI scores it hot/warm/cold in seconds',
      'Hot lead → Slack alert fires, rep assigned, nurture sequence starts automatically',
      'Demo booked → personalised follow-up email drafted and sent within minutes',
      'Deal won → customer portal created, invoice raised, welcome sequence launched — all in 90 seconds',
      'Deal lost → win-back email automatically queued for 45 days later',
    ],
    stat: '6 sales workflows. Zero manual steps.',
    href: '/product',
    wide: true,
  },
  {
    icon: Megaphone,
    color: '#6C3FC5',
    headline: 'Social media, content, campaigns. All on autopilot.',
    sub: 'Your marketing runs itself. Lumio plans, schedules, publishes and reports — while your team focuses on strategy.',
    bullets: [
      'Content calendar auto-populated from your campaign themes',
      'Social posts drafted by Claude AI, scheduled across all platforms simultaneously',
      'Lead scores updated in real time as prospects engage with content',
      'Email campaigns triggered automatically based on behaviour',
      'Monthly performance report generated and sent without anyone touching a spreadsheet',
    ],
    stat: 'Never miss a post. Never chase a report. Ever again.',
    href: '/product',
    wide: false,
  },
  {
    icon: Monitor,
    color: '#0D9488',
    headline: 'New team member? Every system updated in 2 seconds.',
    sub: 'Stop adding people to 6 different systems one by one. Type a name once — Lumio does the rest.',
    bullets: [
      'Microsoft 365 account created automatically',
      'Teams, SharePoint and email access provisioned instantly',
      'Training platform enrolled in seconds',
      'Xero payroll record created without HR touching finance',
      'IT asset register updated, equipment request sent',
      'When they leave — all access revoked across every system simultaneously',
    ],
    stat: 'What used to take 45 minutes now takes 2 seconds. Across every system.',
    href: '/product',
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
      'Day 3 check-in email triggered — personalised by Claude AI',
      'Day 7 engagement report generated — shows exactly what they\'ve done',
      'Trial ending → conversion email sequence starts automatically',
      'Convert to customer → full onboarding fires immediately — zero manual steps',
    ],
    stat: 'From trial created to prospect logged in: under 10 seconds.',
    href: '/product',
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
    href: '/product',
    wide: false,
  },
]

const COMPARE_ROWS = [
  { feature: 'Pre-built SMB workflows',        lumio: true,  zapier: false, make: false, manual: false },
  { feature: 'Unified department dashboard',   lumio: true,  zapier: false, make: false, manual: false },
  { feature: 'Built-in AI (Claude)',           lumio: true,  zapier: false, make: false, manual: false },
  { feature: 'No-code setup',                 lumio: true,  zapier: true,  make: true,  manual: false },
  { feature: 'Pre-built integrations',        lumio: true,  zapier: true,  make: true,  manual: false },
  { feature: 'GDPR-compliant data handling',  lumio: true,  zapier: false, make: false, manual: false },
  { feature: 'Live operational dashboard',    lumio: true,  zapier: false, make: false, manual: false },
  { feature: 'Single contract & billing',     lumio: true,  zapier: false, make: false, manual: false },
  { feature: 'Dedicated onboarding support',  lumio: true,  zapier: false, make: false, manual: false },
]

const PRICING_TIERS = [
  { name: 'Starter',    price: 299,  highlight: false, tagline: 'For small teams getting started' },
  { name: 'Growth',     price: 599,  highlight: true,  tagline: 'Most popular for scaling businesses' },
  { name: 'Enterprise', price: 1199, highlight: false, tagline: 'For larger, multi-department orgs' },
]

const STATS = [
  { value: '47+',  label: 'Pre-built workflows' },
  { value: '40+',  label: 'Integrations' },
  { value: '90s',  label: 'Avg. workflow run time' },
  { value: '30%',  label: 'Reduction in debtor days' },
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

function Tick({ val }: { val: boolean }) {
  return val
    ? <Check size={16} style={{ color: '#0D9488' }} />
    : <X size={16} style={{ color: '#374151' }} />
}

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
          Now live — 47+ workflows across 10 departments
        </div>
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6 text-center mx-auto" style={{ maxWidth: 920 }}>
          Your business, fully connected.<br />
          <span style={{ background: 'linear-gradient(135deg, #0D9488 0%, #6C3FC5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Stop doing it manually. Start running on Lumio.
          </span>
        </h1>
        {/* Subheadline */}
        <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: '#9CA3AF', maxWidth: 640 }}>
          Lumio connects every tool your business runs on and automates the work between them. HR, Sales, Marketing, IT, Operations, Support — all running automatically from one intelligent dashboard.
        </p>
        {/* Proof points */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
          {['47+ pre-built workflows', '10 departments covered', 'Setup in days, not months'].map(p => (
            <div key={p} className="flex items-center gap-2">
              <Check size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
              <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{p}</span>
            </div>
          ))}
        </div>
        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/demo"
            className="px-7 py-3.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
            Book a Demo <ArrowRight size={16} />
          </Link>
          <Link href="/product"
            className="px-7 py-3.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#F9FAFB'; el.style.borderColor = '#374151' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#9CA3AF'; el.style.borderColor = '#1F2937' }}>
            See how it works
          </Link>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937', backgroundColor: '#0A0B12' }}>
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-wrap items-center justify-center gap-10">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4B5563' }}>
            Trusted by growing businesses across the UK
          </p>
          {SOCIAL_PROOF.map(name => (
            <span key={name} className="text-sm font-medium" style={{ color: '#6B7280' }}>{name}</span>
          ))}
        </div>
      </section>

      {/* ── Problem section ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The problem</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Sound familiar?</h2>
          <p className="text-base" style={{ color: '#6B7280', maxWidth: 560, margin: '0 auto' }}>
            Every growing business we've spoken to is doing the same things manually. Here's what Lumio does instead.
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
            Click a department. Pick a workflow. See exactly how Lumio runs it.
          </p>
        </div>

        {/* Department tab bar — all 8 tabs, wraps to second row */}
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

        {/* Content area */}
        {dept.isInsights ? (
          /* Insights panel */
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid rgba(108,63,197,0.3)' }}>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4"
                style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.3)', color: '#A78BFA' }}>
                <Sparkles size={11} /> INSIGHTS
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Every answer. Instantly.</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 560 }}>
                Lumio Insights gives every person in your business the data they need — filtered by role, department, and region — without waiting for a report.
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
            <Link href="/product#insights"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#0D9488' }}>
              Explore Insights <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: workflow list */}
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

            {/* Right: workflow detail */}
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
          {/* Section header */}
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
              Every process that eats your team's time — Lumio automates it. Completely.
            </p>
          </div>

          {/* Feature cards — full-width, left border glow */}
          <div className="flex flex-col gap-5">
            {[
              { dept: 'Sales',        ...KEY_FEATURES[0] },
              { dept: 'Marketing',    ...KEY_FEATURES[1] },
              { dept: 'IT & Systems', ...KEY_FEATURES[2] },
              { dept: 'Trials',       ...KEY_FEATURES[3] },
              { dept: 'Operations',   ...KEY_FEATURES[4] },
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
                    {/* Left: label + headline + sub + stat + link */}
                    <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between"
                      style={{ borderBottom: '1px solid #1F2937' /* mobile */, borderRight: '0px' }}>
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
                          Learn more <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                    {/* Right: bullets */}
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

          {/* Full-width banner */}
          <div className="mt-12 rounded-2xl px-10 py-12 text-center"
            style={{ background: 'linear-gradient(135deg, #3B0764 0%, #0C4A6E 50%, #042F2E 100%)', border: '1px solid rgba(108,63,197,0.4)' }}>
            <p className="text-2xl md:text-4xl font-black mb-3 leading-tight" style={{ color: '#F9FAFB' }}>
              47+ workflows. Every department.<br />
              <span style={{ color: '#5EEAD4' }}>Running automatically from day one.</span>
            </p>
            <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
              HR · Sales · Marketing · IT · Trials · Operations · Support · Success · Accounts
            </p>
            <Link href="/product"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}>
              See all workflows <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Insights section ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-24">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
              style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.3)', color: '#A78BFA' }}>
              <Sparkles size={12} />
              INSIGHTS
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-5">Every answer. Instantly.</h2>
            <p className="text-base leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 580, margin: '0 auto' }}>
              Lumio Insights gives every person in your business the data they need — filtered by role, department, and region — without waiting for a report.
            </p>
          </div>

          {/* Role cards */}
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

          {/* Features list + CTA */}
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
              <Link href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#5B35A5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6C3FC5' }}>
                See Insights in action <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow Library ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Workflow Library</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            47+ workflows.{' '}
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ready on day one.
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#6B7280', maxWidth: 560, margin: '0 auto' }}>
            Every workflow is pre-built, pre-tested, and ready to activate. No coding. No configuration. No consultants.
          </p>
        </div>

        {/* Breakdown grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-14">
          {[
            { dept: 'HR & People',       count: 3,  color: '#0D9488' },
            { dept: 'Sales & CRM',       count: 6,  color: '#6C3FC5' },
            { dept: 'Support',           count: 5,  color: '#3B82F6' },
            { dept: 'Customer Success',  count: 4,  color: '#EC4899' },
            { dept: 'Accounts',          count: 5,  color: '#F59E0B' },
            { dept: 'IT & Systems',      count: 4,  color: '#22C55E' },
            { dept: 'Marketing',         count: 5,  color: '#F97316' },
            { dept: 'Trials',            count: 4,  color: '#6C3FC5' },
            { dept: 'Operations',        count: 4,  color: '#0D9488' },
            { dept: 'AI Bots',           count: 7,  color: '#A78BFA' },
          ].map(d => (
            <div key={d.dept} className="rounded-xl p-4 flex flex-col items-center text-center"
              style={{ backgroundColor: '#0D0E16', border: `1px solid ${d.color}33` }}>
              <div className="text-3xl font-black mb-1" style={{ color: d.color }}>{d.count}</div>
              <div className="text-xs font-medium leading-snug" style={{ color: '#9CA3AF' }}>{d.dept}</div>
              <div className="text-xs mt-0.5" style={{ color: '#4B5563' }}>workflow{d.count > 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>

        {/* Bottom copy row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: '⚡', title: 'Activate in one click', desc: 'Connect your tools, pick a workflow, turn it on. It runs automatically from that moment.' },
            { icon: '🔧', title: 'Customise anything', desc: 'Every workflow is editable in the visual builder. Change triggers, steps, AI prompts, recipients — everything.' },
            { icon: '📈', title: 'New workflows weekly', desc: 'We ship new workflows every week. All customers get access the day they launch — at no extra cost.' },
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

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Why Lumio</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built for growing businesses. Not just anyone.</h2>
            <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
              Generic automation tools weren't built with growing SMBs in mind. Lumio was.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0D0E16', borderBottom: '1px solid #1F2937' }}>
                  <th className="text-left px-6 py-4 font-medium" style={{ color: '#6B7280' }}>Feature</th>
                  <th className="px-6 py-4 font-semibold text-center" style={{ color: '#0D9488' }}>Lumio</th>
                  <th className="px-6 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Zapier</th>
                  <th className="px-6 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Make</th>
                  <th className="px-6 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Manual</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.feature}
                    style={{ borderBottom: '1px solid #111318', backgroundColor: i % 2 === 0 ? '#07080F' : '#0A0B12' }}>
                    <td className="px-6 py-3.5" style={{ color: '#D1D5DB' }}>{row.feature}</td>
                    <td className="px-6 py-3.5 text-center"><Tick val={row.lumio} /></td>
                    <td className="px-6 py-3.5 text-center"><Tick val={row.zapier} /></td>
                    <td className="px-6 py-3.5 text-center"><Tick val={row.make} /></td>
                    <td className="px-6 py-3.5 text-center"><Tick val={row.manual} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CRM teaser ───────────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(108,63,197,0.35)' }}>
            {/* Header */}
            <div className="px-10 pt-12 pb-8 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.15) 0%, rgba(13,148,136,0.08) 100%)', borderBottom: '1px solid rgba(108,63,197,0.2)' }}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', border: '1px solid rgba(108,63,197,0.4)', color: '#A78BFA' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#A78BFA', display: 'inline-block' }} />
                Coming Soon
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Lumio CRM — Your data. Your platform.{' '}
                <span style={{ background: 'linear-gradient(135deg, #A78BFA, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Zero licence fees.
                </span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: '#9CA3AF', maxWidth: 620, margin: '0 auto 32px' }}>
                A fully-featured CRM powered by Twenty (Y Combinator-backed, v1.0 2025) — deployed, managed and connected to all your Lumio workflows. £0 licence fee. Forever.
              </p>
              {/* 4 stats */}
              <div className="inline-grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(108,63,197,0.25)', backgroundColor: 'rgba(108,63,197,0.15)' }}>
                {[
                  { value: '£0', label: 'Licence Fee' },
                  { value: '100%', label: 'Data Ownership' },
                  { value: '∞', label: 'Unlimited Users' },
                  { value: '5-Day', label: 'Migration' },
                ].map((s, i) => (
                  <div key={i} className="px-8 py-5 text-center"
                    style={{ backgroundColor: '#0D0E16' }}>
                    <div className="text-2xl font-bold mb-0.5"
                      style={{ background: 'linear-gradient(135deg, #A78BFA, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {s.value}
                    </div>
                    <div className="text-xs" style={{ color: '#6B7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings cards */}
            <div className="px-10 py-8" style={{ backgroundColor: '#09090F' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5 text-center" style={{ color: '#4B5563' }}>
                How much could you save?
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
                {[
                  { from: 'vs HubSpot Professional', saving: '£11,880/yr', pct: '87%' },
                  { from: 'vs Salesforce Enterprise', saving: '£12,612/yr', pct: '88%' },
                  { from: 'vs Zendesk Sell Professional', saving: '£16,092/yr', pct: '90%' },
                ].map(card => (
                  <div key={card.from} className="rounded-xl p-6 text-center"
                    style={{ backgroundColor: '#0D0E16', border: '1px solid rgba(108,63,197,0.2)' }}>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{card.from}</p>
                    <p className="text-2xl font-bold mb-1"
                      style={{ background: 'linear-gradient(135deg, #A78BFA, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Save {card.saving}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#6C3FC5' }}>{card.pct} cost reduction</p>
                  </div>
                ))}
              </div>
              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/crm"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#5B35A5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6C3FC5' }}>
                  Join the waitlist
                </Link>
                <Link href="/crm"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid rgba(108,63,197,0.35)', color: '#A78BFA' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(108,63,197,0.6)'; el.style.color = '#C4B5FD' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(108,63,197,0.35)'; el.style.color = '#A78BFA' }}>
                  Learn more →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>All plans include a 14-day free trial. No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_TIERS.map(tier => (
            <div key={tier.name} className="rounded-xl p-8 flex flex-col relative"
              style={{
                backgroundColor: tier.highlight ? 'rgba(13,148,136,0.08)' : '#0D0E16',
                border: tier.highlight ? '1px solid rgba(13,148,136,0.4)' : '1px solid #1F2937',
              }}>
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                  Most popular
                </div>
              )}
              <p className="text-lg font-semibold mb-1">{tier.name}</p>
              <p className="text-xs mb-6" style={{ color: '#6B7280' }}>{tier.tagline}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">£{tier.price}</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>/mo</span>
              </div>
              <Link href="/pricing"
                className="mt-auto text-center py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: tier.highlight ? '#0D9488' : 'transparent',
                  color: tier.highlight ? '#F9FAFB' : '#9CA3AF',
                  border: tier.highlight ? 'none' : '1px solid #1F2937',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  if (tier.highlight) el.style.backgroundColor = '#0F766E'
                  else el.style.color = '#F9FAFB'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  if (tier.highlight) el.style.backgroundColor = '#0D9488'
                  else el.style.color = '#9CA3AF'
                }}>
                See full plan →
              </Link>
            </div>
          ))}
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
            Book a 30-minute demo. We'll show you Lumio live with workflows relevant to your team.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
              Book a Demo <ArrowRight size={18} />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-medium"
              style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#F9FAFB'; el.style.borderColor = '#374151' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#9CA3AF'; el.style.borderColor = '#1F2937' }}>
              View pricing
            </Link>
          </div>
          <p className="text-xs mt-8" style={{ color: '#4B5563' }}>
            14-day free trial · No credit card required · Cancel any time
          </p>
        </div>
      </section>

    </div>
  )
}
