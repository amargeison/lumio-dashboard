'use client'

import { useEffect, useState } from 'react'

// Shared "Pre-Season Camp Mode" Activate gate.
//
// Wraps a sport portal's existing static Pre-Season content (friendlies,
// fitness baseline, periodisation, week plan, etc.) with a two-state
// shell:
//   - inactive → centred empty-state card with "Activate Pre-Season →"
//                CTA. Activate opens a modal capturing opener date,
//                opposition, squad size and formation. State is
//                persisted to localStorage[storageKey].
//   - active   → small banner ("Pre-Season Active · Opening Fixture
//                vs <opp> · N days to go · <phase>") above the existing
//                children. Deactivate button clears the camp.
//
// Intentionally lean — no AI calls, no readiness scores, no in-house
// schedule planner. Sports that want the richer flow (e.g. Women's FC,
// Cricket) keep their own bespoke component; this shared gate exists so
// Football Pro / Non-League / future portals can adopt the same activate
// pattern without duplicating ~250 lines of state machinery each.

type Camp = {
  opener: string
  opposition: string
  squad: number
  formation: string
}

type Props = {
  accent: string
  storageKey: string
  sportEmoji?: string
  sportLabel?: string
  defaultSquad?: string
  defaultFormation?: string
  formationOptions?: string[]
  children?: React.ReactNode
}

const DEFAULT_FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']

export default function PreSeasonActivateGate({
  accent,
  storageKey,
  sportEmoji = '⚽',
  sportLabel = 'pre-season',
  defaultSquad = '22',
  defaultFormation = '4-3-3',
  formationOptions = DEFAULT_FORMATIONS,
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

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      if (raw) setCamp(JSON.parse(raw))
    } catch { /* localStorage unavailable */ }
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
    try { localStorage.removeItem(storageKey) } catch {}
  }

  const daysTo = camp
    ? Math.max(0, Math.ceil((new Date(camp.opener).getTime() - Date.now()) / 86400000))
    : 0
  // Phase derives from days-to-opener over a 30-day window. Mirrors the
  // Women's FC / cricket implementations so phases line up across sports.
  const totalDays = camp ? Math.max(1, daysTo + 30) : 30
  const pctRemaining = camp ? daysTo / totalDays : 1
  const phase = pctRemaining > 0.66
    ? 'Fitness Block'
    : pctRemaining > 0.33 ? 'Tactical Block' : 'Match Sharpness'
  const phaseColor = pctRemaining > 0.66
    ? '#3B82F6'
    : pctRemaining > 0.33 ? '#F59E0B' : '#22C55E'

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
          <p className="text-lg mb-2" style={{ color: accent }}>
            Build the base. Set the shape. Hit the ground running.
          </p>
          <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: '#9CA3AF' }}>
            Activate {sportLabel} and Lumio tracks every session, fitness test,
            squad readiness and tactical shape — all the way to your opening
            fixture.
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

  // ── Active — banner + existing children ──
  return (
    <div className="space-y-6">
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

      {children}
    </div>
  )
}
