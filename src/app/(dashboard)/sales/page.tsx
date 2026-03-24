'use client'

import { TrendingUp, UserPlus, FlaskConical, FileText, Phone, Send, Calendar, Sparkles } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'

const stats = [
  { label: 'Open Deals',       value: '34',    trend: '+8%',  trendDir: 'up' as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month'   },
  { label: 'Pipeline Value',   value: '£2.4M', trend: '+12%', trendDir: 'up' as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month'   },
  { label: 'Win Rate (30d)',   value: '23%',   trend: '+3%',  trendDir: 'up' as const, trendGood: true,  icon: TrendingUp, sub: 'deals closed won' },
  { label: 'Hot Leads',        value: '4',     trend: '+1',   trendDir: 'up' as const, trendGood: true,  icon: UserPlus,   sub: 'score ≥ 70/100'  },
]

const actions = [
  { label: 'New Deal',         icon: TrendingUp   },
  { label: 'Book Demo',        icon: Calendar     },
  { label: 'Send Proposal',    icon: FileText     },
  { label: 'Log Call',         icon: Phone        },
  { label: 'New Lead',         icon: UserPlus     },
  { label: 'Dept Insights',    icon: Sparkles     },
]

const deals = [
  { company: 'Greenfield Academy',   stage: 'Negotiation', value: '£42,000', owner: 'Dan Marsh',   activity: '2h ago'    },
  { company: 'Hopscotch Learning',   stage: 'Proposal',    value: '£28,500', owner: 'Sophie Bell', activity: '4h ago'    },
  { company: 'Bramble Hill Trust',   stage: 'Discovery',   value: '£76,000', owner: 'Dan Marsh',   activity: 'Yesterday' },
  { company: 'Crestview Academy',    stage: 'Proposal',    value: '£19,200', owner: 'Raj Patel',   activity: '3h ago'    },
  { company: 'Oakridge Schools Ltd', stage: 'Negotiation', value: '£55,000', owner: 'Sophie Bell', activity: 'Today'     },
  { company: 'Elmfield Institute',   stage: 'Discovery',   value: '£33,400', owner: 'Raj Patel',   activity: '2d ago'    },
  { company: 'Whitestone College',   stage: 'Closed',      value: '£91,000', owner: 'Dan Marsh',   activity: 'Today'     },
  { company: 'Sunfield Trust',       stage: 'Proposal',    value: '£14,800', owner: 'Sophie Bell', activity: '6h ago'    },
  { company: 'Pinebrook Primary',    stage: 'Lost',        value: '£22,000', owner: 'Raj Patel',   activity: '1w ago'    },
  { company: 'Riverdale Education',  stage: 'Discovery',   value: '£48,000', owner: 'Dan Marsh',   activity: 'Yesterday' },
]

const hotLeads = [
  { company: 'Lakewood Academy',  src: 'SA-02 warm outreach', score: '87/100' },
  { company: 'Fernview College',  src: 'SA-02 inbound form',  score: '79/100' },
  { company: 'Torchbearer Trust', src: 'SA-02 referral',      score: '72/100' },
  { company: 'Brightfields MAT',  src: 'SA-02 event lead',    score: '68/100' },
]

const outreach = [
  { name: 'Spring Term Warm Outreach', status: 'Active',   sent: 142, replies: 18, meetings: 4 },
  { name: 'MAT Expansion Sequence',    status: 'Active',   sent: 67,  replies: 9,  meetings: 2 },
  { name: 'Competitor Switch Campaign',status: 'Paused',   sent: 38,  replies: 3,  meetings: 1 },
  { name: 'Re-engagement — Lost Deals',status: 'Draft',    sent: 0,   replies: 0,  meetings: 0 },
]

const highlights = [
  '3 trials expiring this week — £8,400 combined value at risk of not converting',
  'Pipeline velocity up 18% — deals now closing in an average of 11 days',
  'Oakridge Schools demo today at 11am — prep briefing and deck ready to review',
  '12 open deals totalling £68,400 currently active in pipeline',
  'Top performing source this month: referrals at 40% conversion rate',
]

export default function SalesPage() {
  return (
    <PageShell>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      {/* AI Highlights */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Sales</span>
        </div>
        <ul className="space-y-2.5">
          {highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
              {h}
            </li>
          ))}
        </ul>
      </div>

      <TwoCol
        main={
          <SectionCard title="Deal Pipeline" action="View all">
            <Table
              cols={['Company', 'Stage', 'Value', 'Owner', 'Last Activity']}
              rows={deals.map((d) => [
                d.company,
                <Badge key={d.company} status={d.stage} />,
                d.value, d.owner, d.activity,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Hot Leads — SA-02">
              {hotLeads.map((l) => (
                <PanelItem key={l.company} title={l.company} sub={l.src} extra={`Lead score: ${l.score}`} badge="Active" />
              ))}
            </SectionCard>

            <SectionCard title="Outreach Sequences">
              {outreach.map((o) => (
                <PanelItem
                  key={o.name}
                  title={o.name}
                  sub={`${o.sent} sent · ${o.replies} replies · ${o.meetings} meetings`}
                  badge={o.status}
                />
              ))}
            </SectionCard>
          </>
        }
      />
    </PageShell>
  )
}
