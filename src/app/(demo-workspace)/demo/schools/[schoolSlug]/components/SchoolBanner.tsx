'use client'
import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic } from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useVoiceCommands } from '@/hooks/useVoiceCommands'

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

function pad(n: number) { return String(n).padStart(2, '0') }

const WORLD_ZONES = [
  { label: 'London',   tz: 'Europe/London'    },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai',    tz: 'Asia/Dubai'       },
  { label: 'Tokyo',    tz: 'Asia/Tokyo'       },
]

function getZoneTime(tz: string, d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz, hour12: false })
}

type ClockStyle = 'worldclock' | 'analog' | 'digital' | 'futurist'

const CLOCK_OPTIONS: { id: ClockStyle; label: string; emoji: string }[] = [
  { id: 'worldclock', label: 'World Clock',   emoji: '🌍' },
  { id: 'analog',     label: 'Classic Hands', emoji: '🕐' },
  { id: 'digital',    label: 'Digital',       emoji: '💻' },
  { id: 'futurist',   label: 'Futurist',      emoji: '⚡' },
]

function AnalogFace({ now }: { now: Date }) {
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds()
  const hourDeg   = (h / 12) * 360 + (m / 60) * 30
  const minuteDeg = (m / 60) * 360 + (s / 60) * 6
  const secondDeg = (s / 60) * 360
  const cx = 28
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={cx} cy={cx} r={cx - 1} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
        return <line key={i}
          x1={cx + (cx - 4) * Math.cos(angle)} y1={cx + (cx - 4) * Math.sin(angle)}
          x2={cx + (cx - 8) * Math.cos(angle)} y2={cx + (cx - 8) * Math.sin(angle)}
          stroke="rgba(255,255,255,0.3)" strokeWidth={i % 3 === 0 ? 1.5 : 0.75} />
      })}
      <line x1={cx} y1={cx} x2={cx + Math.cos((hourDeg - 90) * Math.PI / 180) * (cx - 14)}   y2={cx + Math.sin((hourDeg - 90) * Math.PI / 180) * (cx - 14)}   stroke="white"   strokeWidth="2.5"  strokeLinecap="round" />
      <line x1={cx} y1={cx} x2={cx + Math.cos((minuteDeg - 90) * Math.PI / 180) * (cx - 8)}  y2={cx + Math.sin((minuteDeg - 90) * Math.PI / 180) * (cx - 8)}  stroke="white"   strokeWidth="1.75" strokeLinecap="round" />
      <line x1={cx} y1={cx} x2={cx + Math.cos((secondDeg - 90) * Math.PI / 180) * (cx - 6)}  y2={cx + Math.sin((secondDeg - 90) * Math.PI / 180) * (cx - 6)}  stroke="#0D9488" strokeWidth="1"    strokeLinecap="round" />
      <circle cx={cx} cy={cx} r="2" fill="#0D9488" />
    </svg>
  )
}

function FuturistFace({ now }: { now: Date }) {
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds()
  return (
    <div style={{ minWidth: 88 }}>
      <div className="font-mono text-xs font-black tracking-widest mb-1.5" style={{ color: '#0D9488', letterSpacing: '0.2em' }}>{pad(h)}:{pad(m)}:{pad(s)}</div>
      {[{ label: 'H', pct: (h % 24 / 24) * 100, color: '#34D399' }, { label: 'M', pct: (m / 60) * 100, color: '#0D9488' }, { label: 'S', pct: (s / 60) * 100, color: '#6EE7B7' }].map(({ label, pct, color }) => (
        <div key={label} className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-bold w-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: label === 'S' ? 'width 0.9s linear' : 'width 0.9s ease' }} />
          </div>
        </div>
      ))}
      <div className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.5)' }}>Local Time</div>
    </div>
  )
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  const [style, setStyle] = useState<ClockStyle>(() => typeof window !== 'undefined' ? (localStorage.getItem('clockStyle') as ClockStyle) || 'worldclock' : 'worldclock')
  const [pickerOpen, setPickerOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setPickerOpen(false) }
    if (pickerOpen) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pickerOpen])

  function select(s: ClockStyle) { setStyle(s); localStorage.setItem('clockStyle', s); setPickerOpen(false) }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setPickerOpen(v => !v)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {style === 'worldclock' && (
          <div style={{ minWidth: 160 }}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {WORLD_ZONES.map(z => (
                <div key={z.label} className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-black text-white">{getZoneTime(z.tz, now)}</span>
                  <span className="text-xs" style={{ color: 'rgba(167,243,208,0.6)' }}>{z.label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(167,243,208,0.4)' }}>World Clock</div>
          </div>
        )}
        {style === 'analog'   && <div className="flex items-center gap-2"><AnalogFace now={now} /><div><div className="font-mono text-sm font-black text-white">{pad(now.getHours())}:{pad(now.getMinutes())}</div><div className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.6)' }}>Local Time</div></div></div>}
        {style === 'digital'  && <div style={{ minWidth: 80 }}><div className="text-xl font-black text-white font-mono">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</div><div className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.6)' }}>Local Time</div></div>}
        {style === 'futurist' && <FuturistFace now={now} />}
      </button>
      {pickerOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 200 }}>
          <div className="px-3 py-2" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Clock Style</p></div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {CLOCK_OPTIONS.map(({ id, label, emoji }) => (
              <button key={id} onClick={() => select(id)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 w-full text-left"
                style={{ backgroundColor: style === id ? 'rgba(13,148,136,0.15)' : 'transparent', border: `1px solid ${style === id ? 'rgba(13,148,136,0.4)' : 'transparent'}` }}
                onMouseEnter={e => { if (style !== id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (style !== id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}>
                <span>{emoji}</span>
                <span className="text-sm font-medium" style={{ color: style === id ? '#0D9488' : '#9CA3AF' }}>{label}</span>
                {style === id && <span className="ml-auto text-xs" style={{ color: '#0D9488' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── School briefing script ───────────────────────────────────────────────────

function buildSchoolBriefing({
  firstName, dateStr, termWeek, attendance, staffIn, openConcerns, activeWorkflows,
}: {
  firstName: string
  dateStr: string
  termWeek: string
  attendance: number
  staffIn: string
  openConcerns: number
  activeWorkflows: number
}): string {
  const h = new Date().getHours()
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const parts: string[] = []

  parts.push(`Good ${period}, ${firstName}.`)

  if (period === 'morning') {
    parts.push(`Today is ${dateStr}.`)
    parts.push(`${termWeek}.`)
    parts.push(`Whole school attendance is currently ${attendance} percent.`)
    parts.push(`${staffIn} staff confirmed in today.`)
    if (openConcerns > 0) {
      parts.push(`There ${openConcerns === 1 ? 'is' : 'are'} ${openConcerns} open safeguarding concern${openConcerns !== 1 ? 's' : ''} requiring DSL review.`)
    } else {
      parts.push(`No open safeguarding concerns — all clear.`)
    }
    parts.push(`${activeWorkflows} workflows are active and running.`)
    parts.push(`Have a wonderful day.`)
  } else if (period === 'afternoon') {
    parts.push(`Afternoon check-in.`)
    parts.push(`Attendance is at ${attendance} percent today.`)
    if (openConcerns > 0) {
      parts.push(`Reminder — ${openConcerns} safeguarding concern${openConcerns !== 1 ? 's' : ''} still awaiting review.`)
    }
    parts.push(`${activeWorkflows} workflows still running.`)
    parts.push(`Good work this morning — keep it up.`)
  } else {
    parts.push(`End of day summary.`)
    parts.push(`Attendance today was ${attendance} percent.`)
    parts.push(`${activeWorkflows} workflows ran today.`)
    parts.push(`Well done — rest up, see you tomorrow.`)
  }

  return parts.join('  ')
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  schoolName: string
  headteacher: string
  town: string
  attendance: number
  staffIn: string
  openConcerns: number
  activeWorkflows: number
  weeksToSATs?: number
}

export default function SchoolBanner({ schoolName, headteacher, town, attendance, staffIn, openConcerns, activeWorkflows, weeksToSATs }: Props) {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })
  const { speak, stop, isPlaying } = useSpeech()
  const { isListening, lastCommand, startListening, stopListening } = useVoiceCommands()
  const [quote] = useState(() => { try { return getRandomQuote() } catch { return QUOTES[0] } })

  const now = new Date()
  const h = now.getHours()
  const greeting    = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const firstName   = headteacher.replace(/^(Mrs?|Ms|Miss|Dr)\s+/, '').split(' ')[0]
  const dateStr     = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const termWeek    = `Term 4, Week 9${weeksToSATs ? ` · ${weeksToSATs} weeks to SATs` : ''} · ${schoolName}`

  function handleSpeak() {
    if (isPlaying) {
      stop()
    } else {
      speak(buildSchoolBriefing({ firstName, dateStr, termWeek, attendance, staffIn, openConcerns, activeWorkflows }))
    }
  }

  useEffect(() => {
    fetch('/api/home/weather').then(r => r.json()).then(d => setWeather(d)).catch(() => {})
  }, [])

  // Handle voice command actions
  useEffect(() => {
    if (!lastCommand) return
    const { action, response } = lastCommand
    speak(response)
    if (action === 'PLAY_BRIEFING') setTimeout(() => handleSpeak(), 1500)
    else if (action === 'STOP_AUDIO') stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand])

  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#10b981' }} />
      <div className="absolute right-40 bottom-0 w-40 h-40 rounded-full opacity-10 blur-2xl" style={{ backgroundColor: '#34d399' }} />

      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* LEFT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName}. 👋</h1>

              {/* TTS */}
              <button
                onClick={handleSpeak}
                title={isPlaying ? 'Stop' : 'Read aloud'}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)',
                  border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  color: isPlaying ? '#6EE7B7' : 'rgba(167,243,208,0.7)',
                }}
              >
                <Volume2 size={15} strokeWidth={1.75} />
              </button>

              {/* Mic — voice commands */}
              <button
                onClick={() => isListening ? stopListening() : startListening()}
                title={isListening ? 'Listening...' : 'Voice command'}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32, flexShrink: 0, cursor: 'pointer',
                  backgroundColor: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                  border: isListening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  color: isListening ? '#EF4444' : '#F9FAFB',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                <Mic size={14} strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-sm mb-1"  style={{ color: 'rgba(167,243,208,0.8)' }}>{dateStr}</p>
            <p className="text-xs mb-3"  style={{ color: 'rgba(167,243,208,0.6)' }}>{termWeek}</p>
            <p className="text-sm italic" style={{ color: 'rgba(167,243,208,0.7)' }}>&ldquo;{quote.text}&rdquo;</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.4)' }}>— {quote.author}</p>
          </div>

          {/* CENTRE: stat pills */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Attendance', value: `${attendance}%`,        color: attendance >= 95 ? 'rgba(16,185,129,0.2)' : attendance >= 90 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', border: attendance >= 95 ? 'rgba(16,185,129,0.4)' : attendance >= 90 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)', icon: '📊' },
              { label: 'Staff in',   value: staffIn,                  color: 'rgba(16,185,129,0.2)',                                                                                           border: 'rgba(16,185,129,0.4)',                                                                                           icon: '👥' },
              { label: 'Concerns',   value: String(openConcerns),     color: openConcerns > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',                                                border: openConcerns > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)',                                                icon: '🛡️' },
              { label: 'Workflows',  value: String(activeWorkflows),  color: 'rgba(16,185,129,0.2)',                                                                                           border: 'rgba(16,185,129,0.4)',                                                                                           icon: '⚡' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center px-3 py-2 rounded-xl min-w-[70px]" style={{ backgroundColor: item.color, border: `1px solid ${item.border}` }}>
                <span className="text-base">{item.icon}</span>
                <span className="text-lg font-black text-white">{item.value}</span>
                <span className="text-xs opacity-70 text-white">{item.label}</span>
              </div>
            ))}
          </div>

          {/* RIGHT: weather + clock */}
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-3xl">{weather.icon}</span>
              <div>
                <div className="text-xl font-black text-white">{weather.temp}</div>
                <div className="text-xs" style={{ color: 'rgba(167,243,208,0.8)' }}>{weather.condition}</div>
                <div className="text-xs" style={{ color: 'rgba(167,243,208,0.5)' }}>{town}</div>
              </div>
            </div>
            <LiveClock />
          </div>

        </div>
      </div>
    </div>
  )
}
