'use client'

// JuniorAddPlayerModal — single-step form for adding a new player to
// the active team. Demo-state only: appends to that team's players[]
// array in JuniorSquadManagement's local state, vanishes on refresh.
//
// FA Charter Standard compliance section (Photography / Medical /
// Travel consents) collapsed by default. Realistic registration flow
// with progressive disclosure — basic fields visible up top, consent
// section opens on click.
//
// Photo upload is stubbed — placeholder circle with initials. No
// <input type="file"> wiring in this pass (deferred to a later sprint
// when we have asset storage).

import { useState } from 'react'
import JuniorModal from './JuniorModal'

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
  bad:        '#EF4444',
} as const

type Position = 'GK' | 'DEF' | 'MID' | 'FWD'

// Mirror the SquadPlayer shape from JuniorSquadManagement.tsx so the
// onSubmit consumer can append directly. Imported as a type from the
// consumer would create a cycle — duplicating the shape here is the
// cleanest path and the shape is small.
export type AddedPlayer = {
  shirt: number | null
  name: string
  position: string
  availability: 'available' | 'doubt' | 'out' | 'unavailable'
  attendancePct: number
  faRegistered: boolean
  restricted?: boolean
  note?: string
}

interface Props {
  /** Name of the team the player is being added to — shown in the modal
   *  subtitle so the user sees which team they're modifying. */
  teamName: string
  onClose: () => void
  onSubmit: (player: AddedPlayer) => void
}

const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD']

function initialsOf(first: string, last: string): string {
  const f = first.trim()
  const l = last.trim()
  if (!f && !l) return '??'
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase()
  return (f || l).slice(0, 2).toUpperCase()
}

export default function JuniorAddPlayerModal({ teamName, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState<Position>('MID')
  const [kitNumber, setKitNumber] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  const [consentOpen, setConsentOpen] = useState(false)
  const [consentPhotography, setConsentPhotography] = useState(false)
  const [consentMedical, setConsentMedical] = useState(false)
  const [consentTravel, setConsentTravel] = useState(false)

  const [showError, setShowError] = useState(false)

  const allConsents = consentPhotography && consentMedical && consentTravel
  const namesOk = firstName.trim().length > 0 && lastName.trim().length > 0
  const parentOk = parentName.trim().length > 0 && parentPhone.trim().length > 0
  const valid = namesOk && parentOk && allConsents

  const handleSubmit = () => {
    if (!valid) {
      setShowError(true)
      // Auto-open consent section if that's what's missing so the
      // user can see why the submit was blocked.
      if (!allConsents) setConsentOpen(true)
      return
    }
    const parsedKit = parseInt(kitNumber, 10)
    onSubmit({
      shirt: Number.isFinite(parsedKit) ? parsedKit : null,
      name: `${firstName.trim()} ${lastName.trim()}`,
      position,
      availability: 'available',
      attendancePct: 0,
      faRegistered: false,
      restricted: false,
      note: 'New registration — FA paperwork pending',
    })
    onClose()
  }

  return (
    <JuniorModal
      icon="➕"
      title="Add player"
      subtitle={`Add player to ${teamName}`}
      widthPx={620}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-5">
        {/* Top row — photo placeholder + names */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-base font-semibold"
              style={{ backgroundColor: C.accentDim, color: C.accentLight, border: `1px solid ${C.accent}55` }}
            >
              {initialsOf(firstName, lastName)}
            </div>
            <span className="text-[10px]" style={{ color: C.text4 }}>Photo upload coming soon</span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <Field label="First name">
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Theo"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
              />
            </Field>
            <Field label="Last name">
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Renshaw"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Preferred position">
            <select
              value={position}
              onChange={e => setPosition(e.target.value as Position)}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
            >
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Kit number (optional)">
            <input
              type="number"
              min={1}
              max={99}
              value={kitNumber}
              onChange={e => setKitNumber(e.target.value)}
              placeholder="—"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Parent contact name">
            <input
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="e.g. Sarah Bell"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
            />
          </Field>
          <Field label="Parent contact phone">
            <input
              type="tel"
              value={parentPhone}
              onChange={e => setParentPhone(e.target.value)}
              placeholder="07700 000 000"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.borderHi}`, color: C.text }}
            />
          </Field>
        </div>

        {/* Consent disclosure */}
        <div
          className="rounded-xl"
          style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}
        >
          <button
            type="button"
            onClick={() => setConsentOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold" style={{ color: C.text }}>
              {consentOpen ? '▼' : '▶'} Charter Standard consents (3)
            </span>
            <span className="text-[11px]" style={{ color: allConsents ? C.accentLight : C.text4 }}>
              {allConsents ? 'All consents given' : 'Required to register'}
            </span>
          </button>
          {consentOpen && (
            <div className="px-4 pb-4 space-y-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <ConsentRow
                checked={consentPhotography}
                onChange={setConsentPhotography}
                label="Photography & video consent"
                detail="Child may appear in club photos and match highlights."
              />
              <ConsentRow
                checked={consentMedical}
                onChange={setConsentMedical}
                label="Medical consent"
                detail="Parent authorises emergency first aid."
              />
              <ConsentRow
                checked={consentTravel}
                onChange={setConsentTravel}
                label="Travel consent"
                detail="Child may travel to away fixtures with the team."
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex gap-3 mt-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: C.border, color: C.text3 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: valid ? C.accentDeep : C.border, color: '#fff', opacity: valid ? 1 : 0.7 }}
            >
              Add player
            </button>
          </div>
          {showError && !valid && (
            <p className="text-[11px] mt-3 text-center" style={{ color: C.bad }}>
              {!namesOk
                ? 'First and last name are required.'
                : !parentOk
                ? 'Parent contact name and phone are required.'
                : 'All Charter Standard consents required to register a player.'}
            </p>
          )}
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

function ConsentRow({
  checked, onChange, label, detail,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; detail: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer pt-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 shrink-0"
        style={{ accentColor: C.accent }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: C.text }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: C.text3 }}>{detail}</p>
      </div>
    </label>
  )
}
