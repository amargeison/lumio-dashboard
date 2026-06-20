'use client'

// Public parent-facing consent form. Shared by the coach via a link; no login.
// Submits a pending consent record the coach reviews in their portal.

import { useState, useEffect, use } from 'react'

const ACCENT = '#3A8EE0'
function academyFromSlug(slug: string) {
  return slug.split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Tennis Academy'
}

export default function ParentConsentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [academy, setAcademy] = useState(academyFromSlug(slug))
  const [child, setChild] = useState('')
  const [age, setAge] = useState('')
  const [parent, setParent] = useState('')
  const [email, setEmail] = useState('')
  const [cData, setCData] = useState(false)
  const [cPhoto, setCPhoto] = useState(false)
  const [cMedical, setCMedical] = useState(false)
  const [medical, setMedical] = useState('')
  const [status, setStatus] = useState<'form' | 'sending' | 'done'>('form')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`/api/coach/consent/submit?slug=${encodeURIComponent(slug)}`).then(r => r.ok ? r.json() : null).then(d => { if (d?.academy) setAcademy(d.academy) }).catch(() => {})
  }, [slug])

  const submit = async () => {
    if (!child.trim() || !parent.trim()) { setErr('Please enter the child and parent/guardian names'); return }
    if (!cData) { setErr('We need consent to process your child’s data to coach them.'); return }
    setStatus('sending'); setErr('')
    try {
      const res = await fetch('/api/coach/consent/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, child_name: child, child_age: age, parent_name: parent, parent_email: email, consent_data: cData, consent_photo: cPhoto, consent_medical: cMedical, medical_notes: medical }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit')
      setStatus('done')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not submit'); setStatus('form') }
  }

  const input: React.CSSProperties = { width: '100%', background: '#111318', border: '1px solid #374151', borderRadius: 10, padding: '11px 13px', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginTop: 6 }
  const lbl: React.CSSProperties = { color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const check = (v: boolean, set: (b: boolean) => void, label: string, sub: string) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#0d1117', border: `1px solid ${v ? ACCENT : '#1F2937'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>
      <input type="checkbox" checked={v} onChange={e => set(e.target.checked)} style={{ marginTop: 3 }} />
      <span><span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{label}</span><br /><span style={{ color: '#9CA3AF', fontSize: 12.5 }}>{sub}</span></span>
    </label>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#07080F', display: 'flex', justifyContent: 'center', padding: '6vh 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <img src="/tennis_coach_logo.png" alt="" style={{ height: 44, display: 'block', margin: '0 auto 16px' }} />
        {status === 'done' ? (
          <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Thank you</h1>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>Your consent has been sent to {academy}. They&apos;ll add it to {child || 'your child'}&apos;s record. You can withdraw or change consent any time by contacting the academy.</p>
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 32 }}>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{academy} — consent form</h1>
            <p style={{ color: '#9CA3AF', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 22px' }}>Please give consent for your child to take part in coaching. You can change or withdraw consent at any time.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={lbl}>Child&apos;s name</label><input value={child} onChange={e => setChild(e.target.value)} style={input} /></div>
              <div><label style={lbl}>Age</label><input type="number" value={age} onChange={e => setAge(e.target.value)} style={input} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div><label style={lbl}>Your name (parent/guardian)</label><input value={parent} onChange={e => setParent(e.target.value)} style={input} /></div>
              <div><label style={lbl}>Your email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} /></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {check(cData, setCData, 'Data processing consent', 'I consent to the academy holding my child’s details and coaching records to coach them. (Required)')}
              {check(cPhoto, setCPhoto, 'Photo & video consent', 'I consent to my child being photographed/filmed for coaching and progress (e.g. GPS & video analysis).')}
              {check(cMedical, setCMedical, 'Medical information', 'I consent to the academy holding medical/emergency information for my child’s safety.')}
            </div>

            {cMedical && <div style={{ marginBottom: 16 }}><label style={lbl}>Medical / emergency notes</label><textarea value={medical} onChange={e => setMedical(e.target.value)} rows={3} placeholder="Allergies, conditions, emergency contact…" style={{ ...input, resize: 'vertical' }} /></div>}

            {err && <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 12px' }}>{err}</p>}
            <button onClick={submit} disabled={status === 'sending'} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: status === 'sending' ? 0.6 : 1 }}>{status === 'sending' ? 'Submitting…' : 'Submit consent'}</button>
            <p style={{ color: '#4B5563', fontSize: 11, textAlign: 'center', marginTop: 14 }}>Your information is shared only with {academy} to coach your child.</p>
          </div>
        )}
      </div>
    </div>
  )
}
