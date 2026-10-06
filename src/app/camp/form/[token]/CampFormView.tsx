'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, type CSSProperties } from 'react'
import type { Answers, FormQuestion, FormSection } from '@/lib/coach/camp-form'

export type FormPublic = {
  token: string; playerName: string
  academy: string; logoUrl: string | null; coachName: string | null
  campName: string; startDate: string | null; endDate: string | null; location: string | null
  adult: boolean; intro: string | null; sections: FormSection[]
  answers: Answers; submittedAt: string | null
  /** Required questions added since they sent the form. They are asked for just these. */
  stillNeeded?: string[]
}

const ACCENT = '#3A8EE0'
const fmt = (d: string | null) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function CampFormView({ data }: { data: FormPublic }) {
  const [a, setA] = useState<Answers>(data.answers || {})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [missing, setMissing] = useState<string[]>([])
  const [done, setDone] = useState(false)
  // Someone coming back to a form they have already sent sees their answers,
  // and can change them.
  // Unless the coach has since added something they must answer: then they are
  // asked for just those questions, with everything they already said kept.
  const [topUp, setTopUp] = useState(!!data.submittedAt && !!data.stillNeeded?.length)
  const [editing, setEditing] = useState(!data.submittedAt || topUp)
  const need = new Set(data.stillNeeded || [])
  const sections = topUp
    ? data.sections.map(s => ({ ...s, questions: s.questions.filter(q => need.has(q.id)) })).filter(s => s.questions.length > 0)
    : data.sections

  const set = (id: string, v: string | string[]) => { setA(p => ({ ...p, [id]: v })); if (missing.includes(id)) setMissing(m => m.filter(x => x !== id)) }
  const isEmpty = (q: FormQuestion) => { const v = a[q.id]; return Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim() }

  const submit = async () => {
    if (busy) return
    const need = data.sections.flatMap(s => s.questions).filter(q => q.required && isEmpty(q)).map(q => q.id)
    if (need.length) {
      setMissing(need); setErr(`${need.length} question${need.length === 1 ? '' : 's'} still need${need.length === 1 ? 's' : ''} an answer — marked in red below.`)
      document.getElementById(`q-${need[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/camp/form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: data.token, answers: a }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { if (Array.isArray(d.missing)) setMissing(d.missing); throw new Error(d.error || 'Could not save your answers') }
      setDone(true); setEditing(false); setTopUp(false); window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save your answers') }
    setBusy(false)
  }

  const card: CSSProperties = { background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(20,25,40,.07)', marginBottom: 16 }
  const field: CSSProperties = { width: '100%', border: '1px solid #dfe3ec', borderRadius: 10, padding: '11px 13px', fontSize: 16, boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#1a1d29' }
  const h2: CSSProperties = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, margin: '0 0 4px' }

  const control = (q: FormQuestion) => {
    const v = a[q.id]
    const bad = missing.includes(q.id)
    const f = { ...field, borderColor: bad ? '#dc2626' : '#dfe3ec' }
    if (q.type === 'long') return <textarea value={String(v ?? '')} onChange={e => set(q.id, e.target.value)} rows={3} style={{ ...f, resize: 'vertical' }} />
    if (q.type === 'date') return <input type="date" value={String(v ?? '')} onChange={e => set(q.id, e.target.value)} style={{ ...f, maxWidth: 220 }} />
    if (q.type === 'time') return <input type="time" value={String(v ?? '')} onChange={e => set(q.id, e.target.value)} style={{ ...f, maxWidth: 160 }} />
    if (q.type === 'dropdown') return (
      <select value={String(v ?? '')} onChange={e => set(q.id, e.target.value)} style={f}>
        <option value="">Choose…</option>
        {(q.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    if (q.type === 'choice' || q.type === 'checks') {
      const many = q.type === 'checks'
      const picked = many ? (Array.isArray(v) ? v : []) : [String(v ?? '')]
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(q.options || []).map(o => {
            const on = picked.includes(o)
            return (
              <label key={o} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${on ? ACCENT : bad ? '#dc2626' : '#dfe3ec'}`, background: on ? '#f1f7fd' : '#fff', fontSize: 15, color: '#1a1d29', lineHeight: 1.4 }}>
                <input type={many ? 'checkbox' : 'radio'} name={q.id} checked={on} style={{ marginTop: 3 }}
                  onChange={() => set(q.id, many ? (on ? picked.filter(x => x !== o) : [...picked, o]) : o)} />
                <span>{o}</span>
              </label>
            )
          })}
        </div>
      )
    }
    return <input value={String(v ?? '')} onChange={e => set(q.id, e.target.value)} style={f}
      inputMode={q.key === 'phone' || q.key === 'ec_phone' ? 'tel' : undefined} autoComplete={q.key === 'phone' ? 'tel' : 'off'} />
  }

  const shown = (q: FormQuestion) => { const v = a[q.id]; return Array.isArray(v) ? v.join(', ') : String(v ?? '') }
  const dates = [fmt(data.startDate), data.endDate && data.endDate !== data.startDate ? fmt(data.endDate) : ''].filter(Boolean).join(' – ')

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 48 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '32px 20px 34px', textAlign: 'center', color: '#fff' }}>
        {data.logoUrl && <img src={data.logoUrl} alt="" style={{ height: 54, maxWidth: 170, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8, marginBottom: 14 }} />}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{data.academy}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>{data.campName}</h1>
        <div style={{ fontSize: 15, opacity: .95, marginTop: 8 }}>{dates}</div>
        {data.location && <div style={{ fontSize: 14, opacity: .9, marginTop: 3 }}>{data.location}</div>}
      </div>

      <div style={{ maxWidth: 640, margin: '-18px auto 0', padding: '0 16px' }}>
        <div style={card}>
          <h2 style={{ fontSize: 19, margin: '0 0 6px', color: '#1a1d29' }}>Player information{data.playerName ? ` — ${data.playerName}` : ''}</h2>
          {done || (data.submittedAt && !editing) ? (
            <>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: '#31543f', background: '#f1faf4', border: '1px solid #cdebd8', borderRadius: 10, padding: '11px 13px', margin: '10px 0 0' }}>
                <strong>Thank you — that is everything.</strong> {data.coachName ? `${data.coachName} has` : 'Your coach has'} your answers.
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '12px 0 0', lineHeight: 1.6 }}>
                Something changed? <button onClick={() => { setEditing(true); setDone(false) }} style={{ appearance: 'none', border: 0, background: 'none', padding: 0, color: ACCENT, font: 'inherit', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Change your answers</button> — this link keeps working until the camp is over.
              </p>
            </>
          ) : topUp ? (
            <>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: '#7c4a03', background: '#fff7ed', border: '1px solid #fcd9a8', borderRadius: 10, padding: '11px 13px', margin: '10px 0 0' }}>
                <strong>{need.size === 1 ? 'One more question' : `${need.size} more questions`}.</strong> {data.coachName || 'Your coach'} has added to this form since you filled it in. Everything you told us before is saved — only {need.size === 1 ? 'this one is' : 'these are'} needed.
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '12px 0 0', lineHeight: 1.6 }}>
                <button onClick={() => setTopUp(false)} style={{ appearance: 'none', border: 0, background: 'none', padding: 0, color: ACCENT, font: 'inherit', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>See or change your other answers</button>
              </p>
            </>
          ) : (
            data.intro && <p style={{ fontSize: 15, lineHeight: 1.65, color: '#374151', margin: '6px 0 0', whiteSpace: 'pre-line' }}>{data.intro}</p>
          )}
        </div>

        {sections.map(s => (
          <div key={s.id} style={card}>
            <div style={h2}>{s.title}</div>
            {s.help && editing && <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#6b7280', margin: '0 0 6px', whiteSpace: 'pre-line' }}>{s.help}</p>}
            {s.questions.map(q => (
              <div key={q.id} id={`q-${q.id}`} style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: missing.includes(q.id) ? '#dc2626' : '#1a1d29', lineHeight: 1.4 }}>
                  {q.label}{q.required && editing ? <span style={{ color: '#dc2626' }}> *</span> : null}
                </div>
                {editing ? (
                  <>
                    {q.help && <div style={{ fontSize: 13, lineHeight: 1.5, color: '#6b7280', margin: '3px 0 0', whiteSpace: 'pre-line' }}>{q.help}</div>}
                    <div style={{ marginTop: 8 }}>{control(q)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 15, color: shown(q) ? '#374151' : '#9aa1b1', marginTop: 3, whiteSpace: 'pre-line' }}>{shown(q) || '—'}</div>
                )}
              </div>
            ))}
          </div>
        ))}

        {editing && (
          <div style={{ ...card, textAlign: 'center' }}>
            {!!err && <div style={{ fontSize: 14, color: '#dc2626', marginBottom: 12 }}>{err}</div>}
            <button onClick={() => { void submit() }} disabled={busy}
              style={{ appearance: 'none', border: 0, background: ACCENT, color: '#fff', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, width: '100%', maxWidth: 320, fontFamily: 'inherit' }}>
              {busy ? 'Sending…' : topUp ? 'Send these answers' : data.submittedAt ? 'Save my changes' : 'Send my answers'}
            </button>
            <div style={{ fontSize: 12.5, color: '#9aa1b1', marginTop: 10 }}>* needs an answer. Your answers go only to {data.coachName || 'your coach'} and the coaching team.</div>
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#9aa1b1', marginTop: 6 }}>Powered by Lumio</div>
      </div>
    </div>
  )
}
