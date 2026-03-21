'use client'

import { useState } from 'react'
import { TrendingUp, UserPlus, FlaskConical, FileText, Phone, AlertCircle, Search, Download } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'

const stats = [
  { label: 'Open Deals',          value: '34',    trend: '+8%',  trendDir: 'up' as const, trendGood: true,  icon: TrendingUp,  sub: 'vs last month'  },
  { label: 'Pipeline Value',      value: '£2.4M', trend: '+12%', trendDir: 'up' as const, trendGood: true,  icon: TrendingUp,  sub: 'vs last month'  },
  { label: 'New Customers (30d)', value: '23',    trend: '+8%',  trendDir: 'up' as const, trendGood: true,  icon: UserPlus,    sub: 'vs prior period'},
  { label: 'Renewal Alerts',      value: '7',     trend: '+2',   trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'due in 90 days' },
]

const actions = [
  { label: 'New Customer',      icon: UserPlus    },
  { label: 'New Trial',         icon: FlaskConical},
  { label: 'Generate Proposal', icon: FileText    },
  { label: 'Log Call',          icon: Phone       },
  { label: 'Renewal Report',    icon: TrendingUp  },
]

const deals = [
  { company: 'Greenfield Academy',     stage: 'Negotiation', value: '£42,000', owner: 'Dan Marsh',    activity: '2h ago'   },
  { company: 'Hopscotch Learning',     stage: 'Proposal',    value: '£28,500', owner: 'Sophie Bell',  activity: '4h ago'   },
  { company: 'Bramble Hill Trust',     stage: 'Discovery',   value: '£76,000', owner: 'Dan Marsh',    activity: 'Yesterday'},
  { company: 'Crestview Academy',      stage: 'Proposal',    value: '£19,200', owner: 'Raj Patel',    activity: '3h ago'   },
  { company: 'Oakridge Schools Ltd',   stage: 'Negotiation', value: '£55,000', owner: 'Sophie Bell',  activity: 'Today'    },
  { company: 'Elmfield Institute',     stage: 'Discovery',   value: '£33,400', owner: 'Raj Patel',    activity: '2d ago'   },
  { company: 'Whitestone College',     stage: 'Closed',      value: '£91,000', owner: 'Dan Marsh',    activity: 'Today'    },
  { company: 'Sunfield Trust',         stage: 'Proposal',    value: '£14,800', owner: 'Sophie Bell',  activity: '6h ago'   },
  { company: 'Pinebrook Primary',      stage: 'Lost',        value: '£22,000', owner: 'Raj Patel',    activity: '1w ago'   },
  { company: 'Riverdale Education',    stage: 'Discovery',   value: '£48,000', owner: 'Dan Marsh',    activity: 'Yesterday'},
]

const hotLeads = [
  { company: 'Lakewood Academy',  src: 'SA-02 warm outreach', score: '87/100' },
  { company: 'Fernview College',  src: 'SA-02 inbound form',  score: '79/100' },
  { company: 'Torchbearer Trust', src: 'SA-02 referral',      score: '72/100' },
  { company: 'Brightfields MAT',  src: 'SA-02 event lead',    score: '68/100' },
]

const renewals = [
  { company: 'Sunfield Trust',       due: '12 Apr 2026', arr: '£14,800' },
  { company: 'Elmfield Institute',   due: '18 Apr 2026', arr: '£33,400' },
  { company: 'Bramble Hill Trust',   due: '2 May 2026',  arr: '£76,000' },
  { company: 'Pinebrook Primary',    due: '15 May 2026', arr: '£22,000' },
]

const customers = [
  { school: 'Greenfield Academy',      contact: 'Helen Park',     email: 'helen.park@greenfield.sch.uk',     phone: '01234 567890', address: '14 Meadow Lane, Oxford',          district: 'Oxfordshire',    trust: 'Greenfield MAT',      country: 'England', product: 'Lumio Core',        plan: 'Growth',     status: 'Active'   },
  { school: 'Bramble Hill Trust',      contact: 'Tom Wright',     email: 'tom.wright@bramblehill.org.uk',    phone: '01432 112233', address: '7 Bramble Close, Hereford',        district: 'Herefordshire',  trust: 'Bramble Hill Trust',  country: 'England', product: 'Lumio Pro',         plan: 'Enterprise', status: 'Active'   },
  { school: 'Hopscotch Learning',      contact: 'Lisa Chen',      email: 'l.chen@hopscotch.sch.uk',         phone: '0161 445 9900', address: '33 North Road, Manchester',       district: 'Manchester',     trust: 'Independent',         country: 'England', product: 'Lumio Core',        plan: 'Starter',    status: 'Active'   },
  { school: 'Oakridge Schools Ltd',    contact: 'Ben Armitage',   email: 'b.armitage@oakridge.co.uk',       phone: '0113 287 6541', address: '9 Oakridge Park, Leeds',          district: 'West Yorkshire', trust: 'Oakridge MAT',        country: 'England', product: 'Lumio Pro',         plan: 'Growth',     status: 'Active'   },
  { school: 'Crestview Academy',       contact: 'Amy Hughes',     email: 'a.hughes@crestview.ac.uk',        phone: '029 2045 6789', address: '22 Castle Road, Cardiff',         district: 'Cardiff',        trust: 'Independent',         country: 'Wales',   product: 'Lumio Core',        plan: 'Growth',     status: 'Active'   },
  { school: 'Elmfield Institute',      contact: 'Paul Norton',    email: 'p.norton@elmfield.org',           phone: '0131 552 3344', address: '5 Elm Street, Edinburgh',         district: 'Edinburgh',      trust: 'Elmfield Trust',      country: 'Scotland',product: 'Lumio Core',        plan: 'Starter',    status: 'Pending'  },
  { school: 'Whitestone College',      contact: 'Fiona Reed',     email: 'f.reed@whitestone.ac.uk',         phone: '01865 778800', address: '18 Whitestone Way, Oxford',        district: 'Oxfordshire',    trust: 'Whitestone MAT',      country: 'England', product: 'Lumio Pro',         plan: 'Enterprise', status: 'Active'   },
  { school: 'Sunfield Trust',          contact: 'Gary Stone',     email: 'g.stone@sunfield.org.uk',         phone: '01473 991122', address: '3 Sunny Vale, Ipswich',           district: 'Suffolk',        trust: 'Sunfield Partnership',country: 'England', product: 'Lumio Core',        plan: 'Starter',    status: 'Pending'  },
  { school: 'Pinebrook Primary',       contact: 'Sandra Bell',    email: 's.bell@pinebrook.sch.uk',         phone: '01603 667788', address: '11 Pine Avenue, Norwich',         district: 'Norfolk',        trust: 'Independent',         country: 'England', product: 'Lumio Lite',        plan: 'Starter',    status: 'Active'   },
  { school: 'Riverdale Education',     contact: 'James Hollis',   email: 'j.hollis@riverdale.co.uk',        phone: '0121 456 7890', address: '27 River Street, Birmingham',     district: 'West Midlands',  trust: 'Riverdale MAT',       country: 'England', product: 'Lumio Pro',         plan: 'Growth',     status: 'Active'   },
  { school: 'Starling Schools',        contact: 'Rachel Fox',     email: 'r.fox@starling.sch.uk',           phone: '01904 332211', address: '8 Starling Close, York',          district: 'North Yorkshire',trust: 'Starling Trust',      country: 'England', product: 'Lumio Core',        plan: 'Growth',     status: 'Active'   },
  { school: 'Helix Education',         contact: 'David Holt',     email: 'd.holt@helixedu.co.uk',           phone: '0117 929 4400', address: '15 Science Quarter, Bristol',     district: 'Bristol',        trust: 'Independent',         country: 'England', product: 'Lumio Pro',         plan: 'Enterprise', status: 'Active'   },
  { school: 'Torchbearer Trust',       contact: 'Priya Sharma',   email: 'p.sharma@torchbearer.org.uk',     phone: '01512 334455', address: '4 Beacon Hill, Liverpool',        district: 'Merseyside',     trust: 'Torchbearer MAT',     country: 'England', product: 'Lumio Core',        plan: 'Growth',     status: 'Active'   },
  { school: 'Lakewood Academy',        contact: 'Michael Grant',  email: 'm.grant@lakewood.sch.uk',         phone: '01604 551122', address: '2 Lakewood Drive, Northampton',   district: 'Northamptonshire',trust: 'Lakewood MAT',       country: 'England', product: 'Lumio Lite',        plan: 'Starter',    status: 'Pending'  },
  { school: 'Fernview College',        contact: 'Yasmin Patel',   email: 'y.patel@fernview.ac.uk',          phone: '02890 667700', address: '19 Fern Road, Belfast',           district: 'Belfast',        trust: 'Independent',         country: 'N. Ireland', product: 'Lumio Core',     plan: 'Growth',     status: 'Active'   },
]

const COUNTRIES  = ['All Countries',  'England', 'Wales', 'Scotland', 'N. Ireland']
const PRODUCTS   = ['All Products',   'Lumio Core', 'Lumio Pro', 'Lumio Lite']
const DISTRICTS  = ['All Districts',  'Oxfordshire', 'Manchester', 'West Yorkshire', 'Cardiff', 'Edinburgh', 'Suffolk', 'Norfolk', 'West Midlands', 'North Yorkshire', 'Bristol', 'Merseyside', 'Northamptonshire', 'Belfast', 'Herefordshire']
const TRUSTS     = ['All Trusts',     'Greenfield MAT', 'Bramble Hill Trust', 'Independent', 'Oakridge MAT', 'Whitestone MAT', 'Sunfield Partnership', 'Riverdale MAT', 'Starling Trust', 'Torchbearer MAT', 'Lakewood MAT', 'Elmfield Trust']

function FilterSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
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

export default function SalesPage() {
  const [country,  setCountry]  = useState('All Countries')
  const [product,  setProduct]  = useState('All Products')
  const [district, setDistrict] = useState('All Districts')
  const [trust,    setTrust]    = useState('All Trusts')
  const [search,   setSearch]   = useState('')

  const filtered = customers.filter((c) => {
    if (country  !== 'All Countries'  && c.country  !== country)  return false
    if (product  !== 'All Products'   && c.product  !== product)  return false
    if (district !== 'All Districts'  && c.district !== district) return false
    if (trust    !== 'All Trusts'     && c.trust    !== trust)    return false
    if (search && !c.school.toLowerCase().includes(search.toLowerCase()) &&
                  !c.contact.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

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
            <SectionCard title="Renewals Due in 90 Days">
              {renewals.map((r) => (
                <PanelItem key={r.company} title={r.company} sub={`Due: ${r.due}`} extra={`ARR: ${r.arr}`} badge="Pending" />
              ))}
            </SectionCard>
          </>
        }
      />

      {/* Customer List */}
      <SectionCard title="Customer List">
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
              style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB', width: 220 }}
            />
          </div>
          <FilterSelect label="Country"  options={COUNTRIES}  value={country}  onChange={setCountry}  />
          <FilterSelect label="Product"  options={PRODUCTS}   value={product}  onChange={setProduct}  />
          <FilterSelect label="District" options={DISTRICTS}  value={district} onChange={setDistrict} />
          <FilterSelect label="Trust"    options={TRUSTS}     value={trust}    onChange={setTrust}    />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{filtered.length} records</span>
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        <Table
          cols={['School Name', 'Lead Contact', 'Email', 'Phone', 'District', 'Trust', 'Country', 'Product', 'Plan', 'Status']}
          rows={filtered.map((c) => [
            c.school, c.contact,
            <span key={c.email} className="text-xs" style={{ color: '#9CA3AF' }}>{c.email}</span>,
            <span key={c.phone} className="text-xs font-mono" style={{ color: '#9CA3AF' }}>{c.phone}</span>,
            c.district, c.trust, c.country,
            <span key={c.product} className="text-xs font-semibold" style={{ color: '#0D9488' }}>{c.product}</span>,
            c.plan,
            <Badge key={c.school + 's'} status={c.status} />,
          ])}
        />
      </SectionCard>
    </PageShell>
  )
}
