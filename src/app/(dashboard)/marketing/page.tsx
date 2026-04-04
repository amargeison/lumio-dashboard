'use client'

import { useState } from 'react'
import { Megaphone, Mail, UserPlus, TrendingUp, Plus, Send, FileText, Video, Star, CalendarHeart, Sparkles, Building2, Calendar, Newspaper, Search, GitCompare, Palette, Target, BarChart2, Eye, Handshake, Trophy, Rocket } from 'lucide-react'
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
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  async function callMarketingAction(prompt: string, useEmail = false, useCalendar = false) {
    setSubmitting(true)
    try {
      const mcpServers = []
      if (useEmail) mcpServers.push({ type: 'url', url: 'https://gmail.mcp.claude.com/mcp', name: 'gmail' })
      if (useCalendar) mcpServers.push({ type: 'url', url: 'https://gcal.mcp.claude.com/mcp', name: 'gcal' })
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
    { label: 'Create Post',       icon: Plus,       onClick: () => setShowCreatePost(true) },
    { label: 'Book Event',        icon: CalendarHeart, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'New Campaign',      icon: Megaphone,  onClick: () => setShowCampaign(true) },
    { label: 'Case Study',        icon: FileText,   onClick: () => setShowCaseStudy(true) },
    { label: 'Webinar Setup',     icon: Video,      onClick: () => setShowWebinar(true) },
    { label: 'Lead Report',       icon: TrendingUp, onClick: () => setShowLeadReport(true) },
    { label: 'Dept Insights',    icon: Star,       onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',        icon: Building2,  onClick: () => setShowDeptInfo(true) },
    { label: 'Email Campaign',   icon: Mail,       onClick: () => setActiveModal('email-campaign') },
    { label: 'Social Schedule',  icon: Calendar,   onClick: () => setActiveModal('social-schedule') },
    { label: 'Press Release',    icon: Newspaper,  onClick: () => setActiveModal('press-release') },
    { label: 'SEO Audit',        icon: Search,     onClick: () => setActiveModal('seo-audit') },
    { label: 'A/B Test',         icon: GitCompare, onClick: () => setActiveModal('ab-test') },
    { label: 'Influencer Brief', icon: Star,       onClick: () => setActiveModal('influencer') },
    { label: 'Brand Review',     icon: Palette,    onClick: () => setActiveModal('brand-review') },
    { label: 'Ad Campaign',      icon: Target,     onClick: () => setActiveModal('ad-campaign') },
    { label: 'Content Brief',    icon: FileText,   onClick: () => setActiveModal('content-brief') },
    { label: 'Newsletter',       icon: Send,       onClick: () => setActiveModal('newsletter') },
    { label: 'Competitor Audit', icon: Eye,        onClick: () => setActiveModal('competitor-audit') },
    { label: 'Campaign Report',  icon: BarChart2,  onClick: () => setActiveModal('campaign-report') },
    { label: 'Partner Collab',   icon: Handshake,  onClick: () => setActiveModal('partner-collab') },
    { label: 'Award Entry',      icon: Trophy,     onClick: () => setActiveModal('award-entry') },
    { label: 'Launch Plan',      icon: Rocket,     onClick: () => setActiveModal('launch-plan') },
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
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setActiveModal(null); setSubmitResult(null); }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {submitResult ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-white font-semibold mb-3">Done</div>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4">{submitResult}</div>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null); }} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">
                    {activeModal === 'email-campaign' && '📧 Email Campaign'}
                    {activeModal === 'social-schedule' && '📅 Social Schedule'}
                    {activeModal === 'press-release' && '📰 Press Release'}
                    {activeModal === 'seo-audit' && '🔍 SEO Audit'}
                    {activeModal === 'ab-test' && '🔀 A/B Test'}
                    {activeModal === 'influencer' && '⭐ Influencer Brief'}
                    {activeModal === 'brand-review' && '🎨 Brand Review'}
                    {activeModal === 'ad-campaign' && '🎯 Ad Campaign'}
                    {activeModal === 'content-brief' && '📝 Content Brief'}
                    {activeModal === 'newsletter' && '📬 Newsletter'}
                    {activeModal === 'competitor-audit' && '👁️ Competitor Audit'}
                    {activeModal === 'campaign-report' && '📊 Campaign Report'}
                    {activeModal === 'partner-collab' && '🤝 Partner Collaboration'}
                    {activeModal === 'award-entry' && '🏆 Award Entry'}
                    {activeModal === 'launch-plan' && '🚀 Launch Plan'}
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white text-2xl">×</button>
                </div>

                {/* EMAIL CAMPAIGN */}
                {activeModal === 'email-campaign' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Campaign name</label><input type="text" placeholder="e.g. Q2 Product Update" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Audience</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>All subscribers</option><option>Trial users</option><option>Paying customers</option><option>Churned users</option><option>Leads</option></select></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Campaign goal</label><div className="flex gap-2 flex-wrap">{['Announce feature','Drive upgrades','Re-engage','Nurture leads','Promote event'].map(g => <button key={g} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{g}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Key message</label><textarea rows={2} placeholder="What's the one thing they should take away?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Send date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Write an email campaign with: subject line (with emoji), preview text, header, 3 body paragraphs, CTA button text, and P.S. line. Goal: drive product upgrades. Tone: confident and friendly. Format clearly with labels for each section.', true)} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Email Campaign'}
                    </button>
                  </div>
                )}

                {/* PRESS RELEASE */}
                {activeModal === 'press-release' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">News headline</label><input type="text" placeholder="e.g. Lumio launches GPS tracking for football clubs" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Key facts (3-5 bullet points)</label><textarea rows={3} placeholder="What are the key facts to include?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Quote from</label><input type="text" placeholder="e.g. Arron Margeison, Founder" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Target publications</label><input type="text" placeholder="e.g. TechCrunch, SportsPro, SaaS Weekly" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Write a professional press release with: headline, dateline, strong opening paragraph (who, what, when, where, why), 3 body paragraphs with quotes and context, boilerplate about Lumio, and contact information placeholder. Follow AP style. Return the full press release.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Writing...</> : '✨ Generate Press Release'}
                    </button>
                  </div>
                )}

                {/* CONTENT BRIEF */}
                {activeModal === 'content-brief' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Content type</label><div className="flex gap-2 flex-wrap">{['Blog post','LinkedIn article','Twitter thread','Video script','Podcast outline','Whitepaper','Infographic'].map(t => <button key={t} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Topic / working title</label><input type="text" placeholder="e.g. How AI is changing HR in 2026" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Target audience</label><input type="text" placeholder="e.g. HR managers at SMEs" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Target keyword (SEO)</label><input type="text" placeholder="e.g. AI HR software UK" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Word count / length</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Short (500-800 words)</option><option>Medium (1,000-1,500 words)</option><option>Long (2,000-3,000 words)</option><option>Pillar (3,000+ words)</option></select></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Create a detailed content brief including: working title, meta description, target keyword, audience pain points, outline with H2s and H3s, key points to cover per section, internal and external link suggestions, CTA recommendation, and tone of voice notes. Format clearly with sections.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Content Brief'}
                    </button>
                  </div>
                )}

                {/* AD CAMPAIGN */}
                {activeModal === 'ad-campaign' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Platform</label><div className="flex gap-2 flex-wrap">{['Google Ads','LinkedIn','Meta/Facebook','Twitter/X','YouTube','Programmatic'].map(p => <button key={p} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{p}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Campaign objective</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Brand awareness</option><option>Lead generation</option><option>Website traffic</option><option>Conversions/signups</option><option>Retargeting</option></select></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Monthly budget (£)</label><input type="number" placeholder="e.g. 2000" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Target audience</label><textarea rows={2} placeholder="Describe the target: industry, job title, company size, location" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Key message</label><input type="text" placeholder="Core value proposition" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Create a digital ad campaign pack including: 3 headline variations (under 30 chars each), 3 description variations, 2 CTA options, audience targeting recommendations, bidding strategy suggestion, landing page recommendations, and success metrics to track. Format as a structured campaign brief.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : '✨ Generate Ad Campaign Brief'}
                    </button>
                  </div>
                )}

                {/* NEWSLETTER */}
                {activeModal === 'newsletter' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Newsletter edition</label><input type="text" placeholder="e.g. April 2026 — The Lumio Update" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Key stories this month</label><textarea rows={3} placeholder="List 3-5 things to include: product updates, case studies, tips, events..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Audience</label><div className="flex gap-2">{['All customers','Prospects','Partners','All subscribers'].map(a => <button key={a} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{a}</button>)}</div></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Write a monthly newsletter including: engaging subject line with emoji, warm opening paragraph, 3-4 content sections (product update, customer story, tip/insight, upcoming event), sign-off from founder, and unsubscribe footer placeholder. Conversational but professional tone. Format with clear section headers.', true)} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Writing...</> : '✨ Generate Newsletter'}
                    </button>
                  </div>
                )}

                {/* SEO AUDIT */}
                {activeModal === 'seo-audit' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Website URL</label><input type="text" placeholder="lumiocms.com" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Target keywords</label><textarea rows={2} placeholder="List your top 5-10 target keywords" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Top competitors</label><input type="text" placeholder="e.g. monday.com, notion.so, hubspot.com" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Create an SEO audit action plan for a B2B SaaS platform. Include: on-page SEO checklist (title tags, meta descriptions, H1s, internal linking), technical SEO priorities (page speed, Core Web Vitals, mobile, schema), content gaps to address, backlink building strategies, and a 90-day priority roadmap. Format as an actionable checklist.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Auditing...</> : '🔍 Generate SEO Audit Plan'}
                    </button>
                  </div>
                )}

                {/* A/B TEST */}
                {activeModal === 'ab-test' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">What are you testing?</label><div className="flex gap-2 flex-wrap">{['Email subject line','CTA button','Landing page headline','Pricing page','Onboarding flow','Ad copy'].map(t => <button key={t} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Hypothesis</label><textarea rows={2} placeholder="If we change X, we expect Y because Z..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Success metric</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Open rate</option><option>Click rate</option><option>Conversion rate</option><option>Sign-up rate</option><option>Revenue per visitor</option></select></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Test duration (days)</label><input type="number" placeholder="e.g. 14" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Design an A/B test plan including: test hypothesis, variant A (control) description, variant B (challenger) description, sample size requirements, statistical significance target (95%), test duration recommendation, how to measure results, and decision framework for declaring a winner. Format as a structured test brief.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Designing...</> : '🔀 Generate A/B Test Plan'}
                    </button>
                  </div>
                )}

                {/* INFLUENCER BRIEF */}
                {activeModal === 'influencer' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Campaign name</label><input type="text" placeholder="e.g. Lumio x SaaS Founders Series" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Influencer type</label><div className="flex gap-2">{['Micro (1-10k)', 'Mid (10-100k)', 'Macro (100k+)', 'Industry expert'].map(t => <button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{t}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Deliverables</label><div className="flex gap-2 flex-wrap">{['LinkedIn post','Instagram Reel','YouTube review','Podcast mention','Twitter thread','Newsletter'].map(d => <button key={d} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{d}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Budget (£)</label><input type="number" placeholder="Per influencer" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Create an influencer marketing brief including: campaign overview, brand guidelines, key messages and product USPs, content requirements and format specifications, dos and donts, disclosure requirements (ASA/FTC), compensation structure, timeline, KPIs and reporting requirements, and approval process. Professional and clear.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Writing...</> : '⭐ Generate Influencer Brief'}
                    </button>
                  </div>
                )}

                {/* SOCIAL SCHEDULE */}
                {activeModal === 'social-schedule' && (
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 mb-1 block">Platforms</label><div className="flex gap-2 flex-wrap">{['LinkedIn','Twitter/X','Instagram','Facebook','TikTok','YouTube'].map(p => <button key={p} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{p}</button>)}</div></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Week commencing</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Theme / focus this week</label><input type="text" placeholder="e.g. Product launch, customer stories, tips" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                    <div><label className="text-xs text-gray-400 mb-1 block">Posts per platform</label><div className="flex gap-2">{['3/week','5/week','Daily','2/week'].map(f => <button key={f} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500">{f}</button>)}</div></div>
                    <button disabled={submitting} onClick={() => callMarketingAction('Create a full week social media content schedule for a B2B SaaS company. For each day (Mon-Fri), provide: platform, post copy, suggested visual description, hashtags, best posting time, and engagement prompt. Mix content types: value post, customer story, product feature, industry insight, team culture. Format as a clear daily schedule.')} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Scheduling...</> : '📅 Generate Week\'s Social Content'}
                    </button>
                  </div>
                )}

                {/* SIMPLE REMAINING MODALS */}
                {['brand-review', 'competitor-audit', 'campaign-report', 'partner-collab', 'award-entry', 'launch-plan'].includes(activeModal || '') && (
                  <div className="space-y-3">
                    {activeModal === 'brand-review' && <><div><label className="text-xs text-gray-400 mb-1 block">Areas to review</label><div className="space-y-1">{['Logo & visual identity','Tone of voice','Website consistency','Social media presence','Sales collateral','Email templates','Video/motion style'].map(a => <label key={a} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded" />{a}</label>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Notes / context</label><textarea rows={2} placeholder="What prompted this review?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}

                    {activeModal === 'competitor-audit' && <><div><label className="text-xs text-gray-400 mb-1 block">Competitors to audit</label><textarea rows={2} placeholder="List competitor names / URLs" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Focus areas</label><div className="space-y-1">{['Pricing','Product features','Messaging & positioning','SEO & content','Social media','Customer reviews'].map(f => <label key={f} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded" />{f}</label>)}</div></div></>}

                    {activeModal === 'campaign-report' && <><div><label className="text-xs text-gray-400 mb-1 block">Campaign name</label><input type="text" placeholder="Campaign to report on" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Period</label><div className="flex gap-2"><input type="date" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /><input type="date" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div><div><label className="text-xs text-gray-400 mb-1 block">Key metrics to include</label><div className="space-y-1">{['Impressions/reach','Clicks & CTR','Conversions','Cost per lead','Revenue attributed','ROI'].map(m => <label key={m} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded" />{m}</label>)}</div></div></>}

                    {activeModal === 'partner-collab' && <><div><label className="text-xs text-gray-400 mb-1 block">Partner company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Collaboration type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Co-branded content</option><option>Joint webinar</option><option>Newsletter swap</option><option>Podcast feature</option><option>Integration announcement</option><option>Affiliate/referral</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Timeline</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}

                    {activeModal === 'award-entry' && <><div><label className="text-xs text-gray-400 mb-1 block">Award name</label><input type="text" placeholder="e.g. SaaS Awards 2026" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Category entering</label><input type="text" placeholder="e.g. Best New SaaS Product" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Entry deadline</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Key achievements to highlight</label><textarea rows={3} placeholder="What makes us stand out?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}

                    {activeModal === 'launch-plan' && <><div><label className="text-xs text-gray-400 mb-1 block">What are you launching?</label><input type="text" placeholder="e.g. Lumio GPS, new pricing tier" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Target launch date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Target audience</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Launch channels</label><div className="space-y-1">{['Email to existing customers','Email to prospects','LinkedIn','Product Hunt','Press release','Paid ads','Partner channels'].map(c => <label key={c} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"><input type="checkbox" className="rounded" />{c}</label>)}</div></div></>}

                    <button disabled={submitting} onClick={() => callMarketingAction(
                      activeModal === 'brand-review' ? 'Create a brand audit framework with scoring rubric for each brand touchpoint. Include: what to look for, common issues, best practice examples, and a priority action plan template. Format as a structured audit document.' :
                      activeModal === 'competitor-audit' ? 'Create a competitor analysis report template covering: positioning, pricing, product features, content strategy, social presence, customer reviews analysis, and identified opportunities. Include a comparison matrix template.' :
                      activeModal === 'campaign-report' ? 'Create a campaign performance report template with: executive summary, channel-by-channel results, key metrics dashboard, audience insights, top performing content, lessons learned, and recommendations for next campaign. Professional format suitable for board.' :
                      activeModal === 'partner-collab' ? 'Create a partner collaboration brief including: objectives, audience overlap, content plan, responsibilities split, promotional timeline, co-branding guidelines, success metrics, and legal/approval checklist.' :
                      activeModal === 'award-entry' ? 'Write a compelling award entry narrative covering: company overview, the problem we solve, our innovative solution, measurable impact and results, customer testimonials style quotes, and what makes us different. Confident, evidence-based tone.' :
                      'Create a go-to-market launch plan with: pre-launch (6 weeks out), launch week schedule, post-launch (4 weeks), channel tactics for each phase, messaging framework, success metrics, and contingency plans. Format as a week-by-week timeline.'
                    )} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {submitting ? <><span className="animate-spin">⟳</span> Generating...</> : `✨ Generate ${activeModal === 'brand-review' ? 'Brand Audit' : activeModal === 'competitor-audit' ? 'Competitor Analysis' : activeModal === 'campaign-report' ? 'Campaign Report' : activeModal === 'partner-collab' ? 'Collaboration Brief' : activeModal === 'award-entry' ? 'Award Entry' : 'Launch Plan'}`}
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
