'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic } from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { buildBriefingScript, type BriefingData, type ActionedItem } from '@/lib/buildBriefingScript'

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

// ─── Daily Quote ────────────────────────────────────────────────────────────

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "The only limit to our realisation of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or think you can't, you're right.", author: "Henry Ford" },
  { text: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
  { text: "I owe my success to having listened respectfully to the very best advice, and then going away and doing the exact opposite.", author: "G.K. Chesterton" },
  { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
  { text: "Success seems to be connected with action. Successful people keep moving.", author: "Conrad Hilton" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.", author: "James Cameron" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Try not to become a man of success. Rather become a man of value.", author: "Albert Einstein" },
  { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The real test is not whether you avoid failure, because you won't. It's whether you let it harden or shame you into inaction.", author: "Barack Obama" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The best teachers are those who show you where to look but don't tell you what to see.", author: "Alexandra K. Trenfor" },
]

function getRandomQuote() {
  const usedRaw = localStorage.getItem('lumio_used_quotes')
  let used: number[] = usedRaw ? JSON.parse(usedRaw) : []
  if (used.length >= QUOTES.length) {
    used = []
  }
  const available = QUOTES.map((_, i) => i).filter(i => !used.includes(i))
  const idx = available[Math.floor(Math.random() * available.length)]
  used.push(idx)
  localStorage.setItem('lumio_used_quotes', JSON.stringify(used))
  return QUOTES[idx]
}

// ─── Clock ───────────────────────────────────────────────────────────────────

type ClockStyle = 'worldclock' | 'analog' | 'digital' | 'futurist'

function pad(n: number): string { return String(n).padStart(2, '0') }

const WORLD_ZONES = [
  { label: 'London',   tz: 'Europe/London'    },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai',    tz: 'Asia/Dubai'       },
  { label: 'Tokyo',    tz: 'Asia/Tokyo'       },
]

function getZoneTime(tz: string, d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz, hour12: false })
}

// Analog SVG clock
function AnalogFace({ now }: { now: Date }) {
  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hourDeg   = (h / 12) * 360 + (m / 60) * 30
  const minuteDeg = (m / 60) * 360 + (s / 60) * 6
  const secondDeg = (s / 60) * 360
  const size = 56
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Face */}
      <circle cx={cx} cy={cx} r={cx - 1} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
        const r1 = cx - 4, r2 = cx - 8
        return (
          <line key={i}
            x1={cx + r1 * Math.cos(angle)} y1={cx + r1 * Math.sin(angle)}
            x2={cx + r2 * Math.cos(angle)} y2={cx + r2 * Math.sin(angle)}
            stroke="rgba(255,255,255,0.3)" strokeWidth={i % 3 === 0 ? 1.5 : 0.75} />
        )
      })}
      {/* Hour hand */}
      <line x1={cx} y1={cx}
        x2={cx + Math.cos((hourDeg - 90) * Math.PI / 180) * (cx - 14)}
        y2={cx + Math.sin((hourDeg - 90) * Math.PI / 180) * (cx - 14)}
        stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cx}
        x2={cx + Math.cos((minuteDeg - 90) * Math.PI / 180) * (cx - 8)}
        y2={cx + Math.sin((minuteDeg - 90) * Math.PI / 180) * (cx - 8)}
        stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      {/* Second hand */}
      <line x1={cx} y1={cx}
        x2={cx + Math.cos((secondDeg - 90) * Math.PI / 180) * (cx - 6)}
        y2={cx + Math.sin((secondDeg - 90) * Math.PI / 180) * (cx - 6)}
        stroke="#2DD4BF" strokeWidth="1" strokeLinecap="round" />
      {/* Centre dot */}
      <circle cx={cx} cy={cx} r="2" fill="#2DD4BF" />
    </svg>
  )
}

// Futurist clock
function FuturistFace({ now }: { now: Date }) {
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hPct = ((h % 24) / 24) * 100
  const mPct = (m / 60) * 100
  const sPct = (s / 60) * 100
  return (
    <div style={{ minWidth: 88 }}>
      <div className="font-mono text-xs font-black tracking-widest mb-1.5" style={{ color: '#2DD4BF', letterSpacing: '0.2em' }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
      {[
        { label: 'H', pct: hPct, color: '#818CF8' },
        { label: 'M', pct: mPct, color: '#2DD4BF' },
        { label: 'S', pct: sPct, color: '#A78BFA' },
      ].map(({ label, pct, color }) => (
        <div key={label} className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-bold w-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: label === 'S' ? 'width 0.9s linear' : 'width 0.9s ease' }} />
          </div>
        </div>
      ))}
      <div className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.5)' }}>Local Time</div>
    </div>
  )
}

const CLOCK_OPTIONS: { id: ClockStyle; label: string; emoji: string }[] = [
  { id: 'worldclock', label: 'World Clock',  emoji: '🌍' },
  { id: 'analog',     label: 'Classic Hands', emoji: '🕐' },
  { id: 'digital',    label: 'Digital',       emoji: '💻' },
  { id: 'futurist',   label: 'Futurist',      emoji: '⚡' },
]

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  const [style, setStyle] = useState<ClockStyle>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('clockStyle') as ClockStyle) || 'worldclock'
    }
    return 'worldclock'
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

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        onClick={() => setPickerOpen(v => !v)}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        title="Click to change clock style"
      >
        {/* World clock */}
        {style === 'worldclock' && (
          <div style={{ minWidth: 160 }}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {WORLD_ZONES.map(z => (
                <div key={z.label} className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-black text-white">{getZoneTime(z.tz, now)}</span>
                  <span className="text-xs" style={{ color: 'rgba(167,139,250,0.6)' }}>{z.label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(167,139,250,0.4)' }}>World Clock</div>
          </div>
        )}

        {/* Analog */}
        {style === 'analog' && (
          <div className="flex items-center gap-2">
            <AnalogFace now={now} />
            <div>
              <div className="font-mono text-sm font-black text-white">{pad(now.getHours())}:{pad(now.getMinutes())}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.6)' }}>Local Time</div>
            </div>
          </div>
        )}

        {/* Digital */}
        {style === 'digital' && (
          <div style={{ minWidth: 80 }}>
            <div className="text-xl font-black text-white font-mono">
              {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.6)' }}>Local Time</div>
          </div>
        )}

        {/* Futurist */}
        {style === 'futurist' && <FuturistFace now={now} />}
      </button>

      {/* Picker dropdown */}
      {pickerOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 200 }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Clock Style</p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {CLOCK_OPTIONS.map(({ id, label, emoji }) => {
              const isActive = style === id
              return (
                <button
                  key={id}
                  onClick={() => selectStyle(id)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 w-full text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? 'rgba(13,148,136,0.15)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(13,148,136,0.4)' : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                >
                  <span>{emoji}</span>
                  <span className="text-sm font-medium" style={{ color: isActive ? '#2DD4BF' : '#9CA3AF' }}>{label}</span>
                  {isActive && <span className="ml-auto text-xs" style={{ color: '#2DD4BF' }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────

const INITIAL_DATA: BriefingData = {
  userName: 'Arron',
  greeting: '',
  date: '',
  weather: { temp: '--', condition: 'Loading...', icon: '🌤️', location: 'Milton Keynes' },
  todaySummary: { meetings: 0, tasks: 0, urgent: 0, emails: 0 },
  motivationalLine: 'Ready to automate everything.',
}

export default function PersonalBanner() {
  const [data, setData] = useState<BriefingData>(() => ({
    ...INITIAL_DATA,
    greeting: getGreeting('Arron'),
    date: formatDate(),
  }))
  const [actioned, setActioned] = useState<ActionedItem[]>([])
  const [bgGradient] = useState(() => BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useSpeech()
  const [quote] = useState(() => { try { return getRandomQuote() } catch { return QUOTES[0] } })

  useEffect(() => {
    const fallback: BriefingData = { ...INITIAL_DATA, greeting: getGreeting('Arron'), date: formatDate() }
    Promise.all([
      fetch('/api/home/briefing').then(r => r.json()).catch(() => ({})),
      fetch('/api/home/weather').then(r => r.json()).catch(() => ({})),
      fetch('/api/briefing/action').then(r => r.json()).catch(() => ({ actions: [] })),
    ]).then(([brief, weather, actionData]) => {
      setData({ ...fallback, ...brief, weather: { ...fallback.weather, ...weather } })
      setActioned(actionData.actions ?? [])
    })
  }, [])

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
              <button
                onClick={() => isPlaying ? stop() : speak(buildBriefingScript(data, actioned))}
                title="Text-to-Speech"
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
              <div
                className="relative overflow-hidden rounded-lg"
                title="Voice Commands coming soon"
                style={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <button disabled className="flex items-center justify-center w-full h-full rounded-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#6B7280', cursor: 'not-allowed' }}>
                  <Mic size={15} strokeWidth={1.75} />
                </button>
                <span className="absolute pointer-events-none"
                  style={{ top: 3, right: -9, transform: 'rotate(35deg)', backgroundColor: '#6C3FC5', color: '#fff', fontSize: 5, fontWeight: 700, letterSpacing: '0.03em', padding: '1px 10px', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                  SOON
                </span>
              </div>
            </div>
            <p className="text-purple-300 text-sm mb-2">{data.date}</p>
            {/* Daily quote */}
            <div className="mt-1">
              <p className="text-purple-100/70 text-sm italic leading-snug">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-purple-300/50 text-xs mt-0.5">— {quote.author}</p>
            </div>
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
