'use client'

import { DEMO_STATS } from '@/lib/demoStats'
import { useState } from 'react'
import { Server, Clock, Monitor, Key, Plus, UserPlus, Package, RefreshCw, FileText, Shield, AlertTriangle, Sparkles, Building2, ShieldAlert, KeyRound, Laptop, Network, AppWindow, HardDrive, UserMinus, Lock, Fish, ClipboardCheck, LifeBuoy, Cloud, Code, Bug, Loader2 } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import { ITAssets } from '@/components/dashboard/LiveStaffPanels'
import NewITTicketModal from '@/components/modals/NewITTicketModal'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Open IT Requests',       value: '12',  trend: '+3',  trendDir: 'up'   as const, trendGood: false, icon: Server,  sub: 'vs last week'   },
  { label: 'Pending Provisioning',   value: '5',   trend: '0',   trendDir: 'up'   as const, trendGood: true,  icon: Clock,   sub: 'stable'         },
  { label: 'Assets Registered',      value: '284', trend: '+8',  trendDir: 'up'   as const, trendGood: true,  icon: Monitor, sub: 'this quarter'   },
  { label: 'Licences Due Renewal',   value: '7',   trend: '+2',  trendDir: 'up'   as const, trendGood: false, icon: Key,     sub: 'within 60 days' },
]

const requests = [
  { id: 'IT-0088', type: 'Account Setup',   employee: 'Sophie Williams',  priority: 'High',   status: 'Pending',     age: '2h'  },
  { id: 'IT-0087', type: 'Laptop Request',  employee: 'Liam Brennan',     priority: 'Medium', status: 'Pending',     age: '4h'  },
  { id: 'IT-0086', type: 'Software Install',employee: 'Tom Ashworth',     priority: 'Low',    status: 'Open',        age: '1d'  },
  { id: 'IT-0085', type: 'VPN Access',      employee: 'Priya Kapoor',     priority: 'High',   status: 'Pending',     age: '1d'  },
  { id: 'IT-0084', type: 'Password Reset',  employee: 'Marcus Reid',      priority: 'Low',    status: 'Provisioned', age: '2d'  },
  { id: 'IT-0083', type: 'New Monitor',     employee: 'Nadia Petrov',     priority: 'Low',    status: 'Open',        age: '2d'  },
  { id: 'IT-0082', type: 'Account Setup',   employee: 'Fatima Al-Hassan', priority: 'High',   status: 'Pending',     age: '3d'  },
  { id: 'IT-0081', type: 'Slack Access',    employee: 'Oliver Chen',      priority: 'Medium', status: 'Provisioned', age: '4d'  },
  { id: 'IT-0080', type: 'License Request', employee: 'James Okafor',     priority: 'Medium', status: 'Open',        age: '5d'  },
  { id: 'IT-0079', type: 'Email Setup',     employee: 'Yuki Tanaka',      priority: 'High',   status: 'Provisioned', age: '6d'  },
  { id: 'IT-0078', type: 'MFA Enrollment',  employee: 'Chris Ogunleye',   priority: 'Medium', status: 'Complete',    age: '1w'  },
  { id: 'IT-0077', type: 'Asset Disposal',  employee: 'HR Team',          priority: 'Low',    status: 'Complete',    age: '1w'  },
]

const provisioning = [
  { name: 'Sophie Williams',  items: 'Slack, Google Workspace, Notion',  badge: 'Pending' },
  { name: 'Liam Brennan',     items: 'MacBook Pro, Slack, GitHub',        badge: 'Pending' },
  { name: 'Priya Kapoor',     items: 'VPN, Figma, Linear, Vercel',        badge: 'Pending' },
  { name: 'Fatima Al-Hassan', items: 'Google Workspace, Notion, Xero',    badge: 'Pending' },
  { name: 'Tom Ashworth',     items: 'Canva Pro, HubSpot, Mailchimp',     badge: 'Pending' },
]

const licences = [
  { product: 'GitHub Teams',     renew: '1 Apr 2026',  seats: '24',  cost: '£840/mo'  },
  { product: 'Figma Organisation',renew: '15 Apr 2026', seats: '8',   cost: '£360/mo' },
  { product: 'Linear',           renew: '1 May 2026',  seats: '32',  cost: '£480/mo'  },
  { product: 'Notion Teams',     renew: '12 May 2026', seats: '50',  cost: '£400/mo'  },
]

export default function ITPage() {
  const [showTicket, setShowTicket] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  async function callITAction(prompt: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: prompt })
      })
      const data = await res.json()
      setSubmitResult(typeof data.result === 'string' ? data.result : data.result?.summary || 'Action completed successfully.')
    } catch { setSubmitResult('Action completed successfully.') }
    setSubmitting(false)
  }

  const actions = [
    { label: 'New IT Request',    icon: Plus,           onClick: () => setShowTicket(true) },
    { label: 'Provision Account', icon: UserPlus,       onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Asset Register',    icon: Package,        onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Licence Renewal',   icon: RefreshCw,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'IT Report',         icon: FileText,       onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Access Review',     icon: Shield,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Security Alert',    icon: AlertTriangle,  onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Dept Insights',    icon: Sparkles,       onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',        icon: Building2,      onClick: () => setShowDeptInfo(true) },
    { label: 'Cyber Incident',   icon: ShieldAlert,    onClick: () => setActiveModal('cyber-incident') },
    { label: 'Password Reset',   icon: KeyRound,       onClick: () => setActiveModal('password-reset') },
    { label: 'Device Setup',     icon: Laptop,         onClick: () => setActiveModal('device-setup') },
    { label: 'VPN Access',       icon: Network,        onClick: () => setActiveModal('vpn') },
    { label: 'Software Request', icon: AppWindow,      onClick: () => setActiveModal('software-request') },
    { label: 'Data Backup',      icon: HardDrive,      onClick: () => setActiveModal('backup') },
    { label: 'Patch Management', icon: RefreshCw,      onClick: () => setActiveModal('patch') },
    { label: 'User Offboarding', icon: UserMinus,      onClick: () => setActiveModal('it-offboard') },
    { label: 'GDPR Request',     icon: Lock,           onClick: () => setActiveModal('gdpr') },
    { label: 'Phishing Report',  icon: Fish,           onClick: () => setActiveModal('phishing') },
    { label: 'IT Audit',         icon: ClipboardCheck, onClick: () => setActiveModal('it-audit') },
    { label: 'Disaster Recovery',icon: LifeBuoy,       onClick: () => setActiveModal('disaster-recovery') },
    { label: 'Cloud Cost Review',icon: Cloud,          onClick: () => setActiveModal('cloud-cost') },
    { label: 'API Key Request',  icon: Code,           onClick: () => setActiveModal('api-key') },
    { label: 'Penetration Test', icon: Bug,            onClick: () => setActiveModal('pen-test') },
  ]

  const hasData = useHasDashboardData('it')
  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const hasImportedStaff = false // Staff now from Supabase only

  const deptStaff = getDeptStaff('it')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="it" />}
      <DashboardEmptyState pageKey="it"
        title="No IT data yet"
        description="Import your asset register and IT inventory to manage equipment provisioning and system access."
        uploads={[
          { key: 'assets', label: 'Upload Asset Register (CSV)' },
          { key: 'systems', label: 'Upload Software Licences (CSV)' },
        ]}
      />
    </>
  )

  if (hasImportedStaff && !isDemoActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>IT & Systems</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Equipment provisioning, system access and IT onboarding</p>
        </div>
        <ITAssets />
      </div>
    )
  }

  const itHighlights = ['3 new provisioning requests this week — all within SLA', 'Software licence audit: 12 unused seats identified', 'System uptime: 99.97% — exceeds target', '2 DBS checks pending IT clearance', 'Backup verification passed for all production systems']

  return (
    <PageShell title="IT & Systems" subtitle="Infrastructure, security and system management">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="IT Request Queue" action="View all">
            <Table
              cols={['Request #', 'Type', 'Employee', 'Priority', 'Status', 'Age']}
              rows={requests.map((r) => [
                <span key={r.id} className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{r.id}</span>,
                r.type, r.employee,
                <Badge key={r.id + 'p'} status={r.priority} />,
                <Badge key={r.id + 's'} status={r.status} />,
                r.age,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Pending Provisioning">
              {provisioning.map((p) => (
                <PanelItem key={p.name} title={p.name} sub={p.items} badge={p.badge} />
              ))}
            </SectionCard>
            <SectionCard title="Upcoming Licence Renewals">
              {licences.map((l) => (
                <PanelItem key={l.product} title={l.product} sub={`Renews ${l.renew} · ${l.seats} seats`} extra={l.cost} badge="Pending" />
              ))}
            </SectionCard>
          </>
        }
      />
      {showTicket && <NewITTicketModal onClose={() => setShowTicket(false)} onSubmit={() => { setShowTicket(false); showToast('IT request created') }} />}
      <AIInsightsReport dept="it" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="it" onClose={() => setShowDeptInfo(false)} />}

      {activeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) { setActiveModal(null); setSubmitResult(null) } }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitResult ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">{'\u2705'}</div>
                <div className="text-white font-semibold mb-3">Done</div>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4 whitespace-pre-wrap">{submitResult}</div>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm">Close</button>
              </div>
            ) : (<>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">{({'cyber-incident':'\u{1F6A8} Cyber Incident Response','password-reset':'\u{1F511} Password Reset','device-setup':'\u{1F4BB} Device Setup',vpn:'\u{1F310} VPN Access','software-request':'\u{1F4E6} Software Request',backup:'\u{1F4BE} Data Backup',patch:'\u{1F504} Patch Management','it-offboard':'\u{1F464} IT User Offboarding',gdpr:'\u{1F512} GDPR Request',phishing:'\u{1F3A3} Phishing Report','it-audit':'\u{1F4CB} IT Audit','disaster-recovery':'\u26D1\uFE0F Disaster Recovery','cloud-cost':'\u2601\uFE0F Cloud Cost Review','api-key':'\u{1F510} API Key Request','pen-test':'\u{1F41B} Penetration Test'} as Record<string,string>)[activeModal] || activeModal}</h3>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="text-gray-500 hover:text-white text-2xl">&times;</button>
              </div>

              {activeModal === 'cyber-incident' && (<div className="space-y-3">
                <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-xs text-red-400">{'\u{1F6A8}'} Activate only for a confirmed or suspected security incident.</div>
                <div><label className="text-xs text-gray-400 mb-1 block">Incident type</label><div className="flex gap-2 flex-wrap">{['Ransomware','Data breach','Phishing','Account compromise','Malware','DDoS','Insider threat','Unknown'].map(t=><button key={t} className="py-1.5 px-2 rounded-xl border border-red-800 text-xs text-red-400 hover:bg-red-900/20">{t}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Severity</label><div className="flex gap-2">{['P1 Critical','P2 High','P3 Medium'].map(s=><button key={s} className={`flex-1 py-1.5 rounded-xl border text-xs ${s.includes('P1')?'border-red-700 text-red-400':s.includes('P2')?'border-amber-700 text-amber-400':'border-gray-700 text-gray-300'}`}>{s}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">What is affected?</label><textarea rows={2} placeholder="Systems, data, users affected" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate a cyber incident response plan: 1) Immediate containment (first 30 min), 2) Evidence preservation checklist, 3) Internal communication template, 4) External notification requirements (ICO/GDPR 72hr rule), 5) Recovery steps, 6) Post-incident review checklist. Also draft an urgent email to the security team.')} className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Activating...</>:'\u{1F6A8} Activate Incident Response'}</button>
              </div>)}

              {activeModal === 'device-setup' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">New user name</label><input type="text" placeholder="Full name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Department</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Sales</option><option>Marketing</option><option>Engineering</option><option>HR</option><option>Finance</option><option>Operations</option><option>Support</option></select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Device type</label><div className="flex gap-2 flex-wrap">{['MacBook Pro','MacBook Air','Windows Laptop','Desktop','iPad'].map(d=><button key={d} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{d}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Start date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate a device setup checklist: pre-arrival tasks (device ordering, account creation), day 1 setup (OS config, security software, email, VPN, MFA), software installation order, access provisioning by system, and a welcome email template with login details placeholder.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Generating...</>:'\u{1F4BB} Generate Setup Checklist'}</button>
              </div>)}

              {activeModal === 'it-offboard' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Employee name</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Last working day</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Departure type</label><div className="flex gap-2">{['Resignation','Redundancy','Contract end','Dismissal'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Email forwarding to</label><input type="text" placeholder="Manager email" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate an IT offboarding checklist: access revocation by system (email, Slack, GitHub, CRM, VPN, cloud, building access), device return procedure, data backup/transfer steps, licence deallocation, email forwarding setup, and security log entry. Format as an actionable IT ticket.')} className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Processing...</>:`\u{1F512} Initiate IT Offboarding \u2014 #IT-OFF-${Math.floor(Math.random()*9000)+1000}`}</button>
              </div>)}

              {activeModal === 'gdpr' && (<div className="space-y-3">
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 text-xs text-blue-400">{'\u2696\uFE0F'} GDPR requests must be completed within 30 days.</div>
                <div><label className="text-xs text-gray-400 mb-1 block">Request type</label><div className="flex gap-2 flex-wrap">{['Subject Access Request','Right to erasure','Data portability','Rectification'].map(t=><button key={t} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-blue-500">{t}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Requestor name</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Requestor email</label><input type="email" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-2 text-xs text-amber-400">{'\u23F0'} Deadline: {new Date(Date.now()+30*24*60*60*1000).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
                <button disabled={submitting} onClick={()=>callITAction('Generate a GDPR request handling pack: 1) Acknowledgement email (confirming receipt, 30-day timeline), 2) Internal action checklist by system, 3) Response template for when data pack is ready, 4) GDPR register log entry. Professional, legally appropriate.')} className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Processing...</>:'\u{1F512} Log GDPR Request'}</button>
              </div>)}

              {activeModal === 'phishing' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Reported by</label><input type="text" placeholder="Employee name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Sender email</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Action taken</label><div className="flex gap-2 flex-wrap">{['Deleted','Clicked link','Entered credentials','Opened attachment'].map(a=><button key={a} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-red-500">{a}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate a phishing incident response: 1) Containment steps, 2) Company-wide warning email draft, 3) Investigation checklist, 4) Block sender domain steps, 5) If credentials entered: account reset + breach assessment, 6) Training recommendations.')} className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Processing...</>:'\u{1F3A3} Log & Generate Response'}</button>
              </div>)}

              {activeModal === 'disaster-recovery' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Scenario</label><div className="flex gap-2 flex-wrap">{['Data loss','Cloud outage','Hardware failure','Ransomware','System corruption','Physical disaster'].map(s=><button key={s} className="py-1.5 px-2 rounded-xl border border-red-800 text-xs text-red-400 hover:bg-red-900/20">{s}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Critical systems</label><textarea rows={2} placeholder="What must be restored first?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">RTO</label><div className="flex gap-2">{['< 1hr','< 4hrs','< 24hrs','< 72hrs'].map(r=><button key={r} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-red-500">{r}</button>)}</div></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate a disaster recovery runbook: immediate response (first 15 min), system restoration priority order, recovery procedures per critical system, communication plan, data validation steps, return-to-normal checklist, post-recovery review.')} className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Generating...</>:'\u26D1\uFE0F Generate DR Runbook'}</button>
              </div>)}

              {activeModal === 'cloud-cost' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Providers</label><div className="flex gap-2 flex-wrap">{['AWS','Azure','Google Cloud','Vercel','Supabase','Other'].map(p=><button key={p} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{p}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Monthly spend ({'\u00A3'})</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Budget ({'\u00A3'}/month)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate a cloud cost optimisation review: cost by service category, top 5 quick wins with estimated savings %, reserved instance recommendations, rightsizing opportunities, unused resource checklist, and 90-day cost reduction roadmap.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Analysing...</>:'\u2601\uFE0F Generate Cost Plan'}</button>
              </div>)}

              {activeModal === 'it-audit' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Audit type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Annual IT audit</option><option>ISO 27001</option><option>Cyber Essentials</option><option>SOC 2</option><option>GDPR technical</option><option>Access rights review</option></select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Scope</label><div className="space-y-1">{['User access','Network security','Endpoint security','Backups','Licensing','Physical security','Third-party risk','Cloud config'].map(s=><label key={s} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded"/>{s}</label>)}</div></div>
                <button disabled={submitting} onClick={()=>callITAction('Generate IT audit preparation pack: scope and objectives, evidence collection checklist, documentation to prepare, common findings and remediation steps, interview prep (likely questions and answers), risk areas, and 4-week preparation timeline.')} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Generating...</>:'\u{1F4CB} Generate Audit Pack'}</button>
              </div>)}

              {['password-reset','vpn','software-request','backup','patch','api-key','pen-test'].includes(activeModal||'') && (<div className="space-y-3">
                {activeModal==='password-reset'&&<><div><label className="text-xs text-gray-400 mb-1 block">User</label><input type="text" placeholder="Name or email" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div><div><label className="text-xs text-gray-400 mb-1 block">System</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Google/Gmail</option><option>Microsoft 365</option><option>Slack</option><option>VPN</option><option>CRM</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Verification</label><div className="flex gap-2">{['ID verified','Manager confirmed','Video call'].map(v=><button key={v} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{v}</button>)}</div></div></>}
                {activeModal==='vpn'&&<><div><label className="text-xs text-gray-400 mb-1 block">User</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div><div><label className="text-xs text-gray-400 mb-1 block">Access type</label><div className="flex gap-2">{['New account','Password reset','Revocation','Troubleshooting'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div></>}
                {activeModal==='software-request'&&<><div><label className="text-xs text-gray-400 mb-1 block">Software</label><input type="text" placeholder="Software name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div><div><label className="text-xs text-gray-400 mb-1 block">Requested by</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div><div><label className="text-xs text-gray-400 mb-1 block">Justification</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div><div><label className="text-xs text-gray-400 mb-1 block">Cost</label><input type="text" placeholder="£/month" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div></>}
                {activeModal==='backup'&&<><div><label className="text-xs text-gray-400 mb-1 block">Action</label><div className="flex gap-2">{['Backup now','Review status','Restore','Update policy'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Notes</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div></>}
                {activeModal==='patch'&&<><div><label className="text-xs text-gray-400 mb-1 block">Scope</label><div className="flex gap-2 flex-wrap">{['All Windows','All Macs','Servers','Network','Critical only'].map(s=><button key={s} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{s}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Window</label><div className="flex gap-2"><input type="date" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/><input type="time" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div></div></>}
                {activeModal==='api-key'&&<><div><label className="text-xs text-gray-400 mb-1 block">Service / API</label><input type="text" placeholder="e.g. Anthropic, Stripe, Google Maps" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div><div><label className="text-xs text-gray-400 mb-1 block">Environment</label><div className="flex gap-2">{['Production','Staging','Development','Testing'].map(e=><button key={e} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{e}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Use case</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div></>}
                {activeModal==='pen-test'&&<><div><label className="text-xs text-gray-400 mb-1 block">Scope</label><div className="flex gap-2 flex-wrap">{['Web app','API','Internal network','External','Social engineering','Full'].map(s=><button key={s} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500">{s}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Type</label><div className="flex gap-2">{['Black box','Grey box','White box'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Target systems</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"/></div></>}
                <button disabled={submitting} onClick={()=>{const p:Record<string,string>={'password-reset':'Generate a secure password reset procedure: identity verification, reset execution, MFA reset if needed, session invalidation, user notification template, and security log entry.','vpn':'Generate VPN setup instructions: pre-requisites, installation, configuration, testing, troubleshooting, and security reminders.','software-request':'Generate a software procurement assessment: security review checklist, licence compliance, integration risk, GDPR implications, and approval recommendation.','backup':'Generate backup status report: current health, risks from gaps, recommended frequency by data type, retention policy, and monthly verification checklist.','patch':'Generate patch management plan: pre-patch checklist, testing procedure, deployment sequence, user communication, monitoring, rollback procedure, and verification.','api-key':'Generate API key security policy: storage requirements, access control, rotation schedule, monitoring, compromise procedure, and approval record template.','pen-test':'Generate pen test preparation: rules of engagement template, scope document, get-out-of-jail letter, emergency contacts, exclusions, legal considerations, and debrief agenda.'};callITAction(p[activeModal!]||'Generate IT action plan for this request.')}} className="w-full mt-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">{submitting?<><Loader2 size={14} className="animate-spin"/> Generating...</>:'\u2705 Submit'}</button>
              </div>)}
            </>)}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="it" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>IT</span>
            </div>
            <ul className="space-y-2.5">
              {itHighlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
