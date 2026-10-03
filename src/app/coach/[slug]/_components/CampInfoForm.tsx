'use client'

// A camp's player-information form, from the coach's side.
//
// Every camp has one. It starts as the standard form — worked out from the camp
// itself, so an adult trip abroad asks for flights and a passport name and a
// junior half-term camp asks who is collecting — and the coach can change any of
// it here: reword a question, add one, drop one, switch the whole thing off.
//
// The link goes out with the sign-up confirmation and the countdown emails, one
// link per attendee, so this tab is also where the answers come back: who has
// filled it in, what they said, and a button to nudge the ones who have not.

import { useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  askedForm, campForm, defaultInfoForm, formIsCustom, formUrl, Q_TYPES,
  type Answers, type FormQuestion, type FormSection, type InfoForm, type QType,
} from '@/lib/coach/camp-form'

type Camp = { id: string; name: string; audience?: string | null; overseas?: boolean | null; info_form?: unknown; [k: string]: unknown }
type Att = {
  id: string; player_name: string; status?: string | null
  form_token?: string | null; form_answers?: Answers | null; form_submitted_at?: string | null; form_sent_at?: string | null
  [k: string]: unknown
}

const fmtD = (d?: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '' }
const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const HAS_OPTIONS: QType[] = ['choice', 'checks', 'dropdown']

export function CampInfoForm({ T, accent, camp, attendees, onSave }: {
  T: ThemeTokens; accent: AccentTokens; camp: Camp; attendees: Att[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (v: Record<string, any>) => Promise<void>
}) {
  const form = campForm(camp)
  const asked = askedForm(camp)
  const custom = formIsCustom(camp)
  const abroad = !!camp.overseas
  const enabled = form.enabled !== false
  const [draft, setDraft] = useState<InfoForm | null>(null)       // non-null while editing
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const live = attendees.filter(a => a.status !== 'cancelled')
  const done = live.filter(a => !!a.form_submitted_at)
  const waiting = live.filter(a => !a.form_submitted_at)
  const questions = useMemo(() => asked.sections.flatMap(s => s.questions), [asked])

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const lbl: CSSProperties = { fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }
  const inp: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 9px', fontSize: 12.5, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const btn = (primary?: boolean, off?: boolean): CSSProperties => ({
    appearance: 'none', cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.5 : 1, fontFamily: FONT, fontSize: 12.5, fontWeight: primary ? 700 : 600, whiteSpace: 'nowrap',
    borderRadius: 9, padding: primary ? '9px 16px' : '8px 13px', border: primary ? 0 : `1px solid ${T.border}`, background: primary ? accent.hex : 'transparent', color: primary ? T.btnText : T.text2,
  })
  const mini: CSSProperties = { appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: 600, borderRadius: 7, padding: '4px 9px', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, whiteSpace: 'nowrap' }

  const save = async (label: string, v: Record<string, unknown>, said = '') => {
    setBusy(label); setNote('')
    try { await onSave(v); setNote(said) } catch (e) { setNote(e instanceof Error ? e.message : 'Could not save that') }
    setBusy('')
  }
  const linkFor = (a: Att) => a.form_token ? formUrl(window.location.origin, a.form_token) : ''
  const copy = async (a: Att) => {
    try { await navigator.clipboard.writeText(linkFor(a)); setNote(`Link for ${a.player_name} copied.`) } catch { setNote(linkFor(a)) }
  }
  const send = async (attendeeId?: string) => {
    const n = attendeeId ? 1 : waiting.length
    if (!attendeeId && !window.confirm(`Email the form to the ${n} ${n === 1 ? 'person' : 'people'} who have not filled it in?`)) return
    setBusy(attendeeId || 'send'); setNote('')
    try {
      const res = await fetch('/api/coach/camps/form-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campId: camp.id, attendeeId }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Could not send the form')
      setNote(`Sent to ${d.sent}.${d.failed ? ` ${d.failed} failed.` : ''}${d.noAddress?.length ? ` No email address for: ${d.noAddress.join(', ')} — copy their link and send it yourself.` : ''}`)
      await onSave({})    // nothing changes on the camp; this reloads the attendee list's "sent" dates
    } catch (e) { setNote(e instanceof Error ? e.message : 'Could not send the form') }
    setBusy('')
  }
  const downloadCsv = () => {
    const cell = (v: unknown) => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`
    const rows = [['Player', 'Filled in', ...questions.map(q => q.label)].map(cell).join(',')]
    for (const a of live) rows.push([a.player_name, a.form_submitted_at ? new Date(a.form_submitted_at).toLocaleDateString('en-GB') : '', ...questions.map(q => a.form_answers?.[q.id] ?? '')].map(cell).join(','))
    const url = URL.createObjectURL(new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const el = document.createElement('a'); el.href = url; el.download = `${camp.name.replace(/[^\w]+/g, '-')}-player-information.csv`; el.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  // ── editing helpers ───────────────────────────────────────────────────────
  const patchSection = (si: number, v: Partial<FormSection>) => setDraft(d => d && ({ ...d, sections: d.sections.map((s, i) => i === si ? { ...s, ...v } : s) }))
  const patchQ = (si: number, qi: number, v: Partial<FormQuestion>) => setDraft(d => d && ({ ...d, sections: d.sections.map((s, i) => i === si ? { ...s, questions: s.questions.map((q, j) => j === qi ? { ...q, ...v } : q) } : s) }))
  const move = <X,>(list: X[], i: number, by: number) => { const j = i + by; if (j < 0 || j >= list.length) return list; const out = [...list]; [out[i], out[j]] = [out[j], out[i]]; return out }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: FONT }}>
      {/* ── What it is, and the two switches ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Player information form</div>
          <div style={{ fontSize: 11.5, color: T.text3 }}>
            {enabled ? `${questions.length} questions in ${asked.sections.length} sections · ${custom ? 'your own version' : 'the standard form for this camp'}` : 'Switched off for this camp'}
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6, margin: '8px 0 12px' }}>
          Each attendee gets their own link — in their sign-up confirmation, and again in the countdown emails until they have filled it in. Their emergency contact, medical notes, photo consent, room, arrival and goal for the week are copied straight onto the attendee list.
        </p>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
            <input type="checkbox" checked={enabled} disabled={!!busy}
              onChange={e => { void save('on', { info_form: { ...form, enabled: e.target.checked } }, e.target.checked ? 'The form is on for this camp.' : 'The form is off: no link goes out, and existing links are closed.') }} />
            Send this form with this camp’s emails
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
            <input type="checkbox" checked={abroad} disabled={!!busy}
              onChange={e => { void save('abroad', { overseas: e.target.checked }, e.target.checked ? 'Marked as abroad: the form now asks for the passport name, flights, room and travel insurance.' : 'Marked as a home camp: the travel, room and passport questions are no longer asked.') }} />
            This camp is abroad <span style={{ color: T.text3 }}>— asks for passport name, flights, room and travel insurance</span>
          </label>
        </div>
        {!!note && <div style={{ fontSize: 12, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', marginTop: 12, wordBreak: 'break-word' }}>{note}</div>}
      </div>

      {/* ── Who has answered ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Answers · {done.length} of {live.length}</div>
          <span style={{ flex: 1 }} />
          <button onClick={downloadCsv} disabled={!done.length} style={btn(false, !done.length)}>Download answers</button>
          <button onClick={() => { void send() }} disabled={!enabled || !waiting.length || !!busy} style={btn(true, !enabled || !waiting.length || !!busy)}>
            {busy === 'send' ? 'Sending…' : waiting.length ? `Email it to the ${waiting.length} who have not` : 'Everyone has filled it in'}
          </button>
        </div>
        {live.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No attendees yet. As soon as somebody signs up they are sent their link.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
              <tbody>
                {live.map(a => {
                  const open = openId === a.id
                  return [
                    <tr key={a.id}>
                      <td style={{ padding: '8px 8px', borderTop: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, color: T.text }}>{a.player_name}</td>
                      <td style={{ padding: '8px 8px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: a.form_submitted_at ? T.good : T.text3, whiteSpace: 'nowrap' }}>
                        {a.form_submitted_at ? `Filled in ${fmtD(a.form_submitted_at)}` : a.form_sent_at ? `Not yet · emailed ${fmtD(a.form_sent_at)}` : 'Not yet'}
                      </td>
                      <td style={{ padding: '8px 8px', borderTop: `1px solid ${T.border}`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {a.form_submitted_at && <button onClick={() => setOpenId(open ? null : a.id)} style={{ ...mini, marginRight: 6 }}>{open ? 'Hide' : 'View answers'}</button>}
                        {!a.form_submitted_at && enabled && <button onClick={() => { void send(a.id) }} disabled={!!busy} style={{ ...mini, marginRight: 6 }}>{busy === a.id ? 'Sending…' : 'Email it'}</button>}
                        {!!a.form_token && <button onClick={() => { void copy(a) }} style={mini}>Copy link</button>}
                      </td>
                    </tr>,
                    open && (
                      <tr key={`${a.id}-open`}>
                        <td colSpan={3} style={{ padding: '4px 8px 14px' }}>
                          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px 18px' }}>
                            {questions.filter(q => { const v = a.form_answers?.[q.id]; return Array.isArray(v) ? v.length : !!v }).map(q => {
                              const v = a.form_answers?.[q.id]
                              return (
                                <div key={q.id}>
                                  <div style={lbl}>{q.label}</div>
                                  <div style={{ fontSize: 12.5, color: T.text, marginTop: 2, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{Array.isArray(v) ? v.join(', ') : String(v)}</div>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── The questions ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>The questions</div>
          <span style={{ flex: 1 }} />
          {draft ? (
            <>
              <button onClick={() => setDraft(null)} disabled={!!busy} style={btn()}>Cancel</button>
              <button disabled={!!busy} style={btn(true, !!busy)}
                onClick={() => { void save('form', { info_form: { ...draft, enabled } }, 'Saved. Anyone who opens their link from now on sees the new questions.').then(() => setDraft(null)) }}>
                {busy === 'form' ? 'Saving…' : 'Save the form'}
              </button>
            </>
          ) : (
            <>
              {custom && <button disabled={!!busy} style={btn(false, !!busy)}
                onClick={() => { if (window.confirm('Go back to the standard form for this camp? Your own questions will be removed. Answers already given are kept.')) void save('reset', { info_form: enabled ? null : { ...defaultInfoForm(camp), enabled: false } }, 'Back to the standard form.') }}>Back to the standard form</button>}
              <button onClick={() => setDraft(JSON.parse(JSON.stringify(form)) as InfoForm)} style={btn(true)}>Edit the questions</button>
            </>
          )}
        </div>

        {!draft ? (
          // Read-only: what a family sees, in order.
          <div>
            {form.sections.map(s => {
              const skipped = !abroad && !!s.trip
              return (
                <div key={s.id} style={{ marginTop: 14, opacity: skipped ? 0.5 : 1 }}>
                  <div style={{ ...lbl, color: accent.hex }}>{s.title}{skipped ? ' — only asked when the camp is abroad' : ''}</div>
                  {s.questions.map(q => {
                    const off = !abroad && !!q.trip
                    return (
                      <div key={q.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${T.border}`, opacity: off && !skipped ? 0.5 : 1 }}>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.text }}>
                          {q.label}{q.required ? <span style={{ color: T.bad }}> *</span> : null}
                          {!!q.options?.length && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{q.options.join(' · ')}</div>}
                        </div>
                        <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap' }}>{off && !skipped ? 'abroad only · ' : ''}{Q_TYPES.find(t => t[0] === q.type)?.[1]}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            <div style={{ marginTop: 8 }}>
              <div style={lbl}>Opening words</div>
              <textarea value={draft.intro || ''} onChange={e => setDraft({ ...draft, intro: e.target.value })} rows={2} style={{ ...inp, marginTop: 4, resize: 'vertical' }} />
            </div>
            {draft.sections.map((s, si) => (
              <div key={s.id} style={{ marginTop: 16, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={s.title} onChange={e => patchSection(si, { title: e.target.value })} aria-label="Section title" style={{ ...inp, flex: '1 1 200px', width: 'auto', fontWeight: 700 }} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: T.text2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={!!s.trip} onChange={e => patchSection(si, { trip: e.target.checked })} /> Abroad only
                  </label>
                  <button onClick={() => setDraft({ ...draft, sections: move(draft.sections, si, -1) })} disabled={si === 0} style={mini} aria-label="Move section up">↑</button>
                  <button onClick={() => setDraft({ ...draft, sections: move(draft.sections, si, 1) })} disabled={si === draft.sections.length - 1} style={mini} aria-label="Move section down">↓</button>
                  <button onClick={() => { if (window.confirm(`Remove the “${s.title}” section and its ${s.questions.length} questions?`)) setDraft({ ...draft, sections: draft.sections.filter((_, i) => i !== si) }) }} style={{ ...mini, color: T.bad }}>Remove section</button>
                </div>
                <input value={s.help || ''} onChange={e => patchSection(si, { help: e.target.value })} placeholder="A line under the section title (optional)" style={{ ...inp, marginTop: 6 }} />

                {s.questions.map((q, qi) => (
                  <div key={q.id} style={{ marginTop: 10, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: 10 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input value={q.label} onChange={e => patchQ(si, qi, { label: e.target.value })} aria-label="Question" style={{ ...inp, flex: '1 1 260px', width: 'auto', background: T.panel }} />
                      <select value={q.type} onChange={e => { const type = e.target.value as QType; patchQ(si, qi, { type, options: HAS_OPTIONS.includes(type) ? (q.options?.length ? q.options : ['Option 1', 'Option 2']) : undefined }) }} style={{ ...inp, width: 'auto', background: T.panel }}>
                        {Q_TYPES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                      </select>
                    </div>
                    <input value={q.help || ''} onChange={e => patchQ(si, qi, { help: e.target.value })} placeholder="Help text under the question (optional)" style={{ ...inp, marginTop: 6, background: T.panel }} />
                    {HAS_OPTIONS.includes(q.type) && (
                      <textarea value={(q.options || []).join('\n')} onChange={e => patchQ(si, qi, { options: e.target.value.split('\n') })} onBlur={e => patchQ(si, qi, { options: e.target.value.split('\n').map(o => o.trim()).filter(Boolean) })}
                        rows={Math.min(8, Math.max(2, (q.options || []).length + 1))} placeholder="One option per line" style={{ ...inp, marginTop: 6, background: T.panel, resize: 'vertical' }} />
                    )}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: T.text2, cursor: 'pointer' }}><input type="checkbox" checked={!!q.required} onChange={e => patchQ(si, qi, { required: e.target.checked })} /> Must be answered</label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: T.text2, cursor: 'pointer' }}><input type="checkbox" checked={!!q.trip} onChange={e => patchQ(si, qi, { trip: e.target.checked })} /> Abroad only</label>
                      <span style={{ flex: 1 }} />
                      <button onClick={() => patchSection(si, { questions: move(s.questions, qi, -1) })} disabled={qi === 0} style={mini} aria-label="Move question up">↑</button>
                      <button onClick={() => patchSection(si, { questions: move(s.questions, qi, 1) })} disabled={qi === s.questions.length - 1} style={mini} aria-label="Move question down">↓</button>
                      <button onClick={() => patchSection(si, { questions: s.questions.filter((_, j) => j !== qi) })} style={{ ...mini, color: T.bad }}>Remove</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => patchSection(si, { questions: [...s.questions, { id: newId('q'), label: 'New question', type: 'short' }] })} style={{ ...mini, marginTop: 10 }}>+ Add a question</button>
              </div>
            ))}
            <button onClick={() => setDraft({ ...draft, sections: [...draft.sections, { id: newId('s'), title: 'New section', questions: [{ id: newId('q'), label: 'New question', type: 'short' }] }] })} style={{ ...btn(), marginTop: 14 }}>+ Add a section</button>
          </div>
        )}
      </div>
    </div>
  )
}
