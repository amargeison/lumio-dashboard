'use client'

// src/app/womens/[slug]/_components/TravelLogisticsView.tsx
//
// Travel & Logistics — Women's portal module shell (single-user ops /
// secretary persona). Populates the previously-empty Travel & Logistics
// content panel.
//
// FLAGSHIP framing: the AI Travel Researcher (Plan away trip) is the hero —
// it researches, scores and drafts the booking for coach + hotel + meals.
// The same-day-vs-overnight cost comparison is a SUPPORTING tab, not the
// headline. The overview leads with the "what's booked" status board + the
// one-click Book Coach / Hotel / Meals actions (ported from the old Club
// Operations travel tab, which is being retired now this module exists).
//
// This is the PORTAL-SPECIFIC, re-themeable surface. All shared logic
// (types, rates, engine, demo/live adapter) lives in src/lib/sports/travel/*.
// Porting to Club/Woking + Non-League = copy THIS file + the fixtures, swap
// accent + demo data; the lib is reused untouched.
//
// DEMO (the only path exercised today): canned trips/results/drive-times,
// pre-written drafts, simulated send. No Maps / Anthropic / Resend. The
// real-API path is selected by mode='live' (scaffolded, not wired).

import { useEffect, useMemo, useState } from 'react'
import {
  Bus, BedDouble, Utensils, Sparkles, Info, Plus,
  CheckCircle2, CircleDashed, Circle, Minus,
} from 'lucide-react'
import { getTripDataSource, type TripDataSource } from '@/lib/sports/travel/trip-data-source'
import type { TripSupplier, DataMode, ResearchMode, AwayStatusRow, BookingState } from '@/lib/sports/travel/trip-types'
import {
  OAKRIDGE_CLUB_ID, OAKRIDGE_TRIPS, OAKRIDGE_SUPPLIERS, getCannedDraft,
  OAKRIDGE_AWAY_STATUS, OAKRIDGE_RESEARCH, OAKRIDGE_SEASON_STATS,
} from '../_lib/womens-trip-fixtures'
import TravelResearcher from './TravelResearcher'
import TripCostCompare from './TripCostCompare'

const ACCENT = '#BE185D'
type Tab = 'overview' | 'compare' | 'suppliers'

export default function TravelLogisticsView({
  mode = 'demo',
  clubId = OAKRIDGE_CLUB_ID,
}: {
  mode?: DataMode
  clubId?: string
}) {
  const ds: TripDataSource = useMemo(
    () => getTripDataSource(mode, clubId, { trips: OAKRIDGE_TRIPS, suppliers: OAKRIDGE_SUPPLIERS, getCannedDraft }),
    [mode, clubId],
  )

  const [tab, setTab] = useState<Tab>('overview')
  const [researcher, setResearcher] = useState<ResearchMode | null>(null)
  const [autoFix, setAutoFix] = useState<AwayStatusRow | null>(null)

  // The "next away day" to action = first not-yet-complete away fixture.
  const nextFixture = OAKRIDGE_AWAY_STATUS.find((f) => f.overall !== 'complete') ?? OAKRIDGE_AWAY_STATUS[0]
  const launchAuto = () => { setAutoFix(nextFixture); setResearcher('full') }

  // The AI agent takes over the full panel when launched.
  if (researcher) {
    return (
      <TravelResearcher
        mode={mode}
        accent={ACCENT}
        awayFixtures={OAKRIDGE_AWAY_STATUS}
        research={OAKRIDGE_RESEARCH}
        initialMode={researcher}
        autoFixture={autoFix ?? undefined}
        onClose={() => { setResearcher(null); setAutoFix(null) }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6" style={{ color: ACCENT }} />
            <h2 className="text-xl font-bold text-white">Travel &amp; Logistics</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Plan a whole away day in one go — Lumio researches the coach, hotel and meals,
            finds the cheapest that fit, and drafts the booking. You review and send.
          </p>
        </div>
        <button onClick={() => setResearcher('full')} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: ACCENT, boxShadow: `0 4px 14px ${ACCENT}55` }}>
          <Sparkles className="w-4 h-4" /> Plan away trip
        </button>
      </div>

      {mode === 'demo' && (
        <div className="flex items-start gap-2 rounded-lg border border-pink-600/20 bg-pink-600/5 px-3 py-2 text-xs text-pink-200/80">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Demo workspace — research results, drive-times and drafts are canned, and &ldquo;send&rdquo; is simulated. No live search, AI, Maps or email calls are made.</span>
        </div>
      )}

      {/* Sub-tab nav */}
      <div className="flex items-center gap-1 border-b border-gray-800">
        {([['overview', 'Overview'], ['compare', 'Cost compare'], ['suppliers', 'Suppliers']] as [Tab, string][]).map(([id, label]) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)}
              className="px-3.5 py-2.5 text-[13px] -mb-px border-b-2 transition-colors"
              style={{ color: active ? '#fff' : '#9CA3AF', borderColor: active ? ACCENT : 'transparent', fontWeight: active ? 600 : 500 }}>
              {label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && <Overview onAuto={launchAuto} onLaunch={setResearcher} nextFixture={nextFixture} />}
      {tab === 'compare' && <TripCostCompare ds={ds} mode={mode} />}
      {tab === 'suppliers' && <SuppliersTab ds={ds} onDiscover={() => setResearcher('full')} />}
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────
function Overview({ onAuto, onLaunch, nextFixture }: { onAuto: () => void; onLaunch: (m: ResearchMode) => void; nextFixture: AwayStatusRow }) {
  return (
    <div className="space-y-6">
      {/* AI Travel Researcher — auto-runs the whole next away day, no choosing */}
      <div className="rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: `${ACCENT}55`, background: `linear-gradient(135deg, ${ACCENT}1f, ${ACCENT}0a)` }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ACCENT}22` }}><Sparkles className="w-5 h-5" style={{ color: ACCENT }} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">AI Travel Researcher</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: `${ACCENT}22` }}>AI AGENT</span>
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5">Automatically researches the coach, hotel and pre-match meals for your next away day — <span className="text-gray-200 font-medium">{nextFixture.opponent} ({nextFixture.date})</span> — and drafts the booking in ~90 seconds.</div>
          </div>
        </div>
        <button onClick={onAuto} className="rounded-lg px-4 py-2 text-xs font-bold text-white shrink-0" style={{ backgroundColor: ACCENT }}>Launch</button>
      </div>

      {/* Or book a single item — opens the step-by-step configure wizard */}
      <div>
        <p className="text-[11px] text-gray-500 mb-2">Or book just one thing — opens the step-by-step wizard:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BookCard icon={<Bus className="w-5 h-5" style={{ color: ACCENT }} />} label="Book Team Coach" sub="Operator, capacity, kit hold, return" onClick={() => onLaunch('coach')} />
          <BookCard icon={<BedDouble className="w-5 h-5" style={{ color: ACCENT }} />} label="Book Hotel" sub="Rooms near the ground, dietary, parking" onClick={() => onLaunch('hotel')} />
          <BookCard icon={<Utensils className="w-5 h-5" style={{ color: ACCENT }} />} label="Order Pre-Match Meals" sub="Venue catering or return food stop" onClick={() => onLaunch('meals')} />
        </div>
      </div>

      {/* Status board */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white">Upcoming away fixtures — what&rsquo;s booked</h3>
          <span className="text-[11px] text-gray-500">Coach · Hotel · Meals</span>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0D1117]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#11161d]">
                {['Date', 'Opponent', 'Venue', 'Distance', 'Coach', 'Hotel', 'Meals', 'Status'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px] text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OAKRIDGE_AWAY_STATUS.map((f) => (
                <tr key={f.id} className="border-t border-gray-800">
                  <td className="px-3 py-2.5 text-gray-300">{f.date}</td>
                  <td className="px-3 py-2.5 font-semibold text-white">{f.opponent}</td>
                  <td className="px-3 py-2.5 text-gray-400">{f.venue}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-400">{f.distanceMiles} mi</td>
                  <td className="px-3 py-2.5 text-center"><BookCell s={f.coach} /></td>
                  <td className="px-3 py-2.5 text-center"><BookCell s={f.hotel} /></td>
                  <td className="px-3 py-2.5 text-center"><BookCell s={f.meals} /></td>
                  <td className="px-3 py-2.5"><OverallBadge o={f.overall} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Season stats */}
      <div className="grid grid-cols-3 gap-3">
        {OAKRIDGE_SEASON_STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-800 bg-[#0D1117] p-4">
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-300 font-semibold mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BookCard({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-xl p-4 border border-gray-800 bg-[#0D1117] hover:border-gray-700 transition-colors w-full">
      {icon}
      <div className="text-sm font-bold text-white mt-2">{label}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>
    </button>
  )
}

function BookCell({ s }: { s: BookingState }) {
  if (s === 'done') return <CheckCircle2 className="w-4 h-4 mx-auto text-green-400" />
  if (s === 'partial') return <CircleDashed className="w-4 h-4 mx-auto text-amber-400" />
  if (s === 'na') return <Minus className="w-4 h-4 mx-auto text-gray-600" />
  return <Circle className="w-4 h-4 mx-auto text-gray-600" />
}

function OverallBadge({ o }: { o: AwayStatusRow['overall'] }) {
  const map = {
    complete: { t: 'Complete', c: '#22C55E' },
    in_progress: { t: 'In progress', c: '#F59E0B' },
    not_started: { t: 'Not started', c: '#9CA3AF' },
  } as const
  const x = map[o]
  return <span className="text-[11px] font-bold" style={{ color: x.c }}>{x.t}</span>
}

// ─── Suppliers tab ────────────────────────────────────────────────────────
function SuppliersTab({ ds, onDiscover }: { ds: TripDataSource; onDiscover: () => void }) {
  const [suppliers, setSuppliers] = useState<TripSupplier[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { ds.listSuppliers().then((s) => { setSuppliers(s); setLoading(false) }) }, [ds])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-400 max-w-xl">Your saved coach operators, hotels and caterers. New to a division with none saved? Let the agent find the best, cheapest options near each venue.</p>
        <div className="flex gap-2">
          <button onClick={onDiscover} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: ACCENT }}>
            <Sparkles className="w-4 h-4" /> Find with AI
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold border border-gray-700 text-gray-300 hover:text-white">
            <Plus className="w-4 h-4" /> Add supplier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading suppliers…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-800 bg-[#0D1117] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                  <div className="text-[11px] text-gray-500">{s.region ?? '—'}</div>
                </div>
                <span className="shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">{s.supplierType}</span>
              </div>
              {s.notes && <p className="mt-2 text-[11px] text-gray-500 leading-snug">{s.notes}</p>}
              {(s.contactEmail || s.contactPhone) && (
                <div className="mt-2 text-[11px] text-gray-500">{s.contactName ? s.contactName + ' · ' : ''}{s.contactEmail ?? s.contactPhone}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rate benchmarking — coming soon */}
      <div className="rounded-xl border border-dashed border-gray-700 bg-[#0D1117] px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
          <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Rate benchmarking
          <span className="ml-auto rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">Coming soon</span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">Pooled coach &amp; hotel rates by region and squad size, once more clubs are on Lumio — so you&rsquo;ll know a quote is fair before you book. No live data yet.</p>
      </div>
    </div>
  )
}


