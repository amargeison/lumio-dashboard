'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Warm & clear — your daily motivator', sample: 'Good morning. Let\'s make today count.' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Calm & deep — reassuring and steady', sample: 'Good morning. Everything is under control.' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Bright & energetic — upbeat and clear', sample: 'Good morning. Your enemies won\'t know what\'s coming.' },
]

const ALL_TIMEZONES = [
  { label: 'London', tz: 'Europe/London' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Chicago', tz: 'America/Chicago' },
  { label: 'Toronto', tz: 'America/Toronto' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
  { label: 'Amsterdam', tz: 'Europe/Amsterdam' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Hong Kong', tz: 'Asia/Hong_Kong' },
  { label: 'Mumbai', tz: 'Asia/Kolkata' },
  { label: 'Auckland', tz: 'Pacific/Auckland' },
  { label: 'Riyadh', tz: 'Asia/Riyadh' },
  { label: 'Johannesburg', tz: 'Africa/Johannesburg' },
  { label: 'Cairo', tz: 'Africa/Cairo' },
  { label: 'Mexico City', tz: 'America/Mexico_City' },
  { label: 'S\u00e3o Paulo', tz: 'America/Sao_Paulo' },
]

const S = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' } as const

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, isStatus }: { label: string; value: string; isStatus?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: isStatus ? '#22C55E' : value === 'Not connected' ? '#6B7280' : '#F9FAFB' }}>{value}</span>
    </div>
  )
}

function ConnectRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
      {connected ? (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>Connected</span>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#6B7280' }}>Not connected</span>
          <button onClick={() => alert('Connect in production — demo mode')} className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            Connect <ExternalLink size={10} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function SchoolSettingsPage() {
  const pathname = usePathname()
  const slugMatch = pathname.match(/\/schools\/([^/]+)/)
  const schoolSlug = slugMatch?.[1] ?? 'school'

  const [schoolName, setSchoolName] = useState('')
  const [plan, setPlan] = useState('Trial')
  const [demoDataActive, setDemoDataActive] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  // AI Briefing
  const [briefingEnabled, setBriefingEnabled] = useState(true)
  const [includeAttendance, setIncludeAttendance] = useState(true)
  const [includeSafeguarding, setIncludeSafeguarding] = useState(true)
  const [includeStaffAbsences, setIncludeStaffAbsences] = useState(true)
  const [includeSchedule, setIncludeSchedule] = useState(true)
  const [briefingTime, setBriefingTime] = useState('8:00am')

  // Voice
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [activeVoice, setActiveVoice] = useState(VOICES[0].id)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Timezones
  const [zones, setZones] = useState<{ label: string; tz: string }[]>([])
  const [tzSearch, setTzSearch] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('lumio_school_name') || ''
    setSchoolName(name)
    setPlan(localStorage.getItem('lumio_school_plan') || 'Trial')
    // Check demo data status
    setDemoDataActive(localStorage.getItem('lumio_schools_demo_loaded') === 'true')
    fetch(`/api/schools/${schoolSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.demo_data_active) setDemoDataActive(true) })
      .catch(() => {})
    if (localStorage.getItem('lumio_tts_enabled') === 'false') setTtsEnabled(false)
    if (localStorage.getItem('lumio_voice_commands_enabled') === 'true') setVoiceEnabled(true)
    const v = localStorage.getItem('lumio_tts_voice')
    if (v) setActiveVoice(v)
    try {
      const z = localStorage.getItem('lumio_world_zones')
      if (z) setZones(JSON.parse(z))
      else setZones([{ label: 'London', tz: 'Europe/London' }, { label: 'New York', tz: 'America/New_York' }, { label: 'Dubai', tz: 'Asia/Dubai' }, { label: 'Tokyo', tz: 'Asia/Tokyo' }])
    } catch { setZones([{ label: 'London', tz: 'Europe/London' }, { label: 'New York', tz: 'America/New_York' }, { label: 'Dubai', tz: 'Asia/Dubai' }, { label: 'Tokyo', tz: 'Asia/Tokyo' }]) }
  }, [])

  function selectVoice(id: string) { setActiveVoice(id); localStorage.setItem('lumio_tts_voice', id) }
  function toggleZone(zone: { label: string; tz: string }) {
    const exists = zones.some(z => z.tz === zone.tz)
    let next: typeof zones
    if (exists) next = zones.filter(z => z.tz !== zone.tz)
    else { if (zones.length >= 4) return; next = [...zones, zone] }
    setZones(next)
    localStorage.setItem('lumio_world_zones', JSON.stringify(next))
    window.dispatchEvent(new StorageEvent('storage', { key: 'lumio_world_zones', newValue: JSON.stringify(next) }))
  }

  async function preview(voice: typeof VOICES[0]) {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (previewing === voice.id) { setPreviewing(null); return }
    setPreviewing(voice.id)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const t = localStorage.getItem('workspace_session_token') || localStorage.getItem('demo_session_token')
      if (t) { headers['x-workspace-token'] = t; headers['x-demo-token'] = t }
      const res = await fetch('/api/tts', { method: 'POST', headers, body: JSON.stringify({ text: voice.sample, voice_id: voice.id }) })
      if (!res.ok) throw new Error()
      const buf = await res.arrayBuffer()
      const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPreviewing(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPreviewing(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch { setPreviewing(null) }
  }

  const isDev = typeof window !== 'undefined' && localStorage.getItem('NEXT_PUBLIC_ENV') === 'dev'
  const filteredTz = tzSearch ? ALL_TIMEZONES.filter(z => z.label.toLowerCase().includes(tzSearch.toLowerCase())) : ALL_TIMEZONES

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{schoolName || 'School'} workspace settings</p>
      </div>

      {/* Section 1 — School Details */}
      <Section title="School Details">
        <Row label="School Name" value={schoolName || 'School'} />
        <Row label="Plan" value={plan} />
        <Row label="Status" value="Active" isStatus />
      </Section>

      {/* Section 2 — Team */}
      <Section title="Team">
        <Row label="Staff members" value="1 (you)" />
        <Row label="Pending invites" value="0" />
      </Section>

      {/* Section 3 — AI Morning Briefing */}
      <Section title="AI Morning Briefing">
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Enable Morning Briefing</p><p className="text-xs" style={{ color: '#6B7280' }}>AI-generated daily summary read aloud</p></div>
            <Toggle on={briefingEnabled} onChange={() => setBriefingEnabled(!briefingEnabled)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include attendance summary</span>
            <Toggle on={includeAttendance} onChange={() => setIncludeAttendance(!includeAttendance)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include safeguarding alerts</span>
            <Toggle on={includeSafeguarding} onChange={() => setIncludeSafeguarding(!includeSafeguarding)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include staff absences</span>
            <Toggle on={includeStaffAbsences} onChange={() => setIncludeStaffAbsences(!includeStaffAbsences)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include today's schedule</span>
            <Toggle on={includeSchedule} onChange={() => setIncludeSchedule(!includeSchedule)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Briefing time</span>
            <select value={briefingTime} onChange={e => setBriefingTime(e.target.value)} style={{ ...S, width: 'auto' }}>
              <option>7:00am</option><option>7:30am</option><option>8:00am</option><option>8:30am</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Section 4 — Voice Assistant */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>🎙️ Voice Assistant</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Choose the voice for your AI morning briefing</p>
        </div>
        <div className="px-5 pt-4 space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <div><div className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>🔊 Text to Speech</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>AI voice reads your morning briefing</div></div>
            <Toggle on={ttsEnabled} onChange={() => { setTtsEnabled(!ttsEnabled); localStorage.setItem('lumio_tts_enabled', String(!ttsEnabled)) }} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <div><div className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>🎙️ Voice Commands</div><div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Say "Hi Lumio" to activate voice control</div></div>
            <Toggle on={voiceEnabled} onChange={() => { setVoiceEnabled(!voiceEnabled); localStorage.setItem('lumio_voice_commands_enabled', String(!voiceEnabled)) }} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
          {VOICES.map(voice => {
            const isActive = activeVoice === voice.id
            const isPreviewing = previewing === voice.id
            return (
              <div key={voice.id} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: isActive ? '1px solid #0D9488' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                  {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>✓ Active</span>}
                </div>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>{voice.desc}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => preview(voice)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: isPreviewing ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', color: isPreviewing ? '#A78BFA' : '#9CA3AF', border: isPreviewing ? '1px solid rgba(124,58,237,0.3)' : '1px solid #1F2937' }}>
                    {isPreviewing ? '■ Stop' : '▶ Preview'}
                  </button>
                  {!isActive && <button onClick={() => selectVoice(voice.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>Select</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 5 — SSO & Rostering */}
      <Section title="SSO & Rostering">
        <ConnectRow label="Google Workspace" connected={false} />
        <ConnectRow label="Microsoft 365" connected={false} />
        <ConnectRow label="Arbor" connected={false} />
        <ConnectRow label="SIMS" connected={false} />
        <ConnectRow label="Bromcom" connected={false} />
      </Section>

      {/* Section 6 — Integrations */}
      <Section title="Integrations">
        <ConnectRow label="ParentPay" connected={false} />
        <ConnectRow label="Google Classroom" connected={false} />
        <ConnectRow label="Teams for Education" connected={false} />
        <ConnectRow label="SchoolMoney" connected={false} />
      </Section>

      {/* Section 7 — World Clock Timezones */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>🕐 World Clock Timezones</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Choose up to 4 timezones to display in your dashboard</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <span style={{ color: '#6B7280' }}>🔍</span>
            <input value={tzSearch} onChange={e => setTzSearch(e.target.value)} placeholder="Search timezones..." className="text-sm bg-transparent outline-none flex-1" style={{ color: '#F9FAFB' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
            {filteredTz.map(zone => {
              const isSelected = zones.some(z => z.tz === zone.tz)
              return (
                <button key={zone.tz} onClick={() => toggleZone(zone)} disabled={!isSelected && zones.length >= 4}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left"
                  style={{ backgroundColor: isSelected ? 'rgba(13,148,136,0.08)' : '#0A0B10', border: isSelected ? '1px solid rgba(13,148,136,0.3)' : '1px solid #1F2937', opacity: !isSelected && zones.length >= 4 ? 0.4 : 1, cursor: !isSelected && zones.length >= 4 ? 'not-allowed' : 'pointer' }}>
                  <span className="text-sm" style={{ color: isSelected ? '#0D9488' : '#9CA3AF' }}>{zone.label}</span>
                  {isSelected && <span style={{ color: '#0D9488' }}>✓</span>}
                </button>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>{zones.length}/4 selected</p>
        </div>
      </div>

      {/* Section 8 — Login & Security */}
      <Section title="Login & Security">
        <Row label="Current method" value="Email OTP" />
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => alert('PIN login setup — coming soon')} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            Set up PIN login
          </button>
        </div>
      </Section>

      {/* Section 9 — Data & Display */}
      <Section title="Data & Display">
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
                {demoDataActive ? 'Demo data is active' : 'Demo data'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                {demoDataActive
                  ? 'Your portal is showing sample data. Clear it to see your real workspace.'
                  : 'Load sample data to explore all features before connecting your real data.'}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setDemoLoading(true)
              const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
              if (demoDataActive) {
                // Clear demo data
                Object.keys(localStorage)
                  .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_schools_demo') || k.includes('_hasData'))
                  .forEach(k => localStorage.removeItem(k))
                localStorage.removeItem('lumio_schools_demo_loaded')
                await supabase.from('schools').update({ demo_data_active: false }).eq('slug', schoolSlug)
                setDemoDataActive(false)
              } else {
                // Load demo data
                localStorage.setItem('lumio_schools_demo_loaded', 'true')
                await supabase.from('schools').update({ demo_data_active: true }).eq('slug', schoolSlug)
                setDemoDataActive(true)
              }
              setDemoLoading(false)
              window.location.reload()
            }}
            disabled={demoLoading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{
              backgroundColor: demoDataActive ? 'rgba(239,68,68,0.1)' : 'rgba(13,148,136,0.1)',
              color: demoDataActive ? '#EF4444' : '#0D9488',
              border: `1px solid ${demoDataActive ? 'rgba(239,68,68,0.3)' : 'rgba(13,148,136,0.3)'}`,
              opacity: demoLoading ? 0.6 : 1,
            }}
          >
            {demoLoading ? 'Loading...' : demoDataActive ? 'Clear demo data' : 'Load demo data'}
          </button>
        </div>
      </Section>

      {/* Section 10 — Dev Tools */}
      {isDev && (
        <Section title="Dev Tools">
          <div className="px-5 py-4">
            <button onClick={() => { localStorage.clear(); window.location.reload() }} className="text-xs px-4 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              Reset Onboarding
            </button>
          </div>
        </Section>
      )}
    </div>
  )
}
