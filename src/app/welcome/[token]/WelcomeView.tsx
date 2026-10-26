'use client'

// A client's welcome, from their side: a few questions, their monthly plan (if
// the coach has set one up) and their card or Direct Debit — in that order,
// each step only when it is still to do. Light, like the card page: opened
// from an email on a phone.

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

const ACCENT = '#3A8EE0'

type Q = { id: string; section: string; kind: 'single' | 'multi' | 'text' | 'scale'; text: string; options: string[] | null; optional: boolean; hint: string | null }
type View = {
  academy: string; coachName: string | null; logoUrl: string | null; childFirst: string | null; playerFirst: string
  version: 'short' | 'long'; minutes: number; done: boolean
  sections: { id: string; title: string }[]; questions: Q[]; answered: boolean
  card: { ready: boolean; directDebit: boolean; saved: string | null; terms: { title: string; text: string }[] }
  plan: { name: string; words: string; starts: string; covers: string; agreed: boolean; text: string } | null
  error?: string
}
type Answer = string | string[] | Record<string, number>

const card: CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginTop: 14, boxShadow: '0 2px 12px rgba(20,25,40,.07)' }
const label: CSSProperties = { fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, marginBottom: 10 }
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #dfe3ec', borderRadius: 10, padding: '11px 13px', fontSize: 16, color: '#1a1d29', background: '#fff', outline: 'none', fontFamily: 'inherit' }
const big: CSSProperties = { appearance: 'none', width: '100%', marginTop: 16, border: 0, background: ACCENT, color: '#fff', borderRadius: 12, padding: '15px 20px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
const chip = (on: boolean): CSSProperties => ({ appearance: 'none', cursor: 'pointer', border: `1px solid ${on ? ACCENT : '#dfe3ec'}`, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#1a1d29', borderRadius: 999, padding: '9px 14px', fontSize: 14.5, fontFamily: 'inherit', textAlign: 'left' })

export default function WelcomeView({ token }: { token: string }) {
  const [v, setV] = useState<View | null>(null)
  const [a, setA] = useState<Record<string, Answer>>({})
  const [health, setHealth] = useState('')
  const [healthOk, setHealthOk] = useState(false)
  const [name, setName] = useState('')
  const [agree, setAgree] = useState(false)
  const [method, setMethod] = useState<'card' | 'bacs_debit'>('card')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [miss, setMiss] = useState<string[]>([])
  const [checking, setChecking] = useState(false)

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/welcome/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { ok: r.ok, d: await r.json() }
  }

  useEffect(() => {
    let alive = true
    const done = new URLSearchParams(window.location.search).get('done')
    if (done) {
      setChecking(true)
      window.history.replaceState(null, '', window.location.pathname)
      call({ action: 'cardDone', sessionId: done })
        .then(({ ok, d }) => { if (!alive) return; if (ok && d.academy) setV(d); else { setErr(d.error || 'Your details were not saved. Please try again.'); return fetch(`/api/welcome/${encodeURIComponent(token)}`).then(r => r.json()).then(x => alive && setV(x)) } })
        .catch(() => { if (alive) setErr('We could not check your details were saved. Refresh this page in a moment.') })
        .finally(() => { if (alive) setChecking(false) })
    } else {
      fetch(`/api/welcome/${encodeURIComponent(token)}`).then(r => r.json()).then(d => { if (alive) setV(d) }).catch(() => { if (alive) setV({ error: 'We could not load this page.' } as View) })
    }
    return () => { alive = false }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const who = v?.coachName || v?.academy || 'your coach'
  const page = (title: string, children: ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", paddingBottom: 48 }}>
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, padding: '32px 20px 28px', textAlign: 'center', color: '#fff' }}>
        {!!v?.logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.logoUrl} alt="" style={{ height: 50, maxWidth: 180, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 8 }} />
          </div>
        )}
        <div style={{ fontSize: 11.5, letterSpacing: '.24em', textTransform: 'uppercase', opacity: .88 }}>{v?.academy || 'Tennis'}</div>
        <h1 style={{ fontSize: 27, fontWeight: 800, margin: '8px 0 0', lineHeight: 1.15 }}>{title}</h1>
      </div>
      <div style={{ maxWidth: 560, margin: '-16px auto 0', padding: '0 16px' }}>{children}</div>
    </div>
  )

  if (!v || checking) return page('Welcome', <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>{checking ? 'Checking your details were saved…' : 'Loading…'}</div>)
  if (v.error && !v.academy) return page('Welcome', <div style={{ ...card, textAlign: 'center', color: '#374151' }}>{v.error}</div>)

  // Which steps there are, and which one is next.
  const steps = [
    { id: 'q', title: 'A few questions', done: v.answered },
    ...(v.plan ? [{ id: 'plan', title: 'Your monthly plan', done: v.plan.agreed }] : []),
    ...(v.card.ready ? [{ id: 'card', title: 'Payment details', done: !!v.card.saved }] : []),
  ]
  const next = steps.find(s => !s.done)
  const progress = (
    <div style={{ ...card, display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12 }} aria-label="Your steps">
      {steps.map((s, i) => (
        <span key={s.id} style={{ fontSize: 13, fontWeight: 700, padding: '6px 10px', borderRadius: 999, background: s.done ? '#e7f6ee' : s === next ? '#e8f1fc' : '#f3f4f7', color: s.done ? '#127a46' : s === next ? ACCENT : '#6b7280' }}>
          {s.done ? '✓' : `${i + 1}.`} {s.title}
        </span>
      ))}
    </div>
  )
  const errBox = err ? <div role="alert" style={{ marginTop: 12, fontSize: 14, color: '#b42318' }}>{err}</div> : null

  if (!next) {
    return page('All done, thank you', <>
      {progress}
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 38 }}>🎾</div>
        <p style={{ fontSize: 15.5, color: '#374151', lineHeight: 1.6, margin: '6px 0 0' }}>
          {who} has {v.childFirst ? `${v.childFirst}’s` : 'your'} answers{v.card.saved ? `, and ${v.card.saved} is saved for lessons` : ''}{v.plan ? `. Your monthly plan is ${v.plan.words}, starting ${v.plan.starts}` : ''}. You can close this page.
        </p>
      </div>
    </>)
  }

  // ── The questionnaire ──
  if (next.id === 'q') {
    const set = (id: string, x: Answer) => { setA(s => ({ ...s, [id]: x })); setMiss(m => m.filter(k => k !== id)) }
    const send = async () => {
      if (busy) return
      if (health.trim() && !healthOk) { setErr('Tick the box under the health question if you are happy for us to keep it, or leave that box empty.'); return }
      setBusy(true); setErr('')
      try {
        const { ok, d } = await call({ action: 'answers', answers: a, health, healthConsent: healthOk })
        if (!ok) { setErr(d.error || 'Your answers could not be saved.'); setMiss(d.missing || []); return }
        setV(d); window.scrollTo({ top: 0 })
      } catch { setErr('Something went wrong. Check your connection and try again.') }
      finally { setBusy(false) }
    }
    return page('Welcome', <>
      {progress}
      <div style={card}>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: 0 }}>
          About {v.minutes} minutes. Your answers go to {who}, to plan {v.childFirst ? `${v.childFirst}’s` : 'your'} lessons around what you want from tennis.
        </p>
      </div>
      {v.sections.map(sec => {
        const qs = v.questions.filter(q => q.section === sec.id)
        if (!qs.length) return null
        return (
          <div key={sec.id} style={card}>
            <div style={label}>{sec.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {qs.map(q => (
                <div key={q.id} data-q={q.id}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: miss.includes(q.id) ? '#b42318' : '#1a1d29', lineHeight: 1.45, marginBottom: 8 }}>
                    {q.text}{q.optional && <span style={{ fontWeight: 400, color: '#9aa1ad' }}> (optional)</span>}
                  </div>
                  {q.kind === 'single' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{q.options!.map(o => <button key={o} onClick={() => set(q.id, o)} aria-pressed={a[q.id] === o} style={chip(a[q.id] === o)}>{o}</button>)}</div>}
                  {q.kind === 'multi' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{q.options!.map(o => { const cur = (a[q.id] as string[]) || []; const on = cur.includes(o); return <button key={o} onClick={() => set(q.id, on ? cur.filter(x => x !== o) : [...cur, o])} aria-pressed={on} style={chip(on)}>{on ? '✓ ' : ''}{o}</button> })}<div style={{ flexBasis: '100%', fontSize: 12.5, color: '#9aa1ad' }}>Choose as many as you like.</div></div>}
                  {q.kind === 'text' && <textarea value={(a[q.id] as string) || ''} onChange={e => set(q.id, e.target.value)} rows={3} maxLength={1000} style={{ ...input, resize: 'vertical' }} />}
                  {q.kind === 'scale' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.hint && <div style={{ fontSize: 12.5, color: '#9aa1ad' }}>{q.hint}</div>}
                      {q.options!.map(part => {
                        const cur = (a[q.id] as Record<string, number>) || {}
                        return (
                          <div key={part} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ flex: '1 1 130px', fontSize: 14.5, color: '#374151' }}>{part}</span>
                            {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => set(q.id, { ...cur, [part]: n })} aria-label={`${part} ${n}`} aria-pressed={cur[part] === n} style={{ ...chip(cur[part] === n), width: 40, padding: '8px 0', textAlign: 'center' }}>{n}</button>)}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <div style={card}>
        <div style={label}>Health</div>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: '#1a1d29', lineHeight: 1.45, marginBottom: 8 }}>
          Anything about {v.childFirst ? `${v.childFirst}’s` : 'your'} health {who} should know? <span style={{ fontWeight: 400, color: '#9aa1ad' }}>(optional)</span>
        </div>
        <textarea value={health} onChange={e => setHealth(e.target.value)} rows={2} maxLength={1000} placeholder="For example an injury, asthma or past surgery" style={{ ...input, resize: 'vertical' }} />
        {health.trim() && (
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 10, fontSize: 14, color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={healthOk} onChange={e => setHealthOk(e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
            <span>I agree to {v.academy} keeping this health information, to keep {v.childFirst || 'me'} safe in lessons. It is seen only by {v.childFirst ? 'the coaches' : 'my coaches'}, and I can ask for it to be deleted at any time.</span>
          </label>
        )}
        {errBox}
        <button onClick={send} disabled={busy} style={{ ...big, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Send my answers'}</button>
      </div>
    </>)
  }

  // ── The monthly plan ──
  if (next.id === 'plan' && v.plan) {
    const go = async () => {
      if (busy) return
      if (!agree) { setErr('Please tick the box to agree to the plan.'); return }
      if (name.trim().length < 2) { setErr('Please type your full name.'); return }
      setBusy(true); setErr('')
      try { const { ok, d } = await call({ action: 'agree', name: name.trim() }); if (!ok) setErr(d.error || 'That could not be saved.'); else { setV(d); setAgree(false); window.scrollTo({ top: 0 }) } }
      catch { setErr('Something went wrong. Check your connection and try again.') }
      finally { setBusy(false) }
    }
    return page('Your monthly plan', <>
      {progress}
      <div style={card}>
        <div style={label}>{v.plan.name}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1d29' }}>{v.plan.words}</div>
        <div style={{ fontSize: 14.5, color: '#6b7280', marginTop: 4 }}>Starting {v.plan.starts}</div>
        {v.plan.covers && <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.6, margin: '10px 0 0' }}>{v.plan.covers}</p>}
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '10px 0 0' }}>It is taken from the card or Direct Debit you save {v.card.saved ? `(${v.card.saved})` : 'in the next step'}, and you get an email each time. You or {who} can end the plan at any time.</p>
      </div>
      <div style={card}>
        <label htmlFor="plan-name" style={{ ...label, display: 'block' }}>Your full name</label>
        <input id="plan-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" style={input} />
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, fontSize: 14.5, color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
          <span>{v.plan.text}</span>
        </label>
        {errBox}
        <button onClick={go} disabled={busy} style={{ ...big, opacity: busy ? 0.7 : 1 }}>{busy ? 'Saving…' : 'Agree to my monthly plan'}</button>
      </div>
    </>)
  }

  // ── Card or Direct Debit ──
  const go = async () => {
    if (busy) return
    if (!agree) { setErr('Please tick the box to agree to the cancellation policy.'); return }
    if (name.trim().length < 2) { setErr('Please type your full name.'); return }
    setBusy(true); setErr('')
    try {
      const { ok, d } = await call({ action: 'card', agree: true, name: name.trim(), method })
      if (!ok || !d.url) { setErr(d.error || 'We could not open the secure page. Please try again.'); setBusy(false); return }
      window.location.href = d.url
    } catch { setErr('We could not open the secure page. Check your connection and try again.'); setBusy(false) }
  }
  return page('Your payment details', <>
    {progress}
    <div style={card}>
      <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: 0 }}>
        Save {v.card.directDebit ? 'a card or a Direct Debit' : 'a card'} with {v.academy} for {v.childFirst ? `${v.childFirst}’s` : 'your'} lessons{v.plan ? ' and monthly plan' : ''}. First, please read how cancellations work.
      </p>
    </div>
    <div style={card}>
      <div style={label}>Cancellation policy</div>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {v.card.terms.map(t => <li key={t.title} style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.55 }}><strong style={{ color: '#1a1d29' }}>{t.title}.</strong> {t.text}</li>)}
      </ol>
    </div>
    <div style={card}>
      {v.card.directDebit && (
        <div style={{ marginBottom: 14 }}>
          <div style={label}>How would you like to pay?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([['card', 'Card'], ['bacs_debit', 'Direct Debit']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setMethod(k)} aria-pressed={method === k} style={{ ...chip(method === k), borderRadius: 12, padding: '12px 8px', fontWeight: 700, textAlign: 'center' }}>{l}</button>
            ))}
          </div>
          {method === 'bacs_debit' && <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: '8px 0 0' }}>Payments by Direct Debit take about three working days to leave your account. You are protected by the Direct Debit Guarantee.</p>}
        </div>
      )}
      <label htmlFor="card-name" style={{ ...label, display: 'block' }}>Your full name</label>
      <input id="card-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="As it appears on the card or account" style={input} />
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, fontSize: 14.5, color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}>
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
        <span>I have read and agree to {v.academy}’s cancellation policy, and I allow {v.academy} to take payment for lessons{v.plan ? ' and my monthly plan' : ''} from these details in line with it.</span>
      </label>
      {errBox}
      <button onClick={go} disabled={busy} style={{ ...big, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>{busy ? 'Opening the secure page…' : method === 'bacs_debit' ? 'Continue to set up Direct Debit' : 'Continue to save my card'}</button>
      <p style={{ fontSize: 12.5, color: '#9aa1ad', lineHeight: 1.5, margin: '12px 0 0', textAlign: 'center' }}>Your details go straight to Stripe, the payment company. {v.academy} and Lumio never see your full card or account number.</p>
    </div>
  </>)
}
