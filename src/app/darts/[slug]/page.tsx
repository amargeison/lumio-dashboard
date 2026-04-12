'use client';
// TODO: Scope localStorage keys by user ID when auth is implemented// e.g. `sport_schedule_checked` → `sport_${userId}_schedule_checked`

import { use, useState, useEffect, useRef } from 'react';
import { Target, Trophy, TrendingUp, Calendar, Users, DollarSign, Plane, Settings, Star, Award, BarChart2, Clock, MapPin, Phone, Mail, ChevronRight, FileText, Video, Brain, Zap, AlertCircle, CheckCircle, Package, Mic, Globe, Shield, Activity, Hash, ClipboardList, Volume2 } from 'lucide-react';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'
import { generateSmartBriefing, buildRoundupSummary, buildScheduleItems, getUserTimezone } from '@/lib/sports/smartBriefing'
import SportsSettings from '@/components/sports/SportsSettings'
import { getDailyQuote, DARTS_QUOTES } from '@/lib/sports-quotes'

// ─── PROFILE SYNC HOOKS — re-read on 'lumio-profile-updated' events ──────────
function useDartsProfileName(): string | null {
  const [name, setName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_darts_name')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_darts_name'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useDartsProfilePhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('lumio_darts_profile_photo')
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setPhoto(localStorage.getItem('lumio_darts_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return photo
}
function useDartsBrandName(): string {
  const [name, setName] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_darts_brand_name') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setName(localStorage.getItem('lumio_darts_brand_name') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return name
}
function useDartsBrandLogo(): string {
  const [logo, setLogo] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lumio_darts_brand_logo') || ''
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setLogo(localStorage.getItem('lumio_darts_brand_logo') || '')
    window.addEventListener('lumio-profile-updated', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('lumio-profile-updated', sync); window.removeEventListener('storage', sync) }
  }, [])
  return logo
}

// ─── CLEAN RESPONSE ──────────────────────────────────────────────────────────
const cleanResponse = (text: string) => text
  .replace(/#{1,6}\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
  .replace(/^\s*[-•·–—]\s*/gm, '').replace(/^\s*[\u2022\u2023\u25E6\u2043\u2219]\s*/gm, '')
  .replace(/^\s*\d+\.\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface DartsPlayer {
  name: string;
  nickname: string;
  nationality: string;
  nationalityFlag: string;
  pdcRank: number;
  orderOfMeritRank: number;
  threeDartAverage: number;
  checkoutPercent: number;
  oneEightiesPerLeg: number;
  firstNineAverage: number;
  highestCheckout: number;
  tourCard: string;
  plan: string;
  manager: string;
  coach: string;
  sponsor1: string;
  sponsor2: string;
  walkOnMusic: string;
  dartSetup: { barrelWeight: string; flightShape: string; shaftLength: string; boardSetup: string };
  careerEarnings: number;
  thisYearEarnings: number;
  careerTitles: number;
  majorTitles: number;
}

// ─── FEATURE GATING ───────────────────────────────────────────────────────────
// Pro plan unlocks advanced views. Essentials users see a locked CTA.
const PRO_FEATURES = [
  'tour-card-monitor', 'pressure-analysis', 'dartboard-heatmap',
  'merit-forecaster', 'walk-on-music', 'dartconnect', 'pdclive',
  'performance-rating', 'prize-forecaster', 'nine-dart-tracker',
];
const isPro = (plan: string) =>
  plan.toLowerCase().includes('premier')
  || plan.toLowerCase().includes('pro')
  || plan.toLowerCase().includes('279');

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',          icon: '🏠', group: 'OVERVIEW'     },
  { id: 'morning',         label: 'Morning Briefing',   icon: '🌅', group: 'OVERVIEW'     },
  { id: 'performance',     label: 'Performance',        icon: '📈', group: 'PERFORMANCE'  },
  { id: 'dartcam',         label: 'Dart Cam & Analytics', icon: '🎯', group: 'PERFORMANCE'  },
  { id: 'practice',        label: 'Practice',           icon: '📋', group: 'PERFORMANCE'  },
  { id: 'schedule',        label: 'Tournament Sched',   icon: '🗓️', group: 'MATCH'        },
  { id: 'live-scores',     label: 'Live Scores',        icon: '🔴', group: 'MATCH'        },
  { id: 'draw-bracket',    label: 'Draw & Bracket',     icon: '🏆', group: 'MATCH'        },
  { id: 'match-prep',      label: 'Match Prep',         icon: '⚡', group: 'MATCH'        },
  { id: 'opponentintel',   label: 'Opponent Intel',     icon: '🔍', group: 'MATCH'        },
  { id: 'teamhub',         label: 'Team Hub',           icon: '👥', group: 'TEAM'         },
  { id: 'physio-recovery', label: 'Physio',             icon: '⚕️', group: 'TEAM'         },
  { id: 'mental',          label: 'Mental Performance', icon: '🧠', group: 'TEAM'         },
  { id: 'walk-on-music',   label: 'Walk-on Music',      icon: '🎤', group: 'TEAM'         },
  { id: 'nutrition-log',   label: 'Nutrition',          icon: '🥗', group: 'TEAM'         },
  { id: 'team-comms',     label: 'Team Comms',         icon: '💬', group: 'TEAM'         },
  { id: 'fan-engagement', label: 'Fan Engagement',     icon: '💜', group: 'TEAM'         },
  { id: 'sponsorship',     label: 'Sponsorship',        icon: '🤝', group: 'COMMERCIAL'   },
  { id: 'exhibitions',     label: 'Exhibitions',        icon: '🎪', group: 'COMMERCIAL'   },
  { id: 'media',           label: 'Media & Content',    icon: '📱', group: 'COMMERCIAL'   },
  { id: 'financial',       label: 'Financial',          icon: '💰', group: 'COMMERCIAL'   },
  { id: 'agent',           label: 'Agent Pipeline',     icon: '📬', group: 'COMMERCIAL'   },
  { id: 'travel',          label: 'Travel',             icon: '✈️', group: 'TOOLS'        },
  { id: 'tourcard',        label: 'Tour Card',          icon: '🏛️', group: 'TOOLS'        },
  { id: 'equipment',       label: 'Equipment',          icon: '📦', group: 'TOOLS'        },
  { id: 'career',          label: 'Career Planning',    icon: '🚀', group: 'TOOLS'        },
  { id: 'datahub',         label: 'Data Hub',           icon: '📡', group: 'TOOLS'        },
  { id: 'settings',        label: 'Settings',           icon: '⚙️', group: 'TOOLS'        },
];

// ─── DEMO PLAYER ──────────────────────────────────────────────────────────────
const DEMO_PLAYER: DartsPlayer = {
  name: 'Jake Morrison',
  nickname: 'The Hammer',
  nationality: 'English',
  nationalityFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  pdcRank: 19,
  orderOfMeritRank: 19,
  threeDartAverage: 97.8,
  checkoutPercent: 42.3,
  oneEightiesPerLeg: 0.84,
  firstNineAverage: 101.4,
  highestCheckout: 164,
  tourCard: 'Secured — top 32',
  plan: 'Premier League · £279/mo',
  manager: 'Dave Harris (DH Sports Management)',
  coach: 'Phil "The Power" Coaching Academy',
  sponsor1: 'Red Dragon Darts',
  sponsor2: 'Ladbrokes',
  walkOnMusic: 'Enter Sandman — Metallica',
  dartSetup: { barrelWeight: '24g', flightShape: 'Standard', shaftLength: 'Medium', boardSetup: 'Winmau Blade 6 — 9ft oche' },
  careerEarnings: 687420,
  thisYearEarnings: 124800,
  careerTitles: 8,
  majorTitles: 1,
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'red' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    red:    'from-red-600/20 to-red-900/10 border-red-600/20',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
    teal:   'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    orange: 'from-orange-600/20 to-orange-900/10 border-orange-600/20',
    blue:   'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    green:  'from-green-600/20 to-green-900/10 border-green-600/20',
    yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-600/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.red} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white" style={{  }}>{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    'Major TV': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Premier League': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
    'European Tour': 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
    'Pro Tour': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'World Series': 'bg-orange-600/20 text-orange-400 border border-orange-600/30',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || 'bg-gray-700 text-gray-400'}`}>{level}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Playing': 'bg-green-600/20 text-green-400 border border-green-600/30',
    'Confirmed': 'bg-teal-600/20 text-teal-400 border border-teal-600/30',
    'Enter Now': 'bg-red-600/20 text-red-400 border border-red-600/30',
    'Not open': 'bg-gray-600/20 text-gray-400 border border-gray-600/30',
    'Invited': 'bg-purple-600/20 text-purple-400 border border-purple-600/30',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-700 text-gray-400'}`}>{status}</span>;
};

const QuickActionsBar = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
  const actions = [
    { label: 'Log Practice', icon: <ClipboardList className="w-3.5 h-3.5" />, target: 'practicelog' },
    { label: 'Match Report', icon: <FileText className="w-3.5 h-3.5" />, target: 'matchreports' },
    { label: 'Equipment Check', icon: <Package className="w-3.5 h-3.5" />, target: 'equipment' },
    { label: 'Sponsor Post', icon: <Mic className="w-3.5 h-3.5" />, target: 'media' },
    { label: 'Exhibition Book', icon: <Star className="w-3.5 h-3.5" />, target: 'exhibitions' },
    { label: 'Order of Merit', icon: <BarChart2 className="w-3.5 h-3.5" />, target: 'orderofmerit' },
    { label: 'Checkout Trainer', icon: <Target className="w-3.5 h-3.5" />, target: 'checkout' },
    { label: 'Travel Info', icon: <Plane className="w-3.5 h-3.5" />, target: 'travel' },
  ];
  return (
    <div className="flex items-center gap-3 border-b border-t border-gray-800/50 bg-[#0a0c14]">
      <span className="text-xs text-gray-500 font-medium px-4 whitespace-nowrap">Quick Actions</span>
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {actions.map((a, i) => (
          <button key={i} onClick={() => onNavigate(a.target)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 bg-red-700 text-gray-50">
            {a.icon}{a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── AI DEPARTMENT INTELLIGENCE SECTION ──────────────────────────────────────
interface DartsAISectionProps {
  context: string
  player: DartsPlayer
  session: SportsDemoSession
}

function DartsAISection({ context, player, session }: DartsAISectionProps) {
  const [summary, setSummary]     = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [generated, setGenerated] = useState(false)
  const hasGenerated = useRef(false)

  const HIGHLIGHTS: Record<string, string[]> = {
    dashboard:      ['Match tonight — European Championship R1. Win = £110,000 + ranking points', 'Red Dragon sponsor post due before tonight — agent chasing', '3-dart average up 0.8 this week — form trending well', 'Dortmund venue: 14°C overcast — travel confirmed', 'Practice session at 10:00 — focus on D16 checkout'],
    orderofmerit:   ['Currently #19 PDC Order of Merit — up 2 this week', '£12,400 drops off after Players Ch. 8 (Apr 2023)', 'Win tonight: hold at #19. Loss: risk dropping to #22', 'Top-16 OOM qualifies for World Matchplay — currently inside', 'Madrid deadline: must win at least one match to stay safe'],
    averages:       ['3-dart avg 97.8 — top-10 PDC level', 'Checkout % 38.2% — above tour average (35%)', '180s per match: 4.2 — strong', 'First 9-dart attempt this season: Prague Open leg 3', 'Floor average (97.3) above TV average (99.1) — reverse the trend'],
    checkout:       ['D16 success rate: 62% — below your D20 (78%)', 'Checkout on D4 only 44% — needs focused practice', 'High checkout (141+): 8 this season, 3 this month', 'Opponent tonight: G. Price averages 41.2% checkout', 'Recommend: start on D20/D18 more often — data supports it'],
    opponentintel:  ['G. Price: averages 101.2 on TV — 4pts above you', 'Price weakness: slow start legs — lead early', 'Price checkout: 39.8% — similar to yours', 'H2H: 3–4 in Price\'s favour. Last 3: 2–1 to you', 'Price under pressure: tends to miss doubles in deciding legs'],
    practicelog:    ['14 sessions this week — highest in 3 weeks', 'D16 practice sessions flagged by coach: 3 booked', 'Average practice 3DA: 99.4 — above match average', '10:00 session today — focus D16, checkout routes', 'Mental coach review Thursday — pressure darts focus'],
    sponsorship:    ['Red Dragon: barrel content shoot today 16:00', 'Paddy Power ambassador inquiry — agent reviewing', '2 social posts outstanding for Betway', 'Winmau board deal up for renewal — Jun 2026', 'Total sponsor income YTD: £84,200'],
    travel:         ['Tonight: Dortmund Westfalenhallen — 14°C overcast', 'Next: Prague Open — flights needed Mon 14 Apr', 'Bahrain Masters: visa application submitted', 'Madrid Premier League: hotel confirmed 3 May', 'Travel budget remaining: £8,400 of £24k season allocation'],
    financial:      ['Prize money YTD: £187,420', 'European Ch. R1 prize: £10,000 (W) / £3,000 (L)', 'Agent commission: 15% of gross prize money', 'Tax instalment due 31 Jul — accountant briefed', 'Camp costs this month: £4,200 — on budget'],
    mental:         ['Pre-match routine: 45-min focused warm-up confirmed', 'Pressure darts session Thursday with Marcos', 'G. Price: known to be disruptive pre-match — stay focused', 'Last 3 deciding legs vs top-16: won 2 of 3 — improving', 'Breathing protocol review requested by coach'],
    default:        ['Match tonight — European Championship R1', 'Red Dragon content shoot today 16:00', 'D16 checkout rate below target — practice today', 'Prague Open flights needed this week', 'OOM: #19 PDC — hold position tonight'],
  }

  const highlights = HIGHLIGHTS[context] ?? HIGHLIGHTS.default

  const generateSummary = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are the AI performance analyst for ${session.userName || player.name}, PDC #${player.pdcRank} professional darts player nicknamed "${player.nickname}".

Generate a concise AI department summary for the "${context}" section.

Player context:
- PDC Ranking: #${player.pdcRank}
- 3-dart average: ${player.threeDartAverage}
- Tonight's match: European Championship R1 vs G. Price (#7) in Dortmund
- Checkout %: ${player.checkoutPercent}%

Write 4-5 bullet points covering the most important insight for ${context}.
Start each line with a relevant emoji. Be specific. Max 180 words. No headers. Plain text only. No markdown. No bullet points.`
          }]
        })
      })
      const data = await res.json()
      const raw = data.content?.map((b: {type:string;text?:string}) =>
        b.type === 'text' ? b.text : '').join('') || ''
      setSummary(cleanResponse(raw))
      setGenerated(true)
    } catch { setSummary('Unable to generate summary.') }
    setLoading(false)
  }

  useEffect(() => {
    if (hasGenerated.current || summary || loading) return
    hasGenerated.current = true
    generateSummary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderSummary = (text: string) =>
    text.split('\n').filter(l => l.trim()).map((line, i) => (
      <div key={i} className="flex gap-2 text-xs text-gray-300 py-1 border-b border-gray-800/40 last:border-0">
        <span>{line}</span>
      </div>
    ))

  return (
    <div className="mt-8 pt-6 border-t border-gray-800/60">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">🤖 AI Department Intelligence</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>✨</span>
              <span className="text-sm font-bold text-white">AI Summary</span>
            </div>
            <div className="flex items-center gap-2">
              {generated && <span className="text-[10px] text-gray-600">Generated just now</span>}
              <button onClick={generateSummary} disabled={loading} className="text-gray-600 hover:text-gray-400 text-sm">{loading ? '⟳' : '↺'}</button>
            </div>
          </div>
          {!summary && !loading && (
            <button onClick={generateSummary}
              className="w-full py-3 rounded-xl text-xs font-semibold border border-gray-800 text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all">
              Generate AI summary for this section →
            </button>
          )}
          {loading && <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-3 bg-gray-800 rounded animate-pulse" style={{width:`${70+i*7}%`}} />)}</div>}
          {summary && !loading && <div>{renderSummary(summary)}</div>}
        </div>
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span>⚡</span><span className="text-sm font-bold text-white">AI Key Highlights</span></div>
            <span className="text-[10px] text-red-400 cursor-pointer">Performance</span>
          </div>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-3 py-1.5 border-b border-gray-800/40 last:border-0">
                <span className="text-xs text-red-400 font-bold flex-shrink-0 w-4">{i+1}</span>
                <span className="text-xs text-gray-300">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SEND MESSAGE ────────────────────────────────────────────────────────────
function DartsSendMessage({ onClose, player, session }: { onClose: () => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [step, setStep] = useState<'who'|'how'|'message'|'preview'|'sent'>('who')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [customPerson, setCustomPerson] = useState('')
  const [channels, setChannels] = useState<string[]>(['email'])
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const TEAM = [
    { name: 'Dave Askew', role: 'Manager', icon: '💼' },
    { name: 'Steve Morris', role: 'Coach', icon: '📋' },
    { name: 'Dr Paul Reid', role: 'Physiotherapist', icon: '⚕️' },
    { name: 'James Wright', role: 'Agent', icon: '💼' },
    { name: 'Red Dragon', role: 'Equipment Sponsor', icon: '🐉' },
    { name: 'Marcos Silva', role: 'Sports Psychologist', icon: '🧠' },
  ]
  const CHANNELS = [
    { id: 'sms', label: 'Text / SMS', icon: '💬' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'internal', label: 'Internal Message', icon: '🔔' },
  ]
  const togglePerson = (name: string) => setSelectedPeople(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  const toggleChannel = (id: string) => setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  const allRecipients = [...selectedPeople, ...(customPerson.trim() ? [customPerson.trim()] : [])]
  const isPlayerRole = !session.role || session.role === 'player'
  const displayName = isPlayerRole ? (session.userName || player.name) : player.name
  const handleSend = async (urgent: boolean) => {
    setIsUrgent(urgent); setLoading(true)
    try {
      const usedChannels = urgent ? CHANNELS.map(c => c.label) : channels.map(id => CHANNELS.find(c => c.id === id)?.label || id)
      const res = await fetch('/api/ai/darts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user',
          content: `Draft a professional but direct message on behalf of ${displayName}, a professional darts player (PDC #${player.pdcRank}). Recipients: ${allRecipients.join(', ')}. Channel: ${usedChannels.join(', ')}. Message: ${messageText}. ${urgent ? 'This is marked URGENT — prepend with [URGENT] and make the tone immediate.' : ''} Return only the final message text, no preamble. Respond in plain prose paragraphs only. Do not use bullet points, dashes, dots, numbered lists, emoji at the start of lines, bold, headers, or any markdown formatting whatsoever.`
        }] }) })
      const data = await res.json()
      setAiDraft(cleanResponse(data.content?.[0]?.text || messageText))
    } catch { setAiDraft(urgent ? `[URGENT] ${messageText}` : messageText) }
    setLoading(false); setStep('preview')
  }
  return (
    <>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3"><span className="text-2xl">📨</span><div><div className="text-base font-bold text-white">Send Message</div><div className="text-xs" style={{ color: '#6B7280' }}>{step === 'who' ? 'Step 1 — Who are you messaging?' : step === 'how' ? 'Step 2 — How do you want to send it?' : step === 'message' ? 'Step 3 — Write your message' : step === 'preview' ? 'Preview — Confirm & send' : 'Sent!'}</div></div></div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">✕</button>
      </div>
      <div className="flex items-center gap-2 px-6 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        {['Who','How','Message','Preview'].map((s, i) => {
          const stepIdx = ['who','how','message','preview'].indexOf(step)
          return (<span key={s} className="contents"><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: i < stepIdx ? '#22C55E' : i === stepIdx ? '#D97706' : 'rgba(255,255,255,0.05)', color: i <= stepIdx ? '#fff' : '#4B5563' }}>{i < stepIdx ? '✓' : i + 1}</div><span className="text-xs font-semibold" style={{ color: i === stepIdx ? '#D97706' : i < stepIdx ? '#22C55E' : '#4B5563' }}>{s}</span></div>{i < 3 && <div className="flex-1 h-px" style={{ backgroundColor: i < stepIdx ? '#22C55E' : '#1F2937' }} />}</span>)
        })}
      </div>
      <div className="p-6">
        {step === 'who' && (<div className="space-y-4"><div className="grid grid-cols-2 gap-2">{TEAM.map(m => (<button key={m.name} onClick={() => togglePerson(m.name)} className="flex items-center gap-3 rounded-xl p-3 text-left transition-all" style={{ backgroundColor: selectedPeople.includes(m.name) ? 'rgba(217,119,6,0.15)' : '#111318', border: selectedPeople.includes(m.name) ? '1px solid rgba(217,119,6,0.5)' : '1px solid #1F2937' }}><span className="text-lg">{m.icon}</span><div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate">{m.name}</div><div className="text-[10px]" style={{ color: '#6B7280' }}>{m.role}</div></div>{selectedPeople.includes(m.name) && <span style={{ color: '#D97706' }}>✓</span>}</button>))}</div><div><input value={customPerson} onChange={e => setCustomPerson(e.target.value)} placeholder="Someone else — type name..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} /></div>{allRecipients.length > 0 && <div className="flex flex-wrap gap-1.5">{allRecipients.map(n => <span key={n} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(217,119,6,0.2)', color: '#F59E0B' }}>{n}</span>)}</div>}<button onClick={() => setStep('how')} disabled={allRecipients.length === 0} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ backgroundColor: allRecipients.length > 0 ? '#D97706' : '#374151' }}>Next — choose channels →</button></div>)}
        {step === 'how' && (<div className="space-y-4"><div className="grid grid-cols-2 gap-3">{CHANNELS.map(ch => (<button key={ch.id} onClick={() => toggleChannel(ch.id)} className="flex items-center gap-3 rounded-xl p-4 text-left transition-all" style={{ backgroundColor: channels.includes(ch.id) ? 'rgba(217,119,6,0.15)' : '#111318', border: channels.includes(ch.id) ? '1px solid rgba(217,119,6,0.5)' : '1px solid #1F2937' }}><span className="text-2xl">{ch.icon}</span><span className="text-sm font-semibold text-white">{ch.label}</span>{channels.includes(ch.id) && <span className="ml-auto" style={{ color: '#D97706' }}>✓</span>}</button>))}</div><div className="flex gap-3"><button onClick={() => setStep('who')} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button><button onClick={() => setStep('message')} disabled={channels.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: channels.length > 0 ? '#D97706' : '#374151' }}>Next — write message →</button></div></div>)}
        {step === 'message' && (<div className="space-y-4"><div className="flex flex-wrap gap-1.5 mb-2"><span className="text-xs" style={{ color: '#6B7280' }}>To:</span>{allRecipients.map(n => <span key={n} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(217,119,6,0.15)', color: '#F59E0B' }}>{n}</span>)}<span className="text-xs" style={{ color: '#6B7280' }}>via</span>{channels.map(id => <span key={id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{CHANNELS.find(c => c.id === id)?.label}</span>)}</div><textarea value={messageText} onChange={e => setMessageText(e.target.value)} rows={5} placeholder="Type your message..." className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none" style={{ backgroundColor: '#111318', border: '1px solid #374151' }} autoFocus /><div className="flex gap-3"><button onClick={() => setStep('how')} className="py-2.5 px-4 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Back</button><button onClick={() => handleSend(false)} disabled={!messageText.trim() || loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: messageText.trim() ? '#D97706' : '#374151' }}>{loading ? '⏳ Drafting...' : 'Send →'}</button><button onClick={() => handleSend(true)} disabled={!messageText.trim() || loading} className="py-2.5 px-4 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: messageText.trim() ? '#EF4444' : '#374151' }}>🚨 URGENT</button></div></div>)}
        {step === 'preview' && (<div className="space-y-4">{isUrgent && <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}><span>🚨</span><span className="text-xs font-bold" style={{ color: '#EF4444' }}>URGENT — sending to ALL channels simultaneously</span></div>}<div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>{aiDraft}</div><div className="flex gap-3"><button onClick={() => { setStep('message'); setAiDraft('') }} className="flex-1 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>← Edit</button><button onClick={() => setStep('sent')} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: isUrgent ? '#EF4444' : '#D97706' }}>✓ Confirm Send</button></div></div>)}
        {step === 'sent' && (<div className="text-center py-8"><div className="text-5xl mb-3">✅</div><div className="text-base font-bold text-white mb-2">Message sent!</div><div className="text-sm mb-4" style={{ color: '#6B7280' }}>Sent via {isUrgent ? 'all channels' : channels.map(id => CHANNELS.find(c => c.id === id)?.label).join(', ')} to {allRecipients.join(', ')}</div><button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#D97706' }}>Done</button></div>)}
      </div>
    </>
  )
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView({ player, session, onOpenModal }: { player: DartsPlayer; session: SportsDemoSession; onOpenModal: (id: string) => void }) {
  const [dashTab, setDashTab] = useState<'gettingstarted'|'today'|'quickwins'|'dailytasks'|'insights'|'dontmiss'|'team'>(() => {
    try { const seen = typeof window !== 'undefined' ? localStorage.getItem('darts_getting_started_seen') : null; return seen ? 'today' : 'gettingstarted' } catch { return 'gettingstarted' }
  })
  const [tourStep, setTourStep] = useState(0)
  const [scheduleChecked, setScheduleChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('darts_schedule_checked') : null) || '{}') } catch { return {} }
  })
  const toggleScheduleItem = (id: string) => {
    setScheduleChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('darts_schedule_checked', JSON.stringify(next))
      return next
    })
  }
  const [scheduleCancelled, setScheduleCancelled] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('darts_schedule_cancelled') : null) || '{}') } catch { return {} }
  })
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const cancelScheduleItem = (id: string, label: string) => {
    const person = label.includes('with ') ? label.split('with ')[1] : label.includes('—') ? label.split('—')[0].trim() : label
    navigator.clipboard.writeText(`Hi ${person} — I need to cancel my ${label.toLowerCase()} scheduled for today. Apologies for short notice. — ${firstName}`)
    setScheduleCancelled(prev => { const next = { ...prev, [id]: true }; localStorage.setItem('darts_schedule_cancelled', JSON.stringify(next)); return next })
    setCancelConfirm(null)
  }
  const [tasksChecked, setTasksChecked] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('darts_tasks_checked') : null) || '{}') } catch { return {} }
  })
  const toggleTaskItem = (id: string) => {
    setTasksChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('darts_tasks_checked', JSON.stringify(next))
      return next
    })
  }
  const [taskFilter, setTaskFilter] = useState<'all'|'critical'|'high'|'medium'|'low'>('all')
  const [teamSubTab, setTeamSubTab] = useState<'today'|'orgchart'|'info'|'tour'>('today')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [dartsSummary, setDartsSummary] = useState<string | null>(null)
  const [dartsSummaryLoading, setDartsSummaryLoading] = useState(false)

  // TTS with async voice loading
  const getVoicesReady = (): Promise<SpeechSynthesisVoice[]> => new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve([]); return }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { resolve(voices); return }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
  })
  const voiceMap: Record<string, { pitch: number; rate: number }> = {
    'Sarah': { pitch: 1.05, rate: 0.92 },
    'Charlotte': { pitch: 1.1, rate: 0.9 },
    'George': { pitch: 0.9, rate: 0.95 },
  }
  const speakBriefing = async () => {
    if (typeof window === 'undefined') return
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return }
    const voices = await getVoicesReady()
    const scheduleRaw = [
      { id:'s1', time:'09:00', label:'AI Morning Briefing',        highlight:false },
      { id:'s2', time:'10:00', label:'Practice — D16 checkout',    highlight:false },
      { id:'s3', time:'12:00', label:'Red Dragon content shoot',   highlight:false },
      { id:'s4', time:'14:00', label:'Physio — shoulder & elbow',  highlight:false },
      { id:'s5', time:'16:30', label:'Pre-match warm-up routine',  highlight:false },
      { id:'s6', time:'20:00', label:'Match vs G. Price — R1',     highlight:true },
      { id:'s7', time:'22:30', label:'Post-match media',           highlight:false },
    ]
    const greetingPrefix = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, ${firstName}. `
    const text = dartsSummary ? greetingPrefix + dartsSummary : generateSmartBriefing({
      now: new Date(),
      playerName: displayPlayerName,
      schedule: buildScheduleItems(scheduleRaw, scheduleChecked, {}),
      match: { opponent: 'G. Price', time: '20:00', result: null },
      roundupSummary: buildRoundupSummary(ROUNDUP_CHANNELS),
      sport: 'darts',
      timezone: getUserTimezone(),
      extra: `You're PDC number ${player.pdcRank} with a ${player.checkoutPercent}% checkout rate.`,
    })
    const u = new SpeechSynthesisUtterance(text)
    const savedVoiceName = localStorage.getItem('lumio_darts_voice_name') || 'Sarah'
    const browserVoiceMap: Record<string, string[]> = {
      'Sarah': ['Google UK English Female', 'Microsoft Libby', 'Karen', 'Veena'],
      'Charlotte': ['Microsoft Hazel', 'Fiona', 'Samantha', 'Google UK English Female'],
      'George': ['Google UK English Male', 'Microsoft George', 'Daniel', 'Alex'],
    }
    const preferred = browserVoiceMap[savedVoiceName] || browserVoiceMap['Sarah']
    const match = voices.find(v => preferred.some(p => v.name.includes(p)))
      || voices.find(v => savedVoiceName === 'George'
        ? v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
        : v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))
    if (match) u.voice = match
    u.pitch = savedVoiceName === 'George' ? 0.75 : savedVoiceName === 'Charlotte' ? 1.25 : 1.1
    u.rate = savedVoiceName === 'George' ? 0.92 : 0.95
    u.onstart = () => setIsSpeaking(true); u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }
  useEffect(() => { return () => { if (typeof window !== 'undefined') window.speechSynthesis.cancel() } }, [])

  // Auto-generate AI summary
  useEffect(() => {
    if (dartsSummary || dartsSummaryLoading) return
    setDartsSummaryLoading(true)
    fetch('/api/ai/darts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `You are the personal performance coach for ${displayPlayerName}, professional darts player ranked #${player.pdcRank} on the PDC tour${displayPlayerNickname ? `, known as ${displayPlayerNickname}` : ''}. Generate his morning briefing for today.\n\nStructure the briefing exactly like this:\n- Opening: one sentence acknowledging his current form and ranking momentum (#${player.pdcRank}, up 2 this week)\n- Match focus: tonight's PDC European Championship R1 vs Gerwyn Price (#7) at Westfalenhallen Dortmund, 20:00. Walk-on at 19:30. Win = £110,000. Mention their H2H (Price leads 3-4) and the key tactical note (Price's checkout % drops to 39.8% when behind — Jake's is ${player.checkoutPercent}%)\n- One specific tactical preparation tip for tonight\n- One mental performance cue — what to focus on in the first 3 legs\n- Closing: one punchy motivational line under 12 words\n\nTone: direct, coaching, confident. Not corporate. Sound like a trusted coach who knows him well. 4-5 sentences total. No intro or labels — just the briefing text. It will be read aloud by text-to-speech so it must sound natural when spoken.` }] }) })
      .then(r => r.json()).then(d => { const t = d.content?.[0]?.text; setDartsSummary(t ? cleanResponse(t) : null) }).catch(() => {}).finally(() => setDartsSummaryLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const liveProfileName = useDartsProfileName()
  const liveProfilePhoto = useDartsProfilePhoto()
  const isPlayerRole = !session.role || session.role === 'player'
  const displayPlayerName = isPlayerRole
    ? (liveProfileName || session.userName || player.name)
    : player.name
  const displayPlayerNickname = isPlayerRole
    ? ((typeof window !== 'undefined' ? localStorage.getItem('lumio_darts_nickname') : null) || '')
    : `"${player.nickname}"`
  const displayPlayerPhoto = isPlayerRole ? (liveProfilePhoto?.trim() || session.photoDataUrl?.trim() || '/jake_morrison.jpg') : null
  const firstName = displayPlayerName.split(' ')[0] || 'Jake'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [photoFit, setPhotoFit] = useState<'cover'|'contain'>(() => {
    try { return (typeof window !== 'undefined' && localStorage.getItem('lumio_darts_photo_fit') as 'cover'|'contain') || 'cover' } catch { return 'cover' }
  })
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [repliedTo, setRepliedTo] = useState<Set<string>>(new Set())
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set())
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('darts_dismissed_alerts') : null; return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => { const next = new Set(prev); next.add(id); try { localStorage.setItem('darts_dismissed_alerts', JSON.stringify([...next])) } catch {} return next })
  }
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [roundupOrder, setRoundupOrder] = useState<string[]>(() => {
    try { const saved = typeof window !== 'undefined' ? localStorage.getItem('darts_roundup_order') : null; return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  const ROUNDUP_CHANNELS = [
    { label: 'Agent Messages',     icon: '📞', count: 2, color: '#0D9488', urgent: false, messages: [
      { from: 'James Wright', text: 'Paddy Power want an answer by Friday — shall I push for better terms?', time: '08:12' },
      { from: 'James Wright', text: 'Red Dragon renewal call confirmed Thursday 14:00', time: '07:45' },
    ]},
    { label: 'Tournament Desk',    icon: '🏆', count: 3, color: '#D97706', urgent: true, messages: [
      { from: 'PDC Entry Desk', text: 'Prague Open entry deadline: Apr 19. Please confirm.', time: '09:00' },
      { from: 'PDC Entry Desk', text: 'German Masters entry opens May 1.', time: '08:30' },
      { from: 'PDC Scheduling', text: 'European Ch. R1 board assignment: Board 4, 20:00', time: '07:00' },
    ]},
    { label: 'Sponsor Messages',   icon: '🤝', count: 2, color: '#7C3AED', urgent: false, messages: [
      { from: 'Betway', text: '2 social posts outstanding — please submit by Thursday', time: '10:15' },
      { from: 'Ladbrokes', text: 'Quarter promo asset approved. Going live Friday.', time: '09:30' },
    ]},
    { label: 'Red Dragon',         icon: '🐉', count: 1, color: '#EA580C', urgent: true, messages: [
      { from: 'Red Dragon Team', text: 'Content shoot today 12:00 — barrel review video. Bring backup set.', time: '08:00' },
    ]},
    { label: 'Coach / Manager',    icon: '🎯', count: 2, color: '#EA580C', urgent: false, messages: [
      { from: 'Steve Morris', text: 'Pre-match brief at 16:30. Focus: D16 under pressure.', time: '07:30' },
      { from: 'Dave Askew', text: 'Travel to Dortmund confirmed. Car at 17:00.', time: '06:50' },
    ]},
    { label: 'Prize Money',        icon: '💰', count: 1, color: '#16A34A', urgent: false, messages: [
      { from: 'PDC Finance', text: 'Players Ch. 8 prize money (£8,000) processed. ETA 5 working days.', time: '09:45' },
    ]},
    { label: 'Travel & Hotels',    icon: '✈️', count: 2, color: '#2563EB', urgent: false, messages: [
      { from: 'Travel Desk', text: 'Prague flights: BA Mon 14 Apr from £189. Book soon — prices rising.', time: '10:00' },
      { from: 'Booking.com', text: 'Madrid Premier League hotel hold expires May 1.', time: '08:20' },
    ]},
    { label: 'Fan Mail',           icon: '💌', count: 4, color: '#DB2777', urgent: false, messages: [
      { from: 'Fan - Tom S.', text: 'Great performance last week! Can you sign my shirt at Prague?', time: '11:00' },
      { from: 'Fan - Emma K.', text: 'My son loves watching you play. Any chance of a video message?', time: '10:30' },
      { from: 'Darts Forum', text: 'Thread: Jake Morrison form analysis — 47 replies', time: '09:15' },
      { from: 'Fan - Mike R.', text: 'Good luck tonight against Price!', time: '08:45' },
    ]},
  ]

  return (
    <div className="space-y-6">
      {/* ── PERSONAL BANNER — matching tennis pattern exactly ── */}
      <div className="relative rounded-2xl overflow-hidden mb-4 p-6"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #0f172a 60%, #0c1321 100%)', border: '1px solid rgba(220,38,38,0.2)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{greeting}, {firstName} 🎯</h1>
              <button onClick={speakBriefing} title={isSpeaking ? 'Stop reading' : 'Text-to-Speech — Lumio Darts will read your morning headlines, match schedule and urgent items aloud. Upgrade for 20 human-sounding voices.'}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                style={{ background: isSpeaking ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)', border: isSpeaking ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isSpeaking ? '#F97316' : '#9CA3AF' }}>
                <Volume2 size={14} />
              </button>
            </div>
            <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
              {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
            <p className="text-xs italic" style={{ color: '#F59E0B' }}>
              &ldquo;{getDailyQuote(DARTS_QUOTES).text}&rdquo; &mdash; {getDailyQuote(DARTS_QUOTES).author}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 ml-4">
            {[
              { icon:'📊', value:`#${player.pdcRank}`, label:'PDC Rank', color:'#dc2626' },
              { icon:'🎯', value:String(player.threeDartAverage), label:'3-Dart Avg', color:'#F97316' },
              { icon:'✅', value:`${player.checkoutPercent}%`, label:'Checkout', color:'#22C55E' },
              { icon:'🏆', value:'#12', label:'Career High', color:'#8B5CF6' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[70px] cursor-pointer transition-all hover:scale-105"
                style={{ backgroundColor: `${s.color}20`, borderColor: `${s.color}4d` }}>
                <span className="text-base">{s.icon}</span>
                <span className="text-lg font-black text-white">{s.value}</span>
                <span className="text-xs opacity-70">{s.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center px-3 py-2 rounded-xl border min-w-[70px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-xl">🌧️</div>
              <div className="text-sm font-bold text-white">14°C</div>
              <div className="text-[9px]" style={{ color: '#6B7280' }}>London</div>
            </div>
            <div className="flex flex-col justify-center px-3 h-[72px] rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minWidth: '120px' }}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {[{ city:'London', tz:'Europe/London', isUser:true },{ city:'New York', tz:'America/New_York', isUser:false },{ city:'Dortmund', tz:'Europe/Berlin', isUser:false },{ city:'Dubai', tz:'Asia/Dubai', isUser:false }].map(({ city, tz, isUser }) => (
                  <div key={city} className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums" style={{ color: isUser ? '#F59E0B' : '#FFFFFF' }}>{new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour:'2-digit', minute:'2-digit' })}</span>
                    <span className="text-[10px]" style={{ color: isUser ? '#F59E0B' : '#6B7280' }}>{city}</span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] mt-1" style={{ color: '#4B5563' }}>World Clock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-800" style={{ overflowX: 'hidden' }}>
        <button onClick={() => setDashTab('gettingstarted')}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
          style={{ borderBottomColor: dashTab === 'gettingstarted' ? '#dc2626' : 'transparent', color: dashTab === 'gettingstarted' ? '#f87171' : '#6B7280', backgroundColor: dashTab === 'gettingstarted' ? '#dc26260d' : 'transparent' }}>
          <span className="text-base">🚀</span>Getting Started
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: '#dc2626' }}>10</span>
        </button>
        {([
          { id:'today' as const,      label:'Today',       icon:'🏠' },
          { id:'quickwins' as const,  label:'Quick Wins',  icon:'⚡' },
          { id:'dailytasks' as const, label:'Daily Tasks', icon:'✅' },
          { id:'insights' as const,   label:'Insights',    icon:'📊' },
          { id:'dontmiss' as const,   label:"Don't Miss",  icon:'🔴' },
          { id:'team' as const,       label:'Team',        icon:'👥' },
        ]).map(t => (
          <button key={t.id} onClick={() => setDashTab(t.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap"
            style={{ borderBottomColor: dashTab === t.id ? '#dc2626' : 'transparent', color: dashTab === t.id ? '#f87171' : '#6B7280', backgroundColor: dashTab === t.id ? '#dc26260d' : 'transparent' }}>
            <span className="text-base">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Quick Actions — below tab bar (Today only) */}
      {dashTab === 'today' && <div className="mb-5 mt-4">
        <div className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: '#4B5563' }}>Quick actions</div>
        <div className="flex flex-wrap gap-2">
          {[
            { id:'sendmessage', label:'Send Message', icon:'📨', color:'#dc2626', hot:false },
            { id:'flights', label:'Smart Flights', icon:'✈️', color:'#dc2626', hot:true },
            { id:'hotel', label:'Find Hotel', icon:'🏨', color:'#dc2626', hot:true },
            { id:'practice', label:'Practice Log', icon:'🎯', color:'#10B981', hot:false },
            { id:'matchreport', label:'Match Report AI', icon:'📋', color:'#22C55E', hot:true },
            { id:'equipment', label:'Equipment', icon:'🏹', color:'#6B7280', hot:false },
            { id:'prizes', label:'Prize Tracker', icon:'💰', color:'#F59E0B', hot:false },
            { id:'sponsor', label:'Sponsor Post AI', icon:'📱', color:'#F59E0B', hot:true },
            { id:'media', label:'Media Manager', icon:'📣', color:'#6B7280', hot:false },
            { id:'mental', label:'Mental Prep AI', icon:'🧠', color:'#8B5CF6', hot:true },
            { id:'physio', label:'Physio Log', icon:'💊', color:'#EF4444', hot:false },
            { id:'expense', label:'Log Expense', icon:'🧾', color:'#6B7280', hot:false },
            { id:'exhibition', label:'Exhibitions', icon:'🎪', color:'#D97706', hot:false },
            { id:'socialmedia', label:'Social Media AI', icon:'📲', color:'#8B5CF6', hot:true },
          ].map(a => (
            <button key={a.id} onClick={() => onOpenModal(a.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap shrink-0 relative"
              style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}>
              <span>{a.icon}</span>{a.label}
              {a.hot && <span className="absolute -top-1 -right-1 text-[8px] px-1 py-0.5 rounded-full font-black leading-none" style={{ backgroundColor: '#fff', color: '#D97706' }}>AI</span>}
            </button>
          ))}
        </div>
      </div>}

      {/* GETTING STARTED */}
      {dashTab === 'gettingstarted' && (() => {
        const TOUR_STEPS = [
          { n:1, label:'Your darts OS, fully connected', icon:'🎯', preview:'dashboard' },
          { n:2, label:'Start every match day knowing everything', icon:'🌅', preview:'briefing' },
          { n:3, label:'Every action, one click away', icon:'⚡', preview:'actions' },
          { n:4, label:'PDC Tour travel sorted in 60 seconds', icon:'✈️', preview:'travel' },
          { n:5, label:'Your stats, your ranking, your performance', icon:'📊', preview:'performance' },
          { n:6, label:'Your team, front and centre', icon:'👥', preview:'team' },
          { n:7, label:'AI that actually helps you win', icon:'🤖', preview:'ai' },
          { n:8, label:'Sponsors managed automatically', icon:'🤝', preview:'sponsor' },
          { n:9, label:'Nothing falls through the cracks', icon:'🔔', preview:'dontmiss' },
          { n:10, label:"Run your darts career like a business", icon:'🏆', preview:'cta' },
        ]
        const step = TOUR_STEPS[tourStep]
        const goLive = () => { localStorage.setItem('darts_getting_started_seen', 'true'); setDashTab('today') }
        return (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#F59E0B' }}>STEP {tourStep + 1} OF {TOUR_STEPS.length}</div>
                <div className="w-full bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%`, backgroundColor: '#F59E0B' }} /></div>
              </div>
              <button onClick={goLive} className="text-sm flex-shrink-0" style={{ color: '#4B5563' }}>Skip tour →</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT — Step sidebar */}
              <div className="space-y-1">
                {TOUR_STEPS.map((s, i) => (
                  <button key={s.n} onClick={() => setTourStep(i)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{ backgroundColor: tourStep === i ? 'rgba(249,115,22,0.1)' : 'transparent', border: tourStep === i ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: i < tourStep ? '#22C55E' : tourStep === i ? '#F97316' : 'rgba(255,255,255,0.05)', color: i <= tourStep ? '#fff' : '#4B5563' }}>
                      {i < tourStep ? '✓' : s.n}
                    </div>
                    <span className="text-sm" style={{ color: tourStep === i ? '#F9FAFB' : '#6B7280' }}>{s.label}</span>
                  </button>
                ))}
              </div>
              {/* RIGHT — Preview panel */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 420 }}>
                  <div className="p-6">
                    <div className="text-4xl mb-3">{step.icon}</div>

                    {/* ── Step 1: Dashboard overview ── */}
                    {step.preview === 'dashboard' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Your darts OS, fully connected.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>One portal replaces the 6 tools you probably use right now. Rankings, travel, sponsors, practice logs, your team — all here, all connected.</p>
                      <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
                        <div className="text-xs text-gray-400 mb-3">Your dashboard — live right now</div>
                        <div className="grid grid-cols-4 gap-2">
                          {[{ icon:'📊', v:`#${player.pdcRank}`, label:'PDC Rank', c:'#dc2626' },{ icon:'🎯', v:String(player.threeDartAverage), label:'3-Dart Avg', c:'#F97316' },{ icon:'💰', v:`£${Math.round(player.careerEarnings/1000)}k`, label:'Career', c:'#F59E0B' },{ icon:'🏆', v:'Tonight', label:'Euro Ch.', c:'#22C55E' }].map((s, i) => (
                            <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#0a0c14' }}><div className="text-lg">{s.icon}</div><div className="text-xs font-black mt-0.5" style={{ color: s.c }}>{s.v}</div><div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.label}</div></div>
                          ))}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">Next match:</span> <span className="text-white font-semibold">vs G. Price — 20:00 Dortmund</span></div>
                          <div className="rounded-lg p-2" style={{ backgroundColor: '#0a0c14' }}><span className="text-gray-500">OOM standing:</span> <span className="text-white font-semibold">#19 — £312,400</span></div>
                        </div>
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                        <span style={{ color: '#F59E0B' }}>💡</span> <span style={{ color: '#9CA3AF' }}>Used by PDC Tour players to manage everything in one place.</span>
                      </div>
                    </>)}

                    {/* ── Step 2: Morning Briefing ── */}
                    {step.preview === 'briefing' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Start every match day knowing everything.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Your AI morning briefing reads your entire day back to you — opponent stats, travel confirmed, sponsor deadlines, practice schedule. In 60 seconds.</p>
                      <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
                        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937', background: 'rgba(249,115,22,0.06)' }}>
                          <span>✨</span><span className="text-sm font-semibold text-white">AI Morning Summary</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>Today</span>
                        </div>
                        <div className="p-4 space-y-2.5" style={{ backgroundColor: '#0a0c14' }}>
                          {[
                            { icon:'🎯', text:'Tonight vs G. Price (PDC #7) — 20:00 Westfalenhallen. H2H 3-4 Price. His checkout 39.8% vs yours 44%.' },
                            { icon:'🤝', text:'Red Dragon content shoot at 12:00 — penalty clause. Kit prepped.' },
                            { icon:'📬', text:'2 urgent messages: Paddy Power £85k/yr offer + Prague Open entry deadline.' },
                            { icon:'✈️', text:'Travel to Dortmund confirmed. Return flight 23:30 via Düsseldorf.' },
                          ].map((item, i) => (
                            <div key={i} className="flex gap-2.5 text-[11px]"><span className="flex-shrink-0">{item.icon}</span><span style={{ color: '#D1D5DB' }}>{item.text}</span></div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                        <span>🔊</span> <span style={{ color: '#9CA3AF' }}>Press the speaker icon every morning. Sarah reads it to you while you warm up.</span>
                      </div>
                    </>)}

                    {/* ── Step 3: Quick Actions ── */}
                    {step.preview === 'actions' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Every action, one click away.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>13 quick actions on your dashboard — log a practice session, file a physio report, generate a sponsor post, send your agent a brief. All in under 60 seconds.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          { label:'Smart Flights', icon:'✈️', hot:true },{ label:'Find Hotel', icon:'🏨', hot:true },{ label:'Practice Log', icon:'🎯', hot:false },
                          { label:'Match Report AI', icon:'📋', hot:true },{ label:'Sponsor Post AI', icon:'📱', hot:true },{ label:'Mental Prep AI', icon:'🧠', hot:true },
                        ].map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold relative"
                            style={{ backgroundColor: a.hot ? '#D97706' : '#1F2937', color: a.hot ? '#fff' : '#9CA3AF' }}>
                            <span>{a.icon}</span>{a.label}
                            {a.hot && <span className="absolute -top-1 -right-1 text-[7px] px-1 py-0.5 rounded-full font-black" style={{ backgroundColor: '#fff', color: '#D97706' }}>AI</span>}
                          </span>
                        ))}
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)' }}>
                        <span>✈️</span> <span style={{ color: '#0ea5e9' }}>Smart Flights searches 8+ airlines simultaneously — you shouldn&apos;t be able to find it cheaper on Google.</span>
                      </div>
                    </>)}

                    {/* ── Step 4: Travel ── */}
                    {step.preview === 'travel' && (<>
                      <h2 className="text-xl font-black text-white mb-2">PDC Tour travel sorted in 60 seconds.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Smart Flights AI finds the cheapest flights to every PDC venue. Smart Hotel finds tournament hotels near the venue. All pre-filled with your home airport and preferences.</p>
                      <div className="space-y-2 mb-4">
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(14,165,233,0.3)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">Ryanair · FR 3847</span>
                            <span className="text-xs font-black" style={{ color: '#22C55E' }}>£87 return</span>
                          </div>
                          <div className="text-[10px] text-gray-400">London STN → Dortmund · 2h 15m · Direct · Depart 06:40</div>
                          <div className="mt-1"><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>BEST VALUE</span></div>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">Eurowings · EW 461</span>
                            <span className="text-xs font-bold text-gray-300">£124 return</span>
                          </div>
                          <div className="text-[10px] text-gray-400">London LHR → Düsseldorf + train · 3h 40m · 1 stop</div>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">🏨 Westfalenhallen Marriott</span>
                            <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>£94/night</span>
                          </div>
                          <div className="text-[10px] text-gray-400">0.3km from venue · Gym · Restaurant · 8.4 rating</div>
                        </div>
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <span style={{ color: '#F59E0B' }}>💰</span> <span style={{ color: '#F59E0B' }}>Players using Smart Flights save an average of £340 per tournament on travel vs booking manually.</span>
                      </div>
                    </>)}

                    {/* ── Step 5: Performance ── */}
                    {step.preview === 'performance' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Your stats. Your ranking. Your performance.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Live PDC ranking, OOM standing, checkout %, 3-dart average trend, first-9 averages — all tracked automatically. See exactly where you need to improve.</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label:'PDC Ranking', value:`#${player.pdcRank}`, sub:'↑ 2 this week', color:'#dc2626' },
                          { label:'Checkout %', value:`${player.checkoutPercent}%`, sub:'Tour avg: 35%', color:'#22C55E' },
                          { label:'3-Dart Average', value:String(player.threeDartAverage), sub:'Career best: 99.2', color:'#F97316' },
                          { label:'Form (last 5)', value:'W-W-L-W-W', sub:'80% win rate', color:'#0ea5e9' },
                        ].map((s, i) => (
                          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                            <div className="text-[10px] text-gray-500 mb-1">{s.label}</div>
                            <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                        <span>📈</span> <span style={{ color: '#9CA3AF' }}>The Ranking Simulator shows you exactly what you need to win tonight to move up the OOM.</span>
                      </div>
                    </>)}

                    {/* ── Step 6: Team ── */}
                    {step.preview === 'team' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Your team. Always in the loop.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Manager, coach, physio, agent, equipment sponsor — all connected. Message your whole team in one tap. Everyone sees what they need to see.</p>
                      <div className="space-y-2 mb-4">
                        {[
                          { name:'Dave Askew', role:'Manager', status:'Confirmed travel to Dortmund', color:'#dc2626' },
                          { name:'Steve Morris', role:'Coach', status:'Pre-match briefing at 16:30', color:'#F97316' },
                          { name:'Red Dragon', role:'Sponsor', status:'Content shoot 12:00 today', color:'#EA580C' },
                          { name:'James Wright', role:'Agent', status:'Paddy Power response pending', color:'#0ea5e9' },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${m.color}20`, color: m.color }}>{m.name.split(' ').map(w => w[0]).join('')}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{m.name}</span><span className="text-[9px]" style={{ color: m.color }}>{m.role}</span></div>
                              <div className="text-[10px] text-gray-500">{m.status}</div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                        <span>📨</span> <span style={{ color: '#9CA3AF' }}>Your agent gets auto-briefed every Monday. Sponsor posts go out with one click.</span>
                      </div>
                    </>)}

                    {/* ── Step 7: AI ── */}
                    {step.preview === 'ai' && (<>
                      <h2 className="text-xl font-black text-white mb-2">AI that actually helps you win.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Match Report AI analyses your last match. Opponent Scout AI breaks down who you&apos;re playing tonight. Mental Prep AI builds your pre-match routine. All powered by Claude — the world&apos;s most advanced AI.</p>
                      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#0a0c14', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <div className="flex items-center gap-2 mb-2"><span>🤖</span><span className="text-xs font-bold" style={{ color: '#A78BFA' }}>Opponent Scout AI — G. Price</span></div>
                        <div className="space-y-2 text-[11px]" style={{ color: '#D1D5DB' }}>
                          <p>Tonight vs G. Price (PDC #7): His checkout is 39.8% vs your {player.checkoutPercent}% — you have the edge on doubles.</p>
                          <p>He struggles on D16 under pressure — 28% conversion rate in deciding legs. Your D16 is 52%.</p>
                          <p>Start strong on the opening leg. Price&apos;s first-3 average drops 6 points when he loses leg 1.</p>
                        </div>
                        <div className="text-[9px] mt-3" style={{ color: '#6B7280' }}>Generated using live PDC match data · Claude AI</div>
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <span style={{ color: '#A78BFA' }}>🤖</span> <span style={{ color: '#A78BFA' }}>Powered by Claude AI · Anthropic · The same AI trusted by Fortune 500 companies.</span>
                      </div>
                    </>)}

                    {/* ── Step 8: Sponsors ── */}
                    {step.preview === 'sponsor' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Never miss a sponsor deadline again.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Red Dragon content shoots, social media obligations, post-match appearances — all tracked. Social Media AI writes the caption, you approve it, one click posts it.</p>
                      <div className="space-y-2 mb-4">
                        {[
                          { name:'Red Dragon', status:'Content shoot 12:00 today', badge:'DUE NOW', badgeColor:'#EF4444', value:'£48k/yr' },
                          { name:'Betway', status:'2 social posts outstanding', badge:'OVERDUE', badgeColor:'#F59E0B', value:'£22k/yr' },
                          { name:'Paddy Power', status:'Ambassador inquiry — respond by Apr 25', badge:'NEW DEAL', badgeColor:'#22C55E', value:'£40k/yr' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2"><span className="text-xs font-bold text-white">{s.name}</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${s.badgeColor}20`, color: s.badgeColor }}>{s.badge}</span></div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{s.status}</div>
                            </div>
                            <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                        <span>📱</span> <span style={{ color: '#9CA3AF' }}>Sponsor Post AI generates the caption in your voice. Takes 8 seconds.</span>
                      </div>
                    </>)}

                    {/* ── Step 9: Don't Miss ── */}
                    {step.preview === 'dontmiss' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Nothing falls through the cracks.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Don&apos;t Miss catches everything urgent — ranking points dropping off, sponsor deadlines, visa expiry, entry deadlines. Sorted by financial impact so you always know what matters most.</p>
                      <div className="space-y-2 mb-4">
                        {[
                          { badge:'TONIGHT', bg:'rgba(220,38,38,0.15)', color:'#EF4444', text:'Match vs G. Price — Euro Ch. R1. 20:00 Dortmund.', sub:'Miss = lose £110,000 + ranking points' },
                          { badge:'TODAY', bg:'rgba(220,38,38,0.15)', color:'#EF4444', text:'Red Dragon content shoot at 12:00. Penalty clause applies.', sub:'Contract breach risk' },
                          { badge:'THIS WK', bg:'rgba(245,158,11,0.15)', color:'#F59E0B', text:'Prague Open flights — prices rising £8/day.', sub:'Save £80+ booking now' },
                          { badge:'14 DAYS', bg:'rgba(139,92,246,0.15)', color:'#8B5CF6', text:'Paddy Power ambassador — £40k/yr. Respond by Apr 25.', sub:'Competitor also in talks' },
                        ].map((d, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: '#0a0c14' }}>
                            <span className="text-[9px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5" style={{ background: d.bg, color: d.color }}>{d.badge}</span>
                            <div><div className="text-[11px] text-white">{d.text}</div><div className="text-[10px] italic mt-0.5" style={{ color: '#EF4444' }}>{d.sub}</div></div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg p-3 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <span style={{ color: '#F59E0B' }}>💰</span> <span style={{ color: '#F59E0B' }}>£12,400 in OOM points drops off this week. Win tonight to cover the gap.</span>
                      </div>
                    </>)}

                    {/* ── Step 10: CTA ── */}
                    {step.preview === 'cta' && (<>
                      <h2 className="text-xl font-black text-white mb-2">Run your darts career like a business.</h2>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>Everything a professional darts player needs — rankings, travel, sponsors, team, AI analysis — in one place. Built for PDC Tour level. Works from the oche to the airport.</p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { icon:'📊', label:'PDC Rankings', desc:'Live OOM tracking' },
                          { icon:'✈️', label:'Smart Travel', desc:'Flights + hotels' },
                          { icon:'🤖', label:'AI Analysis', desc:'Match prep + scout' },
                          { icon:'🤝', label:'Sponsor Manager', desc:'Obligations tracked' },
                          { icon:'👥', label:'Team Hub', desc:'Everyone connected' },
                          { icon:'🔔', label:"Don't Miss", desc:'Nothing slips' },
                        ].map((f, i) => (
                          <div key={i} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
                            <div className="text-xl mb-1">{f.icon}</div>
                            <div className="text-[10px] font-bold text-white">{f.label}</div>
                            <div className="text-[9px] text-gray-500">{f.desc}</div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(249,115,22,0.25)' }}>
                        <div className="text-sm font-bold text-white mb-1">3-month free trial — no card required</div>
                        <div className="text-[11px] mb-3" style={{ color: '#9CA3AF' }}>Connect your real data in under 10 minutes. Cancel anytime.</div>
                        <div className="flex justify-center gap-2">
                          <button onClick={goLive} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#F97316' }}>Go to my dashboard →</button>
                          <button className="px-4 py-2 rounded-xl text-xs font-bold" style={{ border: '1px solid #374151', color: '#9CA3AF' }}>Invite my team →</button>
                        </div>
                      </div>
                      <div className="rounded-lg p-3 mt-4 text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <span style={{ color: '#F59E0B' }}>🏆</span> <span style={{ color: '#F59E0B' }}>You&apos;re one of our first 20 founding members. We&apos;ll build what you ask for.</span>
                      </div>
                    </>)}
                  </div>
                  {/* Navigation */}
                  <div className="flex items-center justify-between px-6 pb-6 pt-2" style={{ borderTop: '1px solid #1F2937' }}>
                    <button onClick={() => setTourStep(Math.max(0, tourStep - 1))} disabled={tourStep === 0} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: tourStep === 0 ? 'transparent' : '#1F2937', color: tourStep === 0 ? '#374151' : '#9CA3AF' }}>← Back</button>
                    <span className="text-xs" style={{ color: '#4B5563' }}>{tourStep + 1} / {TOUR_STEPS.length}</span>
                    {tourStep < TOUR_STEPS.length - 1 ? (
                      <button onClick={() => setTourStep(tourStep + 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#F97316' }}>Next →</button>
                    ) : (
                      <button onClick={goLive} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Let&apos;s go 🎯</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* TODAY */}
      {dashTab === 'today' && (
        <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Morning Roundup */}
          <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span>🌅</span><span className="text-sm font-bold text-white">Morning Roundup</span></div>
              <span className="text-[10px] text-gray-600">Since you were last here</span>
            </div>
            <div className="space-y-2">
              {(roundupOrder.length > 0 ? [...ROUNDUP_CHANNELS].sort((a, b) => { const ai = roundupOrder.indexOf(a.label); const bi = roundupOrder.indexOf(b.label); return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) }) : ROUNDUP_CHANNELS).map((ch, idx) => (
                <div key={ch.label} draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragEnter={() => setDragOverIdx(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDragEnd={() => {
                    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
                      const currentSorted = roundupOrder.length > 0 ? [...ROUNDUP_CHANNELS].sort((a, b) => { const ai = roundupOrder.indexOf(a.label); const bi = roundupOrder.indexOf(b.label); return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) }) : [...ROUNDUP_CHANNELS]
                      const reordered = [...currentSorted]; const [moved] = reordered.splice(dragIdx, 1); reordered.splice(dragOverIdx, 0, moved)
                      const newOrder = reordered.map(c => c.label); setRoundupOrder(newOrder); localStorage.setItem('darts_roundup_order', JSON.stringify(newOrder))
                    }
                    setDragIdx(null); setDragOverIdx(null)
                  }}
                  style={{ borderLeft: `4px solid ${ch.color}`, backgroundColor: `${ch.color}22`, borderRadius: '8px', marginBottom: '6px', borderTop: dragOverIdx === idx ? '2px solid #0ea5e9' : 'none', opacity: dragIdx === idx ? 0.5 : 1, cursor: 'grab' }} className="hover:border-gray-700 transition-all">
                  <button onClick={() => setExpandedChannel(expandedChannel === ch.label ? null : ch.label)} className="w-full flex items-center justify-between py-2 px-3 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base" style={{ color: ch.color, filter: `drop-shadow(0 0 4px ${ch.color})` }}>{ch.icon}</span>
                      <span style={{ color: ch.color, fontWeight: 600, fontSize: '15px' }}>{ch.label}</span>
                      {ch.urgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold">Urgent</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: ch.color, fontWeight: 700 }}>{ch.count}</span>
                      <span className={`text-gray-700 text-xs transition-transform ${expandedChannel === ch.label ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>
                  {expandedChannel === ch.label && (
                    <div className="px-3 pb-2 space-y-1.5 border-t border-gray-800/40 pt-2">
                      {ch.messages.map((msg, j) => {
                        const msgKey = `${ch.label}-${j}`
                        if (dismissedMessages.has(msgKey)) return null
                        return (
                        <div key={j}>
                          <div className="flex items-start gap-2 py-1.5 px-2 rounded-lg bg-[#070810]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-gray-300">{msg.from}</span>
                                <span className="text-[9px] text-gray-600">{msg.time}</span>
                                {repliedTo.has(msgKey) && <span className="text-[9px] text-green-400 font-bold">✓ Replied</span>}
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">{msg.text}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                              {!repliedTo.has(msgKey) && <button onClick={() => { setReplyingTo(replyingTo === msgKey ? null : msgKey); setReplyText('') }} className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/15 text-red-400 hover:bg-red-600/25 transition-all">Reply</button>}
                              <button onClick={() => setDismissedMessages(prev => new Set([...prev, msgKey]))} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 hover:text-gray-300 transition-all">Dismiss</button>
                            </div>
                          </div>
                          {replyingTo === msgKey && (
                            <div className="mt-1 ml-2 mr-2 mb-1 rounded-lg p-2 bg-[#0a0c14] border border-gray-800">
                              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." rows={2} className="w-full bg-transparent text-xs text-gray-300 placeholder-gray-600 resize-none outline-none" />
                              <div className="flex items-center justify-end gap-2 mt-1">
                                <button onClick={() => { setReplyingTo(null); setReplyText('') }} className="text-[9px] px-2 py-1 rounded text-gray-500 hover:text-gray-300">Cancel</button>
                                <button onClick={() => { setRepliedTo(prev => new Set([...prev, msgKey])); setReplyingTo(null); setReplyText('') }} className="text-[9px] px-2.5 py-1 rounded bg-red-600/20 text-red-400 font-semibold hover:bg-red-600/30 transition-all">Send</button>
                              </div>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MIDDLE: Tonight's match + schedule */}
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-red-600/30 rounded-2xl p-5">
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-3">TONIGHT — PDC EUROPEAN CHAMPIONSHIP R1</div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-sm font-bold text-white mx-auto mb-1 overflow-hidden">
                    {displayPlayerPhoto ? <img src={displayPlayerPhoto} alt="" className="w-full h-full object-cover" /> : firstName.slice(0,2).toUpperCase()}
                  </div>
                  <div className="text-xs font-bold text-white">{displayPlayerName}</div>
                  <div className="text-[10px] text-red-400">#{player.pdcRank} PDC</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-black text-gray-600">VS</div>
                  <div className="text-[10px] text-gray-500 mt-1">20:00 · Dortmund</div>
                  <div className="text-[10px] text-green-400 mt-0.5">Win = £110,000</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white mx-auto mb-1">GP</div>
                  <div className="text-xs font-bold text-white">G. Price</div>
                  <div className="text-[10px] text-gray-500">#7 PDC</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-amber-400">
                H2H: 3–4 Price. His checkout 39.8% vs yours {player.checkoutPercent}% — close match. Start strong.
              </div>
            </div>
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-5">
              <div className="text-sm font-bold text-white mb-3">Today&apos;s Schedule</div>
              <div className="space-y-2">
                {[
                  { id:'s1', time:'09:00', label:'AI Morning Briefing',        highlight:false },
                  { id:'s2', time:'10:00', label:'Practice — D16 checkout',    highlight:false },
                  { id:'s3', time:'12:00', label:'Red Dragon content shoot',   highlight:false },
                  { id:'s4', time:'14:00', label:'Physio — shoulder & elbow',  highlight:false },
                  { id:'s5', time:'16:30', label:'Pre-match warm-up routine',  highlight:false },
                  { id:'s6', time:'20:00', label:'Match vs G. Price — R1',     highlight:true },
                  { id:'s7', time:'22:30', label:'Post-match media',           highlight:false },
                ].map((s) => {
                  const done = scheduleChecked[s.id]
                  const cancelled = scheduleCancelled[s.id]
                  return (
                  <div key={s.id} className={`group flex items-center gap-3 py-1.5 border-b border-gray-800/40 last:border-0 ${done || cancelled ? 'opacity-50' : ''} ${s.highlight && !done && !cancelled ? 'text-red-400' : ''}`}>
                    <button onClick={() => !cancelled && toggleScheduleItem(s.id)} className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: done ? '#22C55E' : cancelled ? '#374151' : 'transparent', borderColor: done ? '#22C55E' : cancelled ? '#374151' : s.highlight ? '#EF4444' : '#4B5563' }}>
                      {done && <span className="text-white text-[8px]">✓</span>}
                      {cancelled && <span className="text-gray-500 text-[8px]">✕</span>}
                    </button>
                    <span className="text-[10px] text-gray-500 w-10 flex-shrink-0">{s.time}</span>
                    <span className={`text-xs flex-1 ${done || cancelled ? 'line-through text-gray-600' : s.highlight ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>{s.label}</span>
                    {!s.highlight && !done && !cancelled && cancelConfirm !== s.id && (
                      <button onClick={() => setCancelConfirm(s.id)} className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6B7280' }}>Cancel →</button>
                    )}
                    {cancelConfirm === s.id && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px]" style={{ color: '#6B7280' }}>Cancel?</span>
                        <button onClick={() => cancelScheduleItem(s.id, s.label)} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Send</button>
                        <button onClick={() => setCancelConfirm(null)} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>Dismiss</button>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tonight&apos;s Venue</div>
              <div className="text-sm font-bold text-white">Westfalenhallen, Dortmund</div>
              <div className="text-xs text-gray-500 mt-1">14°C · Overcast · Doors open 18:00</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-400"><span>Walk-on:</span><span className="text-white">20:00</span></div>
                <div className="flex justify-between text-gray-400"><span>Prize (W):</span><span className="text-green-400 font-bold">£110,000</span></div>
                <div className="flex justify-between text-gray-400"><span>Prize (L):</span><span className="text-gray-300">£30,000</span></div>
                <div className="flex justify-between text-gray-400"><span>TV:</span><span className="text-white">Sky Sports Darts</span></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Photo frame + AI Morning Summary + Performance Intelligence */}
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">📸 Personal Photo Frame</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const next = photoFit === 'cover' ? 'contain' : 'cover'; setPhotoFit(next); localStorage.setItem('lumio_darts_photo_fit', next) }} className="text-[10px] text-gray-600 hover:text-gray-400">{photoFit === 'cover' ? '⊡ Fit' : '⊞ Fill'}</button>
                  <button className="text-[10px] text-gray-600 hover:text-gray-400">⏸ Pause</button>
                  {photoSrc && <button onClick={() => setPhotoSrc(null)} className="text-[10px] text-gray-600 hover:text-gray-400">✕ Remove</button>}
                  <button onClick={() => photoInputRef.current?.click()} className="text-[10px] text-red-400 hover:text-red-300">+ Add</button>
                  <input type="file" accept="image/*" style={{display:'none'}} ref={photoInputRef} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { const img = new window.Image(); img.onload = () => { const c = document.createElement('canvas'); const M = 400; let w = img.width, h = img.height; if (w > h) { if (w > M) { h = Math.round(h*M/w); w = M } } else { if (h > M) { w = Math.round(w*M/h); h = M } } c.width = w; c.height = h; const ctx = c.getContext('2d'); if (!ctx) return; ctx.drawImage(img, 0, 0, w, h); const compressed = c.toDataURL('image/jpeg', 0.7); setPhotoSrc(compressed) }; img.src = ev.target?.result as string }; r.readAsDataURL(f); e.target.value = '' }} />
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-red-900/20 to-gray-900 h-48 flex items-center justify-center">
                {photoSrc
                  ? <img src={photoSrc} alt="" className={`w-full h-full object-${photoFit}`} />
                  : <div className="text-center"><div className="text-4xl mb-2">🖼️</div><div className="text-xs text-gray-600">Add a photo — family, holidays, inspiration</div></div>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {['3s','5s','10s','30s'].map(s => (
                  <button key={s} className={`text-[10px] px-2 py-0.5 rounded ${s==='5s'?'bg-red-600/20 text-red-400':'text-gray-600 hover:text-gray-400'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* AI Morning Summary — matches tennis */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#8B5CF6' }}>✨</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Morning Summary</p>
                </div>
                <div className="flex items-center gap-2">
                  {dartsSummary && <button onClick={() => { setDartsSummary(null); setDartsSummaryLoading(false) }} className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#6B7280', border: '1px solid #374151' }}>↻</button>}
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626' }}>
                    {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
                  </span>
                </div>
              </div>
              <div className="px-5 py-4">
                {dartsSummaryLoading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-3 bg-gray-800 rounded animate-pulse" style={{ width: `${60 + i * 12}%` }} />)}</div>}
                {dartsSummary && !dartsSummaryLoading && <div className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{dartsSummary}</div>}
                {!dartsSummary && !dartsSummaryLoading && <div className="space-y-3">{[
                  { icon:'🎯', text:'Tonight vs G. Price (PDC #7) — 20:00 Westfalenhallen. H2H 3-4 Price. His checkout 39.8% vs yours 44%. Start strong on opening leg.' },
                  { icon:'📬', text:'2 urgent messages: Paddy Power ambassador offer via agent (£85k/yr) + Red Dragon flagging content deadline for 12:00 shoot.' },
                  { icon:'📅', text:'Today: Practice 10:00 (D16 checkout) → Red Dragon shoot 12:00 → Physio 14:00 → Warm-up 16:30 → Match 20:00 → Post-match media 22:30.' },
                  { icon:'🤝', text:'Red Dragon content shoot at 12:00 — contract obligation with penalty clause. Kit and backdrop prepped last night.' },
                  { icon:'✈️', text:'Prague Open flights selling fast — save £80+ booking now. Return flight to Gatwick confirmed 23:30 via Düsseldorf.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-xs"><span className="text-base flex-shrink-0">{item.icon}</span><span style={{ color: '#D1D5DB' }}>{item.text}</span></div>
                ))}</div>}
              </div>
            </div>

            {/* Performance Intelligence — matches tennis */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Performance Intelligence</p>
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#dc2626' }}>Performance</span>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {[
                  { n:1, trend:'↑', color:'#22C55E', text:`3-dart average up to ${player.threeDartAverage} — above season avg (98.4). Sharp on the doubles in warm-up.` },
                  { n:2, trend:'⚠', color:'#EF4444', text:'£12,400 points drop off after Players Championship 8. Win tonight = hold #9 Order of Merit. Loss = risk slipping to #12.' },
                  { n:3, trend:'↑', color:'#22C55E', text:`Checkout % now ${player.checkoutPercent}% — above tour avg (35%). D16 still the weakest — 10min practice before warm-up.` },
                  { n:4, trend:'→', color:'#dc2626', text:'Race to Alexandra Palace: top 16 qualifies. Euro Ch. and Players Ch. are the key points events before year-end.' },
                  { n:5, trend:'↓', color:'#F59E0B', text:'First 9 darts leg rate dipped 4% — below tour avg. Reset routine and opening throw focus in practice today.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1 flex-shrink-0 w-8">
                      <span className="font-bold" style={{ color: '#dc2626' }}>{item.n}</span>
                      <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.trend}</span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* QUICK WINS */}
      {dashTab === 'quickwins' && (() => {
        const quickWins = [
          { id:'qw1', title:'Practice D16 checkout before warm-up', impact:'high' as const, effort:'10min', cat:'Performance', icon:'🎯', action:'Log practice', modal:'practice' as string|undefined, description:'Double 16 is your weakest checkout route — 10 minutes of focused practice before warm-up.' },
          { id:'qw2', title:'Reply to Paddy Power ambassador inquiry', impact:'high' as const, effort:'5min', cat:'Commercial', icon:'🤝', action:'View messages', modal:undefined, description:'Agent flagged urgency — competitor also in talks. Quick reply keeps deal alive.' },
          { id:'qw3', title:'Book Prague Open flights — prices rising', impact:'high' as const, effort:'2min', cat:'Travel', icon:'✈️', action:'Search flights', modal:'flights' as string|undefined, description:'Cheapest seats selling fast — save £80+ booking now.' },
          { id:'qw4', title:'Red Dragon content shoot prep — 12:00', impact:'high' as const, effort:'5min', cat:'Sponsor', icon:'🐉', action:'Open brief', modal:'sponsor' as string|undefined, description:'Contract obligation — penalty clause applies. Prep kit and backdrop.' },
          { id:'qw5', title:'Review G. Price checkout patterns', impact:'medium' as const, effort:'15min', cat:'Match Prep', icon:'📊', action:'View scout', modal:'matchreport' as string|undefined, description:'Tonight\'s opponent — understand his favourite doubles and set-up shots.' },
          { id:'qw6', title:'Submit Betway social posts — 2 outstanding', impact:'medium' as const, effort:'5min', cat:'Commercial', icon:'📱', action:'View obligation', modal:'sponsor' as string|undefined, description:'Agent chasing — sponsor relationship at risk if not submitted today.' },
          { id:'qw7', title:'Confirm hotel for Madrid Premier League', impact:'medium' as const, effort:'5min', cat:'Travel', icon:'🏨', action:'Find hotel', modal:'hotel' as string|undefined, description:'Preferred hotel may sell out — Premier League week demand.' },
        ]
        return (
          <div className="space-y-3">
            {quickWins.map((w) => (
              <div key={w.id} className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: w.impact==='high' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: w.impact==='high' ? '#EF4444' : '#F59E0B' }}>{w.impact === 'high' ? 'HIGH IMPACT' : 'MEDIUM IMPACT'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dc26261a', color: '#f87171' }}>⏱ {w.effort}</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{w.cat}</span>
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{w.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{w.description}</p>
                    <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: AI + Live data</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {w.modal && <button onClick={() => onOpenModal(w.modal!)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#dc2626' }}>{w.action} →</button>}
                    <button className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* DAILY TASKS */}
      {dashTab === 'dailytasks' && (() => {
        const ALL_TASKS = [
          { id:'t1', time:'09:00', task:'AI Morning Briefing',             cat:'Routine',    priority:'low' as const,  modal:undefined as string|undefined },
          { id:'t2', time:'10:00', task:'Practice — D16 checkout routes',  cat:'Training',   priority:'high' as const, modal:'practice' as string|undefined },
          { id:'t3', time:'11:00', task:'Physio — elbow treatment',        cat:'Wellness',   priority:'medium' as const, modal:'physio' as string|undefined },
          { id:'t4', time:'12:00', task:'Red Dragon content shoot',        cat:'Sponsor',    priority:'high' as const, modal:'sponsor' as string|undefined },
          { id:'t5', time:'14:00', task:'Agent call — Paddy Power inquiry',cat:'Commercial', priority:'medium' as const, modal:undefined as string|undefined },
          { id:'t6', time:'16:30', task:'Pre-match warm-up routine',       cat:'Prep',       priority:'high' as const, modal:'mental' as string|undefined },
          { id:'t7', time:'19:30', task:'Walk-on — Dortmund Westfalenhallen', cat:'Match',  highlight:true, priority:'critical' as const, modal:undefined as string|undefined },
          { id:'t8', time:'20:00', task:'Match vs G. Price — EC R1',       cat:'Match',     highlight:true, priority:'critical' as const, modal:'matchreport' as string|undefined },
          { id:'t9', time:'22:30', task:'Post-match media duties',         cat:'Media',      priority:'medium' as const, modal:'media' as string|undefined },
        ]
        const filtered = taskFilter === 'all' ? ALL_TASKS : ALL_TASKS.filter(t => t.priority === taskFilter)
        return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {(['all','critical','high','medium','low'] as const).map(f => (
                <button key={f} onClick={() => setTaskFilter(f)} className="text-[10px] px-2.5 py-1 rounded-lg font-semibold capitalize transition-all"
                  style={{ backgroundColor: taskFilter === f ? (f==='critical'?'rgba(239,68,68,0.15)':f==='high'?'rgba(249,115,22,0.15)':f==='medium'?'rgba(245,158,11,0.15)':f==='low'?'rgba(107,114,128,0.15)':'rgba(220,38,38,0.1)') : 'transparent', color: taskFilter === f ? (f==='critical'?'#EF4444':f==='high'?'#F97316':f==='medium'?'#F59E0B':f==='low'?'#6B7280':'#f87171') : '#4B5563', border: taskFilter === f ? '1px solid' : '1px solid transparent', borderColor: taskFilter === f ? (f==='critical'?'rgba(239,68,68,0.3)':f==='high'?'rgba(249,115,22,0.3)':f==='medium'?'rgba(245,158,11,0.3)':f==='low'?'rgba(107,114,128,0.3)':'rgba(220,38,38,0.3)') : 'transparent' }}>
                  {f}
                </button>
              ))}
            </div>
            <button className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>+ Add Task</button>
          </div>
          {filtered.map((t) => {
            const done = tasksChecked[t.id] || false
            return (
            <div key={t.id} className="rounded-xl p-4 flex items-start gap-4" style={{ backgroundColor: (t as {highlight?:boolean}).highlight ? 'rgba(220,38,38,0.06)' : done ? 'rgba(255,255,255,0.01)' : '#111318', border: `1px solid ${(t as {highlight?:boolean}).highlight ? 'rgba(220,38,38,0.3)' : '#1F2937'}`, opacity: done ? 0.6 : 1 }}>
              <button onClick={() => toggleTaskItem(t.id)} className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ borderColor: done ? '#22C55E' : '#4B5563', background: done ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                {done && <span className="text-[9px] font-bold" style={{ color: '#22C55E' }}>✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: t.priority==='critical'?'rgba(239,68,68,0.12)':t.priority==='high'?'rgba(249,115,22,0.12)':t.priority==='medium'?'rgba(245,158,11,0.12)':'rgba(107,114,128,0.12)', color: t.priority==='critical'?'#EF4444':t.priority==='high'?'#F97316':t.priority==='medium'?'#F59E0B':'#6B7280' }}>{t.priority}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.cat}</span>
                  <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{t.time}</span>
                </div>
                <h4 className="font-semibold text-sm" style={{ color: done ? '#4B5563' : (t as {highlight?:boolean}).highlight ? '#f87171' : '#E5E7EB', textDecoration: done ? 'line-through' : 'none' }}>{t.task}</h4>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {t.modal && !done && <button onClick={() => onOpenModal(t.modal!)} className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#dc2626' }}>Open →</button>}
                {!done && <button onClick={() => toggleTaskItem(t.id)} className="px-4 py-2 text-xs rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>}
              </div>
            </div>
            )
          })}
        </div>
        )
      })()}

      {/* INSIGHTS */}
      {dashTab === 'insights' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:'PDC Rank', value:`#${player.pdcRank}`, sub:'Up 2 this week', color:'#dc2626', icon:'📊' },
              { label:'OOM Standing', value:'#19', sub:'£687k career', color:'#F97316', icon:'🏆' },
              { label:'Checkout %', value:`${player.checkoutPercent}%`, sub:'Tour avg: 35%', color:'#8B5CF6', icon:'🎯' },
              { label:'Season Earnings', value:'£187k', sub:'+8% vs projection', color:'#F59E0B', icon:'💰' },
              { label:'Form', value:'W-W-L-W-W', sub:'Last 5 matches', color:'#22C55E', icon:'📈' },
            ].map((kpi, i) => (
              <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-lg mb-1">{kpi.icon}</div>
                <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{kpi.label}</div>
                <div className="text-[9px] text-gray-600 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>
          {/* Insight Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type:'ALERT', value:'£12,400 at risk', title:'Points dropping off', description:'Your Players Championship 8 earnings (£12,400) drop off after this week. Win tonight to cover the gap and hold #19.', action:'View OOM breakdown', color:'#EF4444' },
              { type:'OPPORTUNITY', value:'£40k/yr', title:'Paddy Power ambassador deal', description:'Your agent flagged a Paddy Power ambassador inquiry worth an estimated £40k/yr. A competitor is also in talks — respond by Apr 25.', action:'View inquiry details', color:'#22C55E' },
              { type:'TREND', value:'+0.8 avg', title:'3-dart average rising', description:'Your 3-dart average has risen 0.8 points over the last 3 weeks. First-9 average (101.4) is at a career high. Sustaining TV form.', action:'View trend chart', color:'#3B82F6' },
              { type:'ACHIEVEMENT', value:'8 titles', title:'Career titles milestone', description:'Your win at Players Championship 6 brought your career title count to 8. One more puts you in the all-time PDC top-50 winners list.', action:'View career stats', color:'#F59E0B' },
            ].map((tile, i) => (
              <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tile.color}15`, color: tile.color, border: `1px solid ${tile.color}40` }}>{tile.type}</span>
                  <span className="text-sm font-bold" style={{ color: tile.color }}>{tile.value}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{tile.title}</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{tile.description}</p>
                <button className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ backgroundColor: `${tile.color}10`, color: tile.color, border: `1px solid ${tile.color}30` }}>{tile.action} →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DON'T MISS */}
      {dashTab === 'dontmiss' && (() => {
        const DONT_MISS_ITEMS = [
          { id:'dm1', urgency:'TONIGHT', urgencyBg:'rgba(220,38,38,0.15)', urgencyColor:'#EF4444', category:'Match', deadline:'Tonight 20:00', title:'Match vs G. Price — European Championship R1', desc:'20:00 Westfalenhallen, Dortmund. H2H 3-4 Price. His checkout 39.8% vs yours — start strong on the opening leg.', consequence:'Miss = lose £110k prize + ranking points drop', action:'View match prep →', section:'matchprep', modal:'matchreport' as string|undefined },
          { id:'dm2', urgency:'TODAY', urgencyBg:'rgba(220,38,38,0.15)', urgencyColor:'#EF4444', category:'Sponsor', deadline:'Today 12:00', title:'Red Dragon content shoot — prep kit and backdrop', desc:'Contract obligation with penalty clause. Barrel review video required. Bring backup set.', consequence:'Penalty clause applies if missed — contract breach risk', action:'Open brief →', section:'sponsor', modal:'sponsor' as string|undefined },
          { id:'dm3', urgency:'THIS WK', urgencyBg:'rgba(245,158,11,0.15)', urgencyColor:'#F59E0B', category:'Travel', deadline:'Mon 14 Apr', title:'Prague Open flights — prices rising fast', desc:'Depart Mon 14 Apr. BA from £189 — cheapest seats selling fast. Save £80+ booking now.', consequence:'Prices increase daily — £80+ savings lost if delayed', action:'Search flights →', section:'flights', modal:'flights' as string|undefined },
          { id:'dm4', urgency:'THIS WK', urgencyBg:'rgba(245,158,11,0.15)', urgencyColor:'#F59E0B', category:'Sponsor', deadline:'Thu deadline', title:'2 Betway social posts outstanding', desc:'Agent chasing — James flagged urgency. Sponsor relationship at risk.', consequence:'Sponsor relationship at risk — repeat offence', action:'Create post →', section:'socialmedia', modal:'sponsor' as string|undefined },
          { id:'dm5', urgency:'14 DAYS', urgencyBg:'rgba(139,92,246,0.15)', urgencyColor:'#8B5CF6', category:'Commercial', deadline:'25 Apr', title:'Paddy Power ambassador decision', desc:'Respond to agent by 25 Apr. Estimated £40k/yr deal — competitor also in talks.', consequence:'Estimated £40k/yr deal — competitor also in talks', action:'View inquiry →', section:'commercial', modal:undefined as string|undefined },
          { id:'dm6', urgency:'MAY 3', urgencyBg:'rgba(75,85,99,0.15)', urgencyColor:'#6B7280', category:'Travel', deadline:'3 May', title:'Madrid Premier League hotel not confirmed', desc:'Deadline approaching. Preferred hotel may sell out — Premier League week.', consequence:'Preferred hotel may sell out', action:'Find hotel →', section:'hotel', modal:'hotel' as string|undefined },
        ]
        const visible = DONT_MISS_ITEMS.filter(d => !dismissedAlerts.has(d.id))
        return (
        <div className="space-y-3">
          <p className="text-[11px]" style={{ color: '#6B7280' }}>{visible.length} items need attention</p>
          {visible.map(d => (
            <div key={d.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start gap-3">
                <span className="text-[10px] px-2 py-1 rounded font-black flex-shrink-0 mt-0.5"
                  style={{ background: d.urgencyBg, color: d.urgencyColor }}>{d.urgency}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1F2937', color: '#6B7280' }}>{d.category}</span>
                    <span className="text-[10px]" style={{ color: '#6B7280' }}>Due: {d.deadline}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{d.title}</p>
                  <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{d.desc}</p>
                  <p className="text-[11px] italic mb-3" style={{ color: '#EF4444' }}>If missed: {d.consequence}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => d.modal && onOpenModal(d.modal)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ backgroundColor: '#0ea5e9', color: '#fff' }}>
                      {d.action}
                    </button>
                    <button onClick={() => dismissAlert(d.id)}
                      className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      style={{ border: '1px solid #374151', color: '#6B7280' }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      })()}

      {/* TEAM */}
      {dashTab === 'team' && (() => {
        const demoStaffPhotos: Record<string, string> = {
          'Dave Askew': '/Marcus_Webb.jpg',
          'Steve Morris': '/Carlos_Mendez.jpg',
          'Dr Paul Reid': '/Sarah_Lee.jpg',
          'James Wright': '/Marcus_Webb.jpg',
          'Red Dragon': '/Rick_Dalton.jpg',
          'Marcos Silva': '/Elena_Russo.jpg',
        }
        const TEAM_MEMBERS = [
          { name:'Dave Askew',      role:'Manager',            status:'Confirmed travel to Dortmund',    available:true,  initials:'DA', phone:'+44 7700 900123', email:'dave@dhsports.com', since:'2021', nationality:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', stat1:'42 events managed', stat2:'98% satisfaction' },
          { name:'Steve Morris',    role:'Coach',              status:'Pre-match briefing at 16:30',     available:true,  initials:'SM', phone:'+44 7700 900456', email:'steve@dartscoach.com', since:'2022', nationality:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', stat1:'PDC Level 3 Coach', stat2:'+4.2 avg improvement' },
          { name:'Dr Paul Reid',    role:'Physiotherapist',    status:'Elbow treatment 11:00 today',     available:true,  initials:'PR', phone:'+44 7700 900789', email:'paul@sportsphysio.com', since:'2023', nationality:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', stat1:'BSc Sports Therapy', stat2:'12 athletes' },
          { name:'Red Dragon',      role:'Equipment Sponsor',  status:'Content shoot 12:00 today',       available:true,  initials:'RD', phone:'N/A', email:'athletes@reddragon.co.uk', since:'2020', nationality:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', stat1:'Primary sponsor', stat2:'£45k/yr deal' },
          { name:'James Wright',    role:'Agent',              status:'Paddy Power response pending',    available:true,  initials:'JW', phone:'+44 7700 900321', email:'james@sportsmgmt.com', since:'2020', nationality:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', stat1:'15% commission', stat2:'£84k deals YTD' },
          { name:'Marcos Silva',    role:'Sports Psychologist',status:'Pre-match call 15:00',            available:true,  initials:'MS', phone:'+44 7700 900654', email:'marcos@mindset.com', since:'2024', nationality:'🇧🇷', stat1:'PhD Sports Psychology', stat2:'Pressure specialist' },
        ]
        return (
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-gray-800 pb-px" style={{ overflowX: 'hidden' }}>
              {([
                { id:'today' as const, label:'Team Today', icon:'📅' },
                { id:'orgchart' as const, label:'Org Chart', icon:'🏗️' },
                { id:'info' as const, label:'Team Info', icon:'🪪' },
                { id:'tour' as const, label:'Tour Info', icon:'🗺️' },
              ]).map(t => (
                <button key={t.id} onClick={() => setTeamSubTab(t.id)}
                  className={`flex items-center gap-1 px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${teamSubTab === t.id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {teamSubTab === 'today' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEAM_MEMBERS.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[#0d1117] border border-gray-800 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-xs font-bold text-red-400 flex-shrink-0 overflow-hidden">
                      {demoStaffPhotos[m.name] ? <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" /> : m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-[10px] text-red-400">{m.role}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate">{m.status}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.available?'bg-green-400':'bg-gray-600'}`} />
                  </div>
                ))}
              </div>
            )}

            {teamSubTab === 'orgchart' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="bg-red-600/15 border border-red-600/30 rounded-xl px-6 py-3 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2 overflow-hidden"
                      style={{ background: 'rgba(220,38,38,0.2)', border: '2px solid #dc2626', color: '#dc2626' }}>
                      {displayPlayerPhoto ? <img src={displayPlayerPhoto} alt="" className="w-full h-full object-cover" /> : (liveProfilePhoto ? <img src={liveProfilePhoto} alt="" className="w-full h-full object-cover" /> : displayPlayerName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase())}
                    </div>
                    <div className="text-sm font-bold text-white">{displayPlayerName}</div>
                    {displayPlayerNickname && <div className="text-[10px] text-gray-500 italic">{displayPlayerNickname}</div>}
                    <div className="text-[10px] text-red-400">Player — #{player.pdcRank} PDC</div>
                  </div>
                  <div className="w-px h-6 bg-gray-700" />
                  <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                    {[
                      { name:'Dave Askew', role:'Manager' },
                      { name:'James Wright', role:'Agent' },
                      { name:'Steve Morris', role:'Coach' },
                    ].map((m, i) => (
                      <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-3 text-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 border border-red-600/30 flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.2)' }}>
                          {demoStaffPhotos[m.name] ? <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" /> : <span className="text-[10px] font-bold text-red-400">{m.name.split(' ').map(w => w[0]).join('')}</span>}
                        </div>
                        <div className="text-xs font-semibold text-white">{m.name}</div>
                        <div className="text-[10px] text-gray-500">{m.role}</div>
                      </div>
                    ))}
                  </div>
                  <div className="w-px h-4 bg-gray-700" />
                  <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                    {[
                      { name:'Dr Paul Reid', role:'Physio' },
                      { name:'Marcos Silva', role:'Psychologist' },
                      { name:'Red Dragon', role:'Sponsor' },
                    ].map((m, i) => (
                      <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-3 text-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 border border-gray-700 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {demoStaffPhotos[m.name] ? <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" /> : <span className="text-[10px] font-bold text-gray-400">{m.name.split(' ').map(w => w[0]).join('')}</span>}
                        </div>
                        <div className="text-xs font-semibold text-white">{m.name}</div>
                        <div className="text-[10px] text-gray-500">{m.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {teamSubTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEAM_MEMBERS.map((m, i) => (
                  <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-red-900/30 to-gray-900/30" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-600/30 flex items-center justify-center text-lg font-bold text-red-400 mx-auto mb-2 overflow-hidden">
                        {demoStaffPhotos[m.name] ? <img src={demoStaffPhotos[m.name]} alt={m.name} className="w-full h-full object-cover object-center" /> : m.initials}
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-sm font-bold text-white">{m.name}</div>
                        <div className="text-[10px] text-red-400 font-semibold">{m.role}</div>
                        <div className="text-[10px] text-gray-500">Since {m.since} {m.nationality}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-[#0a0c14] rounded-lg p-2 text-center"><div className="text-[10px] text-gray-400">{m.stat1}</div></div>
                        <div className="bg-[#0a0c14] rounded-lg p-2 text-center"><div className="text-[10px] text-gray-400">{m.stat2}</div></div>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between text-gray-500"><span>Phone</span><span className="text-gray-300">{m.phone}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Email</span><span className="text-gray-300 truncate ml-2">{m.email}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {teamSubTab === 'tour' && (
              <div className="space-y-4">
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
                  <div className="text-sm font-bold text-white mb-3">Tour Entourage — European Championship</div>
                  <div className="space-y-2">
                    {[
                      { name:'Dave Askew', role:'Manager', travel:'Travelling — same flight', hotel:'Westfalenhallen Hotel, Dortmund' },
                      { name:'Steve Morris', role:'Coach', travel:'Travelling — driving', hotel:'Westfalenhallen Hotel, Dortmund' },
                      { name:'Dr Paul Reid', role:'Physio', travel:'Available remotely', hotel:'N/A' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/40 last:border-0">
                        <div className="flex-1">
                          <span className="text-xs text-white font-semibold">{t.name}</span>
                          <span className="text-[10px] text-gray-500 ml-2">{t.role}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{t.travel}</span>
                        <span className="text-[10px] text-gray-500">{t.hotel}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
                  <div className="text-sm font-bold text-white mb-3">Upcoming Tour Schedule</div>
                  <div className="space-y-2">
                    {[
                      { event:'European Championship', dates:'Apr 8-12', location:'Dortmund', team:'Dave, Steve' },
                      { event:'Prague Open', dates:'Apr 28-30', location:'Prague', team:'Dave' },
                      { event:'Players Championship 9/10', dates:'May 3-4', location:'Barnsley', team:'Steve' },
                      { event:'German Masters', dates:'May 12-14', location:'Berlin', team:'Dave, Steve' },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0 text-xs">
                        <span className="text-gray-200 font-medium">{e.event}</span>
                        <span className="text-gray-500">{e.dates}</span>
                        <span className="text-gray-400">{e.location}</span>
                        <span className="text-gray-600">{e.team}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

    </div>
  );
}

// ─── MORNING BRIEFING VIEW ────────────────────────────────────────────────────
function MorningBriefingView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const briefingItems = [
    { id: 'match', icon: '🎯', title: "Tonight's match", urgent: true,
      summary: 'European Championship R1 vs Gerwyn Price (#7) · 20:00 · Dortmund · Board 4',
      detail: "H2H: Jake leads 8–3. Price averages 96.2 this season, starts slowly. Jake's avg vs Price: 99.4. Win probability: 62%. Prize if win: £11,000. → Match Prep has full briefing ready." },
    { id: 'oom', icon: '📊', title: 'Order of Merit', urgent: false,
      summary: '#19 PDC · £687,420 · £12,400 drops off this week',
      detail: 'You need to earn £12,400 this week to hold #19. A R1 win tonight (£11,000) plus any PC earnings will cover the drop. Buffer above 64th place: £189,420 — you are safe.' },
    { id: 'messages', icon: '💬', title: 'Team messages', urgent: false,
      summary: '4 messages — Marco, James, Dr. Singh, Sarah',
      detail: 'Marco: "Focus on T20 cluster tightness — pulling left under pressure." James: "Red Dragon renewal call Thursday 14:00." Dr. Singh: "Shoulder treatment confirmed 08:30 tomorrow." Sarah: "Pre-match routine updated — check Match Prep."' },
    { id: 'weather', icon: '🌤️', title: 'Dortmund weather', urgent: false,
      summary: '14°C · Overcast · Wind 8km/h SW',
      detail: 'Venue: Westfalenhallen, Dortmund. Indoor event — weather does not affect play. Travel tip: light jacket for evening travel to venue.' },
    { id: 'sponsors', icon: '🤝', title: 'Sponsor obligations', urgent: true,
      summary: 'Red Dragon content shoot today 16:00',
      detail: 'Barrel review video required before travel to Dortmund. 2 posts due this week total. Contract renewal in 23 days — James to call Thursday. Paddy Power ambassador post due Friday.' },
    { id: 'entries', icon: '📋', title: 'Entry deadlines', urgent: true,
      summary: 'Prague Open closes Apr 19 — 6 days',
      detail: 'You are auto-qualified via OoM #19. Entry is recommended — Prague has been good for you historically (avg 99.2 in 2024). German Masters deadline Apr 26. Both require manual confirmation in Entry Manager.' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Morning Briefing</h1>
          <p className="text-gray-400 text-sm mt-1">Tuesday, April 8 2025 · PDC European Championship week</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />Briefing ready · 06:30
        </div>
      </div>
      <div className="bg-gradient-to-r from-red-950/40 to-gray-900/40 rounded-xl border border-red-500/20 p-5">
        <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-3">✦ AI Morning Summary</p>
        <p className="text-gray-200 text-sm leading-relaxed">Big night ahead, Jake. You play Gerwyn Price at 20:00 in Dortmund — your H2H is 8–3 in your favour and you average 99.4 against him. Price starts slowly so applying pressure in the first three legs is key. Watch your doubles under pressure — your checkout % drops 7.4 points in deciding legs. The Red Dragon content shoot at 16:00 means you need to leave for the venue by 17:30 at the latest. Prague Open entry closes in 6 days — confirm with James today.</p>
      </div>
      <div className="space-y-2">
        {briefingItems.map(item => (
          <div key={item.id} className={`rounded-xl border transition-all ${expanded === item.id ? 'bg-gray-900/80 border-white/10' : 'bg-gray-900/40 border-white/5'}`}>
            <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{item.title}</span>
                  {item.urgent && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">Action</span>}
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{item.summary}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${expanded === item.id ? 'rotate-90' : ''}`} />
            </button>
            {expanded === item.id && (
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-white/5 pt-3">
                  <p className="text-gray-300 text-sm leading-relaxed">{item.detail}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Today at a glance</h2>
        <div className="space-y-1">
          {[
            { time: '10:00', event: 'Practice session — doubles finishing (90 min)', urgent: false },
            { time: '12:30', event: 'Physio: shoulder treatment (Dr. Singh)', urgent: false },
            { time: '14:00', event: 'Red Dragon content shoot — barrel review video', urgent: true },
            { time: '16:00', event: 'Travel to Dortmund (flight BA1234)', urgent: false },
            { time: '20:00', event: 'PDC European Championship R1 vs G. Price', urgent: true },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${item.urgent ? 'bg-red-950/20' : ''}`}>
              <span className="text-gray-500 w-10 flex-shrink-0 text-xs">{item.time}</span>
              <span className={item.urgent ? 'text-red-300' : 'text-gray-300'}>{item.event}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">Briefing generated at 06:30 · Connect Claude API for AI-personalised audio briefing</p>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── ORDER OF MERIT VIEW ──────────────────────────────────────────────────────
function OrderOfMeritView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const expiryMonths = [
    { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 8000 }, { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 12000 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 24000 },
    { month: 'Jul', amount: 0 }, { month: 'Aug', amount: 6000 }, { month: 'Sep', amount: 16000 },
    { month: 'Oct', amount: 0 }, { month: 'Nov', amount: 8500 }, { month: 'Dec', amount: 0 },
  ];
  return (
    <div className="space-y-6">

      <SectionHeader icon="📊" title="PDC Order of Merit & Race to Grand Champions" subtitle="Rolling 2-year prize money rankings and race standings." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current Rank" value="#19" sub="Order of Merit" color="red" />
        <StatCard label="Rolling 2-Year" value="£687,420" sub="Prize money total" color="orange" />
        <StatCard label="To Top 16" value="+£94,580" sub="Premier League place" color="purple" />
        <StatCard label="To Top 8" value="+£412,000" sub="World Ch. seeding" color="blue" />
      </div>

      {/* Prize Money Expiry */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Prize Money Expiry Calendar (Rolling Off)</div>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {expiryMonths.map((m, i) => (
            <div key={i} className={`rounded-lg p-2 text-center border ${m.amount > 15000 ? 'bg-red-600/10 border-red-600/30' : m.amount >= 5000 ? 'bg-amber-600/10 border-amber-600/30' : 'bg-green-600/10 border-green-600/30'}`}>
              <div className="text-[10px] text-gray-500">{m.month}</div>
              <div className={`text-xs font-bold ${m.amount > 15000 ? 'text-red-400' : m.amount >= 5000 ? 'text-amber-400' : 'text-green-400'}`}>
                {m.amount > 0 ? `£${(m.amount / 1000).toFixed(0)}k` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Race to Grand Champions */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Race to Grand Champions</div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Current: #23 · Need £38,000 more</span><span>Threshold: Top 32</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: '68%' }}></div>
        </div>
      </div>

      {/* Top 5 + Jake */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Order of Merit Standings</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-left p-3">Prize Money</th></tr></thead>
          <tbody>
            {[
              { rank: 1, name: 'Luke Humphries', money: '£2,847,200' },
              { rank: 2, name: 'Luke Littler', money: '£2,641,800' },
              { rank: 3, name: 'Michael van Gerwen', money: '£2,198,400' },
              { rank: 4, name: 'Gerwyn Price', money: '£1,847,600' },
              { rank: 5, name: 'Jonny Clayton', money: '£1,623,400' },
              { rank: 19, name: 'Jake Morrison ←', money: '£687,420' },
            ].map((p, i) => (
              <tr key={i} className={`border-b border-gray-800/50 ${p.rank === 19 ? 'bg-red-600/5' : ''}`}>
                <td className="p-3 text-gray-400">{p.rank}</td>
                <td className={`p-3 ${p.rank === 19 ? 'text-red-400 font-medium' : 'text-gray-200'}`}>{p.name}</td>
                <td className="p-3 text-gray-300">{p.money}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Season Prize Breakdown */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">2025 Season Prize Breakdown</div>
        <div className="space-y-2">
          {[
            { event: 'PDC World Championship R2', amount: '£35,000' },
            { event: 'Premier League (6 nights)', amount: '£42,000' },
            { event: 'UK Open QF', amount: '£24,000' },
            { event: 'World Matchplay QF', amount: '£16,000' },
            { event: 'Players Championship events', amount: '£44,800' },
            { event: 'European Tour events', amount: '£28,420' },
            { event: 'Pro Tour events', amount: '£18,200' },
          ].map((e, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-sm text-gray-300">{e.event}</span>
              <span className="text-sm text-gray-200 font-medium">{e.amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2 mt-1">
            <span className="text-sm text-white font-bold">Total 2025</span>
            <span className="text-sm text-red-400 font-bold">£124,800</span>
          </div>
        </div>
      </div>
      <DartsAISection context="orderofmerit" player={player} session={session} />
    </div>
  );
}

// ─── TOURNAMENT SCHEDULE VIEW ─────────────────────────────────────────────────
function TournamentScheduleView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const events = [
    { event: 'PDC European Championship', level: 'Major TV', prize: '£500k', date: 'This week', deadline: 'Entered', status: 'Playing' },
    { event: 'Prague Open', level: 'European Tour', prize: '£120k', date: 'Apr 28', deadline: 'Apr 22 ← 6d', status: 'Enter Now' },
    { event: 'Players Championship 9', level: 'Pro Tour', prize: '£100k', date: 'May 3', deadline: 'Apr 27', status: 'Not open' },
    { event: 'Players Championship 10', level: 'Pro Tour', prize: '£100k', date: 'May 4', deadline: 'Apr 27', status: 'Not open' },
    { event: 'German Masters', level: 'Major TV', prize: '£300k', date: 'May 12', deadline: 'May 5', status: 'Not open' },
    { event: 'Bahrain Darts Masters', level: 'World Series', prize: '£200k', date: 'May 18', deadline: 'May 10', status: 'Not open' },
    { event: 'UK Open', level: 'Major TV', prize: '£500k', date: 'Jun 1', deadline: 'May 20', status: 'Not open' },
    { event: 'Premier League (Night 12)', level: 'Premier League', prize: '£10k/night', date: 'Jun 6', deadline: 'Invited', status: 'Confirmed' },
    { event: 'World Matchplay', level: 'Major TV', prize: '£700k', date: 'Jul 18', deadline: 'Jun 30', status: 'Not open' },
    { event: 'World Grand Prix', level: 'Major TV', prize: '£600k', date: 'Oct 5', deadline: 'Sep 15', status: 'Not open' },
  ];
  return (
    <div className="space-y-6">

      <SectionHeader icon="🗓️" title="Tournament Schedule 2025" subtitle="PDC calendar with entry status, prize funds, and deadlines." />

      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 text-xs text-red-400 font-medium">
        <AlertCircle className="w-3.5 h-3.5 inline mr-1" /> 2 entry deadlines in next 7 days
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Events Entered" value="24" sub="This season" color="red" />
        <StatCard label="Completed" value="8" color="teal" />
        <StatCard label="Upcoming" value="16" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Event</th><th className="text-left p-3">Level</th><th className="text-left p-3">Prize</th><th className="text-left p-3">Date</th><th className="text-left p-3">Entry Deadline</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200">{e.event}</td>
                <td className="p-3"><LevelBadge level={e.level} /></td>
                <td className="p-3 text-gray-300">{e.prize}</td>
                <td className="p-3 text-gray-400 text-xs">{e.date}</td>
                <td className={`p-3 text-xs ${e.deadline.includes('←') ? 'text-red-400 font-medium' : 'text-gray-400'}`}>{e.deadline}</td>
                <td className="p-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Withdrawal Tracker</div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="py-1.5 border-b border-gray-800/50">Prague Open — withdrawal deadline Apr 20. No fine if before deadline.</div>
          <div className="py-1.5 border-b border-gray-800/50">Players Ch 9/10 — withdrawal deadline Apr 25.</div>
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── THREE-DART AVERAGE VIEW ──────────────────────────────────────────────────
function ThreeDartAverageView({ player, onNavigate, session }: { player: DartsPlayer; onNavigate: (id: string) => void; session: SportsDemoSession }) {
  const matchAvgs = [
    { opp: 'Hump', avg: 94.2 }, { opp: 'Lit', avg: 99.8 }, { opp: 'MvG', avg: 96.1 },
    { opp: 'Price', avg: 101.4 }, { opp: 'Clay', avg: 98.7 }, { opp: 'Rock', avg: 103.2 },
    { opp: 'Bunt', avg: 95.4 }, { opp: 'Nopb', avg: 97.8 }, { opp: 'Smi', avg: 100.1 }, { opp: 'Wrig', avg: 96.8 },
  ];
  const chartW = 500, chartH = 180, padL = 35, padR = 100, padT = 15, padB = 30;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
  const yMin = 85, yMax = 110;

  return (
    <div className="space-y-6">

      <SectionHeader icon="🎯" title="Three-Dart Average Analysis" subtitle="Career averages, event breakdowns, and match-by-match trends." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Career Avg" value={player.threeDartAverage} color="red" />
        <StatCard label="Best Tournament" value="103.4" sub="Players Ch. Feb 2025" color="teal" />
        <StatCard label="First-9 Avg" value={player.firstNineAverage} color="orange" />
        <StatCard label="180s/Leg" value={player.oneEightiesPerLeg} color="purple" />
        <StatCard label="Highest Checkout" value={player.highestCheckout} sub="D12" color="blue" />
      </div>

      {/* Average by Event Type */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Average by Event Type</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">Event Type</th><th className="text-left p-3">Avg</th><th className="text-left p-3">180s/Leg</th></tr></thead>
          <tbody>
            {[
              { type: 'Major TV events', avg: '98.6', e: '0.91' },
              { type: 'European Tour', avg: '97.1', e: '0.79' },
              { type: 'Pro Tour', avg: '96.8', e: '0.82' },
              { type: 'Premier League', avg: '99.2', e: '0.88' },
            ].map((r, i) => (
              <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.type}</td><td className="p-3 text-gray-300">{r.avg}</td><td className="p-3 text-gray-300">{r.e}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Line Chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Last 10 Match Averages</div>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
          {[85, 90, 95, 100, 105, 110].map(v => {
            const y = padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
            return (<g key={v}><line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#1f2937" strokeWidth="0.5" /><text x={padL - 5} y={y + 3} textAnchor="end" fill="#6b7280" fontSize="8">{v}</text></g>);
          })}
          <line x1={padL} y1={padT + plotH - ((97.8 - yMin) / (yMax - yMin)) * plotH} x2={padL + plotW} y2={padT + plotH - ((97.8 - yMin) / (yMax - yMin)) * plotH} stroke="#EF9F27" strokeWidth="1" strokeDasharray="6 3" />
          <text x={padL + plotW + 5} y={padT + plotH - ((97.8 - yMin) / (yMax - yMin)) * plotH + 3} fill="#EF9F27" fontSize="8">Career avg (97.8)</text>
          <line x1={padL} y1={padT + plotH - ((94.1 - yMin) / (yMax - yMin)) * plotH} x2={padL + plotW} y2={padT + plotH - ((94.1 - yMin) / (yMax - yMin)) * plotH} stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3" />
          <text x={padL + plotW + 5} y={padT + plotH - ((94.1 - yMin) / (yMax - yMin)) * plotH + 3} fill="#6b7280" fontSize="8">Tour avg (94.1)</text>
          <polyline fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinejoin="round"
            points={matchAvgs.map((d, i) => `${padL + (i / (matchAvgs.length - 1)) * plotW},${padT + plotH - ((d.avg - yMin) / (yMax - yMin)) * plotH}`).join(' ')} />
          {matchAvgs.map((d, i) => {
            const x = padL + (i / (matchAvgs.length - 1)) * plotW;
            const y = padT + plotH - ((d.avg - yMin) / (yMax - yMin)) * plotH;
            return (<g key={i}><circle cx={x} cy={y} r="3.5" fill="#1D9E75" stroke="#0d0f1a" strokeWidth="1.5" /><text x={x} y={padT + plotH + 15} textAnchor="middle" fill="#6b7280" fontSize="7">{d.opp}</text></g>);
          })}
        </svg>
      </div>

      {/* Leg Scoring Breakdown */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Leg Scoring Breakdown</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '100+ scoring legs', value: '34%' }, { label: '140+ scoring legs', value: '18%' },
            { label: '180s', value: '12%' }, { label: 'Sub-60 legs', value: '8%' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="averages" player={player} session={session} />
    </div>
  );
}

// ─── CHECKOUT ANALYSIS VIEW ───────────────────────────────────────────────────
function CheckoutAnalysisView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const doubles = [
    { double: 'D20', rate: 47, attempts: 234, primary: true }, { double: 'D16', rate: 51, attempts: 198 },
    { double: 'D8', rate: 44, attempts: 156 }, { double: 'D4', rate: 43, attempts: 89 },
    { double: 'D18', rate: 39, attempts: 72 }, { double: 'D12', rate: 41, attempts: 68 },
    { double: 'Bull', rate: 28, attempts: 54 }, { double: 'D1', rate: 38, attempts: 31 },
  ];
  return (
    <div className="space-y-6">

      <SectionHeader icon="✅" title="Checkout & Finishing Analysis" subtitle="Double hit rates, checkout routes, and pressure finishing data." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Checkout %" value="42.3%" sub="Season average" color="red" />
        <StatCard label="Tour Average" value="40.8%" sub="Above average" color="teal" />
        <StatCard label="Darts at Double" value="1.84" sub="Per attempt" color="orange" />
        <StatCard label="Highest Checkout" value="164" sub="D12" color="purple" />
      </div>

      {/* Doubles Bar Chart */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Favourite Doubles — Hit Rate</div>
        <div className="space-y-3">
          {doubles.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-400 text-right font-medium">{d.double}</div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-800 rounded-full h-5">
                  <div className="h-5 rounded-full bg-teal-600/60 flex items-center justify-end pr-2" style={{ width: `${d.rate}%` }}>
                    <span className="text-[10px] text-white font-bold">{d.rate}%</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 w-24 text-right">
                {d.attempts} attempts {d.primary && <span className="text-red-400 ml-1">primary</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-600 mt-3">Dashed line: tour average 40.8%</div>
      </div>

      {/* Common Checkout Routes */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Common Checkout Routes</div>
        <div className="space-y-2">
          {[
            { co: '170', detail: 'Hit 3 times this season', route: 'T20-T20-Bull' },
            { co: '167', detail: 'Hit 1 time', route: 'T20-T19-Bull' },
            { co: '164', detail: 'Hit 2 times — season best', route: 'T20-T18-D14' },
            { co: '121', detail: '68% success', route: 'T17-D20 preferred route' },
            { co: '81', detail: '71% success', route: 'T19-D12 preferred route' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-sm font-bold text-red-400">{c.co}</div>
              <div className="flex-1"><div className="text-sm text-gray-200">{c.route}</div><div className="text-xs text-gray-500">{c.detail}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Under Pressure */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Under Pressure Stats</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Match darts hit %', value: '38.4%' }, { label: '1st dart at double', value: '61% D20/D16' },
            { label: 'Leg 5 (deciding) CO%', value: '44.1%' }, { label: '1 dart: 29%', value: '2 darts: 41%' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold">{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 180s */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">180s Analysis</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total 180s (season)', value: '142' }, { label: 'Per match', value: '3.2' },
            { label: 'Best match', value: '8' }, { label: 'PDC ranking', value: '#14' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="checkout" player={player} session={session} />
    </div>
  );
}

// ─── OPPONENT INTEL VIEW ──────────────────────────────────────────────────────
function OpponentIntelView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🔍" title="Opponent Intelligence" subtitle="Scouting, H2H records, and tactical briefings." />

      {/* Tonight's Opponent */}
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">TONIGHT&apos;S OPPONENT</div>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center text-2xl">🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>
          <div>
            <div className="text-white font-bold text-lg">Gerwyn Price (#7 PDC)</div>
            <div className="text-gray-400 text-sm">&quot;The Iceman&quot; — Welsh</div>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          {[
            { label: '3-Dart Avg', value: '96.2' }, { label: 'Checkout %', value: '40.1%' },
            { label: '180s/Leg', value: '0.79' }, { label: 'First-9 Avg', value: '70.8' },
            { label: 'Pref Double', value: 'D16 (52%)' }, { label: 'Weakness', value: 'CO drops set 3+' },
          ].map((s, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-white font-bold">{s.value}</div><div className="text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* H2H */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">H2H — Jake vs Price (Last 7)</div>
        <div className="text-lg text-white font-bold mb-2">Jake leads 4-3</div>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="py-1 border-b border-gray-800/50">Last: Price won 6-4 · Players Championship · Oct 2024</div>
          <div className="py-1 border-b border-gray-800/50">Jake won 6-5 · European Tour · Sep 2024</div>
          <div className="py-1 border-b border-gray-800/50">Price won 6-3 · World Matchplay · Jul 2024</div>
        </div>
      </div>

      {/* Tactical Briefing */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Tactical Briefing</div>
        <div className="space-y-3">
          {[
            { title: 'Attack early', detail: 'Price\'s average in legs 1-3 of a set drops when opponent leads. Win the first 2 legs of each set aggressively.' },
            { title: 'Target D16 in checkout', detail: 'Price leaves this double poorly when under pressure. Force him to a double he\'s uncomfortable with by leaving 32s.' },
            { title: 'Maintain your own pace', detail: 'Price uses slow deliberate throws to disrupt rhythm. Stick to your 18-second routine regardless of his tempo.' },
          ].map((t, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-white font-medium mb-1">{t.title}</div>
              <div className="text-xs text-gray-400">{t.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Draw Analysis */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Draw Analysis — If Jake Wins Tonight</div>
        <div className="space-y-2">
          {[
            { round: 'QF potential', opp: 'Luke Littler (#2)', avg: '104.1', h2h: 'Jake 1-5' },
            { round: 'SF potential', opp: 'Michael van Gerwen (#3)', avg: '98.7', h2h: 'Jake 2-6' },
            { round: 'Final potential', opp: 'Luke Humphries (#1)', avg: '97.4', h2h: 'Jake 3-3' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <span className="text-xs text-gray-500 w-24">{d.round}</span>
              <span className="text-sm text-gray-200 flex-1">{d.opp}</span>
              <span className="text-xs text-gray-400">avg {d.avg}</span>
              <span className="text-xs text-gray-500 ml-3">H2H: {d.h2h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Player Database</div>
        <input type="text" placeholder="Search PDC player..." className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-red-500 focus:outline-none mb-3" />
        <div className="flex gap-2">
          {['MvG', 'Humphries', 'Bunting', 'Rock'].map(p => (
            <span key={p} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded cursor-pointer hover:text-white">{p}</span>
          ))}
        </div>
      </div>
      <DartsAISection context="opponentintel" player={player} session={session} />
    </div>
  );
}

// ─── PRACTICE LOG VIEW ────────────────────────────────────────────────────────
function PracticeLogView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [practiceTab, setPracticeTab] = useState<'log' | 'stats' | 'goals'>('log');
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, { loading: boolean; result: string | null }>>({});

  const sessions = [
    { date: 'Apr 14', type: 'Doubles Finishing', duration: '90 min', avg: '98.4', doubles: '44%', e180: '12', notes: 'Good session, D20 feeling reliable. D8 still inconsistent under pressure.' },
    { date: 'Apr 13', type: 'Scoring Practice', duration: '60 min', avg: '101.2', doubles: '—', e180: '—', notes: 'Excellent scoring session. Ready for European Championship.' },
    { date: 'Apr 12', type: 'Full match sim', duration: '120 min', avg: '96.8', doubles: '—', e180: '—', notes: 'Solid preparation. Keep first-9 above 72 consistently.' },
    { date: 'Apr 11', type: 'Mental prep', duration: '30 min', avg: '—', doubles: '—', e180: '—', notes: 'Session with Dr. Reed — focused on Price match mental prep.' },
    { date: 'Apr 10', type: 'Checkout clinic', duration: '75 min', avg: '—', doubles: '51%', e180: '—', notes: 'Best checkout session in 3 weeks. D16 clicking well.' },
  ];

  const handleAiAnalysis = async (idx: number) => {
    setAiAnalysis(prev => ({ ...prev, [idx]: { loading: true, result: null } }));
    const s = sessions[idx];
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: `Analyse this darts practice session for Jake Morrison (PDC #19, 97.8 avg). Session: ${s.date}, Type: ${s.type}, Duration: ${s.duration}, Avg: ${s.avg}, Doubles hit: ${s.doubles}, 180s: ${s.e180}. Notes: ${s.notes}. Give 3 technical observations, 2 focus areas for next session, 1 tactical pattern to develop. Be concise.` }] }),
      });
      const data = await res.json();
      setAiAnalysis(prev => ({ ...prev, [idx]: { loading: false, result: data.content?.[0]?.text || 'No response.' } }));
    } catch { setAiAnalysis(prev => ({ ...prev, [idx]: { loading: false, result: 'Error generating analysis.' } })); }
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="📋" title="Practice Log" subtitle="Session tracking, metrics, and training goals." />

      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {(['log', 'stats', 'goals'] as const).map(t => (
          <button key={t} onClick={() => setPracticeTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${practiceTab === t ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{t}</button>
        ))}
      </div>

      {practiceTab === 'log' && (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i}>
              <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div><div className="text-sm text-white font-medium">{s.date} — {s.type}</div><div className="text-xs text-gray-500">{s.duration}</div></div>
                  <button onClick={() => handleAiAnalysis(i)} disabled={aiAnalysis[i]?.loading} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors disabled:opacity-50">
                    {aiAnalysis[i]?.loading ? 'Analysing...' : aiAnalysis[i]?.result ? 'Re-analyse' : 'AI Analysis'}
                  </button>
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mb-2">
                  {s.avg !== '—' && <span>Avg: {s.avg}</span>}
                  {s.doubles !== '—' && <span>Doubles: {s.doubles}</span>}
                  {s.e180 !== '—' && <span>180s: {s.e180}</span>}
                </div>
                <div className="text-xs text-gray-500">{s.notes}</div>
              </div>
              {aiAnalysis[i]?.loading && (
                <div className="mt-2 bg-red-600/5 border border-red-600/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-red-400"><div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>Analysing session...</div>
                </div>
              )}
              {aiAnalysis[i]?.result && !aiAnalysis[i]?.loading && (
                <div className="mt-2 bg-red-600/5 border border-red-600/20 rounded-xl p-3">
                  <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-1">AI Analysis</div>
                  <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{aiAnalysis[i].result}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {practiceTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Last 7 Days" value="5 sessions" sub="7.5 hours" color="red" />
            <StatCard label="Monthly" value="18 sessions" sub="28 hours" color="teal" />
            <StatCard label="Best Streak" value="9 days" sub="Consecutive" color="orange" />
            <StatCard label="Practice vs Match" value="+1.4" sub="Avg lift after heavy week" color="purple" />
          </div>
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-2">Practice Average This Week</div>
            <div className="text-3xl font-bold text-white">99.2</div>
            <div className="text-xs text-gray-500 mt-1">vs match average of 97.8 — good correlation</div>
          </div>
        </div>
      )}

      {practiceTab === 'goals' && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Training Goals</div>
          <div className="space-y-3">
            {[
              { goal: 'Checkout % above 44%', current: '42.3%', done: false },
              { goal: 'First-9 average above 73', current: '72.4', done: false },
              { goal: '180s per leg above 0.80', current: '0.84', done: true },
              { goal: 'Win European Tour event this season', current: 'Prague — entered', done: true },
              { goal: 'Reach top 16 Order of Merit by year end', current: '#19 currently', done: false },
            ].map((g, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${g.done ? 'border-teal-600/30 bg-teal-600/5' : 'border-gray-800 bg-[#0a0c14]'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${g.done ? 'border-teal-500 bg-teal-500/20' : 'border-gray-600'}`}>
                  {g.done && <CheckCircle className="w-3 h-3 text-teal-400" />}
                </div>
                <div className="flex-1"><div className={`text-sm ${g.done ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{g.goal}</div><div className="text-xs text-gray-500">{g.current}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <DartsAISection context="practicelog" player={player} session={session} />
    </div>
  );
}

// ─── MATCH REPORTS VIEW ───────────────────────────────────────────────────────
function MatchReportsView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<Record<string, string>>({});
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const matches = [
    { id: 'dm1', opp: 'Jonny Clayton', rank: 10, event: 'Euro Championship QF', score: '6-3', avg: '101.4', result: 'W', date: '10 Apr' },
    { id: 'dm2', opp: 'Josh Rock', rank: 12, event: 'Euro Championship R2', score: '6-4', avg: '98.7', result: 'W', date: '9 Apr' },
    { id: 'dm3', opp: 'Stephen Bunting', rank: 15, event: 'Euro Championship R1', score: '6-2', avg: '99.2', result: 'W', date: '8 Apr' },
    { id: 'dm4', opp: 'Luke Littler', rank: 2, event: 'German Masters SF', score: '3-6', avg: '94.1', result: 'L', date: '3 Apr' },
    { id: 'dm5', opp: 'Callan Rydz', rank: 28, event: 'German Masters QF', score: '6-1', avg: '103.8', result: 'W', date: '2 Apr' },
    { id: 'dm6', opp: 'Gerwyn Price', rank: 7, event: 'Players Ch.', score: '4-6', avg: '96.2', result: 'L', date: '28 Mar' },
  ];

  const handleGenerate = async (m: typeof matches[0]) => {
    setGeneratingReport(m.id);
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: `Write a post-match analysis for Jake 'The Hammer' Morrison (PDC #19) who ${m.result === 'W' ? 'won' : 'lost'} against ${m.opp} (#${m.rank}) at the ${m.event}, score ${m.score}, 3-dart average ${m.avg}. Include: 1) Match summary (2 sentences), 2) Key moments (3 bullet points), 3) What worked (2 bullet points), 4) Areas to improve (2 bullet points), 5) One tactical note for the rematch. Write in a professional darts analyst voice.` }] }),
      });
      const data = await res.json();
      setReportContent(prev => ({ ...prev, [m.id]: data.content?.[0]?.text ?? 'No response' }));
      setActiveReport(m.id);
    } catch { setReportContent(prev => ({ ...prev, [m.id]: 'Error generating report. Please try again.' })); setActiveReport(m.id); }
    setGeneratingReport(null);
  };

  return (
    <div className="space-y-6">

      <SectionHeader icon="📄" title="Match Reports & AI Summaries" subtitle="Post-match analysis and AI-generated reports." />
      <div className="space-y-3">
        {matches.map(m => (
          <div key={m.id}>
            <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.result === 'W' ? 'bg-teal-600/20 text-teal-400' : 'bg-red-600/20 text-red-400'}`}>{m.result}</div>
                  <div>
                    <div className="text-sm text-white font-medium">{m.score} vs {m.opp} <span className="text-gray-500 text-xs">#{m.rank}</span></div>
                    <div className="text-xs text-gray-500">{m.event} · avg {m.avg} · {m.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reportContent[m.id] && <button onClick={() => setActiveReport(activeReport === m.id ? null : m.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">{activeReport === m.id ? 'Hide' : 'View report'}</button>}
                  <button onClick={() => handleGenerate(m)} disabled={generatingReport === m.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors disabled:opacity-50">{generatingReport === m.id ? 'Generating...' : reportContent[m.id] ? 'Regenerate' : 'Generate AI summary'}</button>
                </div>
              </div>
            </div>
            {generatingReport === m.id && <div className="mt-2 bg-red-600/5 border border-red-600/20 rounded-xl p-4"><div className="flex items-center gap-2 text-xs text-red-400"><div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>Generating match analysis...</div></div>}
            {activeReport === m.id && reportContent[m.id] && !generatingReport && (
              <div className="mt-2 bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><div className="text-sm font-semibold text-white">AI Match Analysis</div><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Generated by Claude</span></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigator.clipboard.writeText(reportContent[m.id])} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Copy</button>
                    <button onClick={() => alert('Sent to coach & manager ✓')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">Share with team</button>
                  </div>
                </div>
                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{reportContent[m.id]}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── VIDEO LIBRARY VIEW ───────────────────────────────────────────────────────
function VideoLibraryView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [videoTab, setVideoTab] = useState<'match' | 'practice' | 'analysis' | 'walkons'>('match');
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
  return (
    <div className="space-y-6">

      <SectionHeader icon="🎬" title="Video Library" subtitle="Match footage, practice clips, analysis, and walk-ons." />

      <div className="flex gap-1 bg-[#0d0f1a] border border-gray-800 rounded-lg p-1 w-fit">
        {([['match', 'Match footage'], ['practice', 'Practice'], ['analysis', 'Analysis'], ['walkons', 'Walk-ons']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setVideoTab(id)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${videoTab === id ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>

      {videoTab === 'match' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Euro Ch. QF vs Clayton', date: 'Apr 10', dur: '38 min', note: 'Avg 101.4 · 6-3 win' },
            { title: 'German Masters SF vs Littler', date: 'Apr 3', dur: '52 min', note: 'Avg 94.1 · 3-6 loss' },
            { title: 'World Ch. R2 vs Smith', date: 'Jan 8', dur: '44 min', note: 'Avg 97.8 · 6-4 loss' },
            { title: 'Players Ch. vs Price', date: 'Mar 28', dur: '31 min', note: 'Avg 96.2 · 4-6 loss' },
          ].map((v, i) => (
            <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
              <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15) 0%, rgba(234,88,12,0.1) 100%)' }}>🎬</div>
              <div className="p-4">
                <div className="text-sm text-white font-medium mb-1">{v.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500"><span>{v.date}</span><span>{v.dur}</span></div>
                <div className="text-xs text-gray-400 mt-1">{v.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {videoTab === 'practice' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Doubles clinic Apr 13', dur: '22 min' },
            { title: 'Checkout practice Apr 10', dur: '18 min' },
          ].map((v, i) => (
            <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
              <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15) 0%, rgba(234,88,12,0.1) 100%)' }}>📋</div>
              <div className="p-4"><div className="text-sm text-white font-medium mb-1">{v.title}</div><div className="text-xs text-gray-500">{v.dur}</div></div>
            </div>
          ))}
        </div>
      )}

      {videoTab === 'analysis' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center"><span className="text-xs font-bold text-red-400">DC</span></div>
                <div><div className="text-white font-bold">Dartboard Camera Analysis</div><div className="text-xs text-gray-400">AI-powered throwing analysis</div><div className="text-xs text-red-400 mt-0.5">Not connected</div></div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30">Connect Camera</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'vs Clayton QF: Throwing arc analysis', stat: '94% consistent release angle' },
              { title: 'Doubles routine: D20 dwell time', stat: 'avg 16.2 seconds (optimal range)' },
              { title: 'Practice session Apr 13: Stance drift detected', stat: 'left foot moving 2cm' },
            ].map((a, i) => (
              <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
                <div className="h-20 flex items-center justify-center text-3xl relative" style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.15) 0%, rgba(234,88,12,0.1) 100%)' }}>
                  🎯<span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30 font-medium">Camera AI</span>
                </div>
                <div className="p-4">
                  <div className="text-sm text-white font-medium mb-1">{a.title}</div>
                  <div className="text-xs text-gray-400">{a.stat}</div>
                  <button onClick={() => setExpandedAnalysis(expandedAnalysis === i ? null : i)} className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 transition-colors">{expandedAnalysis === i ? 'Hide' : 'View Analysis'}</button>
                  {expandedAnalysis === i && <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">Detailed analysis would appear here when camera system is connected.</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videoTab === 'walkons' && (
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Walk-On Music</div>
          <div className="text-lg text-white font-bold mb-1">Enter Sandman — Metallica</div>
          <div className="text-xs text-gray-500">Used since PDC debut (2019). Crowd favourite at Ally Pally.</div>
        </div>
      )}
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── TEAM HUB VIEW ────────────────────────────────────────────────────────────
function TeamHubView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const team = [
    { name: 'Jake Morrison', role: 'Player', contact: 'jake@jakemorrison.com', detail: 'Tour player since 2019' },
    { name: 'Dave Harris', role: 'Manager', contact: 'dave@dhsports.com', detail: 'DH Sports Management' },
    { name: 'Phil "The Coach"', role: 'Practice Coach', contact: 'Freelance', detail: '3x sessions/week' },
    { name: 'Dr. Sarah Reed', role: 'Sports Psychologist', contact: 'dreed@mindgolf.com', detail: 'Monthly sessions' },
    { name: 'Tom Wilkins', role: 'Physio', contact: 'tom@sportsphysio.com', detail: 'On-call' },
  ];
  const comms = [
    { msg: 'Match prep complete — Price analysis sent to Jake. Good luck tonight!', from: 'Dave', time: '2h ago' },
    { msg: 'Shoulder feeling much better after this morning\'s session.', from: 'Jake', time: '4h ago' },
    { msg: 'Red Dragon confirmed the barrel review shoot at 14:00 today.', from: 'Dave', time: '5h ago' },
    { msg: 'Mental prep session scheduled for 11:30 before travel.', from: 'Dr. Reed', time: 'Yesterday' },
    { msg: 'New 24g barrels arrived — try them in practice today.', from: 'Tom', time: 'Yesterday' },
  ];
  return (
    <div className="space-y-6">

      <SectionHeader icon="👥" title="Team Hub" subtitle="Team members and communication feed." />
      <div className="space-y-3">
        {team.map((t, i) => (
          <div key={i} className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-lg">👤</div>
            <div className="flex-1"><div className="text-sm text-white font-medium">{t.name}</div><div className="text-xs text-gray-500">{t.role} · {t.detail}</div></div>
            <div className="text-xs text-gray-500">{t.contact}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Team Feed</div>
        <div className="space-y-3">
          {comms.map((c, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-sm text-gray-300">{c.msg}</div>
              <div className="text-xs text-gray-600 mt-1">— {c.from}, {c.time}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── MENTAL PERFORMANCE VIEW ──────────────────────────────────────────────────
function MentalPerformanceView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🧠" title="Mental Performance" subtitle="Pre-match routines, pressure data, and psychology sessions." />

      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5 text-center">
        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">Readiness Score Today</div>
        <div className="text-4xl font-bold text-white">82<span className="text-lg text-gray-400">/100</span></div>
        <div className="text-xs text-teal-400 mt-1">Good — optimal for competition</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pre-Match Routine</div>
        <div className="space-y-2">
          {[
            { time: '60 min before', task: 'Arrive, find quiet space' },
            { time: '45 min before', task: 'Warm-up throws (not competitive, just feel)' },
            { time: '30 min before', task: 'Dr. Reed breathing protocol' },
            { time: '15 min before', task: 'Walk-on music, visualisation' },
            { time: 'Walk-on', task: 'Enter Sandman — full crowd immersion' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-24">{r.time}</span>
              <span className="text-sm text-gray-300">{r.task}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pressure Situations Tracker</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Match darts hit', value: '38.4%' },
            { label: 'Break of throw', value: '52.1%' },
            { label: 'Leg-5 deciding', value: '61%' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Dr. Reed — Recent Sessions</div>
        <div className="space-y-2">
          {[
            { date: 'Apr 11', note: 'Pre-match visualisation for Price. Focus on own process, not scoreboard.' },
            { date: 'Mar 20', note: 'Reviewed German Masters loss vs Littler. Reset confidence after 3-6.' },
            { date: 'Feb 14', note: 'Performance anxiety under lights — crowd management techniques.' },
          ].map((s, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-xs text-red-400 font-medium">{s.date}</div>
              <div className="text-sm text-gray-400 mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="mental" player={player} session={session} />
    </div>
  );
}

// ─── SPONSORSHIP VIEW ─────────────────────────────────────────────────────────
function SponsorshipView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🤝" title="Sponsorship & Commercial" subtitle="Active deals, obligations, pipeline, and content calendar." />

      {/* Active Sponsors */}
      {[
        { name: 'Red Dragon Darts', value: '£48,000/yr', renewal: '23 days remaining', renewalUrgent: true, obligations: 'Barrel use (required), 2 social posts/month, 4 content videos/yr', contentDue: 'Barrel review video (today 14:00) — SCHEDULED', nextPayment: 'May 1 (£4,000)', contact: 'Sarah Mills — sarah@reddragon.com' },
        { name: 'Ladbrokes', value: '£24,000/yr', renewal: '8 months', renewalUrgent: false, obligations: 'Odds graphic shares (PDC events), 1 interview/quarter', contentDue: 'Post-match interview tonight (if Jake wins)', nextPayment: 'Jun 1 (£6,000)', contact: 'Ben Clarke — ben@ladbrokes.com' },
      ].map((s, i) => (
        <div key={i} className={`bg-[#0d0f1a] border ${s.renewalUrgent ? 'border-red-600/30' : 'border-gray-800'} rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-bold">{s.name}</div>
            <div className="text-sm text-gray-300">{s.value}</div>
          </div>
          <div className={`text-xs mb-3 ${s.renewalUrgent ? 'text-red-400 font-medium' : 'text-gray-500'}`}>Renewal: {s.renewal} {s.renewalUrgent && '— RED ALERT'}</div>
          <div className="space-y-1 text-xs text-gray-400">
            <div>Obligations: {s.obligations}</div>
            <div>Content due: {s.contentDue}</div>
            <div>Next payment: {s.nextPayment}</div>
            <div className="text-gray-500">Contact: {s.contact}</div>
          </div>
        </div>
      ))}

      {/* Pipeline */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pipeline</div>
        <div className="space-y-3">
          {[
            { name: 'Unicorn Darts', detail: 'Approached Jake\'s manager in March. Offer pending: £35k/yr barrel + accessories deal' },
            { name: 'Flutter/Betfair', detail: 'Pre-match stats partnership — £8k/event for 4 major TV events. Under review.' },
          ].map((p, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-sm text-white font-medium">{p.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Calendar */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Content Calendar This Month</div>
        <div className="space-y-2">
          {[
            { week: 'Week 1', content: 'Red Dragon barrel review', status: 'TODAY ✓ scheduled' },
            { week: 'Week 2', content: 'Behind-the-scenes European Championship', status: 'pending' },
            { week: 'Week 3', content: 'Practice routine walkthrough — YouTube', status: 'planned' },
            { week: 'Week 4', content: 'Ladbrokes odds reaction video', status: 'planned' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-500 w-16">{c.week}</span>
              <span className="text-sm text-gray-300 flex-1">{c.content}</span>
              <span className={`text-xs ${c.status.includes('TODAY') ? 'text-teal-400' : 'text-gray-500'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="sponsorship" player={player} session={session} />
    </div>
  );
}

// ─── EXHIBITION MANAGER VIEW ──────────────────────────────────────────────────
function ExhibitionManagerView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🎪" title="Exhibition Manager" subtitle="Bookings, fees, and exhibition performance." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="This Season" value="34" sub="Exhibitions" color="red" />
        <StatCard label="Earned" value="£68,400" sub="Exhibition income" color="teal" />
        <StatCard label="Avg Fee" value="£2,012" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Upcoming Exhibitions</div>
        <div className="space-y-3">
          {[
            { date: 'Apr 22', venue: 'Preston Social Club', loc: 'Preston', fee: '£1,800', status: 'Enquiry', note: 'Respond by Apr 18' },
            { date: 'Apr 28', venue: 'Sheffield Sports Bar', loc: 'Sheffield', fee: '£2,200', status: 'Confirmed' },
            { date: 'May 3', venue: 'Edinburgh Darts Festival', loc: 'Edinburgh', fee: '£3,500', status: 'Confirmed' },
            { date: 'May 10', venue: 'Manchester Corporate Event', loc: 'Manchester', fee: '£4,000', status: 'Confirmed' },
            { date: 'May 18', venue: 'Dublin Darts Night', loc: 'Dublin', fee: '£2,800', status: 'Pending contract' },
          ].map((e, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div><div className="text-sm text-white font-medium">{e.venue}</div><div className="text-xs text-gray-500">{e.loc} · {e.date}</div></div>
                <div className="text-right"><div className="text-sm text-white font-medium">{e.fee}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${e.status === 'Confirmed' ? 'bg-teal-600/20 text-teal-400' : e.status === 'Enquiry' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-600/20 text-gray-400'}`}>{e.status}</span>
                </div>
              </div>
              {e.note && <div className="text-xs text-amber-400">{e.note}</div>}
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 rounded text-xs bg-teal-600/20 text-teal-400 border border-teal-600/30">Confirm</button>
                <button className="px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 border border-red-600/30">Decline</button>
                <button className="px-3 py-1 rounded text-xs text-gray-500 hover:text-gray-300">More Info</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Guide */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Fee Calculator Guide</div>
        <div className="space-y-1">
          {[
            { type: 'Standard league club (local)', fee: '£1,500' },
            { type: 'Social club (100+ miles)', fee: '£2,000–£2,500' },
            { type: 'Corporate event', fee: '£3,500–£6,000' },
            { type: 'Festival/major venue', fee: '£4,000–£8,000' },
            { type: 'International', fee: '£5,000+ + flights + hotel' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <span className="text-gray-400">{f.type}</span><span className="text-gray-200 font-medium">{f.fee}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Past Exhibitions */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Past Exhibitions — 2025</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { month: 'Jan', count: 6, earned: '£11,400' }, { month: 'Feb', count: 8, earned: '£16,200' },
            { month: 'Mar', count: 11, earned: '£23,400' }, { month: 'Apr', count: 9, earned: '£17,400' },
          ].map((m, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">{m.month}</div>
              <div className="text-white font-bold">{m.count}</div>
              <div className="text-xs text-teal-400">{m.earned}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── MEDIA CONTENT VIEW ───────────────────────────────────────────────────────
function MediaContentView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="📱" title="Media & Content" subtitle="Obligations, social stats, content pipeline, and press coverage." />

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Upcoming Media Obligations</div>
        <div className="space-y-2">
          {[
            { date: 'TODAY', item: 'Red Dragon barrel review video (14:00) — YouTube' },
            { date: 'Tonight', item: 'Ladbrokes post-match interview (if wins)' },
            { date: 'Apr 18', item: 'Sky Sports preview piece submission' },
            { date: 'Apr 22', item: 'PDC player profile update' },
            { date: 'Apr 28', item: 'Red Dragon social post (Prague Open week)' },
          ].map((o, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className={`text-xs font-medium w-16 ${o.date === 'TODAY' || o.date === 'Tonight' ? 'text-red-400' : 'text-gray-500'}`}>{o.date}</span>
              <span className="text-sm text-gray-300">{o.item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Twitter/X" value="84K" sub="Followers" color="blue" />
        <StatCard label="Instagram" value="62K" sub="Followers" color="purple" />
        <StatCard label="TikTok" value="31K" sub="Followers" color="red" />
        <StatCard label="YouTube" value="18K" sub="Subscribers" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Content Pipeline</div>
        <div className="space-y-3">
          {[
            { title: 'Behind the scenes: European Championship', status: 'In progress', due: 'Apr 26' },
            { title: 'My dart setup explained — Red Dragon collab', status: 'Scheduled', due: 'TODAY 14:00' },
            { title: 'Practice routine walkthrough', status: 'Planned', due: 'May 1' },
            { title: 'Tournament life vlog — Dortmund', status: 'Filming tonight', due: '' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="flex-1"><div className="text-sm text-gray-200">{c.title}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'Scheduled' || c.status === 'Filming tonight' ? 'bg-teal-600/20 text-teal-400' : c.status === 'In progress' ? 'bg-amber-600/20 text-amber-400' : 'bg-gray-600/20 text-gray-400'}`}>{c.status}</span>
              {c.due && <span className="text-xs text-gray-500 ml-3">{c.due}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Press Coverage</div>
        <div className="space-y-2">
          {[
            { headline: 'Morrison targets top 16 with strong European Tour form', source: 'DartsNews.com', date: 'Apr 12' },
            { headline: 'The Hammer\'s rise: How Jake Morrison became a PDC contender', source: 'Sky Sports', date: 'Mar 28' },
            { headline: 'Morrison signs extended Red Dragon deal amid Premier League push', source: 'DartsWorld', date: 'Feb 15' },
          ].map((a, i) => (
            <div key={i} className="py-2 border-b border-gray-800/50">
              <div className="text-sm text-gray-200">{a.headline}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.source} · {a.date}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── FINANCIAL DASHBOARD VIEW ─────────────────────────────────────────────────
function FinancialDashboardView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="💰" title="Financial Dashboard" subtitle="Earnings, expenses, and career financial summary." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Prize Money" value="£124,800" sub="YTD" color="red" />
        <StatCard label="Sponsorship" value="£36,000" sub="Q1 payments" color="purple" />
        <StatCard label="Exhibitions" value="£68,400" sub="34 events" color="teal" />
        <StatCard label="Total Gross" value="£229,200" sub="2025 YTD" color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Income Breakdown</div>
          <div className="space-y-2">
            {[
              { label: 'Prize money', value: '£124,800' }, { label: 'Sponsorship', value: '£36,000' },
              { label: 'Exhibitions', value: '£68,400' }, { label: 'Total gross', value: '£229,200' },
              { label: 'Tax (40%)', value: '-£91,680' }, { label: 'Net', value: '£137,520' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-1.5 ${i < 5 ? 'border-b border-gray-800/50' : ''}`}>
                <span className={`text-sm ${i === 5 ? 'text-white font-bold' : i === 4 ? 'text-red-400' : 'text-gray-400'}`}>{r.label}</span>
                <span className={`text-sm ${i === 5 ? 'text-teal-400 font-bold' : i === 4 ? 'text-red-400' : 'text-gray-200'}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Expenses</div>
          <div className="space-y-2">
            {[
              { label: 'Travel & accommodation', value: '£28,400' }, { label: 'Physio & medical', value: '£4,200' },
              { label: 'Coaching fees', value: '£6,000' }, { label: 'Equipment', value: '£1,800' },
              { label: 'Manager commission (15%)', value: '£34,380' }, { label: 'Total expenses', value: '£74,780' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-1.5 ${i < 5 ? 'border-b border-gray-800/50' : ''}`}>
                <span className={`text-sm ${i === 5 ? 'text-white font-bold' : 'text-gray-400'}`}>{r.label}</span>
                <span className={`text-sm ${i === 5 ? 'text-red-400 font-bold' : 'text-gray-200'}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Prize Money Pending</div>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="py-1.5 border-b border-gray-800/50">Players Ch. April event: £4,200 — <span className="text-amber-400">PDC payment pending 30 days</span></div>
          <div className="py-1.5">European Tour Prague: TBC — based on result</div>
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Career Earnings by Year</div>
        <div className="flex items-end gap-3 h-32">
          {[
            { year: '2021', amount: 48200 }, { year: '2022', amount: 89400 }, { year: '2023', amount: 142800 },
            { year: '2024', amount: 183200 }, { year: '2025', amount: 229200 },
          ].map((y, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">£{(y.amount / 1000).toFixed(0)}k</div>
              <div className="w-full bg-red-600/40 rounded-t" style={{ height: `${(y.amount / 230000) * 80}px` }}></div>
              <div className="text-xs text-gray-600">{y.year}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="financial" player={player} session={session} />
    </div>
  );
}

// ─── AGENT PIPELINE VIEW ──────────────────────────────────────────────────────
function AgentPipelineView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="📬" title="Agent Pipeline" subtitle="Deal flow, negotiations, and agent activity." />

      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="text-white font-bold">Dave Harris — DH Sports Management</div>
        <div className="text-xs text-gray-400 mt-1">15% commission · Active deals: Red Dragon (£48k), Ladbrokes (£24k)</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Pipeline Deals</div>
        <div className="space-y-3">
          {[
            { name: 'Unicorn Darts', stage: 'Offer stage', value: '£35k/yr', note: 'Counter-offer sent Apr 10' },
            { name: 'Flutter/Betfair', stage: 'Negotiation', value: '£8k/event', note: 'Legal review in progress' },
            { name: 'Beer brand (unnamed)', stage: 'Initial contact', value: 'TBC', note: 'Dave meeting reps Apr 20' },
            { name: 'Gym/fitness brand', stage: 'Prospecting', value: 'TBC', note: 'Approached via Instagram DM' },
          ].map((d, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-white font-medium">{d.name}</div>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/30">{d.stage}</span>
              </div>
              <div className="text-xs text-gray-400">{d.value} · {d.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Recent Agent Activity</div>
        <div className="space-y-2">
          {[
            { date: 'Apr 14', activity: 'Dave submitted counter-offer to Unicorn — awaiting response' },
            { date: 'Apr 12', activity: 'Jake approved Flutter NDA for signing' },
            { date: 'Apr 10', activity: 'Dave confirmed Edinburgh exhibition fee (£3,500)' },
            { date: 'Apr 8', activity: 'Red Dragon renewal meeting scheduled for May 2' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-14">{a.date}</span>
              <span className="text-xs text-gray-400">{a.activity}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── TRAVEL LOGISTICS VIEW ────────────────────────────────────────────────────
function TravelLogisticsView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="✈️" title="Travel & Logistics" subtitle="Flights, hotels, and travel planning." />

      <div className="bg-gradient-to-r from-blue-900/30 to-teal-900/20 border border-blue-600/30 rounded-xl p-5">
        <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">TODAY&apos;S TRAVEL</div>
        <div className="text-white font-bold text-lg">BA1234 · London Heathrow → Dortmund</div>
        <div className="text-sm text-gray-400">16:30 departure · Terminal 5 · Gate TBC (check 3h before)</div>
        <div className="text-sm text-gray-400 mt-1">Hotel: Pullman Dortmund · Confirmation: PDC2025-JAK19</div>
        <div className="text-sm text-gray-400 mt-1">PDC tournament transport: Coach pickup from hotel 18:00</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">This Month&apos;s Travel</div>
        <div className="space-y-2">
          {[
            { date: 'Apr 14', route: 'London → Dortmund', reason: 'European Ch.' },
            { date: 'Apr 17', route: 'Dortmund → London', reason: 'After European Ch.' },
            { date: 'Apr 22', route: 'London → Preston', reason: 'Exhibition (drive)' },
            { date: 'Apr 28', route: 'London → Prague', reason: 'European Tour' },
            { date: 'May 1', route: 'Prague → London', reason: '' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-blue-400 font-medium w-14">{t.date}</span>
              <span className="text-sm text-gray-200 flex-1">{t.route}</span>
              <span className="text-xs text-gray-500">{t.reason}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Flights" value="18" sub="This season" color="blue" />
        <StatCard label="Countries" value="9" sub="Visited" color="teal" />
        <StatCard label="Hotel Nights" value="47" color="orange" />
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Visa & Entry Requirements</div>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="py-1.5 border-b border-gray-800/50">EU events: No visa required (GBR passport)</div>
          <div className="py-1.5 border-b border-gray-800/50">Australia (World Series, Nov): ETA required — apply 6 weeks before</div>
          <div className="py-1.5">USA (Las Vegas, Dec): ESTA required — apply 72h before</div>
        </div>
      </div>
      <DartsAISection context="travel" player={player} session={session} />
    </div>
  );
}

// ─── TOUR CARD & Q-SCHOOL VIEW ────────────────────────────────────────────────
function TourCardQSchoolView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  return (
    <div className="space-y-6">

      <SectionHeader icon="🏛️" title="Tour Card & Q-School Status" subtitle="PDC Tour Card, Q-School history, and European Tour status." />

      <div className="bg-gradient-to-r from-teal-900/30 to-green-900/20 border border-teal-600/30 rounded-xl p-5">
        <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-2">TOUR CARD STATUS</div>
        <div className="text-white font-bold text-lg">PDC Tour Card — Secured via Order of Merit (top 64)</div>
        <div className="text-sm text-gray-400 mt-1">Valid through Dec 2026 · Current: #19 — SECURE (45 places above cut)</div>
        <div className="text-xs text-gray-500 mt-1">Projected year-end: #17–22 (based on current form)</div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Tour Card History</div>
        <div className="space-y-2">
          {[
            { year: '2019', note: 'Q-School — won card on Day 3' },
            { year: '2020', note: 'Retained — #41 Order of Merit' },
            { year: '2021', note: 'Retained — #33 Order of Merit' },
            { year: '2022', note: 'Retained — #28 Order of Merit' },
            { year: '2023', note: 'Retained — #21 Order of Merit' },
            { year: '2024', note: 'Retained — #19 Order of Merit (career best)' },
          ].map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-red-400 font-medium w-10">{h.year}</span>
              <span className="text-sm text-gray-300">{h.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Q-School Info (Reference)</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Next Q-School: January 2026 · Wigan (UK) / Hildesheim (EU)</div>
          <div>Format: 4 days, last 2 days are PDC Challenge Tour events</div>
          <div>Cards awarded: 32 (16 UK + 16 EU tour)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-2">European Tour Card</div>
          <div className="text-xs text-teal-400 mb-1">Retained — #18 European Tour ranking</div>
          <div className="text-xs text-gray-500">Must finish top 24 to retain</div>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-2">Challenge Tour Performance</div>
          <div className="text-xs text-gray-400">CT9: R2 (£500) · CT10: QF (£1,000) · CT11: DNP · CT12: SF (£2,000)</div>
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── EQUIPMENT SETUP VIEW ─────────────────────────────────────────────────────
function EquipmentSetupView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [activeSetup, setActiveSetup] = useState(0);
  const [tab, setTab] = useState<'specs' | 'performance' | 'changes' | 'compare'>('specs');

  const setups = [
    {
      id: 'tournament',
      name: 'Tournament — The Hammer SE',
      isActive: true,
      isTournament: true,
      isSponsored: true,
      sponsorName: 'Red Dragon Darts',
      contentRequired: true,
      playerRating: 9,
      matchesPlayed: 47,
      avgWithSetup: 97.8,
      checkoutPct: 42.3,
      dateIntroduced: 'Mar 2024',
      notes: 'Primary tournament setup. All PDC televised events and Euro Tour.',
      barrel: { brand: 'Red Dragon', model: 'Morrison "The Hammer" SE', weight: 24.0, material: '97% Tungsten', shape: 'Torpedo', grip: 'Micro', lengthMm: 52.0, diameterMm: 6.4, productCode: 'RD3879' as string | null },
      shaft: { brand: 'Red Dragon', model: 'Nitrotech Titanium', length: 'Medium', lengthMm: 41.0, material: 'Titanium', angle: 'Straight', colour: 'Gunmetal' },
      flight: { brand: 'Red Dragon', shape: 'Standard', material: 'Heavy duty', thicknessMicron: 150, colour: 'Black/Red', design: 'The Hammer signature' },
      point: { type: 'Steel tip', length: 'Medium (36mm)', style: 'Smooth' },
    },
    {
      id: 'practice',
      name: 'Practice setup',
      isActive: true,
      isTournament: false,
      isSponsored: true,
      sponsorName: 'Red Dragon Darts',
      contentRequired: false,
      playerRating: 8,
      matchesPlayed: 0,
      avgWithSetup: 99.3,
      checkoutPct: 44.1,
      dateIntroduced: 'Jan 2024',
      notes: '2g lighter than tournament setup. Slim flights for tighter T20 grouping. Doubles practice only.',
      barrel: { brand: 'Red Dragon', model: 'Morrison Practice Edition', weight: 22.0, material: '90% Tungsten', shape: 'Straight', grip: 'Ringed', lengthMm: 48.0, diameterMm: 6.2, productCode: null as string | null },
      shaft: { brand: 'Condor', model: 'Standard', length: 'Short', lengthMm: 34.0, material: 'Polycarbonate', angle: 'Straight', colour: 'Black' },
      flight: { brand: 'Winmau', shape: 'Slim', material: 'Standard polyester', thicknessMicron: 100, colour: 'Black', design: 'Plain' },
      point: { type: 'Steel tip', length: 'Medium (36mm)', style: 'Smooth' },
    },
    {
      id: 'backup',
      name: 'Backup v1 (retired)',
      isActive: false,
      isTournament: true,
      isSponsored: true,
      sponsorName: 'Red Dragon Darts',
      contentRequired: false,
      playerRating: 7,
      matchesPlayed: 32,
      avgWithSetup: 96.1,
      checkoutPct: 40.8,
      dateIntroduced: 'Sep 2023',
      notes: 'Retired Mar 2024. Knurled grip caused T20 pull-left under pressure. Kept as emergency backup.',
      barrel: { brand: 'Red Dragon', model: 'Morrison "The Hammer" v1', weight: 24.0, material: '95% Tungsten', shape: 'Torpedo', grip: 'Knurled', lengthMm: 51.0, diameterMm: 6.5, productCode: 'RD3712' as string | null },
      shaft: { brand: 'Red Dragon', model: 'Standard', length: 'Medium', lengthMm: 41.0, material: 'Nylon', angle: 'Straight', colour: 'Black' },
      flight: { brand: 'Red Dragon', shape: 'Standard', material: 'Heavy duty', thicknessMicron: 150, colour: 'Black', design: 'Plain' },
      point: { type: 'Steel tip', length: 'Medium (36mm)', style: 'Smooth' },
    },
  ];

  const changes = [
    { date: 'Mar 2024', description: 'Switched from v1 (knurled) to SE (micro grip) barrel', avgBefore: 96.1, avgAfter: 97.8, reason: 'Micro grip reduces T20 pull-left under pressure. Recommended by Marco after pressure analysis.' },
    { date: 'Jun 2024', description: 'Switched shaft from nylon to titanium (Nitrotech)', avgBefore: 97.1, avgAfter: 97.8, reason: 'Titanium eliminated shaft breakage at floor events. More consistent feel across long PC weekends.' },
  ];

  const current = setups[activeSetup];

  const specRow = (label: string, value: string | number | null | undefined) =>
    value != null ? (
      <div key={label} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-200 font-medium">{String(value)}</span>
      </div>
    ) : null;

  type Setup = typeof setups[0];
  const comparedSetups: Setup[] = [setups[0], setups[1]];
  const compareFields: [string, (s: Setup) => string][] = [
    ['Brand', s => s.barrel.brand],
    ['Model', s => s.barrel.model],
    ['Weight', s => `${s.barrel.weight}g`],
    ['Barrel shape', s => s.barrel.shape],
    ['Barrel grip', s => s.barrel.grip],
    ['Shaft material', s => s.shaft.material],
    ['Shaft length', s => `${s.shaft.length} (${s.shaft.lengthMm}mm)`],
    ['Flight shape', s => s.flight.shape],
    ['Flight thickness', s => `${s.flight.thicknessMicron}μm`],
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Equipment Setup</h1>
          <p className="text-gray-400 text-sm mt-1">Barrel · Shaft · Flight · Point · Performance tracking</p>
        </div>
        {current.isSponsored && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-gray-400">Sponsored by {current.sponsorName}</span>
            {current.contentRequired && (
              <span className="px-2 py-0.5 bg-amber-950/30 border border-amber-700/30 text-amber-400 rounded text-[10px]">Content due</span>
            )}
          </div>
        )}
      </div>

      {/* Setup selector */}
      <div className="flex gap-2 flex-wrap">
        {setups.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveSetup(i)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${activeSetup === i ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'bg-gray-900/40 border-white/5 text-gray-500 hover:text-gray-300'}`}
          >
            {s.name}
            {!s.isActive && <span className="ml-2 text-[10px] text-gray-600">retired</span>}
          </button>
        ))}
        <button className="px-4 py-2 rounded-xl border border-dashed border-white/10 text-gray-600 text-sm hover:text-gray-400 transition-colors">
          + Add setup
        </button>
      </div>

      {/* Performance strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Avg with setup', value: String(current.avgWithSetup), sub: `Since ${current.dateIntroduced}`, color: 'text-white' },
          { label: 'Checkout %', value: `${current.checkoutPct}%`, sub: '', color: 'text-white' },
          { label: 'Matches', value: current.matchesPlayed > 0 ? String(current.matchesPlayed) : 'Practice only', sub: '', color: 'text-white' },
          { label: 'Player rating', value: `${current.playerRating}/10`, sub: '', color: current.playerRating >= 9 ? 'text-green-400' : current.playerRating >= 7 ? 'text-amber-400' : 'text-red-400' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-medium ${k.color}`}>{k.value}</p>
            {k.sub && <p className="text-xs text-gray-600 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-white/5 overflow-hidden w-fit">
        {(['specs', 'performance', 'changes', 'compare'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium transition-colors border-r border-white/5 last:border-r-0 capitalize ${tab === t ? 'bg-red-600/20 text-red-300' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300'}`}>
            {t === 'changes' ? 'Change log' : t}
          </button>
        ))}
      </div>

      {/* SPECS */}
      {tab === 'specs' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-red-400 uppercase tracking-wide bg-red-500/10 px-2 py-0.5 rounded">Barrel</span>
              <span className="text-xs text-gray-600">{current.barrel.weight}g · {current.barrel.lengthMm}mm</span>
            </div>
            {specRow('Brand', current.barrel.brand)}
            {specRow('Model', current.barrel.model)}
            {specRow('Weight', `${current.barrel.weight}g`)}
            {specRow('Material', current.barrel.material)}
            {specRow('Shape', current.barrel.shape)}
            {specRow('Grip', current.barrel.grip)}
            {specRow('Length', `${current.barrel.lengthMm}mm`)}
            {specRow('Diameter', `${current.barrel.diameterMm}mm`)}
            {current.barrel.productCode && specRow('Product code', current.barrel.productCode)}
          </div>

          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wide bg-blue-500/10 px-2 py-0.5 rounded">Shaft</span>
              <span className="text-xs text-gray-600">{current.shaft.material} · {current.shaft.length}</span>
            </div>
            {specRow('Brand', current.shaft.brand)}
            {specRow('Model', current.shaft.model)}
            {specRow('Length', current.shaft.length)}
            {specRow('Length (mm)', `${current.shaft.lengthMm}mm`)}
            {specRow('Material', current.shaft.material)}
            {specRow('Angle', current.shaft.angle)}
            {specRow('Colour', current.shaft.colour)}
          </div>

          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide bg-amber-500/10 px-2 py-0.5 rounded">Flight</span>
              <span className="text-xs text-gray-600">{current.flight.shape} · {current.flight.thicknessMicron}μm</span>
            </div>
            {specRow('Brand', current.flight.brand)}
            {specRow('Shape', current.flight.shape)}
            {specRow('Material', current.flight.material)}
            {specRow('Thickness', `${current.flight.thicknessMicron} micron`)}
            {specRow('Colour', current.flight.colour)}
            {specRow('Design', current.flight.design)}
          </div>

          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-green-400 uppercase tracking-wide bg-green-500/10 px-2 py-0.5 rounded">Point</span>
              <span className="text-xs text-gray-600">{current.point.type}</span>
            </div>
            {specRow('Type', current.point.type)}
            {specRow('Length', current.point.length)}
            {specRow('Style', current.point.style)}
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-xs text-gray-600 leading-relaxed">{current.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* PERFORMANCE */}
      {tab === 'performance' && (
        <div className="space-y-4">
          <h2 className="text-white font-medium">Performance comparison across setups</h2>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Setup</span>
              <span>Matches</span>
              <span>Average</span>
              <span>Checkout %</span>
            </div>
            {setups.map((s, i) => (
              <div key={i} className={`grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm ${i === activeSetup ? 'bg-red-950/10' : ''}`}>
                <span className={`col-span-2 ${i === activeSetup ? 'text-red-300 font-medium' : 'text-gray-400'}`}>
                  {s.name}
                  {!s.isActive && <span className="text-gray-600 ml-1">(retired)</span>}
                </span>
                <span className="text-gray-400">{s.matchesPlayed || '—'}</span>
                <span className={i === activeSetup ? 'text-white font-medium' : 'text-gray-400'}>{s.avgWithSetup}</span>
                <span className={i === activeSetup ? 'text-white font-medium' : 'text-gray-400'}>{s.checkoutPct}%</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Coach notes</p>
            <p className="text-sm text-gray-300">
              &ldquo;The micro grip on the SE barrel has been the biggest positive change — Jake&apos;s T20 cluster tightened immediately after switching in March 2024. The titanium shaft gives a more consistent release point than nylon. Would not recommend changing anything before a major event.&rdquo;
            </p>
            <p className="text-xs text-gray-600 mt-2">— Marco · April 2025</p>
          </div>
        </div>
      )}

      {/* CHANGE LOG */}
      {tab === 'changes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-medium">Equipment change log</h2>
            <button className="px-3 py-1.5 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-gray-200">+ Log change</button>
          </div>
          <div className="space-y-3">
            {changes.map((c, i) => (
              <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-medium">{c.description}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{c.date}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-4">
                    <span className="text-gray-500">{c.avgBefore}</span>
                    <span className="text-gray-600">→</span>
                    <span className={c.avgAfter > c.avgBefore ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                      {c.avgAfter} ({c.avgAfter > c.avgBefore ? '+' : ''}{(c.avgAfter - c.avgBefore).toFixed(1)})
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPARE */}
      {tab === 'compare' && (
        <div className="space-y-4">
          <h2 className="text-white font-medium">Tournament vs Practice — side by side</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">Spec</p>
              {compareFields.map(([label]) => (
                <div key={label} className="py-2.5 border-b border-white/5 last:border-0 text-xs text-gray-500">{label}</div>
              ))}
            </div>
            {comparedSetups.map((s, si) => (
              <div key={si}>
                <p className={`text-xs uppercase tracking-wide mb-3 font-medium ${si === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {si === 0 ? 'Tournament' : 'Practice'}
                </p>
                {compareFields.map(([label, getter]) => {
                  const val = getter(s);
                  const otherVal = getter(comparedSetups[si === 0 ? 1 : 0]);
                  const isDiff = val !== otherVal;
                  return (
                    <div key={label} className={`py-2.5 border-b border-white/5 last:border-0 text-xs ${isDiff ? (si === 0 ? 'text-red-300 font-medium' : 'text-blue-300 font-medium') : 'text-gray-400'}`}>
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">Highlighted values differ between setups · Red = tournament · Blue = practice</p>
        </div>
      )}

      {/* Sponsor content obligation strip */}
      {current.contentRequired && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-950/20 border border-amber-700/20 rounded-xl text-sm">
          <span className="text-amber-400">🤝</span>
          <span className="text-gray-300">
            <span className="font-medium">Red Dragon</span>
            <span className="text-gray-500"> requires content for this setup — barrel review video due today 16:00.</span>
          </span>
          <button className="ml-auto text-red-400 text-xs hover:text-red-300 whitespace-nowrap">→ Sponsorship</button>
        </div>
      )}
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── CAREER PLANNING VIEW ─────────────────────────────────────────────────────
function CareerPlanningView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [horizon, setHorizon] = useState<'1'|'3'|'5'|'10'>('1')
  const STATS = [
    { value: `#${player.pdcRank}`, label: 'Current Ranking', sub: 'PDC Order of Merit' },
    { value: '#11', label: 'Career High', sub: 'March 2025' },
    { value: '2021', label: 'Turned Pro', sub: '4 years on tour' },
    { value: '3', label: 'PDC Titles', sub: 'inc. 1 Euro Tour' },
  ]
  const GOALS: Record<string, { goal: string; target: string; status: string; progress: number; color: string }[]> = {
    '1': [
      { goal: 'Break into Top 16 PDC', target: 'Dec 2026', status: 'In progress', progress: 72, color: '#22c55e' },
      { goal: 'Qualify for Premier League', target: 'Jan 2027', status: 'Night player now', progress: 60, color: '#a855f7' },
      { goal: 'Win a PDC ranking event', target: 'Dec 2026', status: 'SF best so far', progress: 55, color: '#22c55e' },
      { goal: 'Top 16 OOM — secure seeding', target: 'Dec 2026', status: 'In progress', progress: 68, color: '#f59e0b' },
      { goal: 'Reach World Championship R3', target: 'Jan 2027', status: 'R2 best so far', progress: 40, color: '#0ea5e9' },
    ],
    '3': [
      { goal: 'Consistent top 10 PDC ranking', target: 'Dec 2028', status: 'On track', progress: 45, color: '#22c55e' },
      { goal: 'PDC World Championship QF or better', target: 'Jan 2028', status: 'In progress', progress: 35, color: '#a855f7' },
      { goal: 'Build exhibition network to 60+ events/year', target: 'Dec 2028', status: '28 events this year', progress: 47, color: '#f59e0b' },
      { goal: 'Grow social following to 150k combined', target: 'Dec 2028', status: '61k now', progress: 41, color: '#0ea5e9' },
      { goal: '£500k career prize money', target: 'Dec 2028', status: '£187k to date', progress: 37, color: '#22c55e' },
    ],
    '5': [
      { goal: 'PDC World Championship SF', target: 'Jan 2030', status: 'Long-term target', progress: 20, color: '#a855f7' },
      { goal: 'Top 8 PDC — Premier League full member', target: 'Dec 2030', status: 'Night player now', progress: 15, color: '#22c55e' },
      { goal: 'Win a Triple Crown event', target: 'Dec 2030', status: 'Not started', progress: 10, color: '#ef4444' },
      { goal: '£1M career earnings', target: 'Dec 2030', status: '£187k to date', progress: 19, color: '#f59e0b' },
      { goal: 'Major sponsorship deal (>£50k/yr)', target: 'Dec 2029', status: 'In talks', progress: 25, color: '#0ea5e9' },
    ],
    '10': [
      { goal: 'PDC World Championship title', target: 'Jan 2035', status: 'Career goal', progress: 8, color: '#facc15' },
      { goal: 'Top 5 PDC all-time prize money list', target: 'Dec 2035', status: 'Long-term', progress: 5, color: '#a855f7' },
      { goal: 'Premier League champion', target: 'Dec 2034', status: 'Not started', progress: 5, color: '#22c55e' },
      { goal: 'Grand Slam of Darts title', target: 'Dec 2033', status: 'Not started', progress: 8, color: '#ef4444' },
      { goal: 'Build coaching/academy business', target: 'Dec 2035', status: 'Future plan', progress: 3, color: '#0ea5e9' },
    ],
  }
  const SEASON = [
    { goal: 'Break into top 16 Order of Merit', detail: '#19 to 16 needed', progress: 72, color: '#22c55e' },
    { goal: 'Win at least one major TV event', detail: 'semi-finalist last year', progress: 45, color: '#ef4444' },
    { goal: 'Qualify for Premier League full season', detail: 'currently night player', progress: 60, color: '#a855f7' },
    { goal: 'Retain European Tour card (top 24)', detail: '3 titles — on track', progress: 78, color: '#f59e0b' },
    { goal: '£80k prize money this season', detail: '£31k earned YTD', progress: 39, color: '#0ea5e9' },
  ]
  const TIMELINE = [
    { year: '2019', event: 'Turned pro — won tour card at Q-School' },
    { year: '2020', event: 'Pro Tour breakthrough — first £50k season' },
    { year: '2021', event: 'First European Tour win (Prague)' },
    { year: '2022', event: 'World Championship debut — R2 loss vs MvG' },
    { year: '2023', event: 'Premier League debut (night player x 6)' },
    { year: '2024', event: 'Career high ranking #11 — UK Open SF' },
    { year: '2025', event: 'First ranking event title — Players Championship 8' },
    { year: '2026', event: 'World Championship R2 — targeting R3 this year' },
  ]
  return (
    <div className="space-y-6">
      <SectionHeader icon="🚀" title="Career Planning" subtitle="1-year, 3-year, 5-year and 10-year goals with progress tracking." />
      <div className="grid grid-cols-4 gap-3">
        {STATS.map((s, i) => (<div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}><div className="text-xl font-black" style={{ color: '#dc2626' }}>{s.value}</div><div className="text-[11px] text-white font-semibold mt-1">{s.label}</div><div className="text-[10px] text-gray-500">{s.sub}</div></div>))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="flex border-b border-gray-800">
          {(['1','3','5','10'] as const).map(h => (<button key={h} onClick={() => setHorizon(h)} className="flex-1 py-3 text-sm font-semibold transition-all" style={{ borderBottom: horizon === h ? '2px solid #dc2626' : '2px solid transparent', color: horizon === h ? '#fff' : '#6B7280', background: horizon === h ? 'rgba(220,38,38,0.06)' : 'transparent' }}>{h} Year</button>))}
        </div>
        <div className="p-5 space-y-4">
          {GOALS[horizon].map((g, i) => (<div key={i}><div className="flex items-center justify-between mb-1"><span className="text-sm text-white font-semibold">{g.goal}</span><div className="flex items-center gap-2"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${g.color}20`, color: g.color }}>{g.status}</span><span className="text-[10px] text-gray-500">{g.target}</span></div></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} /></div></div>))}
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="text-sm font-bold text-white mb-4">2026 Season Goals</div>
        <div className="space-y-3">
          {SEASON.map((s, i) => (<div key={i}><div className="flex items-center justify-between mb-1"><span className="text-xs text-white">{s.goal}</span><span className="text-[10px] text-gray-500">{s.detail}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{ width: `${s.progress}%`, backgroundColor: s.color }} /></div></div>))}
        </div>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
        <div className="text-sm font-bold text-white mb-4">Career Timeline</div>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: '#dc262640' }} />
          {TIMELINE.map((t, i) => (<div key={i} className="relative mb-4 last:mb-0"><div className="absolute -left-4 top-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#dc2626' }} /><div className="flex items-baseline gap-3"><span className="text-xs font-bold" style={{ color: '#dc2626' }}>{t.year}</span><span className="text-sm text-gray-300">{t.event}</span></div></div>))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── DATA HUB VIEW ────────────────────────────────────────────────────────────
function DataHubView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [showDCConfirm, setShowDCConfirm] = useState(false);
  const [showIDConfirm, setShowIDConfirm] = useState(false);

  return (
    <div className="space-y-6">

      <SectionHeader icon="📡" title="Data & Analytics Hub" subtitle="Your connected data sources — powering your performance insights." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">PDC Official</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">Connected — live rankings</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Official PDC Order of Merit, tournament results, entry systems, and player profiles.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['Order of Merit', 'Results', 'Entry deadlines', 'Player profiles'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          <button onClick={() => window.open('https://www.pdc.tv', '_blank')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Open PDC.tv →</button>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">Darts Database</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-600/20 text-teal-400 border border-teal-600/30">Connected — stats archive</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Comprehensive PDC/WDF results archive. H2H records, career statistics, and tournament history going back to 1994.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['H2H Records', 'Career stats', 'Tournament history', 'Rankings archive'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          <button onClick={() => window.open('https://www.dartsdatabase.co.uk', '_blank')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Browse Darts Database →</button>
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">DartConnect</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Not connected</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">Official PDC scoring platform. Connect to sync your live match scores and career statistics automatically.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['Live match sync', 'Career stats', 'PDC event scoring'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          {showDCConfirm ? <div className="text-xs text-teal-400 font-medium">Connection request sent to DartConnect ✓</div> : <button onClick={() => setShowDCConfirm(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Connect DartConnect ↗</button>}
        </div>
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">iDarts Stats</div></div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Not connected</span>
          <div className="text-xs text-gray-400 mt-3 mb-3">The world&apos;s most comprehensive darts statistics database. Used by PDC commentators and analysts worldwide.</div>
          <div className="flex flex-wrap gap-1 mb-3">{['Deep player stats', 'Tournament data', 'API access'].map(t => <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>)}</div>
          {showIDConfirm ? <div className="text-xs text-teal-400 font-medium">Request sent — iDarts will contact you ✓</div> : <button onClick={() => setShowIDConfirm(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors">Request Access ↗</button>}
        </div>
      </div>

      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Data Sources</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { section: 'Order of Merit & Race', source: 'PDC Official' },
            { section: 'Tournament Schedule', source: 'PDC Official + Lumio' },
            { section: 'Three-Dart Average', source: 'Lumio analytics engine' },
            { section: 'Checkout Analysis', source: 'Lumio analytics engine' },
            { section: 'Opponent Intel', source: 'Darts Database + Lumio' },
            { section: 'Practice Log', source: 'Lumio (manual entry)' },
            { section: 'Match Reports', source: 'Claude AI (Anthropic)' },
            { section: 'Exhibition Manager', source: 'Lumio' },
            { section: 'Financial Dashboard', source: 'Lumio' },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-500">{d.section}</span>
              <span className="text-xs text-red-400 font-medium">{d.source}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
// ─── DartConnect Integration ──────────────────────────────────────────────────
function DartConnectView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [apiKey, setApiKey] = useState('');
  const [connected, setConnected] = useState(false);
  const sessions = [
    { date: '2025-04-06', type: 'Match', avg: 96.8, checkout: 44 },
    { date: '2025-04-05', type: 'Practice', avg: 99.1, checkout: 51 },
    { date: '2025-04-04', type: 'Practice', avg: 98.4, checkout: 49 },
    { date: '2025-04-03', type: 'Match', avg: 95.2, checkout: 38 },
    { date: '2025-04-02', type: 'Practice', avg: 100.3, checkout: 55 },
  ];
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white mb-1">🔌 DartConnect</h1>
        <p className="text-xs text-gray-500">Sync match averages, checkout data and practice sessions automatically.</p>
      </div>

      {!connected && (
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-700/30 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-2xl">🔌</div>
            <div>
              <div className="text-sm font-bold text-white mb-1">Connect your DartConnect account</div>
              <div className="text-xs text-gray-400">Sync match averages, checkout data and practice sessions automatically. Pulls every session from your DartConnect history into Lumio overnight.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your DartConnect API key" className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-600/60" />
            <button onClick={() => apiKey && setConnected(true)} disabled={!apiKey} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${apiKey ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>Connect</button>
          </div>
        </div>
      )}

      {connected && (
        <>
          <div className="bg-teal-900/20 border border-teal-600/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={16} className="text-teal-400" />
            <div className="text-xs text-teal-300"><span className="font-semibold">Connected.</span> Last sync 3 minutes ago · 28 sessions imported this month.</div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Practice Avg" value="99.3" sub="Last 14 days" color="teal" />
            <StatCard label="Match Avg" value="97.0" sub="Last 14 days" color="red" />
            <StatCard label="Gap" value="+2.3" sub="Practice over match" color="orange" />
            <StatCard label="Sessions" value="28" sub="This month" color="purple" />
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-red-900/20 border border-purple-700/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Brain size={20} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white mb-1">AI Insight — Practice vs Match Gap</div>
                <div className="text-xs text-gray-300 leading-relaxed">Your practice average is <span className="font-bold text-purple-300">2.3 points above</span> your match average. That&apos;s a meaningful gap — it&apos;s either nerves on the walk-on or a consistency issue in second-session legs. Suggestion: schedule a pressure-simulation session with your sports psychologist.</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last 5 Sessions</div>
            <table className="w-full text-xs">
              <thead className="bg-black/30 text-gray-500">
                <tr><th className="text-left px-4 py-2 font-medium">Date</th><th className="text-left px-4 py-2 font-medium">Type</th><th className="text-right px-4 py-2 font-medium">3-Dart Avg</th><th className="text-right px-4 py-2 font-medium">Checkout %</th></tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-t border-gray-800/60">
                    <td className="px-4 py-2.5 text-gray-400">{s.date}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.type === 'Match' ? 'bg-red-600/20 text-red-300' : 'bg-teal-600/20 text-teal-300'}`}>{s.type}</span></td>
                    <td className="px-4 py-2.5 text-right font-semibold text-white">{s.avg}</td>
                    <td className="px-4 py-2.5 text-right text-gray-300">{s.checkout}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PDC Live Data ────────────────────────────────────────────────────────────
function PDCLiveView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const events = [
    { name: 'Players Ch. 23 (Wigan)',     date: '14 Apr', status: 'Entered',    earned: 2500,  hold: 2500,  gain: 5000 },
    { name: 'Players Ch. 24 (Wigan)',     date: '15 Apr', status: 'Entered',    earned: 10000, hold: 10000, gain: 12000 },
    { name: 'European Tour 5 (Hildesheim)', date: '18 Apr', status: 'Entered',    earned: 6000,  hold: 6000,  gain: 9000 },
    { name: 'Players Ch. 25 (Leicester)', date: '28 Apr', status: 'Entered',    earned: 4000,  hold: 4000,  gain: 7000 },
    { name: 'Players Ch. 26 (Leicester)', date: '29 Apr', status: 'Not entered', earned: 0,     hold: 1000,  gain: 2000 },
    { name: 'Premier League (Night 12)',  date: '01 May', status: 'Entered',    earned: 25000, hold: 25000, gain: 35000 },
    { name: 'Players Ch. 27 (Barnsley)',  date: '05 May', status: 'Entered',    earned: 15000, hold: 15000, gain: 25000 },
    { name: 'Players Ch. 28 (Barnsley)',  date: '06 May', status: 'Withdrew',    earned: 5000,  hold: 5000,  gain: 8000 },
  ];
  const totalDefending = events.reduce((s, e) => s + e.earned, 0);
  const next4Weeks = events.slice(0, 4).reduce((s, e) => s + e.earned, 0);
  const somGraph = [
    { period: '24mo ago', amount: 42000 }, { period: '20mo ago', amount: 68000 }, { period: '16mo ago', amount: 124000 },
    { period: '12mo ago', amount: 95000 }, { period: '8mo ago', amount: 142000 }, { period: '4mo ago', amount: 108000 },
    { period: 'Current',  amount: 108420 },
  ];
  const maxAmount = Math.max(...somGraph.map(g => g.amount));
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white mb-1">📡 PDC Live Data</h1>
        <p className="text-xs text-gray-500">Live tournament ticker, defending money calculator and Order of Merit tracker.</p>
      </div>

      {/* Live ticker */}
      <div className="bg-gradient-to-r from-red-900/40 to-black border border-red-700/40 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live Now</div>
          <div className="text-xs text-gray-400">PDC European Championship · Westfalenhalle, Dortmund</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-black/40 rounded-lg px-3 py-2"><span className="text-gray-500">R1 · </span><span className="text-white font-semibold">L. Humphries 6-3 R. Smith</span></div>
          <div className="bg-black/40 rounded-lg px-3 py-2"><span className="text-gray-500">R1 · </span><span className="text-white font-semibold">M. van Gerwen vs J. Henderson</span><span className="text-red-400 ml-2">LIVE 4-2</span></div>
          <div className="bg-black/40 rounded-lg px-3 py-2"><span className="text-gray-500">R1 · </span><span className="text-white font-semibold">G. Price vs J. Morrison</span><span className="text-gray-600 ml-2">20:00</span></div>
        </div>
      </div>

      {/* Defending money calculator — KEY FEATURE */}
      <div className="bg-[#0d0f1a] border border-orange-700/30 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-orange-900/30 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">💰 Defending Money Calculator</div>
            <div className="text-xs text-orange-400">Next 8 weeks</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div><span className="text-gray-500">Total defending: </span><span className="text-orange-300 font-bold">£{totalDefending.toLocaleString()}</span></div>
            <div><span className="text-gray-500">Next 4 weeks: </span><span className="text-red-300 font-bold">£{next4Weeks.toLocaleString()}</span></div>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-black/40 text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Event</th>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Earned Last Year</th>
              <th className="text-right px-4 py-2 font-medium">To Hold #19</th>
              <th className="text-right px-4 py-2 font-medium">To Gain 1 Place</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-4 py-2.5 text-gray-300">{e.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{e.date}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${e.status === 'Entered' ? 'bg-teal-600/20 text-teal-300' : e.status === 'Not entered' ? 'bg-gray-700/40 text-gray-400' : 'bg-red-600/20 text-red-300'}`}>{e.status}</span>
                </td>
                <td className="px-4 py-2.5 text-right text-orange-300 font-semibold">£{e.earned.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-red-300">£{e.hold.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-purple-300">£{e.gain.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 bg-gradient-to-r from-purple-900/30 to-transparent border-t border-gray-800">
          <div className="flex items-start gap-2">
            <Brain size={14} className="text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300">You are defending <span className="text-orange-300 font-bold">£18,400</span> over the next 4 weeks. A <span className="text-teal-300 font-semibold">QF finish at PC27</span> would protect your current <span className="text-red-300 font-semibold">#19 ranking</span>.</div>
          </div>
        </div>
      </div>

      {/* Order of Merit tracker */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white">Order of Merit</div>
            <div className="text-xs text-gray-500">Rolling 24-month prize money</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-orange-400">£687,420</div>
            <div className="text-[10px] text-gray-500">Current total · #19</div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {somGraph.map((g, i) => {
            const height = (g.amount / maxAmount) * 100;
            const isBig = g.amount > 120000;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-gray-500 font-semibold">£{(g.amount / 1000).toFixed(0)}k</div>
                <div className="w-full rounded-t transition-all" style={{ height: `${height}%`, background: isBig ? 'linear-gradient(180deg, #DC2626, #7F1D1D)' : 'linear-gradient(180deg, #F97316, #9A3412)' }} />
                <div className="text-[9px] text-gray-600">{g.period}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[10px] text-gray-500 italic">The red bars are big earnings that drop off the rolling 24-month window — plan your defence around them.</div>
      </div>

      {/* Tour Card security */}
      <div className="bg-gradient-to-r from-teal-900/30 to-black border border-teal-700/30 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center shrink-0"><Shield size={22} className="text-teal-400" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-bold text-white">Tour Card</div>
            <span className="px-2 py-0.5 bg-teal-600/20 text-teal-300 text-[10px] font-bold rounded uppercase">SECURE</span>
          </div>
          <div className="text-xs text-gray-400">You are <span className="text-teal-300 font-bold">£142,000 above</span> the #64 Tour Card cutoff. Q-School not required next January.</div>
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Women's Darts ────────────────────────────────────────────────────────────
function WomensDartsView({ onNavigate, player, session }: { onNavigate: (id: string) => void; player: DartsPlayer; session: SportsDemoSession }) {
  const oom = [
    { rank: 1, name: 'Beau Greaves',    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 68420, avg: 90.4 },
    { rank: 2, name: 'Fallon Sherrock', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 52800, avg: 86.2 },
    { rank: 3, name: 'Deta Hedman',     country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 38200, avg: 82.8 },
    { rank: 4, name: 'Lisa Ashton',     country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 34600, avg: 84.1 },
    { rank: 5, name: 'Mikuru Suzuki',   country: '🇯🇵',          earnings: 28400, avg: 81.9 },
    { rank: 6, name: 'Aileen de Graaf', country: '🇳🇱',          earnings: 24800, avg: 80.3 },
    { rank: 7, name: 'Noa-Lynn van Leuven', country: '🇳🇱',      earnings: 22100, avg: 83.0 },
    { rank: 8, name: 'Rhian Edwards',   country: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earnings: 19600, avg: 79.5 },
    { rank: 9, name: 'Lorraine Winstanley', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 17200, avg: 78.8 },
    { rank: 10, name: 'Kirsty Hutchinson', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earnings: 14800, avg: 79.1 },
  ];
  const schedule = [
    { weekend: 'Weekend 1', dates: '12-13 Apr', venue: 'Wigan', events: 4, status: 'Completed' },
    { weekend: 'Weekend 2', dates: '17-18 May', venue: 'Gibraltar', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 3', dates: '14-15 Jun', venue: 'Hildesheim', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 4', dates: '12-13 Jul', venue: 'Leicester', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 5', dates: '13-14 Sep', venue: 'Barnsley', events: 4, status: 'Upcoming' },
    { weekend: 'Weekend 6', dates: '11-12 Oct', venue: 'Minehead', events: 4, status: 'Upcoming' },
  ];
  const prizePairs = [
    { event: 'Players Championship', men: 10000, women: 2500 },
    { event: 'European Tour event',  men: 25000, women: 6000 },
    { event: 'World Matchplay',      men: 200000, women: 25000 },
    { event: 'World Championship',   men: 500000, women: 50000 },
  ];
  const maxPrize = Math.max(...prizePairs.map(p => p.men));
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white mb-1">⭐ Women&apos;s Darts</h1>
        <p className="text-xs text-gray-500">Women&apos;s Series, Order of Merit, Matchplay qualification and partnership planning.</p>
      </div>

      {/* Schedule */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="text-sm font-bold text-white">PDC Women&apos;s Series 2025</div>
          <div className="text-[10px] text-gray-500">6 weekends · 4 events per weekend · 24 events total</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-black/30 text-gray-500">
            <tr><th className="text-left px-4 py-2 font-medium">Weekend</th><th className="text-left px-4 py-2 font-medium">Dates</th><th className="text-left px-4 py-2 font-medium">Venue</th><th className="text-right px-4 py-2 font-medium">Events</th><th className="text-right px-4 py-2 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {schedule.map((w, i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-4 py-2.5 text-gray-300 font-semibold">{w.weekend}</td>
                <td className="px-4 py-2.5 text-gray-500">{w.dates}</td>
                <td className="px-4 py-2.5 text-gray-400">{w.venue}</td>
                <td className="px-4 py-2.5 text-right text-gray-300">{w.events}</td>
                <td className="px-4 py-2.5 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${w.status === 'Completed' ? 'bg-teal-600/20 text-teal-300' : 'bg-gray-700/40 text-gray-400'}`}>{w.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order of Merit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <div className="text-sm font-bold text-white">Women&apos;s Order of Merit — Top 10</div>
            <div className="text-[10px] text-gray-500">Rolling 12 months · GBP</div>
          </div>
          <div className="divide-y divide-gray-800/60">
            {oom.map(p => (
              <div key={p.rank} className="flex items-center gap-3 px-4 py-2.5">
                <div className={`text-xs font-black w-6 text-center ${p.rank <= 3 ? 'text-orange-400' : 'text-gray-500'}`}>#{p.rank}</div>
                <div className="text-sm shrink-0">{p.country}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-500">Avg {p.avg}</div>
                </div>
                <div className="text-xs text-orange-300 font-bold">£{p.earnings.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Matchplay qualification */}
        <div className="space-y-4">
          <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-white">Women&apos;s World Matchplay</div>
              <span className="px-2 py-0.5 bg-red-600/20 text-red-300 text-[10px] font-bold rounded uppercase">Top 8 Qualify</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">Qualification from the Women&apos;s Order of Merit — cutoff as of Weekend 6 (Minehead).</div>
            <div className="space-y-1.5">
              {oom.slice(0, 8).map(p => (
                <div key={p.rank} className="flex items-center gap-2 text-xs">
                  <div className={`w-5 text-center font-black ${p.rank <= 8 ? 'text-teal-400' : 'text-gray-600'}`}>#{p.rank}</div>
                  <div className="flex-1 text-gray-300">{p.name}</div>
                  <CheckCircle size={12} className="text-teal-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/20 border border-pink-700/30 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-xl">💜</div>
              <div>
                <div className="text-sm font-bold text-white mb-1">Support Women&apos;s Darts</div>
                <div className="text-xs text-gray-400">Join the PDPA women&apos;s tour membership — advocacy, development grants, and equal prize money campaigning.</div>
              </div>
            </div>
            <button className="w-full bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-200 text-xs font-semibold px-4 py-2 rounded-lg transition-all">Join PDPA Women&apos;s Tour →</button>
          </div>
        </div>
      </div>

      {/* Prize money comparison */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-white">Prize Money — Winner&apos;s Cheque</div>
            <div className="text-[10px] text-gray-500">Men vs women per flagship event</div>
          </div>
        </div>
        <div className="space-y-3">
          {prizePairs.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-300 font-semibold">{p.event}</div>
                <div className="text-[10px] text-gray-500">£{p.men.toLocaleString()} / £{p.women.toLocaleString()}</div>
              </div>
              <div className="flex gap-1 h-5">
                <div className="rounded-sm bg-gradient-to-r from-red-700 to-red-500" style={{ width: `${(p.men / maxPrize) * 100}%` }} title={`Men: £${p.men.toLocaleString()}`} />
                <div className="rounded-sm bg-gradient-to-r from-pink-700 to-pink-500" style={{ width: `${(p.women / maxPrize) * 100}%` }} title={`Women: £${p.women.toLocaleString()}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-600" /> Men</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-pink-600" /> Women</div>
        </div>
      </div>

      {/* Mixed doubles partnership planner */}
      <div className="bg-[#0d0f1a] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-bold text-white mb-1">Mixed Doubles Partnership Planner</div>
        <div className="text-[10px] text-gray-500 mb-4">Pair with a women&apos;s tour player for the mixed doubles event at the World Cup of Darts.</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {oom.slice(0, 3).map(p => (
            <div key={p.rank} className="bg-black/40 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg">{p.country}</div>
                <div>
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-gray-500">Avg {p.avg} · #{p.rank}</div>
                </div>
              </div>
              <button className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-[10px] font-semibold px-3 py-1.5 rounded transition-all">Request pairing</button>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── STUB VIEW (placeholder for new sidebar items) ───────────────────────────
// ─── DARTBOARD HEATMAP VIEW ───────────────────────────────────────────────────
function DartboardHeatmapView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [scenario, setScenario] = useState<'match' | 'practice' | 'pressure'>('match');
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);

  const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  const heatData: Record<'match' | 'practice' | 'pressure', Record<number, number>> = {
    match: { 20: 0.92, 19: 0.72, 18: 0.38, 16: 0.65, 8: 0.44, 4: 0.31, 1: 0.18, 5: 0.12, 12: 0.14, 9: 0.11, 14: 0.16, 11: 0.13, 6: 0.22, 10: 0.19, 15: 0.21, 2: 0.17, 17: 0.24, 3: 0.28, 7: 0.15, 13: 0.20 },
    practice: { 20: 0.96, 19: 0.75, 18: 0.41, 16: 0.68, 8: 0.48, 4: 0.34, 1: 0.20, 5: 0.14, 12: 0.16, 9: 0.13, 14: 0.18, 11: 0.15, 6: 0.24, 10: 0.21, 15: 0.23, 2: 0.19, 17: 0.26, 3: 0.30, 7: 0.17, 13: 0.22 },
    pressure: { 20: 0.78, 19: 0.65, 18: 0.31, 16: 0.54, 8: 0.37, 4: 0.24, 1: 0.15, 5: 0.10, 12: 0.12, 9: 0.09, 14: 0.13, 11: 0.11, 6: 0.18, 10: 0.16, 15: 0.18, 2: 0.14, 17: 0.20, 3: 0.23, 7: 0.12, 13: 0.17 },
  };

  const doublesData: Record<number, { attempts: number; rate: number; trend: string }> = {
    20: { attempts: 187, rate: 41, trend: '↑' }, 16: { attempts: 142, rate: 38, trend: '↑' },
    18: { attempts: 98, rate: 34, trend: '→' }, 8: { attempts: 76, rate: 49, trend: '↑' },
    4: { attempts: 61, rate: 52, trend: '↑' }, 10: { attempts: 44, rate: 29, trend: '↓' },
    1: { attempts: 38, rate: 27, trend: '→' }, 2: { attempts: 31, rate: 23, trend: '↓' },
    3: { attempts: 29, rate: 31, trend: '↑' }, 5: { attempts: 22, rate: 26, trend: '→' },
    6: { attempts: 19, rate: 28, trend: '→' }, 7: { attempts: 17, rate: 21, trend: '↓' },
    9: { attempts: 15, rate: 25, trend: '→' }, 11: { attempts: 12, rate: 24, trend: '→' },
    12: { attempts: 11, rate: 22, trend: '→' }, 13: { attempts: 9, rate: 18, trend: '↓' },
    14: { attempts: 8, rate: 26, trend: '→' }, 15: { attempts: 7, rate: 30, trend: '↑' },
    17: { attempts: 6, rate: 27, trend: '→' }, 19: { attempts: 5, rate: 33, trend: '↑' },
  };

  const heatToColor = (h: number) => {
    if (h > 0.8) return 'rgba(239,68,68,0.7)';
    if (h > 0.6) return 'rgba(251,146,60,0.65)';
    if (h > 0.4) return 'rgba(250,204,21,0.5)';
    if (h > 0.2) return 'rgba(250,204,21,0.25)';
    return 'rgba(255,255,255,0.05)';
  };

  const renderBoard = (scenarioKey: 'match' | 'practice' | 'pressure', size: number = 320) => {
    const cx = size / 2, cy = size / 2;
    const r = { bull: size * 0.036, bull25: size * 0.072, inner: size * 0.2, treble: size * 0.29, outer: size * 0.4, edge: size * 0.48 };
    const segAngle = 18;
    const polarToXY = (angle: number, radius: number) => ({ x: cx + radius * Math.sin((angle * Math.PI) / 180), y: cy - radius * Math.cos((angle * Math.PI) / 180) });
    const arcPath = (r1: number, r2: number, startDeg: number, endDeg: number) => {
      const s1 = polarToXY(startDeg, r1), s2 = polarToXY(startDeg, r2);
      const e1 = polarToXY(endDeg, r1), e2 = polarToXY(endDeg, r2);
      return `M ${s1.x} ${s1.y} L ${s2.x} ${s2.y} A ${r2} ${r2} 0 0 1 ${e2.x} ${e2.y} L ${e1.x} ${e1.y} A ${r1} ${r1} 0 0 0 ${s1.x} ${s1.y} Z`;
    };
    const data = heatData[scenarioKey];
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r.edge} fill="#1a1a1a" />
        {SEGMENTS.map((num, idx) => {
          const startDeg = idx * segAngle - segAngle / 2;
          const endDeg = startDeg + segAngle;
          const h = data[num] || 0.1;
          const isHovered = hoveredSeg === num;
          const baseLight = idx % 2 === 0 ? '#f5f5dc' : '#1a1a1a';
          const midDeg = startDeg + segAngle / 2;
          const pos = polarToXY(midDeg, r.edge * 1.06);
          return (
            <g key={num} onMouseEnter={() => setHoveredSeg(num)} onMouseLeave={() => setHoveredSeg(null)} style={{ cursor: 'pointer' }}>
              <path d={arcPath(r.treble, r.inner, startDeg, endDeg)} fill={baseLight} stroke="#333" strokeWidth="0.5" opacity={0.9} />
              <path d={arcPath(r.outer, r.treble, startDeg, endDeg)} fill={idx % 2 === 0 ? '#c41e3a' : '#1a7a3c'} stroke="#333" strokeWidth="0.5" />
              <path d={arcPath(r.inner, r.bull25 * 1.4, startDeg, endDeg)} fill={baseLight} stroke="#333" strokeWidth="0.5" opacity={0.9} />
              <path d={arcPath(r.edge, r.outer, startDeg, endDeg)} fill={idx % 2 === 0 ? '#c41e3a' : '#1a7a3c'} stroke="#333" strokeWidth="0.5" />
              <path d={arcPath(r.outer, r.bull25 * 1.4, startDeg, endDeg)} fill={heatToColor(h)} opacity={isHovered ? 0.9 : 0.75} />
              {isHovered && <path d={arcPath(r.edge, r.bull25 * 1.4, startDeg, endDeg)} fill="white" fillOpacity={0.08} stroke="white" strokeWidth="0.5" strokeOpacity={0.3} />}
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.038} fill="white" fontWeight="500" style={{ pointerEvents: 'none', userSelect: 'none' }}>{num}</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r.bull25} fill="#1a7a3c" stroke="#333" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={r.bull} fill="#c41e3a" stroke="#333" strokeWidth="0.5" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.04} fill="white" fontWeight="600" style={{ pointerEvents: 'none' }}>B</text>
      </svg>
    );
  };

  const hovered = hoveredSeg;
  const dbl = hovered ? doublesData[hovered] : null;
  const heat = hovered ? (heatData[scenario][hovered] || 0.1) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Dartboard Heatmap</h1>
        <p className="text-gray-400 text-sm mt-1">Hit distribution · Segment accuracy · Doubles &amp; trebles</p>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex rounded-lg border border-white/5 overflow-hidden">
          {(['match', 'practice', 'pressure'] as const).map(s => (
            <button key={s} onClick={() => setScenario(s)} className={`px-4 py-2 text-xs font-medium transition-colors ${scenario === s ? 'bg-red-600/20 text-red-300 border-r border-white/5' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300 border-r border-white/5'} last:border-r-0`}>
              {s === 'match' ? 'Match play' : s === 'practice' ? 'Practice' : 'Under pressure'}
            </button>
          ))}
        </div>
        <button onClick={() => setCompare(!compare)} className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${compare ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' : 'bg-gray-900/40 text-gray-500 border-white/5 hover:text-gray-300'}`}>
          {compare ? '✕ Close comparison' : 'Compare practice vs match'}
        </button>
      </div>
      <div className="flex gap-6 items-start">
        {compare ? (
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2"><p className="text-xs text-gray-500 uppercase tracking-wide">Practice</p>{renderBoard('practice', 280)}</div>
            <div className="flex flex-col items-center gap-2"><p className="text-xs text-gray-500 uppercase tracking-wide">Match play</p>{renderBoard('match', 280)}</div>
          </div>
        ) : renderBoard(scenario, 340)}
        <div className="flex-1 min-w-[200px]">
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4 min-h-[200px]">
            {hovered ? (
              <>
                <h3 className="text-white font-medium mb-3">Segment {hovered}</h3>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs text-gray-500">Heat score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 flex-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((heat || 0) * 100)}%`, background: heatToColor(heat || 0) }} />
                      </div>
                      <span className="text-white text-sm font-medium">{Math.round((heat || 0) * 100)}%</span>
                    </div>
                  </div>
                  {dbl && (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Double {hovered} attempts</span><span className="text-white">{dbl.attempts}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Conversion rate</span><span className={`font-medium ${dbl.rate >= 40 ? 'text-green-400' : dbl.rate >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{dbl.rate}%</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Trend</span><span className={dbl.trend === '↑' ? 'text-green-400' : dbl.trend === '↓' ? 'text-red-400' : 'text-gray-400'}>{dbl.trend} {dbl.trend === '↑' ? 'Improving' : dbl.trend === '↓' ? 'Declining' : 'Stable'}</span></div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">Hover a segment to see stats</div>
            )}
          </div>
          <div className="mt-4 bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Heat key</p>
            <div className="space-y-1.5">
              {[
                { color: 'rgba(239,68,68,0.7)', label: 'Very high (80–100%)' },
                { color: 'rgba(251,146,60,0.65)', label: 'High (60–80%)' },
                { color: 'rgba(250,204,21,0.5)', label: 'Medium (40–60%)' },
                { color: 'rgba(250,204,21,0.25)', label: 'Low (20–40%)' },
                { color: 'rgba(255,255,255,0.05)', label: 'Minimal (0–20%)' },
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: it.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Doubles conversion — 2025 season</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Double</span><span>Attempts</span><span>Hit rate</span><span>Trend</span><span>Rating</span>
          </div>
          {Object.entries(doublesData).sort((a, b) => b[1].attempts - a[1].attempts).map(([num, d]) => (
            <div key={num} onMouseEnter={() => setHoveredSeg(Number(num))} onMouseLeave={() => setHoveredSeg(null)} className={`grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/5 text-sm cursor-pointer transition-colors ${hoveredSeg === Number(num) ? 'bg-gray-800/40' : 'hover:bg-gray-900/40'}`}>
              <span className="text-white font-medium">D{num}</span>
              <span className="text-gray-400">{d.attempts}</span>
              <span className={`font-medium ${d.rate >= 45 ? 'text-green-400' : d.rate >= 35 ? 'text-amber-400' : 'text-red-400'}`}>{d.rate}%</span>
              <span className={d.trend === '↑' ? 'text-green-400' : d.trend === '↓' ? 'text-red-400' : 'text-gray-500'}>{d.trend}</span>
              <div className="flex items-center">
                <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.rate >= 45 ? 'bg-green-500' : d.rate >= 35 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.rate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── ADVANCED STATS VIEW ──────────────────────────────────────────────────────
function AdvancedStatsView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const first9Avg = [102.1, 106.4, 98.3, 103.8, 108.4, 101.2, 99.8, 105.7, 103.2, 101.6, 108.9, 100.4, 104.8, 102.1, 103.9];
  const scoringZones = [
    { label: '180 (max)', jake: 198, pdc: 162, color: 'bg-red-500' },
    { label: '140+', jake: 312, pdc: 274, color: 'bg-orange-500' },
    { label: '100+', jake: 689, pdc: 641, color: 'bg-amber-500' },
    { label: '60–99', jake: 891, pdc: 908, color: 'bg-blue-500' },
    { label: 'Below 60', jake: 423, pdc: 498, color: 'bg-gray-500' },
  ];
  const legLengths = [
    { darts: 9, won: 1 }, { darts: 12, won: 14 }, { darts: 15, won: 67 },
    { darts: 18, won: 89 }, { darts: 21, won: 76 }, { darts: 24, won: 43 },
  ];
  const maxLegs = Math.max(...legLengths.map(l => l.won));
  const h2h = [
    { opp: 'Luke Littler', rank: 1, w: 2, l: 4, avg: 96.1 },
    { opp: 'Michael van Gerwen', rank: 2, w: 1, l: 5, avg: 95.4 },
    { opp: 'Luke Humphries', rank: 3, w: 3, l: 2, avg: 97.8 },
    { opp: 'Nathan Aspinall', rank: 4, w: 4, l: 3, avg: 98.2 },
    { opp: 'Rob Cross', rank: 9, w: 4, l: 4, avg: 97.1 },
    { opp: 'Gerwyn Price', rank: 7, w: 8, l: 3, avg: 99.4 },
    { opp: 'Gary Anderson', rank: 14, w: 5, l: 4, avg: 98.7 },
    { opp: 'Michael Smith', rank: 6, w: 3, l: 5, avg: 96.8 },
  ];
  const busts = [
    { score: 36, count: 12, reason: 'Hits S18 leaving 18' },
    { score: 32, count: 9, reason: 'Hits S16 leaving 16, then misses' },
    { score: 64, count: 8, reason: 'Hits S16 leaving 48, misses D24' },
    { score: 48, count: 7, reason: 'Misses D16, hits S8 leaving 40' },
    { score: 24, count: 6, reason: 'Hits S8 leaving 16, then misses D8' },
  ];
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-white">Advanced Performance Stats</h1>
        <p className="text-gray-400 text-sm mt-1">2025 season · 47 matches played · All PDC events</p>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Match average', value: '97.8' }, { label: 'First 9 average', value: String(player.firstNineAverage) },
          { label: 'Checkout %', value: '41.2%' }, { label: '180s / match', value: '4.2' },
          { label: 'Legs won / match', value: '8.1' }, { label: 'Win rate', value: '68%' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-medium text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-white font-medium">First 9-dart average</h2><p className="text-gray-500 text-xs mt-0.5">Average score in the first 3 visits per leg · Elite threshold: 100+</p></div>
          <div className="flex gap-4 text-xs text-gray-400"><span>Jake 2025: <strong className="text-white">{player.firstNineAverage}</strong></span><span>PDC avg: <strong className="text-gray-300">96.8</strong></span></div>
        </div>
        <div className="relative h-28">
          <div className="absolute inset-0 flex items-end gap-1">
            {first9Avg.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-sm transition-all ${v >= 100 ? 'bg-red-500/70' : 'bg-gray-700'}`} style={{ height: `${((v - 88) / 25) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="absolute left-0 right-0 border-t border-dashed border-red-500/40" style={{ bottom: `${((100 - 88) / 25) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2"><span>PC 1</span><span>PC 5</span><span>PC 10</span><span>PC 15</span></div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Scoring zones — 2025 season totals</h2>
        <div className="space-y-3">
          {scoringZones.map((z, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center text-sm">
              <span className="col-span-2 text-gray-400">{z.label}</span>
              <div className="col-span-7 relative h-5 bg-gray-800 rounded overflow-hidden">
                <div className={`absolute left-0 top-0 h-full ${z.color} opacity-70 rounded`} style={{ width: `${(z.jake / 900) * 100}%` }} />
                <div className="absolute top-0 h-full border-r-2 border-white/40" style={{ left: `${(z.pdc / 900) * 100}%` }} />
              </div>
              <div className="col-span-3 flex gap-3 text-xs"><span className="text-white">{z.jake}</span><span className="text-gray-500">PDC: {z.pdc}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-1">Leg efficiency</h2>
        <p className="text-gray-500 text-xs mb-3">Legs won in X darts · Season avg won: 18.3 darts</p>
        <div className="flex items-end gap-2 h-24">
          {legLengths.map((leg, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-white text-xs font-medium">{leg.won}</span>
              <div className="w-full bg-red-500/60 rounded-sm" style={{ height: `${(leg.won / maxLegs) * 72}px` }} />
              <span className="text-[10px] text-gray-500">{leg.darts}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-1">Bust rate analysis</h2>
        <p className="text-gray-500 text-xs mb-3">Overall 3.8% of checkout attempts — was 5.1% in 2024</p>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide"><span>Score left</span><span>Occurrences</span><span>Common cause</span></div>
          {busts.map((b, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-white/5 text-sm">
              <span className="text-red-400 font-medium">{b.score}</span>
              <span className="text-gray-300">{b.count}×</span>
              <span className="text-gray-500 text-xs">{b.reason}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Head-to-head vs top players</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide"><span className="col-span-2">Opponent</span><span>Rank</span><span>Record</span><span>Jake avg</span></div>
          {h2h.map((h, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center">
              <span className="col-span-2 text-gray-200">{h.opp}</span>
              <span className="text-gray-500">#{h.rank}</span>
              <span className={`font-medium ${h.w > h.l ? 'text-green-400' : h.w < h.l ? 'text-red-400' : 'text-gray-300'}`}>W{h.w} L{h.l}</span>
              <span className="text-gray-300">{h.avg}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── MATCH PREP VIEW ──────────────────────────────────────────────────────────
function MatchPrepView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [step, setStep] = useState(1)
  const [opponent, setOpponent] = useState('Gerwyn Price')
  const [recentForm, setRecentForm] = useState<string[]>(['W','L','W'])
  const [oppAvg, setOppAvg] = useState('96.2')
  const [format, setFormat] = useState('Best of 11 legs')
  const [stage, setStage] = useState('R1')
  const [venue, setVenue] = useState('Westfalenhalle, Dortmund')
  const [aiPlan, setAiPlan] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const formChips = ['W','L','W','W','L','W','L']
  const formatOptions = ['Best of 11 legs','Best of 19 legs','Best of 35 legs','Sets (Best of 5)','Sets (Best of 7)']
  const stageOptions = ['R1','R2','QF','SF','Final','Group Stage','League Night']

  const generateAnalysis = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: `You are the AI tactical analyst for ${session.userName || player.name} "${player.nickname}", PDC #${player.pdcRank} professional darts player.

Generate a detailed match preparation game plan.

My player: ${session.userName || player.name} — 3-dart avg ${player.threeDartAverage}, checkout ${player.checkoutPercent}%, first-9 avg ${player.firstNineAverage}, 180s/leg ${player.oneEightiesPerLeg}.
Opponent: ${opponent} — avg ${oppAvg}, recent form ${recentForm.join(',')}.
Format: ${format}. Stage: ${stage}. Venue: ${venue}.

Include:
1. Opening strategy (first 3 legs)
2. Key tactical notes for this opponent
3. Checkout route priorities
4. Mental cues for pressure moments
5. One sentence prediction

Write concisely. Max 250 words. No markdown formatting. Plain text only. Start each section on a new line with a label.` }] })
      })
      const data = await res.json()
      const text = data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || ''
      setAiPlan(cleanResponse(text))
    } catch { setAiPlan('Unable to generate analysis. Check API connection.') }
    setAiLoading(false)
    setStep(4)
  }

  return (
    <div className="p-6 space-y-6 match-prep-content">
      <style dangerouslySetInnerHTML={{ __html: `
@media print {
  body { background: white !important; color: black !important; }
  aside, nav, .quick-actions, .print\\:hidden { display: none !important; }
  .match-prep-content { max-width: 100% !important; padding: 0 !important; }
  .text-white { color: black !important; }
  .text-gray-400, .text-gray-300, .text-gray-500 { color: #555 !important; }
  .text-red-400, .text-red-300 { color: #c41e3a !important; }
  h1 { font-size: 18pt !important; }
}
      ` }} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Match Prep Wizard</h1>
          <p className="text-gray-400 text-sm mt-1">4-step darts-specific match preparation</p>
        </div>
        <button onClick={() => window.print()} className="px-3 py-1.5 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-gray-200 flex items-center gap-1.5 print:hidden">
          <FileText className="w-3 h-3" /> Print briefing
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['Opponent','Format','AI Analysis','Game Plan'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${step > i+1 ? 'bg-green-600 text-white' : step === i+1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{step > i+1 ? '✓' : i+1}</div>
            <span className={`text-[10px] ${step === i+1 ? 'text-white font-semibold' : 'text-gray-600'}`}>{s}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Opponent */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5 space-y-4">
            <div><label className="text-xs text-gray-400 block mb-1">Opponent Name</label><input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g. Gerwyn Price" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Opponent Recent Form (click to toggle)</label>
              <div className="flex gap-2">
                {formChips.map((r, i) => {
                  const selected = recentForm[i]
                  return <button key={i} onClick={() => { const nf = [...recentForm]; if (nf[i]) { nf.splice(i, 1) } else { nf.splice(i, 0, r) }; setRecentForm(nf) }} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${recentForm.includes(r) && i < recentForm.length ? (r === 'W' ? 'bg-teal-600/40 text-teal-400 border border-teal-600/50' : 'bg-red-600/30 text-red-400 border border-red-600/50') : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>{r}</button>
                })}
              </div>
            </div>
            <div><label className="text-xs text-gray-400 block mb-1">Opponent 3-Dart Average</label><input value={oppAvg} onChange={e => setOppAvg(e.target.value)} placeholder="e.g. 96.2" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
          </div>
          <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Next: Format &amp; Venue &rarr;</button>
        </div>
      )}

      {/* Step 2: Format */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5 space-y-4">
            <div><label className="text-xs text-gray-400 block mb-1">Match Format</label>
              <div className="flex flex-wrap gap-2">{formatOptions.map(f => (<button key={f} onClick={() => setFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${format === f ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{f}</button>))}</div>
            </div>
            <div><label className="text-xs text-gray-400 block mb-1">Stage</label>
              <div className="flex flex-wrap gap-2">{stageOptions.map(s => (<button key={s} onClick={() => setStage(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${stage === s ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{s}</button>))}</div>
            </div>
            <div><label className="text-xs text-gray-400 block mb-1">Venue</label><input value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-700">&larr; Back</button>
            <button onClick={generateAnalysis} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Generate AI Analysis &rarr;</button>
          </div>
        </div>
      )}

      {/* Step 3: AI Generating */}
      {step === 3 && aiLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full mb-4" />
          <p className="text-sm text-gray-400">AI is analysing {opponent}&apos;s data and building your game plan...</p>
          <p className="text-xs text-gray-600 mt-2">Powered by /api/ai/darts</p>
        </div>
      )}

      {/* Step 4: Game Plan */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
            <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">MATCH PLAN</div>
            <div className="text-white font-bold text-xl mb-1">{session.userName || player.name} vs {opponent}</div>
            <div className="text-sm text-gray-300">{format} · {stage} · {venue}</div>
            <div className="text-xs text-gray-500 mt-1">Opponent avg: {oppAvg} · Form: {recentForm.join(' ')}</div>
          </div>

          {aiPlan && (
            <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><span>🤖</span><span className="text-sm font-bold text-white">AI Game Plan</span></div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Generated by Claude</span>
              </div>
              <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{aiPlan}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { if (aiPlan) { try { localStorage.setItem('lumio_darts_match_prep_' + Date.now(), JSON.stringify({ opponent, format, stage, venue, oppAvg, recentForm, plan: aiPlan })) } catch {} } alert('Game plan saved!') }} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Save Game Plan</button>
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Start Practice</button>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-2.5 rounded-xl text-sm text-gray-400 border border-gray-700">&larr; New Match Prep</button>
        </div>
      )}

      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── WALK-ON MUSIC VIEW ───────────────────────────────────────────────────────
function WalkOnMusicView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [showToast, setShowToast] = useState(false);
  const [newTrack, setNewTrack] = useState('');
  const [reason, setReason] = useState('');
  function submit() { setShowToast(true); setNewTrack(''); setReason(''); setTimeout(() => setShowToast(false), 3000); }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Walk-on Music</h1>
        <p className="text-gray-400 text-sm mt-1">Approved tracks, broadcaster clearance, change requests</p>
      </div>
      <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-600/30 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-black/40 border border-red-600/30 flex items-center justify-center text-3xl flex-shrink-0">🎵</div>
          <div className="flex-1">
            <div className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-1">Current walk-on track</div>
            <div className="text-white font-bold text-lg">"Iron" — Within Temptation</div>
            <div className="text-xs text-gray-400 mt-1">Duration 2:04 · BPM 138 · PDC Ref #WM-2847</div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Broadcaster approval status</h2>
        <div className="grid grid-cols-5 gap-2 text-sm">
          {[
            { b: 'Sky Sports', ok: true }, { b: 'DAZN', ok: true }, { b: 'ITV', ok: true },
            { b: 'BBC', ok: true }, { b: 'RTL (DE)', ok: true },
          ].map((s, i) => (
            <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.b}</div>
              <div className={`text-sm font-medium mt-1 ${s.ok ? 'text-green-400' : 'text-amber-400'}`}>{s.ok ? '✓ Approved' : 'Pending'}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-medium">Backup track</h2>
          <span className="text-[10px] text-amber-400 uppercase tracking-wide">Partially approved</span>
        </div>
        <div className="text-gray-300 text-sm">"Eye of the Tiger" — Survivor</div>
        <div className="text-xs text-gray-500 mt-1">Sky ✓ · ITV ✓ · BBC ✓ · DAZN ⏳ Pending · RTL ✓</div>
      </div>
      <div className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-4 text-sm text-amber-200">
        ⚠ DAZN backup approval still pending — submit by <strong className="text-amber-100">May 1</strong> for Grand Slam eligibility.
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-2">Brand identity notes</h2>
        <p className="text-gray-400 text-sm leading-relaxed">"Iron" aligns with the Red Dragon sponsor palette and Jake&apos;s aggressive throwing style. Cadence sits well with the 2m walk-on window. Alternatives must match 130+ BPM and avoid explicit language for broadcast clearance.</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Upcoming televised events — music required</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Event</span><span>Date</span><span>Broadcaster</span><span>Status</span>
          </div>
          {[
            { ev: 'Grand Slam of Darts', date: 'Nov 8', br: 'Sky Sports', st: '✓ Approved' },
            { ev: 'Premier League Night 14', date: 'May 2', br: 'Sky + DAZN', st: '⏳ DAZN pending' },
            { ev: 'World Matchplay', date: 'Jul 19', br: 'Sky Sports', st: '✓ Approved' },
            { ev: 'German Masters', date: 'Oct 4', br: 'RTL', st: '✓ Approved' },
          ].map((e, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="text-white">{e.ev}</span>
              <span className="text-gray-400">{e.date}</span>
              <span className="text-gray-400">{e.br}</span>
              <span className={e.st.startsWith('✓') ? 'text-green-400' : 'text-amber-400'}>{e.st}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Request track change</h2>
        <div className="space-y-3">
          <input value={newTrack} onChange={e => setNewTrack(e.target.value)} placeholder="Proposed track (Artist - Title)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500/60 focus:outline-none" />
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for change" rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500/60 focus:outline-none" />
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-sm font-medium hover:bg-red-600/30">Submit request</button>
        </div>
        {showToast && <div className="mt-3 px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-300 text-sm">✓ Request submitted for review</div>}
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PRACTICE GAMES VIEW ──────────────────────────────────────────────────────
// Defaults used when there's nothing in localStorage yet.
const PRACTICE_DEFAULTS: Record<string, number[]> = {
  bobs27:   [45, 52, 48, 63, 58, 71, 66, 78, 72, 85, 79, 91, 87, 83, 94, 88, 96, 92, 101, 97, 104, 98, 112, 108, 119, 115, 127, 123, 135, 141],
  atc:      [340, 332, 328, 319, 312, 305, 298, 294, 289, 282], // seconds (lower = better)
  t180:     [4, 5, 3, 6, 7, 5, 8, 6, 9, 11],
  doubles:  [325, 318, 312, 305, 298, 290, 284, 278, 272, 225], // seconds
  checkout: [8, 9, 10, 9, 11, 10, 12, 11, 13, 14],
  halveit:  [185, 198, 210, 225, 240, 258, 275, 290, 305, 320],
  shanghai: [72, 85, 91, 104, 118, 127, 135, 148, 159, 167],
  cricket:  [3, 4, 4, 5, 5, 6, 6, 7, 7, 8],
};

const PRACTICE_LS_KEYS: Record<string, string> = {
  bobs27:   'lumio_darts_bobs27_scores',
  atc:      'lumio_darts_atc_scores',
  t180:     'lumio_darts_180_scores',
  doubles:  'lumio_darts_doubles_scores',
  checkout: 'lumio_darts_checkout_scores',
  halveit:  'lumio_darts_halveit_scores',
  shanghai: 'lumio_darts_shanghai_scores',
  cricket:  'lumio_darts_cricket_scores',
};

function loadScores(key: string, fallback: number[]): number[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PRACTICE_LS_KEYS[key]);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(n => typeof n === 'number') ? parsed : fallback;
  } catch { return fallback; }
}

function PracticeGamesView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [bobs27, setBobs27] = useState<number[]>(() => loadScores('bobs27', PRACTICE_DEFAULTS.bobs27));
  const [atc, setAtc] = useState<number[]>(() => loadScores('atc', PRACTICE_DEFAULTS.atc));
  const [t180, setT180] = useState<number[]>(() => loadScores('t180', PRACTICE_DEFAULTS.t180));
  const [doubles, setDoubles] = useState<number[]>(() => loadScores('doubles', PRACTICE_DEFAULTS.doubles));
  const [checkout, setCheckout] = useState<number[]>(() => loadScores('checkout', PRACTICE_DEFAULTS.checkout));
  const [halveit, setHalveit] = useState<number[]>(() => loadScores('halveit', PRACTICE_DEFAULTS.halveit));
  const [shanghai, setShanghai] = useState<number[]>(() => loadScores('shanghai', PRACTICE_DEFAULTS.shanghai));
  const [cricket, setCricket] = useState<number[]>(() => loadScores('cricket', PRACTICE_DEFAULTS.cricket));

  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.bobs27, JSON.stringify(bobs27)); }, [bobs27]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.atc, JSON.stringify(atc)); }, [atc]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.t180, JSON.stringify(t180)); }, [t180]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.doubles, JSON.stringify(doubles)); }, [doubles]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.checkout, JSON.stringify(checkout)); }, [checkout]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.halveit, JSON.stringify(halveit)); }, [halveit]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.shanghai, JSON.stringify(shanghai)); }, [shanghai]);
  useEffect(() => { localStorage.setItem(PRACTICE_LS_KEYS.cricket, JSON.stringify(cricket)); }, [cricket]);

  const [logOpen, setLogOpen] = useState<string | null>(null);
  const [logValue, setLogValue] = useState<string>('');

  const pb = (arr: number[], lower: boolean = false) => {
    if (!arr.length) return 0;
    return lower ? Math.min(...arr) : Math.max(...arr);
  };
  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  type GameCfg = {
    key: string;
    name: string;
    scores: number[];
    setScores: (v: number[]) => void;
    target: string;
    unit: string;
    lowerIsBetter?: boolean;
    displayValue: (n: number) => string;
  };

  const games: GameCfg[] = [
    { key: 'bobs27',   name: "Bob's 27",         scores: bobs27,   setScores: setBobs27,   target: '100',    unit: 'pts',    displayValue: n => String(n) },
    { key: 'atc',      name: 'Around the Clock', scores: atc,      setScores: setAtc,      target: '4:30',   unit: 'time',   lowerIsBetter: true, displayValue: fmtTime },
    { key: 't180',     name: '180 Challenge',    scores: t180,     setScores: setT180,     target: '9',      unit: '180s',   displayValue: n => String(n) },
    { key: 'doubles',  name: 'Doubles Round',    scores: doubles,  setScores: setDoubles,  target: '4:00',   unit: 'time',   lowerIsBetter: true, displayValue: fmtTime },
    { key: 'checkout', name: 'Checkout Trainer', scores: checkout, setScores: setCheckout, target: '13/20',  unit: 'hits',   displayValue: n => `${n}/20` },
    { key: 'halveit',  name: 'Halve It',         scores: halveit,  setScores: setHalveit,  target: '260',    unit: 'pts',    displayValue: n => String(n) },
    { key: 'shanghai', name: 'Shanghai',         scores: shanghai, setScores: setShanghai, target: '130',    unit: 'pts',    displayValue: n => String(n) },
    { key: 'cricket',  name: 'Cricket',          scores: cricket,  setScores: setCricket,  target: '7',      unit: 'rounds', displayValue: n => String(n) },
  ];

  const submitLog = () => {
    if (!logOpen) return;
    const n = Number(logValue);
    if (!Number.isFinite(n)) { setLogOpen(null); setLogValue(''); return; }
    const g = games.find(x => x.key === logOpen);
    if (g) g.setScores([n, ...g.scores].slice(0, 30));
    setLogOpen(null);
    setLogValue('');
  };

  const resetAll = () => {
    if (typeof window === 'undefined') return;
    if (!window.confirm('Reset all practice game scores to the default demo data? This cannot be undone.')) return;
    Object.values(PRACTICE_LS_KEYS).forEach(k => localStorage.removeItem(k));
    setBobs27(PRACTICE_DEFAULTS.bobs27);
    setAtc(PRACTICE_DEFAULTS.atc);
    setT180(PRACTICE_DEFAULTS.t180);
    setDoubles(PRACTICE_DEFAULTS.doubles);
    setCheckout(PRACTICE_DEFAULTS.checkout);
    setHalveit(PRACTICE_DEFAULTS.halveit);
    setShanghai(PRACTICE_DEFAULTS.shanghai);
    setCricket(PRACTICE_DEFAULTS.cricket);
  };

  const bobs27PB = pb(bobs27);
  const bobs27Max = Math.max(...bobs27, 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Practice Games</h1>
        <p className="text-gray-400 text-sm mt-1">Logged practice sessions — personal bests, averages, coach targets</p>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/60 border border-white/5 text-sm">
        <span className="text-base">📊</span>
        <span className="text-gray-300"><strong className="text-white">{bobs27.length} sessions logged</strong> · Bob&apos;s 27 PB: <strong className="text-white">{bobs27PB}</strong> · All scores saved locally</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {games.map(g => {
          const last10 = g.scores.slice(0, 10);
          const gameMax = Math.max(...g.scores, 1);
          const pbVal = pb(g.scores, g.lowerIsBetter);
          const avgVal = avg(g.scores);
          return (
            <div key={g.key} className="bg-gray-900/60 border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{g.name}</h3>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-gray-500">PB: <strong className="text-white">{g.displayValue(pbVal)}</strong></span>
                    <span className="text-gray-500">Avg: <strong className="text-gray-300">{g.unit === 'time' ? fmtTime(avgVal) : avgVal}</strong></span>
                    <span className="text-gray-500">Target: <strong className="text-amber-400">{g.target}</strong></span>
                  </div>
                </div>
                <button onClick={() => { setLogOpen(g.key); setLogValue(''); }} className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-medium hover:bg-red-600/30">Log session</button>
              </div>
              {logOpen === g.key && (
                <div className="mb-3 p-3 rounded-lg bg-black/40 border border-white/10">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">Log new score ({g.unit === 'time' ? 'seconds' : g.unit})</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={logValue}
                      onChange={e => setLogValue(e.target.value)}
                      placeholder="Enter score"
                      autoFocus
                      className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-red-500/60 focus:outline-none"
                    />
                    <button onClick={submitLog} className="px-3 py-1.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-medium hover:bg-red-600/50">Confirm</button>
                    <button onClick={() => { setLogOpen(null); setLogValue(''); }} className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 border border-white/10 text-xs font-medium hover:bg-gray-700">Cancel</button>
                  </div>
                </div>
              )}
              {last10.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Last {last10.length} sessions</p>
                  <div className="flex items-end gap-1 h-8">
                    {last10.slice().reverse().map((v, j) => (
                      <div key={j} className="flex-1 bg-red-500/60 rounded-sm" style={{ height: `${(v / gameMax) * 100}%` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Bob&apos;s 27 — last {Math.min(bobs27.length, 30)}-session trend</h2>
        <div className="flex items-end gap-1 h-24">
          {bobs27.slice(0, 30).slice().reverse().map((v, i) => (
            <div key={i} className="flex-1 bg-red-500/60 rounded-sm" style={{ height: `${(v / bobs27Max) * 100}%` }} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Personal best: <strong className="text-white">{bobs27PB}</strong> · Sessions stored: <strong className="text-gray-300">{bobs27.length}</strong></p>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Coach targets (Marco)</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Hit 100+ on Bob&apos;s 27 in 80% of sessions</li>
          <li>• Sub-4:30 on Around the Clock consistently</li>
          <li>• 13/20 on Checkout Trainer — focus on 40, 32, 16 finishes</li>
          <li>• 9+ maximums on 180 Challenge</li>
        </ul>
      </div>
      <div className="flex justify-end">
        <button onClick={resetAll} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 border border-white/10 text-xs font-medium hover:bg-gray-700 hover:text-white">↺ Reset to demo data</button>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PHYSIO & RECOVERY VIEW ───────────────────────────────────────────────────
function PhysioRecoveryView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const bodyParts: Record<string, { status: string; note: string; colour: string }> = {
    'Right shoulder': { status: 'Monitor', note: 'Minor tightness 3/10 — cleared for play, ice post-match', colour: 'amber' },
    'Elbow': { status: 'OK', note: 'No issues — full range of motion', colour: 'green' },
    'Wrist': { status: 'OK', note: 'No issues', colour: 'green' },
    'Back': { status: 'OK', note: 'Lower back prevention routine in place', colour: 'green' },
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Physio &amp; Recovery</h1>
        <p className="text-gray-400 text-sm mt-1">Body map, treatment log, prevention programme</p>
      </div>
      <div className="bg-gradient-to-r from-green-900/30 to-green-900/10 border border-green-600/30 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="text-white font-medium">Cleared for tonight</div>
            <div className="text-xs text-gray-400 mt-0.5">Arm good · Minor shoulder tightness 3/10 (right) · No restrictions</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-medium mb-3">Body map</h2>
          <div className="flex justify-center">
            <svg width="180" height="260" viewBox="0 0 180 260">
              <circle cx="90" cy="30" r="22" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="60" y="52" width="60" height="90" rx="10" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="32" y="58" width="22" height="74" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="126" y="58" width="22" height="74" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="66" y="142" width="22" height="90" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <rect x="92" y="142" width="22" height="90" rx="8" fill="none" stroke="#4b5563" strokeWidth="2" />
              <circle cx="128" cy="62" r="8" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Right shoulder')} />
              <circle cx="138" cy="92" r="6" fill="#10b981" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Elbow')} />
              <circle cx="144" cy="128" r="6" fill="#10b981" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Wrist')} />
              <circle cx="90" cy="100" r="6" fill="#10b981" stroke="#fff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => setSelectedBodyPart('Back')} />
            </svg>
          </div>
          {selectedBodyPart && (
            <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-sm">{selectedBodyPart}</span>
                <span className={`text-xs ${bodyParts[selectedBodyPart].colour === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>{bodyParts[selectedBodyPart].status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{bodyParts[selectedBodyPart].note}</p>
            </div>
          )}
        </div>
        <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-medium mb-3">Injury history</h2>
          <div className="space-y-2">
            {[
              { date: '2024-11', site: 'Left shoulder strain', severity: 'Moderate', days: 9 },
              { date: '2024-06', site: 'Right elbow tendonitis', severity: 'Mild', days: 4 },
              { date: '2024-02', site: 'Lower back tightness', severity: 'Mild', days: 2 },
            ].map((inj, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                <div>
                  <div className="text-gray-200">{inj.site}</div>
                  <div className="text-xs text-gray-500">{inj.date} · {inj.severity}</div>
                </div>
                <span className="text-xs text-gray-400">{inj.days}d out</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Treatment log — last 5 sessions</h2>
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-black/40 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Date</span><span>Therapist</span><span>Focus</span><span>Duration</span>
          </div>
          {[
            { date: '15 Apr', therapist: 'Dr. Singh', focus: 'Shoulder mobility + soft tissue', time: '45 min' },
            { date: '12 Apr', therapist: 'J. Porter', focus: 'Full upper body sports massage', time: '60 min' },
            { date: '9 Apr', therapist: 'Dr. Singh', focus: 'Elbow ultrasound + ice', time: '30 min' },
            { date: '5 Apr', therapist: 'M. Lawrence', focus: 'Deep tissue — back + shoulders', time: '75 min' },
            { date: '2 Apr', therapist: 'Dr. Singh', focus: 'ROM assessment', time: '30 min' },
          ].map((s, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="text-gray-400">{s.date}</span>
              <span className="text-white">{s.therapist}</span>
              <span className="text-gray-400 text-xs">{s.focus}</span>
              <span className="text-gray-400">{s.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Prevention — daily routine</h2>
        <div className="space-y-2">
          {['Foam roll — 10 min', 'Shoulder mobility drills', 'Wrist &amp; forearm stretches', 'Neck release', 'Hydration — 3L water'].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
              <span className="text-gray-300" dangerouslySetInnerHTML={{ __html: item }} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Physio contacts</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Dr. Anita Singh', role: 'Lead Physio', phone: '07700 900001' },
            { name: 'James Porter', role: 'Sports Rehab', phone: '07700 900002' },
            { name: 'Mike Lawrence', role: 'Massage Therapist', phone: '07700 900003' },
          ].map((p, i) => (
            <div key={i} className="bg-gray-900/60 border border-white/5 rounded-xl p-3">
              <div className="text-white font-medium text-sm">{p.name}</div>
              <div className="text-xs text-gray-500">{p.role}</div>
              <div className="text-xs text-red-400 mt-1">{p.phone}</div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── DRAW & BRACKET VIEW ──────────────────────────────────────────────────────
function DrawBracketView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [tournament, setTournament] = useState<'european' | 'grand-slam' | 'matchplay' | 'uk-open'>('european');
  const [showFull, setShowFull] = useState(false);
  const path = [
    { round: 'R1', opp: 'Gerwyn Price (#7)', prize: '£25,000', status: 'tonight' },
    { round: 'R2', opp: 'Winner M. Smith/R. Cross', prize: '£35,000', status: 'pending' },
    { round: 'QF', opp: 'Projected: L. Humphries (#3)', prize: '£50,000', status: 'pending' },
    { round: 'SF', opp: 'Projected: L. Littler (#1)', prize: '£80,000', status: 'pending' },
    { round: 'Final', opp: 'Projected: MVG (#2)', prize: '£110,000 winner', status: 'pending' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Draw &amp; Bracket</h1>
        <p className="text-gray-400 text-sm mt-1">Tournament draws and projected paths</p>
      </div>
      <div className="flex items-center gap-2">
        {([
          { id: 'european', label: 'European Championship' },
          { id: 'grand-slam', label: 'Grand Slam' },
          { id: 'matchplay', label: 'World Matchplay' },
          { id: 'uk-open', label: 'UK Open' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTournament(t.id)} className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${tournament === t.id ? 'bg-red-600/20 text-red-300 border-red-500/30' : 'bg-gray-900/40 text-gray-500 border-white/5 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-4">Jake&apos;s quarter — Round 1</h2>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3">
            <div className="text-red-300 font-semibold">LIVE TONIGHT</div>
            <div className="text-white mt-1">Jake Morrison (#19)</div>
            <div className="text-gray-400">vs Gerwyn Price (#7)</div>
          </div>
          {[
            { top: 'Michael Smith', bot: 'Rob Cross' },
            { top: 'Gary Anderson', bot: 'Dirk van Duijvenbode' },
            { top: 'Luke Humphries', bot: 'Daryl Gurney' },
          ].map((m, i) => (
            <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3">
              <div className="text-gray-400">{m.top}</div>
              <div className="text-gray-500 text-[10px] my-1">vs</div>
              <div className="text-gray-400">{m.bot}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-3">Winner of Jake's bracket enters QF Thursday night</div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Path to the title</h2>
        <div className="space-y-2">
          {path.map((p, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${p.status === 'tonight' ? 'bg-red-600/20 border-red-500/30' : 'bg-gray-900/60 border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.status === 'tonight' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{p.round}</div>
                <span className={p.status === 'tonight' ? 'text-white font-medium' : 'text-gray-300'}>{p.opp}</span>
              </div>
              <span className={`text-sm font-medium ${p.status === 'tonight' ? 'text-red-300' : 'text-gray-400'}`}>{p.prize}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl">
        <button onClick={() => setShowFull(!showFull)} className="w-full flex items-center justify-between px-5 py-4 text-left">
          <h2 className="text-white font-medium">Full 32-player bracket</h2>
          <span className="text-xs text-gray-400">{showFull ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showFull && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-4 gap-2 text-xs">
              {['L. Littler', 'M. Smith', 'R. Cross', 'J. Wade', 'G. Anderson', 'D. van Duijvenbode', 'J. Morrison', 'G. Price', 'L. Humphries', 'D. Gurney', 'M. van Gerwen', 'D. Chisnall', 'N. Aspinall', 'P. Wright', 'D. Noppert', 'G. Clayton'].map((p, i) => (
                <div key={i} className="bg-black/30 border border-white/5 rounded px-2 py-1.5 text-gray-400">{p}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 text-sm text-amber-200">
        ℹ️ Players Championship events use a no-advance-draw format — opponents are drawn on the day of the event.
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PRIZE MONEY FORECAST VIEW ────────────────────────────────────────────────
function PrizeForecastView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const pctEarned = (42800 / 150000) * 100;
  const years = [
    { year: '2020', amount: 32000 },
    { year: '2021', amount: 58000 },
    { year: '2022', amount: 71000 },
    { year: '2023', amount: 89000 },
    { year: '2024', amount: 102000 },
    { year: '2025', amount: 139000, projected: true },
  ];
  const upcoming = [
    { ev: 'Prague Open', date: 'Apr 22', pool: '£120k', expect: 'R3', earn: '£3,500' },
    { ev: 'Players Ch. 8', date: 'Apr 28', pool: '£100k', expect: 'QF', earn: '£5,000' },
    { ev: 'Players Ch. 9', date: 'May 3', pool: '£100k', expect: 'R3', earn: '£2,500' },
    { ev: 'Premier League N14', date: 'May 9', pool: '£275k', expect: 'Win', earn: '£15,000' },
    { ev: 'European Open', date: 'May 23', pool: '£150k', expect: 'QF', earn: '£7,500' },
    { ev: 'World Cup', date: 'Jun 12', pool: '£450k', expect: 'SF', earn: '£12,000' },
    { ev: 'Players Ch. 12', date: 'Jun 20', pool: '£100k', expect: 'SF', earn: '£7,500' },
    { ev: 'World Matchplay', date: 'Jul 19', pool: '£800k', expect: 'QF', earn: '£20,000' },
    { ev: 'World Masters', date: 'Aug 15', pool: '£350k', expect: 'SF', earn: '£18,000' },
    { ev: 'German Masters', date: 'Oct 4', pool: '£150k', expect: 'R3', earn: '£4,000' },
    { ev: 'Grand Slam', date: 'Nov 8', pool: '£650k', expect: 'QF', earn: '£16,000' },
    { ev: 'Players Championship Finals', date: 'Nov 22', pool: '£500k', expect: 'R3', earn: '£8,000' },
  ];
  const waterfall = [
    { label: 'Gross earnings', amount: 140000, running: 140000, colour: 'text-white' },
    { label: 'PDPA levy (2%)', amount: -2800, running: 137200, colour: 'text-red-400' },
    { label: 'Agent fee (12%)', amount: -16800, running: 120400, colour: 'text-red-400' },
    { label: 'Travel, hotels, entries', amount: -28000, running: 92400, colour: 'text-red-400' },
    { label: 'Tax (approx)', amount: -25400, running: 67000, colour: 'text-red-400' },
    { label: 'Net to Jake', amount: 67000, running: 67000, colour: 'text-green-400' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Prize Money Forecaster</h1>
        <p className="text-gray-400 text-sm mt-1">Season earnings, projections, deductions</p>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-medium">Season earnings tracker</h2>
            <p className="text-xs text-gray-500 mt-0.5">Through 16 of 48 events</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">£42,800</div>
            <div className="text-xs text-gray-400">earned · on pace for <strong className="text-red-300">£139,000</strong></div>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${pctEarned}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
          <span>£0</span><span>Target: £150k</span>
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Earnings by tour type</h2>
        <div className="space-y-2">
          {[
            { label: 'Players Championships', amount: 18400, pct: 43 },
            { label: 'European Tour', amount: 11200, pct: 26 },
            { label: 'Majors (TV)', amount: 13200, pct: 31 },
          ].map((t, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center text-sm">
              <span className="col-span-3 text-gray-300">{t.label}</span>
              <div className="col-span-7 h-5 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-red-500/70 rounded" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="col-span-2 text-right text-white font-medium">£{t.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Upcoming events — projected earnings</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-4">Event</span><span className="col-span-2">Date</span><span className="col-span-2">Prize pool</span><span className="col-span-2">Expected</span><span className="col-span-2 text-right">Projected</span>
          </div>
          {upcoming.map((u, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="col-span-4 text-white">{u.ev}</span>
              <span className="col-span-2 text-gray-400">{u.date}</span>
              <span className="col-span-2 text-gray-500">{u.pool}</span>
              <span className="col-span-2 text-amber-400">{u.expect}</span>
              <span className="col-span-2 text-right text-red-300 font-medium">{u.earn}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-medium mb-3">Deductions waterfall (annual)</h2>
        <div className="space-y-2">
          {waterfall.map((w, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 text-sm">
              <span className="text-gray-300">{w.label}</span>
              <div className="flex items-center gap-6">
                <span className={w.colour}>{w.amount < 0 ? '-' : ''}£{Math.abs(w.amount).toLocaleString()}</span>
                <span className="text-xs text-gray-500 w-24 text-right">Running: £{w.running.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">Net take-home approximately <strong className="text-green-400">£67,000</strong> on projected gross of £140k</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Career earnings 2020–2025</h2>
        <div className="flex items-end gap-3 h-32">
          {years.map((y, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-white font-medium">£{(y.amount / 1000).toFixed(0)}k</span>
              <div className={`w-full rounded-sm ${y.projected ? 'bg-amber-500/60' : 'bg-red-500/60'}`} style={{ height: `${(y.amount / 150000) * 100}%` }} />
              <span className="text-[10px] text-gray-500">{y.year}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">Amber = projected</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Pending payments</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Event</span><span>Amount</span><span>Due</span><span>Status</span>
          </div>
          {[
            { ev: 'Players Ch. 19', amount: '£4,200', due: 'May 1', status: 'Pending' },
            { ev: 'Euro Tour 4', amount: '£2,800', due: 'Apr 28', status: 'Processing' },
            { ev: 'Premier League N11', amount: '£5,000', due: 'Apr 20', status: 'Paid' },
          ].map((p, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
              <span className="text-white">{p.ev}</span>
              <span className="text-gray-300">{p.amount}</span>
              <span className="text-gray-400">{p.due}</span>
              <span className={p.status === 'Paid' ? 'text-green-400' : p.status === 'Processing' ? 'text-amber-400' : 'text-gray-400'}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── LIVE SCORES VIEW ─────────────────────────────────────────────────────────
type LiveMatch = { p1: string; r1: number; p2: string; r2: number; avg1: number; avg2: number; status: 'live' | 'upcoming' | 'complete'; board: number; round: string; isJake?: boolean; time?: string };

function LiveScoresView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'jake' | 'all' | 'upcoming'>('jake');

  const allMatches: LiveMatch[] = [
    { p1: 'Luke Littler', r1: 2, p2: 'Martin Schindler', r2: 0, avg1: 108.2, avg2: 94.1, status: 'live', board: 1, round: 'R1' },
    { p1: 'Michael van Gerwen', r1: 1, p2: 'Niels Zonneveld', r2: 1, avg1: 99.4, avg2: 97.8, status: 'live', board: 2, round: 'R1' },
    { p1: 'Luke Humphries', r1: 2, p2: 'Ricky Evans', r2: 0, avg1: 104.1, avg2: 91.2, status: 'live', board: 3, round: 'R1' },
    { p1: 'Jake Morrison', r1: 1, p2: 'Gerwyn Price', r2: 0, avg1: 101.4, avg2: 96.8, status: 'live', board: 4, round: 'R1', isJake: true },
    { p1: 'Rob Cross', r1: 1, p2: 'Danny Noppert', r2: 0, avg1: 96.8, avg2: 95.1, status: 'live', board: 5, round: 'R1' },
    { p1: 'Nathan Aspinall', r1: 0, p2: 'Florian Hempel', r2: 0, avg1: 0, avg2: 0, status: 'upcoming', board: 6, round: 'R1', time: '21:00' },
    { p1: 'Michael Smith', r1: 0, p2: 'Kevin Doets', r2: 0, avg1: 0, avg2: 0, status: 'upcoming', board: 7, round: 'R1', time: '21:00' },
    { p1: 'Peter Wright', r1: 2, p2: 'Bradley Brooks', r2: 1, avg1: 97.3, avg2: 94.8, status: 'complete', board: 1, round: 'R1' },
    { p1: 'Damon Heta', r1: 2, p2: 'Callan Rydz', r2: 0, avg1: 98.1, avg2: 88.4, status: 'complete', board: 2, round: 'R1' },
  ];

  const jakeVisits = [
    { visit: 1, jake: 60, price: 60, jakeLeft: 441, priceLeft: 441 },
    { visit: 2, jake: 100, price: 81, jakeLeft: 341, priceLeft: 360 },
    { visit: 3, jake: 60, price: 60, jakeLeft: 281, priceLeft: 300 },
    { visit: 4, jake: 140, price: 89, jakeLeft: 141, priceLeft: 211 },
    { visit: 5, jake: 60, price: 60, jakeLeft: 81, priceLeft: 151 },
  ];

  const live = allMatches.filter(m => m.status === 'live');
  const complete = allMatches.filter(m => m.status === 'complete');
  const upcoming = allMatches.filter(m => m.status === 'upcoming');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Live Scores</h1>
          <p className="text-gray-400 text-sm mt-1">PDC European Championship · Dortmund · April 8 2025</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-red-400 font-medium">Live · 5 matches in progress</span>
        </div>
      </div>

      <div className="flex rounded-lg border border-white/5 overflow-hidden w-fit">
        {(['jake', 'all', 'upcoming'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium transition-colors border-r border-white/5 last:border-r-0 ${tab === t ? 'bg-red-600/20 text-red-300' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300'}`}>
            {t === 'jake' ? "Jake's match" : t === 'all' ? 'All matches' : 'Upcoming'}
          </button>
        ))}
      </div>

      {tab === 'jake' && (
        <div className="space-y-4">
          <div className="bg-gray-900/60 rounded-xl border border-red-500/20 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-red-400 font-medium uppercase tracking-wide">🔴 Live · R1 · Board 4 · Set 1</span>
              <span className="text-xs text-gray-500">PDC European Championship</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-white font-medium">Jake Morrison 🏴󠁧󠁢󠁥󠁮󠁧󠁿</p>
                <p className="text-xs text-gray-500 mb-3">#19 PDC</p>
                <p className="text-5xl font-medium text-white">1</p>
                <p className="text-xs text-gray-500 mt-1">legs</p>
                <p className="text-2xl font-medium text-red-400 mt-3">81</p>
                <p className="text-xs text-gray-500">remaining · on checkout</p>
                <p className="text-xs text-green-400 mt-1">→ T19 D12 or T15 D18</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-gray-600 text-2xl font-medium">vs</p>
                <div className="mt-4 space-y-1 text-xs text-gray-500">
                  <p>avg: 101.4 · 96.8</p>
                  <p>180s: 1 · 0</p>
                  <p>Sets: 0 · 0</p>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">Gerwyn Price 🏴󠁧󠁢󠁷󠁬󠁳󠁿</p>
                <p className="text-xs text-gray-500 mb-3">#7 PDC</p>
                <p className="text-5xl font-medium text-gray-400">0</p>
                <p className="text-xs text-gray-500 mt-1">legs</p>
                <p className="text-2xl font-medium text-gray-300 mt-3">151</p>
                <p className="text-xs text-gray-500">remaining</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-white font-medium mb-3">Current leg — visit by visit</h2>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
                <span>Visit</span><span>Jake</span><span>Jake left</span><span>Price</span><span>Price left</span>
              </div>
              {jakeVisits.map((v, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/5 text-sm">
                  <span className="text-gray-500">{v.visit}</span>
                  <span className={`font-medium ${v.jake >= 140 ? 'text-red-400' : v.jake >= 100 ? 'text-amber-400' : 'text-gray-300'}`}>{v.jake}</span>
                  <span className="text-gray-300">{v.jakeLeft}</span>
                  <span className="text-gray-400">{v.price}</span>
                  <span className="text-gray-400">{v.priceLeft}</span>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/5 text-sm bg-red-950/20">
                <span className="text-gray-500">Now</span>
                <span className="text-red-400 font-medium">On finish</span>
                <span className="text-red-300 font-medium">81</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-400">151</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm text-gray-400">
            H2H: Jake leads <span className="text-white font-medium">8–3</span> · Jake&apos;s avg vs Price: <span className="text-white font-medium">99.4</span> · Win probability tonight: <span className="text-green-400 font-medium">62%</span>
          </div>
        </div>
      )}

      {tab === 'all' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">In progress ({live.length})</p>
            <div className="space-y-2">
              {live.map((m, i) => (
                <div key={i} className={`grid grid-cols-7 gap-2 px-4 py-3 rounded-xl border text-sm items-center ${m.isJake ? 'bg-red-950/20 border-red-500/20' : 'bg-gray-900/60 border-white/5'}`}>
                  <span className="col-span-2 text-gray-200 font-medium">{m.p1} {m.isJake ? '⭐' : ''}</span>
                  <span className="text-center">
                    <span className="text-white font-medium text-lg">{m.r1}</span>
                    <span className="text-gray-600 mx-1">–</span>
                    <span className="text-gray-400 text-lg">{m.r2}</span>
                  </span>
                  <span className="col-span-2 text-gray-400 text-right">{m.p2}</span>
                  <span className="text-gray-600 text-xs text-right col-span-2">avg {m.avg1} · {m.avg2}</span>
                </div>
              ))}
            </div>
          </div>

          {complete.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Completed ({complete.length})</p>
              <div className="space-y-2">
                {complete.map((m, i) => (
                  <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3 rounded-xl border border-white/5 bg-gray-900/30 text-sm items-center opacity-70">
                    <span className="col-span-2 text-gray-300">{m.p1}</span>
                    <span className="text-center">
                      <span className="text-white font-medium">{m.r1}</span>
                      <span className="text-gray-600 mx-1">–</span>
                      <span className="text-gray-500">{m.r2}</span>
                    </span>
                    <span className="col-span-2 text-gray-500 text-right">{m.p2}</span>
                    <span className="text-gray-600 text-xs text-right col-span-2">Final · avg {m.avg1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Later tonight ({upcoming.length} matches)</p>
          {upcoming.map((m, i) => (
            <div key={i} className="grid grid-cols-7 gap-2 px-4 py-3 rounded-xl border border-white/5 bg-gray-900/60 text-sm items-center">
              <span className="col-span-2 text-gray-300">{m.p1}</span>
              <span className="text-center text-gray-500">vs</span>
              <span className="col-span-2 text-gray-300 text-right">{m.p2}</span>
              <span className="text-gray-500 text-xs text-right col-span-2">Board {m.board} · {m.time}</span>
            </div>
          ))}
          <p className="text-xs text-gray-600 mt-3 text-center">Quarter-finals draw tomorrow following R1 completion</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 px-4 py-3 bg-gray-900/40 rounded-xl border border-white/5 text-xs text-gray-500">
        <span>Most 180s today: <span className="text-white">Littler (4)</span></span>
        <span>Highest finish: <span className="text-white">161 (Humphries)</span></span>
        <span>Highest avg: <span className="text-white">108.2 (Littler)</span></span>
        <span>Total 180s: <span className="text-white">31</span></span>
        <span className="ml-auto text-gray-600">* Demo data · Live would update from DartConnect every 3s</span>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── ACADEMY & DEV VIEW ───────────────────────────────────────────────────────
function AcademyDevView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const devTour = [
    { pos: 1, name: 'Gian van Veen', flag: '🇳🇱', earned: 18400 },
    { pos: 2, name: 'Niko Springer', flag: '🇩🇪', earned: 14200 },
    { pos: 3, name: 'Nathan Rafferty', flag: '🇮🇪', earned: 12800 },
    { pos: 4, name: 'Bradley Brooks', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 11400 },
    { pos: 5, name: 'James Beeton', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 9600 },
    { pos: 6, name: 'Dylan Slevin', flag: '🇮🇪', earned: 8200 },
    { pos: 7, name: 'Connor Scutt', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 7400 },
    { pos: 8, name: 'Rhys Griffin', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earned: 6800 },
  ];
  const challengeTour = [
    { pos: 1, name: 'Berry van Peer', flag: '🇳🇱', earned: 22800 },
    { pos: 2, name: 'Owen Bates', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 19400 },
    { pos: 3, name: 'Christian Kist', flag: '🇳🇱', earned: 17200 },
    { pos: 4, name: 'Lewy Williams', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earned: 14600 },
    { pos: 5, name: 'Paul Hogan', flag: '🇮🇪', earned: 12100 },
    { pos: 6, name: 'Alan Warriner', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 10800 },
    { pos: 7, name: 'Robert Owen', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', earned: 9200 },
    { pos: 8, name: 'Scott Williams', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', earned: 8100 },
  ];
  const pathway = [
    { level: 'County / grassroots', detail: 'BDO-affiliated regional play' },
    { level: 'PDC Development Tour', detail: 'Ages 16–24 · 24 events/yr · Top 2 → Tour Card' },
    { level: 'PDC Challenge Tour', detail: 'Open · 24 events/yr · Top 2 → Tour Card' },
    { level: 'PDC Pro Tour', detail: '128 tour card holders · PC + Euro Tour' },
    { level: 'Premier League / Majors', detail: 'Top 8 invitation only' },
  ];
  const careerPath = [
    { year: 2018, event: 'County darts — Yorkshire' },
    { year: 2019, event: 'Q-School attempt — unsuccessful' },
    { year: 2020, event: 'Challenge Tour — finished #8' },
    { year: 2021, event: 'Q-School — won Tour Card (day 3, final stage)' },
    { year: 2022, event: 'First season on Tour — ranked #89' },
    { year: 2023, event: 'Improved to #31' },
    { year: 2024, event: 'Career high #12' },
    { year: 2025, event: 'Currently #19 · targeting Top 10' },
  ];
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Academy &amp; Development</h1>
        <p className="text-gray-400 text-sm mt-1">PDC Development Tour · Challenge Tour · Junior pathway</p>
      </div>

      <div className="px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm">
        <span className="text-gray-400">As a PDC Tour Card holder you are above the development pathway. This section tracks the routes players take to reach the Pro Tour and monitors development players in your network.</span>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">PDC development pathway</h2>
        <div className="space-y-2">
          {pathway.map((p, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`flex-1 px-4 py-3 rounded-xl border text-sm ${i === 3 ? 'bg-red-950/30 border-red-500/30' : 'bg-gray-900/60 border-white/5'}`}>
                <span className={`font-medium ${i === 3 ? 'text-red-300' : 'text-gray-200'}`}>{i === 3 ? '⭐ ' : ''}{p.level}</span>
                <span className="text-gray-500 text-xs ml-2">{p.detail}</span>
              </div>
              {i < pathway.length - 1 && <span className="text-gray-700 text-xs flex-shrink-0">↓</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">⭐ = Jake&apos;s current level</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-medium">Development Tour 2025 — top 8</h2>
          <span className="text-xs text-gray-500">Ages 16–24 · Top 2 earn Tour Card</span>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>#</span><span className="col-span-2">Player</span><span>Earned</span>
          </div>
          {devTour.map((p, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i < 2 ? 'bg-green-950/10' : ''}`}>
              <span className={i < 2 ? 'text-green-400 font-medium' : 'text-gray-500'}>#{p.pos}</span>
              <span className="col-span-2 text-gray-200">
                {p.flag} {p.name}
                {i < 2 && <span className="ml-2 text-[10px] text-green-400">→ Tour Card</span>}
              </span>
              <span className="text-gray-400">{fmt(p.earned)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-sm bg-green-950/40 border border-green-700/30" />
          Tour Card boundary between #2 and #3 · Gap: £1,400
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-medium">Challenge Tour 2025 — top 8</h2>
          <span className="text-xs text-gray-500">Open entry · Top 2 earn Tour Card</span>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>#</span><span className="col-span-2">Player</span><span>Earned</span>
          </div>
          {challengeTour.map((p, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i < 2 ? 'bg-green-950/10' : ''}`}>
              <span className={i < 2 ? 'text-green-400 font-medium' : 'text-gray-500'}>#{p.pos}</span>
              <span className="col-span-2 text-gray-200">
                {p.flag} {p.name}
                {i < 2 && <span className="ml-2 text-[10px] text-green-400">→ Tour Card</span>}
              </span>
              <span className="text-gray-400">{fmt(p.earned)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <h2 className="text-white font-medium mb-3">Development player — your network</h2>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white font-medium">Jack Sherwood</p>
            <p className="text-gray-500 text-xs mt-0.5">Age 19 · Sheffield · Challenge Tour</p>
          </div>
          <span className="text-xs text-amber-400 bg-amber-950/30 border border-amber-700/30 px-2 py-1 rounded-lg">CT #18</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: 'Last result', value: 'R2 exit (CT 6)' },
            { label: 'Earned', value: '£800' },
            { label: 'Next event', value: 'CT 7 · Apr 26' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/40 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm text-gray-200 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Your career pathway</h2>
        <div className="space-y-0">
          {careerPath.map((c, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === careerPath.length - 1 ? 'bg-red-500' : 'bg-gray-700'}`} />
                {i < careerPath.length - 1 && <div className="w-px flex-1 bg-gray-800 min-h-[24px]" />}
              </div>
              <div className="pb-4">
                <span className="text-xs text-gray-600 font-medium">{c.year}</span>
                <p className={`text-sm ${i === careerPath.length - 1 ? 'text-white font-medium' : 'text-gray-400'}`}>{c.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── PAIRS & TEAM EVENTS VIEW ─────────────────────────────────────────────────
function PairsEventsView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const englishPlayers = [
    { pos: 1, pdcPos: 1, name: 'Luke Littler', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: true, isJake: false },
    { pos: 2, pdcPos: 6, name: 'Michael Smith', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: true, isJake: false },
    { pos: 3, pdcPos: 9, name: 'Rob Cross', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: false, isJake: false },
    { pos: 4, pdcPos: 12, name: 'Dave Chisnall', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: false, isJake: false },
    { pos: 5, pdcPos: 19, name: 'Jake Morrison', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', selected: false, isJake: true },
  ];
  const wcEvents = [
    { year: 2023, result: 'Did not qualify', detail: 'Pre-top-64 era' },
    { year: 2024, result: 'Did not qualify', detail: '#31 PDC — just missed England top 4' },
    { year: 2025, result: 'Not selected', detail: '#19 PDC — 5th English player' },
    { year: 2026, result: 'Target', detail: 'Need to pass Cross or Chisnall' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Pairs &amp; Team Events</h1>
        <p className="text-gray-400 text-sm mt-1">World Cup of Darts · World Pairs · National team</p>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">England national team</h2>
          <span className="text-xs text-amber-400 bg-amber-950/30 border border-amber-700/30 px-2 py-1 rounded-lg">#5 English player — not selected</span>
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Eng rank</span><span className="col-span-2">Player</span><span>PDC rank</span>
          </div>
          {englishPlayers.map((p, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center ${p.isJake ? 'bg-red-950/10' : p.selected ? 'bg-green-950/10' : ''}`}>
              <span className={p.selected ? 'text-green-400 font-medium' : p.isJake ? 'text-red-400 font-medium' : 'text-gray-500'}>#{p.pos}</span>
              <span className="col-span-2 text-gray-200 font-medium">
                {p.flag} {p.name}
                {p.selected && <span className="ml-2 text-[10px] text-green-400">✅ Selected</span>}
                {p.isJake && <span className="ml-2 text-[10px] text-red-400">← You</span>}
              </span>
              <span className="text-gray-500">#{p.pdcPos}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 px-4 py-3 bg-amber-950/30 border border-amber-700/30 rounded-xl text-sm">
          <span className="text-amber-300">⚠️ </span>
          <span className="text-gray-300">To make the World Cup squad Jake needs to pass <span className="text-white font-medium">Rob Cross (#9 PDC)</span> in the Order of Merit. Gap: approximately £82,000.</span>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">World Cup of Darts</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Format', value: 'Pairs · nations compete' },
            { label: 'Venue', value: 'Frankfurt, Germany' },
            { label: 'Prize fund', value: '£800,000+' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm text-gray-200 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Year</span><span>Result</span><span>Context</span>
          </div>
          {wcEvents.map((e, i) => (
            <div key={i} className={`grid grid-cols-3 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i === wcEvents.length - 1 ? 'bg-red-950/10' : ''}`}>
              <span className="text-gray-500">{e.year}</span>
              <span className={i === wcEvents.length - 1 ? 'text-red-400 font-medium' : 'text-gray-400'}>{e.result}</span>
              <span className="text-gray-600 text-xs">{e.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">PDC World Pairs Championship</h2>
          <span className="text-xs text-green-400 bg-green-950/30 border border-green-700/30 px-2 py-1 rounded-lg">✅ Entered</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Pairing</p>
            <p className="text-white font-medium">{player.name} + Mark &ldquo;The Spider&rdquo; Webb</p>
            <p className="text-gray-500 text-xs mt-1">Event: August 2025 · Minehead (Butlins)</p>
            <p className="text-gray-500 text-xs">Last year: R2 exit · £800 each</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Combined avg', value: '96.4' },
              { label: `${player.name.split(' ')[0]}'s doubles %`, value: '41.2%' },
              { label: "Mark's doubles %", value: '38.7%' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{s.label}</span>
                <span className="text-white font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-gray-900/60 rounded-xl border border-white/5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Premier League — 2026 target</p>
        <p className="text-sm text-gray-300">The Premier League features 8 invited players. Jake is not currently in the PL but a Top 10 OoM finish this season makes a 2026 invitation likely.</p>
        <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full" style={{ width: '62%' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Current: #19</span>
          <span>PL threshold: Top 10</span>
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

function StubView({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium text-white mb-2">{title}</h1>
      <p className="text-gray-400">{sub}</p>
    </div>
  );
}

// ─── Entry Manager ────────────────────────────────────────────────────────────
function EntryManagerView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  type EntryStatus = 'confirmed' | 'action' | 'auto' | 'pending' | 'invited';

  const events: Array<{
    event: string; date: string; type: string;
    status: EntryStatus; qualification: string;
    deadline: string; actionNeeded: boolean;
  }> = [
    { event: 'European Championship', date: 'Apr 8 (tonight)', type: 'Euro Tour', status: 'confirmed', qualification: 'Auto (OoM Top 16)', deadline: 'Past', actionNeeded: false },
    { event: 'Prague Open',           date: 'Apr 25–27',      type: 'Euro Tour',   status: 'action',    qualification: 'Auto-qualified (OoM #19)', deadline: 'Apr 19', actionNeeded: true },
    { event: 'Players Ch. 9',         date: 'Apr 26',          type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Players Ch. 10',        date: 'Apr 27',          type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'German Masters',        date: 'May 2–4',         type: 'Euro Tour',   status: 'action',    qualification: 'Auto-qualified (OoM #19)', deadline: 'Apr 26', actionNeeded: true },
    { event: 'Players Ch. 11',        date: 'May 3',           type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Players Ch. 12',        date: 'May 4',           type: 'Players Ch.', status: 'auto',      qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Bahrain Masters',       date: 'May 9–11',        type: 'Euro Tour',   status: 'pending',   qualification: 'Auto-qualified', deadline: 'May 3', actionNeeded: false },
    { event: 'UK Open',               date: 'May 30–Jun 1',    type: 'Ranking Major', status: 'auto',    qualification: 'Tour card holder', deadline: 'Auto', actionNeeded: false },
    { event: 'Nordic Masters',        date: 'Jun 13–15',       type: 'World Series', status: 'invited',  qualification: 'Invited (OoM Top 32)', deadline: 'Jun 7', actionNeeded: true },
    { event: 'World Matchplay',       date: 'Jul 18–27',       type: 'Major',        status: 'confirmed',qualification: 'Qualified (OoM Top 32)', deadline: 'Auto', actionNeeded: false },
  ];

  const statusConfig: Record<EntryStatus, { label: string; dot: string; row: string }> = {
    confirmed: { label: '✅ Confirmed',      dot: 'bg-green-500',  row: '' },
    action:    { label: '⚠️ Action needed',  dot: 'bg-amber-400',  row: 'bg-amber-950/20' },
    auto:      { label: '✅ Auto-entered',   dot: 'bg-blue-500',   row: '' },
    pending:   { label: '⏳ Not yet open',   dot: 'bg-gray-500',   row: '' },
    invited:   { label: '📨 Invite pending', dot: 'bg-purple-400', row: 'bg-purple-950/10' },
  };

  return (
    <div className="p-6 space-y-6 relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-medium text-white">Entry Manager</h1>
        <p className="text-gray-400 text-sm mt-1">PDC PDPA entry system · Tournament entries · Deadlines · Withdrawals</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming entries confirmed', value: '8', color: 'text-green-400' },
          { label: 'Deadline passed',            value: '2', color: 'text-gray-400' },
          { label: 'Action required',            value: '2', color: 'text-amber-400' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-950/30 border border-amber-700/30 text-sm">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <span className="text-amber-200">
          <strong>Prague Open entry deadline Apr 19</strong> — 6 days away. You are auto-qualified via OoM. Confirm or skip below.
        </span>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
          <span className="col-span-3">Event</span>
          <span className="col-span-2">Date</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Deadline</span>
          <span className="col-span-1">Action</span>
        </div>
        {events.map((ev, i) => {
          const cfg = statusConfig[ev.status];
          return (
            <div key={i} className={`grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center ${cfg.row}`}>
              <span className="col-span-3 text-gray-200 font-medium">{ev.event}</span>
              <span className="col-span-2 text-gray-400">{ev.date}</span>
              <span className="col-span-2">
                <span className="text-xs bg-gray-800/60 border border-white/5 rounded px-1.5 py-0.5 text-gray-400">{ev.type}</span>
              </span>
              <span className="col-span-2 flex items-center gap-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-gray-300">{cfg.label}</span>
              </span>
              <span className={`col-span-2 text-xs ${ev.actionNeeded ? 'text-amber-400 font-medium' : 'text-gray-500'}`}>{ev.deadline}</span>
              <span className="col-span-1 flex gap-1">
                {ev.actionNeeded && (
                  <>
                    <button onClick={() => showToast('Entry confirmed (demo — would submit via PDPA portal)')} className="px-2 py-1 bg-green-600/20 border border-green-500/30 text-green-400 text-[11px] rounded hover:bg-green-600/30">Enter</button>
                    <button onClick={() => showToast('Entry skipped for this event')} className="px-2 py-1 bg-gray-800/40 border border-white/5 text-gray-500 text-[11px] rounded hover:text-gray-300">Skip</button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">World Series invitations</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { event: 'US Masters, Las Vegas',     status: 'Expected if OoM holds Top 24', badge: '🟡 Awaited' },
            { event: 'Australian Darts Open',     status: 'Confirmed',                     badge: '✅ Confirmed' },
            { event: 'New Zealand Darts Masters', status: 'To be confirmed',               badge: '⏳ TBC' },
            { event: 'Nordic Masters',            status: 'Invitation pending (Jun 7)',    badge: '📨 Pending' },
          ].map((inv, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
              <p className="text-sm font-medium text-white">{inv.event}</p>
              <p className="text-xs text-gray-500 mt-1">{inv.status}</p>
              <p className="text-xs text-gray-400 mt-2">{inv.badge}</p>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Pressure Analysis ────────────────────────────────────────────────────────
function PressureAnalysisView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const comparisons = [
    { label: 'Match average',   standard: 97.8,  pressure: 94.2, unit: '' },
    { label: 'Checkout %',      standard: 41.2,  pressure: 33.8, unit: '%' },
    { label: 'First 9 average', standard: player.firstNineAverage, pressure: 97.1, unit: '' },
    { label: 'T20 accuracy',    standard: 68,    pressure: 61,   unit: '%' },
    { label: '180s per match',  standard: 4.2,   pressure: 3.1,  unit: '' },
  ];

  const tv = [
    { label: 'Average',    tv: 99.1, floor: 97.3 },
    { label: 'Checkout %', tv: 43.7, floor: 40.1 },
    { label: '180s/match', tv: 4.8,  floor: 4.0 },
    { label: 'Win rate',   tv: 71,   floor: 66 },
  ];

  const scorelines = [
    { situation: '2 sets ahead',  avg: 99.1, co: 43.2, wr: 78 },
    { situation: '1 set ahead',   avg: 98.2, co: 41.8, wr: 72 },
    { situation: 'Level',         avg: 97.2, co: 40.8, wr: 65 },
    { situation: '1 set behind',  avg: 96.4, co: 38.2, wr: 54 },
    { situation: '2 sets behind', avg: 94.8, co: 31.1, wr: 38 },
  ];

  const tierData = [
    { tier: 'vs Top 10',     avg: 96.1, co: 38.8, wr: 42 },
    { tier: 'vs Top 11–32',  avg: 98.4, co: 41.3, wr: 68 },
    { tier: 'vs Top 33–64',  avg: 99.7, co: 43.1, wr: 79 },
    { tier: 'vs Outside 64', avg: 102.3,co: 46.7, wr: 91 },
  ];

  const gapColor = (gap: number) => gap >= 5 ? 'text-red-400' : gap >= 2 ? 'text-amber-400' : 'text-green-400';

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-white">Pressure Performance Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">How your game changes when it matters most</p>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Standard vs under pressure</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-2">Metric</span>
            <span>Standard</span>
            <span>Deciding leg</span>
          </div>
          {comparisons.map((c, i) => {
            const gap = Math.abs(c.standard - c.pressure);
            const worse = c.pressure < c.standard;
            return (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3.5 border-t border-white/5 text-sm items-center">
                <span className="col-span-2 text-gray-300">{c.label}</span>
                <span className="text-gray-400">{c.standard}{c.unit}</span>
                <div className="flex items-center gap-2">
                  <span className={worse ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{c.pressure}{c.unit}</span>
                  <span className={`text-xs ${gapColor(gap)}`}>({worse ? '-' : '+'}{gap.toFixed(1)}{c.unit})</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 px-4 py-3 bg-red-950/30 border border-red-800/20 rounded-xl text-sm">
          <span className="text-red-300">⚠️ </span>
          <span className="text-gray-300">
            Checkout % drops <strong className="text-red-400">7.4 points</strong> in must-win situations — the biggest gap in your game. This is your primary focus area with Sarah.
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">TV / stage events vs floor events</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-3">📺 TV / Stage events</p>
            {tv.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{t.label}</span>
                <span className="text-white font-medium">{t.tv}{t.label.includes('%') || t.label.includes('rate') ? '%' : ''}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">🏢 Floor events (PC)</p>
            {tv.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{t.label}</span>
                <span className="text-gray-300">{t.floor}{t.label.includes('%') || t.label.includes('rate') ? '%' : ''}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 px-4 py-3 bg-green-950/30 border border-green-800/20 rounded-xl text-sm">
          <span className="text-green-400">✅ </span>
          <span className="text-gray-300">
            You average <strong className="text-green-400">1.8 pts higher on TV</strong> — you rise to the occasion. Many players see the opposite. This is a significant mental strength.
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Performance by scoreline</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Situation</span><span>Average</span><span>Checkout %</span><span>Win rate</span>
          </div>
          {scorelines.map((s, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm ${i >= 3 ? 'bg-red-950/10' : ''}`}>
              <span className={i >= 3 ? 'text-amber-300' : 'text-gray-300'}>{s.situation}</span>
              <span className="text-gray-300">{s.avg}</span>
              <span className="text-gray-300">{s.co}%</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-gray-800 rounded overflow-hidden">
                  <div className={`h-full rounded ${s.wr >= 65 ? 'bg-green-500' : s.wr >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.wr}%` }} />
                </div>
                <span className={`text-xs font-medium ${s.wr >= 65 ? 'text-green-400' : s.wr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{s.wr}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white font-medium mb-3">Performance by opponent ranking tier</h2>
        <div className="space-y-2">
          {tierData.map((t, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 bg-gray-900/60 rounded-xl border border-white/5 px-4 py-3 text-sm">
              <span className="text-gray-300">{t.tier}</span>
              <span className="text-gray-400">avg {t.avg}</span>
              <span className="text-gray-400">co {t.co}%</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-gray-800 rounded overflow-hidden">
                  <div className={`h-full rounded ${t.wr >= 70 ? 'bg-green-500' : t.wr >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${t.wr}%` }} />
                </div>
                <span className={`text-xs font-medium ${t.wr >= 70 ? 'text-green-400' : t.wr >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{t.wr}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Mental coach — Sarah · Focus areas</p>
        <div className="space-y-3">
          {[
            { n: 1, text: 'Pre-throw routine in must-win legs — breathing pattern and stance reset before each dart' },
            { n: 2, text: 'Reducing T20 cluster drift under pressure — the data shows pulling left when behind' },
            { n: 3, text: 'Checkout confidence — start with D20 more often in deciding legs, stop switching to D16' },
          ].map(item => (
            <div key={item.n} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
              <span className="text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Merit Forecaster ─────────────────────────────────────────────────────────
function MeritForecasterView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [selectedRound, setSelectedRound] = useState<string>('r1-win');

  const currentOom = 687420;
  const currentRank = 19;

  const thisWeek = {
    event: 'PDC European Championship',
    location: 'Dortmund',
    prizeFund: '£500,000',
    rounds: [
      { id: 'lose',    label: 'R1 Loss',  prize: 0,      rankEstimate: 22 },
      { id: 'r1-win',  label: 'R1 Win',   prize: 11000,  rankEstimate: 19 },
      { id: 'qf',      label: 'QF',       prize: 22000,  rankEstimate: 18 },
      { id: 'sf',      label: 'SF',       prize: 50000,  rankEstimate: 16 },
      { id: 'final',   label: 'Final',    prize: 90000,  rankEstimate: 13 },
      { id: 'winner',  label: 'Winner',   prize: 110000, rankEstimate: 11 },
    ],
  };

  const remainingEvents = [
    { event: 'Prague Open',        type: 'Euro Tour',  fund: 175000,  r1: 4000,  sf: 16000, win: 25000 },
    { event: 'Players Ch. 9 & 10', type: 'PC (×2)',    fund: 250000,  r1: 4000,  sf: 16000, win: 30000 },
    { event: 'German Masters',     type: 'Euro Tour',  fund: 175000,  r1: 4000,  sf: 16000, win: 25000 },
    { event: 'PC 11, 12 + Euro',   type: 'Mixed (×3)', fund: 425000,  r1: 9000,  sf: 32000, win: 65000 },
    { event: 'UK Open',            type: 'Ranking',    fund: 500000,  r1: 4000,  sf: 50000, win: 100000 },
    { event: 'PC 13–18 (×6)',      type: 'PC',         fund: 750000,  r1: 12000, sf: 48000, win: 90000 },
    { event: 'World Matchplay',    type: 'Major',      fund: 800000,  r1: 13000, sf: 100000,win: 200000 },
    { event: 'World Grand Prix',   type: 'Major',      fund: 750000,  r1: 12000, sf: 90000, win: 187500 },
    { event: 'Grand Slam',         type: 'Major',      fund: 700000,  r1: 10000, sf: 75000, win: 175000 },
    { event: 'PC Finals',          type: 'Major',      fund: 500000,  r1: 8000,  sf: 60000, win: 120000 },
    { event: 'World Championship', type: 'Major',      fund: 5000000, r1: 35000, sf: 300000,win: 700000 },
  ];

  const milestones = [
    { label: 'Top 32 (PC seeding)',        threshold: 600000,  achieved: true  },
    { label: 'Top 16 (Euro Tour seeding)', threshold: 720000,  achieved: false },
    { label: 'Top 10 (PL invitation)',     threshold: 850000,  achieved: false },
    { label: 'Top 8 (PL confirmed)',       threshold: 1100000, achieved: false },
  ];

  const selected = thisWeek.rounds.find(r => r.id === selectedRound) || thisWeek.rounds[1];
  const newOom = currentOom + selected.prize;
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Merit Forecaster</h1>
        <p className="text-gray-400 text-sm mt-1">Simulate prize money outcomes · PDC Order of Merit (rolling 2-year)</p>
      </div>

      {/* This week simulator */}
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-medium">{thisWeek.event}</h2>
            <p className="text-gray-500 text-sm">{thisWeek.location} · Prize fund {thisWeek.prizeFund}</p>
          </div>
          <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20">In progress tonight</span>
        </div>

        <div className="grid grid-cols-6 gap-2 mb-5">
          {thisWeek.rounds.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRound(r.id)}
              className={`rounded-lg border p-3 text-center transition-all ${selectedRound === r.id ? 'bg-red-600/20 border-red-500/40' : 'bg-gray-800/40 border-white/5 hover:border-white/10'}`}
            >
              <p className={`text-xs font-medium ${selectedRound === r.id ? 'text-red-300' : 'text-gray-400'}`}>{r.label}</p>
              <p className={`text-sm font-medium mt-1 ${selectedRound === r.id ? 'text-white' : 'text-gray-300'}`}>
                {r.prize === 0 ? '—' : fmt(r.prize)}
              </p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Prize this week', value: fmt(selected.prize) },
            { label: 'New OoM total',   value: fmt(newOom) },
            { label: 'Estimated rank',  value: `#${selected.rankEstimate}` },
            { label: 'Rank change',     value: selected.rankEstimate < currentRank
              ? `▲ ${currentRank - selected.rankEstimate}`
              : selected.rankEstimate > currentRank
              ? `▼ ${selected.rankEstimate - currentRank}`
              : '— No change' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/60 rounded-lg p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-lg font-medium mt-1 ${i === 3 && selected.rankEstimate < currentRank ? 'text-green-400' : i === 3 && selected.rankEstimate > currentRank ? 'text-red-400' : 'text-white'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Remaining events table */}
      <div>
        <h2 className="text-white font-medium mb-3">Season earnings potential</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span className="col-span-2">Event</span>
            <span>R1 win</span>
            <span>Semi-final</span>
            <span>Winner</span>
          </div>
          {remainingEvents.map((ev, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm hover:bg-gray-800/20 transition-colors">
              <div className="col-span-2">
                <p className="text-gray-200">{ev.event}</p>
                <p className="text-xs text-gray-500">{ev.type}</p>
              </div>
              <span className="text-gray-400">{fmt(ev.r1)}</span>
              <span className="text-gray-300">{fmt(ev.sf)}</span>
              <span className="text-green-400">{fmt(ev.win)}</span>
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/10 bg-gray-900/60 text-sm font-medium">
            <span className="col-span-2 text-gray-300">Maximum possible</span>
            <span className="text-gray-300">{fmt(remainingEvents.reduce((s, e) => s + e.r1, 0))}</span>
            <span className="text-gray-200">{fmt(remainingEvents.reduce((s, e) => s + e.sf, 0))}</span>
            <span className="text-green-300">{fmt(remainingEvents.reduce((s, e) => s + e.win, 0))}</span>
          </div>
        </div>
      </div>

      {/* Milestone tracker */}
      <div>
        <h2 className="text-white font-medium mb-3">Rank milestone tracker</h2>
        <div className="space-y-3">
          {milestones.map((m, i) => {
            const pct = Math.min(100, Math.round((currentOom / m.threshold) * 100));
            const gap = Math.max(0, m.threshold - currentOom);
            return (
              <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-200">{m.label}</span>
                  {m.achieved
                    ? <span className="text-xs text-green-400 font-medium">✅ Achieved</span>
                    : <span className="text-xs text-gray-500">Need {fmt(gap)} more</span>}
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.achieved ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>{fmt(currentOom)}</span>
                  <span>Target: {fmt(m.threshold)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Tour Card Monitor ────────────────────────────────────────────────────────
function TourCardMonitorView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [targetRank, setTargetRank] = useState(19);

  const currentOom = 687420;
  const rank64threshold = 498000;
  const buffer = currentOom - rank64threshold;

  const dropOffs = [
    { week: 17, event: 'Players Ch. 8 (2023)',       amount: 4200,  date: 'Apr 14' },
    { week: 18, event: 'Euro Tour – Prague (2023)',  amount: 12000, date: 'Apr 21' },
    { week: 19, event: 'Players Ch. 10 (2023)',      amount: 2000,  date: 'Apr 28' },
    { week: 20, event: 'Players Ch. 11 (2023)',      amount: 8000,  date: 'May 5'  },
    { week: 21, event: 'Players Ch. 12 (2023)',      amount: 4200,  date: 'May 12' },
    { week: 22, event: 'Euro Tour – Germany (2023)', amount: 18000, date: 'May 19' },
    { week: 23, event: 'Players Ch. 14 (2023)',      amount: 2000,  date: 'May 26' },
    { week: 24, event: 'World Matchplay QF (2023)',  amount: 22500, date: 'Jun 2'  },
    { week: 25, event: 'Players Ch. 15–18 (2023)',   amount: 6400,  date: 'Jun–Jul'},
    { week: 29, event: 'Euro Tour – Austria (2023)', amount: 8000,  date: 'Jul 21' },
    { week: 30, event: 'Players Ch. 19 (2023)',      amount: 4200,  date: 'Jul 28' },
  ];

  const rankScenarios = [
    { label: 'Hold #19',            target: 19, needed: 42000  },
    { label: 'Break Top 16',        target: 16, needed: 152580 },
    { label: 'Break Top 10',        target: 10, needed: 312580 },
    { label: 'Stay safe (Top 64)',  target: 64, needed: 0      },
  ];

  const scenarioForRank = rankScenarios.find(s => s.target <= targetRank) || rankScenarios[3];
  const fmt = (n: number) => `£${n.toLocaleString()}`;

  let runningTotal = currentOom;

  return (
    <div className="p-6 space-y-6 tour-card-content">
      <style dangerouslySetInnerHTML={{ __html: `
@media print {
  body { background: white !important; color: black !important; }
  aside, nav, .quick-actions, .print\\:hidden { display: none !important; }
  .tour-card-content { max-width: 100% !important; padding: 0 !important; }
  .bg-gray-900\\/60, .bg-gray-800\\/40 { background: #f5f5f5 !important; border: 1px solid #ddd !important; }
  .bg-green-950\\/40 { background: #f0fdf4 !important; border: 1px solid #bbf7d0 !important; }
  .text-white { color: black !important; }
  .text-gray-400, .text-gray-300, .text-gray-500 { color: #555 !important; }
  .text-red-400, .text-red-300 { color: #c41e3a !important; }
  .text-green-400, .text-green-300 { color: #166534 !important; }
  .border-white\\/5, .border-gray-800 { border-color: #ddd !important; }
  h1 { font-size: 18pt !important; }
  h2 { font-size: 13pt !important; }
  p, span { font-size: 10pt !important; }
}
      ` }} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Tour Card Monitor</h1>
          <p className="text-gray-400 text-sm mt-1">PDC Order of Merit · Rolling 2-year window · Tour card held by top 64</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded-lg hover:text-gray-200 flex items-center gap-1.5 print:hidden"
        >
          <FileText className="w-3 h-3" />
          Export PDF
        </button>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-950/40 border border-green-700/30">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-green-300 font-medium">SAFE — You hold #{player.pdcRank}</p>
          <p className="text-green-400/70 text-sm">The 64th-place threshold is {fmt(buffer)} below your current OoM total.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Current OoM',     value: fmt(currentOom),     sub: `#${player.pdcRank} PDC` },
          { label: '64th place at',   value: fmt(rank64threshold),sub: 'Approximate threshold' },
          { label: 'Buffer above cut',value: fmt(buffer),         sub: 'Your safety margin' },
          { label: 'Card expires',    value: 'Jan 4 2026',        sub: '9 months remaining' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-xl font-medium text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Drop-off table */}
      <div>
        <h2 className="text-white font-medium mb-3">Prize money dropping off your OoM — next 12 weeks</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Wk</span>
            <span className="col-span-2">Tournament</span>
            <span>Drops</span>
            <span>New OoM</span>
          </div>
          {dropOffs.map((row, i) => {
            runningTotal -= row.amount;
            const danger = runningTotal - rank64threshold < 50000;
            return (
              <div key={i} className={`grid grid-cols-5 gap-4 px-4 py-3 border-t border-white/5 text-sm ${danger ? 'bg-amber-950/20' : ''}`}>
                <span className="text-gray-500">Wk {row.week}</span>
                <span className="col-span-2 text-gray-300">{row.event}</span>
                <span className={danger ? 'text-amber-400' : 'text-red-400'}>-{fmt(row.amount)}</span>
                <span className={danger ? 'text-amber-300 font-medium' : 'text-gray-300'}>{fmt(runningTotal)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">* Amber rows = within £50,000 of the 64th-place cut if unmatched</p>
      </div>

      {/* What do I need calculator */}
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <h2 className="text-white font-medium mb-4">What do I need to earn?</h2>

        <div className="flex flex-wrap gap-2 mb-5">
          {rankScenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => setTargetRank(s.target)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${targetRank === s.target ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'bg-gray-800/60 border-white/5 text-gray-400 hover:text-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-5">
          <span className="text-xs text-gray-500 w-24">Target rank</span>
          <input
            type="range" min={1} max={64} value={targetRank}
            onChange={e => setTargetRank(Number(e.target.value))}
            className="flex-1 accent-red-500"
          />
          <span className="text-white font-medium w-8">#{targetRank}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Target OoM',   value: fmt(currentOom + (scenarioForRank?.needed ?? 0)) },
            { label: 'Current OoM',  value: fmt(currentOom) },
            { label: 'Need to earn', value: fmt(Math.max(0, scenarioForRank?.needed ?? 0)) },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-medium text-white mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card timeline */}
      <div>
        <h2 className="text-white font-medium mb-3">Tour card timeline</h2>
        <div className="relative bg-gray-900/60 rounded-xl border border-white/5 p-5">
          <div className="relative h-2 bg-gray-800 rounded-full">
            <div className="absolute left-0 top-0 h-full bg-red-600 rounded-full" style={{ width: '55%' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" style={{ left: '55%' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-3">
            <span>Q-School Jan 2024<br/><span className="text-gray-600">Card start</span></span>
            <span className="text-red-400 font-medium">Apr 2025<br/>NOW</span>
            <span className="text-right">Jan 4 2026<br/><span className="text-gray-600">Expires</span></span>
          </div>
        </div>
      </div>

      {/* Q-School info */}
      <details className="bg-gray-900/60 rounded-xl border border-white/5">
        <summary className="px-5 py-4 text-white font-medium cursor-pointer hover:text-gray-200 list-none flex justify-between items-center">
          If you lost your tour card — Q-School information
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </summary>
        <div className="px-5 pb-5 space-y-2 text-sm text-gray-400">
          <p>📅 <strong className="text-gray-200">Dates:</strong> January 2026 (UK: Milton Keynes · Europe: Kalkar, Germany)</p>
          <p>🏗️ <strong className="text-gray-200">Format:</strong> First Stage (open) → Final Stage (top performers)</p>
          <p>🎯 <strong className="text-gray-200">Cards available:</strong> Top 64 OoM auto-retain. ~40 additional cards via Q-School + Challenge/Development Tour</p>
          <p>💷 <strong className="text-gray-200">Entry:</strong> Free for PDPA members (PDPA membership required)</p>
          <p>⚠️ <strong className="text-gray-200">Reset:</strong> New tour card holders start at £0 OoM — previous earnings do not carry over</p>
        </div>
      </details>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// Maps a snake_case Supabase row to the camelCase DartsPlayer interface used by views
function mapSupabaseToDartsPlayer(row: Record<string, unknown>): DartsPlayer {
  const r = row as Record<string, string | number | null | undefined>;
  return {
    name:                String(r.name ?? DEMO_PLAYER.name),
    nickname:            String(r.nickname ?? DEMO_PLAYER.nickname),
    nationality:         String(r.nationality ?? DEMO_PLAYER.nationality),
    nationalityFlag:     String(r.flag ?? DEMO_PLAYER.nationalityFlag),
    pdcRank:             Number(r.pdc_rank ?? DEMO_PLAYER.pdcRank),
    orderOfMeritRank:    Number(r.order_of_merit_rank ?? DEMO_PLAYER.orderOfMeritRank),
    threeDartAverage:    Number(r.three_dart_average ?? DEMO_PLAYER.threeDartAverage),
    checkoutPercent:     Number(r.checkout_percent ?? DEMO_PLAYER.checkoutPercent),
    oneEightiesPerLeg:   Number(r.one_eighties_per_leg ?? DEMO_PLAYER.oneEightiesPerLeg),
    firstNineAverage:    Number(r.first_nine_average ?? DEMO_PLAYER.firstNineAverage),
    highestCheckout:     Number(r.highest_checkout ?? DEMO_PLAYER.highestCheckout),
    tourCard:            String(r.tour_card ?? DEMO_PLAYER.tourCard),
    plan:                String(r.plan ?? DEMO_PLAYER.plan),
    manager:             String(r.manager ?? DEMO_PLAYER.manager),
    coach:               String(r.coach ?? DEMO_PLAYER.coach),
    sponsor1:            String(r.sponsor_1 ?? DEMO_PLAYER.sponsor1),
    sponsor2:            String(r.sponsor_2 ?? DEMO_PLAYER.sponsor2),
    walkOnMusic:         String(r.walk_on_music ?? DEMO_PLAYER.walkOnMusic),
    dartSetup:           DEMO_PLAYER.dartSetup, // structured field — keep demo value for now
    careerEarnings:      Number(r.career_earnings ?? DEMO_PLAYER.careerEarnings),
    thisYearEarnings:    Number(r.this_year_earnings ?? DEMO_PLAYER.thisYearEarnings),
    careerTitles:        Number(r.career_titles ?? DEMO_PLAYER.careerTitles),
    majorTitles:         Number(r.major_titles ?? DEMO_PLAYER.majorTitles),
  };
}

// ─── Performance Rating ───────────────────────────────────────────────────────
function PerformanceRatingView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const components = [
    { label: 'Three-dart average',  weight: 30, score: 78, raw: '97.8',     benchmark: 'PDC avg 96.8' },
    { label: 'Checkout %',          weight: 25, score: 72, raw: '41.2%',    benchmark: 'PDC avg 38.1%' },
    { label: 'Consistency',         weight: 20, score: 81, raw: '±3.2 avg', benchmark: 'Lower is better' },
    { label: 'Recent form (8 wks)', weight: 15, score: 85, raw: '6W 2L',    benchmark: 'Top quartile' },
    { label: '180s per match',      weight: 10, score: 68, raw: '4.2',      benchmark: 'PDC avg 3.9' },
  ];
  const overallScore = Math.round(components.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0));
  const getRating = (score: number) => {
    if (score >= 85) return { label: 'Elite', color: 'text-green-400' };
    if (score >= 75) return { label: 'Strong', color: 'text-teal-400' };
    if (score >= 65) return { label: 'Solid', color: 'text-amber-400' };
    return { label: 'Developing', color: 'text-red-400' };
  };
  const rating = getRating(overallScore);
  const history = [
    { month: 'Oct', score: 71 }, { month: 'Nov', score: 74 }, { month: 'Dec', score: 69 },
    { month: 'Jan', score: 76 }, { month: 'Feb', score: 79 }, { month: 'Mar', score: 77 },
    { month: 'Apr', score: overallScore },
  ];
  const maxH = Math.max(...history.map(h => h.score));
  const peers = [
    { name: 'Luke Littler', rank: 1, score: 96, isJake: false },
    { name: 'M. van Gerwen', rank: 2, score: 94, isJake: false },
    { name: 'Luke Humphries', rank: 3, score: 92, isJake: false },
    { name: 'N. Aspinall', rank: 4, score: 88, isJake: false },
    { name: 'Rob Cross', rank: 9, score: 80, isJake: false },
    { name: 'Jake Morrison', rank: 19, score: overallScore, isJake: true },
    { name: 'G. Anderson', rank: 14, score: 74, isJake: false },
  ].sort((a, b) => b.score - a.score);
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Performance Rating</h1>
        <p className="text-gray-400 text-sm mt-1">Lumio composite score · Weighted across 5 key metrics · 2025 season</p>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-6 text-center">
        <p className="text-gray-500 text-sm mb-2">Lumio Performance Score</p>
        <p className="text-7xl font-medium text-white mb-2">{overallScore}</p>
        <p className={`text-lg font-medium ${rating.color}`}>{rating.label}</p>
        <p className="text-gray-600 text-xs mt-2">Out of 100 · Updated after each event</p>
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto max-w-xs">
          <div className="h-full bg-red-500 rounded-full" style={{ width: `${overallScore}%` }} />
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Score breakdown</h2>
        <div className="space-y-3">
          {components.map((c, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm text-gray-200">{c.label}</span>
                  <span className="text-xs text-gray-600 ml-2">({c.weight}% weight)</span>
                </div>
                <div className="text-right"><span className="text-white font-medium">{c.score}</span><span className="text-gray-600 text-xs ml-1">/ 100</span></div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c.score >= 80 ? 'bg-green-500' : c.score >= 70 ? 'bg-teal-500' : 'bg-amber-500'}`} style={{ width: `${c.score}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{c.raw}</span><span>{c.benchmark}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Score trend — 2024/25 season</h2>
        <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
          <div className="flex items-end gap-3 h-24">
            {history.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{h.score}</span>
                <div className={`w-full rounded-sm ${i === history.length - 1 ? 'bg-red-500' : 'bg-gray-700'}`} style={{ height: `${(h.score / maxH) * 72}px` }} />
                <span className="text-[10px] text-gray-600">{h.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">PDC peer comparison</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          {peers.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${p.isJake ? 'bg-red-950/20' : ''}`}>
              <span className="text-gray-600 text-xs w-6">#{p.rank}</span>
              <span className={`text-sm flex-1 ${p.isJake ? 'text-white font-medium' : 'text-gray-300'}`}>
                {p.name} {p.isJake ? '← You' : ''}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.isJake ? 'bg-red-500' : 'bg-gray-600'}`} style={{ width: `${p.score}%` }} />
                </div>
                <span className={`text-sm font-medium ${p.isJake ? 'text-red-400' : 'text-gray-400'}`}>{p.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">
        Rating uses {player.name.split(' ')[0]}&apos;s live stats · Recalculates after each event
      </p>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Nine-Dart Tracker ────────────────────────────────────────────────────────
function NineDartTrackerView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const routes = [
    { name: "Classic (Jake's)", darts: ['T20', 'T20', 'T20', 'T20', 'T20', 'T20', 'T19', 'D16'] },
    { name: 'Bull finish', darts: ['T20', 'T20', 'T20', 'T20', 'T20', 'T20', 'T20', 'D25'] },
    { name: 'T19 route', darts: ['T20', 'T20', 'T20', 'T19', 'T19', 'T19', 'T20', 'D12'] },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Nine-Dart Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Career nine-darters · Close calls · Routes to perfection</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Career nine-darters', value: '1', sub: 'Players Ch. 12, Mar 2025', red: true },
          { label: 'Best leg this season', value: '9', sub: 'darts — 1 occurrence' },
          { label: '10-dart legs (2025)', value: '4', sub: '2025 season' },
          { label: 'Avg winning leg', value: '18.3', sub: 'darts to win' },
        ].map((k, i) => (
          <div key={i} className={`rounded-xl border p-4 ${k.red ? 'bg-red-950/30 border-red-500/30' : 'bg-gray-900/60 border-white/5'}`}>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-3xl font-medium ${k.red ? 'text-red-400' : 'text-white'}`}>{k.value}</p>
            <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-r from-red-950/40 to-amber-950/20 rounded-xl border border-red-500/20 p-5">
        <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-2">⚡ Career Nine-Darter — Players Championship 12 · March 2025</p>
        <p className="text-white font-medium mb-3">T20 · T20 · T20 · T20 · T20 · T20 · T19 · D16</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Visit 1 — T20 (60)', type: 'score' },
            { label: 'Visit 2 — T20 (60)', type: 'score' },
            { label: 'Visit 3 — T19 (57)', type: 'score' },
            { label: 'D16 (32)', type: 'finish' },
          ].map((d, i) => (
            <div key={i} className={`px-3 py-1.5 rounded text-xs font-medium border ${d.type === 'finish' ? 'bg-green-600/20 border-green-500/30 text-green-300' : 'bg-red-600/20 border-red-500/30 text-red-300'}`}>
              {d.label}
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-3">vs Ryan Searle · Players Championship 12 · Wigan · Leg 3 of 4</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Close calls — best legs on record</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Date</span><span>Event</span><span>Darts</span><span>Result</span>
          </div>
          {[
            { date: 'Mar 2025', event: 'Players Ch. 12', darts: 9, result: '✅ Nine-darter!', nine: true },
            { date: 'Feb 2025', event: 'Practice session', darts: 10, result: '10 darts', nine: false },
            { date: 'Jan 2025', event: 'Players Ch. 4', darts: 10, result: '10 darts', nine: false },
            { date: 'Dec 2024', event: 'Grand Slam', darts: 11, result: '11 darts', nine: false },
            { date: 'Oct 2024', event: 'Players Ch. 28', darts: 10, result: '10 darts', nine: false },
          ].map((a, i) => (
            <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm ${a.nine ? 'bg-red-950/10' : ''}`}>
              <span className="text-gray-400">{a.date}</span>
              <span className="text-gray-300">{a.event}</span>
              <span className={a.nine ? 'text-red-400 font-medium' : 'text-gray-400'}>{a.darts}</span>
              <span className={a.nine ? 'text-red-300 font-medium' : 'text-gray-500'}>{a.result}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Nine-dart routes to know</h2>
        <div className="space-y-3">
          {routes.map((r, i) => (
            <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
              <p className="text-sm font-medium text-white mb-2">{r.name}</p>
              <div className="flex gap-1.5 flex-wrap">
                {r.darts.map((d, j) => (
                  <span key={j} className={`px-2 py-0.5 rounded text-xs border ${j === r.darts.length - 1 ? 'bg-green-950/30 border-green-600/30 text-green-400' : j >= 6 ? 'bg-amber-950/30 border-amber-600/30 text-amber-400' : 'bg-gray-800 border-white/5 text-gray-300'}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Premier League ───────────────────────────────────────────────────────────
function PremierLeagueView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const plTable = [
    { pos: 1, name: 'Luke Littler', pts: 42, w: 14, d: 0, l: 2, avg: 103.2 },
    { pos: 2, name: 'Michael van Gerwen', pts: 36, w: 11, d: 3, l: 2, avg: 101.8 },
    { pos: 3, name: 'Luke Humphries', pts: 32, w: 10, d: 2, l: 4, avg: 100.1 },
    { pos: 4, name: 'Nathan Aspinall', pts: 28, w: 8, d: 4, l: 4, avg: 98.4 },
    { pos: 5, name: 'Michael Smith', pts: 24, w: 7, d: 3, l: 6, avg: 97.9 },
    { pos: 6, name: 'Rob Cross', pts: 22, w: 6, d: 4, l: 6, avg: 97.1 },
    { pos: 7, name: 'Gary Anderson', pts: 18, w: 5, d: 3, l: 8, avg: 96.8 },
    { pos: 8, name: 'Peter Wright', pts: 14, w: 3, d: 5, l: 8, avg: 95.2 },
  ];
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Premier League Darts</h1>
          <p className="text-gray-400 text-sm mt-1">2025 season · 16 nights · Jake&apos;s target: 2026 invitation</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-950/30 border border-amber-700/30 rounded-lg text-xs text-amber-400 font-medium">Aspiration view — not in PL 2025</div>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Jake&apos;s Premier League pathway</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">OoM rank needed for 2026 PL invitation</p>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: '62%' }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Current: #19</span><span>Target: Top 8–10</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-white">9</p>
            <p className="text-xs text-gray-500">ranks to climb</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Estimated OoM needed: £850,000+ · Current: £687,420 · Gap: £162,580</p>
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">2025 Premier League standings</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-7 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>#</span><span className="col-span-2">Player</span><span>Pts</span><span>W</span><span>D</span><span>Avg</span>
          </div>
          {plTable.map((p, i) => (
            <div key={i} className={`grid grid-cols-7 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center ${i < 4 ? 'bg-green-950/5' : ''}`}>
              <span className={i < 4 ? 'text-green-400 font-medium' : 'text-gray-500'}>{p.pos}</span>
              <span className="col-span-2 text-gray-200">{p.name}</span>
              <span className="text-white font-medium">{p.pts}</span>
              <span className="text-gray-400">{p.w}</span>
              <span className="text-gray-400">{p.d}</span>
              <span className="text-gray-400">{p.avg}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">Top 4 qualify for Play-offs · Green = Play-off places</p>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
        <h2 className="text-white font-medium mb-3">Premier League format</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Nights', '16 across UK + Europe'],
            ['Format', '8 players · round-robin · 10 legs'],
            ['Prize fund', '£1,000,000 total'],
            ['Winner', '£275,000'],
            ['Play-off', 'Top 4 — semi-finals + final'],
            ['Selection', 'PDC invitation — top OoM + wildcards'],
          ].map(([label, value], i) => (
            <div key={i}><span className="text-gray-500">{label}: </span><span className="text-gray-200">{value}</span></div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── World Series ─────────────────────────────────────────────────────────────
function WorldSeriesView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const events = [
    { name: 'US Masters', location: 'Las Vegas, USA', date: 'Jun 2025', prize: '£450,000', criteria: 'OoM Top 24', status: '🟡 Expected (OoM holds Top 24)', history: 'Never qualified' },
    { name: 'Australian Darts Open', location: 'Brisbane, Australia', date: 'Jul 2025', prize: '£350,000', criteria: 'OoM Top 32 + invite', status: '✅ Confirmed', history: '2024: R2 exit (avg 98.1)' },
    { name: 'NZ Darts Masters', location: 'Auckland, NZ', date: 'Aug 2025', prize: '£300,000', criteria: 'OoM Top 24', status: '⏳ TBC', history: 'Never qualified' },
    { name: 'Nordic Masters', location: 'Copenhagen, Denmark', date: 'Jun 2025', prize: '£300,000', criteria: 'OoM Top 32', status: '📨 Invitation pending (Jun 7)', history: 'Never competed' },
    { name: 'World Series Finals', location: 'Amsterdam, Netherlands', date: 'Nov 2025', prize: '£500,000', criteria: 'Points from WS events', status: '❓ Depends on WS results', history: 'Never qualified' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">World Series of Darts</h1>
        <p className="text-gray-400 text-sm mt-1">Invitational events worldwide · Separate qualification from main OoM</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Confirmed invitations', value: '1', color: 'text-green-400' },
          { label: 'Pending / expected', value: '2', color: 'text-amber-400' },
          { label: 'Total WS prize fund', value: '£1.9M', color: 'text-white' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {events.map((ev, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium">{ev.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{ev.location} · {ev.date} · Prize: {ev.prize}</p>
              </div>
              <span className="text-xs text-gray-500">{ev.criteria}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-sm text-gray-300">{ev.status}</span>
              <span className="text-xs text-gray-600">{ev.history}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
        <h2 className="text-white font-medium mb-3">How World Series qualification works</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <p>• World Series events are invitational — not open entry</p>
          <p>• PDC invites players from the main OoM (typically Top 8–32 per event)</p>
          <p>• Host nation qualifiers added via local qualifying events</p>
          <p>• Prize money does <strong className="text-white">not</strong> count towards the main PDC OoM</p>
          <p>• World Series Finals uses a separate WS points table</p>
          <p>• Jake&apos;s OoM (#19) puts him in the expected bracket for most WS events</p>
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Team Comms ───────────────────────────────────────────────────────────────
function TeamCommsView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [activeThread, setActiveThread] = useState<string>('marco');
  const [draft, setDraft] = useState('');
  const first = player.name.split(' ')[0];
  const threads = [
    { id: 'marco', name: 'Marco', role: 'Coach', unread: 1, messages: [
      { from: 'Marco', time: '07:45', text: 'Focus on T20 cluster tightness today — pulling left under pressure. Work on it in your practice session.' },
      { from: 'Marco', time: '06:30', text: 'Watched Price\'s last 5 matches. He is slow to start — take the first two legs aggressively.' },
      { from: first, time: 'Yesterday', text: 'Understood. Will focus on the doubles session on D16 and D18 today.' },
    ] },
    { id: 'james', name: 'James', role: 'Agent', unread: 2, messages: [
      { from: 'James', time: '08:10', text: 'Red Dragon renewal call scheduled Thursday 14:00. I\'ll send over their proposed terms by Wednesday evening.' },
      { from: 'James', time: 'Yesterday', text: 'Paddy Power ambassador inquiry — they want to discuss expanding the deal.' },
      { from: first, time: 'Yesterday', text: 'Good news on Paddy Power. Thursday call confirmed.' },
    ] },
    { id: 'singh', name: 'Dr. Singh', role: 'Physio', unread: 0, messages: [
      { from: 'Dr. Singh', time: '08:00', text: 'Shoulder treatment confirmed 08:30 tomorrow. Will also check the elbow.' },
      { from: first, time: 'Yesterday', text: 'Left elbow felt a bit heavy after Sunday.' },
      { from: 'Dr. Singh', time: 'Yesterday', text: 'Normal after that volume. Ice it tonight for 10 mins.' },
    ] },
    { id: 'sarah', name: 'Sarah', role: 'Mental coach', unread: 1, messages: [
      { from: 'Sarah', time: '07:00', text: 'Pre-match routine updated — check the Match Prep page. Added a breathing anchor for pressure checkouts.' },
      { from: first, time: 'Yesterday', text: 'Will do. Feeling good about tonight.' },
      { from: 'Sarah', time: 'Yesterday', text: 'Your data is strong. You average 99.4 vs Price — trust the process.' },
    ] },
  ];
  const active = threads.find(t => t.id === activeThread) || threads[0];
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-medium text-white">Team Comms</h1>
        <p className="text-gray-400 text-sm mt-1">Messages with your coaching and commercial team</p>
      </div>
      <div className="flex gap-4 h-[520px]">
        <div className="w-48 flex-shrink-0 space-y-1">
          {threads.map(t => (
            <button key={t.id} onClick={() => setActiveThread(t.id)} className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${activeThread === t.id ? 'bg-red-950/20 border-red-500/30' : 'bg-gray-900/40 border-white/5 hover:border-white/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{t.name}</span>
                {t.unread > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">{t.unread}</span>}
              </div>
              <span className="text-xs text-gray-500">{t.role}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col bg-gray-900/40 rounded-xl border border-white/5">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-white font-medium">{active.name}</p>
            <p className="text-gray-500 text-xs">{active.role}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[...active.messages].reverse().map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.from === first ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.from === first ? 'bg-red-600/20 border border-red-500/20 text-gray-200' : 'bg-gray-800/60 border border-white/5 text-gray-300'}`}>
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/5 flex gap-2">
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-800/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-white/20" />
            <button onClick={() => setDraft('')} className="px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-600/30">Send</button>
          </div>
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Fan Engagement ───────────────────────────────────────────────────────────
function FanEngagementView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const platforms = [
    { name: 'Twitter/X', handle: '@JakeMorrisonDarts', followers: 48200, growth: '+2.4%', engagement: '3.8%' },
    { name: 'Instagram', handle: '@jakemorrisondarts', followers: 31400, growth: '+4.1%', engagement: '5.2%' },
    { name: 'YouTube', handle: 'Jake Morrison Darts', followers: 12800, growth: '+8.3%', engagement: '6.1%' },
    { name: 'TikTok', handle: '@thehammerdarts', followers: 24600, growth: '+12.7%', engagement: '8.4%' },
  ];
  const total = platforms.reduce((s, p) => s + p.followers, 0);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  const topPosts = [
    { platform: 'TikTok', content: 'Walk-on entrance at European Championship', views: '284k', likes: '18.2k', date: 'Tonight' },
    { platform: 'Instagram', content: 'Red Dragon barrel reveal video', views: '41k', likes: '3.1k', date: '2 days ago' },
    { platform: 'Twitter/X', content: 'Post-match reaction — Players Ch. 12 win', views: '89k', likes: '4.8k', date: '3 weeks ago' },
    { platform: 'YouTube', content: '9-dart finish compilation + analysis', views: '67k', likes: '2.3k', date: '1 month ago' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Fan Engagement</h1>
        <p className="text-gray-400 text-sm mt-1">Social media · Brand reach · Content performance</p>
      </div>
      <div className="bg-gray-900/60 rounded-xl border border-white/5 p-5 text-center">
        <p className="text-gray-500 text-sm mb-1">Total audience across all platforms</p>
        <p className="text-5xl font-medium text-white">{fmt(total)}</p>
        <p className="text-green-400 text-sm mt-1">+6.4% average growth this month</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((p, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium text-sm">{p.name}</p>
              <span className="text-green-400 text-xs">{p.growth}</span>
            </div>
            <p className="text-2xl font-medium text-white">{fmt(p.followers)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.handle}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-600">Engagement:</span>
              <span className="text-xs text-teal-400 font-medium">{p.engagement}</span>
            </div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">Top performing content</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Platform</span><span className="col-span-2">Content</span><span>Performance</span>
          </div>
          {topPosts.map((p, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center">
              <span className="text-gray-400 text-xs">{p.platform}</span>
              <span className="col-span-2 text-gray-200">{p.content}</span>
              <div>
                <p className="text-white text-xs font-medium">{p.views} views</p>
                <p className="text-gray-500 text-xs">{p.likes} · {p.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-600 text-center">Connect social APIs in Settings for real-time data · Currently showing demo estimates</p>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Nutrition & Conditioning ─────────────────────────────────────────────────
function NutritionLogView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [tab, setTab] = useState<'today' | 'log' | 'plan'>('today');
  const todayMeals = [
    { time: '07:30', meal: 'Breakfast', detail: 'Porridge with banana, black coffee', kcal: 380 },
    { time: '10:30', meal: 'Pre-practice snack', detail: 'Greek yoghurt, handful of almonds', kcal: 220 },
    { time: '12:30', meal: 'Lunch', detail: 'Chicken breast, brown rice, salad', kcal: 560 },
    { time: '15:00', meal: 'Pre-match meal', detail: 'Pasta with chicken — energy focus, no heavy sauces', kcal: 680 },
    { time: '17:00', meal: 'Travel snack', detail: 'Banana, protein bar', kcal: 280 },
  ];
  const rules = [
    { rule: 'No alcohol for 48 hours before a match', status: '✅' },
    { rule: 'Pre-match meal 3–4 hours before throw time', status: '✅' },
    { rule: 'Hydration: 2.5L water across match day', status: '⚠️ 1.8L so far' },
    { rule: 'Avoid caffeine within 2 hours of match', status: '✅' },
    { rule: 'No heavy fried food on match day', status: '✅' },
  ];
  const weekLog: [string, string, string, string][] = [
    ['Monday', 'Practice session + walk', '90 min + 30 min', 'Good energy'],
    ['Tuesday', 'Match day — light warm-up only', '20 min', 'Focus on arm loosening'],
    ['Wednesday', 'Rest + physio', '60 min physio', 'Shoulder treatment'],
    ['Thursday', 'Practice + gym (upper body)', '90 min + 45 min', 'Shoulder exercises'],
    ['Friday', 'Practice', '2 hrs', 'Checkout focus'],
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Nutrition &amp; Conditioning</h1>
        <p className="text-gray-400 text-sm mt-1">Match-day nutrition · Conditioning log · Guidelines</p>
      </div>
      <div className="flex rounded-lg border border-white/5 overflow-hidden w-fit">
        {(['today', 'log', 'plan'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-medium transition-colors border-r border-white/5 last:border-r-0 ${tab === t ? 'bg-red-600/20 text-red-300' : 'bg-gray-900/40 text-gray-500 hover:text-gray-300'}`}>
            {t === 'today' ? 'Today' : t === 'log' ? 'Weekly log' : 'Match plan'}
          </button>
        ))}
      </div>
      {tab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-medium">Today — match day</h2>
            <span className="text-gray-500 text-xs">Total: {todayMeals.reduce((s, m) => s + m.kcal, 0)} kcal</span>
          </div>
          <div className="space-y-2">
            {todayMeals.map((m, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-900/60 rounded-xl border border-white/5 px-4 py-3">
                <span className="text-xs text-gray-500 w-10 flex-shrink-0 mt-0.5">{m.time}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{m.meal}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{m.detail}</p>
                </div>
                <span className="text-gray-400 text-xs">{m.kcal} kcal</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'plan' && (
        <div className="space-y-4">
          <h2 className="text-white font-medium">Match-day nutrition rules</h2>
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm">
                <span>{r.status}</span>
                <span className="text-gray-300">{r.rule}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Nutritionist — Dr. Rachel Keane</p>
            <p className="text-sm text-gray-300">&ldquo;Darts requires sustained concentration over 2–3 hours. Stable blood sugar is more important than energy peaks. Hydration is the most commonly overlooked factor — even mild dehydration impairs fine motor control.&rdquo;</p>
          </div>
        </div>
      )}
      {tab === 'log' && (
        <div>
          <h2 className="text-white font-medium mb-3">This week — conditioning log</h2>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
              <span>Day</span><span>Activity</span><span>Duration</span><span>Notes</span>
            </div>
            {weekLog.map(([day, act, dur, notes], i) => (
              <div key={i} className={`grid grid-cols-4 gap-2 px-4 py-2.5 border-t border-white/5 text-sm ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}>
                <span className="text-gray-400">{day}</span>
                <span className="text-gray-300">{act}</span>
                <span className="text-gray-500 text-xs">{dur}</span>
                <span className="text-gray-600 text-xs">{notes}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Practice Board Booking ───────────────────────────────────────────────────
function BoardBookingView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [city, setCity] = useState('Dortmund');
  type Venue = { name: string; distance: string; boards: number; contact: string; notes: string };
  const venues: Record<string, Venue[]> = {
    Dortmund: [
      { name: 'Westfalenhallen Practice Area', distance: '0km — at venue', boards: 8, contact: 'PDC venue manager', notes: 'Available to entered players 10:00–18:00 on event days' },
      { name: 'Mercure Hotel Dortmund City', distance: '1.2km', boards: 2, contact: '+49 231 1025 0', notes: 'Hotel practice board. Book via concierge. €20/hr.' },
      { name: 'Dart-Sport Dortmund', distance: '3.4km', boards: 12, contact: 'info@dartsport-do.de', notes: 'Dedicated darts venue. Open 14:00–22:00. €15/hr.' },
    ],
    Prague: [
      { name: 'O2 Arena Practice Hall', distance: '0km — at venue', boards: 6, contact: 'PDC venue manager', notes: 'Players only — Euro Tour entry required' },
      { name: 'Hotel Clarion Congress', distance: '0.3km', boards: 1, contact: '+420 211 131 111', notes: 'Board in sports lounge. Request from front desk.' },
      { name: 'Sports Bar Darts Prague', distance: '2.1km', boards: 6, contact: 'info@dartsprague.cz', notes: 'Walk-in or book. Open daily 12:00–24:00.' },
    ],
    Frankfurt: [
      { name: 'Jahrhunderthalle Practice', distance: '0km — at venue', boards: 8, contact: 'PDC venue manager', notes: 'World Cup venue — players only. 09:00–17:00.' },
      { name: 'Dartclub Frankfurt', distance: '6.1km', boards: 10, contact: 'info@dartclub-ffm.de', notes: 'Club booking available. Non-members €20/session.' },
    ],
    Amsterdam: [
      { name: 'Ahoy Rotterdam Practice', distance: '0km — at venue', boards: 8, contact: 'PDC venue manager', notes: 'World Series Finals venue' },
      { name: 'Darts Amsterdam', distance: '8km', boards: 16, contact: 'book@dartsamsterdam.nl', notes: 'Best dedicated venue in Netherlands. Book 48hrs ahead.' },
    ],
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Practice Board Booking</h1>
        <p className="text-gray-400 text-sm mt-1">Find and book practice boards when on tour</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Select city</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(venues).map(c => (
            <button key={c} onClick={() => setCity(c)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${city === c ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'bg-gray-900/40 border-white/5 text-gray-400 hover:text-gray-200'}`}>{c}</button>
          ))}
        </div>
      </div>
      {city === 'Dortmund' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-950/20 border border-red-500/20 rounded-xl text-sm">
          <span className="text-red-400">🎯</span>
          <span className="text-red-200">You play tonight at Westfalenhallen — practice area available 10:00–18:00</span>
        </div>
      )}
      <div className="space-y-3">
        {(venues[city] || []).map((v, i) => (
          <div key={i} className={`bg-gray-900/60 rounded-xl border p-4 ${i === 0 ? 'border-green-500/20' : 'border-white/5'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium text-sm">{v.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{v.distance} · {v.boards} boards</p>
              </div>
              {i === 0 && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded">At venue</span>}
            </div>
            <p className="text-gray-400 text-xs">{v.notes}</p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
              <span className="text-gray-600 text-xs">{v.contact}</span>
              <button className="px-3 py-1 bg-gray-800/60 border border-white/5 text-gray-400 text-xs rounded hover:text-gray-200 transition-colors">Copy contact</button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 text-center">Venue list is curated and manually maintained · More cities added regularly</p>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── Accreditations ───────────────────────────────────────────────────────────
function AccreditationsView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  type AccredStatus = 'active' | 'pending' | 'expired';
  const accreds: Array<{ venue: string; event: string; status: AccredStatus; expires: string; badge: string; notes: string }> = [
    { venue: 'Alexandra Palace', event: 'PDC World Championship', status: 'active', expires: 'Jan 2026', badge: 'Player pass + backstage', notes: 'Annual renewal after World Championship. PDPA membership required.' },
    { venue: 'Blackpool Winter Gardens', event: 'World Matchplay', status: 'active', expires: 'Jul 2025', badge: 'Player pass + practice area', notes: 'Event-specific. Issued 2 weeks before event.' },
    { venue: 'Westfalenhallen', event: 'European Championship (tonight)', status: 'active', expires: 'Tonight', badge: 'Player pass — Board 4', notes: 'Collect from PDC desk on arrival at the venue.' },
    { venue: 'Wolverhampton Civic Hall', event: 'Grand Slam of Darts', status: 'pending', expires: 'Nov 2025', badge: 'TBC — qualification pending', notes: 'Issued if Jake qualifies. OoM Top 24 required.' },
    { venue: 'Minehead Butlins', event: 'World Pairs Championship', status: 'active', expires: 'Aug 2025', badge: 'Player + partner pass', notes: 'Shared with Mark Webb. Confirm partner details by Jul 1.' },
    { venue: 'O2 Arena, Prague', event: 'Prague Open', status: 'pending', expires: 'Apr 25', badge: 'Player pass', notes: 'Issued on confirmed entry. Confirm by Apr 19.' },
  ];
  const statusConfig: Record<AccredStatus, { label: string; dot: string; bg: string }> = {
    active: { label: '✅ Active', dot: 'bg-green-500', bg: '' },
    pending: { label: '⏳ Pending', dot: 'bg-amber-400', bg: 'bg-amber-950/10' },
    expired: { label: '❌ Expired', dot: 'bg-red-500', bg: 'bg-red-950/10' },
  };
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">Accreditations &amp; Venue Passes</h1>
        <p className="text-gray-400 text-sm mt-1">Event passes · Backstage access · Venue credentials</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active passes', value: String(accreds.filter(a => a.status === 'active').length), color: 'text-green-400' },
          { label: 'Pending', value: String(accreds.filter(a => a.status === 'pending').length), color: 'text-amber-400' },
          { label: 'Expired / needed', value: '0', color: 'text-gray-400' },
        ].map((c, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-medium ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {accreds.map((a, i) => {
          const cfg = statusConfig[a.status];
          return (
            <div key={i} className={`rounded-xl border border-white/5 p-4 ${cfg.bg}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-medium text-sm">{a.venue}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{a.event}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="text-gray-400">{cfg.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Badge: {a.badge}</span>
                <span className="text-gray-500">Expires: {a.expires}</span>
              </div>
              <p className="text-gray-600 text-xs mt-2 pt-2 border-t border-white/5">{a.notes}</p>
            </div>
          );
        })}
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── County Darts ─────────────────────────────────────────────────────────────
// ─── DART CAM & ANALYTICS VIEW ───────────────────────────────────────────────
function DartCamView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [aiBrief, setAiBrief] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const sessionStats = [
    { label: '3-Dart Avg', value: '98.4', color: '#dc2626' },
    { label: 'Checkout %', value: '44.1%', color: '#22C55E' },
    { label: 'First 9', value: '102.3', color: '#F59E0B' },
    { label: 'Doubles Hit', value: '18/41', color: '#8B5CF6' },
    { label: '180s', value: '6', color: '#F97316' },
  ]

  const doublesData = [
    { d:'D20', pct:54, fav:true }, { d:'D1', pct:22 }, { d:'D18', pct:35 },
    { d:'D4', pct:38 }, { d:'D13', pct:29 }, { d:'D6', pct:31 },
    { d:'D10', pct:42 }, { d:'D15', pct:33 }, { d:'D2', pct:18 },
    { d:'D17', pct:36 }, { d:'D3', pct:34 }, { d:'D19', pct:40 },
    { d:'D7', pct:27 }, { d:'D16', pct:67, fav:true }, { d:'D8', pct:58, fav:true },
    { d:'D11', pct:30 }, { d:'D14', pct:32 }, { d:'D9', pct:25 },
    { d:'D12', pct:28 }, { d:'D5', pct:15 },
  ] as { d: string; pct: number; fav?: boolean }[]

  const favDoubles = [
    { d: 'D16', pct: 67, attempts: 142, trend: '+3%' },
    { d: 'D8', pct: 58, attempts: 98, trend: '+1%' },
    { d: 'D20', pct: 54, attempts: 187, trend: '-2%' },
  ]

  const legData = [
    { leg: 'Leg 1', avg: 101.2 },
    { leg: 'Leg 2', avg: 94.8 },
    { leg: 'Leg 3', avg: 99.4 },
    { leg: 'Leg 4', avg: 103.1 },
    { leg: 'Leg 5', avg: 97.6 },
  ]
  const legMax = 110

  const sessionHistory = [
    { date: 'Apr 9', type: 'Match Sim', avg: '99.4', checkout: '46%', e180s: '5', duration: '90 min' },
    { date: 'Apr 8', type: 'Doubles Drill', avg: '—', checkout: '51%', e180s: '—', duration: '45 min' },
    { date: 'Apr 7', type: 'Scoring', avg: '101.2', checkout: '—', e180s: '8', duration: '60 min' },
    { date: 'Apr 6', type: 'Match Sim', avg: '96.8', checkout: '39%', e180s: '4', duration: '120 min' },
    { date: 'Apr 5', type: 'Checkout Clinic', avg: '—', checkout: '48%', e180s: '—', duration: '75 min' },
  ]

  useEffect(() => {
    setAiLoading(true)
    fetch('/api/ai/darts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `You are the AI dart cam analyst for ${session.userName || player.name} "${player.nickname}" (PDC #${player.pdcRank}). Analyse this practice session: 3-dart avg 98.4, checkout 44.1%, first 9 avg 102.3, 18/41 doubles hit, 6 x 180s. Favourite doubles: D16 (67%), D8 (58%), D20 (54%). Give a concise post-session brief: 3 positives, 2 areas to work on, 1 recommendation for next session. Max 150 words. Plain text. No markdown.` }] }) })
      .then(r => r.json()).then(d => { const t = d.content?.[0]?.text; setAiBrief(t ? cleanResponse(t) : 'Unable to generate brief.') }).catch(() => setAiBrief('Unable to generate brief.')).finally(() => setAiLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <SectionHeader icon="🎯" title="Dart Cam & Analytics" subtitle="Live throw analysis, checkout heatmap, and session intelligence." />

      {/* Device Status */}
      <div className="flex gap-3">
        {[
          { label: 'Dart Cam', status: 'Connected', color: '#22C55E', icon: '📹' },
          { label: 'PDC Stats Feed', status: 'Live', color: '#22C55E', icon: '📡' },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-2.5">
            <span>{d.icon}</span>
            <span className="text-xs text-gray-400">{d.label}</span>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs font-semibold" style={{ color: d.color }}>{d.status}</span>
          </div>
        ))}
      </div>

      {/* Session Stats Strip */}
      <div className="grid grid-cols-5 gap-3">
        {sessionStats.map((s, i) => (
          <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-[10px] font-medium mt-0.5" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Checkout Heatmap */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Checkout Heatmap — Doubles Hit Rate</div>
        <div className="grid grid-cols-5 gap-2">
          {doublesData.map(d => (
            <div key={d.d} className="rounded-lg p-2 text-center" style={{
              backgroundColor: d.pct > 55 ? 'rgba(16,185,129,0.15)' : d.pct > 35 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${d.pct > 55 ? '#10b98140' : d.pct > 35 ? '#f59e0b30' : '#ef444420'}`,
            }}>
              <div className="text-xs font-bold" style={{ color: d.pct > 55 ? '#10b981' : d.pct > 35 ? '#f59e0b' : '#ef4444' }}>
                {d.fav && '\u2B50 '}{d.d}
              </div>
              <div className="text-sm font-black text-white">{d.pct}%</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }} /> Hot (&gt;55%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.2)' }} /> Medium (35-55%)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }} /> Cold (&lt;35%)</span>
        </div>
      </div>

      {/* Favourite Doubles */}
      <div className="grid grid-cols-3 gap-4">
        {favDoubles.map((d, i) => (
          <div key={i} className="bg-[#0d1117] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-black text-white">{d.d}</span>
              <span className="text-xs" style={{ color: d.trend.startsWith('+') ? '#22C55E' : '#EF4444' }}>{d.trend}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: '#10b981' }}>{d.pct}%</div>
            <div className="text-[10px] text-gray-500 mt-1">{d.attempts} attempts this season</div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${d.pct}%` }} /></div>
          </div>
        ))}
      </div>

      {/* Throw Analysis */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-3">Throw Analysis</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Throw Speed', value: '6.2 m/s', sub: 'Optimal: 5.8–6.5', ok: true },
            { label: 'Release Angle', value: '18.4\u00B0', sub: 'Consistent (\u00B10.3\u00B0)', ok: true },
            { label: 'Grouping Score', value: '87/100', sub: 'Above average', ok: true },
          ].map((t, i) => (
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-white font-bold text-lg">{t.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.label}</div>
              <div className="text-[10px] mt-1" style={{ color: t.ok ? '#22C55E' : '#F59E0B' }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Leg-by-Leg bar chart */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Leg-by-Leg Average</div>
        <div className="flex items-end gap-3 h-32">
          {legData.map((l, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="text-[10px] text-amber-400 font-bold mb-1">{l.avg}</div>
              <div className="w-full rounded-t-md" style={{ height: `${(l.avg / legMax) * 100}%`, backgroundColor: '#F59E0B', opacity: 0.7 }} />
              <div className="text-[9px] text-gray-500 mt-1">{l.leg}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Post-Session Brief */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3"><span>🤖</span><span className="text-sm font-bold text-white">AI Post-Session Brief</span></div>
        {aiLoading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-3 bg-gray-800 rounded animate-pulse" style={{ width: `${60+i*10}%` }} />)}</div>}
        {aiBrief && !aiLoading && <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{aiBrief}</div>}
      </div>

      {/* Session History */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Session History</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Avg</th><th className="text-left p-3">CO%</th><th className="text-left p-3">180s</th><th className="text-left p-3">Duration</th></tr></thead>
          <tbody>
            {sessionHistory.map((s, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-400">{s.date}</td>
                <td className="p-3 text-gray-200">{s.type}</td>
                <td className="p-3 text-gray-300">{s.avg}</td>
                <td className="p-3 text-gray-300">{s.checkout}</td>
                <td className="p-3 text-gray-300">{s.e180s}</td>
                <td className="p-3 text-gray-500">{s.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DartsAISection context="default" player={player} session={session} />
    </div>
  )
}

// ─── PRACTICE SESSION TRACKER VIEW ───────────────────────────────────────────
function DartsPracticeView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const [sessionType, setSessionType] = useState('Doubles Finishing')
  const [duration, setDuration] = useState(60)
  const [target, setTarget] = useState('45')
  const [isRunning, setIsRunning] = useState(false)
  const [doublesTracker, setDoublesTracker] = useState<Record<string, 'hit'|'miss'|null>>({})
  const [practiceHistory, setPracticeHistory] = useState<Record<string, string>[]>([])

  const sessionTypes = ['Doubles Finishing', 'Scoring Practice', 'Checkout Routes', 'Match Simulation', 'Pressure Darts', 'Full Practice']

  const allDoubles = ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','D14','D15','D16','D17','D18','D19','D20']

  useEffect(() => {
    try { const stored = localStorage.getItem('lumio_darts_practice_sessions'); if (stored) setPracticeHistory(JSON.parse(stored)) } catch {}
  }, [])

  const toggleDouble = (d: string) => {
    setDoublesTracker(prev => {
      const current = prev[d]
      if (!current) return { ...prev, [d]: 'hit' }
      if (current === 'hit') return { ...prev, [d]: 'miss' }
      const next = { ...prev }
      delete next[d]
      return next
    })
  }

  const hits = Object.values(doublesTracker).filter(v => v === 'hit').length
  const misses = Object.values(doublesTracker).filter(v => v === 'miss').length
  const total = hits + misses

  const saveSession = () => {
    const newSession = { date: new Date().toISOString().slice(0, 10), type: sessionType, duration: String(duration), target, hits: String(hits), misses: String(misses), pct: total > 0 ? `${Math.round((hits/total)*100)}%` : '—' }
    const updated = [newSession, ...practiceHistory].slice(0, 20)
    localStorage.setItem('lumio_darts_practice_sessions', JSON.stringify(updated))
    setPracticeHistory(updated)
    setDoublesTracker({})
    setIsRunning(false)
    alert('Practice session saved!')
  }

  const checkoutHistory = [
    { session: 'Apr 9', pct: 46 },
    { session: 'Apr 8', pct: 51 },
    { session: 'Apr 7', pct: 39 },
    { session: 'Apr 6', pct: 44 },
    { session: 'Apr 5', pct: 48 },
    { session: 'Apr 4', pct: 42 },
    { session: 'Apr 3', pct: 38 },
  ]
  const coMax = 60

  return (
    <div className="space-y-6">
      <SectionHeader icon="📋" title="Practice Session Tracker" subtitle="Plan, track, and review your practice sessions." />

      {/* Today's Practice Plan */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Today&apos;s Practice Plan</div>
        <div className="space-y-4">
          <div><label className="text-xs text-gray-400 block mb-1">Session Type</label>
            <select value={sessionType} onChange={e => setSessionType(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white">
              {sessionTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-gray-400">Duration (min)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setDuration(Math.max(15, duration - 15))} className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">-</button>
              <span className="text-white font-bold text-lg w-12 text-center">{duration}</span>
              <button onClick={() => setDuration(Math.min(180, duration + 15))} className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
          <div><label className="text-xs text-gray-400 block mb-1">Checkout % Target</label><input value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" placeholder="e.g. 45" /></div>
          <button onClick={() => setIsRunning(!isRunning)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: isRunning ? '#EF4444' : '#dc2626' }}>
            {isRunning ? 'Stop Session' : 'Start Session'}
          </button>
        </div>
      </div>

      {/* Doubles Tracker Grid */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Doubles Tracker</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-teal-400 font-bold">{hits} Hits</span>
            <span className="text-red-400 font-bold">{misses} Misses</span>
            {total > 0 && <span className="text-amber-400 font-bold">{Math.round((hits/total)*100)}%</span>}
          </div>
        </div>
        <div className="text-[10px] text-gray-500 mb-3">Click: Hit (green) &rarr; Miss (red) &rarr; Reset</div>
        <div className="grid grid-cols-5 gap-2">
          {allDoubles.map(d => {
            const state = doublesTracker[d]
            return (
              <button key={d} onClick={() => toggleDouble(d)} className="rounded-lg p-2.5 text-center transition-all" style={{
                backgroundColor: state === 'hit' ? 'rgba(16,185,129,0.15)' : state === 'miss' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${state === 'hit' ? '#10b98140' : state === 'miss' ? '#ef444440' : '#1F2937'}`,
              }}>
                <div className="text-xs font-bold" style={{ color: state === 'hit' ? '#10b981' : state === 'miss' ? '#ef4444' : '#6B7280' }}>{d}</div>
                <div className="text-[9px] mt-0.5" style={{ color: state === 'hit' ? '#10b981' : state === 'miss' ? '#ef4444' : '#4B5563' }}>
                  {state === 'hit' ? 'HIT' : state === 'miss' ? 'MISS' : '—'}
                </div>
              </button>
            )
          })}
        </div>
        {total > 0 && <button onClick={saveSession} className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22C55E' }}>Save Session ({hits}/{total} — {Math.round((hits/total)*100)}%)</button>}
      </div>

      {/* Checkout % Chart */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Checkout % — Last 7 Sessions</div>
        <div className="flex items-end gap-3 h-32">
          {checkoutHistory.map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="text-[10px] text-amber-400 font-bold mb-1">{c.pct}%</div>
              <div className="w-full rounded-t-md" style={{ height: `${(c.pct / coMax) * 100}%`, backgroundColor: '#F59E0B', opacity: 0.7 }} />
              <div className="text-[9px] text-gray-500 mt-1">{c.session}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Session History */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800"><div className="text-sm font-semibold text-white">Session History</div></div>
        {practiceHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-600">No sessions recorded yet. Start a practice session above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30"><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Duration</th><th className="text-left p-3">Hits</th><th className="text-left p-3">CO%</th></tr></thead>
            <tbody>
              {practiceHistory.slice(0, 5).map((s, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-400">{s.date}</td>
                  <td className="p-3 text-gray-200">{s.type}</td>
                  <td className="p-3 text-gray-300">{s.duration} min</td>
                  <td className="p-3 text-gray-300">{s.hits}/{Number(s.hits) + Number(s.misses)}</td>
                  <td className="p-3 text-amber-400 font-bold">{s.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DartsAISection context="practicelog" player={player} session={session} />
    </div>
  )
}

function CountyDartsView({ player, session }: { player: DartsPlayer; session: SportsDemoSession }) {
  const results = [
    { date: 'Mar 2025', opponent: 'Lancashire', result: 'W', score: '8-4', avg: 101.4, competition: 'Yorkshire vs Lancashire' },
    { date: 'Jan 2025', opponent: 'Derbyshire', result: 'W', score: '7-5', avg: 98.7, competition: 'Yorkshire Championship' },
    { date: 'Nov 2024', opponent: 'Durham', result: 'L', score: '5-7', avg: 94.2, competition: 'Northern Counties League' },
    { date: 'Sep 2024', opponent: 'Nottinghamshire', result: 'W', score: '8-3', avg: 102.1, competition: 'Yorkshire Championship' },
  ];
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">County Darts</h1>
        <p className="text-gray-400 text-sm mt-1">Yorkshire County Darts · BDO-affiliated · Non-ranking appearances</p>
      </div>
      <div className="px-4 py-3 bg-gray-900/60 rounded-xl border border-white/5 text-sm text-gray-400">
        PDC Tour Card holders may play county darts but cannot enter BDO-affiliated ranking events. Jake plays for Yorkshire occasionally to stay sharp between PDC events.
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Appearances', value: '4', sub: '2024/25' },
          { label: 'Record', value: '3W 1L', sub: 'For Yorkshire' },
          { label: 'County avg', value: '99.1', sub: 'Above county standard' },
          { label: 'County', value: 'Yorkshire', sub: 'BDA affiliated' },
        ].map((k, i) => (
          <div key={i} className="bg-gray-900/60 rounded-xl border border-white/5 p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className="text-2xl font-medium text-white">{k.value}</p>
            <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-white font-medium mb-3">County results</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-900/80 text-[11px] text-gray-500 uppercase tracking-wide">
            <span>Date</span><span>Opponent</span><span>Result</span><span>Score</span><span>Avg</span>
          </div>
          {results.map((r, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-t border-white/5 text-sm items-center">
              <span className="text-gray-500">{r.date}</span>
              <span className="text-gray-300">vs {r.opponent}</span>
              <span className={r.result === 'W' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{r.result}</span>
              <span className="text-gray-400">{r.score}</span>
              <span className="text-gray-300">{r.avg}</span>
            </div>
          ))}
        </div>
      </div>
      <DartsAISection context="default" player={player} session={session} />
    </div>
  );
}

// ─── DARTS ROLES ──────────────────────────────────────────────────────────────
const DARTS_ROLES = [
  { id: 'player',  label: 'Player',            icon: '🎯', description: 'My stats & tour career' },
  { id: 'agent',   label: 'Agent / Manager',   icon: '🤝', description: 'Commercial & tour management' },
  { id: 'sponsor', label: 'Sponsor / Partner', icon: '⭐', description: 'Sponsorship & media' },
]

const DARTS_ROLE_CONFIG: Record<string, { label: string; icon: string; accent: string; sidebar: 'all' | string[]; message: string | null }> = {
  player:  { label: 'Player',            icon: '🎯', accent: '#dc2626', sidebar: 'all', message: null },
  agent:   { label: 'Agent / Manager',   icon: '🤝', accent: '#22C55E', sidebar: ['dashboard','morning','schedule','live-scores','financial','sponsorship','exhibitions','media','travel','agent','teamhub','settings'], message: 'Agent & manager view — commercial, travel and tour management.' },
  sponsor: { label: 'Sponsor / Partner', icon: '⭐', accent: '#F59E0B', sidebar: ['dashboard','sponsorship','media','settings'], message: null },
}

function DartsSponsorDashboard({ session, player }: { session: SportsDemoSession; player: DartsPlayer }) {
  const [activeTab, setActiveTab] = useState<'overview'|'obligations'|'content'|'events'|'roi'>('overview')
  const sponsorName = session.clubName || 'Red Dragon'
  const sponsorColor = '#dc2626'
  const sponsorLogo = session.logoDataUrl
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'obligations' as const, label: 'Obligations', icon: '📋' },
    { id: 'content' as const, label: 'Content', icon: '📱' },
    { id: 'events' as const, label: 'Events', icon: '🏆' },
    { id: 'roi' as const, label: 'ROI', icon: '💰' },
  ]
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="relative px-8 py-6" style={{ background: `linear-gradient(135deg, ${sponsorColor}25 0%, rgba(0,0,0,0.8) 60%, #0d1117 100%)`, borderBottom: `1px solid ${sponsorColor}30` }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: `${sponsorColor}20`, border: `2px solid ${sponsorColor}40` }}>
            {sponsorLogo ? <img src={sponsorLogo} alt={sponsorName} className="w-full h-full object-contain p-1" /> : <span className="text-2xl font-black" style={{ color: sponsorColor }}>{sponsorName.slice(0,2).toUpperCase()}</span>}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: sponsorColor }}>Partner Portal</div>
            <h1 className="text-2xl font-black text-white">{sponsorName}</h1>
            <div className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Official partner of {session.userName || player.name} · PDC #{player.pdcRank}</div>
          </div>
        </div>
      </div>
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all ${activeTab === t.id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[{ label:'Obligations', value:'4 total', sub:'1 due today', color:'#EF4444' },{ label:'Est. reach', value:'8.2M', sub:'this season', color:sponsorColor },{ label:'Deal value', value:'£45k/yr', sub:'renewal Jun 2026', color:'#22C55E' },{ label:'PDC ranking', value:`#${player.pdcRank}`, sub:'current', color:'#dc2626' }].map((s,i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-white font-semibold mt-1">{s.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'obligations' && <div className="text-sm text-gray-400">Sponsor obligations tracking — content shoots, social posts, renewals.</div>}
        {activeTab === 'content' && <div className="text-sm text-gray-400">Content calendar and performance metrics for sponsored posts.</div>}
        {activeTab === 'events' && <div className="text-sm text-gray-400">Tournament schedule with broadcast exposure and viewer estimates.</div>}
        {activeTab === 'roi' && <div className="text-sm text-gray-400">Return on investment analytics — reach, engagement, brand value.</div>}
      </div>
    </div>
  )
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function DartsPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <SportsDemoGate
      sport="darts"
      defaultClubName="Lumio Darts Tour"
      defaultSlug={slug}
      accentColor="#dc2626"
      accentColorLight="#ef4444"
      sportEmoji="🎯"
      sportLabel="Lumio Darts"
      roles={DARTS_ROLES}
    >
      {(session) => <DartsPortalInner slug={slug} session={session} />}
    </SportsDemoGate>
  )
}

function DartsPerformanceView({ player, session, onNavigate }: { player: DartsPlayer; session: SportsDemoSession; onNavigate: (id: string) => void }) {
  const [perfTab, setPerfTab] = useState('orderofmerit');
  const PERF_TABS = [
    { id: 'orderofmerit',      label: 'Order of Merit' },
    { id: 'merit-forecaster',  label: 'Points Forecaster' },
    { id: 'averages',          label: '3-Dart Average' },
    { id: 'advanced-stats',    label: 'Advanced Stats' },
    { id: 'dartboard-heatmap', label: 'Dartboard Heatmap' },
    { id: 'checkout',          label: 'Checkout Analysis' },
    { id: 'matchreports',      label: 'Match Reports' },
    { id: 'practicelog',       label: 'Practice Log' },
    { id: 'video',             label: 'Video Library' },
    { id: 'performance-rating',label: 'Performance Rating' },
    { id: 'pressure-analysis', label: 'Pressure Analysis' },
    { id: 'nine-dart-tracker', label: '9-Dart Tracker' },
    { id: 'premier-league',    label: 'Premier League' },
    { id: 'world-series',      label: 'World Series' },
  ];

  const renderPerfTab = () => {
    switch (perfTab) {
      case 'orderofmerit':      return <OrderOfMeritView onNavigate={onNavigate} player={player} session={session} />;
      case 'merit-forecaster':  return <MeritForecasterView player={player} session={session} />;
      case 'averages':          return <ThreeDartAverageView player={player} onNavigate={onNavigate} session={session} />;
      case 'advanced-stats':    return <AdvancedStatsView player={player} session={session} />;
      case 'dartboard-heatmap': return <DartboardHeatmapView player={player} session={session} />;
      case 'checkout':          return <CheckoutAnalysisView onNavigate={onNavigate} player={player} session={session} />;
      case 'matchreports':      return <MatchReportsView onNavigate={onNavigate} player={player} session={session} />;
      case 'practicelog':       return <PracticeLogView onNavigate={onNavigate} player={player} session={session} />;
      case 'video':             return <VideoLibraryView onNavigate={onNavigate} player={player} session={session} />;
      case 'performance-rating':return <PerformanceRatingView player={player} session={session} />;
      case 'pressure-analysis': return <PressureAnalysisView player={player} session={session} />;
      case 'nine-dart-tracker': return <NineDartTrackerView player={player} session={session} />;
      case 'premier-league':    return <PremierLeagueView player={player} session={session} />;
      case 'world-series':      return <WorldSeriesView player={player} session={session} />;
      default:                  return <OrderOfMeritView onNavigate={onNavigate} player={player} session={session} />;
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon="🎯" title="Performance" subtitle="All performance data, stats, and analysis in one place." />
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1">
        <div className="flex gap-1 px-1 min-w-max">
          {PERF_TABS.map(t => (
            <button key={t.id} onClick={() => setPerfTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                perfTab === t.id ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {renderPerfTab()}
    </div>
  );
}

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────
function DartsModalHeader({ icon, title, subtitle, onClose }: { icon: string; title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><div className="text-base font-bold text-white">{title}</div><div className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</div></div></div>
      <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">✕</button>
    </div>
  )
}

// ─── MODAL: FLIGHT FINDER ────────────────────────────────────────────────────
function DartsFlightFinder({ onClose, player, session }: { onClose: () => void; player: DartsPlayer; session: SportsDemoSession }) {
  const [step, setStep] = useState(0)
  const [selectedTournament, setSelectedTournament] = useState('Prague Open')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{airline:string;price:string;time:string;duration:string}[]>([])
  const tournaments = ['Prague Open', 'Players Ch. 9', 'German Masters', 'Bahrain Masters']

  const searchFlights = async () => {
    setLoading(true)
    setStep(2)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Find 3 flight options from London to the ${selectedTournament} darts tournament. For each give airline, price (GBP), departure time, and duration. Return JSON array with keys: airline, price, time, duration. No explanation.` }] })
      })
      const data = await res.json()
      const text = data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || ''
      try { setResults(JSON.parse(text)) } catch { setResults([{ airline:'British Airways', price:'£189', time:'06:45', duration:'2h 10m' },{ airline:'Ryanair', price:'£67', time:'10:30', duration:'2h 25m' },{ airline:'easyJet', price:'£112', time:'14:15', duration:'2h 15m' }]) }
    } catch { setResults([{ airline:'British Airways', price:'£189', time:'06:45', duration:'2h 10m' },{ airline:'Ryanair', price:'£67', time:'10:30', duration:'2h 25m' },{ airline:'easyJet', price:'£112', time:'14:15', duration:'2h 15m' }]) }
    setLoading(false)
  }

  const steps = ['Configure', 'Search', 'Results', 'Book']
  return (
    <div>
      <DartsModalHeader icon="✈️" title="Smart Flight Finder" subtitle="AI-powered flight search for tournaments" onClose={onClose} />
      <div className="flex items-center gap-2 px-6 py-3 border-b" style={{ borderColor: '#1F2937' }}>
        {steps.map((s, i) => (<div key={i} className="flex items-center gap-1"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i <= step ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{i+1}</div><span className={`text-[10px] ${i <= step ? 'text-white' : 'text-gray-600'}`}>{s}</span>{i < 3 && <div className="w-4 h-px bg-gray-700 mx-1" />}</div>))}
      </div>
      <div className="p-6 space-y-4">
        {step === 0 && (<>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select tournament</div>
          <div className="flex flex-wrap gap-2">
            {tournaments.map(t => (<button key={t} onClick={() => setSelectedTournament(t)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedTournament === t ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{t}</button>))}
          </div>
          <button onClick={() => { setStep(1); searchFlights() }} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Search Flights &rarr;</button>
        </>)}
        {(step === 1 || step === 2) && loading && (<div className="space-y-3 py-8">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div>)}
        {step === 2 && !loading && (<>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Results for {selectedTournament}</div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-xl p-4">
                <div><div className="text-sm font-semibold text-white">{r.airline}</div><div className="text-[10px] text-gray-500">{r.time} · {r.duration}</div></div>
                <div className="text-right"><div className="text-lg font-bold text-red-400">{r.price}</div><button onClick={() => setStep(3)} className="text-[10px] text-red-400 hover:underline">Select &rarr;</button></div>
              </div>
            ))}
          </div>
        </>)}
        {step === 3 && (<div className="text-center py-8"><div className="text-4xl mb-3">✅</div><div className="text-lg font-bold text-white mb-1">Flight selected</div><div className="text-xs text-gray-500">Booking link would open in a real integration. Details saved.</div><button onClick={onClose} className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: HOTEL FINDER ─────────────────────────────────────────────────────
function DartsHotelFinder({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1|2|3|4>(1)
  const [destination, setDestination] = useState('Prague')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [budget, setBudget] = useState('mid')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{name:string;price:string;rating:string;distance:string}[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string|null>(null)
  const preferences = ['Near venue', 'Gym', 'Late checkout', 'Quiet room', 'Restaurant', 'Parking']
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['Near venue'])
  const tournamentChips = [
    { label: 'PDC World Championship — 19 Dec (Alexandra Palace)', dest: 'Alexandra Palace, London' },
    { label: 'Premier League Darts — Feb–May (various)', dest: 'Various UK' },
    { label: 'Masters — Feb (Marshall Arena, MK)', dest: 'Marshall Arena, Milton Keynes' },
    { label: 'UK Open — Mar (Butlins Minehead)', dest: 'Butlins, Minehead' },
    { label: 'World Matchplay — Jul (Winter Gardens, Blackpool)', dest: 'Winter Gardens, Blackpool' },
    { label: 'Grand Prix — Oct (Citywest, Dublin)', dest: 'Citywest Hotel, Dublin' },
  ]

  const search = async () => {
    setLoading(true); setStep(2)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Suggest 4 hotels in ${destination} for a professional darts player. Budget: ${budget}. Preferences: ${selectedPrefs.join(', ')}. Return JSON array: name, price (per night GBP), rating (stars), distance (to venue). No explanation. Plain text only. No markdown. No bullet points.` }] })
      })
      const data = await res.json()
      const text = data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || ''
      try { setResults(JSON.parse(text)) } catch { setResults([{ name:'Hotel Duo Prague', price:'£89/night', rating:'4*', distance:'1.2km' },{ name:'Hilton Prague', price:'£145/night', rating:'5*', distance:'0.8km' },{ name:'ibis Prague Centre', price:'£62/night', rating:'3*', distance:'2.1km' },{ name:'NH Prague City', price:'£98/night', rating:'4*', distance:'1.5km' }]) }
    } catch { setResults([{ name:'Hotel Duo Prague', price:'£89/night', rating:'4*', distance:'1.2km' },{ name:'Hilton Prague', price:'£145/night', rating:'5*', distance:'0.8km' },{ name:'ibis Prague Centre', price:'£62/night', rating:'3*', distance:'2.1km' },{ name:'NH Prague City', price:'£98/night', rating:'4*', distance:'1.5km' }]) }
    setLoading(false); setStep(3)
  }

  return (
    <div>
      <DartsModalHeader icon="🏨" title="Smart Hotel Finder" subtitle="4-step wizard for tournament accommodation" onClose={onClose} />
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-4">
          {(['Configure','Search','Results','Book'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step > i+1 ? 'bg-green-600 text-white' : step === i+1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{step > i+1 ? '✓' : i+1}</div>
              <span className={`text-[10px] ${step === i+1 ? 'text-white font-semibold' : 'text-gray-600'}`}>{s}</span>
              {i < 3 && <div className="w-6 h-px bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {step === 1 && (<>
          <div><label className="text-xs text-gray-400 block mb-1">Tournament Quick Select</label><div className="flex flex-wrap gap-2">{tournamentChips.map(t => (<button key={t.label} onClick={() => setDestination(t.dest)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${destination === t.dest ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{t.label}</button>))}</div></div>
          <div><label className="text-xs text-gray-400 block mb-1">Destination</label><input value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Check-in</label><input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Check-out</label><input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          </div>
          <div><label className="text-xs text-gray-400 block mb-1">Budget</label><select value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option value="budget">Budget (under £70)</option><option value="mid">Mid-range (£70-£150)</option><option value="premium">Premium (£150+)</option></select></div>
          <div><label className="text-xs text-gray-400 block mb-1">Preferences</label><div className="flex flex-wrap gap-2">{preferences.map(p => (<button key={p} onClick={() => setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPrefs.includes(p) ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{p}</button>))}</div></div>
          <button onClick={search} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Search Hotels →</button>
        </>)}
        {step === 2 && (<div className="flex flex-col items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mb-4" /><p className="text-sm text-gray-400">Searching hotels in {destination}...</p></div>)}
        {step === 3 && (<>
          <div className="text-xs text-gray-500 mb-2">{results.length} hotels found in {destination}</div>
          <div className="space-y-3">{results.map((r, i) => (<div key={i} onClick={() => setSelectedHotel(r.name)} className={`flex items-center justify-between bg-[#0a0c14] border rounded-xl p-4 cursor-pointer transition-all ${selectedHotel === r.name ? 'border-red-500' : 'border-gray-800 hover:border-gray-700'}`}><div><div className="text-sm font-semibold text-white">{r.name}</div><div className="text-[10px] text-gray-500">{r.rating} · {r.distance} from venue</div></div><div className="text-right"><div className="text-lg font-bold text-red-400">{r.price}</div></div></div>))}</div>
          <div className="flex gap-3"><button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-700">← Back</button><button onClick={() => { if (selectedHotel) setStep(4) }} disabled={!selectedHotel} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: '#dc2626' }}>Select & Book →</button></div>
        </>)}
        {step === 4 && (<div className="text-center py-8"><div className="text-4xl mb-3">✅</div><div className="text-lg font-bold text-white mb-1">{selectedHotel}</div><div className="text-sm text-gray-400 mb-1">{destination}{checkin && checkout ? ` · ${checkin} → ${checkout}` : ''}</div><div className="text-xs text-gray-500 mb-6">Budget: {budget} · Prefs: {selectedPrefs.join(', ')}</div><div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4 text-left space-y-2"><div className="text-xs text-gray-400">Next steps:</div><div className="text-xs text-gray-300">1. Confirm dates with tournament schedule</div><div className="text-xs text-gray-300">2. Check cancellation policy</div><div className="text-xs text-gray-300">3. Book via partner link for best rate</div></div><button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Done</button></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: PRACTICE LOGGER ──────────────────────────────────────────────────
function DartsPracticeLogger({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), duration: '60', avg: '', checkout: '', one80s: '', bestLeg: '', weakSpot: 'D16', notes: '' })
  const [sessions, setSessions] = useState<Record<string,string>[]>([])

  useEffect(() => {
    try { const stored = localStorage.getItem('lumio_darts_practice_log'); if (stored) setSessions(JSON.parse(stored)) } catch {}
  }, [])

  const save = () => {
    const updated = [form, ...sessions].slice(0, 20)
    localStorage.setItem('lumio_darts_practice_log', JSON.stringify(updated))
    setSessions(updated)
  }

  return (
    <div>
      <DartsModalHeader icon="🎯" title="Practice Logger" subtitle="Track practice sessions and performance" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Duration (min)</label><input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">3-Dart Average</label><input value={form.avg} onChange={e => setForm({...form, avg: e.target.value})} placeholder="e.g. 98.4" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Checkout %</label><input value={form.checkout} onChange={e => setForm({...form, checkout: e.target.value})} placeholder="e.g. 42" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">180s</label><input value={form.one80s} onChange={e => setForm({...form, one80s: e.target.value})} placeholder="e.g. 6" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Best Leg (darts)</label><input value={form.bestLeg} onChange={e => setForm({...form, bestLeg: e.target.value})} placeholder="e.g. 14" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        </div>
        <div><label className="text-xs text-gray-400 block mb-1">Weak Spot</label><select value={form.weakSpot} onChange={e => setForm({...form, weakSpot: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>D16</option><option>D20</option><option>D8</option><option>D4</option><option>D12</option><option>Bullseye</option><option>T20 grouping</option><option>Starting doubles</option></select></div>
        <div><label className="text-xs text-gray-400 block mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" placeholder="Session notes..." /></div>
        <button onClick={save} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Save Session</button>
        {sessions.length > 0 && (<div className="pt-2"><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last {Math.min(sessions.length, 5)} sessions</div><div className="space-y-2">{sessions.slice(0,5).map((s, i) => (<div key={i} className="flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs"><span className="text-gray-400">{s.date}</span><span className="text-white">{s.avg || '—'} avg</span><span className="text-gray-500">{s.duration}min</span><span className="text-gray-500">{s.one80s || '0'} x 180</span></div>))}</div></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: MATCH REPORT ─────────────────────────────────────────────────────
function DartsMatchReport({ onClose, player }: { onClose: () => void; player: DartsPlayer }) {
  const [form, setForm] = useState({ opponent: '', tournament: '', myAvg: '', oppAvg: '', won: true, score: '', })
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: `Write a professional darts match report for ${player.name} (#${player.pdcRank}). Opponent: ${form.opponent}. Tournament: ${form.tournament}. My average: ${form.myAvg}. Opponent average: ${form.oppAvg}. Result: ${form.won ? 'Won' : 'Lost'} ${form.score}. Write 150 words, professional style, suitable for social media.` }] })
      })
      const data = await res.json()
      setReport(data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || 'Unable to generate report.')
    } catch { setReport('Unable to generate report.') }
    setLoading(false)
  }

  return (
    <div>
      <DartsModalHeader icon="📋" title="AI Match Report" subtitle="Generate professional match reports" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">Opponent</label><input value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})} placeholder="e.g. G. Price" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Tournament</label><input value={form.tournament} onChange={e => setForm({...form, tournament: e.target.value})} placeholder="e.g. European Ch." className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">My Average</label><input value={form.myAvg} onChange={e => setForm({...form, myAvg: e.target.value})} placeholder="e.g. 99.4" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Opponent Average</label><input value={form.oppAvg} onChange={e => setForm({...form, oppAvg: e.target.value})} placeholder="e.g. 96.2" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">Result</label><div className="flex gap-2">{['Won','Lost'].map(r => (<button key={r} onClick={() => setForm({...form, won: r==='Won'})} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${(r==='Won'&&form.won)||(r==='Lost'&&!form.won)?'bg-red-600/20 text-red-400 border border-red-600/40':'bg-gray-800 text-gray-400 border border-gray-700'}`}>{r}</button>))}</div></div>
          <div><label className="text-xs text-gray-400 block mb-1">Score</label><input value={form.score} onChange={e => setForm({...form, score: e.target.value})} placeholder="e.g. 6-4" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        </div>
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? 'Generating...' : 'Generate Report'}</button>
        {report && (<div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{report}</p><button onClick={() => navigator.clipboard.writeText(report)} className="mt-3 text-xs text-red-400 hover:underline">Copy to clipboard</button></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: EQUIPMENT CHECK ──────────────────────────────────────────────────
function DartsEquipmentCheck({ onClose }: { onClose: () => void }) {
  const [equipment, setEquipment] = useState([
    { item: 'Barrels', detail: '24g Target Vapor8', replace: false, notes: '' },
    { item: 'Flights', detail: 'Target Pro Ultra Standard', replace: false, notes: '' },
    { item: 'Shafts', detail: 'Target Pro Grip Medium', replace: true, notes: 'Slight wobble — replace before Prague' },
    { item: 'Board', detail: 'Winmau Blade 6', replace: false, notes: '' },
    { item: 'Oche mat', detail: 'Red Dragon Pro mat (9ft)', replace: false, notes: '' },
    { item: 'Case', detail: 'Target Takoma XL', replace: false, notes: '' },
  ])

  const save = () => { localStorage.setItem('lumio_darts_equipment', JSON.stringify(equipment)) }

  return (
    <div>
      <DartsModalHeader icon="🏹" title="Equipment Check" subtitle="Review and manage your dart setup" onClose={onClose} />
      <div className="p-6 space-y-3">
        {equipment.map((eq, i) => (
          <div key={i} className={`bg-[#0a0c14] border rounded-xl p-4 ${eq.replace ? 'border-amber-600/40' : 'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm font-semibold text-white">{eq.item}</div><div className="text-xs text-gray-400">{eq.detail}</div></div>
              <button onClick={() => { const updated = [...equipment]; updated[i] = {...eq, replace: !eq.replace}; setEquipment(updated) }} className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${eq.replace ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>{eq.replace ? 'Needs replacing' : 'OK'}</button>
            </div>
            <input value={eq.notes} onChange={e => { const updated = [...equipment]; updated[i] = {...eq, notes: e.target.value}; setEquipment(updated) }} placeholder="Notes..." className="w-full bg-transparent border-b border-gray-800 text-xs text-gray-400 py-1 focus:outline-none focus:border-red-600/40" />
          </div>
        ))}
        <button onClick={save} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Save Equipment Check</button>
      </div>
    </div>
  )
}

// ─── MODAL: PRIZE TRACKER ────────────────────────────────────────────────────
function DartsPrizeTracker({ onClose }: { onClose: () => void }) {
  const seasonTarget = 250000
  const [ytd, setYtd] = useState(68750)
  const [results, setResults] = useState([
    { event: 'Players Ch. 8', prize: 8000, result: 'QF' },
    { event: 'UK Open', prize: 24000, result: 'QF' },
    { event: 'Premier League N6', prize: 10000, result: 'W' },
    { event: 'Euro Tour 3', prize: 6750, result: 'R16' },
    { event: 'Players Ch. 7', prize: 4000, result: 'R2' },
  ])
  const [newEvent, setNewEvent] = useState('')
  const [newPrize, setNewPrize] = useState('')
  const [newResult, setNewResult] = useState('')

  const addResult = () => {
    if (!newEvent || !newPrize) return
    const prize = parseInt(newPrize)
    const updated = [{ event: newEvent, prize, result: newResult }, ...results]
    setResults(updated)
    setYtd(ytd + prize)
    localStorage.setItem('lumio_darts_prizes', JSON.stringify({ ytd: ytd + prize, results: updated }))
    setNewEvent(''); setNewPrize(''); setNewResult('')
  }

  return (
    <div>
      <DartsModalHeader icon="💰" title="Prize Money Tracker" subtitle="Track season earnings and targets" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-400">Season target</span><span className="text-xs text-gray-500">£{seasonTarget.toLocaleString()}</span></div>
          <div className="w-full bg-gray-800 rounded-full h-4 mb-2"><div className="h-4 rounded-full bg-gradient-to-r from-red-600 to-red-400 flex items-center justify-end pr-2" style={{ width: `${Math.min((ytd/seasonTarget)*100, 100)}%` }}><span className="text-[9px] text-white font-bold">{Math.round((ytd/seasonTarget)*100)}%</span></div></div>
          <div className="flex justify-between"><span className="text-lg font-bold text-red-400">£{ytd.toLocaleString()}</span><span className="text-xs text-gray-500">£{(seasonTarget-ytd).toLocaleString()} remaining</span></div>
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last 5 results</div>
        <div className="space-y-2">
          {results.slice(0,5).map((r, i) => (<div key={i} className="flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs"><span className="text-gray-300">{r.event}</span><span className="text-gray-500">{r.result}</span><span className="text-green-400 font-bold">£{r.prize.toLocaleString()}</span></div>))}
        </div>
        <div className="border-t border-gray-800 pt-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add result</div>
          <div className="grid grid-cols-3 gap-2">
            <input value={newEvent} onChange={e => setNewEvent(e.target.value)} placeholder="Event" className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
            <input value={newPrize} onChange={e => setNewPrize(e.target.value)} placeholder="Prize £" className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
            <input value={newResult} onChange={e => setNewResult(e.target.value)} placeholder="Result" className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
          </div>
          <button onClick={addResult} className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Add Result</button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL: SPONSOR POST ─────────────────────────────────────────────────────
function DartsSponsorPost({ onClose, player }: { onClose: () => void; player: DartsPlayer }) {
  const [sponsor, setSponsor] = useState('Red Dragon')
  const [postType, setPostType] = useState('Product review')
  const [platform, setPlatform] = useState('Instagram')
  const [includeStats, setIncludeStats] = useState(true)
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState('')

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: `Write a ${platform} post for professional darts player ${player.name} (#${player.pdcRank} PDC) promoting ${sponsor}. Post type: ${postType}. ${includeStats ? `Include stats: ${player.threeDartAverage} avg, ${player.checkoutPercent}% checkout.` : ''} Keep it authentic, under 200 words. Include relevant hashtags.` }] })
      })
      const data = await res.json()
      setPost(data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || 'Unable to generate post.')
    } catch { setPost('Unable to generate post.') }
    setLoading(false)
  }

  return (
    <div>
      <DartsModalHeader icon="📱" title="AI Sponsor Post" subtitle="Generate sponsor content for social media" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div><label className="text-xs text-gray-400 block mb-1">Sponsor</label><select value={sponsor} onChange={e => setSponsor(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Red Dragon</option><option>Paddy Power</option><option>Betway</option><option>Ladbrokes</option><option>Winmau</option></select></div>
        <div><label className="text-xs text-gray-400 block mb-1">Post type</label><select value={postType} onChange={e => setPostType(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Product review</option><option>Match day</option><option>Training session</option><option>Behind the scenes</option><option>Giveaway</option></select></div>
        <div><label className="text-xs text-gray-400 block mb-1">Platform</label><div className="flex gap-2">{['Instagram','Twitter','Facebook','TikTok'].map(p => (<button key={p} onClick={() => setPlatform(p)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${platform === p ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{p}</button>))}</div></div>
        <div className="flex items-center gap-2"><button onClick={() => setIncludeStats(!includeStats)} className={`w-9 h-5 rounded-full transition-all ${includeStats ? 'bg-red-600' : 'bg-gray-700'}`}><div className={`w-4 h-4 rounded-full bg-white transition-all ${includeStats ? 'ml-4' : 'ml-0.5'}`} /></button><span className="text-xs text-gray-400">Include performance stats</span></div>
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? 'Generating...' : 'Generate Post'}</button>
        {post && (<div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{post}</p><button onClick={() => navigator.clipboard.writeText(post)} className="mt-3 text-xs text-red-400 hover:underline">Copy to clipboard</button></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: MEDIA MANAGER ────────────────────────────────────────────────────
function DartsMediaManager({ onClose }: { onClose: () => void }) {
  const [obligations, setObligations] = useState([
    { id: '1', title: 'Red Dragon barrel review video', due: 'Today 12:00', done: false, type: 'Content shoot' },
    { id: '2', title: 'Betway Instagram story — match day', due: 'Today 19:00', done: false, type: 'Social post' },
    { id: '3', title: 'Betway Twitter post — pre-match', due: 'Today 18:00', done: false, type: 'Social post' },
    { id: '4', title: 'Sky Sports post-match interview', due: 'Tonight ~22:30', done: false, type: 'Interview' },
  ])
  const [newTitle, setNewTitle] = useState('')

  const toggle = (id: string) => { setObligations(prev => prev.map(o => o.id === id ? {...o, done: !o.done} : o)) }
  const add = () => { if (!newTitle) return; setObligations(prev => [...prev, { id: Date.now().toString(), title: newTitle, due: 'TBD', done: false, type: 'Other' }]); setNewTitle('') }
  const save = () => { localStorage.setItem('lumio_darts_media', JSON.stringify(obligations)) }

  return (
    <div>
      <DartsModalHeader icon="📣" title="Media Manager" subtitle="Track media obligations and content duties" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-center flex-1"><div className="text-lg font-bold text-red-400">{obligations.filter(o => !o.done).length}</div><div className="text-[10px] text-gray-500">Pending</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-center flex-1"><div className="text-lg font-bold text-green-400">{obligations.filter(o => o.done).length}</div><div className="text-[10px] text-gray-500">Done</div></div>
        </div>
        <div className="space-y-2">
          {obligations.map(o => (
            <div key={o.id} className={`flex items-center gap-3 bg-[#0a0c14] border rounded-xl p-3 transition-all ${o.done ? 'border-green-600/30 opacity-60' : 'border-gray-800'}`}>
              <button onClick={() => toggle(o.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${o.done ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>{o.done && <span className="text-[9px] text-white font-bold">✓</span>}</button>
              <div className="flex-1 min-w-0"><div className={`text-sm ${o.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>{o.title}</div><div className="text-[10px] text-gray-500">{o.due} · {o.type}</div></div>
            </div>
          ))}
        </div>
        <div className="flex gap-2"><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add obligation..." className="flex-1 bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /><button onClick={add} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Add</button></div>
        <button onClick={save} className="w-full py-2 rounded-xl text-xs font-semibold border border-gray-700 text-gray-400 hover:text-white transition-all">Save &amp; Export</button>
      </div>
    </div>
  )
}

// ─── MODAL: MENTAL PREP ──────────────────────────────────────────────────────
function DartsMentalPrep({ onClose, player }: { onClose: () => void; player: DartsPlayer }) {
  const [opponent, setOpponent] = useState('G. Price')
  const [venue, setVenue] = useState('Westfalenhallen, Dortmund')
  const [feeling, setFeeling] = useState(7)
  const [concern, setConcern] = useState('Doubles under pressure')
  const [loading, setLoading] = useState(false)
  const [prep, setPrep] = useState('')

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: `Generate a pre-match mental preparation plan for ${player.name} (#${player.pdcRank} PDC, avg ${player.threeDartAverage}). Opponent: ${opponent}. Venue: ${venue}. Current feeling: ${feeling}/10. Main concern: ${concern}. Include breathing exercises, visualization, and key mental cues. 200 words max.` }] })
      })
      const data = await res.json()
      setPrep(data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || 'Unable to generate prep.')
    } catch { setPrep('Unable to generate prep.') }
    setLoading(false)
  }

  return (
    <div>
      <DartsModalHeader icon="🧠" title="AI Mental Prep" subtitle="Pre-match mental preparation plan" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">Opponent</label><input value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Venue</label><input value={venue} onChange={e => setVenue(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
        </div>
        <div><label className="text-xs text-gray-400 block mb-1">How are you feeling? ({feeling}/10)</label><input type="range" min="1" max="10" value={feeling} onChange={e => setFeeling(parseInt(e.target.value))} className="w-full accent-red-600" /><div className="flex justify-between text-[10px] text-gray-600"><span>Anxious</span><span>Confident</span></div></div>
        <div><label className="text-xs text-gray-400 block mb-1">Main concern</label><select value={concern} onChange={e => setConcern(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Doubles under pressure</option><option>Slow start</option><option>Opponent intimidation</option><option>TV camera nerves</option><option>Fatigue</option><option>Crowd noise</option></select></div>
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? 'Generating...' : 'Generate Prep Plan'}</button>
        {prep && (<div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{prep}</p><div className="flex gap-2 mt-3"><button onClick={() => {if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(prep);u.rate=0.9;speechSynthesis.speak(u)}}} className="text-xs text-red-400 hover:underline flex items-center gap-1"><span>🔊</span> Listen</button><button onClick={() => navigator.clipboard.writeText(prep)} className="text-xs text-gray-500 hover:underline">Copy</button></div></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: PHYSIO LOG ───────────────────────────────────────────────────────
function DartsPhysioLog({ onClose }: { onClose: () => void }) {
  const areas = ['Shoulder', 'Elbow', 'Wrist', 'Back', 'Knee', 'Neck']
  const [selectedArea, setSelectedArea] = useState('Elbow')
  const [pain, setPain] = useState(3)
  const [issueType, setIssueType] = useState('Strain')
  const [notes, setNotes] = useState('')
  const [issues, setIssues] = useState([
    { area: 'Elbow', pain: 3, type: 'Repetitive strain', date: '2026-04-08', notes: 'Ongoing — treatment with Dr Reid' },
    { area: 'Shoulder', pain: 2, type: 'Stiffness', date: '2026-04-06', notes: 'Improving with physio' },
  ])

  const save = () => {
    const updated = [{ area: selectedArea, pain, type: issueType, date: new Date().toISOString().slice(0,10), notes }, ...issues]
    setIssues(updated)
    localStorage.setItem('lumio_darts_physio', JSON.stringify(updated))
    setNotes('')
  }

  return (
    <div>
      <DartsModalHeader icon="💊" title="Physio Log" subtitle="Track injuries, pain, and recovery" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div><label className="text-xs text-gray-400 block mb-2">Body area</label><div className="flex flex-wrap gap-2">{areas.map(a => (<button key={a} onClick={() => setSelectedArea(a)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedArea === a ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{a}</button>))}</div></div>
        <div><label className="text-xs text-gray-400 block mb-1">Pain level ({pain}/10)</label><input type="range" min="0" max="10" value={pain} onChange={e => setPain(parseInt(e.target.value))} className="w-full accent-red-600" /><div className="flex justify-between text-[10px] text-gray-600"><span>None</span><span>Severe</span></div></div>
        <div><label className="text-xs text-gray-400 block mb-1">Issue type</label><select value={issueType} onChange={e => setIssueType(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Strain</option><option>Stiffness</option><option>Pain</option><option>Swelling</option><option>Repetitive strain</option><option>Post-treatment</option></select></div>
        <div><label className="text-xs text-gray-400 block mb-1">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" placeholder="Treatment notes..." /></div>
        <button onClick={save} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Log Issue</button>
        {issues.length > 0 && (<div className="pt-2"><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current issues</div><div className="space-y-2">{issues.map((iss, i) => (<div key={i} className={`bg-[#0a0c14] border rounded-lg px-3 py-2 ${iss.pain >= 5 ? 'border-red-600/40' : 'border-gray-800'}`}><div className="flex items-center justify-between text-xs"><span className="text-white font-semibold">{iss.area}</span><span className={`font-bold ${iss.pain >= 5 ? 'text-red-400' : iss.pain >= 3 ? 'text-amber-400' : 'text-green-400'}`}>{iss.pain}/10</span></div><div className="text-[10px] text-gray-500">{iss.type} · {iss.date}</div>{iss.notes && <div className="text-[10px] text-gray-400 mt-1">{iss.notes}</div>}</div>))}</div></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: EXPENSE LOGGER ───────────────────────────────────────────────────
function DartsExpenseLogger({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), category: 'Travel', amount: '', description: '', receipt: false })
  const [expenses, setExpenses] = useState<{date:string;category:string;amount:string;description:string;receipt:boolean}[]>([])

  useEffect(() => {
    try { const stored = localStorage.getItem('lumio_darts_expenses'); if (stored) setExpenses(JSON.parse(stored)) } catch {}
  }, [])

  const save = () => {
    const updated = [form, ...expenses]
    setExpenses(updated)
    localStorage.setItem('lumio_darts_expenses', JSON.stringify(updated))
    setForm({ date: new Date().toISOString().slice(0,10), category: 'Travel', amount: '', description: '', receipt: false })
  }

  const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

  return (
    <div>
      <DartsModalHeader icon="🧾" title="Expense Logger" subtitle="Track tour expenses and receipts" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4 text-center"><div className="text-xs text-gray-500">Running total</div><div className="text-2xl font-bold text-red-400">£{total.toLocaleString()}</div></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Travel</option><option>Accommodation</option><option>Equipment</option><option>Entry fees</option><option>Food</option><option>Coaching</option><option>Physio</option><option>Other</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400 block mb-1">Amount (£)</label><input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
          <div><label className="text-xs text-gray-400 block mb-1">Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What for?" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        </div>
        <div className="flex items-center gap-2"><button onClick={() => setForm({...form, receipt: !form.receipt})} className={`w-9 h-5 rounded-full transition-all ${form.receipt ? 'bg-red-600' : 'bg-gray-700'}`}><div className={`w-4 h-4 rounded-full bg-white transition-all ${form.receipt ? 'ml-4' : 'ml-0.5'}`} /></button><span className="text-xs text-gray-400">Receipt attached</span></div>
        <button onClick={save} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Log Expense</button>
        {expenses.length > 0 && (<div className="pt-2"><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recent expenses</div><div className="space-y-2">{expenses.slice(0,5).map((e, i) => (<div key={i} className="flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs"><span className="text-gray-400">{e.date}</span><span className="text-gray-300">{e.description || e.category}</span><span className="text-red-400 font-bold">£{e.amount}</span>{e.receipt && <span className="text-green-400 text-[10px]">📎</span>}</div>))}</div></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: SOCIAL MEDIA AI ─────────────────────────────────────────────────
function DartsSocialMediaAI({ onClose, player }: { onClose: () => void; player: DartsPlayer }) {
  const [topic, setTopic] = useState('')
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({ Twitter: true, Instagram: true, LinkedIn: false, Facebook: false, TikTok: false })
  const [tone, setTone] = useState('Motivational')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const selectedPlatforms = Object.entries(platforms).filter(([,v]) => v).map(([k]) => k).join(', ')
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: `You are a social media manager for ${player.name}, professional darts player ranked #${player.pdcRank} on the PDC tour, nicknamed "${player.nickname}". Generate social media posts for: ${selectedPlatforms}. Topic: ${topic || 'match day hype'}. Tone: ${tone}. Write one post per platform, labelled. Include relevant hashtags. Keep each post under 280 chars for Twitter, slightly longer for others. Plain text only. No markdown. No bullet points.` }] })
      })
      const data = await res.json()
      const raw = data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || 'Unable to generate.'
      setResult(cleanResponse(raw))
    } catch { setResult('Unable to generate posts.') }
    setLoading(false)
  }

  return (
    <div>
      <DartsModalHeader icon="📲" title="Social Media AI" subtitle="Generate platform-specific posts" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div><label className="text-xs text-gray-400 block mb-1">Topic / Context</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Match win, sponsor shoutout, training day" className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600" /></div>
        <div><label className="text-xs text-gray-400 block mb-1">Platforms</label><div className="flex flex-wrap gap-2">{Object.keys(platforms).map(p => (<button key={p} onClick={() => setPlatforms(prev => ({...prev, [p]: !prev[p]}))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${platforms[p] ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{p}</button>))}</div></div>
        <div><label className="text-xs text-gray-400 block mb-1">Tone</label><select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"><option>Motivational</option><option>Professional</option><option>Casual</option><option>Hype</option><option>Grateful</option></select></div>
        <button onClick={generate} disabled={loading} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#dc2626' }}>{loading ? 'Generating...' : 'Generate Posts'}</button>
        {result && (<div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4"><p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p><button onClick={() => navigator.clipboard.writeText(result)} className="mt-3 text-xs text-red-400 hover:underline">Copy to clipboard</button></div>)}
      </div>
    </div>
  )
}

// ─── MODAL: EXHIBITION BOOKER ────────────────────────────────────────────────
function DartsExhibitionBooker({ onClose }: { onClose: () => void }) {
  const [exhibitions, setExhibitions] = useState([
    { id: '1', venue: 'Lakeside CC, Frimley Green', date: 'May 20', fee: '£3,500', status: 'confirmed' as const, contact: 'John Smith' },
    { id: '2', venue: 'Butlins Minehead', date: 'Jun 8', fee: '£5,000', status: 'pending' as const, contact: 'Sarah Jones' },
    { id: '3', venue: 'Working Mens Club, Barnsley', date: 'Jun 22', fee: '£2,000', status: 'enquiry' as const, contact: 'Mike Brown' },
  ])
  const [newVenue, setNewVenue] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newFee, setNewFee] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiEmail, setAiEmail] = useState('')

  const addEnquiry = () => {
    if (!newVenue) return
    setExhibitions(prev => [...prev, { id: Date.now().toString(), venue: newVenue, date: newDate || 'TBD', fee: newFee ? `£${newFee}` : 'TBD', status: 'enquiry', contact: '' }])
    localStorage.setItem('lumio_darts_exhibitions', JSON.stringify(exhibitions))
    setNewVenue(''); setNewDate(''); setNewFee('')
  }

  const generateEmail = async (venue: string) => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/darts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role: 'user', content: `Write a professional response email for a darts exhibition booking enquiry at ${venue}. From Jake Morrison's management team. Confirm interest, ask for venue capacity, date flexibility, and fee. 100 words max, professional tone.` }] })
      })
      const data = await res.json()
      setAiEmail(data.content?.map((b:{type:string;text?:string}) => b.type === 'text' ? b.text : '').join('') || '')
    } catch { setAiEmail('Unable to generate email.') }
    setAiLoading(false)
  }

  const statusColors: Record<string, string> = { confirmed: 'bg-green-600/20 text-green-400 border-green-600/30', pending: 'bg-amber-600/20 text-amber-400 border-amber-600/30', enquiry: 'bg-gray-800 text-gray-400 border-gray-700' }

  return (
    <div>
      <DartsModalHeader icon="🎪" title="Exhibition Booker" subtitle="Manage exhibition bookings and enquiries" onClose={onClose} />
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          {exhibitions.map(ex => (
            <div key={ex.id} className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div><div className="text-sm font-semibold text-white">{ex.venue}</div><div className="text-[10px] text-gray-500">{ex.date} · {ex.fee}{ex.contact ? ` · ${ex.contact}` : ''}</div></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColors[ex.status]}`}>{ex.status}</span>
              </div>
              {ex.status === 'enquiry' && (<button onClick={() => generateEmail(ex.venue)} disabled={aiLoading} className="text-[10px] text-red-400 hover:underline">{aiLoading ? 'Generating...' : 'Generate response email'}</button>)}
            </div>
          ))}
        </div>
        {aiEmail && (<div className="bg-[#0a0c14] border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{aiEmail}</p><button onClick={() => navigator.clipboard.writeText(aiEmail)} className="mt-2 text-[10px] text-red-400 hover:underline">Copy email</button></div>)}
        <div className="border-t border-gray-800 pt-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add enquiry</div>
          <div className="grid grid-cols-3 gap-2">
            <input value={newVenue} onChange={e => setNewVenue(e.target.value)} placeholder="Venue" className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
            <input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="Date" className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
            <input value={newFee} onChange={e => setNewFee(e.target.value)} placeholder="Fee £" className="bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
          </div>
          <button onClick={addEnquiry} className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>Add Enquiry</button>
        </div>
      </div>
    </div>
  )
}

export function DartsPortalInner({ slug, session, onSignOut }: { slug: string; session: SportsDemoSession; onSignOut?: () => void }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarExpanded = sidebarPinned || sidebarHovered;
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { const saved = localStorage.getItem('lumio_darts_hidden_items'); return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  useEffect(() => {
    const handler = (e: Event) => { const ce = e as CustomEvent; if (ce.detail?.storagePrefix === 'lumio_darts_') setHiddenItems(ce.detail.hiddenItems) }
    window.addEventListener('lumio-visibility-changed', handler)
    return () => window.removeEventListener('lumio-visibility-changed', handler)
  }, [])
  const isHidden = (key: string) => hiddenItems.includes(key)
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(() => { try { return typeof window !== 'undefined' ? localStorage.getItem('lumio_darts_profile_photo')?.trim() || session.photoDataUrl?.trim() || '/jake_morrison.jpg' : null } catch { return null } })
  // Profile sync — keeps the bottom RoleSwitcher avatar/name in step with Settings edits
  const liveProfileNameOuter = useDartsProfileName()
  const liveProfilePhotoOuter = useDartsProfilePhoto()
  const liveBrandName = useDartsBrandName()
  const liveBrandLogo = useDartsBrandLogo()
  const liveSession = { ...session, userName: liveProfileNameOuter || session.userName, photoDataUrl: liveProfilePhotoOuter?.trim() || session.photoDataUrl?.trim() || '/jake_morrison.jpg' }
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setCurrentPhoto(localStorage.getItem('lumio_darts_profile_photo'))
    window.addEventListener('lumio-profile-updated', sync)
    return () => window.removeEventListener('lumio-profile-updated', sync)
  }, [])

  useEffect(() => { setSidebarPinned(typeof window !== 'undefined' && localStorage.getItem('lumio_darts_sidebar_pinned') === 'true') }, [])
  function toggleSidebarPin() { setSidebarPinned(p => { const next = !p; localStorage.setItem('lumio_darts_sidebar_pinned', String(next)); return next }) }
  function handleSidebarEnter() { if (sidebarLeaveTimer.current) { clearTimeout(sidebarLeaveTimer.current); sidebarLeaveTimer.current = null }; setSidebarHovered(true) }
  function handleSidebarLeave() { sidebarLeaveTimer.current = setTimeout(() => setSidebarHovered(false), 400) }

  const [livePlayer, setLivePlayer] = useState<DartsPlayer | null>(null);
  const [roleOverride, setRoleOverride] = useState(session.role || 'player');
  const activeRole = roleOverride;
  const currentRole = (roleOverride || 'player') as keyof typeof DARTS_ROLE_CONFIG
  const roleConfig = DARTS_ROLE_CONFIG[currentRole] ?? DARTS_ROLE_CONFIG.player
  const isSponsor = currentRole === 'sponsor'

  const visibleSidebarItems = roleConfig.sidebar === 'all'
    ? SIDEBAR_ITEMS
    : SIDEBAR_ITEMS.filter(item => (roleConfig.sidebar as string[]).includes(item.id))

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key);
        const { data, error } = await supabase
          .from('darts_players')
          .select('*')
          .eq('slug', slug)
          .single();
        if (cancelled) return;
        if (data && !error) {
          setLivePlayer(mapSupabaseToDartsPlayer(data));
        }
      } catch { /* silent — fall back to demo */ }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const player: DartsPlayer = livePlayer || DEMO_PLAYER;
  const groups = ['OVERVIEW', 'PERFORMANCE', 'MATCH', 'TEAM', 'COMMERCIAL', 'TOOLS'];

  const renderView = () => {
    // Pro-only feature gate — demo player is on Premier League so all pass.
    if (PRO_FEATURES.includes(activeSection) && !isPro(player.plan)) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-96">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-medium text-white mb-2">Pro feature</h2>
          <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
            {activeSection.replace(/-/g, ' ')} is available on the Premier League plan (£279/mo).
          </p>
          <button className="px-6 py-3 bg-red-600/20 border border-red-500/40 text-red-300 text-sm rounded-xl hover:bg-red-600/30 transition-colors">
            Upgrade to Premier League &rarr;
          </button>
          <p className="text-gray-600 text-xs mt-3">Currently on: {player.plan || 'Essentials'}</p>
        </div>
      );
    }
    switch (activeSection) {
      case 'dashboard':     return <DashboardView player={player} session={session} onOpenModal={setActiveModal} />;
      case 'morning':       return <MorningBriefingView player={player} session={session} />;
      case 'performance':   return <DartsPerformanceView player={player} session={session} onNavigate={setActiveSection} />;
      case 'orderofmerit':  return <OrderOfMeritView onNavigate={setActiveSection} player={player} session={session} />;
      case 'schedule':      return <TournamentScheduleView onNavigate={setActiveSection} player={player} session={session} />;
      case 'averages':      return <ThreeDartAverageView player={player} onNavigate={setActiveSection} session={session} />;
      case 'checkout':      return <CheckoutAnalysisView onNavigate={setActiveSection} player={player} session={session} />;
      case 'opponentintel': return <OpponentIntelView onNavigate={setActiveSection} player={player} session={session} />;
      case 'practicelog':   return <PracticeLogView onNavigate={setActiveSection} player={player} session={session} />;
      case 'matchreports':  return <MatchReportsView onNavigate={setActiveSection} player={player} session={session} />;
      case 'video':         return <VideoLibraryView onNavigate={setActiveSection} player={player} session={session} />;
      case 'teamhub':       return <TeamHubView onNavigate={setActiveSection} player={player} session={session} />;
      case 'mental':        return <MentalPerformanceView onNavigate={setActiveSection} player={player} session={session} />;
      case 'sponsorship':   return <SponsorshipView onNavigate={setActiveSection} player={player} session={session} />;
      case 'exhibitions':   return <ExhibitionManagerView onNavigate={setActiveSection} player={player} session={session} />;
      case 'media':         return <MediaContentView onNavigate={setActiveSection} player={player} session={session} />;
      case 'financial':     return <FinancialDashboardView onNavigate={setActiveSection} player={player} session={session} />;
      case 'agent':         return <AgentPipelineView onNavigate={setActiveSection} player={player} session={session} />;
      case 'travel':        return <TravelLogisticsView onNavigate={setActiveSection} player={player} session={session} />;
      case 'tourcard':      return <TourCardQSchoolView onNavigate={setActiveSection} player={player} session={session} />;
      case 'equipment':     return <EquipmentSetupView player={player} session={session} />;
      case 'career':        return <CareerPlanningView onNavigate={setActiveSection} player={player} session={session} />;
      case 'datahub':       return <DataHubView onNavigate={setActiveSection} player={player} session={session} />;
      case 'settings':      return (
        <SportsSettings
          sport="darts"
          slug={slug}
          sportLabel="Darts"
          entity="player"
          accentColour="#dc2626"
          accentLight="#ef4444"
          session={{ userName: session?.userName, photoDataUrl: session?.photoDataUrl }}
          storagePrefix="lumio_darts_"
          brandNameValue={liveBrandName}
          brandLogoUrl={liveBrandLogo}
          profile={{
            name: 'Full Name',
            tour: 'Tour',
            tourValue: 'PDC Professional',
            ranking: 'Ranking',
            rankingValue: `#${player.pdcRank}`,
            coach: 'Coach',
            coachValue: player.coach,
            agent: 'Manager',
            agentValue: player.manager,
            playerIdLabel: 'PDC Player ID',
            staffInviteRoles: ['Coach','Manager','Physio','Sports Psychologist','Admin'],
          }}
          configFields={[
            { id: 'pdcId', label: 'PDC Player ID', description: 'For live ranking and tour data', kind: 'text', placeholder: 'e.g. PDC-0019' },
            { id: 'boardSetup', label: 'Board Setup', kind: 'select', options: ['Winmau','Target','Unicorn'], defaultValue: 'Winmau' },
            { id: 'dartWeight', label: 'Dart Weight Preference', kind: 'select', options: ['21g','22g','23g','24g','25g','26g'], defaultValue: player.dartSetup?.barrelWeight || '23g' },
          ]}
          integrationGroups={[
            {
              title: 'DATA PROVIDERS',
              items: [
                { name: 'PDC Profile', desc: 'Rankings & tour data', connected: true },
                { name: 'WDF Profile', desc: 'World Darts Federation stats' },
                { name: 'STATSports', desc: 'Movement & load tracking' },
                { name: 'Softronic', desc: 'Tournament scoring software' },
                { name: 'Dartfish', desc: 'Video analysis' },
                { name: 'DartConnect', desc: 'Digital scorekeeping', connected: true },
              ],
            },
            {
              title: 'COMMUNICATION',
              items: [
                { name: 'Slack', desc: 'Team messaging & alerts', connected: true },
                { name: 'Microsoft Teams', desc: 'Chat & video conferencing' },
                { name: 'Google Workspace', desc: 'Calendar, Drive & email' },
                { name: 'WhatsApp Business', desc: 'Player & manager messaging' },
              ],
            },
          ]}
          voiceOptions={[
            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Warm, confident British female — ideal for morning briefings' },
            { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', desc: 'Calm, authoritative British female — clear and composed' },
            { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Professional British male — steady matchday narration' },
          ]}
          teamInvite={{
            enabled: true,
            staffCount: 1,
            pendingInvites: 0,
            roleOptions: ['Coach','Manager','Physio','Sports Psychologist','Admin'],
            members: [
              { name: player.coach, role: 'Coach', access: 'Full' },
              { name: player.manager, role: 'Manager', access: 'Commercial' },
              { name: 'Dr. Sarah Mitchell', role: 'Sports Psychologist', access: 'Limited' },
            ],
          }}
          navItems={[
            { key: 'morning', label: 'Morning Briefing', emoji: '🌅' },
            { key: 'performance', label: 'Performance', emoji: '📈' },
            { key: 'dartcam', label: 'Dart Cam & Analytics', emoji: '🎯' },
            { key: 'schedule', label: 'Tournament Schedule', emoji: '🗓️' },
            { key: 'match-prep', label: 'Match Prep', emoji: '⚡' },
            { key: 'opponentintel', label: 'Opponent Intel', emoji: '🔍' },
            { key: 'teamhub', label: 'Team Hub', emoji: '👥' },
            { key: 'sponsorship', label: 'Sponsorship', emoji: '🤝' },
            { key: 'exhibitions', label: 'Exhibitions', emoji: '🎪' },
            { key: 'financial', label: 'Financial', emoji: '💰' },
            { key: 'travel', label: 'Travel', emoji: '✈️' },
            { key: 'equipment', label: 'Equipment', emoji: '📦' },
          ]}
          featureItems={[
            { key: 'morning-briefing', label: 'Morning Briefing', emoji: '🌅', description: 'AI summary at top of dashboard' },
            { key: 'quick-actions', label: 'Quick Actions bar', emoji: '⚡', description: 'Action buttons below tab bar' },
            { key: 'ai-section', label: 'AI Department Intelligence', emoji: '✨', description: 'AI Summary + Key Highlights' },
            { key: 'world-clock', label: 'World Clock', emoji: '🕐', description: 'Multi-timezone clock in banner' },
            { key: 'weather', label: 'Weather widget', emoji: '🌤️', description: 'Current location weather' },
            { key: 'player-card', label: 'Player Card', emoji: '🃏', description: 'Stats card in right sidebar' },
          ]}
          onVisibilityChange={(items) => setHiddenItems(items)}
          showWorldClock
          showAppearance
          showDeveloperTools
          devApiRouteOptions={['/api/ai/darts']}
        />
      );
      case 'dartconnect':   return <DartConnectView onNavigate={setActiveSection} player={player} session={session} />;
      case 'pdclive':       return <PDCLiveView onNavigate={setActiveSection} player={player} session={session} />;
      case 'womens-darts':  return <WomensDartsView onNavigate={setActiveSection} player={player} session={session} />;
      case 'merit-forecaster':  return <MeritForecasterView player={player} session={session} />;
      case 'entry-manager':     return <EntryManagerView player={player} session={session} />;
      case 'live-scores':       return <LiveScoresView player={player} session={session} />;
      case 'draw-bracket':      return <DrawBracketView player={player} session={session} />;
      case 'advanced-stats':    return <AdvancedStatsView player={player} session={session} />;
      case 'dartboard-heatmap': return <DartboardHeatmapView player={player} session={session} />;
      case 'pressure-analysis': return <PressureAnalysisView player={player} session={session} />;
      case 'match-prep':        return <MatchPrepView player={player} session={session} />;
      case 'physio-recovery':   return <PhysioRecoveryView player={player} session={session} />;
      case 'walk-on-music':     return <WalkOnMusicView player={player} session={session} />;
      case 'pairs-events':      return <PairsEventsView player={player} session={session} />;
      case 'tour-card-monitor': return <TourCardMonitorView player={player} session={session} />;
      case 'prize-forecaster':  return <PrizeForecastView player={player} session={session} />;
      case 'academy-dev':       return <AcademyDevView player={player} session={session} />;
      case 'practice-games':    return <PracticeGamesView player={player} session={session} />;
      case 'performance-rating': return <PerformanceRatingView player={player} session={session} />;
      case 'nine-dart-tracker':  return <NineDartTrackerView player={player} session={session} />;
      case 'premier-league':     return <PremierLeagueView player={player} session={session} />;
      case 'world-series':       return <WorldSeriesView player={player} session={session} />;
      case 'team-comms':         return <TeamCommsView player={player} session={session} />;
      case 'fan-engagement':     return <FanEngagementView player={player} session={session} />;
      case 'nutrition-log':      return <NutritionLogView player={player} session={session} />;
      case 'board-booking':      return <BoardBookingView player={player} session={session} />;
      case 'accreditations':     return <AccreditationsView player={player} session={session} />;
      case 'county-darts':       return <CountyDartsView player={player} session={session} />;
      case 'dartcam':            return <DartCamView player={player} session={session} />;
      case 'practice':           return <DartsPracticeView player={player} session={session} />;
      default:              return <DashboardView player={player} session={session} onOpenModal={setActiveModal} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', color: '#F9FAFB' }}>
      {/* Sidebar — floating when unpinned, pushes content when pinned */}
      {/* sidebar spacer removed — main content uses marginLeft */}
      <aside
        className="hidden md:flex flex-col overflow-hidden"
        style={{
          width: sidebarExpanded ? 220 : 72,
          backgroundColor: '#0a0c14',
          borderRight: '1px solid #1F2937',
          transition: 'width 250ms ease',
          position: 'fixed',
          top: 0, left: 0, height: '100vh',
          zIndex: 40,
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}>

        <div className="flex items-center shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 56, padding: sidebarExpanded ? '12px 10px' : '12px 4px', gap: sidebarExpanded ? 8 : 0 }}>
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', paddingLeft: sidebarExpanded ? 4 : 0 }}>
            {liveBrandLogo
              ? <img src={liveBrandLogo} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" style={{ background: '#ffffff08', padding: 2 }} />
              : session.logoDataUrl
                ? <img src={session.logoDataUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>🎯</div>
            }
            {sidebarExpanded && (
              <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: '#4B5563' }}>{liveBrandName || 'Lumio Darts'}</span>
            )}
          </div>
          {sidebarExpanded && (
            <button onClick={toggleSidebarPin} className="shrink-0 p-1 rounded" style={{ color: sidebarPinned ? '#dc2626' : '#4B5563', transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {groups.map(group => {
            const items = visibleSidebarItems
              .filter(item => !isHidden(item.id))
              .filter(i => i.group === group)
              .sort((a, b) => (a.id === 'settings' ? 1 : b.id === 'settings' ? -1 : 0));
            return (
              <div key={group} className="mb-3">
                {sidebarExpanded && <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group}</div>}
                {items.map(item => (
                  <button key={item.id}
                    onClick={() => { setActiveSection(item.id); if (!sidebarPinned) setSidebarHovered(false) }}
                    className="w-full flex items-center gap-2.5 py-2 rounded-lg mb-0.5 transition-all text-left"
                    style={{
                      backgroundColor: activeSection === item.id ? 'rgba(220,38,38,0.12)' : 'transparent',
                      color: activeSection === item.id ? '#fca5a5' : '#6B7280',
                      borderLeft: activeSection === item.id ? '2px solid #dc2626' : '2px solid transparent',
                      paddingLeft: sidebarExpanded ? 10 : 0,
                      justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                    }}
                    title={sidebarExpanded ? undefined : item.label}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {sidebarExpanded && <span className="text-xs font-medium truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <RoleSwitcher
          session={liveSession}
          roles={DARTS_ROLES}
          accentColor="#dc2626"
          onRoleChange={(role) => {
            setRoleOverride(role)
            const key = 'lumio_darts_demo_session'
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
            }
          }}
          sidebarCollapsed={!sidebarExpanded}
        />

        {sidebarExpanded && (
          <div className="p-3 border-t border-gray-800">
            <div className="text-[9px] text-gray-700 uppercase tracking-wider font-medium">Plan</div>
            <div className="text-xs text-red-400 font-semibold mt-0.5">{player.plan}</div>
          </div>
        )}
        <button onClick={() => {
          if (onSignOut) { onSignOut(); return }
          try {
            localStorage.removeItem('lumio_darts_demo_session')
            localStorage.removeItem('lumio_sports_demo_darts')
            const keys = Object.keys(localStorage).filter(k => k.startsWith('lumio_darts_'))
            keys.forEach(k => localStorage.removeItem(k))
          } catch {}
          window.location.href = '/darts/darts-demo'
        }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-all hover:bg-red-600/10" style={{ borderTop: '1px solid #1F2937', color: '#6B7280', justifyContent: sidebarExpanded ? 'flex-start' : 'center' }} title="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {sidebarExpanded && <span>Sign out</span>}
        </button>
        <div className="p-4 border-t flex items-center justify-center" style={{ borderColor: '#1F2937' }}>
          {sidebarExpanded
            ? <img src="/darts_logo.png" alt="Lumio Darts" className="h-8 object-contain opacity-70 hover:opacity-100 transition-opacity" />
            : <span className="text-lg">🎯</span>}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: sidebarPinned ? 220 : 72, transition: 'margin-left 250ms ease' }}>
        {/* Demo workspace banner — hidden when rendered inside /darts/app for a real signed-in user */}
        {session.isDemoShell !== false && (
          <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#0D9488', color: '#ffffff' }}>
            <span>This is a demo · sample data</span>
            <a href="/sports-signup" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>Get founding access →</a>
          </div>
        )}
        {currentRole !== 'player' && !isSponsor && roleConfig.message && (
          <div className="flex items-center justify-between px-6 py-2 text-xs flex-shrink-0"
            style={{ backgroundColor: `${roleConfig.accent}12`, borderBottom: `1px solid ${roleConfig.accent}25` }}>
            <div className="flex items-center gap-2">
              <span>{roleConfig.icon}</span>
              <span style={{ color: roleConfig.accent }}>Viewing as <strong>{roleConfig.label}</strong> — {roleConfig.message}</span>
            </div>
          </div>
        )}

        {isSponsor ? (
          <DartsSponsorDashboard session={session} player={player} />
        ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 pb-16 md:pb-0">{renderView()}</div>

          {/* Right Sidebar — Player Card (matching tennis pattern) */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0" style={{ width: '220px' }}>
            <div className="relative w-52 rounded-xl overflow-hidden border-2 border-red-500/40 shadow-2xl shadow-red-900/50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2a0a0a 0%, #0d1929 50%, #1a0a0a 100%)' }}>
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #dc2626, #F97316)' }} />
              <div className="p-4">
                {/* Ranking badges */}
                <div className="flex items-start justify-between mb-3">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white leading-none">{player.pdcRank}</div>
                    <div className="text-[10px] text-red-300 font-medium uppercase tracking-wider">PDC Rank</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-gray-400 leading-none">£{Math.round(player.careerEarnings/1000)}k</div>
                    <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Career</div>
                  </div>
                </div>
                {/* Player photo */}
                <label className="w-full h-28 rounded-lg mb-3 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                  style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(249,115,22,0.2))', border: '1px solid rgba(220,38,38,0.3)' }}>
                  {currentPhoto ? <img src={currentPhoto} alt="Player" className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} /> : <span className="text-5xl">🎯</span>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"><span className="text-white text-xs font-bold">📷 Change photo</span></div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const compressed = r.result as string; localStorage.setItem('lumio_darts_profile_photo', compressed); setCurrentPhoto(compressed); if (typeof window !== 'undefined') window.dispatchEvent(new Event('lumio-profile-updated')) }; r.readAsDataURL(f) }} />
                </label>
                {/* Name */}
                {(() => { const pn = (typeof window !== 'undefined' ? localStorage.getItem('lumio_darts_name') : null) || session.userName || player.name; return (<>
                <div className="text-white font-black text-sm uppercase tracking-wide text-center leading-tight mb-0.5">{pn.split(' ')[0]}</div>
                <div className="text-red-300 font-bold text-xs uppercase tracking-widest text-center mb-1">{pn.split(' ').slice(1).join(' ')}</div>
                </>)})()}
                {(() => { const nn = typeof window !== 'undefined' ? localStorage.getItem('lumio_darts_nickname') : null; return nn ? <div className="text-[10px] text-gray-500 italic text-center mb-2">&quot;{nn}&quot;</div> : <div className="mb-2" /> })()}
                {/* PDC Ranking badge */}
                <div className="flex justify-center mb-2">
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#f59e0b18', border:'1px solid #f59e0b40', borderRadius:'999px', padding:'4px 12px', marginTop:'6px' }}>
                    <span style={{ color:'#f59e0b', fontSize:'12px', fontWeight:'700' }}>PDC #{player.pdcRank}</span>
                  </div>
                </div>
                {/* Stat bars */}
                <div className="space-y-1.5 mb-2">
                  {[{ label:'Doubles %', pct:38.2, max:60, color:'bg-amber-500' },{ label:'TV avg', pct:((99.1-90)/15)*100, max:100, color:'bg-red-500' },{ label:'Floor avg', pct:((97.3-90)/15)*100, max:100, color:'bg-orange-500' },{ label:'180s/match', pct:(4.2/8)*100, max:100, color:'bg-purple-500' }].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="text-[8px] text-gray-500 w-16">{s.label}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5"><div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${Math.min(100, s.pct)}%` }} /></div>
                      <div className="text-[9px] text-gray-400 w-8 text-right">{s.label === 'Doubles %' ? '38.2%' : s.label === 'TV avg' ? '99.1' : s.label === 'Floor avg' ? '97.3' : '4.2'}</div>
                    </div>
                  ))}
                </div>
                {/* Bottom stats row */}
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {[{ val:'42.3', label:'CHKOUT%' },{ val:'97.8', label:'AVG' },{ val:'19', label:'RANK' }].map((s, i) => (
                    <div key={i} className="text-center bg-black/20 rounded p-1.5">
                      <div className="text-white font-black text-base leading-none">{s.val}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Form */}
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="text-[8px] text-gray-600 mr-1">FORM:</span>
                  {['W','L','W','W','L'].map((r, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${r === 'W' ? 'bg-teal-600/40 text-teal-400' : 'bg-red-600/30 text-red-400'}`}>{r}</div>
                  ))}
                </div>
                {/* Tour badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500">{player.nationality}</span>
                  <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">PDC TOUR</span>
                </div>
              </div>
              <div className="px-3 py-1.5 text-center border-t border-white/5" style={{ background: 'linear-gradient(90deg, rgba(220,38,38,0.3), rgba(249,115,22,0.3))' }}>
                <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">LUMIO DARTS</div>
              </div>
            </div>
            {/* Live Match */}
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs mb-1">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                <span className="text-red-400 font-medium text-[10px] uppercase tracking-wide">Live Tonight</span>
              </div>
              <div className="text-xs text-red-400 font-medium">European Ch. R1</div>
              <div className="text-xs text-gray-300 mt-1">vs G. Price (#7)</div>
              <div className="text-xs text-gray-500">20:00 · Dortmund</div>
              <div className="mt-2 text-xs text-yellow-400">Win = £110,000</div>
            </div>
            {/* Upcoming */}
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Upcoming</div>
              {['Prague Open (Euro Tour)', 'Players Ch. 9', 'German Masters', 'Bahrain Masters'].map((t, i) => (
                <div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50 last:border-0">{t}</div>
              ))}
            </div>
            {/* Alerts */}
            <div className="w-full bg-[#0d0f1a] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Alerts</div>
              <div className="space-y-1.5">
                <div className="text-xs text-red-400">Red Dragon shoot — confirm logistics</div>
                <div className="text-xs text-yellow-400">Prague Open entry — closes Apr 19</div>
                <div className="text-xs text-yellow-400">Sponsor renewal — agent chasing</div>
                <div className="text-xs text-red-400">PDC media — confirm tomorrow</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 border-t border-white/10 flex items-center justify-around py-2 md:hidden">
        {[
          { id: 'dashboard',         icon: '🏠',  label: 'Home' },
          { id: 'live-scores',       icon: '🔴',  label: 'Live' },
          { id: 'merit-forecaster',  icon: '📈',  label: 'OoM'  },
          { id: 'match-prep',        icon: '⚡',  label: 'Prep' },
          { id: 'tour-card-monitor', icon: '🛡️', label: 'Card' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${activeSection === item.id ? 'text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Modal overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}>
            {activeModal === 'sendmessage' && <DartsSendMessage onClose={closeModal} player={player} session={session} />}
            {activeModal === 'flights' && <DartsFlightFinder onClose={closeModal} player={player} session={session} />}
            {activeModal === 'hotel' && <DartsHotelFinder onClose={closeModal} />}
            {activeModal === 'practice' && <DartsPracticeLogger onClose={closeModal} />}
            {activeModal === 'matchreport' && <DartsMatchReport onClose={closeModal} player={player} />}
            {activeModal === 'equipment' && <DartsEquipmentCheck onClose={closeModal} />}
            {activeModal === 'prizes' && <DartsPrizeTracker onClose={closeModal} />}
            {activeModal === 'sponsor' && <DartsSponsorPost onClose={closeModal} player={player} />}
            {activeModal === 'media' && <DartsMediaManager onClose={closeModal} />}
            {activeModal === 'mental' && <DartsMentalPrep onClose={closeModal} player={player} />}
            {activeModal === 'physio' && <DartsPhysioLog onClose={closeModal} />}
            {activeModal === 'expense' && <DartsExpenseLogger onClose={closeModal} />}
            {activeModal === 'exhibition' && <DartsExhibitionBooker onClose={closeModal} />}
            {activeModal === 'socialmedia' && <DartsSocialMediaAI onClose={closeModal} player={player} />}
          </div>
        </div>
      )}
    </div>
  );
}

