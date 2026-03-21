'use client'

import { FlaskConical, Clock, TrendingUp, Calendar, UserPlus, Send, FileText, AlertCircle } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'

const stats = [
  { label: 'Active Trials',           value: '23',  trend: '0',    trendDir: 'up'   as const, trendGood: true,  icon: FlaskConical, sub: 'vs last week'  },
  { label: 'Trials Ending This Week', value: '5',   trend: '+2',   trendDir: 'up'   as const, trendGood: false, icon: AlertCircle,  sub: 'need follow-up'},
  { label: 'Conversion Rate',         value: '62%', trend: '+5%',  trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp,   sub: 'vs last quarter'},
  { label: 'Avg Trial Length',        value: '14d', trend: '0',    trendDir: 'up'   as const, trendGood: true,  icon: Clock,        sub: 'stable'        },
]

const actions = [
  { label: 'New Trial',          icon: FlaskConical },
  { label: 'Send Day 3 Email',   icon: Send         },
  { label: 'Send Day 7 Email',   icon: Send         },
  { label: 'Convert to Customer',icon: UserPlus     },
  { label: 'End Trial',          icon: AlertCircle  },
]

const trials = [
  { company: 'Lakewood Academy',    contact: 'Rachel Fox',   start: '8 Mar 2026',  day: 'Day 13', engagement: 'High',   status: 'Active'  },
  { company: 'Fernview College',    contact: 'Gary Stone',   start: '12 Mar 2026', day: 'Day 9',  engagement: 'Medium', status: 'Active'  },
  { company: 'Torchbearer Trust',   contact: 'Ann Mehta',    start: '15 Mar 2026', day: 'Day 6',  engagement: 'High',   status: 'Active'  },
  { company: 'Brightfields MAT',    contact: 'Lee Dawson',   start: '17 Mar 2026', day: 'Day 4',  engagement: 'Low',    status: 'Active'  },
  { company: 'Starling Schools',    contact: 'Maria Olsen',  start: '5 Mar 2026',  day: 'Day 16', engagement: 'High',   status: 'Ending'  },
  { company: 'Northpoint Primary',  contact: 'Jake Burns',   start: '3 Mar 2026',  day: 'Day 18', engagement: 'Medium', status: 'Ending'  },
  { company: 'Helix Education',     contact: 'Priya Shah',   start: '1 Mar 2026',  day: 'Day 20', engagement: 'Low',    status: 'Ending'  },
  { company: 'Calibre Learning',    contact: 'Owen James',   start: '20 Feb 2026', day: 'Day 29', engagement: 'High',   status: 'Ending'  },
  { company: 'Apex Tutors',         contact: 'Nina Webb',    start: '18 Feb 2026', day: 'Day 31', engagement: 'High',   status: 'Converted'},
  { company: 'Meridian College',    contact: 'Adam Cole',    start: '15 Feb 2026', day: 'Day 34', engagement: 'Low',    status: 'Ended'   },
]

function EngagementDot({ level }: { level: string }) {
  const color = level === 'High' ? '#22C55E' : level === 'Medium' ? '#F59E0B' : '#EF4444'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span style={{ color: '#9CA3AF' }}>{level}</span>
    </span>
  )
}

const endingSoon = [
  { company: 'Starling Schools',   days: '2 days',  contact: 'Maria Olsen',  engagement: 'High'   },
  { company: 'Northpoint Primary', days: '4 days',  contact: 'Jake Burns',   engagement: 'Medium' },
  { company: 'Helix Education',    days: '4 days',  contact: 'Priya Shah',   engagement: 'Low'    },
  { company: 'Calibre Learning',   days: '1 day',   contact: 'Owen James',   engagement: 'High'   },
]

const opportunities = [
  { company: 'Lakewood Academy',  reason: 'High engagement, Day 13',    badge: 'Active'   },
  { company: 'Torchbearer Trust', reason: 'Demo attended, Day 6',       badge: 'Active'   },
  { company: 'Calibre Learning',  reason: 'Day 29 — ready to convert',  badge: 'Ending'   },
  { company: 'Apex Tutors',       reason: 'Convert call booked',        badge: 'Converted'},
]

export default function TrialsPage() {
  return (
    <PageShell>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="Active Trials" action="View all">
            <Table
              cols={['Company', 'Contact', 'Start Date', 'Day', 'Engagement', 'Status']}
              rows={trials.map((t) => [
                t.company, t.contact, t.start, t.day,
                <EngagementDot key={t.company} level={t.engagement} />,
                <Badge key={t.company + 's'} status={t.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Trials Ending Soon">
              {endingSoon.map((t) => (
                <PanelItem key={t.company} title={t.company} sub={`${t.contact} · Ends in ${t.days}`} extra={`Engagement: ${t.engagement}`} badge="Ending" />
              ))}
            </SectionCard>
            <SectionCard title="Conversion Opportunities">
              {opportunities.map((o) => (
                <PanelItem key={o.company} title={o.company} sub={o.reason} badge={o.badge} />
              ))}
            </SectionCard>
          </>
        }
      />
    </PageShell>
  )
}
