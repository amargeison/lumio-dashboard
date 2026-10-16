'use client'

// Settings → Pricing & packages → Your prices.
//
// How a coach really charges: a private by how many share it (£65 for one, £35
// each for two…), an adult group at £15 a head, a different price at a venue
// that costs more. Each line is one lesson type, optionally at one venue. The
// calendar prices every booking from these (src/lib/coach/pricing.ts), unless
// the client has their own rate or the booking has a price typed on it.
//
// Saves as it goes, like the rest of Settings: every change that makes a
// complete, valid list is saved; a half-typed price shows what is wrong and the
// last good list stays in place until it is fixed.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachSettings } from '../_lib/use-settings'
import { getSettings, setSettings } from '../_lib/settings-store'
import { useCoachTable } from '../_lib/coach-db'
import { parseAmount } from '@/lib/coach/money'
import { BASIS_LABEL, newRuleId, ruleSummary, type PriceBasis, type PriceRule } from '@/lib/coach/pricing'

type Draft = { id: string; type: string; venueId: string; basis: PriceBasis; amount: string; perHead: string[]; label: string }

const toDraft = (r: PriceRule): Draft => ({
  id: r.id, type: r.type || 'Private', venueId: r.venueId || '', basis: r.basis,
  amount: r.amount ? String(r.amount) : '',
  perHead: [0, 1, 2, 3].map(i => (r.perHead?.[i] ? String(r.perHead[i]) : '')),
  label: r.label || '',
})

/** The list this draft saves as, or the first thing wrong with each line. */
function check(rows: Draft[], venueName: (id: string) => string): { list: PriceRule[] | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const list: PriceRule[] = []
  const seen = new Map<string, string>()
  for (const d of rows) {
    const key = `${d.type.trim().toLowerCase()}|${d.venueId}`
    if (seen.has(key)) {
      errors[d.id] = `There is already a price for ${d.type === 'any' ? 'any lesson' : d.type}${d.venueId ? ` at ${venueName(d.venueId)}` : ' at any venue'}. Change one of them or remove it.`
      continue
    }
    seen.set(key, d.id)
    if (d.basis === 'headcount') {
      const filled = d.perHead.map(x => x.trim())
      if (!filled[0]) { errors[d.id] = 'Enter the price for one player.'; continue }
      // Prices must run 1, 2, 3… with no gaps: a gap would leave a group size unpriced.
      const last = filled.reduce((n, x, i) => (x ? i : n), 0)
      if (filled.slice(0, last + 1).some(x => !x)) { errors[d.id] = 'Fill in each group size up to the largest one you price.'; continue }
      const nums: number[] = []
      let bad = ''
      for (const x of filled.slice(0, last + 1)) { const a = parseAmount(x, { max: 1000 }); if (!a.ok) { bad = a.error; break } nums.push(a.pounds) }
      if (bad) { errors[d.id] = bad; continue }
      list.push({ id: d.id, type: d.type, venueId: d.venueId || null, basis: 'headcount', amount: 0, perHead: nums, ...(d.label.trim() ? { label: d.label.trim() } : {}) })
    } else {
      if (!d.amount.trim()) { errors[d.id] = 'Enter a price.'; continue }
      const a = parseAmount(d.amount, { max: 1000, allowZero: true })
      if (!a.ok) { errors[d.id] = a.error; continue }
      list.push({ id: d.id, type: d.type, venueId: d.venueId || null, basis: d.basis, amount: a.pounds, ...(d.label.trim() ? { label: d.label.trim() } : {}) })
    }
  }
  return { list: Object.keys(errors).length ? null : list, errors }
}

export function PriceListEditor({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const venues = useCoachTable<{ id: string; name: string }>('coach_venues')
  const [rows, setRows] = useState<Draft[]>(() => (getSettings().priceList || []).map(toDraft))
  const [saved, setSaved] = useState('')
  const first = useRef(true)

  const venueName = (id: string) => venues.rows.find(v => v.id === id)?.name || 'a venue no longer listed'
  const { list, errors } = useMemo(() => check(rows, venueName), [rows, venues.rows]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save each complete, valid list. Nothing is written for the first render.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (!list) { setSaved(''); return }
    if (JSON.stringify(list) === JSON.stringify(getSettings().priceList || [])) return
    setSettings({ priceList: list })
    setSaved('Saved')
    const t = setTimeout(() => setSaved(''), 1800)
    return () => clearTimeout(t)
  }, [list])

  const types = Array.from(new Set([...(s.lessonTypes || []), 'Private', 'Group', ...rows.map(r => r.type)].filter(t => t && t !== 'any')))
  const change = (id: string, patch: Partial<Draft>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)))
  const add = () => {
    const used = new Set(rows.filter(r => !r.venueId).map(r => r.type))
    const type = types.find(t => !used.has(t)) || types[0] || 'Private'
    setRows(rs => [...rs, { id: newRuleId(), type, venueId: '', basis: type === 'Private' ? 'hour' : 'person', amount: '', perHead: ['', '', '', ''], label: '' }])
  }

  const field: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Your prices</div>
        <div aria-live="polite" style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>{saved}</div>
      </div>
      <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>
        Each booking is priced from here: a price for one venue beats the same lesson at any venue. A client on their own rate, or a price typed on a booking, comes first.
      </div>

      {rows.length === 0 && (
        <div style={{ fontSize: 12, color: T.text3, padding: '10px 12px', border: `1px dashed ${T.border}`, borderRadius: 9 }}>
          No prices yet{s.privateRate ? `. Privates use your hourly rate above` : ''}. Add one for each kind of lesson you run.
        </div>
      )}

      {rows.map(d => {
        const err = errors[d.id]
        const ok = !err && check([d], venueName).list?.[0]
        return (
          <div key={d.id} style={{ background: T.panel2, border: `1px solid ${err ? T.bad : T.border}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              <label><span style={lbl}>Lesson</span>
                <select value={d.type} onChange={e => change(d.id, { type: e.target.value })} style={field}>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="any">Any lesson</option>
                </select>
              </label>
              <label><span style={lbl}>Venue</span>
                <select value={d.venueId} onChange={e => change(d.id, { venueId: e.target.value })} style={field}>
                  <option value="">Any venue</option>
                  {venues.rows.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  {d.venueId && !venues.rows.some(v => v.id === d.venueId) && <option value={d.venueId}>Venue no longer listed</option>}
                </select>
              </label>
              <label><span style={lbl}>Charged</span>
                <select value={d.basis} onChange={e => change(d.id, { basis: e.target.value as PriceBasis })} style={field}>
                  {(Object.keys(BASIS_LABEL) as PriceBasis[]).map(b => <option key={b} value={b}>{BASIS_LABEL[b]}</option>)}
                </select>
              </label>
            </div>

            {d.basis === 'headcount' ? (
              <div>
                <span style={lbl}>£ each, per hour, when this many play</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                  {d.perHead.map((x, i) => (
                    <label key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 10.5, color: T.text3 }}>{i === 3 ? '4 or more' : i === 0 ? '1 player' : `${i + 1} players`}</span>
                      <input value={x} inputMode="decimal" placeholder={['65', '35', '25', '20'][i]} aria-label={`Price each for ${i === 3 ? '4 or more' : i + 1}`}
                        onChange={e => change(d.id, { perHead: d.perHead.map((y, j) => (j === i ? e.target.value : y)) })} style={field} />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <label style={{ maxWidth: 200 }}><span style={lbl}>£ {d.basis === 'hour' ? 'an hour' : d.basis === 'person' ? 'each' : 'a session'}</span>
                <input value={d.amount} inputMode="decimal" placeholder={d.basis === 'person' ? '15' : '38'} onChange={e => change(d.id, { amount: e.target.value })} style={field} />
              </label>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: 160 }}><span style={lbl}>Name (optional)</span>
                <input value={d.label} maxLength={40} placeholder="e.g. Private group, Adult group" onChange={e => change(d.id, { label: e.target.value })} style={field} />
              </label>
              <button onClick={() => setRows(rs => rs.filter(r => r.id !== d.id))} aria-label={`Remove the ${d.type} price`}
                style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.bad, borderRadius: 8, padding: '0 12px', minHeight: 36, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Remove</button>
            </div>
            <div role={err ? 'alert' : undefined} style={{ fontSize: 11.5, color: err ? T.bad : T.text2 }}>{err || (ok ? ruleSummary(ok) : '')}</div>
          </div>
        )
      })}

      <button onClick={add} style={{ alignSelf: 'flex-start', appearance: 'none', border: `1px dashed ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add a price</button>
    </div>
  )
}
