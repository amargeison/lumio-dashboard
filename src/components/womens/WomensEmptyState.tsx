'use client'

// Empty-portal placeholders for a brand-new Women's club (no data yet).
// Every box becomes a "connect your data" prompt that points the user to the
// relevant data source. The onboarding wizard plugs in on top of this later.

import { Database, Plus, ArrowRight } from 'lucide-react'

const C = {
  card: '#0D1017', cardAlt: '#111318', panel2: '#0B0D12',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', muted: '#6B7280',
  pink: '#EC4899', accent: '#BE185D',
} as const

// Per-section data-source hint shown on the empty placeholder.
const SOURCE_HINT: Record<string, string> = {
  squad: 'Import your squad from a CSV or the FA Whole Game System, or add players manually.',
  tactics: 'Your formations and XI appear here once your squad is added.',
  training: 'Build sessions here, or sync your training calendar.',
  fixtures: 'Pull fixtures from your league feed or add them manually.',
  transfers: 'Add contracts and targets to populate the tracker.',
  welfare: 'Connect Lumio Health / your medical records to populate welfare.',
  acl: 'Connect screening + GPS data to populate ACL risk.',
  cycle: 'Players opt in via the Lumio Cycle app to populate this view.',
  'gps-load': 'Connect Lumio Health or a GPS provider (JOHAN, CSV) for load data.',
  'gps-heatmaps': 'Connect a GPS provider to generate heatmaps.',
  finance: 'Connect Xero / your accounts, or enter figures manually.',
  fsr: 'Enter revenue and wages to model your FSR position.',
  sponsorship: 'Add your commercial deals to build the pipeline.',
  team: 'Add staff to build your directory and org chart.',
  'club-operations': 'Add suppliers, rota and matchday tasks to populate ops.',
  'travel-logistics': 'Add your away fixtures and suppliers to plan travel.',
}

export function WomensEmptyModule({ title, sectionId, onConnect }: { title: string; sectionId: string; onConnect: () => void }) {
  const hint = SOURCE_HINT[sectionId] ?? 'Connect a data source or add data manually to populate this section.'
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="text-center max-w-md px-6">
        <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl" style={{ width: 64, height: 64, background: `${C.pink}14`, border: `1px solid ${C.pink}40` }}>
          <Database size={26} style={{ color: C.pink }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: C.text }}>{title}</h2>
        <p className="text-sm mt-2" style={{ color: C.text3 }}>No data yet — this is where your <span style={{ color: C.text2 }}>{title.toLowerCase()}</span> will appear once your data is connected.</p>
        <button onClick={onConnect} className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.pink }}>
          <Plus size={15} /> Connect a data source
        </button>
        <p className="text-xs mt-4 leading-relaxed" style={{ color: C.muted }}>{hint} Manage sources in <span style={{ color: C.text3 }}>Settings → Integrations</span>.</p>
      </div>
    </div>
  )
}

const SETUP_CARDS: { id: string; label: string; desc: string }[] = [
  { id: 'squad',   label: 'Squad',        desc: 'Import or add your players' },
  { id: 'team',    label: 'Staff',        desc: 'Build your staff directory' },
  { id: 'fixtures',label: 'Fixtures',     desc: 'Add your league fixtures' },
  { id: 'welfare', label: 'Player Welfare',desc: 'Connect medical & welfare data' },
  { id: 'gps-load',label: 'GPS & Performance', desc: 'Connect Lumio Health / GPS' },
  { id: 'finance', label: 'Club Finance', desc: 'Connect accounts or enter figures' },
  { id: 'sponsorship', label: 'Commercial', desc: 'Add your sponsorship deals' },
  { id: 'club-operations', label: 'Club Operations', desc: 'Suppliers, rota & matchday' },
]

export function WomensEmptyDashboard({ clubName, onNavigate }: { clubName: string; onNavigate: (id: string) => void }) {
  return (
    <div className="p-6 space-y-6" style={{ maxWidth: 1100 }}>
      <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg, ${C.pink}1a, ${C.card})`, border: `1px solid ${C.border}` }}>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.pink }}>Welcome to Lumio</div>
        <h1 className="text-2xl font-black mt-1" style={{ color: C.text }}>{clubName}</h1>
        <p className="text-sm mt-2" style={{ color: C.text3 }}>Your portal is ready and empty. Connect your data — or let our onboarding set it up for you — and every section below fills with your club&apos;s live information.</p>
        <button onClick={() => onNavigate('settings')} className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.pink }}>
          <Database size={15} /> Connect your data
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Set up your club</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SETUP_CARDS.map(c => (
            <button key={c.id} onClick={() => onNavigate(c.id)} className="text-left rounded-xl p-4 transition" style={{ background: C.cardAlt, border: `1px dashed ${C.borderHi}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: C.text }}>{c.label}</span>
                <span className="flex items-center justify-center rounded-lg" style={{ width: 24, height: 24, background: `${C.pink}18` }}><Plus size={13} style={{ color: C.pink }} /></span>
              </div>
              <p className="text-xs" style={{ color: C.muted }}>{c.desc}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-3" style={{ color: C.pink }}>Add data <ArrowRight size={11} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
