'use client'

// The camp countdown, from the coach's side.
//
// Six emails go out between someone signing up and getting home again, written
// by Lumio Coach from the camp record and sent automatically. This tab is where
// a coach sees what has gone, what is coming, and takes control of either — by
// pausing the whole sequence, skipping one email, or telling Lumio Coach
// something extra to put in one.
//
// It deliberately shows what has ALREADY been sent as prominently as what is
// due. Automation a coach cannot see is automation a coach does not trust.

import { useMemo, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { STAGES, dueLabel, dueAt, type StageId } from '@/lib/coach/camp-lifecycle'

type EmailLog = {
  id: string; camp_id?: string | null; attendee_id?: string | null
  stage: string; status: string; error?: string | null; subject?: string | null; sent_at?: string | null
}
type Override = { skip?: boolean; note?: string }

export function CampEmails({
  T, accent, camp, attendees, onSave,
}: {
  T: ThemeTokens; accent: AccentTokens
  camp: {
    id: string; name: string; start_date?: string | null
    emails_paused?: boolean | null; overseas?: boolean | null
    balance_link?: string | null; email_overrides?: Record<string, Override> | null
  }
  attendees: { id: string; player_name: string }[]
  onSave: (v: Record<string, any>) => Promise<void>
}) {
  const logs = useCoachTable<EmailLog>('coach_camp_emails')
  const [open, setOpen] = useState<StageId | null>(null)
  const [link, setLink] = useState(camp.balance_link || '')
  const [linkSaved, setLinkSaved] = useState(false)

  const mine = useMemo(() => logs.rows.filter(l => l.camp_id === camp.id), [logs.rows, camp.id])
  const names = useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of attendees) m[a.id] = a.player_name
    return m
  }, [attendees])

  const byStage = useMemo(() => {
    const m: Record<string, { sent: number; skipped: number; failed: number }> = {}
    for (const l of mine) {
      const s = (m[l.stage] ||= { sent: 0, skipped: 0, failed: 0 })
      if (l.status === 'sent') s.sent++
      else if (l.status === 'failed') s.failed++
      else s.skipped++
    }
    return m
  }, [mine])

  const overrides = (camp.email_overrides || {}) as Record<string, Override>
  const setOverride = async (id: StageId, patch: Override) => {
    const next = { ...overrides, [id]: { ...(overrides[id] || {}), ...patch } }
    if (!next[id].skip && !next[id].note) delete next[id]
    await onSave({ email_overrides: Object.keys(next).length ? next : null })
  }

  const noStart = !camp.start_date
  const paused = !!camp.emails_paused

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* What this is */}
      <div style={card(T)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>The countdown</div>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: T.text3, lineHeight: 1.6, maxWidth: 620 }}>
              Six emails between signing up and getting home, written by Lumio Coach from this camp&rsquo;s own
              details and sent for you. Nobody gets the same thing twice, and anyone who books late gets the
              details folded into their confirmation rather than a burst of countdowns they missed.
            </p>
          </div>
          <button
            onClick={() => onSave({ emails_paused: !paused })}
            style={{
              appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700,
              borderRadius: 9, padding: '9px 15px',
              border: `1px solid ${paused ? T.border : `${T.bad}55`}`,
              background: paused ? accent.hex : 'transparent',
              color: paused ? T.btnText : T.bad,
            }}>
            {paused ? '▶ Restart the sequence' : '⏸ Pause all emails'}
          </button>
        </div>

        {paused && (
          <div style={{ marginTop: 12, background: `${T.warn}1a`, border: `1px solid ${T.warn}55`, borderRadius: 9, padding: '9px 12px', fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
            Paused. Nothing goes out for this camp until you restart it — including emails that were due while
            it was paused. Those are sent on the next run, if they are still true.
          </div>
        )}
        {noStart && (
          <div style={{ marginTop: 12, background: `${T.bad}14`, border: `1px solid ${T.bad}44`, borderRadius: 9, padding: '9px 12px', fontSize: 12, color: T.bad, lineHeight: 1.5 }}>
            This camp has no start date, so nothing can be scheduled. Add one under &ldquo;Edit camp
            details&rdquo; and the countdown starts working out its own dates.
          </div>
        )}
      </div>

      {/* The stages */}
      <div style={card(T)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>What goes out, and when</div>
        <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 12 }}>
          {attendees.length} {attendees.length === 1 ? 'person' : 'people'} on this camp.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STAGES.map(st => {
            const c = byStage[st.id] || { sent: 0, skipped: 0, failed: 0 }
            const ov = overrides[st.id] || {}
            const due = dueAt(st, camp.start_date)
            const gone = due != null && Date.now() >= due
            const locked = st.id === 'signup'
            const expanded = open === st.id
            return (
              <div key={st.id} style={{
                border: `1px solid ${ov.skip ? T.border : (gone ? T.border : accent.border)}`,
                borderRadius: 10, background: ov.skip ? 'transparent' : T.panel2, opacity: ov.skip ? 0.62 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{st.label}</span>
                      {ov.skip && <Pill T={T} tone={T.text3}>Skipped</Pill>}
                      {ov.note && !ov.skip && <Pill T={T} tone={accent.hex}>Your note added</Pill>}
                      {st.conditional && !ov.skip && <Pill T={T} tone={T.text3}>Only if needed</Pill>}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>{st.job}</div>
                  </div>

                  <div style={{ minWidth: 116 }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {st.offsetDays == null ? 'Trigger' : gone ? 'Was due' : 'Due'}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginTop: 2 }}>
                      {dueLabel(st, camp.start_date)}
                    </div>
                  </div>

                  <div style={{ minWidth: 96, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.sent > 0 && <Pill T={T} tone={T.good}>{c.sent} sent</Pill>}
                    {c.skipped > 0 && <Pill T={T} tone={T.text3}>{c.skipped} skipped</Pill>}
                    {c.failed > 0 && <Pill T={T} tone={T.bad}>{c.failed} failed</Pill>}
                    {!c.sent && !c.skipped && !c.failed && <span style={{ fontSize: 11.5, color: T.text3 }}>Not yet</span>}
                  </div>

                  {!locked && (
                    <button onClick={() => setOpen(expanded ? null : st.id)} style={ghost(T)}>
                      {expanded ? 'Done' : 'Change'}
                    </button>
                  )}
                </div>

                {expanded && !locked && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!ov.skip} onChange={e => setOverride(st.id, { skip: e.target.checked })} style={{ marginTop: 2 }} />
                      <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>
                        Don&rsquo;t send this one for {camp.name}. Your other camps are unaffected.
                      </span>
                    </label>

                    <div>
                      <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 5, lineHeight: 1.5 }}>
                        Anything Lumio Coach should work into this email — a car park change, a kit supplier, a
                        message from you. It writes the email; this is what you want in it.
                      </div>
                      <textarea
                        defaultValue={ov.note || ''}
                        onBlur={e => { if ((e.target.value || '') !== (ov.note || '')) setOverride(st.id, { note: e.target.value.slice(0, 600) }) }}
                        rows={3}
                        placeholder="e.g. Park in the overflow car park this year, the main one is being resurfaced."
                        style={{
                          width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: FONT, fontSize: 12.5,
                          color: T.text, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', lineHeight: 1.55,
                        }} />
                    </div>

                    {c.sent > 0 && (
                      <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>
                        {c.sent} {c.sent === 1 ? 'person has' : 'people have'} already had this one. Changes here
                        only affect people who have not received it yet — an email that has gone cannot be
                        unsent.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Balance link + overseas */}
      <div style={card(T)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Two things the emails need from you</div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={!!camp.overseas} onChange={e => onSave({ overseas: e.target.checked })} style={{ marginTop: 2 }} />
          <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>
            <strong style={{ color: T.text }}>This camp is abroad.</strong> Adds passport and travel insurance to
            the two-week email, and mentions travel in the details. Leave it off for a camp at home — a parent
            driving to the club does not need a passport reminder.
          </span>
        </label>

        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 4 }}>Where a balance gets paid</div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: T.text3, lineHeight: 1.55, maxWidth: 620 }}>
          If you took a deposit, the two-week email chases the rest. Paste wherever you want that paid —
          your PayPal.me link, a Stripe payment link, your own booking page. Leave it blank and the email
          says you&rsquo;ll be in touch about payment instead.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={link}
            onChange={e => { setLink(e.target.value); setLinkSaved(false) }}
            placeholder="https://paypal.me/yourclub"
            style={{
              flex: 1, minWidth: 240, fontFamily: FONT, fontSize: 12.5, color: T.text,
              background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px',
            }} />
          <button
            onClick={async () => { await onSave({ balance_link: link.trim() || null }); setLinkSaved(true) }}
            style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            {linkSaved ? 'Saved' : 'Save'}
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>
          Lumio can&rsquo;t see money arriving through a link like this, so it keeps chasing until you mark the
          attendee paid under Finance. That tick is what stops the reminder.
        </div>
      </div>

      {/* The log */}
      <div style={card(T)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Everything that has gone out</div>
        {logs.loading && !mine.length ? (
          <div style={{ fontSize: 12.5, color: T.text3 }}>Loading…</div>
        ) : !mine.length ? (
          <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6 }}>
            Nothing yet. The first email goes the moment somebody signs up.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...mine]
              .sort((a, b) => String(b.sent_at || '').localeCompare(String(a.sent_at || '')))
              .slice(0, 40)
              .map(l => {
                const stage = STAGES.find(s => s.id === l.stage)
                const tone = l.status === 'sent' ? T.good : l.status === 'failed' ? T.bad : T.text3
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, flexWrap: 'wrap' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: tone, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, minWidth: 120 }}>
                      {names[l.attendee_id || ''] || 'An attendee'}
                    </span>
                    <span style={{ fontSize: 12, color: T.text2, flex: 1, minWidth: 150 }}>
                      {stage?.label || l.stage}
                      {l.status !== 'sent' && l.error ? <span style={{ color: T.text3 }}> — {l.error}</span> : ''}
                    </span>
                    <span style={{ fontSize: 11, color: T.text3 }}>
                      {l.sent_at ? new Date(l.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({ T, tone, children }: { T: ThemeTokens; tone: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 9.5, fontWeight: 700, color: tone, background: `${tone}1f`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function card(T: ThemeTokens): React.CSSProperties {
  return { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
}
function ghost(T: ThemeTokens): React.CSSProperties {
  return {
    appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2,
    borderRadius: 7, padding: '6px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
  }
}
