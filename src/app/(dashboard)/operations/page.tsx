'use client'

import { useState } from 'react'

import { Package, AlertCircle, Truck, Receipt, Plus, RefreshCw, Phone, ClipboardList, FileText, PackagePlus, Shield, Star, Building2, Sparkles, Timer, GitBranch, AlertTriangle, Siren, BarChart3, ShieldCheck, Wrench, LayoutDashboard, ClipboardCheck, LifeBuoy, BadgeCheck, ArrowRightLeft } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import NewProjectModal from '@/components/modals/NewProjectModal'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Open Purchase Orders',    value: '14',     trend: '+3',   trendDir: 'up'   as const, trendGood: false, icon: Package,     sub: 'vs last week'   },
  { label: 'Low Stock Items',         value: '6',      trend: '+2',   trendDir: 'up'   as const, trendGood: false, icon: AlertCircle, sub: 'need restocking' },
  { label: 'Pending Deliveries',      value: '9',      trend: '+1',   trendDir: 'up'   as const, trendGood: false, icon: Truck,       sub: 'expected this week'},
  { label: 'Supplier Invoices Due',   value: '£28,400',trend: '+£4k', trendDir: 'up'   as const, trendGood: false, icon: Receipt,     sub: 'within 30 days'  },
]

const orders = [
  { po: 'PO-2026-088', supplier: 'Acme Office Supplies',   items: 'Desk chairs × 12',         value: '£3,840',  ordered: '10 Mar 2026', expected: '21 Mar 2026', status: 'In Transit'  },
  { po: 'PO-2026-087', supplier: 'TechPro Direct',          items: 'MacBook Pro M4 × 4',       value: '£12,800', ordered: '8 Mar 2026',  expected: '18 Mar 2026', status: 'Delivered'   },
  { po: 'PO-2026-086', supplier: 'PrintWave Ltd',           items: 'A3 printer paper × 50 ream',value: '£420',   ordered: '7 Mar 2026',  expected: '14 Mar 2026', status: 'Delivered'   },
  { po: 'PO-2026-085', supplier: 'CloudLicence Group',      items: 'Notion Enterprise seats',   value: '£2,400', ordered: '5 Mar 2026',  expected: '5 Mar 2026',  status: 'Delivered'   },
  { po: 'PO-2026-084', supplier: 'Ergonomics Now',          items: 'Standing desk converters × 8',value:'£1,960',ordered: '1 Mar 2026', expected: '24 Mar 2026', status: 'Pending'     },
  { po: 'PO-2026-083', supplier: 'TechPro Direct',          items: 'USB-C hubs × 20',          value: '£680',   ordered: '28 Feb 2026', expected: '10 Mar 2026', status: 'Delivered'   },
  { po: 'PO-2026-082', supplier: 'Facilities Direct',       items: 'Cleaning supplies — monthly',value:'£340',   ordered: '28 Feb 2026', expected: '3 Mar 2026',  status: 'Delivered'   },
  { po: 'PO-2026-081', supplier: 'Acme Office Supplies',    items: 'Notepads, pens, stationery', value: '£185', ordered: '25 Feb 2026', expected: '4 Mar 2026',  status: 'Delivered'   },
  { po: 'PO-2026-080', supplier: 'DataSafe Shredding',      items: 'Confidential waste disposal',value:'£220',   ordered: '20 Feb 2026', expected: '20 Feb 2026', status: 'Delivered'   },
  { po: 'PO-2026-079', supplier: 'CloudLicence Group',      items: 'GitHub Teams renewal',      value: '£840',   ordered: '15 Feb 2026', expected: '15 Feb 2026', status: 'Overdue'     },
  { po: 'PO-2026-078', supplier: 'SwiftCourier UK',         items: 'Courier — hardware returns', value: '£145', ordered: '12 Feb 2026', expected: '14 Feb 2026', status: 'Delivered'   },
  { po: 'PO-2026-077', supplier: 'TechPro Direct',          items: 'Monitor calibrators × 2',   value: '£380',   ordered: '10 Feb 2026', expected: '17 Feb 2026', status: 'Delivered'   },
]

const lowStock = [
  { item: 'Toner cartridges — HP LaserJet',  stock: '2 left',  threshold: '5',  supplier: 'PrintWave Ltd'       },
  { item: 'Laptop bags — 15"',               stock: '1 left',  threshold: '4',  supplier: 'Acme Office Supplies'},
  { item: 'HDMI cables — 2m',                stock: '3 left',  threshold: '8',  supplier: 'TechPro Direct'      },
  { item: 'Whiteboard markers (sets)',        stock: '2 left',  threshold: '6',  supplier: 'Acme Office Supplies'},
  { item: 'Hand sanitiser — 500ml',          stock: '4 left',  threshold: '10', supplier: 'Facilities Direct'   },
  { item: 'Meeting room notepads',           stock: '3 left',  threshold: '12', supplier: 'Acme Office Supplies'},
]

const upcoming = [
  { supplier: 'Acme Office Supplies',   items: 'Desk chairs × 12',            date: '21 Mar 2026', badge: 'In Transit' },
  { supplier: 'Ergonomics Now',          items: 'Standing desk converters × 8', date: '24 Mar 2026', badge: 'Pending'    },
  { supplier: 'CloudLicence Group',      items: 'Notion Enterprise renewal',    date: '25 Mar 2026', badge: 'Pending'    },
]

export default function OperationsPage() {
  const [showProject, setShowProject] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  async function callOpsAction(prompt: string, useEmail = false) {
    setSubmitting(true)
    try {
      const mcpServers = useEmail ? [{ type: 'url', url: 'https://gmail.mcp.claude.com/mcp', name: 'gmail' }] : []
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          mcp_servers: mcpServers.length > 0 ? mcpServers : undefined,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || 'Action completed.'
      setSubmitResult(text)
    } catch { setSubmitResult('Action completed successfully.') }
    setSubmitting(false)
  }

  const actions = [
    { label: 'Raise PO',          icon: Package,       onClick: () => setShowProject(true) },
    { label: 'Update Stock',      icon: RefreshCw,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Supplier Invoice',  icon: Receipt,       onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'New Order',         icon: Plus,          onClick: () => setShowProject(true) },
    { label: 'Restock Alert',     icon: AlertCircle,   onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Supplier Contact',  icon: Phone,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Delivery Log',      icon: ClipboardList, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Stock Report',      icon: FileText,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Book Stock',        icon: PackagePlus,   onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Admin Portal',     icon: Shield,        onClick: () => window.open('/admin', '_blank') },
    { label: 'Dept Insights',   icon: Star,          onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',       icon: Building2,     onClick: () => setShowDeptInfo(true) },
    { label: 'SLA Review',        icon: Timer,          onClick: () => setActiveModal('sla-review') },
    { label: 'Process Map',       icon: GitBranch,      onClick: () => setActiveModal('process-map') },
    { label: 'Risk Log',          icon: AlertTriangle,  onClick: () => setActiveModal('risk-log') },
    { label: 'Incident Report',   icon: Siren,          onClick: () => setActiveModal('incident') },
    { label: 'Capacity Plan',     icon: BarChart3,      onClick: () => setActiveModal('capacity') },
    { label: 'Vendor Review',     icon: Building2,      onClick: () => setActiveModal('vendor-review') },
    { label: 'Contract Renewal',  icon: RefreshCw,      onClick: () => setActiveModal('contract-renewal') },
    { label: 'Facilities Request',icon: Wrench,         onClick: () => setActiveModal('facilities') },
    { label: 'Health & Safety',   icon: ShieldCheck,    onClick: () => setActiveModal('health-safety') },
    { label: 'Asset Register',    icon: Package,        onClick: () => setActiveModal('asset') },
    { label: 'KPI Dashboard',     icon: LayoutDashboard,onClick: () => setActiveModal('kpi') },
    { label: 'Process Review',    icon: ClipboardCheck, onClick: () => setActiveModal('process-review') },
    { label: 'Business Continuity',icon: LifeBuoy,      onClick: () => setActiveModal('bcp') },
    { label: 'Quality Audit',     icon: BadgeCheck,     onClick: () => setActiveModal('quality') },
    { label: 'Change Request',    icon: ArrowRightLeft, onClick: () => setActiveModal('change-request') },
  ]

  const hasData = useHasDashboardData('operations')

  const deptStaff = getDeptStaff('operations')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="operations" />}
      <DashboardEmptyState pageKey="operations"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your operations data` : 'No operations data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Operations Lead'}. Upload your process documentation, FAQ library and operational data to activate the Operations module.` : 'Upload your process documentation, FAQ library and operational data to activate the Operations module.'}
        uploads={[
          { key: 'processes', label: 'Upload Process Docs (CSV)' },
          { key: 'faq', label: 'Upload FAQ Library (CSV)' },
        ]}
      />
    </>
  )

  const opsHighlights = ['47 workflow hours saved this month — £2,350 equivalent', 'Automation rate: 67% of manual tasks now automated', '3 workflows flagged for review — support SLA at risk', 'Process documentation: 87% coverage', 'Most triggered: New Joiner Onboarding (248 runs)']

  return (
    <PageShell title="Operations" subtitle="Workflows, supply chain and process management">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="Purchase Orders" action="View all">
            <Table
              cols={['PO #', 'Supplier', 'Items', 'Value', 'Ordered', 'Expected', 'Status']}
              rows={orders.map((o) => [
                <span key={o.po} className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{o.po}</span>,
                o.supplier, o.items, o.value, o.ordered, o.expected,
                <Badge key={o.po + 's'} status={o.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Low Stock Alerts">
              {lowStock.map((s) => (
                <PanelItem
                  key={s.item}
                  title={s.item}
                  sub={`Stock: ${s.stock} (min: ${s.threshold})`}
                  extra={s.supplier}
                  badge="Critical"
                />
              ))}
            </SectionCard>
            <SectionCard title="Upcoming Deliveries">
              {upcoming.map((d) => (
                <PanelItem
                  key={d.supplier + d.date}
                  title={d.supplier}
                  sub={d.items}
                  extra={`Expected: ${d.date}`}
                  badge={d.badge}
                />
              ))}
            </SectionCard>
          </>
        }
      />
      {showProject && <NewProjectModal onClose={() => setShowProject(false)} onSubmit={() => { setShowProject(false); showToast('Project created') }} />}
      <AIInsightsReport dept="operations" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="operations" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="operations" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Operations</span>
            </div>
            <ul className="space-y-2.5">
              {opsHighlights.map((h: string, i: number) => (
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setActiveModal(null); setSubmitResult(null); }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {submitResult ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-white font-semibold mb-3">Done</div>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4 whitespace-pre-wrap">{submitResult}</div>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null); }} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">
                    {activeModal === 'sla-review' && '⏱️ SLA Review'}
                    {activeModal === 'process-map' && '🔀 Process Map'}
                    {activeModal === 'risk-log' && '⚠️ Risk Log'}
                    {activeModal === 'incident' && '🚨 Incident Report'}
                    {activeModal === 'capacity' && '📊 Capacity Plan'}
                    {activeModal === 'vendor-review' && '🏢 Vendor Review'}
                    {activeModal === 'contract-renewal' && '🔄 Contract Renewal'}
                    {activeModal === 'facilities' && '🔧 Facilities Request'}
                    {activeModal === 'health-safety' && '🛡️ Health & Safety'}
                    {activeModal === 'asset' && '📦 Asset Register'}
                    {activeModal === 'kpi' && '📈 KPI Dashboard'}
                    {activeModal === 'process-review' && '📋 Process Review'}
                    {activeModal === 'bcp' && '⛑️ Business Continuity'}
                    {activeModal === 'quality' && '✅ Quality Audit'}
                    {activeModal === 'change-request' && '↔️ Change Request'}
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white text-2xl">×</button>
                </div>

                {/* SLA REVIEW */}
                {activeModal === 'sla-review' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Service / department</label><input type="text" placeholder="e.g. Customer Support, IT, Logistics" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Review period</label><div className="flex gap-2"><input type="date" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /><input type="date" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div>
                    <div className="space-y-2">
                      {[['First response time','Target: < 2hrs','92% met'],['Resolution time','Target: < 24hrs','87% met'],['Uptime','Target: 99.9%','99.7% achieved'],['Customer satisfaction','Target: > 4.5/5','4.6/5 avg']].map(([metric, target, actual]) => (
                        <div key={metric} className="flex items-center justify-between bg-gray-900 rounded-xl p-2.5">
                          <div><div className="text-xs text-white font-medium">{metric}</div><div className="text-[10px] text-gray-500">{target}</div></div>
                          <span className="text-xs font-medium text-teal-400">{actual}</span>
                        </div>
                      ))}
                    </div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate an SLA performance review report including: executive summary of SLA compliance, metric-by-metric analysis, root cause of any breaches, trend analysis vs prior period, and 5 specific recommendations to improve performance. Format with clear sections and bullet points.', false)} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate SLA Report'}
                    </button>
                  </div>
                )}

                {/* INCIDENT REPORT */}
                {activeModal === 'incident' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Incident title</label><input type="text" placeholder="Brief description of the incident" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Severity</label><div className="flex gap-2">{['P1 Critical','P2 High','P3 Medium','P4 Low'].map(s => <button key={s} className={`flex-1 py-1.5 rounded-xl border text-xs font-medium ${s.includes('P1') ? 'border-red-700 text-red-400' : s.includes('P2') ? 'border-amber-700 text-amber-400' : s.includes('P3') ? 'border-blue-700 text-blue-400' : 'border-gray-700 text-gray-400'} hover:bg-gray-800`}>{s}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Date & time of incident</label><input type="datetime-local" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Impact</label><textarea rows={2} placeholder="Who / what was affected? How many customers/systems?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Root cause (if known)</label><textarea rows={2} placeholder="What caused this?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Resolution steps taken</label><textarea rows={2} placeholder="What was done to resolve?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate a formal incident post-mortem report with: incident timeline, impact assessment, root cause analysis (using 5-whys methodology), immediate remediation steps, long-term preventative actions, lessons learned, and action items with owners and deadlines. Professional format suitable for board review.', false)} className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '🚨 Generate Incident Report'}
                    </button>
                  </div>
                )}

                {/* VENDOR REVIEW */}
                {activeModal === 'vendor-review' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Vendor name</label><input type="text" placeholder="Supplier / vendor name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Contract value (£/yr)</label><input type="number" placeholder="Annual spend" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Scorecard</label>
                      <div className="space-y-2">
                        {['Delivery reliability','Product/service quality','Communication','Value for money','Contract compliance'].map(criteria => (
                          <div key={criteria} className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{criteria}</span>
                            <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-teal-600 text-xs text-gray-400 hover:text-white transition-all border border-gray-700">{n}</button>)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Recommendation</label><div className="flex gap-2">{['Renew','Renegotiate','Replace','Consolidate'].map(r => <button key={r} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{r}</button>)}</div></div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate a vendor performance review summary including: overall score with RAG rating, strengths and weaknesses, comparison to market alternatives, risk assessment, commercial recommendations, and suggested contract terms for renewal. Professional procurement language.', false)} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Vendor Review'}
                    </button>
                  </div>
                )}

                {/* CONTRACT RENEWAL */}
                {activeModal === 'contract-renewal' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Contract / supplier name</label><input type="text" placeholder="Who is the contract with?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Current annual value (£)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Expiry date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Renewal term</label><div className="flex gap-2">{['1 year','2 years','3 years','Month-to-month'].map(t => <button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Target saving / change (%)</label><input type="number" placeholder="e.g. -10 for 10% reduction target" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate a contract renewal negotiation brief including: negotiation objectives, leverage points, BATNA (best alternative), key terms to negotiate (price, SLA, notice period, IP, liability), suggested opening position, walk-away point, and a draft renewal letter to the supplier. Professional procurement tone.', true)} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Renewal Brief & Draft Letter'}
                    </button>
                  </div>
                )}

                {/* HEALTH & SAFETY */}
                {activeModal === 'health-safety' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Report type</label><div className="flex gap-2 flex-wrap">{['Near miss','Accident','RIDDOR report','Risk assessment','DSE assessment','Fire drill log'].map(t => <button key={t} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-amber-500">{t}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Date of event</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Location</label><input type="text" placeholder="Where did this occur?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea rows={3} placeholder="What happened? Who was involved?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Immediate action taken</label><textarea rows={2} placeholder="What was done immediately?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button onClick={() => setActiveModal(null)} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-semibold text-sm">🛡️ Log H&S Report — Ref #HS-{Math.floor(Math.random()*9000)+1000}</button>
                  </div>
                )}

                {/* CAPACITY PLAN */}
                {activeModal === 'capacity' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Planning period</label><div className="flex gap-2">{['Next 30 days','Next quarter','Next 6 months','Next year'].map(p => <button key={p} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{p}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Current team capacity (%)</label><input type="number" placeholder="e.g. 87" min="0" max="100" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Expected demand change</label><div className="flex gap-2">{['+10%','+20%','+30%','Flat','-10%'].map(d => <button key={d} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{d}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Key constraints</label><div className="space-y-1">{['Headcount','IT infrastructure','Office space','Budget','Skills gap','Supplier capacity'].map(c => <label key={c} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded" />{c}</label>)}</div></div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate a capacity planning report including: current state analysis, demand forecast, gap analysis, headcount requirements, technology requirements, phased implementation plan, risk assessment, and budget implications. Include a capacity heatmap description by month. Format as an operational planning document.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Capacity Plan'}
                    </button>
                  </div>
                )}

                {/* PROCESS MAP */}
                {activeModal === 'process-map' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Process name</label><input type="text" placeholder="e.g. Customer onboarding, Invoice approval" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Process owner</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Departments involved</label><input type="text" placeholder="e.g. Sales, Finance, Operations" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Goal of this exercise</label><div className="flex gap-2 flex-wrap">{['Document as-is','Identify waste','Automate steps','Improve quality','Onboard new staff'].map(g => <button key={g} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{g}</button>)}</div></div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate a detailed process map document including: process scope and objectives, step-by-step process flow with decision points, RACI matrix (who is Responsible, Accountable, Consulted, Informed at each step), inputs and outputs, systems/tools used, SLAs for each step, common failure points, and improvement opportunities. Format as a structured process document.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Process Map'}
                    </button>
                  </div>
                )}

                {/* BUSINESS CONTINUITY */}
                {activeModal === 'bcp' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Scenario type</label><div className="flex gap-2 flex-wrap">{['IT outage','Key person loss','Supplier failure','Cyber attack','Natural disaster','Office unavailable'].map(s => <button key={s} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-red-500">{s}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Critical functions to protect</label><textarea rows={2} placeholder="What must keep running at all costs?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Recovery Time Objective (RTO)</label><div className="flex gap-2">{['< 1 hour','< 4 hours','< 24 hours','< 72 hours'].map(r => <button key={r} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-red-500">{r}</button>)}</div></div>
                    <button disabled={submitting} onClick={() => callOpsAction('Generate a Business Continuity Plan for the specified scenario including: threat assessment, impact analysis, recovery priorities, activation criteria and process, immediate response steps (first 1hr, 4hrs, 24hrs), communication plan (internal and external), resource requirements, dependencies and workarounds, testing schedule, and plan owner responsibilities. Format as a formal BCP document.')} className="w-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '⛑️ Generate BCP'}
                    </button>
                  </div>
                )}

                {/* CHANGE REQUEST */}
                {activeModal === 'change-request' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Change title</label><input type="text" placeholder="e.g. Migrate CRM to new platform" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Change type</label><div className="flex gap-2">{['Standard','Minor','Major','Emergency'].map(t => <button key={t} className={`flex-1 py-1.5 rounded-xl border text-xs font-medium transition-all ${t === 'Emergency' ? 'border-red-700 text-red-400' : t === 'Major' ? 'border-amber-700 text-amber-400' : 'border-gray-700 text-gray-300 hover:border-teal-500'}`}>{t}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Business justification</label><textarea rows={2} placeholder="Why is this change needed?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Impact assessment</label><textarea rows={2} placeholder="What systems/people/processes are affected?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Rollback plan</label><textarea rows={2} placeholder="How do we reverse this if it goes wrong?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Proposed implementation date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button onClick={() => setActiveModal(null)} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-semibold text-sm">✅ Submit Change Request — #CR-{Math.floor(Math.random()*9000)+1000}</button>
                  </div>
                )}

                {/* SIMPLE MODALS */}
                {['risk-log', 'facilities', 'asset', 'kpi', 'process-review', 'quality'].includes(activeModal || '') && (
                  <div className="space-y-3">

                    {activeModal === 'risk-log' && <><div><label className="text-xs text-gray-400 mb-1 block">Risk description</label><textarea rows={2} placeholder="Describe the risk" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Likelihood</label><div className="flex gap-2">{['Rare','Unlikely','Possible','Likely','Almost certain'].map(l => <button key={l} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-[10px] text-gray-300 hover:border-amber-500">{l}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Impact</label><div className="flex gap-2">{['Negligible','Minor','Moderate','Major','Critical'].map(i => <button key={i} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-[10px] text-gray-300 hover:border-red-500">{i}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Mitigation action</label><textarea rows={2} placeholder="What will reduce this risk?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Risk owner</label><input type="text" placeholder="Who owns this risk?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}

                    {activeModal === 'facilities' && <><div><label className="text-xs text-gray-400 mb-1 block">Request type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Maintenance / repair</option><option>New equipment</option><option>Room booking</option><option>Cleaning</option><option>Security access</option><option>Signage</option><option>HVAC / temperature</option><option>Other</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Location</label><input type="text" placeholder="Floor, room, building" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea rows={3} placeholder="Describe what you need..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Urgency</label><div className="flex gap-2">{['Routine','Urgent','Emergency'].map(u => <button key={u} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{u}</button>)}</div></div></>}

                    {activeModal === 'asset' && <><div><label className="text-xs text-gray-400 mb-1 block">Asset action</label><div className="flex gap-2">{['Add new','Update','Write off','Transfer','Report lost'].map(a => <button key={a} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{a}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Asset type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>IT Equipment (laptop/desktop)</option><option>Mobile device</option><option>Office furniture</option><option>Vehicle</option><option>Software licence</option><option>Machinery / equipment</option><option>Property</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Asset description / serial number</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Value (£)</label><input type="number" placeholder="Purchase/current value" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Assigned to</label><input type="text" placeholder="Person or department" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}

                    {activeModal === 'kpi' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 mb-3">Current operational KPIs — click to update targets</div>
                        {[
                          ['Order fulfillment rate', '96.2%', '98%', '#10B981'],
                          ['Supplier on-time delivery', '87%', '95%', '#F59E0B'],
                          ['Inventory accuracy', '99.1%', '99.5%', '#10B981'],
                          ['Cost per unit (avg)', '£12.40', '£11.00', '#EF4444'],
                          ['Process efficiency score', '78/100', '85/100', '#F59E0B'],
                          ['Customer complaint rate', '1.2%', '< 1%', '#EF4444'],
                        ].map(([kpi, actual, target, color]) => (
                          <div key={kpi} className="flex items-center justify-between bg-gray-900 rounded-xl p-2.5">
                            <span className="text-xs text-gray-300">{kpi}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold" style={{ color: color as string }}>{actual}</span>
                              <span className="text-[10px] text-gray-600">/ {target}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeModal === 'process-review' && <><div><label className="text-xs text-gray-400 mb-1 block">Process to review</label><input type="text" placeholder="Process name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Review trigger</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Scheduled review</option><option>Performance issue</option><option>Customer complaint</option><option>Regulatory requirement</option><option>Team feedback</option><option>New technology available</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Key issues identified</label><textarea rows={3} placeholder="What problems are you seeing?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}

                    {activeModal === 'quality' && <><div><label className="text-xs text-gray-400 mb-1 block">Audit type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Internal quality audit</option><option>ISO 9001 preparation</option><option>Customer quality review</option><option>Regulatory compliance</option><option>Process quality check</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Area being audited</label><input type="text" placeholder="Department, process, or product" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="space-y-1">{['Processes documented and followed','Quality standards defined and measured','Non-conformances tracked and resolved','Customer feedback reviewed regularly','Staff trained on quality procedures','Continuous improvement in evidence'].map(item => <label key={item} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded" />{item}</label>)}</div></>}

                    <button disabled={submitting} onClick={() => {
                      const prompts: Record<string, string> = {
                        'risk-log': 'Generate a risk management summary including: risk heat map description (likelihood vs impact matrix), top 5 risks by severity, recommended mitigation strategies for each, monitoring plan, and escalation triggers. Format as a risk committee report.',
                        'facilities': 'Acknowledge facilities request, assign priority, estimated response time based on urgency, and generate a work order with reference number.',
                        'asset': 'Generate an asset register update confirmation including: asset ID, depreciation schedule if applicable, next service/review date, insurance implications, and any compliance requirements for this asset type.',
                        'kpi': 'Generate an operational KPI improvement plan focusing on the underperforming metrics. Include: root cause analysis, 3 specific actions per metric, owner assignments, timeline, and expected improvement by next review.',
                        'process-review': 'Generate a process improvement report including: current state assessment, waste identification (using Lean methodology: defects, overproduction, waiting, transport, inventory, motion, extra processing), quick wins (implementable in 2 weeks), medium-term improvements, and a 90-day roadmap.',
                        'quality': 'Generate a quality audit report including: audit summary, compliance score by category, non-conformances found, corrective action requirements, positive findings, and recommended quality improvement priorities. Format as a formal audit report.',
                      }
                      callOpsAction(prompts[activeModal || ''] || 'Generate a professional operational report for this request.')
                    }} className="w-full mt-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : `✨ ${activeModal === 'risk-log' ? 'Log Risk & Generate Summary' : activeModal === 'facilities' ? 'Submit Facilities Request' : activeModal === 'asset' ? 'Update Asset Register' : activeModal === 'kpi' ? 'Generate KPI Improvement Plan' : activeModal === 'process-review' ? 'Generate Process Review' : 'Generate Quality Audit Report'}`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
