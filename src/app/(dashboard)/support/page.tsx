'use client'

import { useState } from 'react'
import { Headphones, Clock, Star, CheckCircle2, Plus, MessageSquare, Building2, UserPlus, Send, FileText, Phone, CalendarPlus, BookOpen, HelpCircle, Shield, Sparkles, AlertTriangle, GitMerge, ListChecks, Timer, Bug, Radio, RotateCcw, Ban, Download, GraduationCap, ClipboardCheck, Lightbulb, FileSearch } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import NewSupportTicketModal from '@/components/modals/NewSupportTicketModal'
import WikiBuilderModal from '@/components/modals/WikiBuilderModal'
import FAQBuilderModal from '@/components/modals/FAQBuilderModal'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Open Tickets',      value: '18',   trend: '+5%',  trendDir: 'up'   as const, trendGood: false, icon: Headphones,   sub: 'vs last week'   },
  { label: 'Avg Response Time', value: '2.4h', trend: '+0.3h',trendDir: 'up'   as const, trendGood: false, icon: Clock,        sub: 'vs last week'   },
  { label: 'CSAT Score',        value: '94%',  trend: '+2%',  trendDir: 'up'   as const, trendGood: true,  icon: Star,         sub: 'vs last month'  },
  { label: 'Resolved Today',    value: '12',   trend: '+4',   trendDir: 'up'   as const, trendGood: true,  icon: CheckCircle2, sub: 'vs yesterday'   },
]

const tickets = [
  { id: 'SUP-0312', subject: 'Cannot login — SSO issue',         customer: 'Greenfield Academy',   priority: 'High',   assigned: 'Amara D.',   age: '4h',   status: 'Open'     },
  { id: 'SUP-0311', subject: 'Missing student data after import', customer: 'Bramble Hill Trust',   priority: 'High',   assigned: 'Chris O.',   age: '6h',   status: 'Open'     },
  { id: 'SUP-0310', subject: 'Reports not loading',               customer: 'Hopscotch Learning',   priority: 'Medium', assigned: 'Amara D.',   age: '1d',   status: 'Pending'  },
  { id: 'SUP-0309', subject: 'Feature request — bulk upload',     customer: 'Oakridge Schools Ltd', priority: 'Low',    assigned: 'Yuki T.',    age: '2d',   status: 'Open'     },
  { id: 'SUP-0308', subject: 'Password reset not sending email',  customer: 'Crestview Academy',    priority: 'Medium', assigned: 'Chris O.',   age: '2d',   status: 'Pending'  },
  { id: 'SUP-0307', subject: 'Dashboard slow to load',            customer: 'Elmfield Institute',   priority: 'Low',    assigned: 'Yuki T.',    age: '3d',   status: 'Open'     },
  { id: 'SUP-0306', subject: 'API integration error 403',         customer: 'Sunfield Trust',       priority: 'High',   assigned: 'Chris O.',   age: '3d',   status: 'Overdue'  },
  { id: 'SUP-0305', subject: 'Notification emails going to spam', customer: 'Pinebrook Primary',    priority: 'Medium', assigned: 'Amara D.',   age: '4d',   status: 'Pending'  },
  { id: 'SUP-0304', subject: 'User permissions not saving',       customer: 'Whitestone College',   priority: 'High',   assigned: 'Yuki T.',    age: '5d',   status: 'Overdue'  },
  { id: 'SUP-0303', subject: 'Training materials link broken',    customer: 'Riverdale Education',  priority: 'Low',    assigned: 'Amara D.',   age: '6d',   status: 'Resolved' },
]

const chats = [
  { customer: 'Greenfield Academy',  user: 'Helen Park',     wait: '3 min',  status: 'Active' },
  { customer: 'Bramble Hill Trust',  user: 'Tom Wright',     wait: '1 min',  status: 'Active' },
  { customer: 'Sunfield Trust',      user: 'Lisa Chen',      wait: '8 min',  status: 'Active' },
]

const ops = [
  { label: 'New tickets today',     value: '7'  },
  { label: 'Resolved today',        value: '12' },
  { label: 'Escalated today',       value: '2'  },
  { label: 'Avg first response',    value: '1.8h'},
  { label: 'SLA breaches today',    value: '1'  },
]

export default function SupportPage() {
  const [showTicket, setShowTicket] = useState(false)
  const [showCreateWiki, setShowCreateWiki] = useState(false)
  const [showCreateFAQ, setShowCreateFAQ] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'New Ticket',     icon: Plus,          onClick: () => setShowTicket(true) },
    { label: 'Open Chat',      icon: MessageSquare, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Create School',  icon: Building2,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Add User',       icon: UserPlus,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Send Update',    icon: Send,          onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Support Report', icon: FileText,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Call a School',  icon: Phone,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Book Meeting',   icon: CalendarPlus,  onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Create Wiki',   icon: BookOpen,      onClick: () => setShowCreateWiki(true) },
    { label: 'Create FAQ',    icon: HelpCircle,    onClick: () => setShowCreateFAQ(true) },
    { label: 'Admin Portal',  icon: Shield,        onClick: () => window.open('/admin', '_blank') },
    { label: 'Escalate Ticket',   icon: AlertTriangle,  onClick: () => setActiveModal('escalate') },
    { label: 'Merge Tickets',     icon: GitMerge,       onClick: () => setActiveModal('merge') },
    { label: 'Bulk Update',       icon: ListChecks,     onClick: () => setActiveModal('bulk-update') },
    { label: 'SLA Breach Alert',  icon: Timer,          onClick: () => setActiveModal('sla-breach') },
    { label: 'Known Issue',       icon: Bug,            onClick: () => setActiveModal('known-issue') },
    { label: 'Status Page',       icon: Radio,          onClick: () => setActiveModal('status-page') },
    { label: 'Canned Response',   icon: MessageSquare,  onClick: () => setActiveModal('canned') },
    { label: 'CSAT Survey',       icon: Star,           onClick: () => setActiveModal('csat') },
    { label: 'Refund Request',    icon: RotateCcw,      onClick: () => setActiveModal('refund') },
    { label: 'Account Suspend',   icon: Ban,            onClick: () => setActiveModal('suspend') },
    { label: 'Data Export',       icon: Download,       onClick: () => setActiveModal('data-export') },
    { label: 'Training Session',  icon: GraduationCap,  onClick: () => setActiveModal('training') },
    { label: 'Onboarding Check',  icon: ClipboardCheck, onClick: () => setActiveModal('onboarding-check') },
    { label: 'Feature Request',   icon: Lightbulb,      onClick: () => setActiveModal('feature-request') },
    { label: 'Post-Mortem',       icon: FileSearch,     onClick: () => setActiveModal('post-mortem') },
    { label: 'Dept Insights', icon: Star,         onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',    icon: Building2,    onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('support')

  const deptStaff = getDeptStaff('support')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="support" />}
      <DashboardEmptyState pageKey="support"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your support data` : 'No support data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Support Lead'}. Upload your support tickets, customer contacts and SLA data to activate the Support module with ticket management and response tracking.` : 'Upload your support tickets, customer contacts and SLA data to activate the Support module with ticket management and response tracking.'}
        uploads={[
          { key: 'tickets', label: 'Upload Support Tickets (CSV)' },
          { key: 'contacts', label: 'Upload Customer Contacts (CSV)' },
        ]}
      />
    </>
  )

  const supportHighlights = ['23 open tickets — 3 exceed SLA (48hr threshold)', 'Avg response time: 2.4 hours — within target', 'CSAT: 4.3/5 — stable month-on-month', 'Top category: Login & Access issues (31%)', 'Agent of the month: highest resolution rate']

  return (
    <PageShell title="Support" subtitle="Helpdesk, tickets, wiki and customer success">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="Helpdesk Queue" action="View all">
            <Table
              cols={['Ticket #', 'Subject', 'Customer', 'Priority', 'Assigned', 'Age', 'Status']}
              rows={tickets.map((t) => [
                <span key={t.id} className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{t.id}</span>,
                t.subject, t.customer,
                <Badge key={t.id + 'p'} status={t.priority} />,
                t.assigned, t.age,
                <Badge key={t.id + 's'} status={t.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Live Chat — Active Sessions">
              {chats.map((c) => (
                <PanelItem key={c.customer} title={c.customer} sub={c.user} extra={`Waiting ${c.wait}`} badge="Active" />
              ))}
            </SectionCard>
            <SectionCard title="Operations Today">
              <div className="flex flex-col">
                {ops.map((o) => (
                  <div key={o.label} className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid #1F2937' }}>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{o.label}</span>
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{o.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        }
      />
      {showTicket && <NewSupportTicketModal onClose={() => setShowTicket(false)} onSubmit={() => { setShowTicket(false); showToast('Support ticket created') }} />}
      {showCreateWiki && <WikiBuilderModal onClose={() => setShowCreateWiki(false)} onToast={showToast} />}
      {showCreateFAQ && <FAQBuilderModal onClose={() => setShowCreateFAQ(false)} onToast={showToast} />}
      <AIInsightsReport dept="support" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="support" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="support" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Support</span>
            </div>
            <ul className="space-y-2.5">
              {supportHighlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setActiveModal(null); setSubmitResult(null) }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitResult ? (
              <div className="text-center py-6"><div className="text-4xl mb-4">{'\u2705'}</div><div className="text-white font-semibold mb-3">Done</div><div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4 whitespace-pre-wrap">{submitResult}</div><button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium">Close</button></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">{({escalate:'\u{1F6A8} Escalate Ticket',merge:'\u{1F500} Merge Tickets','bulk-update':'\u{1F4CB} Bulk Update','sla-breach':'\u23F1\uFE0F SLA Breach','known-issue':'\u{1F41B} Known Issue','status-page':'\u{1F4E1} Status Page',canned:'\u{1F4AC} Canned Response',csat:'\u2B50 CSAT Survey',refund:'\u21A9\uFE0F Refund Request',suspend:'\u{1F6AB} Account Suspension','data-export':'\u{1F4E5} Data Export',training:'\u{1F393} Training Session','onboarding-check':'\u2705 Onboarding Check','feature-request':'\u{1F4A1} Feature Request','post-mortem':'\u{1F50D} Post-Mortem'} as Record<string,string>)[activeModal] || activeModal}</h3>
                  <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white text-2xl">&times;</button>
                </div>
                {activeModal === 'escalate' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Ticket ID</label><input type="text" placeholder="TKT-XXXX" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><div className="flex gap-2 flex-wrap">{['SLA breached','Customer escalating','Technical','VIP','Security','Repeated failure'].map(r=><button key={r} className="py-1.5 px-2 rounded-xl border border-red-800 text-xs text-red-400 hover:bg-red-900/20 transition-all">{r}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Escalate to</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Senior Engineer</option><option>Support Manager</option><option>Engineering</option><option>CTO</option><option>Account Manager</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Context</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Escalation logged. Notification sent to Senior Engineer. SLA clock paused. Customer will receive update within 30 minutes.')}} disabled={submitting} className="w-full bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F6A8}'} Escalate</button></div>)}
                {activeModal === 'known-issue' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Issue title</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Affected features</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Severity</label><div className="flex gap-2">{['Critical','High','Medium','Low'].map(s=><button key={s} className={`flex-1 py-1.5 rounded-xl border text-xs ${s==='Critical'?'border-red-700 text-red-400':s==='High'?'border-amber-700 text-amber-400':'border-gray-700 text-gray-300'} hover:opacity-80 transition-all`}>{s}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Workaround</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Expected resolution</label><div className="flex gap-2">{['< 1hr','< 4hrs','Today','This week','Investigating'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><button onClick={()=>{setSubmitResult(`Known Issue logged \u2014 #KI-${Math.floor(Math.random()*9000)+1000}. Team notified. Customer response template ready.`)}} className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F41B}'} Log Known Issue</button></div>)}
                {activeModal === 'status-page' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Status</label><div className="flex gap-2">{['Investigating','Identified','Monitoring','Resolved'].map(t=><button key={t} className={`flex-1 py-1.5 rounded-xl border text-xs font-medium ${t==='Investigating'?'border-red-700 text-red-400':t==='Identified'?'border-amber-700 text-amber-400':t==='Monitoring'?'border-blue-700 text-blue-400':'border-green-700 text-green-400'} hover:bg-gray-800 transition-all`}>{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Services</label><div className="space-y-1">{['Dashboard','Email integrations','Calendar sync','API','Data imports','Mobile app'].map(s=><label key={s} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" />{s}</label>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Public message</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Status page updated. Subscribers notified. Auto-monitoring enabled.')}} className="w-full bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E1}'} Update Status Page</button></div>)}
                {activeModal === 'canned' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Situation</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Password reset</option><option>Feature not working</option><option>How-to question</option><option>Billing question</option><option>Data export</option><option>Angry customer</option><option>Chasing resolution</option><option>Cancel request</option><option>Feature request</option><option>Thank you</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Customer name</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Tone</label><div className="flex gap-2">{['Warm','Professional','Empathetic','Concise'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><button onClick={()=>{setSubmitResult('3 response variations generated:\n\nVariation 1 \u2014 Direct:\nHi [Name], thanks for reaching out. [Solution]. Let us know if you need anything else.\n\nVariation 2 \u2014 Empathetic:\nHi [Name], I completely understand the frustration. [Solution]. We\u2019re here to help.\n\nVariation 3 \u2014 Brief:\n[Name] \u2014 [Solution]. Done. Any questions, reply here.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2728'} Generate Responses</button></div>)}
                {activeModal === 'csat' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Trigger</label><div className="flex gap-2 flex-wrap">{['Ticket resolved','Onboarding','After training','30 days','Post-renewal'].map(t=><button key={t} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Type</label><div className="flex gap-2">{['CSAT (1-5)','NPS (0-10)','CES (effort)'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><button onClick={()=>{setSubmitResult('CSAT survey email draft created. Includes 1-5 rating scale and one open question.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2B50'} Send Survey</button></div>)}
                {activeModal === 'refund' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Type</label><div className="flex gap-2">{['Full','Partial','Credit','Extension'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Service outage</option><option>Feature not delivered</option><option>Cooling-off</option><option>Billing error</option><option>Goodwill</option></select></div><button onClick={()=>{setActiveModal(null);showToast(`Refund submitted \u2014 #REF-${Math.floor(Math.random()*9000)+1000}`)}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2705'} Submit Refund</button></div>)}
                {activeModal === 'training' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Type</label><div className="flex gap-2 flex-wrap">{['Onboarding','Feature deep-dive','Admin','New member','Refresher','Train the trainer'].map(t=><button key={t} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Attendees</label><input type="number" placeholder="8" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Duration</label><div className="flex gap-2">{['30 min','60 min','90 min','Half day'].map(d=><button key={d} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{d}</button>)}</div></div><button onClick={()=>{setSubmitResult('Training session booked for next Thursday 10am (60 min). Google Meet link created. Invite sent to customer with pre-training checklist.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4C5}'} Book Training</button></div>)}
                {activeModal === 'feature-request' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Feature</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Requested by</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Use case</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Priority</label><div className="flex gap-2">{['Blocker','High value','Nice to have','Niche'].map(p=><button key={p} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{p}</button>)}</div></div><button onClick={()=>{setSubmitResult(`Feature request logged \u2014 #FR-${Math.floor(Math.random()*9000)+1000}. Customer acknowledgement drafted. Product team submission created.`)}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4A1}'} Log Request</button></div>)}
                {activeModal === 'post-mortem' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Incident title</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" style={{ colorScheme: 'dark' }} /></div><div><label className="text-xs text-gray-400 mb-1 block">Duration</label><input type="text" placeholder="e.g. 2 hours 14 minutes" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Customers affected</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Root cause</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Post-mortem report generated:\n\nTimeline: [detection \u2192 response \u2192 resolution]\nRoot Cause: 5-whys analysis completed\nImpact: [X] customers, [Y] SLA breaches\nAction Items: 4 prevention measures assigned\n\nFull document ready for engineering and leadership review.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F50D}'} Generate Post-Mortem</button></div>)}
                {['merge','bulk-update','sla-breach','suspend','data-export','onboarding-check'].includes(activeModal) && (<div className="space-y-3">{activeModal==='merge'&&<><div><label className="text-xs text-gray-400 mb-1 block">Primary ticket</label><input type="text" placeholder="TKT-XXXX" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Duplicates</label><textarea rows={2} placeholder="TKT-XXXX, TKT-XXXX" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}{activeModal==='bulk-update'&&<><div><label className="text-xs text-gray-400 mb-1 block">Filter by</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Status</option><option>Assignee</option><option>Tag</option><option>Customer</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Action</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Change status</option><option>Reassign</option><option>Add tag</option><option>Close tickets</option></select></div><div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3 text-xs text-amber-400">{'\u26A0\uFE0F'} Affects multiple tickets. Review before confirming.</div></>}{activeModal==='sla-breach'&&<div className="space-y-2 bg-gray-900 rounded-xl p-3">{[['TKT-4821','Bramblewood School','2hrs overdue','High'],['TKT-4756','Northgate Trust','4hrs overdue','Critical'],['TKT-4699','FitCore Group','1hr overdue','Medium']].map(([id,cust,over,pri])=><div key={id} className="flex items-center justify-between text-xs"><div><span className="text-purple-400 font-mono">{id}</span><span className="text-gray-400 ml-2">{cust}</span></div><div className="flex items-center gap-2"><span className="text-red-400">{over}</span><span className={`px-1.5 py-0.5 rounded text-[10px] ${pri==='Critical'?'bg-red-900/30 text-red-400':'bg-amber-900/30 text-amber-400'}`}>{pri}</span></div></div>)}</div>}{activeModal==='suspend'&&<><div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-xs text-red-400">{'\u26A0\uFE0F'} This revokes platform access immediately.</div><div><label className="text-xs text-gray-400 mb-1 block">Account</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Non-payment</option><option>Breach of terms</option><option>Security</option><option>Fraud</option><option>Customer request</option></select></div></>}{activeModal==='data-export'&&<><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>GDPR / SAR</option><option>Leaving \u2014 portability</option><option>Migration</option><option>Audit / legal</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Format</label><div className="flex gap-2">{['CSV','JSON','PDF'].map(f=><button key={f} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{f}</button>)}</div></div><div className="text-xs text-amber-400">{'\u26A0\uFE0F'} SAR: 30-day deadline (GDPR Art. 15)</div></>}{activeModal==='onboarding-check'&&<><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="space-y-2">{[['First login','\u2705'],['Admin users set up','\u2705'],['Team invited','\u274C'],['Integration connected','\u26A0\uFE0F'],['Walkthrough completed','\u274C'],['First workflow run','\u274C'],['Support contacted','\u2705'],['Training booked','\u274C']].map(([s,st])=><div key={s} className="flex items-center justify-between bg-gray-900 rounded-xl p-2.5 text-xs"><span className="text-gray-300">{s}</span><span>{st}</span></div>)}</div></>}<button onClick={()=>{const m:Record<string,string>={merge:'Tickets merged',['bulk-update']:'Bulk update applied',['sla-breach']:'SLA breach actions logged',suspend:'Account suspended',['data-export']:'Data export requested',['onboarding-check']:'Onboarding report generated'};setActiveModal(null);showToast(m[activeModal]||'Done')}} className="w-full mt-2 bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2705'} {({merge:'Merge Tickets','bulk-update':'Apply Update','sla-breach':'Action Breaches',suspend:'Confirm Suspension','data-export':'Request Export','onboarding-check':'Generate Report'} as Record<string,string>)[activeModal] || 'Submit'}</button></div>)}
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
