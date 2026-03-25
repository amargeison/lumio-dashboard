'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, Mic } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'
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
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "To see what is right and not do it is a lack of courage.", author: "Confucius" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "Many of life's failures are people who did not realise how close they were to success when they gave up.", author: "Thomas A. Edison" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss" },
  { text: "If life were predictable it would cease to be life and be without flavour.", author: "Eleanor Roosevelt" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.", author: "James Cameron" },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou" },
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Money and success don't change people; they merely amplify what is already there.", author: "Will Smith" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Not how long, but how well you have lived is the main thing.", author: "Seneca" },
  { text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "In this life we cannot do great things. We can only do small things with great love.", author: "Mother Teresa" },
  { text: "Only a life lived for others is a life worthwhile.", author: "Albert Einstein" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Get busy living or get busy dying.", author: "Stephen King" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "A ship in harbour is safe, but that is not what ships are built for.", author: "John A. Shedd" },
  { text: "Every strike brings me closer to the next home run.", author: "Babe Ruth" },
  { text: "Definiteness of purpose is the starting point of all achievement.", author: "W. Clement Stone" },
  { text: "We must balance conspicuous consumption with conscious capitalism.", author: "Kevin Kruse" },
  { text: "Life is short, and it's up to you to make it sweet.", author: "Sarah Louise Delany" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "He who is not courageous enough to take risks will accomplish nothing in life.", author: "Muhammad Ali" },
  { text: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "If you cannot do great things, do small things in a great way.", author: "Napoleon Hill" },
  { text: "When something is important enough, you do it even if the odds are not in your favour.", author: "Elon Musk" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { text: "We become what we think about most of the time, and that's the strangest secret.", author: "Earl Nightingale" },
  { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown" },
  { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
  { text: "If you want to conquer fear, don't sit home and think about it. Go out and get busy.", author: "Dale Carnegie" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "We must accept finite disappointment, but never lose infinite hope.", author: "Martin Luther King Jr." },
  { text: "Do not follow where the path may lead. Go instead where there is no path and leave a trail.", author: "Harold R. McAlindon" },
  { text: "There is no traffic jam along the extra mile.", author: "Roger Staubach" },
  { text: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Aim for the moon. If you miss, you may hit a star.", author: "W. Clement Stone" },
  { text: "It's not what you look at that matters, it's what you see.", author: "Henry David Thoreau" },
  { text: "Excellence is not a skill. It is an attitude.", author: "Ralph Marston" },
  { text: "A winner is a dreamer who never gives up.", author: "Nelson Mandela" },
  { text: "Work like there is someone working twenty four hours a day to take it all away from you.", author: "Mark Cuban" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "Spread love everywhere you go.", author: "Mother Teresa" },
  { text: "When the going gets tough, the tough get going.", author: "Joe Kennedy" },
  { text: "Eighty percent of success is showing up.", author: "Woody Allen" },
  { text: "Your talent is God's gift to you. What you do with it is your gift back to God.", author: "Leo Buscaglia" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
  { text: "You can never cross the ocean until you have the courage to lose sight of the shore.", author: "Christopher Columbus" },
  { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
  { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "The man who has confidence in himself gains the confidence of others.", author: "Hasidic Proverb" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "The secret to success is to know something nobody else knows.", author: "Aristotle Onassis" },
  { text: "I would rather die of passion than of boredom.", author: "Vincent Van Gogh" },
  { text: "A truly rich man is one whose children run into his arms when his hands are empty.", author: "Unknown" },
  { text: "It is not what you do for your children, but what you have taught them to do for themselves.", author: "Ann Landers" },
  { text: "Education costs money. But then so does ignorance.", author: "Sir Claus Moser" },
  { text: "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.", author: "Martin Luther King Jr." },
  { text: "Winning isn't everything, but wanting to win is.", author: "Vince Lombardi" },
  { text: "You become what you believe.", author: "Oprah Winfrey" },
  { text: "I would rather have a mind opened by wonder than one closed by belief.", author: "Gerry Spence" },
  { text: "A dream becomes a goal when action is taken toward its achievement.", author: "Bo Bennett" },
  { text: "Once you choose hope, anything is possible.", author: "Christopher Reeve" },
  { text: "The quality of a person's life is in direct proportion to their commitment to excellence, regardless of their chosen field of endeavour.", author: "Vince Lombardi" },
  { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "Real difficulties can be overcome; it is only the imaginary ones that are unconquerable.", author: "Theodore N. Vail" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Muriel Strode" },
  { text: "If I have seen further, it is by standing on the shoulders of giants.", author: "Isaac Newton" },
  { text: "Begin anywhere.", author: "John Cage" },
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs" },
]

function getDailyQuote() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return QUOTES[dayOfYear % QUOTES.length]
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
  const quote = getDailyQuote()

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
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#4B5563', cursor: 'not-allowed' }}>
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
