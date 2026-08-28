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

import { useEffect, useMemo, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { STAGES, dueLabel, dueAt, type Stage, type StageId } from '@/lib/coach/camp-lifecycle'

type EmailLog = {
  id: string; camp_id?: string | null; attendee_id?: string | null
  stage: string; status: string; error?: string | null; subject?: string | null; sent_at?: string | null
}
type Draft = { subject?: string; preheader?: string; paragraphs?: string[]; bullets?: string[]; cta?: string }
// `draft` is the coach's own approved version. Where it exists the cron sends it
// verbatim and never calls Lumio Coach for that stage — which is the point: he
// signed off those words, so those words go.
type Override = { skip?: boolean; note?: string; draft?: Draft }

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
    // Drop the entry entirely once nothing is set on it, so email_overrides
    // doesn't fill with empty objects. `draft` has to be in this test — without
    // it, saving a rewritten email with no note and no skip would delete the
    // rewrite on the very next render.
    const e = next[id]
    if (!e.skip && !e.note && !e.draft?.paragraphs?.length) delete next[id]
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
                      {ov.draft && !ov.skip && <Pill T={T} tone={accent.hex}>Your version</Pill>}
                      {ov.note && !ov.draft && !ov.skip && <Pill T={T} tone={accent.hex}>Your note added</Pill>}
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

                  <button onClick={() => setOpen(st.id)} style={ghost(T)}>
                    {locked ? 'Preview' : 'Preview & edit'}
                  </button>
                </div>
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

      {open && (
        <EmailStudio
          T={T} accent={accent} campId={camp.id} campName={camp.name}
          stage={STAGES.find(s => s.id === open)!}
          attendees={attendees}
          override={overrides[open] || {}}
          sentCount={(byStage[open] || { sent: 0 }).sent}
          onSaveOverride={patch => setOverride(open, patch)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}

// ── The studio ───────────────────────────────────────────────────────────────
// Preview, edit, and the per-stage controls in one place, because they are one
// decision: a coach looks at the email, and then either leaves it alone, tells
// Lumio Coach one more thing, rewrites it himself, or turns it off.
//
// The preview is rendered SERVER-SIDE by the same function the cron sends
// through, against a real attendee. It is not a mock-up of the email; it is the
// email.
function EmailStudio({
  T, accent, campId, campName, stage, attendees, override, sentCount, onSaveOverride, onClose,
}: {
  T: ThemeTokens; accent: AccentTokens
  campId: string; campName: string
  stage: Stage
  attendees: { id: string; player_name: string }[]
  override: Override
  sentCount: number
  onSaveOverride: (patch: Override) => Promise<void>
  onClose: () => void
}) {
  const [pane, setPane] = useState<'preview' | 'edit' | 'options'>('preview')
  const [who, setWho] = useState(attendees[0]?.id || '')
  const [html, setHtml] = useState('')
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState('')
  const [fixed, setFixed] = useState(false)
  const [recipient, setRecipient] = useState<{ name: string; to: string | null } | null>(null)

  // The editable fields. Paragraphs are one textarea split on blank lines —
  // a coach writes an email, he does not maintain an array.
  const [subject, setSubject] = useState(override.draft?.subject || '')
  const [bodyText, setBodyText] = useState((override.draft?.paragraphs || []).join('\n\n'))
  const [bulletText, setBulletText] = useState((override.draft?.bullets || []).join('\n'))
  const [cta, setCta] = useState(override.draft?.cta || '')
  const [note, setNote] = useState(override.note || '')
  const [dirty, setDirty] = useState(false)
  const [savedTick, setSavedTick] = useState(false)

  const asDraft = (): Draft => ({
    subject: subject.trim(),
    paragraphs: bodyText.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean),
    bullets: bulletText.split('\n').map(x => x.trim()).filter(Boolean),
    cta: cta.trim(),
  })

  const load = async (opts: { useDraft: boolean; attendeeId?: string }) => {
    setBusy(true); setErr('')
    try {
      const body: Record<string, unknown> = { campId, stage: stage.id, attendeeId: opts.attendeeId || who }
      if (opts.useDraft) body.draft = asDraft()
      const r = await fetch('/api/coach/camp-email-preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'Could not build that preview.'); setBusy(false); return }
      setHtml(d.html || '')
      setFixed(!!d.fixed)
      setRecipient(d.recipient || null)
      // Only adopt what came back when it was generated — otherwise we would
      // overwrite the coach's half-finished sentence with his own last save.
      if (!opts.useDraft && d.draft && Array.isArray(d.draft.paragraphs)) {
        setSubject(d.draft.subject || '')
        setBodyText((d.draft.paragraphs || []).join('\n\n'))
        setBulletText((d.draft.bullets || []).join('\n'))
        setCta(d.draft.cta || '')
      }
    } catch {
      setErr('Could not reach the server.')
    }
    setBusy(false)
  }

  // On open: show the coach's own version if he has one, otherwise ask Lumio
  // Coach for a fresh draft. Deliberately not re-run when `who` changes on its
  // own — switching attendee calls load() directly, so this fires once.
  useEffect(() => {
    void load({ useDraft: !!override.draft?.paragraphs?.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasOwn = !!override.draft?.paragraphs?.length
  const canEdit = !fixed

  const save = async () => {
    await onSaveOverride({ draft: asDraft(), note: note.trim() || undefined })
    setDirty(false); setSavedTick(true)
    setTimeout(() => setSavedTick(false), 2200)
  }

  const tabBtn = (id: 'preview' | 'edit' | 'options', label: string) => (
    <button key={id} onClick={() => { if (id === 'preview' && dirty) void load({ useDraft: true }); setPane(id) }}
      style={{
        appearance: 'none', border: 0, padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
        background: pane === id ? T.panel : 'transparent', color: pane === id ? T.text : T.text2,
        fontWeight: pane === id ? 600 : 400, boxShadow: pane === id ? `0 0 0 1px ${T.border}` : 'none',
      }}>{label}</button>
  )

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(6,9,14,.62)', zIndex: 90,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, background: T.panel, border: `1px solid ${T.border}`,
        borderRadius: 14, fontFamily: FONT, overflow: 'hidden',
      }}>

        {/* Head */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{stage.label}</div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>{stage.job}</div>
          </div>
          <button onClick={onClose} style={{ ...ghost(T), padding: '6px 11px' }}>Close</button>
        </div>

        {/* Who it is for */}
        <div style={{ padding: '11px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Previewing as</span>
          {attendees.length > 1 ? (
            <select value={who} onChange={e => { setWho(e.target.value); void load({ useDraft: dirty || hasOwn, attendeeId: e.target.value }) }}
              style={{ fontFamily: FONT, fontSize: 12.5, color: T.text, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 9px' }}>
              {attendees.map(a => <option key={a.id} value={a.id}>{a.player_name}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{attendees[0]?.player_name || '—'}</span>
          )}
          {recipient && (
            <span style={{ fontSize: 11.5, color: recipient.to ? T.text3 : T.bad }}>
              {recipient.to ? `→ ${recipient.to}` : '→ no email address on file, so this one cannot send'}
            </span>
          )}
        </div>

        {/* Panes */}
        <div style={{ padding: '12px 18px 0' }}>
          <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
            {tabBtn('preview', 'Preview')}
            {canEdit && tabBtn('edit', 'Edit')}
            {canEdit && tabBtn('options', 'Options')}
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {err && (
            <div style={{ background: `${T.bad}14`, border: `1px solid ${T.bad}44`, borderRadius: 9, padding: '10px 12px', fontSize: 12.5, color: T.bad, lineHeight: 1.5, marginBottom: 12 }}>
              {err}
            </div>
          )}

          {pane === 'preview' && (
            <>
              {fixed && (
                <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, marginBottom: 10 }}>
                  This one is a receipt, not a letter — it goes out the instant somebody books, with their own
                  details and the exact amount. It isn&rsquo;t written by Lumio Coach, so there&rsquo;s nothing
                  to edit here.
                </div>
              )}
              {busy ? (
                <div style={{ fontSize: 12.5, color: T.text3, padding: '40px 0', textAlign: 'center' }}>
                  Lumio Coach is writing it…
                </div>
              ) : html ? (
                <iframe title="Email preview" srcDoc={html} sandbox=""
                  style={{ width: '100%', height: 460, border: `1px solid ${T.border}`, borderRadius: 10, background: '#eef0f5' }} />
              ) : null}

              {!fixed && !busy && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => void load({ useDraft: false })} style={ghost(T)}>
                    ↻ Ask Lumio Coach for another
                  </button>
                  {hasOwn && (
                    <button onClick={async () => { await onSaveOverride({ draft: undefined }); void load({ useDraft: false }) }} style={ghost(T)}>
                      Go back to Lumio Coach writing it
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {pane === 'edit' && canEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55 }}>
                Edit it and save, and <strong style={{ color: T.text2 }}>your version is what goes out</strong> —
                Lumio Coach is not asked again for this email on this camp. The greeting, sign-off, map link and
                any balance button are still added per family, so one saved version works for everybody.
              </div>

              <Field T={T} label="Subject">
                <input value={subject} onChange={e => { setSubject(e.target.value); setDirty(true) }}
                  style={input(T)} maxLength={150} />
              </Field>

              <Field T={T} label="The email" hint="Leave a blank line between paragraphs. No greeting or sign-off — those are added around it.">
                <textarea value={bodyText} onChange={e => { setBodyText(e.target.value); setDirty(true) }} rows={9}
                  style={{ ...input(T), resize: 'vertical', lineHeight: 1.6 }} />
              </Field>

              <Field T={T} label="Bullet list" hint="One per line. Leave empty if a list doesn't help.">
                <textarea value={bulletText} onChange={e => { setBulletText(e.target.value); setDirty(true) }} rows={4}
                  style={{ ...input(T), resize: 'vertical', lineHeight: 1.6 }} />
              </Field>

              <Field T={T} label="Closing line" hint="The one thing you want them to do, if there is one.">
                <input value={cta} onChange={e => { setCta(e.target.value); setDirty(true) }} style={input(T)} />
              </Field>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={save}
                  style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  {savedTick ? 'Saved' : 'Save my version'}
                </button>
                <button onClick={() => { void load({ useDraft: true }); setPane('preview') }} style={ghost(T)}>
                  See it
                </button>
                {dirty && <span style={{ fontSize: 11.5, color: T.warn }}>Unsaved changes</span>}
              </div>
            </div>
          )}

          {pane === 'options' && canEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!override.skip}
                  onChange={e => void onSaveOverride({ skip: e.target.checked })} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>
                  <strong style={{ color: T.text }}>Don&rsquo;t send this one for {campName}.</strong> Your other
                  camps are unaffected.
                </span>
              </label>

              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                  Tell Lumio Coach something for this email
                </div>
                <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 6, lineHeight: 1.55 }}>
                  A car park change, a kit supplier, a message from you. He writes the email; this is what you
                  want in it. Quicker than writing the whole thing yourself, and it stays in your voice.
                </div>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={600}
                  placeholder="e.g. Park in the overflow car park this year, the main one is being resurfaced."
                  style={{ ...input(T), resize: 'vertical', lineHeight: 1.55 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button onClick={async () => { await onSaveOverride({ note: note.trim() || undefined }); void load({ useDraft: false }); setPane('preview') }}
                    style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                    Save and rewrite it
                  </button>
                </div>
              </div>

              {sentCount > 0 && (
                <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  {sentCount} {sentCount === 1 ? 'person has' : 'people have'} already had this one. Anything you
                  change here only affects people who have not received it yet — an email that has gone cannot be
                  unsent.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ T, label, hint, children }: { T: ThemeTokens; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: hint ? 2 : 5 }}>{label}</div>
      {hint && <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 6, lineHeight: 1.5 }}>{hint}</div>}
      {children}
    </div>
  )
}

function input(T: ThemeTokens): React.CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box', fontFamily: FONT, fontSize: 12.5, color: T.text,
    background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px',
  }
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
