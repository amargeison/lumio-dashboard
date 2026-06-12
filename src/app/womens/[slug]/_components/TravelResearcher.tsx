'use client'

// src/app/womens/[slug]/_components/TravelResearcher.tsx
//
// Travel Researcher — the flagship AI agent for football away travel.
// Adapted from the Boxing/Tennis "Travel Researcher" pattern, but for a
// SQUAD away day: coach + hotel + pre-match/return meals (NO flights —
// flights/charter are Pro Phase 2 and out of scope).
//
// Flow: Configure → Research → Results → Book. The agent researches and
// SCORES options, surfaces the cheapest/best, then drafts a booking enquiry
// the human reviews and sends. Lumio never books directly (recommend →
// draft → handoff).
//
// Key value-prop wired here: AI SUPPLIER DISCOVERY. A club new to a division
// with no hotels/caterers saved still gets the best, cheapest options found
// FOR them — discovered options are flagged and can be saved as suppliers.
//
// DEMO (the only path exercised today): results are the canned OAKRIDGE_
// RESEARCH set; the "search" is a timed animation; "send" is simulated. No
// live search / Anthropic / Resend. mode==='live' is scaffolded (TODO) so a
// signed client fires real calls with no UI rework.

import { useState } from 'react'
import {
  Bus, BedDouble, Utensils, Sparkles, Check, CheckCircle2,
  Mail, MapPin, Star, Plus, Search,
} from 'lucide-react'
import type {
  DataMode, ResearchMode, ResearchResults,
  CoachQuote, HotelQuote, MealQuote, AwayStatusRow,
} from '@/lib/sports/travel/trip-types'

const gbp = (n: number) => '£' + n.toLocaleString('en-GB')

type Step = 1 | 2 | 3 | 4

const MODE_CARDS: { id: ResearchMode; icon: string; label: string; sub: string }[] = [
  { id: 'full',  icon: '🚌🏨', label: 'Full away day', sub: 'Coach + hotel + meals' },
  { id: 'coach', icon: '🚌',   label: 'Coach only',    sub: 'Just the transport' },
  { id: 'hotel', icon: '🏨',   label: 'Hotel only',    sub: 'Overnight rooms' },
  { id: 'meals', icon: '🍽️',  label: 'Meals only',    sub: 'Pre-match / food stop' },
]

export default function TravelResearcher({
  mode,
  accent = '#BE185D',
  awayFixtures,
  research,
  initialMode = 'full',
  onClose,
}: {
  mode: DataMode
  accent?: string
  awayFixtures: AwayStatusRow[]
  research: ResearchResults
  initialMode?: ResearchMode
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [rMode, setRMode] = useState<ResearchMode>(initialMode)

  // Configure inputs
  const [fixtureId, setFixtureId] = useState<string | null>(null)
  const [from] = useState('Oakridge Stadium')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [overnight, setOvernight] = useState(false)
  const [nights, setNights] = useState(1)
  const [squad, setSquad] = useState(18)
  const [staff, setStaff] = useState(6)
  // Preferences
  const [coachExec, setCoachExec] = useState(true)
  const [kitHold, setKitHold] = useState(true)
  const [hotelNearVenue, setHotelNearVenue] = useState(true)
  const [hotelBreakfast, setHotelBreakfast] = useState(true)
  const [budgetTier, setBudgetTier] = useState<'budget' | 'mid' | 'luxe'>('mid')
  const [mealPreMatch, setMealPreMatch] = useState(true)
  const [dietary, setDietary] = useState('')

  // Search / results
  const [searching, setSearching] = useState(false)
  const [phase, setPhase] = useState('')
  const [results, setResults] = useState<ResearchResults | null>(null)
  const [selCoach, setSelCoach] = useState<string | null>(null)
  const [selHotel, setSelHotel] = useState<string | null>(null)
  const [selMeal, setSelMeal] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // Book
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)

  const includeCoach = rMode === 'full' || rMode === 'coach'
  const includeHotel = rMode === 'full' || rMode === 'hotel'
  const includeMeals = rMode === 'full' || rMode === 'meals'

  const people = squad + staff
  const canSearch = !!to && !!date

  function pickFixture(f: AwayStatusRow) {
    setFixtureId(f.id)
    setTo(f.venue)
  }

  async function runSearch() {
    setStep(2); setSearching(true); setResults(null)
    setSelCoach(null); setSelHotel(null); setSelMeal(null)
    try {
      if (mode === 'demo') {
        // CANNED — timed animation, no live search/AI.
        if (includeCoach) { setPhase('🚌 Comparing coach operators…'); await wait(700) }
        if (includeHotel) { setPhase(`🏨 Searching hotels near ${to || 'the venue'}…`); await wait(700) }
        if (includeMeals) { setPhase('🍽️ Finding pre-match catering & food stops…'); await wait(600) }
        setPhase('💷 Scoring options on price + fit…'); await wait(500)
        setResults({
          coaches: includeCoach ? research.coaches : [],
          hotels: includeHotel ? research.hotels : [],
          meals: includeMeals ? research.meals : [],
        })
      } else {
        // TODO(live): call /api/ai/womens with the configure inputs to
        // research + score real coach/hotel/catering options (and a real
        // search API for discovery). Demo path above is the only one wired.
        setResults({ coaches: [], hotels: [], meals: [] })
      }
      // Pre-select the top (recommended) of each included category.
      setStep(3)
    } catch (e) { console.error(e) }
    setSearching(false); setPhase('')
  }

  const r = results
  const coach = r?.coaches.find((c) => c.id === selCoach) || null
  const hotel = r?.hotels.find((h) => h.id === selHotel) || null
  const meal = r?.meals.find((m) => m.id === selMeal) || null

  const total =
    (coach?.priceReturn ?? 0) +
    (overnight ? (hotel?.totalPrice ?? 0) : 0) +
    (meal?.total ?? 0)

  function genEmail() {
    const lines: string[] = []
    lines.push(`Subject: Away-day booking enquiry — Oakridge Women FC${to ? ' — ' + to : ''}`)
    lines.push('')
    lines.push('Hi,')
    lines.push('')
    lines.push(`Please could you confirm availability and a quote for the following Oakridge Women FC away trip:`)
    lines.push('')
    lines.push(`  • Fixture:    ${fixtureName()}`)
    lines.push(`  • Date:       ${date || 'TBC'}`)
    lines.push(`  • From → to:  ${from} → ${to || 'TBC'}`)
    lines.push(`  • Party:      ${squad} squad + ${staff} staff (${people} total)`)
    if (coach) {
      lines.push('')
      lines.push(`COACH — ${coach.operator}`)
      lines.push(`  ${coach.vehicle} · return · approx ${gbp(coach.priceReturn)}`)
      lines.push(kitHold ? '  Kit hold required (match kit + medical bags).' : '')
    }
    if (overnight && hotel) {
      lines.push('')
      lines.push(`HOTEL — ${hotel.name} (${hotel.stars > 0 ? hotel.stars + '★' : 'B&B'})`)
      lines.push(`  ${Math.ceil(people / 2)} twin rooms × ${nights} night${nights > 1 ? 's' : ''} · approx ${gbp(hotel.totalPrice)}`)
      lines.push(hotelBreakfast ? '  Early breakfast + secure coach parking, please.' : '  Secure coach parking, please.')
    }
    if (meal) {
      lines.push('')
      lines.push(`MEALS — ${meal.name}`)
      lines.push(`  ${meal.kind} · ${people} covers · approx ${gbp(meal.total)}`)
      if (dietary) lines.push(`  Dietary: ${dietary}`)
    }
    lines.push('')
    lines.push(`Estimated total: ${gbp(total)} (placeholder rates — please quote actuals).`)
    lines.push('')
    lines.push('Many thanks,')
    lines.push('Oakridge Women FC — Club Operations')
    setEmail(lines.filter((l) => l !== '').join('\n').replace(/\n(COACH|HOTEL|MEALS) /g, '\n\n$1 '))
    setStep(4)
  }

  function fixtureName(): string {
    const f = awayFixtures.find((x) => x.id === fixtureId)
    return f ? `${f.opponent} (A)` : (to || 'Away fixture')
  }

  function send() {
    const names = [coach?.operator, overnight ? hotel?.name : null, meal?.name].filter(Boolean).join(', ')
    setSent(
      mode === 'demo'
        ? `Enquiry would be sent to ${names || 'the supplier(s)'} (demo — no email sent).`
        : '[live send not yet wired — see TODO]',
    )
  }

  const recommendation = buildNarrative(r, overnight, total)
  const discoveredHotels = (r?.hotels ?? []).filter((h) => !h.savedSupplierId).length
  const discoveredMeals = (r?.meals ?? []).filter((m) => !m.savedSupplierId).length

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={onClose} className="text-xs text-gray-500 hover:text-pink-400 inline-flex items-center gap-1.5">
        <span>←</span><span>Back to travel overview</span>
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">TR-COACH-01</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}14` }}>AI Research Agent</span>
        </div>
        <h2 className="text-xl font-black text-white">Travel Researcher</h2>
        <p className="text-sm text-gray-400">Coach, hotel, and a booking enquiry for the whole away day — in under 60 seconds.</p>
      </div>

      <Stepper step={step} accent={accent} />

      {step === 1 && (
        <div className="space-y-5">
          {/* Mode switcher */}
          <div className="bg-[#0D1117] border border-gray-800 rounded-2xl p-2 grid grid-cols-2 md:grid-cols-4 gap-1">
            {MODE_CARDS.map((m) => (
              <button key={m.id} onClick={() => setRMode(m.id)}
                className={`px-3 py-3 rounded-xl text-center border transition-all ${rMode === m.id ? 'text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                style={rMode === m.id ? { borderColor: accent, backgroundColor: `${accent}14` } : {}}>
                <div className="text-base mb-0.5">{m.icon}</div>
                <div className="text-xs font-bold">{m.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{m.sub}</div>
              </button>
            ))}
          </div>

          {/* Fixture picker */}
          <div className="bg-[#0D1117] border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-1">Which away fixture?</h3>
            <p className="text-[11px] text-gray-500 mb-3">Pick one to prefill the venue — or just type a destination below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {awayFixtures.map((f) => (
                <button key={f.id} onClick={() => pickFixture(f)}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs border ${fixtureId === f.id ? 'text-white' : 'border-gray-800 text-gray-400 hover:text-white'}`}
                  style={fixtureId === f.id ? { borderColor: accent, backgroundColor: `${accent}14` } : {}}>
                  <div className="font-semibold">{f.opponent}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{f.date} · {f.venue} · {f.distanceMiles}mi</div>
                </button>
              ))}
            </div>
          </div>

          {/* Route & details */}
          <div className="bg-[#0D1117] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Route &amp; details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From"><input value={from} disabled className="inp opacity-60" /></Field>
              <Field label="To (venue)"><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Riverbank Arena" className="inp" /></Field>
              <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="inp" /></Field>
              <Field label="Party (squad + staff)">
                <div className="flex gap-2">
                  <input type="number" value={squad} onChange={(e) => setSquad(+e.target.value || 0)} className="inp" />
                  <input type="number" value={staff} onChange={(e) => setStaff(+e.target.value || 0)} className="inp" />
                </div>
              </Field>
            </div>
            {includeHotel && (
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setOvernight(!overnight)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${overnight ? 'text-white' : 'border-gray-800 text-gray-400'}`}
                  style={overnight ? { borderColor: accent, backgroundColor: `${accent}14` } : {}}>
                  <span>{overnight ? '✓' : '○'}</span> Overnight stay
                </button>
                {overnight && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    nights <input type="number" min={1} value={nights} onChange={(e) => setNights(Math.max(1, +e.target.value || 1))} className="w-16 inp" />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="bg-[#0D1117] border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Preferences</h3>
            {includeCoach && (
              <Pref title="Coach">
                <Toggle on={coachExec} set={setCoachExec} label="Executive coach" accent={accent} />
                <Toggle on={kitHold} set={setKitHold} label="Kit hold space" accent={accent} />
              </Pref>
            )}
            {includeHotel && (
              <Pref title="Hotel">
                <Toggle on={hotelNearVenue} set={setHotelNearVenue} label="Near venue" accent={accent} />
                <Toggle on={hotelBreakfast} set={setHotelBreakfast} label="Breakfast" accent={accent} />
                <div className="flex gap-1">
                  {(['budget', 'mid', 'luxe'] as const).map((t) => (
                    <button key={t} onClick={() => setBudgetTier(t)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] border capitalize ${budgetTier === t ? 'text-white' : 'border-gray-800 text-gray-500'}`}
                      style={budgetTier === t ? { borderColor: accent, backgroundColor: `${accent}14` } : {}}>{t}</button>
                  ))}
                </div>
              </Pref>
            )}
            {includeMeals && (
              <Pref title="Meals">
                <Toggle on={mealPreMatch} set={setMealPreMatch} label="Pre-match meal" accent={accent} />
                <input value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Dietary notes (e.g. 3 veggie, 1 GF)" className="inp flex-1 min-w-[180px]" />
              </Pref>
            )}
          </div>

          <button onClick={runSearch} disabled={!canSearch}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-40 inline-flex items-center justify-center gap-2"
            style={{ background: canSearch ? accent : '#374151' }}>
            <Search className="w-4 h-4" /> Research {rMode === 'full' ? 'the whole away day' : rMode} →
          </button>
        </div>
      )}

      {step === 2 && searching && (
        <div className="bg-[#0D1117] border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-6 animate-bounce">🤖</div>
          <h3 className="text-lg font-bold text-white mb-2">Researching…</h3>
          <p className="text-sm mb-1" style={{ color: accent }}>{phase}</p>
          <p className="text-[11px] text-gray-600 mt-3">Comparing operators, hotels and caterers near {to || 'the venue'}.</p>
        </div>
      )}

      {step === 3 && r && (
        <div className="space-y-5">
          {recommendation && (
            <div className="rounded-xl p-4 flex items-start gap-3 border" style={{ borderColor: `${accent}40`, backgroundColor: `${accent}10` }}>
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: accent }}>Lumio recommendation</div>
                <p className="text-xs text-gray-300">{recommendation}</p>
              </div>
            </div>
          )}

          {/* Discovery callout */}
          {(discoveredHotels > 0 || discoveredMeals > 0) && (
            <div className="rounded-xl p-3 flex items-start gap-2 border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200/90">
              <Search className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Some of these aren&rsquo;t in your suppliers yet — Lumio found them near {to || 'the venue'}. New to a division with no hotels or caterers saved? The agent finds the best, cheapest options for you. Tap <strong>Save</strong> to add one to your suppliers.
              </span>
            </div>
          )}

          {includeCoach && (
            <Section title="Coach" icon={<Bus className="w-4 h-4" style={{ color: accent }} />}>
              {r.coaches.map((c, i) => (
                <CoachCard key={c.id} c={c} top={i === 0} selected={selCoach === c.id} accent={accent}
                  saved={!!saved[c.id]} onSave={() => setSaved((s) => ({ ...s, [c.id]: true }))}
                  onClick={() => setSelCoach(selCoach === c.id ? null : c.id)} />
              ))}
            </Section>
          )}

          {includeHotel && (
            <Section title="Hotel" icon={<BedDouble className="w-4 h-4" style={{ color: accent }} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {r.hotels.map((h, i) => (
                  <HotelCard key={h.id} h={h} top={i === 0} selected={selHotel === h.id} accent={accent}
                    saved={!!saved[h.id]} onSave={() => setSaved((s) => ({ ...s, [h.id]: true }))}
                    onClick={() => setSelHotel(selHotel === h.id ? null : h.id)} />
                ))}
              </div>
            </Section>
          )}

          {includeMeals && (
            <Section title="Meals" icon={<Utensils className="w-4 h-4" style={{ color: accent }} />}>
              {r.meals.map((m, i) => (
                <MealCard key={m.id} m={m} top={i === 0} selected={selMeal === m.id} accent={accent}
                  saved={!!saved[m.id]} onSave={() => setSaved((s) => ({ ...s, [m.id]: true }))}
                  onClick={() => setSelMeal(selMeal === m.id ? null : m.id)} />
              ))}
            </Section>
          )}

          {(coach || hotel || meal) && (
            <div className="bg-[#0D1117] border rounded-xl p-4 flex items-center justify-between" style={{ borderColor: `${accent}40` }}>
              <div>
                <div className="text-xs font-bold text-white">Selected</div>
                <div className="text-[11px] text-gray-500">
                  {[coach && `🚌 ${coach.operator}`, overnight && hotel && `🏨 ${hotel.name}`, meal && `🍽️ ${meal.name}`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="text-2xl font-black text-white">{gbp(total)}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={genEmail} disabled={!coach && !hotel && !meal}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 inline-flex items-center justify-center gap-2"
              style={{ background: (!coach && !hotel && !meal) ? '#374151' : accent }}>
              <Mail className="w-4 h-4" /> Draft booking enquiry →
            </button>
            <button onClick={() => { setStep(1); setResults(null) }} className="px-4 py-3 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white">↺ New</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div className="bg-[#0D1117] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white inline-flex items-center gap-2"><Mail className="w-4 h-4" /> Booking enquiry</h3>
              <span className="text-[10px] rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">{mode === 'demo' ? 'canned demo draft' : 'AI draft'}</span>
            </div>
            <textarea value={email} onChange={(e) => setEmail(e.target.value)} rows={16}
              className="w-full bg-[#0D1117] border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-200 font-mono resize-none outline-none focus:border-pink-600/60" />
            <p className="mt-2 text-[11px] text-gray-600">Lumio never books directly — this sends the enquiry you approve. The supplier confirms; you stay in control.</p>
          </div>
          {sent ? (
            <div className="rounded-xl border border-green-600/30 bg-green-600/10 p-4 text-center text-sm text-green-200">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1" /> {sent}
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={send} className="flex-1 py-4 rounded-xl text-sm font-bold text-white inline-flex items-center justify-center gap-2" style={{ background: accent }}>
                <Mail className="w-4 h-4" /> {mode === 'demo' ? 'Send enquiry (simulated)' : 'Send enquiry'}
              </button>
              <button onClick={() => navigator.clipboard?.writeText(email)} className="px-4 py-4 rounded-xl text-xs border border-gray-700 text-gray-400 hover:text-white">Copy</button>
            </div>
          )}
          <button onClick={() => { setStep(1); setResults(null); setSent(null); setEmail('') }} className="text-xs text-gray-600 hover:text-gray-400 block mx-auto">← New search</button>
        </div>
      )}

      <style jsx>{`
        .inp { width: 100%; background: #0b0f14; border: 1px solid #374151; border-radius: 0.6rem; padding: 0.5rem 0.7rem; font-size: 0.8rem; color: #fff; outline: none; }
        .inp:focus { border-color: ${accent}99; }
      `}</style>
    </div>
  )
}

// ─── Building blocks ──────────────────────────────────────────────────────
function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

function Stepper({ step, accent }: { step: Step; accent: string }) {
  const steps = [{ n: 1, l: 'Configure' }, { n: 2, l: 'Research' }, { n: 3, l: 'Results' }, { n: 4, l: 'Book' }]
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: step === s.n ? accent : step > s.n ? '#22C55E' : '#1F2937', color: step >= s.n ? '#fff' : '#6B7280' }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className="text-[10px]" style={{ color: step === s.n ? accent : '#6B7280' }}>{s.l}</span>
          </div>
          {i < 3 && <div className="h-px w-10 mb-4" style={{ background: step > s.n ? '#22C55E' : '#1F2937' }} />}
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function Pref({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase mb-2">{title}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function Toggle({ on, set, label, accent }: { on: boolean; set: (v: boolean) => void; label: string; accent: string }) {
  return (
    <button onClick={() => set(!on)}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${on ? 'text-white' : 'border-gray-800 text-gray-500'}`}
      style={on ? { borderColor: accent, backgroundColor: `${accent}14` } : {}}>
      <span>{on ? '✓' : '○'}</span>{label}
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-3 inline-flex items-center gap-2">{icon}{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ScoreBadge({ s }: { s: number }) {
  const c = s >= 90 ? '#22C55E' : s >= 80 ? '#BE185D' : s >= 70 ? '#F59E0B' : '#6B7280'
  return <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: `${c}22`, color: c }}>{s} Lumio</span>
}

function Badge({ text }: { text: string }) {
  return <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 font-bold">{text}</span>
}

function SaveChip({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return saved ? (
    <span className="text-[9px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-green-400"><Check className="w-3 h-3" />Saved</span>
  ) : (
    <button onClick={(e) => { e.stopPropagation(); onSave() }} className="text-[9px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-white">
      <Plus className="w-3 h-3" />Save supplier
    </button>
  )
}

function Radio({ on, accent }: { on: boolean; accent: string }) {
  return <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: on ? accent : '#4B5563', background: on ? accent : 'transparent' }} />
}

function Discovered() {
  return <span className="text-[9px] inline-flex items-center gap-1 text-amber-400">✨ Found for you</span>
}

function CoachCard({ c, top, selected, accent, saved, onSave, onClick }: {
  c: CoachQuote; top: boolean; selected: boolean; accent: string; saved: boolean; onSave: () => void; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border p-4 ${selected ? '' : 'border-gray-800 bg-[#0D1117] hover:border-gray-700'}`}
      style={selected ? { borderColor: accent, backgroundColor: `${accent}10` } : {}}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Radio on={selected} accent={accent} />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{c.operator}</div>
            <div className="text-[10px] text-gray-500">{c.vehicle} · {c.etaNote}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge s={c.score} />
          <div className="text-sm font-black text-white">{gbp(c.priceReturn)}</div>
        </div>
      </div>
      <div className="mt-2 ml-7 flex items-center gap-2 flex-wrap">
        {top && <Badge text="Best" />}
        {c.badge && <Badge text={c.badge} />}
        {!c.savedSupplierId ? <Discovered /> : <span className="text-[9px] text-gray-600">in your suppliers</span>}
        {!c.savedSupplierId && <SaveChip saved={saved} onSave={onSave} />}
      </div>
    </button>
  )
}

function HotelCard({ h, top, selected, accent, saved, onSave, onClick }: {
  h: HotelQuote; top: boolean; selected: boolean; accent: string; saved: boolean; onSave: () => void; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`text-left rounded-xl border p-4 ${selected ? '' : 'border-gray-800 bg-[#0D1117] hover:border-gray-700'}`}
      style={selected ? { borderColor: accent, backgroundColor: `${accent}10` } : {}}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Radio on={selected} accent={accent} />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{h.name}</div>
            <div className="text-[10px] text-gray-500">{h.stars > 0 ? '★'.repeat(h.stars) : 'B&B'} · {h.area}</div>
          </div>
        </div>
        <ScoreBadge s={h.score} />
      </div>
      <div className="text-[10px] text-gray-500 ml-6 mb-1 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{h.distanceToVenue} · <Star className="w-3 h-3" />{h.rating}</div>
      <div className="flex flex-wrap gap-1 ml-6 mb-2">
        {h.amenities.map((a, j) => <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{a}</span>)}
      </div>
      <div className="flex justify-between items-center ml-6">
        <span className="text-[10px] text-gray-500">{gbp(h.pricePerNight)}/room/night</span>
        <span className="text-sm font-black text-white">{gbp(h.totalPrice)}</span>
      </div>
      <div className="mt-2 ml-6 flex items-center gap-2 flex-wrap">
        {top && <Badge text="Best" />}
        {h.badge && <Badge text={h.badge} />}
        {!h.savedSupplierId ? <Discovered /> : <span className="text-[9px] text-gray-600">in your suppliers</span>}
        {!h.savedSupplierId && <SaveChip saved={saved} onSave={onSave} />}
      </div>
    </button>
  )
}

function MealCard({ m, top, selected, accent, saved, onSave, onClick }: {
  m: MealQuote; top: boolean; selected: boolean; accent: string; saved: boolean; onSave: () => void; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border p-4 ${selected ? '' : 'border-gray-800 bg-[#0D1117] hover:border-gray-700'}`}
      style={selected ? { borderColor: accent, backgroundColor: `${accent}10` } : {}}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Radio on={selected} accent={accent} />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{m.name}</div>
            <div className="text-[10px] text-gray-500">{m.kind} · {m.note}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge s={m.score} />
          <div className="text-sm font-black text-white">{gbp(m.total)}</div>
        </div>
      </div>
      <div className="mt-2 ml-7 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-500">{gbp(m.perHead)}/head</span>
        {top && <Badge text="Best" />}
        {m.badge && <Badge text={m.badge} />}
        {!m.savedSupplierId ? <Discovered /> : <span className="text-[9px] text-gray-600">in your suppliers</span>}
        {!m.savedSupplierId && <SaveChip saved={saved} onSave={onSave} />}
      </div>
    </button>
  )
}

function buildNarrative(r: ResearchResults | null, overnight: boolean, total: number): string {
  if (!r) return ''
  const c = r.coaches[0], h = r.hotels[0], m = r.meals[0]
  const parts: string[] = []
  if (c) parts.push(`${c.operator} (${gbp(c.priceReturn)}) is the best-value coach`)
  if (overnight && h) parts.push(`${h.name} at ${gbp(h.pricePerNight)}/night is closest on price + distance`)
  if (m) parts.push(`${m.name} covers the squad meal`)
  if (!parts.length) return ''
  return `${parts.join('; ')}. Estimated all-in: ${gbp(total || ((c?.priceReturn ?? 0) + (overnight ? (h?.totalPrice ?? 0) : 0) + (m?.total ?? 0)))}. Pick one of each, then I'll draft the enquiry.`
}


