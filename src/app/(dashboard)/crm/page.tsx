'use client'

import { useState } from 'react'
import { Phone, Heart, TrendingUp, AlertCircle, Star, Search, Download, Sparkles, Users, RotateCcw } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'

const stats = [
  { label: 'Total Customers',      value: '171',     trend: '+4',   trendDir: 'up'   as const, trendGood: true,  icon: Users,       sub: 'active accounts'  },
  { label: 'MRR',                  value: '£28,400', trend: '+6%',  trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp,  sub: 'vs last month'    },
  { label: 'Churn Rate',           value: '2.1%',    trend: '-0.2%',trendDir: 'down' as const, trendGood: true,  icon: AlertCircle, sub: 'below 3% target'  },
  { label: 'NPS Score',            value: '67',      trend: '+4',   trendDir: 'up'   as const, trendGood: true,  icon: Star,        sub: 'this month'       },
  { label: 'Renewals This Month',  value: '4',       trend: '+2',   trendDir: 'up'   as const, trendGood: false, icon: RotateCcw,   sub: 'action required'  },
]

const actions = [
  { label: 'Log Call',       icon: Phone       },
  { label: 'Health Check',   icon: Heart       },
  { label: 'Chase Renewal',  icon: RotateCcw   },
  { label: 'Send NPS',       icon: Star        },
  { label: 'Account Review', icon: Users       },
  { label: 'Dept Insights',  icon: Sparkles    },
]

const highlights = [
  'Apex Consulting — 14 days since last contact, renewal in 3 weeks — flagged at risk',
  '10 accounts due for renewal in the next 30 days representing £42,000 ARR',
  'Customer health breakdown: 132 healthy · 29 at risk · 10 critical',
  'NPS score up to 67 this month — 3 new positive reviews added to the wall',
  'Churn rate at 2.1% — below the 3% target for the fourth consecutive month',
]

const customers = [
  { school: 'Greenfield Academy',   contact: 'Helen Park',    email: 'helen.park@greenfield.sch.uk',   phone: '01234 567890', district: 'Oxfordshire',     trust: 'Greenfield MAT',       country: 'England',    product: 'Lumio Core', plan: 'Growth',     status: 'Active',  health: 'Healthy'  },
  { school: 'Bramble Hill Trust',   contact: 'Tom Wright',    email: 'tom.wright@bramblehill.org.uk',  phone: '01432 112233', district: 'Herefordshire',   trust: 'Bramble Hill Trust',   country: 'England',    product: 'Lumio Pro',  plan: 'Enterprise', status: 'Active',  health: 'Healthy'  },
  { school: 'Hopscotch Learning',   contact: 'Lisa Chen',     email: 'l.chen@hopscotch.sch.uk',        phone: '0161 445 9900',district: 'Manchester',      trust: 'Independent',          country: 'England',    product: 'Lumio Core', plan: 'Starter',    status: 'Active',  health: 'At Risk'  },
  { school: 'Oakridge Schools Ltd', contact: 'Ben Armitage',  email: 'b.armitage@oakridge.co.uk',      phone: '0113 287 6541',district: 'West Yorkshire',  trust: 'Oakridge MAT',         country: 'England',    product: 'Lumio Pro',  plan: 'Growth',     status: 'Active',  health: 'Healthy'  },
  { school: 'Crestview Academy',    contact: 'Amy Hughes',    email: 'a.hughes@crestview.ac.uk',       phone: '029 2045 6789',district: 'Cardiff',         trust: 'Independent',          country: 'Wales',      product: 'Lumio Core', plan: 'Growth',     status: 'Active',  health: 'Healthy'  },
  { school: 'Elmfield Institute',   contact: 'Paul Norton',   email: 'p.norton@elmfield.org',          phone: '0131 552 3344',district: 'Edinburgh',       trust: 'Elmfield Trust',       country: 'Scotland',   product: 'Lumio Core', plan: 'Starter',    status: 'Pending', health: 'At Risk'  },
  { school: 'Whitestone College',   contact: 'Fiona Reed',    email: 'f.reed@whitestone.ac.uk',        phone: '01865 778800', district: 'Oxfordshire',     trust: 'Whitestone MAT',       country: 'England',    product: 'Lumio Pro',  plan: 'Enterprise', status: 'Active',  health: 'Healthy'  },
  { school: 'Sunfield Trust',       contact: 'Gary Stone',    email: 'g.stone@sunfield.org.uk',        phone: '01473 991122', district: 'Suffolk',         trust: 'Sunfield Partnership', country: 'England',    product: 'Lumio Core', plan: 'Starter',    status: 'Pending', health: 'Critical' },
  { school: 'Pinebrook Primary',    contact: 'Sandra Bell',   email: 's.bell@pinebrook.sch.uk',        phone: '01603 667788', district: 'Norfolk',         trust: 'Independent',          country: 'England',    product: 'Lumio Lite', plan: 'Starter',    status: 'Active',  health: 'Healthy'  },
  { school: 'Riverdale Education',  contact: 'James Hollis',  email: 'j.hollis@riverdale.co.uk',       phone: '0121 456 7890',district: 'West Midlands',   trust: 'Riverdale MAT',        country: 'England',    product: 'Lumio Pro',  plan: 'Growth',     status: 'Active',  health: 'Healthy'  },
  { school: 'Starling Schools',     contact: 'Rachel Fox',    email: 'r.fox@starling.sch.uk',          phone: '01904 332211', district: 'North Yorkshire', trust: 'Starling Trust',       country: 'England',    product: 'Lumio Core', plan: 'Growth',     status: 'Active',  health: 'Healthy'  },
  { school: 'Helix Education',      contact: 'David Holt',    email: 'd.holt@helixedu.co.uk',          phone: '0117 929 4400',district: 'Bristol',         trust: 'Independent',          country: 'England',    product: 'Lumio Pro',  plan: 'Enterprise', status: 'Active',  health: 'Healthy'  },
  { school: 'Torchbearer Trust',    contact: 'Priya Sharma',  email: 'p.sharma@torchbearer.org.uk',    phone: '01512 334455', district: 'Merseyside',      trust: 'Torchbearer MAT',      country: 'England',    product: 'Lumio Core', plan: 'Growth',     status: 'Active',  health: 'At Risk'  },
  { school: 'Lakewood Academy',     contact: 'Michael Grant', email: 'm.grant@lakewood.sch.uk',        phone: '01604 551122', district: 'Northamptonshire',trust: 'Lakewood MAT',         country: 'England',    product: 'Lumio Lite', plan: 'Starter',    status: 'Pending', health: 'Critical' },
  { school: 'Fernview College',     contact: 'Yasmin Patel',  email: 'y.patel@fernview.ac.uk',         phone: '02890 667700', district: 'Belfast',         trust: 'Independent',          country: 'N. Ireland', product: 'Lumio Core', plan: 'Growth',     status: 'Active',  health: 'Healthy'  },
]

const renewals = [
  { company: 'Sunfield Trust',     due: '12 Apr 2026', arr: '£14,800', health: 'Critical' },
  { company: 'Elmfield Institute', due: '18 Apr 2026', arr: '£33,400', health: 'At Risk'  },
  { company: 'Bramble Hill Trust', due: '2 May 2026',  arr: '£76,000', health: 'Healthy'  },
  { company: 'Pinebrook Primary',  due: '15 May 2026', arr: '£22,000', health: 'Healthy'  },
]

const churnRisk = [
  { company: 'Sunfield Trust',     reason: 'No login in 42 days',     score: 91 },
  { company: 'Lakewood Academy',   reason: 'Support tickets x4',      score: 78 },
  { company: 'Hopscotch Learning', reason: 'Downgrade request sent',  score: 65 },
  { company: 'Torchbearer Trust',  reason: 'Key contact left',        score: 58 },
]

const COUNTRIES = ['All Countries',  'England', 'Wales', 'Scotland', 'N. Ireland']
const PRODUCTS  = ['All Products',   'Lumio Core', 'Lumio Pro', 'Lumio Lite']
const HEALTH    = ['All Health',     'Healthy', 'At Risk', 'Critical']

function healthColor(h: string) {
  if (h === 'Healthy')  return { bg: 'rgba(34,197,94,0.1)',   text: '#22C55E' }
  if (h === 'At Risk')  return { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' }
  return { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' }
}

function FilterSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: value === options[0] ? '#9CA3AF' : '#F9FAFB', minWidth: 130 }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function CRMPage() {
  const [country,  setCountry]  = useState('All Countries')
  const [product,  setProduct]  = useState('All Products')
  const [health,   setHealth]   = useState('All Health')
  const [search,   setSearch]   = useState('')

  const filtered = customers.filter((c) => {
    if (country !== 'All Countries' && c.country  !== country)  return false
    if (product !== 'All Products'  && c.product  !== product)  return false
    if (health  !== 'All Health'    && c.health   !== health)   return false
    if (search && !c.school.toLowerCase().includes(search.toLowerCase()) &&
                  !c.contact.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <PageShell>
      <ChartSection points={stats.slice(0, 4).map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      {/* AI Highlights */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>CRM</span>
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
          <SectionCard title="Customer Account List">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3" style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  placeholder="Search school or contact…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg py-2 pl-8 pr-3 text-sm"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', width: 210 }}
                />
              </div>
              <FilterSelect options={COUNTRIES} value={country} onChange={setCountry} />
              <FilterSelect options={PRODUCTS}  value={product} onChange={setProduct} />
              <FilterSelect options={HEALTH}    value={health}  onChange={setHealth}  />
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{filtered.length} accounts</span>
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
                >
                  <Download size={13} /> Export
                </button>
              </div>
            </div>
            <Table
              cols={['School', 'Contact', 'Product', 'Plan', 'Health', 'Status']}
              rows={filtered.map((c) => {
                const hc = healthColor(c.health)
                return [
                  c.school,
                  <span key={c.email}>
                    <span className="block text-xs font-medium" style={{ color: '#F9FAFB' }}>{c.contact}</span>
                    <span className="block text-xs" style={{ color: '#9CA3AF' }}>{c.email}</span>
                  </span>,
                  <span key={c.product} className="text-xs font-semibold" style={{ color: '#0D9488' }}>{c.product}</span>,
                  c.plan,
                  <span key={c.health + c.school} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: hc.bg, color: hc.text }}>{c.health}</span>,
                  <Badge key={c.school + 's'} status={c.status} />,
                ]
              })}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Renewals Due (90 Days)">
              {renewals.map((r) => {
                const hc = healthColor(r.health)
                return (
                  <PanelItem
                    key={r.company}
                    title={r.company}
                    sub={`Due: ${r.due}`}
                    extra={`ARR: ${r.arr}`}
                    badge={<span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: hc.bg, color: hc.text }}>{r.health}</span> as unknown as string}
                  />
                )
              })}
            </SectionCard>

            <SectionCard title="Churn Risk Alerts">
              {churnRisk.map((r) => (
                <div key={r.company} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                  <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{r.company}</p>
                    <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{r.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold" style={{ color: r.score >= 80 ? '#EF4444' : r.score >= 60 ? '#F59E0B' : '#9CA3AF' }}>{r.score}%</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>risk</p>
                  </div>
                </div>
              ))}
            </SectionCard>
          </>
        }
      />
    </PageShell>
  )
}
