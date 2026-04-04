'use client'

import { useState } from 'react'
import { Megaphone, Mail, UserPlus, TrendingUp, Plus, Send, FileText, Video, Star, CalendarHeart, Sparkles, Building2 } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import CaseStudyModal from '@/components/modals/CaseStudyModal'
import { CreatePostModal, NewCampaignModal as CampaignBuilderModal, WebinarSetupModal, LeadReportModal } from '@/components/modals/MarketingModals'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Social Posts This Month', value: '24',    trend: '+6%',  trendDir: 'up' as const, trendGood: true, icon: Megaphone,  sub: 'vs last month'  },
  { label: 'Email Open Rate',         value: '34.2%', trend: '+2.1%',trendDir: 'up' as const, trendGood: true, icon: Mail,       sub: 'vs last campaign'},
  { label: 'New Leads',               value: '47',    trend: '+12%', trendDir: 'up' as const, trendGood: true, icon: UserPlus,   sub: 'vs last month'  },
  { label: 'MQL Count',               value: '18',    trend: '+5',   trendDir: 'up' as const, trendGood: true, icon: TrendingUp, sub: 'this month'     },
]

const content = [
  { platform: 'LinkedIn',   preview: 'How Lumio helped Greenfield Academy reduce onboarding time by 40%…', date: '21 Mar 2026', status: 'Scheduled' },
  { platform: 'Twitter/X',  preview: 'EdTech teams are wasting hours on manual workflows. Here\'s how…',   date: '21 Mar 2026', status: 'Scheduled' },
  { platform: 'Email',      preview: 'Your March product update — new workflows, faster reporting…',       date: '22 Mar 2026', status: 'Draft'     },
  { platform: 'LinkedIn',   preview: 'Case study: How Oakridge Schools saved 12 hrs/week with automation…',date: '24 Mar 2026', status: 'Scheduled' },
  { platform: 'Blog',       preview: 'The 5 workflows every CSM team should automate in 2026…',            date: '25 Mar 2026', status: 'Draft'     },
  { platform: 'Instagram',  preview: 'Behind the scenes at Lumio — our team building the future of EdTech…',date:'26 Mar 2026', status: 'Draft'     },
  { platform: 'Email',      preview: 'End of Q1 review — top-performing schools using Lumio this quarter…',date: '28 Mar 2026', status: 'Scheduled' },
  { platform: 'LinkedIn',   preview: 'We\'re hiring! Join the Lumio team as a Customer Success Manager…',  date: '1 Apr 2026',  status: 'Draft'     },
  { platform: 'Webinar',    preview: 'Live demo: Automate your school\'s HR workflows in under 30 mins…',  date: '3 Apr 2026',  status: 'Scheduled' },
  { platform: 'Twitter/X',  preview: '62% trial-to-paid conversion — here\'s what we\'re doing differently…',date:'5 Apr 2026', status: 'Draft'     },
]

const campaigns = [
  { name: 'Q1 EdTech Nurture',    sent: '3,240', openRate: '36.4%', ctr: '8.2%',  badge: 'Complete'  },
  { name: 'Trial Follow-up Flow', sent: '412',   openRate: '44.1%', ctr: '12.8%', badge: 'Active'    },
  { name: 'Renewal Reminder',     sent: '87',    openRate: '61.2%', ctr: '28.4%', badge: 'Active'    },
  { name: 'March Product Update', sent: '—',     openRate: '—',     ctr: '—',     badge: 'Scheduled' },
]

const leads = [
  { name: 'Rachel Fox',    company: 'Lakewood Academy',  score: '87',  badge: 'Active' },
  { name: 'Gary Stone',    company: 'Fernview College',  score: '79',  badge: 'Active' },
  { name: 'David Holt',    company: 'Starling Schools',  score: '68',  badge: 'Active' },
  { name: 'Yasmin Patel',  company: 'Helix Education',   score: '54',  badge: 'Pending'},
]

const COUNTRIES  = ['All Countries',  'Worldwide', 'United Kingdom', 'United States', 'Europe', 'Asia Pacific', 'Middle East', 'Rest of World']
const PRODUCTS   = ['All Products',   'Lumio Core', 'Lumio Pro', 'Lumio Lite']
const REGIONS    = ['All Regions',    'Oxfordshire', 'Manchester', 'West Yorkshire', 'Cardiff', 'Edinburgh', 'Suffolk', 'Norfolk', 'West Midlands', 'North Yorkshire', 'Bristol', 'Merseyside']
const ORGS       = ['All Organisations', 'Greenfield MAT', 'Bramble Hill Trust', 'Independent', 'Oakridge MAT', 'Whitestone MAT', 'Riverdale MAT', 'Starling Trust', 'Torchbearer MAT']

function FilterSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: value === options[0] ? '#9CA3AF' : '#F9FAFB', minWidth: 140 }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function MarketingPage() {
  const [country,  setCountry]  = useState('All Countries')
  const [product,  setProduct]  = useState('All Products')
  const [region,   setRegion]   = useState('All Regions')
  const [org,      setOrg]      = useState('All Organisations')
  const [showCampaign, setShowCampaign] = useState(false)
  const [showCaseStudy, setShowCaseStudy] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showWebinar, setShowWebinar] = useState(false)
  const [showLeadReport, setShowLeadReport] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'Create Post',       icon: Plus,       onClick: () => setShowCreatePost(true) },
    { label: 'Book Event',        icon: CalendarHeart, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'New Campaign',      icon: Megaphone,  onClick: () => setShowCampaign(true) },
    { label: 'Case Study',        icon: FileText,   onClick: () => setShowCaseStudy(true) },
    { label: 'Webinar Setup',     icon: Video,      onClick: () => setShowWebinar(true) },
    { label: 'Lead Report',       icon: TrendingUp, onClick: () => setShowLeadReport(true) },
    { label: 'Dept Insights',    icon: Star,       onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',        icon: Building2,  onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('marketing')

  const deptStaff = getDeptStaff('marketing')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="marketing" />}
      <DashboardEmptyState pageKey="marketing"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your marketing data` : 'No marketing data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Marketing Lead'}. Connect your marketing tools or upload campaign data to activate the Marketing module with analytics, campaign tracking and lead attribution.` : 'Connect your marketing tools or upload campaign data to activate the Marketing module with analytics, campaign tracking and lead attribution.'}
        uploads={[
          { key: 'campaigns', label: 'Upload Campaign Data (CSV)' },
          { key: 'leads', label: 'Upload Lead Data (CSV)' },
          { key: 'analytics', label: 'Upload Web Analytics (CSV)' },
        ]}
      />
    </>
  )

  const marketingHighlights = ['Blog traffic up 23% — top post: "School Digital Transformation"', 'LinkedIn campaign generated 47 qualified leads', 'Email open rate: 44% — above industry benchmark', 'Webinar registrations: 128 for Thursday session', 'SEO: 3 new page-one rankings this month']

  const isFiltered = country !== 'All Countries' || product !== 'All Products' ||
                     region !== 'All Regions' || org !== 'All Organisations'

  return (
    <PageShell title="Marketing" subtitle="Campaigns, content, leads and brand"
      action={
        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect options={COUNTRIES}  value={country}  onChange={setCountry}  />
          <FilterSelect options={PRODUCTS}   value={product}  onChange={setProduct}  />
          <FilterSelect options={REGIONS}    value={region}   onChange={setRegion}   />
          <FilterSelect options={ORGS}       value={org}      onChange={setOrg}      />
          {isFiltered && (
            <button
              onClick={() => { setCountry('All Countries'); setProduct('All Products'); setRegion('All Regions'); setOrg('All Organisations') }}
              className="text-xs px-2 py-1 rounded-lg" style={{ color: '#9CA3AF', border: '1px solid #374151' }}
            >
              Clear
            </button>
          )}
        </div>
      }>

      {isFiltered && (
        <p className="text-xs px-1" style={{ color: '#9CA3AF' }}>
          Showing data filtered by: {[country, product, region, org].filter((v) => !v.startsWith('All')).join(' · ')}
        </p>
      )}

      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      {/* Marketing Events Workflow Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group flex flex-col gap-3 rounded-xl border border-[#1F2937] bg-[#111318] p-5 hover:border-[#374151] transition-all">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)' }}>
              <CalendarHeart className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-mono text-teal-400">MKT-EVENTS-01</span>
            </div>
          </div>
          <div>
            <div className="font-semibold text-[#F9FAFB] group-hover:text-white transition-colors">Marketing Events — Event Planner & Promoter</div>
            <div className="text-xs text-[#6B7280] mt-1 leading-relaxed">Describe your event type, audience, and goals — get a full event plan with venue options, promotional copy, and a ready-to-send invite sequence.</div>
          </div>
          <div className="text-xs font-medium mt-auto text-teal-400">Launch workflow →</div>
        </div>
      </div>

      <TwoCol
        main={
          <SectionCard title="Content Queue" action="View all">
            <Table
              cols={['Platform', 'Content Preview', 'Scheduled Date', 'Status']}
              rows={content.map((c) => [
                <span key={c.platform + c.date} className="text-xs font-semibold" style={{ color: '#0D9488' }}>{c.platform}</span>,
                <span key={c.preview} className="block max-w-xs truncate text-xs" style={{ color: '#9CA3AF' }}>{c.preview}</span>,
                c.date,
                <Badge key={c.date + c.platform} status={c.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Campaign Performance">
              {campaigns.map((c) => (
                <PanelItem key={c.name} title={c.name} sub={`Sent: ${c.sent} · Open: ${c.openRate} · CTR: ${c.ctr}`} badge={c.badge} />
              ))}
            </SectionCard>
            <SectionCard title="Top Leads by Score">
              {leads.map((l) => (
                <PanelItem key={l.name} title={l.name} sub={l.company} extra={`Lead score: ${l.score}/100`} badge={l.badge} />
              ))}
            </SectionCard>
          </>
        }
      />
      {showCampaign && <CampaignBuilderModal onClose={() => setShowCampaign(false)} onToast={showToast} />}
      {showCaseStudy && <CaseStudyModal onClose={() => setShowCaseStudy(false)} onSubmit={() => showToast('Case study saved to Marketing Library')} />}
      {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} onToast={showToast} />}
      {showWebinar && <WebinarSetupModal onClose={() => setShowWebinar(false)} onToast={showToast} />}
      {showLeadReport && <LeadReportModal onClose={() => setShowLeadReport(false)} onToast={showToast} />}
      <AIInsightsReport dept="marketing" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="marketing" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="marketing" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Marketing</span>
            </div>
            <ul className="space-y-2.5">
              {marketingHighlights.map((h: string, i: number) => (
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
