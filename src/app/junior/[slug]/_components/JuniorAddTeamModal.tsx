'use client'

// JuniorAddTeamModal — single-step form for adding a new team to Squad
// Management. Demo-state only: appends to the local `teams` state in
// JuniorSquadManagement, vanishes on refresh.
//
// Age band field allows duplicates with the existing TEAMS list (real
// grassroots clubs do split U11 A/B etc). Team name field defaults to
// `{ageBand} ` and lets the user complete it — typing in age band U11
// prefills the name to "U11 ".

import { useState } from 'react'
import JuniorModal from './JuniorModal'
import { JUNIOR_COACHES, JUNIOR_AGE_BANDS, type JuniorAgeBand } from '../_lib/junior-club-data'

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderHi:   '#374151',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:      '#16A34A',
  accentDeep:  '#15803D',
  accentLight: '#22C55E',
  accentDim:   'rgba(22,163,74,0.15)',
  accentBorder:'rgba(22,163,74,0.5)',
  warn:       '#F59E0B',
} as const

const TO_BE_ASSIGNED = 'To be assigned'

interface Props {
  existingAgeBands: string[]
  onClose: () => void
  onSubmit: (team: { name: string; ageBand: string; coach: string; manager: string; capacity: number }) => void
}

export default function JuniorAddTeamModal({ existingAgeBands, onClose, onSubmit }: Props) {
  const [ageBand, setAgeBand] = useState<JuniorAgeBand | ''>('')
  const [teamName, setTeamName] = useState('')
  const [teamNameDirty, setTeamNameDirty] = useState(false)
  const [coach, setCoach] = useState(TO_BE_ASSIGNED)
  const [manager, setManager] = useState(TO_BE_ASSIGNED)
  const [capacity, setCapacity] = useState(14)

  // Build alphabetised, deduplicated coach list for the dropdowns.
  const coachNames = [TO_BE_ASSIGNED, ...Array.from(new Set(JUNIOR_COACHES.map(c => c.name))).sort()]

  const selectAgeBand = (b: JuniorAgeBand) => {
    setAgeBand(b)
    // Prefill team-name prefix only if user hasn't typed yet — don't
    // overwrite their input on subsequent band changes.
    if (!teamNameDirty) {
      setTeamName(`${b} `)
    }
  }

  const trimmedName = teamName.trim()
  const canSubmit = !!ageBand && trimmedName.length > 0
  const duplicateBand = !!ageBand && existingAgeBands.includes(ageBand)

  const handleSubmit = () => {
    if (!canSubmit || !ageBand) return
    onSubmit({
      name: trimmedName,
      ageBand,
      coach,
      manager,
      capacity,
    })
    onClose()
  }

  return (
    <JuniorModal icon="➕" title="Add team" subtitle="Squad Management · demo" onClose={onClose}>
      <div className="px-6 py-5 space-y-5">
        {/* Age band */}
        <Field label="Age band">
          <div className="flex flex-wrap gap-1.5">
            {JUNIOR_AGE_BANDS.map(({ band }) => {
              const selected = ageBand === band
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => selectAgeBand(band)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: selected ? C.accentDim : 'transparent',
                    border: `1px solid ${selected ? C.accent : C.border}`,
                    color: selected ? C.accentLight : C.text3,
                  }}
                >
                  {band}
                </button>
              )
            })}
          </div>
          {duplicateBand && (
            <p className="text-[11px] mt-2" style={{ color: C.warn }}>
              ⚠️ {ageBand} already has a team — this will be added as a second {ageBand} squad.
            </p>
          )}
        </Field>

        {/* Team name */}
        <Field label="Team name">
          <input
            value={teamName}
            onChange={e => {
              setTeamName(e.target.value)
              setTeamNameDirty(true)
            }}
            placeholder={ageBand ? `${ageBand} Lions` : 'e.g. U11 Lions'}
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
          />
        </Field>

        {/* Head coach */}
        <Field label="Head coach">
          <select
            value={coach}
            onChange={e => setCoach(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
          >
            {coachNames.map(n => <option key={n}>{n}</option>)}
          </select>
        </Field>

        {/* Team manager */}
        <Field label="Team manager">
          <select
            value={manager}
            onChange={e => setManager(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
          >
            {coachNames.map(n => <option key={n}>{n}</option>)}
          </select>
        </Field>

        {/* Capacity */}
        <Field label="Squad capacity">
          <input
            type="number"
            min={8}
            max={22}
            value={capacity}
            onChange={e => setCapacity(Math.max(8, Math.min(22, parseInt(e.target.value || '14', 10))))}
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
          />
          <p className="text-[11px] mt-1" style={{ color: C.text4 }}>
            8–22 players. Junior typical: 14 for 9v9, 16 for 11v11.
          </p>
        </Field>

        {/* Footer actions */}
        <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold mt-3"
            style={{ backgroundColor: C.border, color: C.text3 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold mt-3"
            style={{
              backgroundColor: canSubmit ? C.accentDeep : C.border,
              color: '#fff',
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            Add team
          </button>
        </div>
      </div>
    </JuniorModal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text2 }}>{label}</label>
      {children}
    </div>
  )
}
