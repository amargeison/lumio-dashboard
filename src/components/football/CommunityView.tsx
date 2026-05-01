'use client'

import { useState } from 'react'
import { Heart, GraduationCap, Users, Calendar, MapPin, BarChart3 } from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#003DA5', amber: '#F1C40F',
}

type Tab = 'foundation' | 'schools' | 'fans' | 'events' | 'partnerships' | 'impact'

const FOUNDATION_PROGRAMMES = [
  { name: 'Kicks for Kids',          area: 'Free coaching',         participants: 487, weekly: 'Sat',     since: 2018, fund: 'Self-funded' },
  { name: 'Walking Football',        area: '60+ wellbeing',         participants: 142, weekly: 'Tue',     since: 2020, fund: 'Foundation grant' },
  { name: 'Reading Stars',           area: 'Literacy intervention', participants: 296, weekly: 'Schools', since: 2019, fund: 'Apex Performance' },
  { name: 'Premier League Inspires', area: 'Mental wellbeing',       participants: 168, weekly: 'Wed',     since: 2021, fund: 'PL Inspires fund' },
  { name: 'Disability Football',     area: 'Inclusive sport',        participants: 64,  weekly: 'Sun',     since: 2017, fund: 'Foundation grant' },
  { name: 'Match Day Mascots',       area: 'Community access',       participants: 22,  weekly: 'Match',  since: 2014, fund: 'Self-funded' },
]

const IMPACT_REPORT_HEADLINES = [
  { metric: 'Hours delivered',    value: '14,820', sub: 'this season to date' },
  { metric: 'Children reached',   value: '8,940',  sub: 'across 6 programmes' },
  { metric: 'Schools engaged',    value: '32',     sub: 'within 12 mile radius' },
  { metric: 'Volunteer hours',    value: '4,210',  sub: '180 active volunteers' },
]

const SCHOOL_PARTNERS = [
  { name: 'Riverside Primary',    pupils: 412, sessions: 'Mon + Fri', programmes: 'Kicks · Reading Stars',     since: 2019 },
  { name: 'Oakridge Park Academy',pupils: 1480, sessions: 'Tue + Wed',programmes: 'PL Inspires · After-school',since: 2018 },
  { name: 'Northshore Junior',    pupils: 298, sessions: 'Thu',       programmes: 'Reading Stars',              since: 2021 },
  { name: 'St Edmund\'s Primary', pupils: 364, sessions: 'Wed',       programmes: 'Kicks · Mental wellbeing',  since: 2020 },
  { name: 'Heritage Hill High',   pupils: 1140, sessions: 'Wed + Fri',programmes: 'Premier League Inspires',    since: 2022 },
]

const COACHING_CALENDAR = [
  { day: 'Mon', sessions: 4, programme: 'Kicks for Kids · Reading Stars', staff: 6 },
  { day: 'Tue', sessions: 3, programme: 'Walking Football · Schools',     staff: 4 },
  { day: 'Wed', sessions: 5, programme: 'PL Inspires · Schools',          staff: 7 },
  { day: 'Thu', sessions: 2, programme: 'Reading Stars',                  staff: 3 },
  { day: 'Fri', sessions: 4, programme: 'Schools · Foundation Hub',       staff: 6 },
  { day: 'Sat', sessions: 6, programme: 'Kicks for Kids',                 staff: 8 },
  { day: 'Sun', sessions: 2, programme: 'Disability Football',            staff: 4 },
]

const KIT_DONATIONS_YTD = { schools: 12, valueGBP: 8400, sets: 320, balls: 540 }

const GRASSROOTS_AFFILIATES = [
  { club: 'Oakridge Athletic FC',   tier: 'Step 5',   status: 'Affiliated', since: 2019 },
  { club: 'Riverside Rovers',       tier: 'Step 6',   status: 'Affiliated', since: 2020 },
  { club: 'Northshore Youth',       tier: 'Junior',   status: 'Pathway',    since: 2018 },
  { club: 'Heritage Sunday League', tier: 'Sunday',   status: 'Sponsored',  since: 2021 },
]

const FAN_FORUMS = [
  { date: '14 Apr 2026', attendance: 84,  themes: 'Stadium plans · ticket pricing · pre-season tour' },
  { date: '12 Feb 2026', attendance: 102, themes: 'Q1 financials · transfer window · supporters\' equity' },
  { date: '11 Dec 2025', attendance: 76,  themes: 'AGM follow-up · women\'s team · academy investment' },
  { date: '14 Oct 2025', attendance: 91,  themes: 'Season opener · standing rail · matchday food' },
]

const SUPPORTERS_TRUST = [
  { role: 'Trust Chair',     name: 'Diane Whitfield', contact: 'd.whitfield@oakridge-trust.uk' },
  { role: 'Trust Secretary', name: 'Mark Brennan',    contact: 'sec@oakridge-trust.uk' },
  { role: 'Liaison Officer', name: 'Aisha Rahman (Club)', contact: 'a.rahman@oakridgefc.uk' },
]

const COMMUNITY_EVENTS_UPCOMING = [
  { date: '04 May 2026', name: 'Open Training Session',       venue: 'Oakridge Park',     expected: 1200, type: 'Open day' },
  { date: '17 May 2026', name: 'Foundation Charity Match',    venue: 'Oakridge Park',     expected: 3500, type: 'Charity' },
  { date: '01 Jun 2026', name: 'Schools Cup Finals Day',      venue: 'Oakridge Park',     expected: 800,  type: 'Schools' },
  { date: '14 Jun 2026', name: 'Player Visit — Children\'s Hospital', venue: 'Riverside Hosp.', expected: 60, type: 'Visit' },
  { date: '28 Jun 2026', name: 'Fan Forum',                    venue: 'Heritage Lounge',   expected: 100,  type: 'Forum' },
]

const COMMUNITY_EVENTS_PAST = [
  { date: '12 Apr 2026', name: 'Foundation Quiz Night',         attendance: 142, raised: '£4,200' },
  { date: '22 Mar 2026', name: 'Open Training Session',          attendance: 980, raised: 'n/a' },
  { date: '08 Mar 2026', name: 'IWD Schools Visit (×3 schools)', attendance: 420, raised: 'n/a' },
  { date: '14 Feb 2026', name: 'Mascot Match Day',                attendance: 6800, raised: '£1,800' },
]

const LOCAL_PARTNERSHIPS = [
  { name: 'Oakridge Borough Council',   type: 'Civic',         status: 'Active', focus: 'Stadium licence · community use' },
  { name: 'Riverside Healthcare Trust', type: 'NHS',           status: 'Active', focus: 'Player welfare · Hospital visits' },
  { name: 'Meridian Watches',           type: 'Commercial',    status: 'Active', focus: 'Foundation funding' },
  { name: 'Apex Performance',           type: 'Commercial',    status: 'Active', focus: 'Schools programme funding' },
  { name: 'Heritage Heritage Lottery',  type: 'Public funding',status: 'Active', focus: 'Stadium heritage tours' },
  { name: 'Stowe & Hart LLP',           type: 'Pro bono legal',status: 'Active', focus: 'Foundation governance' },
  { name: 'Northshore Brewing',         type: 'Commercial',    status: 'Active', focus: 'Matchday hospitality' },
  { name: 'Local Energy Co',            type: 'Commercial',    status: 'Lapsed', focus: 'Stadium energy supply' },
  { name: 'Kingsmere Toyota',           type: 'Commercial',    status: 'Lead',   focus: 'Player vehicles + visits' },
  { name: 'Oakridge Bookshop',          type: 'Independent',   status: 'Active', focus: 'Reading Stars books' },
]

const LOCAL_AMBASSADORS = [
  { name: 'Rachel Holt',          role: 'Former Captain (2010-2017)', area: 'Schools + matchday' },
  { name: 'Tony Wilks',           role: 'Club legend (1989-1998)',     area: 'Heritage events' },
  { name: 'Emma Stowe',           role: 'Local Olympic medallist',     area: 'Community days' },
  { name: 'Cllr Diane Whitfield', role: 'Trust Chair',                  area: 'Civic engagement' },
]

const REACH_METRICS = [
  { label: 'Social media followers', value: '184,200', growth: '+8.2% YoY', tone: 'good' as const },
  { label: 'Avg match attendance',   value: '7,940',   growth: '+4.1% YoY', tone: 'good' as const },
  { label: 'Foundation programme participants', value: '8,940', growth: '+12.4% YoY', tone: 'good' as const },
  { label: 'Volunteer headcount',    value: '180',     growth: '+22 this season', tone: 'good' as const },
]

const NPS_SUMMARY = { score: 56, trend: '+4 vs last season', responses: 1840 }

export default function CommunityView({ club }: { club?: { name?: string } | null }) {
  void club
  const [tab, setTab] = useState<Tab>('foundation')
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'foundation',   label: 'Foundation',         icon: Heart },
    { id: 'schools',      label: 'Schools & Grassroots', icon: GraduationCap },
    { id: 'fans',         label: 'Fan Engagement',     icon: Users },
    { id: 'events',       label: 'Community Events',   icon: Calendar },
    { id: 'partnerships', label: 'Local Partnerships', icon: MapPin },
    { id: 'impact',       label: 'Impact Dashboard',   icon: BarChart3 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Heart size={20} style={{ color: C.accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Community</h1>
          <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Foundation · schools · fan engagement · events · partnerships · impact</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const TabIcon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : C.text3,
                borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'color .12s, border-color .12s',
              }}>
              <TabIcon size={13} strokeWidth={1.75} />{t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {tab === 'foundation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {IMPACT_REPORT_HEADLINES.map(h => <KpiCard key={h.metric} label={h.metric} value={h.value} sub={h.sub} />)}
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Foundation Programmes</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Programme','Focus area','Participants','Weekly','Funded by','Since'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {FOUNDATION_PROGRAMMES.map(p => (
                      <tr key={p.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.area}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.participants}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.weekly}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.fund}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{p.since}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'schools' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="School partners" value="5 active" sub="3,694 pupils reached" />
              <KpiCard label="Coaching sessions / wk" value="26" sub="staffed by 38 coaches" accent={C.good} />
              <KpiCard label="Kit donations YTD" value={`£${KIT_DONATIONS_YTD.valueGBP.toLocaleString()}`} sub={`${KIT_DONATIONS_YTD.sets} kits · ${KIT_DONATIONS_YTD.balls} balls`} accent={C.warn} />
              <KpiCard label="Grassroots affiliates" value="4 clubs" sub="step 5 + youth + Sunday" />
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>School Partnerships</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['School','Pupils','Schedule','Programmes','Since'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {SCHOOL_PARTNERS.map(s => (
                      <tr key={s.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{s.name}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{s.pupils}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{s.sessions}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text2 }}>{s.programmes}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{s.since}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Coaching session calendar</h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                  {COACHING_CALENDAR.map(d => (
                    <div key={d.day} className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div className="w-8 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.text4 }}>{d.day}</div>
                      <div className="flex-1 text-xs" style={{ color: C.text2 }}>{d.programme}</div>
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{d.sessions} sess</div>
                      <div className="text-[10px]" style={{ color: C.text4 }}>{d.staff} coaches</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Grassroots affiliations</h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                  {GRASSROOTS_AFFILIATES.map(a => (
                    <div key={a.club} className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div className="flex-1 text-xs font-semibold" style={{ color: C.text }}>{a.club}</div>
                      <div className="text-[10px]" style={{ color: C.text3 }}>{a.tier}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.good}26`, color: C.good }}>{a.status.toUpperCase()}</span>
                      <div className="text-[10px] font-mono" style={{ color: C.text4 }}>{a.since}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'fans' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Season-ticket retention" value="87%" sub="up 3pt YoY" accent={C.good} />
              <KpiCard label="Fan forum attendance" value="84 avg" sub="last 4 forums" />
              <KpiCard label="Supporters' Trust members" value="2,140" sub="7.5% equity" accent={C.good} />
              <KpiCard label="Survey NPS" value={String(NPS_SUMMARY.score)} sub={NPS_SUMMARY.trend} accent={C.good} />
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Recent Fan Forums</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Date','Attendance','Themes discussed'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {FAN_FORUMS.map(f => (
                      <tr key={f.date} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{f.date}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{f.attendance}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text2 }}>{f.themes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Supporters' Trust Liaison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SUPPORTERS_TRUST.map(p => (
                  <div key={p.role} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{p.role}</div>
                    <div className="text-sm font-bold" style={{ color: C.text }}>{p.name}</div>
                    <div className="text-[11px] mt-1 font-mono" style={{ color: C.text3 }}>{p.contact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Upcoming Events</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Date','Event','Type','Venue','Expected'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {COMMUNITY_EVENTS_UPCOMING.map(e => (
                      <tr key={e.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{e.date}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{e.name}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{e.type}</span></td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{e.venue}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{e.expected.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Past Events</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Date','Event','Attendance','Funds raised'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {COMMUNITY_EVENTS_PAST.map(e => (
                      <tr key={e.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{e.date}</td>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{e.name}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{e.attendance.toLocaleString()}</td>
                        <td className="px-3 py-2.5 font-mono font-bold" style={{ color: C.amber }}>{e.raised}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'partnerships' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Local Partnerships</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Partner','Type','Status','Focus area'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {LOCAL_PARTNERSHIPS.map(p => {
                      const sc = p.status === 'Active' ? C.good : p.status === 'Lapsed' ? C.bad : p.status === 'Lead' ? C.warn : C.text3
                      return (
                        <tr key={p.name} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td>
                          <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.type}</td>
                          <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${sc}26`, color: sc }}>{p.status.toUpperCase()}</span></td>
                          <td className="px-3 py-2.5" style={{ color: C.text2 }}>{p.focus}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Local Ambassadors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LOCAL_AMBASSADORS.map(a => (
                  <div key={a.name} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="text-sm font-bold" style={{ color: C.text }}>{a.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{a.role}</div>
                    <div className="text-[11px] mt-2" style={{ color: C.text3 }}>↳ {a.area}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'impact' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {IMPACT_REPORT_HEADLINES.map(h => <KpiCard key={h.metric} label={h.metric} value={h.value} sub={h.sub} accent={C.good} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Reach Metrics</h3>
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                  {REACH_METRICS.map(r => (
                    <div key={r.label} className="flex items-center justify-between px-3 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: C.text }}>{r.label}</div>
                        <div className="text-[10px]" style={{ color: C.text4 }}>{r.growth}</div>
                      </div>
                      <div className="text-lg font-black font-mono" style={{ color: C.text }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Board-reportable summary</h3>
                <div className="rounded-xl p-4 space-y-3 text-xs" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text2 }}>
                  <p>Foundation activity is up <span style={{ color: C.good }} className="font-bold">12.4% YoY</span> on participants reached, with all 6 programmes at or above target. Schools partnerships expanded to <span style={{ color: C.text }} className="font-bold">5 active partners</span> covering 3,694 pupils.</p>
                  <p>Fan engagement: NPS <span style={{ color: C.good }} className="font-bold">+4 vs last season</span>, season-ticket retention <span style={{ color: C.good }} className="font-bold">87%</span> (industry avg 81%). Supporters' Trust holding stable at 7.5% equity with growing membership (2,140).</p>
                  <p>Risk: <span style={{ color: C.bad }} className="font-bold">Local Energy lapsed</span> — £35k revenue gap; Kingsmere Toyota lead in flight to backfill at +£70k. Action owner: A. Patel (CCO). Board update due 16 May.</p>
                  <p style={{ color: C.text4, fontSize: 10, fontStyle: 'italic', borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>Generated for board pack · Q2 2026 · Compiled by Aisha Rahman, Head of Community.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: C.text }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: accent ?? C.accent }}>{sub}</div>
    </div>
  )
}
