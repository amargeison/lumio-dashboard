'use client'

import { useState, useEffect } from 'react'

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

export default function PersonalBanner() {
  const [data, setData] = useState<BriefingData | null>(null)
  const [bgGradient] = useState(() => BG_GRADIENTS[new Date().getDay()])

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
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">
              {data.greeting} 👋
            </h1>
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

          {/* RIGHT: weather */}
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <span className="text-3xl">{weatherIcon}</span>
              <div>
                <div className="text-xl font-black text-white">{data.weather.temp}</div>
                <div className="text-xs text-purple-300">{data.weather.condition}</div>
                <div className="text-xs text-purple-300/60">{data.weather.location}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
