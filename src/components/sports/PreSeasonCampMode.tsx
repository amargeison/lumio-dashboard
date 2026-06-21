'use client'

import { useEffect, useRef, useState } from 'react'

// Shared "Pre-Season Camp Mode" dashboard.
//
// Models the Women's FC PreSeasonCampView pattern as a sport-agnostic
// host-configurable component. Two states:
//
//   inactive → centred empty-state card with sport-specific tagline +
//              Activate CTA. Activate opens a modal capturing opener
//              date, opposition, squad size and formation. State is
//              persisted to localStorage[storageKey].
//
//   active   → "Pre-Season Active" banner with countdown / phase pill /
//              squad+formation summary / Deactivate button, followed by
//              a stack of dashboard cards configured per sport:
//              AI Pre-Season Summary, AI Key Highlights, Squad
//              Readiness Score (host supplies factor list), Today's
//              Session Checklist (host supplies items), optional
//              Fitness Test Results (host supplies battery), GPS Load
//              Tracker (host supplies weekly target km), Friendly
//              Matches log (host seeds initial entries), and an
//              optional Formation Board (host supplies checklist).
//              Any host-supplied `children` are rendered after the
//              shared dashboard cards as a sport-specific tail (the
//              existing rich static content keeps its place there).
//
// Demo vs founder mode: when `isDemoShell !== false` the AI summary
// and highlights cards display the host-supplied `demoSummary` /
// `demoHighlights` text. In founder mode the component fires two
// fetches against `aiRoute` (per-sport Anthropic proxy at
// /api/ai/<sport>) using sport-specific prompts the host supplies via
// `aiSummaryPrompt` and `aiHighlightsPrompt`. Failure falls back to
// the demo strings if present.
//
// Sports with bespoke implementations (Women's FC, Cricket, Rugby) are
// NOT migrated to this component — they keep their inline copies. This
// component is opt-in for new portals (Football Pro, Non-League) where
// the divergence is low.

type Camp = {
  opener: string
  opposition: string
  squad: number
  formation: string
}

type ReadinessFactor = { label: string; score: number; sub?: string }
type FitnessTest = { label: string; target: string }
type Friendly = { opp: string; score: string; notes: string; result: 'W' | 'D' | 'L' }

type Props = {
  accent: string
  storageKey: string
  aiRoute?: string
  isDemoShell?: boolean
  sportEmoji?: string
  sportLabel?: string
  emptyTagline?: string
  emptyDescription?: string
  defaultSquad?: string
  defaultFormation?: string
  formationOptions?: string[]
  readinessFactors?: ReadinessFactor[]
  overallReadiness?: number
  checklistItems?: string[]
  gpsTarget?: number
  fitnessTests?: FitnessTest[]
  formationCheckItems?: string[]
  defaultFriendlies?: Friendly[]
  friendliesTarget?: number
  demoSummary?: string
  demoHighlights?: string
  aiSummaryPrompt?: (camp: Camp, daysTo: number, phase: string) => string
  aiHighlightsPrompt?: (camp: Camp, daysTo: number, phase: string) => string
  children?: React.ReactNode
}

const DEFAULT_FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']

const scoreColor = (s: number) => s >= 80 ? '#22C55E' : s >= 60 ? '#F59E0B' : '#EF4444'

export default function PreSeasonCampMode({
  accent,
  storageKey,
  aiRoute = '',
  isDemoShell = true,
  sportEmoji = '⚽',
  sportLabel = 'pre-season',
  emptyTagline = 'Build the base. Set the shape. Hit the ground running.',
  emptyDescription,
  defaultSquad = '22',
  defaultFormation = '4-3-3',
  formationOptions = DEFAULT_FORMATIONS,
  readinessFactors = [],
  overallReadiness,
  checklistItems = [],
  gpsTarget = 50,
  fitnessTests,
  formationCheckItems,
  defaultFriendlies,
  friendliesTarget = 4,
  demoSummary,
  demoHighlights,
  aiSummaryPrompt,
  aiHighlightsPrompt,
  children,
}: Props) {
  const [camp, setCamp] = useState<Camp | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    opener: '',
    opposition: '',
    squad: defaultSquad,
    formation: defaultFormation,
  })

  // Daily checklist — keyed per-day so a fresh tick list appears each morning.
  const today = new Date().toISOString().split('T')[0]
  const checklistKey = `${storageKey}_checklist_${today}`
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem(checklistKey) : null
      return s ? JSON.parse(s) : Array(checklistItems.length).fill(false)
    } catch { return Array(checklistItems.length).fill(false) }
  })
  useEffect(() => {
    try { localStorage.setItem(checklistKey, JSON.stringify(checklist)) } catch {}
  }, [checklist, checklistKey])

  // Fitness test status — only used when fitnessTests prop supplied.
  const [fitnessStatus, setFitnessStatus] = useState<string[]>(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_fitness`) : null
      return s ? JSON.parse(s) : (fitnessTests ?? []).map(() => 'progress')
    } catch { return (fitnessTests ?? []).map(() => 'progress') }
  })
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}_fitness`, JSON.stringify(fitnessStatus)) } catch {}
  }, [fitnessStatus, storageKey])

  // GPS load — adjustable km/week.
  const [gpsLoad, setGpsLoad] = useState(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_gps`) : null
      return s ? Number(s) : Math.round(gpsTarget * 0.6)
    } catch { return Math.round(gpsTarget * 0.6) }
  })
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}_gps`, String(gpsLoad)) } catch {}
  }, [gpsLoad, storageKey])

  // Formation board — only used when formationCheckItems prop supplied.
  const [formationChecks, setFormationChecks] = useState<boolean[]>(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_formation`) : null
      return s ? JSON.parse(s) : Array((formationCheckItems ?? []).length).fill(false)
    } catch { return Array((formationCheckItems ?? []).length).fill(false) }
  })
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}_formation`, JSON.stringify(formationChecks)) } catch {}
  }, [formationChecks, storageKey])

  // Friendlies log.
  const [friendlies, setFriendlies] = useState<Friendly[]>(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem(`${storageKey}_friendlies`) : null
      return s ? JSON.parse(s) : (defaultFriendlies ?? [])
    } catch { return (defaultFriendlies ?? []) }
  })
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}_friendlies`, JSON.stringify(friendlies)) } catch {}
  }, [friendlies, storageKey])

  // AI state — text shown in founder mode after camp activation.
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Restore camp on mount.
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      if (raw) setCamp(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  const activate = () => {
    const c: Camp = {
      opener: form.opener,
      opposition: form.opposition,
      squad: parseInt(form.squad, 10) || 22,
      formation: form.formation,
    }
    setCamp(c)
    try { localStorage.setItem(storageKey, JSON.stringify(c)) } catch {}
    setShowModal(false)
  }

  const deactivate = () => {
    setCamp(null)
    setAiSummary(null)
    setAiHighlights(null)
    try { localStorage.removeItem(storageKey) } catch {}
  }

  const daysTo = camp
    ? Math.max(0, Math.ceil((new Date(camp.opener).getTime() - Date.now()) / 86400000))
    : 0
  const totalDays = camp ? Math.max(1, daysTo + 30) : 30
  const pctRemaining = camp ? daysTo / totalDays : 1
  const phase = pctRemaining > 0.66
    ? 'Fitness Block'
    : pctRemaining > 0.33 ? 'Tactical Block' : 'Match Sharpness'
  const phaseColor = pctRemaining > 0.66
    ? '#3B82F6'
    : pctRemaining > 0.33 ? '#F59E0B' : '#22C55E'

  // AI generation — fires once on activation in founder mode. Demo mode
  // uses the host-supplied demo strings without hitting the network.
  const aiFiredFor = useRef<string | null>(null)
  useEffect(() => {
    if (!camp) return
    if (aiFiredFor.current === camp.opener) return
    aiFiredFor.current = camp.opener
    if (isDemoShell !== false) {
      setAiSummary(demoSummary ?? null)
      setAiHighlights(demoHighlights ?? null)
      return
    }
    if (!aiSummaryPrompt && !aiHighlightsPrompt) {
      setAiSummary(demoSummary ?? null)
      setAiHighlights(demoHighlights ?? null)
      return
    }
    setAiLoading(true)
    Promise.all([
      aiSummaryPrompt
        ? fetch(aiRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 500,
              messages: [{ role: 'user', content: aiSummaryPrompt(camp, daysTo, phase) }],
            }),
          })
            .then(r => r.json())
            .then(d => setAiSummary(d.content?.[0]?.text ?? demoSummary ?? null))
            .catch(() => setAiSummary(demoSummary ?? null))
        : Promise.resolve(),
      aiHighlightsPrompt
        ? fetch(aiRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 300,
              messages: [{ role: 'user', content: aiHighlightsPrompt(camp, daysTo, phase) }],
            }),
          })
            .then(r => r.json())
            .then(d => setAiHighlights(d.content?.[0]?.text ?? demoHighlights ?? null))
            .catch(() => setAiHighlights(demoHighlights ?? null))
        : Promise.resolve(),
    ]).finally(() => setAiLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp?.opener, isDemoShell])

  const overallScore = overallReadiness ?? Math.round(
    readinessFactors.reduce((a, s) => a + s.score, 0) / Math.max(1, readinessFactors.length)
  )
  const completedChecklist = checklist.filter(Boolean).length

  // ── Inactive — empty-state CTA ──
  if (!camp) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
        >
          <div className="text-6xl mb-4">{sportEmoji}</div>
          <h2 className="text-2xl font-black text-white mb-2">Pre-Season Camp Mode</h2>
          <p className="text-lg mb-2" style={{ color: accent }}>{emptyTagline}</p>
          <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: '#9CA3AF' }}>
            {emptyDescription
              ?? `Activate ${sportLabel} and Lumio tracks every session, fitness test, squad readiness and tactical shape — all the way to your opening fixture.`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            Activate Pre-Season →
          </button>
        </div>

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937' }}
            >
              <h3 className="text-lg font-bold text-white">Activate Pre-Season</h3>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Season opener date</label>
                <input
                  type="date"
                  value={form.opener}
                  onChange={e => setForm(f => ({ ...f, opener: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Opposition (opening fixture)</label>
                <input
                  value={form.opposition}
                  onChange={e => setForm(f => ({ ...f, opposition: e.target.value }))}
                  placeholder="e.g. Northgate City"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                  style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                />
              </div>
              {form.opener && (
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Camp length: {Math.max(0, Math.ceil((new Date(form.opener).getTime() - Date.now()) / 86400000))} days
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Squad size</label>
                  <input
                    type="number"
                    value={form.squad}
                    onChange={e => setForm(f => ({ ...f, squad: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                    style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Formation target</label>
                  <select
                    value={form.formation}
                    onChange={e => setForm(f => ({ ...f, formation: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                    style={{ backgroundColor: '#111318', border: '1px solid #374151' }}
                  >
                    {formationOptions.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={activate}
                disabled={!form.opener || !form.opposition}
                className="w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: form.opener && form.opposition ? accent : '#374151' }}
              >
                Activate Pre-Season {sportEmoji}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Active — full dashboard ──
  return (
    <div className="space-y-6">
      {/* Pre-Season Active banner */}
      <div
        className="flex items-center justify-between px-5 py-3 rounded-xl"
        style={{ backgroundColor: '#F59E0B20', border: '1px solid #F59E0B40' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span>{sportEmoji}</span>
          <span className="text-sm font-bold text-white">Pre-Season Active</span>
          <span className="text-sm" style={{ color: '#F59E0B' }}>
            Opening Fixture: {camp.opposition} · {daysTo} days to go
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
            style={{ backgroundColor: phaseColor }}
          >
            {phase}
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            Squad {camp.squad} · {camp.formation}
          </span>
        </div>
        <button
          onClick={deactivate}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}
        >
          Deactivate
        </button>
      </div>

      {/* AI columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accent }}>
            AI Pre-Season Summary
          </div>
          {aiLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: `${80 + i * 5}%` }} />
              ))}
            </div>
          ) : aiSummary ? (
            <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#D1D5DB' }}>{aiSummary}</div>
          ) : (
            <div className="text-xs" style={{ color: '#6B7280' }}>AI summary will generate when camp is active.</div>
          )}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#F59E0B' }}>
            AI Key Highlights
          </div>
          {aiLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: `${70 + i * 8}%` }} />
              ))}
            </div>
          ) : aiHighlights ? (
            <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#D1D5DB' }}>{aiHighlights}</div>
          ) : (
            <div className="text-xs" style={{ color: '#6B7280' }}>Highlights will generate when camp is active.</div>
          )}
        </div>
      </div>

      {/* Squad Readiness Score */}
      {readinessFactors.length > 0 && (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Squad Readiness Score</div>
          <div className="text-3xl font-black" style={{ color: scoreColor(overallScore) }}>
            {overallScore}<span className="text-sm text-gray-500">/100</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {readinessFactors.map(s => (
            <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white">{s.label}</span>
                <span className="text-sm font-black" style={{ color: scoreColor(s.score) }}>{s.score}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${s.score}%`, backgroundColor: scoreColor(s.score) }} />
              </div>
              {s.sub && <div className="text-[9px] mt-1" style={{ color: '#9CA3AF' }}>{s.sub}</div>}
              {s.score < 60 && !s.sub && <div className="text-[9px] mt-1" style={{ color: '#EF4444' }}>Needs attention</div>}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Daily Training Checklist */}
      {checklistItems.length > 0 && (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-white">Today&apos;s Session Checklist</div>
          <div
            className="text-xs"
            style={{ color: scoreColor(completedChecklist >= Math.ceil(checklistItems.length * 0.75) ? 80 : completedChecklist >= Math.ceil(checklistItems.length * 0.5) ? 65 : 40) }}
          >
            {completedChecklist}/{checklistItems.length} completed
          </div>
        </div>
        <div className="space-y-2">
          {checklistItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setChecklist(c => c.map((v, j) => j === i ? !v : v))}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
              style={{
                backgroundColor: checklist[i] ? 'rgba(34,197,94,0.08)' : 'transparent',
                border: checklist[i] ? '1px solid rgba(34,197,94,0.2)' : '1px solid #1F2937',
              }}
            >
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: checklist[i] ? '#22C55E' : '#374151',
                  backgroundColor: checklist[i] ? 'rgba(34,197,94,0.2)' : 'transparent',
                }}
              >
                {checklist[i] && <span className="text-[10px]" style={{ color: '#22C55E' }}>✓</span>}
              </div>
              <span
                className="text-xs"
                style={{ color: checklist[i] ? '#22C55E' : '#D1D5DB', textDecoration: checklist[i] ? 'line-through' : 'none' }}
              >{item}</span>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Fitness tests + GPS load — both optional */}
      {(gpsTarget > 0 || (fitnessTests && fitnessTests.length > 0)) && (
      <div className={`grid grid-cols-1 ${fitnessTests && fitnessTests.length > 0 && gpsTarget > 0 ? 'lg:grid-cols-2' : ''} gap-4`}>
        {fitnessTests && fitnessTests.length > 0 && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="text-sm font-bold text-white mb-3">Fitness Test Results</div>
            <div className="space-y-2">
              {fitnessTests.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}
                >
                  <div>
                    <div className="text-xs text-white">{t.label}</div>
                    <div className="text-[10px]" style={{ color: '#6B7280' }}>Target: {t.target}</div>
                  </div>
                  <select
                    value={fitnessStatus[i] ?? 'progress'}
                    onChange={e => setFitnessStatus(f => f.map((v, j) => j === i ? e.target.value : v))}
                    className="text-[10px] px-2 py-1 rounded"
                    style={{
                      backgroundColor: '#1F2937',
                      color: fitnessStatus[i] === 'pass' ? '#22C55E' : fitnessStatus[i] === 'warn' ? '#F59E0B' : fitnessStatus[i] === 'fail' ? '#EF4444' : '#6B7280',
                      border: 'none',
                    }}
                  >
                    <option value="progress">In Progress</option>
                    <option value="pass">✅ Passed</option>
                    <option value="warn">⚠️ Below target</option>
                    <option value="fail">❌ Failed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
        {gpsTarget > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="text-sm font-bold text-white mb-3">GPS Load Tracker</div>
          <div className="text-center mb-4">
            <div
              className="text-4xl font-black"
              style={{ color: gpsLoad >= gpsTarget * 0.85 ? '#22C55E' : gpsLoad >= gpsTarget * 0.6 ? '#F59E0B' : '#EF4444' }}
            >
              {gpsLoad}<span className="text-sm text-gray-500">km</span>
            </div>
            <div className="text-xs" style={{ color: '#6B7280' }}>of {gpsTarget}km weekly target</div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.min(100, (gpsLoad / gpsTarget) * 100)}%`,
                backgroundColor: gpsLoad >= gpsTarget * 0.85 ? '#22C55E' : gpsLoad >= gpsTarget * 0.6 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
          <div className="flex justify-center gap-3 mb-3">
            <button
              onClick={() => setGpsLoad(g => Math.max(0, g - 5))}
              className="px-4 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}
            >- 5km</button>
            <button
              onClick={() => setGpsLoad(g => g + 5)}
              className="px-4 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}
            >+ 5km</button>
          </div>
          <div className="text-[10px] text-center" style={{ color: '#6B7280' }}>
            Increase load by max 10% per week to avoid injury spike
          </div>
        </div>
        )}
      </div>
      )}

      {/* Friendly matches log */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-white">Friendly Matches</div>
          <div className="text-xs" style={{ color: '#6B7280' }}>{friendlies.length} of {friendliesTarget} planned</div>
        </div>
        <div className="space-y-2">
          {friendlies.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
                  style={{ backgroundColor: f.result === 'W' ? '#22C55E' : f.result === 'D' ? '#F59E0B' : '#EF4444' }}
                >{f.result}</span>
                <div>
                  <div className="text-xs text-white">{f.opp}</div>
                  <div className="text-[10px]" style={{ color: '#6B7280' }}>{f.notes}</div>
                </div>
              </div>
              <span className="text-xs font-bold text-white">{f.score}</span>
            </div>
          ))}
          {friendlies.length === 0 && (
            <div className="text-xs" style={{ color: '#6B7280' }}>No friendly results logged yet.</div>
          )}
        </div>
        <button
          onClick={() => setFriendlies(f => [...f, { opp: 'TBC', score: '0-0', notes: '', result: 'D' }])}
          className="mt-3 w-full py-2 rounded-lg text-xs font-bold"
          style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}
        >+ Add Result</button>
      </div>

      {/* Formation board — optional */}
      {formationCheckItems && formationCheckItems.length > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-white">Formation Board</div>
            <span className="text-sm font-bold" style={{ color: accent }}>{camp.formation}</span>
          </div>
          <div className="space-y-2">
            {formationCheckItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setFormationChecks(t => t.map((v, j) => j === i ? !v : v))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                style={{
                  backgroundColor: formationChecks[i] ? 'rgba(34,197,94,0.08)' : 'transparent',
                  border: formationChecks[i] ? '1px solid rgba(34,197,94,0.2)' : '1px solid #1F2937',
                }}
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: formationChecks[i] ? '#22C55E' : '#374151',
                    backgroundColor: formationChecks[i] ? 'rgba(34,197,94,0.2)' : 'transparent',
                  }}
                >
                  {formationChecks[i] && <span className="text-[10px]" style={{ color: '#22C55E' }}>✓</span>}
                </div>
                <span
                  className="text-xs"
                  style={{ color: formationChecks[i] ? '#22C55E' : '#D1D5DB', textDecoration: formationChecks[i] ? 'line-through' : 'none' }}
                >{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sport-specific tail (host's existing static content) */}
      {children}
    </div>
  )
}
