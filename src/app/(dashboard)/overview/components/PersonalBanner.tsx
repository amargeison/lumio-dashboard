'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'

interface BriefingData {
  userName: string
  greeting: string
  date: string
  weather: { temp: string; condition: string; icon: string; location: string }
  todaySummary: { meetings: number; tasks: number; urgent: number; emails: number }
  motivationalLine: string
}

const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️', clear: '☀️', cloudy: '☁️', overcast: '☁️',
  rain: '🌧️', drizzle: '🌦️', storm: '⛈️', snow: '❄️',
  fog: '🌫️', wind: '💨', default: '🌤️',
}

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const BG_GRADIENTS = [
  'from-violet-950 via-purple-900 to-indigo-950',
  'from-slate-900 via-purple-950 to-violet-900',
  'from-indigo-950 via-violet-900 to-purple-950',
  'from-gray-900 via-violet-950 to-purple-900',
  'from-purple-950 via-indigo-950 to-slate-900',
  'from-violet-900 via-slate-900 to-purple-950',
  'from-indigo-900 via-purple-950 to-violet-950',
]

function buildBriefingScript(data: BriefingData): string {
  const { greeting, todaySummary, motivationalLine, weather } = data
  const parts: string[] = []
  parts.push(`${greeting}.`)
  const { meetings, tasks, urgent, emails } = todaySummary
  if (meetings > 0) parts.push(`You have ${meetings} meeting${meetings !== 1 ? 's' : ''} today.`)
  if (tasks > 0) parts.push(`${tasks} task${tasks !== 1 ? 's' : ''} on your list.`)
  if (urgent > 0) parts.push(`${urgent} item${urgent !== 1 ? 's are' : ' is'} marked urgent.`)
  if (emails > 0) parts.push(`${emails} email${emails !== 1 ? 's' : ''} waiting.`)
  if (weather?.temp && weather.temp !== '--') parts.push(`It's ${weather.temp} and ${weather.condition} in ${weather.location}.`)
  parts.push(motivationalLine)
  return parts.join(' ')
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

type ClockStyle = 'digital24' | 'digital12' | 'minimal' | 'words' | 'timezone' | 'secondsbar'

function pad(n: number): string { return String(n).padStart(2, '0') }

function timeToWords(h: number, m: number): string {
  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty one', 'twenty two',
    'twenty three', 'twenty four', 'twenty five', 'twenty six', 'twenty seven',
    'twenty eight', 'twenty nine',
  ]
  const h12 = h % 12 || 12
  const nextH = (h12 % 12) + 1
  if (m === 0) return `${ones[h12]} o'clock`
  if (m === 15) return `quarter past ${ones[h12]}`
  if (m === 30) return `half past ${ones[h12]}`
  if (m === 45) return `quarter to ${ones[nextH]}`
  if (m < 30) return `${ones[m]} past ${ones[h12]}`
  return `${ones[60 - m]} to ${ones[nextH]}`
}

const CLOCK_STYLES: { id: ClockStyle; label: string; preview: (d: Date) => string }[] = [
  {
    id: 'digital24', label: 'Digital 24hr',
    preview: (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  },
  {
    id: 'digital12', label: 'Digital 12hr',
    preview: (d) => {
      const h = d.getHours(); const m = d.getMinutes()
      return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
    },
  },
  {
    id: 'minimal', label: 'Minimal',
    preview: (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  },
  {
    id: 'words', label: 'Words',
    preview: (d) => timeToWords(d.getHours(), d.getMinutes()),
  },
  {
    id: 'timezone', label: 'Timezone',
    preview: (d) => {
      const gmt = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} GMT`
      const est = `${pad((d.getUTCHours() + 19) % 24)}:${pad(d.getUTCMinutes())} EST`
      return `${gmt} · ${est}`
    },
  },
  {
    id: 'secondsbar', label: 'Seconds bar',
    preview: (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  },
]

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  const [style, setStyle] = useState<ClockStyle>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('clockStyle') as ClockStyle) || 'digital24'
    }
    return 'digital24'
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [pickerOpen])

  function selectStyle(s: ClockStyle) {
    setStyle(s)
    localStorage.setItem('clockStyle', s)
    setPickerOpen(false)
  }

  const timeDisplay = CLOCK_STYLES.find(s => s.id === style)!.preview(now)
  const secs = now.getSeconds()

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        onClick={() => setPickerOpen(v => !v)}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        title="Click to change clock style"
      >
        <span className="text-3xl select-none">🕐</span>
        <div style={{ minWidth: 80 }}>
          {style === 'secondsbar' ? (
            <>
              <div className="text-xl font-black text-white font-mono">{timeDisplay}</div>
              <div className="mt-1 h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${(secs / 60) * 100}%`, backgroundColor: '#2DD4BF', transition: secs === 0 ? 'none' : 'width 0.9s linear' }} />
              </div>
            </>
          ) : style === 'words' ? (
            <div className="text-sm font-bold text-white capitalize leading-tight">{timeDisplay}</div>
          ) : style === 'timezone' ? (
            <div className="text-xs font-bold text-white font-mono leading-snug whitespace-pre">{timeDisplay.replace(' · ', '\n')}</div>
          ) : (
            <div className="text-xl font-black text-white font-mono">{timeDisplay}</div>
          )}
          <div className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.6)' }}>Local Time</div>
        </div>
      </button>

      {pickerOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 240 }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Clock Style</p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {CLOCK_STYLES.map(({ id, label, preview }) => {
              const isActive = style === id
              const previewText = preview(now)
              return (
                <button
                  key={id}
                  onClick={() => selectStyle(id)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 w-full text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? 'rgba(13,148,136,0.15)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(13,148,136,0.4)' : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                >
                  <span className="text-xs font-medium" style={{ color: isActive ? '#2DD4BF' : '#9CA3AF' }}>{label}</span>
                  <span className="text-xs font-mono ml-4 text-right" style={{ color: isActive ? '#F9FAFB' : '#6B7280' }}>
                    {id === 'secondsbar' ? `${previewText} ▬` : id === 'timezone' ? previewText.replace(' · ', ' /\n') : previewText}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PersonalBanner() {
  const [data, setData] = useState<BriefingData | null>(null)
  const [bgGradient] = useState(() => BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useSpeech()

  useEffect(() => {
    const fallback: BriefingData = {
      userName: 'Arron',
      greeting: getGreeting('Arron'),
      date: formatDate(),
      weather: { temp: '--', condition: 'Loading...', icon: '🌤️', location: 'Milton Keynes' },
      todaySummary: { meetings: 0, tasks: 0, urgent: 0, emails: 0 },
      motivationalLine: 'Ready to automate everything.',
    }
    Promise.all([
      fetch('/api/home/briefing').then(r => r.json()).catch(() => ({})),
      fetch('/api/home/weather').then(r => r.json()).catch(() => ({})),
    ]).then(([brief, weather]) => {
      setData({ ...fallback, ...brief, weather: { ...fallback.weather, ...weather } })
    })
  }, [])

  if (!data) return <div className="h-44 bg-gray-900 animate-pulse" />

  const weatherKey = Object.keys(WEATHER_ICONS).find(k =>
    data.weather.condition?.toLowerCase().includes(k)
  ) || 'default'
  const weatherIcon = WEATHER_ICONS[weatherKey]

  return (
    <div className={`relative bg-gradient-to-r ${bgGradient} overflow-hidden`}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute right-40 bottom-0 w-40 h-40 bg-teal-500 rounded-full opacity-10 blur-2xl" />

      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* LEFT: greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {data.greeting} 👋
              </h1>

              {/* Speaker 1: Active TTS */}
              <button
                onClick={() => isPlaying ? stop() : speak(buildBriefingScript(data))}
                title="Text-to-Speech — Lumio will read your morning headlines, meetings today and urgent items aloud"
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)',
                  border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  color: isPlaying ? '#2DD4BF' : '#9CA3AF',
                  animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                <Volume2 size={15} strokeWidth={1.75} />
              </button>

              {/* Speaker 2: Disabled — Coming Soon */}
              <div
                className="relative overflow-hidden rounded-lg"
                title="Voice Commands coming soon — Cancel my 11am meeting, email my team and say catch up at 2, and more"
                style={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <button
                  disabled
                  className="flex items-center justify-center w-full h-full rounded-lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#4B5563',
                    cursor: 'not-allowed',
                  }}
                >
                  <Mic size={15} strokeWidth={1.75} />
                </button>
                {/* Diagonal "Coming Soon" ribbon */}
                <span
                  className="absolute pointer-events-none"
                  style={{
                    top: 3, right: -9,
                    transform: 'rotate(35deg)',
                    backgroundColor: '#6C3FC5',
                    color: '#fff',
                    fontSize: 5,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    padding: '1px 10px',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  SOON
                </span>
              </div>
            </div>
            <p className="text-purple-300 text-sm mb-2">{data.date}</p>
            <p className="text-purple-200/60 text-sm italic">{data.motivationalLine}</p>
          </div>

          {/* CENTRE: summary pills */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Meetings', value: data.todaySummary.meetings, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',    icon: '📅' },
              { label: 'Tasks',    value: data.todaySummary.tasks,    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '✅' },
              { label: 'Urgent',   value: data.todaySummary.urgent,   color: 'bg-red-500/20 text-red-300 border-red-500/30',        icon: '🔴' },
              { label: 'Emails',   value: data.todaySummary.emails,   color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',     icon: '📧' },
            ].map(item => (
              <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                <span className="text-base">{item.icon}</span>
                <span className="text-lg font-black text-white">{item.value}</span>
                <span className="text-xs opacity-70">{item.label}</span>
              </div>
            ))}
          </div>

          {/* RIGHT: weather + clock */}
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <span className="text-3xl">{weatherIcon}</span>
              <div>
                <div className="text-xl font-black text-white">{data.weather.temp}</div>
                <div className="text-xs text-purple-300">{data.weather.condition}</div>
                <div className="text-xs text-purple-300/60">{data.weather.location}</div>
              </div>
            </div>
            <LiveClock />
          </div>
        </div>
      </div>
    </div>
  )
}
