'use client'

// src/app/womens/[slug]/_components/TravelLogisticsView.tsx
//
// Travel & Logistics — Women's portal ops view (single-user, club
// secretary / operations persona). Populates the previously-empty
// Travel & Logistics content panel.
//
// This is the PORTAL-SPECIFIC, re-themeable surface. All shared logic
// (types, rates, decision engine, demo/live adapter) lives in
// src/lib/sports/travel/*. When this ports to Club/Woking and Non-League,
// THIS file is copied and re-themed (accent + fixtures swapped); the lib is
// reused untouched.
//
// DEMO behaviour (the only path exercised today): trips, suppliers and
// drive-times are canned; drafts are pre-written; "send" is simulated. No
// Maps / Anthropic / Resend calls fire on demo interactions. The real-API
// path is selected by mode='live' (see trip-data-source.ts) and is not
// wired this session.

import { useEffect, useMemo, useState } from 'react'
import {
  Bus, BedDouble, Clock, MapPin, Users, ArrowRight, Plus, X,
  Mail, Sparkles, AlertTriangle, CheckCircle2, Moon, Sun, Info,
} from 'lucide-react'
import {
  getTripDataSource, type TripDataSource,
} from '@/lib/sports/travel/trip-data-source'
import type {
  Trip, TripSupplier, TripDraft, DraftType, TripCostComparison, DataMode,
} from '@/lib/sports/travel/trip-types'
import {
  OAKRIDGE_CLUB_ID, OAKRIDGE_TRIPS, OAKRIDGE_SUPPLIERS, getCannedDraft,
} from '../_lib/womens-trip-fixtures'

const ACCENT = '#BE185D'

const gbp = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function hrs(min?: number | null) {
  return min == null ? '—' : (min / 60).toFixed(1) + 'h'
}

const DRAFT_LABELS: Record<DraftType, string> = {
  coach_enquiry: 'Coach enquiry',
  hotel_enquiry: 'Hotel enquiry',
  meal_stop: 'Meal stop',
  itinerary: 'Itinerary',
  social_post: 'Social post',
}

export default function TravelLogisticsView({
  mode = 'demo',
  clubId = OAKRIDGE_CLUB_ID,
}: {
  mode?: DataMode
  clubId?: string
}) {
  // The demo seed is the portal-specific Oakridge fixtures. Live mode
  // ignores the seed and reads Supabase.
  const ds: TripDataSource = useMemo(
    () => getTripDataSource(mode, clubId, {
      trips: OAKRIDGE_TRIPS,
      suppliers: OAKRIDGE_SUPPLIERS,
      getCannedDraft,
    }),
    [mode, clubId],
  )

  const [trips, setTrips] = useState<Trip[]>([])
  const [suppliers, setSuppliers] = useState<TripSupplier[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  async function reload() {
    const [t, s] = await Promise.all([ds.listTrips(), ds.listSuppliers()])
    setTrips(t)
    setSuppliers(s)
    setSelectedId((cur) => cur ?? (t[0]?.id ?? null))
    setLoading(false)
  }

  useEffect(() => { reload() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ds])

  const selected = trips.find((t) => t.id === selectedId) ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6" style={{ color: ACCENT }} />
            <h2 className="text-xl font-bold text-white">Travel &amp; Logistics</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Away-day planning — same-day vs overnight, side by side. Lumio drafts the
            enquiries; you review and send.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="w-4 h-4" /> New trip
        </button>
      </div>

      {/* Demo-mode notice */}
      {mode === 'demo' && (
        <div className="flex items-start gap-2 rounded-lg border border-pink-600/20 bg-pink-600/5 px-3 py-2 text-xs text-pink-200/80">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Demo workspace — drive-times are canned, drafts are pre-written, and
            &ldquo;send&rdquo; is simulated. No live Maps, AI, or email calls are made.
          </span>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading trips…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Trip list */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Upcoming away trips ({trips.length})
            </div>
            {trips.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                comparison={ds.compare(t)}
                active={t.id === selectedId}
                onClick={() => setSelectedId(t.id)}
              />
            ))}

            {/* Suppliers */}
            <div className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Suppliers ({suppliers.length})
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#0D1117] divide-y divide-gray-800">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.region ?? '—'}
                    </div>
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                    {s.supplierType}
                  </span>
                </div>
              ))}
            </div>

            {/* Rate benchmarking — coming soon */}
            <div className="rounded-xl border border-dashed border-gray-700 bg-[#0D1117] px-3 py-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                Rate benchmarking
                <span className="ml-auto rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-gray-500">
                Pooled coach &amp; hotel rates by region and squad size, once more clubs
                are on Lumio. No live data yet.
              </p>
            </div>
          </div>

          {/* Trip detail */}
          <div>
            {selected
              ? <TripDetail ds={ds} trip={selected} suppliers={suppliers} mode={mode} />
              : <div className="text-sm text-gray-500">Select a trip to see the comparison.</div>}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreate={async (input) => {
            const created = await ds.createTrip(input)
            await reload()
            setSelectedId(created.id)
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Trip list card ───────────────────────────────────────────────────────
function TripCard({
  trip, comparison, active, onClick,
}: {
  trip: Trip; comparison: TripCostComparison; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition ${
        active ? 'border-pink-600/50 bg-pink-600/10' : 'border-gray-800 bg-[#0D1117] hover:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white truncate">{trip.title}</span>
        <RecBadge rec={comparison.recommendation} />
      </div>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(trip.kickoffAt)} {fmtTime(trip.kickoffAt)}</span>
        <span className="inline-flex items-center gap-1"><Bus className="w-3 h-3" />{hrs(trip.oneWayDriveMinutes)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-gray-300"><Sun className="w-3 h-3" />{gbp(comparison.dayTrip.total)}</span>
        <span className="text-gray-600">vs</span>
        <span className="inline-flex items-center gap-1 text-gray-300"><Moon className="w-3 h-3" />{gbp(comparison.overnight.total)}</span>
        <span className={`ml-auto font-semibold ${comparison.difference >= 0 ? 'text-amber-400' : 'text-green-400'}`}>
          {comparison.difference >= 0 ? '+' : '−'}{gbp(Math.abs(comparison.difference))}
        </span>
      </div>
    </button>
  )
}

function RecBadge({ rec }: { rec: TripCostComparison['recommendation'] }) {
  if (rec === 'overnight')
    return <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300"><Moon className="w-3 h-3" />Overnight</span>
  if (rec === 'day_trip')
    return <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-300"><Sun className="w-3 h-3" />Day trip</span>
  return <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gray-700/40 px-2 py-0.5 text-[10px] font-semibold text-gray-300">Your call</span>
}

// ─── Trip detail + comparison ─────────────────────────────────────────────
function TripDetail({
  ds, trip, suppliers, mode,
}: {
  ds: TripDataSource; trip: Trip; suppliers: TripSupplier[]; mode: DataMode
}) {
  const cmp = ds.compare(trip)
  const supplierName = (id?: string | null) => suppliers.find((s) => s.id === id)?.name ?? '—'

  return (
    <div className="space-y-5">
      {/* Trip header */}
      <div className="rounded-xl border border-gray-800 bg-[#0D1117] p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-white">{trip.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.venue ?? '—'}</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmtDate(trip.kickoffAt)} · KO {fmtTime(trip.kickoffAt)}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{trip.squadHeadcount + trip.staffHeadcount} travelling</span>
              <span className="inline-flex items-center gap-1"><Bus className="w-3.5 h-3.5" />{hrs(trip.oneWayDriveMinutes)} each way · {trip.oneWayDistanceMiles ?? '—'} mi</span>
            </div>
          </div>
          <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[11px] uppercase tracking-wide text-gray-300">{trip.status}</span>
        </div>
      </div>

      {/* Same-day vs overnight comparison — the core feature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CostColumn
          title="Same-day (day trip)"
          icon={<Sun className="w-4 h-4 text-amber-400" />}
          breakdown={cmp.dayTrip}
          highlight={cmp.recommendation === 'day_trip'}
        />
        <CostColumn
          title="Overnight"
          icon={<Moon className="w-4 h-4 text-indigo-300" />}
          breakdown={cmp.overnight}
          highlight={cmp.recommendation === 'overnight'}
          subtitle={`${trip.nightsCount || 1} night${(trip.nightsCount || 1) > 1 ? 's' : ''} · ${supplierName(trip.hotelSupplierId)}`}
        />
      </div>

      {/* Difference + recommendation */}
      <div className="rounded-xl border border-gray-800 bg-[#0D1117] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Difference (overnight − same-day)</span>
          <span className={`text-lg font-bold ${cmp.difference >= 0 ? 'text-amber-400' : 'text-green-400'}`}>
            {cmp.difference >= 0 ? '+' : '−'}{gbp(Math.abs(cmp.difference))}
          </span>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-black/30 p-3">
          {cmp.recommendation === 'overnight'
            ? <Moon className="w-4 h-4 mt-0.5 shrink-0 text-indigo-300" />
            : cmp.recommendation === 'day_trip'
              ? <Sun className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />}
          <div>
            <div className="text-sm font-semibold text-white">
              {cmp.recommendation === 'overnight' ? 'Lumio suggests: overnight'
                : cmp.recommendation === 'day_trip' ? 'Lumio suggests: day trip'
                : 'Lumio suggests: your call'}
              {cmp.lateReturn && (
                <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                  late return {cmp.estimatedReturnAt ? '~' + fmtTime(cmp.estimatedReturnAt) : ''}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-snug text-gray-400">{cmp.rationale}</p>
            <p className="mt-1 text-[11px] text-gray-600">
              Figures use placeholder rates — both numbers always shown so the decision stays yours.
            </p>
          </div>
        </div>
      </div>

      {/* Draft toolbar + editor */}
      <DraftPanel ds={ds} trip={trip} mode={mode} />
    </div>
  )
}

function CostColumn({
  title, subtitle, icon, breakdown, highlight,
}: {
  title: string; subtitle?: string; icon: React.ReactNode
  breakdown: TripCostComparison['dayTrip']; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-pink-600/40 bg-pink-600/5' : 'border-gray-800 bg-[#0D1117]'}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      {subtitle && <div className="mt-0.5 text-[11px] text-gray-500">{subtitle}</div>}
      <div className="mt-3 text-2xl font-bold text-white">{gbp(breakdown.total)}</div>
      <div className="mt-3 space-y-1.5">
        {breakdown.lines.length === 0 && <div className="text-xs text-gray-600">No costed lines.</div>}
        {breakdown.lines.map((l, i) => (
          <div key={i} className="flex items-start justify-between gap-2 text-xs">
            <div className="text-gray-400">
              {l.label}
              {l.detail && <span className="block text-[10px] text-gray-600">{l.detail}</span>}
            </div>
            <span className="text-gray-300 tabular-nums">{gbp(l.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Draft → edit → simulated send ────────────────────────────────────────
function DraftPanel({ ds, trip, mode }: { ds: TripDataSource; trip: Trip; mode: DataMode }) {
  const [draft, setDraft] = useState<TripDraft | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  // Overnight-only drafts are only offered when the trip is overnight.
  const types: DraftType[] = [
    'coach_enquiry',
    ...(trip.isOvernight ? (['hotel_enquiry'] as DraftType[]) : []),
    'meal_stop', 'itinerary', 'social_post',
  ]

  async function openDraft(type: DraftType) {
    setBusy(true); setSent(null)
    const d = await ds.generateDraft(trip, type)
    setDraft(d); setSubject(d.subject); setBody(d.body); setBusy(false)
  }

  async function send() {
    if (!draft) return
    setBusy(true)
    const res = await ds.sendDraft(trip, { ...draft, subject, body })
    setSent(res.message); setBusy(false); setDraft(null)
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0D1117] p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
        <span className="text-sm font-semibold text-white">Draft an enquiry</span>
        <span className="text-[11px] text-gray-500">— Lumio drafts it, you review &amp; send</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => openDraft(t)}
            disabled={busy}
            className="rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-200 hover:border-pink-600/50 hover:text-white disabled:opacity-50"
          >
            {DRAFT_LABELS[t]}
          </button>
        ))}
      </div>

      {sent && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-xs text-green-200">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{sent}</span>
        </div>
      )}

      {draft && (
        <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">
              {DRAFT_LABELS[draft.type]} {draft.isCanned && <span className="ml-1 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">canned demo draft</span>}
            </span>
            <button onClick={() => setDraft(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {draft.to !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
              <Mail className="w-3.5 h-3.5" /> To: {draft.to} {draft.supplierName ? `(${draft.supplierName})` : ''}
            </div>
          )}

          <label className="mt-3 block text-[11px] text-gray-500">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-700 bg-[#0D1117] px-2.5 py-1.5 text-sm text-white outline-none focus:border-pink-600/60"
          />

          <label className="mt-3 block text-[11px] text-gray-500">Message (editable)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="mt-1 w-full rounded-md border border-gray-700 bg-[#0D1117] px-2.5 py-2 text-xs leading-relaxed text-gray-200 outline-none focus:border-pink-600/60 font-mono"
          />

          <div className="mt-3 flex items-center justify-end gap-2">
            <button onClick={() => setDraft(null)} className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white">Cancel</button>
            <button
              onClick={send}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              <Mail className="w-3.5 h-3.5" /> {mode === 'demo' ? 'Send (simulated)' : 'Send enquiry'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create trip modal ────────────────────────────────────────────────────
function CreateTripModal({
  onClose, onCreate,
}: {
  onClose: () => void
  onCreate: (input: import('@/lib/sports/travel/trip-types').NewTripInput) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [opponent, setOpponent] = useState('')
  const [competition, setCompetition] = useState('WSL 2')
  const [venue, setVenue] = useState('')
  const [kickoff, setKickoff] = useState('')
  const [driveMin, setDriveMin] = useState('')
  const [distance, setDistance] = useState('')
  const [squad, setSquad] = useState('18')
  const [staff, setStaff] = useState('6')
  const [overnight, setOvernight] = useState(false)
  const [nights, setNights] = useState('1')
  const [busy, setBusy] = useState(false)

  const valid = title.trim() && kickoff

  async function submit() {
    if (!valid) return
    setBusy(true)
    await onCreate({
      title: title.trim(),
      opponent: opponent.trim() || undefined,
      competition: competition.trim() || undefined,
      venue: venue.trim() || undefined,
      kickoffAt: new Date(kickoff).toISOString(),
      oneWayDriveMinutes: driveMin ? Number(driveMin) : undefined,
      oneWayDistanceMiles: distance ? Number(distance) : undefined,
      squadHeadcount: Number(squad) || 0,
      staffHeadcount: Number(staff) || 0,
      isOvernight: overnight,
      nightsCount: overnight ? (Number(nights) || 1) : 0,
    })
    setBusy(false)
  }

  const field = 'w-full rounded-md border border-gray-700 bg-[#0D1117] px-2.5 py-1.5 text-sm text-white outline-none focus:border-pink-600/60'
  const lbl = 'block text-[11px] text-gray-500 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-[#0D1117] p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">New away trip</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={lbl}>Title *</label><input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tyneside Athletic Women (A)" /></div>
          <div><label className={lbl}>Opponent</label><input className={field} value={opponent} onChange={(e) => setOpponent(e.target.value)} /></div>
          <div><label className={lbl}>Competition</label><input className={field} value={competition} onChange={(e) => setCompetition(e.target.value)} /></div>
          <div className="col-span-2"><label className={lbl}>Venue</label><input className={field} value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
          <div className="col-span-2"><label className={lbl}>Kick-off *</label><input type="datetime-local" className={field} value={kickoff} onChange={(e) => setKickoff(e.target.value)} /></div>
          <div><label className={lbl}>One-way drive (min)</label><input type="number" className={field} value={driveMin} onChange={(e) => setDriveMin(e.target.value)} placeholder="canned in demo" /></div>
          <div><label className={lbl}>One-way distance (mi)</label><input type="number" className={field} value={distance} onChange={(e) => setDistance(e.target.value)} /></div>
          <div><label className={lbl}>Squad headcount</label><input type="number" className={field} value={squad} onChange={(e) => setSquad(e.target.value)} /></div>
          <div><label className={lbl}>Staff headcount</label><input type="number" className={field} value={staff} onChange={(e) => setStaff(e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <input id="ov" type="checkbox" checked={overnight} onChange={(e) => setOvernight(e.target.checked)} className="accent-pink-600" />
            <label htmlFor="ov" className="text-sm text-gray-300">Plan as overnight</label>
            {overnight && (
              <span className="ml-auto flex items-center gap-1">
                <span className="text-[11px] text-gray-500">nights</span>
                <input type="number" min="1" className="w-16 rounded-md border border-gray-700 bg-[#0D1117] px-2 py-1 text-sm text-white" value={nights} onChange={(e) => setNights(e.target.value)} />
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-gray-600">
          Lumio shows both the same-day and overnight cost the moment you save — the
          plan toggle is just your starting assumption, not a locked choice.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          <button onClick={submit} disabled={!valid || busy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: ACCENT }}>
            Create trip <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
