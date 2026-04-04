'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Building2, GraduationCap, FlaskConical, BarChart3,
  Activity, Settings, Search, X, ChevronRight, ToggleLeft, ToggleRight,
  Trash2, UserCheck, CalendarPlus, Eye
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

type Section = 'dashboard' | 'businesses' | 'schools' | 'trials' | 'insights' | 'activity' | 'settings'
type TrialTab = 'business' | 'school'

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'schools', label: 'Schools', icon: GraduationCap },
  { id: 'trials', label: 'Trials', icon: FlaskConical },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const STATS = [
  { label: 'Total Businesses', value: '47', color: '#3B82F6' },
  { label: 'Total Schools', value: '23', color: '#8B5CF6' },
  { label: 'Active Trials', value: '31', color: '#F59E0B' },
  { label: 'MRR', value: '\u00a328,450', color: '#22C55E' },
  { label: 'Conversion Rate', value: '34%', color: '#14B8A6' },
  { label: 'Churn Rate', value: '2.1%', color: '#EF4444' },
]

const BUSINESSES = [
  { name: 'Greenfield Academy', slug: 'greenfield-academy', plan: 'Growth', status: 'Active', mrr: '\u00a3840', created: '15 Jan 2026' },
  { name: 'Hopscotch Learning', slug: 'hopscotch', plan: 'Starter', status: 'Active', mrr: '\u00a349', created: '22 Jan 2026' },
  { name: 'Bramble Hill Trust', slug: 'bramble-hill', plan: 'Enterprise', status: 'Active', mrr: '\u00a32,400', created: '3 Feb 2026' },
  { name: 'Whitestone College', slug: 'whitestone', plan: 'Growth', status: 'Active', mrr: '\u00a3840', created: '10 Feb 2026' },
  { name: 'Oakridge Schools', slug: 'oakridge', plan: 'Enterprise', status: 'Active', mrr: '\u00a32,400', created: '18 Feb 2026' },
  { name: 'Crestview Academy', slug: 'crestview', plan: 'Starter', status: 'Active', mrr: '\u00a349', created: '25 Feb 2026' },
  { name: 'Sunfield Trust', slug: 'sunfield', plan: 'Growth', status: 'Active', mrr: '\u00a3840', created: '1 Mar 2026' },
  { name: 'Riverdale Education', slug: 'riverdale', plan: 'Starter', status: 'Active', mrr: '\u00a349', created: '8 Mar 2026' },
  { name: 'Apex Tutors', slug: 'apex-tutors', plan: 'Growth', status: 'Active', mrr: '\u00a3840', created: '12 Mar 2026' },
  { name: 'Pinebrook Primary', slug: 'pinebrook', plan: 'Starter', status: 'Active', mrr: '\u00a349', created: '20 Mar 2026' },
]

const SCHOOLS = [
  { name: 'Oakridge Primary', slug: 'oakridge-primary', plan: 'School', type: 'Primary', status: 'Active', created: '10 Jan 2026' },
  { name: "St Mary's CE", slug: 'st-marys-ce', plan: 'Starter', type: 'Primary', status: 'Trial', created: '15 Feb 2026' },
  { name: 'Riverside Academy', slug: 'riverside', plan: 'School', type: 'Secondary', status: 'Active', created: '20 Feb 2026' },
  { name: 'The Pines School', slug: 'the-pines', plan: 'Trust', type: 'Primary', status: 'Active', created: '1 Mar 2026' },
  { name: 'Elmfield School', slug: 'elmfield', plan: 'Starter', type: 'Secondary', status: 'Trial', created: '5 Mar 2026' },
  { name: 'Bramblewood Primary', slug: 'bramblewood', plan: 'School', type: 'Primary', status: 'Active', created: '10 Mar 2026' },
  { name: 'Crestview Secondary', slug: 'crestview-sec', plan: 'Trust', type: 'Secondary', status: 'Active', created: '15 Mar 2026' },
  { name: 'Sunfield Special', slug: 'sunfield-special', plan: 'Enterprise', type: 'Special', status: 'Active', created: '20 Mar 2026' },
]

const BIZ_TRIALS = [
  { company: 'Maple Grove Ltd', email: 'info@maplegrove.co.uk', plan: 'Growth', status: 'Active', created: '18 Mar 2026', expires: '1 Apr 2026', lastActive: '27 Mar 2026' },
  { company: 'Horizon Education', email: 'admin@horizonedu.com', plan: 'Enterprise', status: 'Active', created: '20 Mar 2026', expires: '3 Apr 2026', lastActive: '28 Mar 2026' },
  { company: 'BrightPath Schools', email: 'hello@brightpath.io', plan: 'Starter', status: 'Expired', created: '1 Mar 2026', expires: '15 Mar 2026', lastActive: '12 Mar 2026' },
  { company: 'Summit Academy Group', email: 'ops@summitacademy.org', plan: 'Growth', status: 'Converted', created: '10 Feb 2026', expires: '24 Feb 2026', lastActive: '22 Feb 2026' },
  { company: 'Nova Learning', email: 'team@novalearning.co.uk', plan: 'Starter', status: 'Active', created: '22 Mar 2026', expires: '5 Apr 2026', lastActive: '27 Mar 2026' },
  { company: 'Compass Ed Tech', email: 'support@compassedtech.com', plan: 'Growth', status: 'Expired', created: '5 Mar 2026', expires: '19 Mar 2026', lastActive: '16 Mar 2026' },
  { company: 'Pinnacle Trust', email: 'admin@pinnacletrust.org.uk', plan: 'Enterprise', status: 'Converted', created: '15 Feb 2026', expires: '1 Mar 2026', lastActive: '28 Feb 2026' },
  { company: 'Cedar Education', email: 'info@cedareducation.co.uk', plan: 'Growth', status: 'Active', created: '25 Mar 2026', expires: '8 Apr 2026', lastActive: '28 Mar 2026' },
]

const SCHOOL_TRIALS = [
  { company: 'Willowbrook Primary', email: 'head@willowbrook.sch.uk', plan: 'School', status: 'Active', created: '20 Mar 2026', expires: '3 Apr 2026', lastActive: '27 Mar 2026' },
  { company: 'Ashfield Secondary', email: 'admin@ashfield.sch.uk', plan: 'Starter', status: 'Active', created: '22 Mar 2026', expires: '5 Apr 2026', lastActive: '28 Mar 2026' },
  { company: 'Meadow Lane Primary', email: 'office@meadowlane.sch.uk', plan: 'School', status: 'Expired', created: '1 Mar 2026', expires: '15 Mar 2026', lastActive: '14 Mar 2026' },
  { company: 'Thornfield Academy', email: 'info@thornfield.sch.uk', plan: 'Trust', status: 'Converted', created: '10 Feb 2026', expires: '24 Feb 2026', lastActive: '23 Feb 2026' },
  { company: 'Birchwood Special', email: 'head@birchwood.sch.uk', plan: 'Enterprise', status: 'Active', created: '25 Mar 2026', expires: '8 Apr 2026', lastActive: '28 Mar 2026' },
]

const ACTIVITY_LOG = [
  { time: '28 Mar 2026 14:32', action: 'New signup', email: 'info@cedareducation.co.uk' },
  { time: '28 Mar 2026 14:10', action: 'Login', email: 'admin@horizonedu.com' },
  { time: '28 Mar 2026 13:45', action: 'Demo data loaded', email: 'head@birchwood.sch.uk' },
  { time: '28 Mar 2026 12:58', action: 'Trial started', email: 'team@novalearning.co.uk' },
  { time: '28 Mar 2026 12:30', action: 'Upgraded to Growth', email: 'ops@summitacademy.org' },
  { time: '28 Mar 2026 11:15', action: 'Login', email: 'info@maplegrove.co.uk' },
  { time: '28 Mar 2026 10:42', action: 'New signup', email: 'office@meadowlane.sch.uk' },
  { time: '28 Mar 2026 09:30', action: 'Demo data loaded', email: 'admin@ashfield.sch.uk' },
  { time: '28 Mar 2026 08:55', action: 'Login', email: 'hello@brightpath.io' },
  { time: '28 Mar 2026 08:20', action: 'Cancelled', email: 'support@compassedtech.com' },
  { time: '27 Mar 2026 22:15', action: 'Login', email: 'admin@pinnacletrust.org.uk' },
  { time: '27 Mar 2026 20:40', action: 'Trial started', email: 'head@willowbrook.sch.uk' },
  { time: '27 Mar 2026 19:10', action: 'Upgraded to Growth', email: 'info@cedareducation.co.uk' },
  { time: '27 Mar 2026 17:45', action: 'New signup', email: 'admin@horizonedu.com' },
  { time: '27 Mar 2026 16:30', action: 'Login', email: 'team@novalearning.co.uk' },
  { time: '27 Mar 2026 15:05', action: 'Demo data loaded', email: 'info@maplegrove.co.uk' },
  { time: '27 Mar 2026 14:20', action: 'New signup', email: 'head@birchwood.sch.uk' },
  { time: '27 Mar 2026 12:50', action: 'Trial started', email: 'admin@ashfield.sch.uk' },
  { time: '27 Mar 2026 11:30', action: 'Login', email: 'ops@summitacademy.org' },
  { time: '27 Mar 2026 10:00', action: 'Cancelled', email: 'hello@brightpath.io' },
]

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    Trial: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
    Expired: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
    Converted: { bg: 'rgba(20,184,166,0.1)', color: '#14B8A6' },
  }
  const s = map[status] || map.Active
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
      {plan}
    </span>
  )
}

function ActionButton({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-1.5 rounded-md transition-colors"
      style={{ color: '#6B7280' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280' }}
    >
      <Icon size={14} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DemoAdminPortal() {
  const [section, setSection] = useState<Section>('dashboard')
  const [trialTab, setTrialTab] = useState<TrialTab>('business')
  const [toast, setToast] = useState<string | null>(null)
  const [bizSearch, setBizSearch] = useState('')
  const [schoolSearch, setSchoolSearch] = useState('')
  const [toggles, setToggles] = useState({ trialEmails: true, day3: true, day7: false })

  function showToast(msg = 'Demo mode \u2014 actions disabled') {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filteredBiz = BUSINESSES.filter(b =>
    b.name.toLowerCase().includes(bizSearch.toLowerCase()) ||
    b.slug.toLowerCase().includes(bizSearch.toLowerCase())
  )

  const filteredSchools = SCHOOLS.filter(s =>
    s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
    s.slug.toLowerCase().includes(schoolSearch.toLowerCase())
  )

  /* ---- Render sections ---- */

  function renderDashboard() {
    return (
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{s.value}</p>
            <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: '#1F2937' }}>
              <div className="h-1 rounded-full" style={{ backgroundColor: s.color, width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderSearchBar(value: string, onChange: (v: string) => void, placeholder: string) {
    return (
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }}>
            <X size={14} />
          </button>
        )}
      </div>
    )
  }

  function renderBusinesses() {
    return (
      <>
        {renderSearchBar(bizSearch, setBizSearch, 'Search businesses...')}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <table className="w-full text-sm" style={{ color: '#D1D5DB' }}>
            <thead>
              <tr style={{ backgroundColor: '#111318' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Company Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>MRR</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBiz.map(b => (
                <tr
                  key={b.slug}
                  className="transition-colors cursor-default"
                  style={{ borderTop: '1px solid #1F2937' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{b.name}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{b.slug}</td>
                  <td className="px-4 py-3"><PlanBadge plan={b.plan} /></td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">{b.mrr}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{b.created}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <ActionButton label="Impersonate" icon={Eye} onClick={() => showToast()} />
                      <ActionButton label="Delete" icon={Trash2} onClick={() => showToast()} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  function renderSchools() {
    return (
      <>
        {renderSearchBar(schoolSearch, setSchoolSearch, 'Search schools...')}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <table className="w-full text-sm" style={{ color: '#D1D5DB' }}>
            <thead>
              <tr style={{ backgroundColor: '#111318' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>School Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map(s => (
                <tr
                  key={s.slug}
                  className="transition-colors cursor-default"
                  style={{ borderTop: '1px solid #1F2937' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{s.name}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.slug}</td>
                  <td className="px-4 py-3"><PlanBadge plan={s.plan} /></td>
                  <td className="px-4 py-3">{s.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.created}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <ActionButton label="Impersonate" icon={Eye} onClick={() => showToast()} />
                      <ActionButton label="Delete" icon={Trash2} onClick={() => showToast()} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  function renderTrialsTable(data: typeof BIZ_TRIALS) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-sm" style={{ color: '#D1D5DB' }}>
          <thead>
            <tr style={{ backgroundColor: '#111318' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Created</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Expires</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Last Active</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(t => (
              <tr
                key={t.email}
                className="transition-colors cursor-default"
                style={{ borderTop: '1px solid #1F2937' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{t.company}</td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.email}</td>
                <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.created}</td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.expires}</td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.lastActive}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <ActionButton label="Extend Trial" icon={CalendarPlus} onClick={() => showToast()} />
                    <ActionButton label="Impersonate" icon={Eye} onClick={() => showToast()} />
                    <ActionButton label="Delete" icon={Trash2} onClick={() => showToast()} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderTrials() {
    return (
      <>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTrialTab('business')}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              backgroundColor: trialTab === 'business' ? '#14B8A6' : '#111318',
              color: trialTab === 'business' ? '#07080F' : '#6B7280',
              border: '1px solid #1F2937',
            }}
          >
            Business Trials
          </button>
          <button
            onClick={() => setTrialTab('school')}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              backgroundColor: trialTab === 'school' ? '#14B8A6' : '#111318',
              color: trialTab === 'school' ? '#07080F' : '#6B7280',
              border: '1px solid #1F2937',
            }}
          >
            School Trials
          </button>
        </div>
        {trialTab === 'business' ? renderTrialsTable(BIZ_TRIALS) : renderTrialsTable(SCHOOL_TRIALS)}
      </>
    )
  }

  function renderInsights() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'MRR', value: '\u00a328,450', color: '#22C55E' },
            { label: 'Growth', value: '+12%', color: '#3B82F6' },
            { label: 'Signups this week', value: '7', color: '#8B5CF6' },
            { label: 'Avg trial length', value: '9.2 days', color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Top referral sources</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Direct (42%), Google (28%), Word of Mouth (18%), LinkedIn (12%)</p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Geographic breakdown</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>London 34%, Manchester 18%, Birmingham 12%, Other 36%</p>
        </div>
      </div>
    )
  }

  function renderActivity() {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        {ACTIVITY_LOG.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 transition-colors"
            style={{ borderTop: i > 0 ? '1px solid #1F2937' : undefined, backgroundColor: '#111318' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#111318' }}
          >
            <span className="text-xs shrink-0" style={{ color: '#6B7280', width: 160 }}>{a.time}</span>
            <span className="text-sm font-medium shrink-0" style={{ color: '#F9FAFB', width: 180 }}>{a.action}</span>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>{a.email}</span>
          </div>
        ))}
      </div>
    )
  }

  function renderSettings() {
    const toggleRows: { key: keyof typeof toggles; label: string }[] = [
      { key: 'trialEmails', label: 'Enable trial emails' },
      { key: 'day3', label: 'Auto-send day 3 follow-up' },
      { key: 'day7', label: 'Auto-send day 7 follow-up' },
    ]
    return (
      <div className="space-y-4">
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          {toggleRows.map(t => (
            <div key={t.key} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#F9FAFB' }}>{t.label}</span>
              <button
                onClick={() => { setToggles(prev => ({ ...prev, [t.key]: !prev[t.key] })); showToast() }}
                style={{ color: toggles[t.key] ? '#14B8A6' : '#6B7280' }}
              >
                {toggles[t.key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm" style={{ color: '#F9FAFB' }}>
            <span style={{ color: '#6B7280' }}>Billing:</span> Stripe connected
          </p>
          <p className="text-sm" style={{ color: '#F9FAFB' }}>
            <span style={{ color: '#6B7280' }}>Domain:</span> lumiocms.com
          </p>
        </div>
      </div>
    )
  }

  const sectionRenderers: Record<Section, () => React.ReactNode> = {
    dashboard: renderDashboard,
    businesses: renderBusinesses,
    schools: renderSchools,
    trials: renderTrials,
    insights: renderInsights,
    activity: renderActivity,
    settings: renderSettings,
  }

  const sectionTitles: Record<Section, string> = {
    dashboard: 'Dashboard',
    businesses: 'Businesses',
    schools: 'Schools',
    trials: 'Trials',
    insights: 'Insights',
    activity: 'Activity Log',
    settings: 'Settings',
  }

  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh', color: '#F9FAFB' }}>
      {/* Demo banner */}
      <div className="w-full py-2 px-4 text-center text-sm font-medium" style={{ backgroundColor: '#14B8A6', color: '#07080F' }}>
        Demo Admin Portal &mdash; data shown is for demonstration purposes only
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 36px)' }}>
        {/* Sidebar */}
        <aside className="shrink-0 flex flex-col py-6 px-3" style={{ width: 200, borderRight: '1px solid #1F2937' }}>
          <div className="mb-6 px-3">
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Admin</span>
            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,166,0.15)', color: '#14B8A6' }}>
              Demo
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map(n => {
              const active = section === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left"
                  style={{
                    backgroundColor: active ? '#1F2937' : 'transparent',
                    color: active ? '#F9FAFB' : '#6B7280',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(31,41,55,0.5)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <n.icon size={16} />
                  {n.label}
                  {active && <ChevronRight size={12} className="ml-auto" style={{ color: '#14B8A6' }} />}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>{sectionTitles[section]}</h1>
          </div>
          {sectionRenderers[section]()}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm font-medium shadow-lg"
          style={{ backgroundColor: '#1F2937', color: '#F59E0B', border: '1px solid #374151' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
