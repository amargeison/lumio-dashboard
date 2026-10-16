'use client'

// Settings → Pricing & packages → Cancellations & saved cards.
//
// What a client agrees to when they save their card, and what Lumio may do
// with it. Every change saves straight away, like the rest of Settings; the
// words a client reads are built from these choices (policyTerms), and the
// preview here is exactly that text.
//
// A client who has ALREADY saved a card agreed to the words as they were then
// — a copy is kept with their card. Changing the policy here changes what new
// clients agree to; the note under the preview says so.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachSettings } from '../_lib/use-settings'
import { setSettings } from '../_lib/settings-store'
import { readPolicy, policyTerms, type CancelPolicy } from '@/lib/coach/cancel-policy'

export function CancelPolicyEditor({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const p = readPolicy(s.cancelPolicy)
  const [preview, setPreview] = useState(false)
  const [extra, setExtra] = useState(p.extra)
  const save = (patch: Partial<CancelPolicy>) => setSettings({ cancelPolicy: { ...p, ...patch } })

  const field: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }
  const pctOptions = [[100, 'Charged in full'], [50, 'Half the price'], [0, 'Not charged']] as const

  const Switch = ({ on, onChange, title, desc, id }: { on: boolean; onChange: (v: boolean) => void; title: string; desc: string; id: string }) => (
    <label htmlFor={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : T.panel2, borderRadius: 10, cursor: 'pointer' }}>
      <input id={id} type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: accent.hex }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.text }}>{title}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: T.text3, lineHeight: 1.5, marginTop: 2 }}>{desc}</span>
      </span>
    </label>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: FONT }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Cancellations &amp; saved cards</div>
      <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>
        Clients agree to this when they save a card with you (the “Card on file” button on a player). Lumio then applies it, so a late cancellation is not a conversation you have to have.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        <label><span style={lbl}>Free to cancel up to</span>
          <select value={p.hours} onChange={e => save({ hours: Number(e.target.value) })} style={field}>
            {[[0, 'The start time'], [12, '12 hours before'], [24, '24 hours before'], [48, '48 hours before'], [72, '72 hours before']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            {![0, 12, 24, 48, 72].includes(p.hours) && <option value={p.hours}>{p.hours} hours before</option>}
          </select>
        </label>
        <label><span style={lbl}>Cancelled later than that</span>
          <select value={p.lateChargePct} disabled={p.hours === 0} onChange={e => save({ lateChargePct: Number(e.target.value) })} style={field}>
            {pctOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            {![0, 50, 100].includes(p.lateChargePct) && <option value={p.lateChargePct}>{p.lateChargePct}% of the price</option>}
          </select>
        </label>
        <label><span style={lbl}>Missed without notice</span>
          <select value={p.noShowPct} onChange={e => save({ noShowPct: Number(e.target.value) })} style={field}>
            {pctOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            {![0, 50, 100].includes(p.noShowPct) && <option value={p.noShowPct}>{p.noShowPct}% of the price</option>}
          </select>
        </label>
        <label><span style={lbl}>You cancel (rain, illness)</span>
          <select value={p.rainOff} onChange={e => save({ rainOff: e.target.value === 'credit' ? 'credit' : 'refund' })} style={field}>
            <option value="refund">They get their money back</option>
            <option value="credit">They get a credit</option>
          </select>
        </label>
      </div>

      <Switch id="pol-auto" on={p.autoCharge} onChange={v => save({ autoCharge: v })}
        title={`Take payment when the ${p.hours || 24}-hour window closes`}
        desc={`Lessons for one player with a card on file are charged automatically ${p.hours ? `${p.hours} hours` : 'just'} before they start, at the price shown on the calendar. Lessons for a group, or with no price, are left for you. Off: nothing is charged until you press Charge.`} />
      <Switch id="pol-dd" on={p.directDebit} onChange={v => save({ directDebit: v })}
        title="Offer Direct Debit as well as a card"
        desc="Switch on Bacs Direct Debit in your own Stripe dashboard first (Settings → Payment methods). Stripe charges 1%, capped at £4, and the money takes about three working days. Until Bacs is on there, clients only see the card option." />

      <label><span style={lbl}>Anything else (optional)</span>
        <textarea value={extra} maxLength={600} rows={2} placeholder="e.g. Group places are paid when you confirm you are coming."
          onChange={e => setExtra(e.target.value)} onBlur={() => { if (extra !== p.extra) save({ extra }) }} style={{ ...field, resize: 'vertical' }} />
      </label>

      <button onClick={() => setPreview(v => !v)} aria-expanded={preview}
        style={{ alignSelf: 'flex-start', appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '0 12px', minHeight: 36, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
        {preview ? 'Hide what clients read' : 'See what clients read'}
      </button>
      {preview && (
        <div data-testid="policy-preview" style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {policyTerms({ ...p, extra }, s.academy || 'Your academy').map(t => (
              <li key={t.title} style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}><strong style={{ color: T.text }}>{t.title}.</strong> {t.text}</li>
            ))}
          </ol>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>
            Clients who have already saved a card agreed to the policy as it was then, and a copy is kept with their card. Late-cancellation charges need to be clear and reasonable to be fair under UK consumer law; this wording aims for that, but it is not legal advice.
          </div>
        </div>
      )}
    </div>
  )
}
