'use client'
import { useState, useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'

const QUOTES = [
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
  { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { text: "Every child deserves a champion — an adult who will never give up on them.", author: "Rita Pierson" },
  { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { text: "Children must be taught how to think, not what to think.", author: "Margaret Mead" },
  { text: "It takes a village to raise a child.", author: "African Proverb" },
  { text: "The whole purpose of education is to turn mirrors into windows.", author: "Sydney J. Harris" },
  { text: "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.", author: "Brad Henry" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The mediocre teacher tells. The good teacher explains. The great teacher inspires.", author: "William Arthur Ward" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "The function of education is to teach one to think intensively and to think critically.", author: "Martin Luther King Jr." },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai" },
  { text: "The greatest sign of success for a teacher is to be able to say the children are now working as if I did not exist.", author: "Maria Montessori" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "A teacher affects eternity; he can never tell where his influence stops.", author: "Henry Adams" },
  { text: "The task of the modern educator is not to cut down jungles, but to irrigate deserts.", author: "C.S. Lewis" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "Learning is not attained by chance; it must be sought with ardour and attended with diligence.", author: "Abigail Adams" },
  { text: "You can teach a student a lesson for a day; but if you can teach him to learn by creating curiosity, he will continue the learning process.", author: "Clay P. Bedford" },
  { text: "The best teachers are those who show you where to look but don't tell you what to see.", author: "Alexandra K. Trenfor" },
  { text: "Education breeds confidence. Confidence breeds hope. Hope breeds peace.", author: "Confucius" },
  { text: "It is the supreme art of the teacher to awaken joy in creative expression and knowledge.", author: "Albert Einstein" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Try to learn something about everything and everything about something.", author: "Thomas Henry Huxley" },
]

function getDailyQuote() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return QUOTES[dayOfYear % QUOTES.length]
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
  const hourDeg = (h / 12) * 360 + (m / 60) * 30
  const minuteDeg = (m / 60) * 360 + (s / 60) * 6
  const secondDeg = (s / 60) * 360
  const cx = 28
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={cx} cy={cx} r={cx - 1} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
        return <line key={i} x1={cx + (cx-4)*Math.cos(angle)} y1={cx + (cx-4)*Math.sin(angle)} x2={cx + (cx-8)*Math.cos(angle)} y2={cx + (cx-8)*Math.sin(angle)} stroke="rgba(255,255,255,0.3)" strokeWidth={i%3===0?1.5:0.75} />
      })}
      <line x1={cx} y1={cx} x2={cx+Math.cos((hourDeg-90)*Math.PI/180)*(cx-14)} y2={cx+Math.sin((hourDeg-90)*Math.PI/180)*(cx-14)} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={cx} x2={cx+Math.cos((minuteDeg-90)*Math.PI/180)*(cx-8)} y2={cx+Math.sin((minuteDeg-90)*Math.PI/180)*(cx-8)} stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      <line x1={cx} y1={cx} x2={cx+Math.cos((secondDeg-90)*Math.PI/180)*(cx-6)} y2={cx+Math.sin((secondDeg-90)*Math.PI/180)*(cx-6)} stroke="#0D9488" strokeWidth="1" strokeLinecap="round" />
      <circle cx={cx} cy={cx} r="2" fill="#0D9488" />
    </svg>
  )
}

function FuturistFace({ now }: { now: Date }) {
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds()
  return (
    <div style={{ minWidth: 88 }}>
      <div className="font-mono text-xs font-black tracking-widest mb-1.5" style={{ color: '#0D9488', letterSpacing: '0.2em' }}>{pad(h)}:{pad(m)}:{pad(s)}</div>
      {[{ label: 'H', pct: (h%24/24)*100, color: '#34D399' }, { label: 'M', pct: (m/60)*100, color: '#0D9488' }, { label: 'S', pct: (s/60)*100, color: '#6EE7B7' }].map(({ label, pct, color }) => (
        <div key={label} className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-bold w-3" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: label==='S'?'width 0.9s linear':'width 0.9s ease' }} />
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
        {style === 'analog' && <div className="flex items-center gap-2"><AnalogFace now={now} /><div><div className="font-mono text-sm font-black text-white">{pad(now.getHours())}:{pad(now.getMinutes())}</div><div className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.6)' }}>Local Time</div></div></div>}
        {style === 'digital' && <div style={{ minWidth: 80 }}><div className="text-xl font-black text-white font-mono">{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</div><div className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.6)' }}>Local Time</div></div>}
        {style === 'futurist' && <FuturistFace now={now} />}
      </button>
      {pickerOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minWidth: 200 }}>
          <div className="px-3 py-2" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Clock Style</p></div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {CLOCK_OPTIONS.map(({ id, label, emoji }) => (
              <button key={id} onClick={() => select(id)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 w-full text-left"
                style={{ backgroundColor: style===id ? 'rgba(13,148,136,0.15)' : 'transparent', border: `1px solid ${style===id ? 'rgba(13,148,136,0.4)' : 'transparent'}` }}
                onMouseEnter={e => { if (style!==id) (e.currentTarget as HTMLButtonElement).style.backgroundColor='rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (style!==id) (e.currentTarget as HTMLButtonElement).style.backgroundColor='transparent' }}>
                <span>{emoji}</span>
                <span className="text-sm font-medium" style={{ color: style===id ? '#0D9488' : '#9CA3AF' }}>{label}</span>
                {style===id && <span className="ml-auto text-xs" style={{ color: '#0D9488' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [speaking, setSpeaking] = useState(false)
  const quote = getDailyQuote()

  function speak() {
    if (!('speechSynthesis' in window)) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const text = `${greeting}, ${firstName}. Today is ${dateStr}. ${termWeek}. Attendance is ${attendance}%. ${staffIn} staff in. ${openConcerns} open safeguarding concerns. ${activeWorkflows} active workflows.`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = headteacher.replace(/^(Mrs?|Ms|Miss|Dr)\s+/, '').split(' ')[0]
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const termWeek = `Term 4, Week 9${weeksToSATs ? ` · ${weeksToSATs} weeks to SATs` : ''} · ${schoolName}`

  useEffect(() => {
    fetch('/api/home/weather').then(r => r.json()).then(d => setWeather(d)).catch(() => {})
  }, [])

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
              <button onClick={speak} title={speaking ? 'Stop' : 'Read aloud'} className="flex-shrink-0 rounded-lg p-1.5 transition-colors" style={{ backgroundColor: speaking ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.1)', color: speaking ? '#6EE7B7' : 'rgba(167,243,208,0.7)' }}>
                <Volume2 size={15} />
              </button>
            </div>
            <p className="text-sm mb-1" style={{ color: 'rgba(167,243,208,0.8)' }}>{dateStr}</p>
            <p className="text-xs mb-3" style={{ color: 'rgba(167,243,208,0.6)' }}>{termWeek}</p>
            <p className="text-sm italic" style={{ color: 'rgba(167,243,208,0.7)' }}>&ldquo;{quote.text}&rdquo;</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(167,243,208,0.4)' }}>— {quote.author}</p>
          </div>

          {/* CENTRE: stat pills */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Attendance', value: `${attendance}%`, color: attendance >= 95 ? 'rgba(16,185,129,0.2)' : attendance >= 90 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', border: attendance >= 95 ? 'rgba(16,185,129,0.4)' : attendance >= 90 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)', icon: '📊' },
              { label: 'Staff in',   value: staffIn,          color: 'rgba(16,185,129,0.2)',   border: 'rgba(16,185,129,0.4)',   icon: '👥' },
              { label: 'Concerns',   value: String(openConcerns), color: openConcerns > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', border: openConcerns > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)', icon: '🔴' },
              { label: 'Workflows',  value: String(activeWorkflows), color: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)', icon: '⚡' },
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
