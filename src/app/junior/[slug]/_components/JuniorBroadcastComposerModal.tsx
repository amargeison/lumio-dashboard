'use client'

// JuniorBroadcastComposerModal — staff-only composer for new
// Noticeboard broadcasts. Title, body, audience selector, optional
// age-band picker, pinned toggle. Demo-state only — submit prepends
// a new broadcast to the Noticeboard's local list and vanishes on
// refresh.

import { useState } from 'react'
import JuniorModal from './JuniorModal'
import { JUNIOR_AGE_BANDS, type JuniorAgeBand } from '../_lib/junior-club-data'
import type {
  JuniorBroadcast,
  JuniorBroadcastAudience,
  JuniorBroadcastAuthorRole,
} from '../_lib/junior-noticeboard-data'

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  text:       '#F9FAFB',
  text2:      'rgba(255,255,255,0.85)',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentLight:'#22C55E',
  accentDim:  'rgba(22,163,74,0.15)',
  accent55:   'rgba(22,163,74,0.55)',
} as const

interface Props {
  authorName: string
  authorRole: JuniorBroadcastAuthorRole
  onClose: () => void
  onSubmit: (broadcast: JuniorBroadcast) => void
}

export default function JuniorBroadcastComposerModal({
  authorName,
  authorRole,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<JuniorBroadcastAudience>('club_wide')
  const [ageBand, setAgeBand] = useState<JuniorAgeBand>('U7')
  const [pinned, setPinned] = useState(false)

  const titleClean = title.trim()
  const bodyClean = body.trim()
  const canSubmit = titleClean.length >= 4 && bodyClean.length >= 8

  function handleSubmit() {
    if (!canSubmit) return
    const broadcast: JuniorBroadcast = {
      id: `b-local-${Date.now()}`,
      author: { name: authorName, role: authorRole },
      timestamp: new Date().toISOString(),
      title: titleClean,
      body: bodyClean,
      pinned,
      audience,
      ageBand: audience === 'age_band' ? ageBand : undefined,
      reactions: [],
    }
    onSubmit(broadcast)
  }

  return (
    <JuniorModal
      icon="📢"
      title="New broadcast"
      subtitle="Posts to the Noticeboard"
      widthPx={580}
      onClose={onClose}
    >
      <div className="px-6 py-5 space-y-5">
        {/* Title */}
        <Field label="Title" hint="Short and scannable. Min 4 characters.">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Pitch closed Saturday — frost"
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: C.panelAlt,
              border: `1px solid ${C.border}`,
              color: C.text,
            }}
          />
        </Field>

        {/* Body */}
        <Field label="Message" hint="Min 8 characters. Plain text.">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write the broadcast body here…"
            rows={5}
            maxLength={1200}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors"
            style={{
              backgroundColor: C.panelAlt,
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: 'inherit',
            }}
          />
          <div className="text-[10px] mt-1 text-right" style={{ color: C.text4 }}>
            {body.length} / 1200
          </div>
        </Field>

        {/* Audience */}
        <Field label="Audience">
          <div className="flex gap-2 flex-wrap">
            <AudienceChip
              id="club_wide" label="Club-wide" icon="🏟️"
              current={audience} onClick={setAudience}
            />
            <AudienceChip
              id="staff_only" label="Staff only" icon="🔒"
              current={audience} onClick={setAudience}
            />
            <AudienceChip
              id="age_band" label="Specific age band" icon="🎯"
              current={audience} onClick={setAudience}
            />
          </div>
        </Field>

        {/* Age band picker — conditional */}
        {audience === 'age_band' && (
          <Field label="Age band">
            <select
              value={ageBand}
              onChange={e => setAgeBand(e.target.value as JuniorAgeBand)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: C.panelAlt,
                border: `1px solid ${C.border}`,
                color: C.text,
              }}
            >
              {JUNIOR_AGE_BANDS.map(({ band, teamName }) => (
                <option key={band} value={band}>
                  {band} — {teamName}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Pinned toggle */}
        <label
          className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5"
          style={{
            backgroundColor: pinned ? C.accentDim : C.panelAlt,
            border: `1px solid ${pinned ? C.accent55 : C.border}`,
            transition: 'all 0.15s',
          }}
        >
          <input
            type="checkbox"
            checked={pinned}
            onChange={e => setPinned(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm" style={{ color: pinned ? C.accentLight : C.text2 }}>
            📌 Pin to top of Noticeboard
          </span>
        </label>
      </div>

      {/* Footer actions */}
      <div
        className="flex items-center justify-end gap-2 px-6 py-4 shrink-0"
        style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.panelAlt }}
      >
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ color: C.text3, backgroundColor: 'transparent' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            color: canSubmit ? '#0A0E13' : C.text4,
            backgroundColor: canSubmit ? C.accentLight : C.panel,
            border: `1px solid ${canSubmit ? C.accent55 : C.border}`,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          Post broadcast
        </button>
      </div>
    </JuniorModal>
  )
}

// ─── Field wrapper ───────────────────────────────────────────────────

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label
          className="text-[10px] font-semibold"
          style={{
            color: C.text3,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px]" style={{ color: C.text4 }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Audience chip ───────────────────────────────────────────────────

function AudienceChip({
  id, label, icon, current, onClick,
}: {
  id: JuniorBroadcastAudience
  label: string
  icon: string
  current: JuniorBroadcastAudience
  onClick: (id: JuniorBroadcastAudience) => void
}) {
  const active = current === id
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
      style={{
        backgroundColor: active ? C.accentDim : C.panelAlt,
        color: active ? C.accentLight : C.text3,
        border: `1px solid ${active ? C.accent55 : C.border}`,
      }}
    >
      <span className="mr-1.5">{icon}</span>{label}
    </button>
  )
}
