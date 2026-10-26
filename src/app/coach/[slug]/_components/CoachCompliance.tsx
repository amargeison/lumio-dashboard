'use client'

// GDPR / compliance panel — Data Processing Agreement acceptance + a privacy
// notice template the coach can share with parents.

import { useEffect, useState } from 'react'
import { useCoachProfile, useCoachTable, dbList, dbInsert, dbUpdate } from '../_lib/coach-db'
import { privacyNotice, dpaSections, dpaText, SUB_PROCESSORS, COACH_CONNECTED, DPA_VERSION, PROCESSOR } from '@/lib/coach/dpa'

type ThemeTokens = { text: string; text2: string; text3: string; panel: string; panel2: string; border: string; btnText: string; isDark: boolean }
type AccentTokens = { hex: string; dim: string }

const PRIVACY_TEMPLATE = (academy: string, email?: string | null) => privacyNotice(academy, email)

// Sample parent-consent submissions for the demo so the "pending submissions →
// apply to roster" flow is visible without a database.
const DEMO_SUBMISSIONS = [
  { id: 'd1', child_name: 'Sofia Marchetti', child_age: 9, parent_name: 'Elena Marchetti', parent_email: 'elena.m@example.com', consent_data: true, consent_photo: true, consent_medical: false, medical_notes: null, status: 'new' },
  { id: 'd2', child_name: 'Tom Bradley', child_age: 12, parent_name: 'James Bradley', parent_email: 'j.bradley@example.com', consent_data: true, consent_photo: false, consent_medical: true, medical_notes: 'Hay fever in summer.', status: 'new' },
]

export function CoachCompliance({ T, accent, demo }: { T: ThemeTokens; accent: AccentTokens; demo?: boolean }) {
  const profile = useCoachProfile()
  const submissions = useCoachTable<any>('coach_consent_submissions')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [demoAccepted, setDemoAccepted] = useState(true)
  const [demoPending, setDemoPending] = useState(DEMO_SUBMISSIONS)
  // The agreement itself (see lib/coach/dpa.ts): read it, then accept it by
  // name. What was accepted, and when, is kept on the server.
  const [dpa, setDpa] = useState<{ current: boolean; accepted: { version: string; accepted_by: string; accepted_at: string } | null } | null>(null)
  const [reading, setReading] = useState(false)
  const [dpaName, setDpaName] = useState('')
  const [dpaTick, setDpaTick] = useState(false)
  const [dpaErr, setDpaErr] = useState('')
  useEffect(() => {
    if (demo) { setDpa({ current: true, accepted: { version: DPA_VERSION, accepted_by: 'Demo Coach', accepted_at: '2026-10-01T09:00:00Z' } }); return }
    fetch('/api/coach/dpa').then(r => r.json()).then(d => setDpa(d.error ? { current: false, accepted: null } : d)).catch(() => setDpa({ current: false, accepted: null }))
  }, [demo])
  const accepted = !!dpa?.current
  const academyName = demo ? 'Riverside Tennis Academy' : (profile.brand_name || profile.display_name || 'Your academy')

  // The shareable parent-consent link is /tennis/coach/{slug}/consent — derive
  // the slug + origin from the current URL.
  const consentLink = (() => {
    if (typeof window === 'undefined') return ''
    const segs = window.location.pathname.split('/').filter(Boolean)
    const ci = segs.indexOf('coach')
    const slug = ci >= 0 ? segs[ci + 1] : ''
    return slug ? `${window.location.origin}/tennis/coach/${slug}/consent` : ''
  })()
  const copyLink = () => { navigator.clipboard.writeText(consentLink).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2500) }).catch(() => {}) }

  const pending = demo ? demoPending : submissions.rows.filter(s => s.status !== 'applied')
  const applySubmission = async (sub: any) => {
    if (demo) { setDemoPending(prev => prev.filter(x => x.id !== sub.id)); return }
    setApplying(sub.id)
    try {
      const players = await dbList<any>('coach_players')
      const match = players.find(p => (p.name || '').trim().toLowerCase() === (sub.child_name || '').trim().toLowerCase())
      const consent = { consent_data: !!sub.consent_data, consent_photo: !!sub.consent_photo, consent_medical: !!sub.consent_medical, consent_by: sub.parent_name || null, consent_date: new Date().toISOString().slice(0, 10), medical_notes: sub.medical_notes || null }
      if (match) await dbUpdate('coach_players', match.id, consent)
      else await dbInsert('coach_players', { name: sub.child_name, age: sub.child_age || null, parent_name: sub.parent_name || null, email: sub.parent_email || null, ...consent })
      await dbUpdate('coach_consent_submissions', sub.id, { status: 'applied' })
      submissions.reload()
    } catch (e) { console.error(e) }
    setApplying(null)
  }

  const accept = async () => {
    if (!dpaTick) { setDpaErr('Tick the box to accept the agreement.'); return }
    if (dpaName.trim().length < 2) { setDpaErr('Type your full name.'); return }
    if (demo) { setDemoAccepted(true); setReading(false); return }
    setSaving(true); setDpaErr('')
    try {
      const r = await fetch('/api/coach/dpa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dpaName.trim(), agree: true }) })
      const d = await r.json()
      if (!r.ok) setDpaErr(d.error || 'That could not be saved.'); else { setDpa(d); setReading(false); profile.reload() }
    } catch { setDpaErr('You appear to be offline.') } finally { setSaving(false) }
  }
  const printDpa = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Data processing agreement</title><body style="font-family:Georgia,serif;max-width:720px;margin:40px auto;line-height:1.6;color:#111"><pre style="white-space:pre-wrap;font-family:inherit">${esc(dpaText(academyName))}${dpa?.accepted ? esc(`\n\nAccepted by ${dpa.accepted.accepted_by} on ${new Date(dpa.accepted.accepted_at).toLocaleDateString('en-GB')} (version ${dpa.accepted.version}).`) : ''}</pre></body>`)
    w.document.close(); w.focus(); w.print()
  }
  void demoAccepted
  const notice = PRIVACY_TEMPLATE(academyName, demo ? null : (profile.contact_email || null))
  const copy = () => { navigator.clipboard.writeText(notice).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) }).catch(() => {}) }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Privacy &amp; compliance</h3>
      <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>You hold children&apos;s data, so you need consent and a clear privacy notice. Record consent per player in the Player Roster.</p>

      {/* Parent consent form */}
      <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>Parent consent form</div>
        <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.5, margin: '0 0 10px' }}>Share this link with parents to collect consent. Submissions appear below for you to apply to a player.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: pending.length ? 14 : 0, flexWrap: 'wrap' }}>
          <input readOnly value={consentLink} style={{ flex: 1, minWidth: 180, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.text2, fontSize: 12, fontFamily: 'monospace' }} />
          <button onClick={copyLink} style={{ background: accent.hex, color: T.btnText, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{copiedLink ? 'Copied ✓' : 'Copy link'}</button>
        </div>
        {pending.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 8px' }}>Pending submissions ({pending.length})</div>
            {pending.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: `1px solid ${T.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.child_name}{s.child_age ? ` · ${s.child_age}` : ''}</div>
                  <div style={{ fontSize: 11.5, color: T.text3 }}>{s.parent_name} · {[s.consent_data && 'data', s.consent_photo && 'photo', s.consent_medical && 'medical'].filter(Boolean).join(', ') || 'no consents ticked'}</div>
                </div>
                <button onClick={() => applySubmission(s)} disabled={applying === s.id} style={{ background: accent.dim, color: accent.hex, border: `1px solid ${accent.hex}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: applying === s.id ? 0.6 : 1 }}>{applying === s.id ? 'Applying…' : 'Apply to roster'}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DPA */}
      <div data-testid="dpa" style={{ background: T.panel2, border: `1px solid ${accepted ? 'rgba(34,197,94,0.4)' : T.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1 }}>Data processing agreement</div>
          <button onClick={printDpa} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Print or save as PDF</button>
        </div>
        <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.5, margin: '6px 0 10px' }}>
          You are the controller of your clients’ data; {PROCESSOR.name} is your processor. The agreement says what Lumio may do with the data, what it promises in return, and every other company that handles it, which you need for your privacy notice.
        </p>
        {!dpa ? <div style={{ fontSize: 12.5, color: T.text3 }}>Loading…</div>
          : accepted && !reading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, color: '#22C55E', fontWeight: 600 }}>✓ Accepted by {dpa.accepted!.accepted_by} on {new Date(dpa.accepted!.accepted_at).toLocaleDateString('en-GB')} (version {dpa.accepted!.version})</div>
            <button onClick={() => setReading(true)} style={{ background: 'transparent', border: 0, color: accent.hex, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Read it again</button>
          </div>
        ) : !reading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {dpa.accepted && <span style={{ fontSize: 12.5, color: '#F59E0B' }}>The agreement has changed since you accepted version {dpa.accepted.version}. Please read and accept the new one.</span>}
            <button onClick={() => setReading(true)} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Read and accept</button>
          </div>
        ) : null}
        {reading && (
          <div style={{ marginTop: 10 }}>
            <div style={{ maxHeight: 360, overflowY: 'auto', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: '12px 14px' }}>
              {dpaSections(academyName).map((sec, i) => (
                <div key={sec.title} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{i + 1}. {sec.title}</div>
                  {sec.paras.map((p, j) => <p key={j} style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, margin: '4px 0 0' }}>{p}</p>)}
                </div>
              ))}
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, margin: '6px 0 4px' }}>Sub-processors</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11.5, width: '100%', minWidth: 460 }}>
                  <tbody>{SUB_PROCESSORS.map(sp => (
                    <tr key={sp.name} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 6px', color: T.text, fontWeight: 600, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{sp.name}</td>
                      <td style={{ padding: '5px 6px', color: T.text2, verticalAlign: 'top' }}>{sp.does}</td>
                      <td style={{ padding: '5px 6px', color: T.text3, verticalAlign: 'top' }}>{sp.where}{sp.transfer ? ` · ${sp.transfer}` : ''}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5, margin: '8px 0 0' }}>{COACH_CONNECTED}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
              <input value={dpaName} onChange={e => setDpaName(e.target.value)} placeholder="Your full name" aria-label="Your full name" style={{ flex: '1 1 180px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.text, fontSize: 12.5 }} />
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: T.text2, cursor: 'pointer', flex: '2 1 260px' }}>
                <input type="checkbox" checked={dpaTick} onChange={e => setDpaTick(e.target.checked)} /> I accept this agreement on behalf of {academyName}.
              </label>
            </div>
            {dpaErr && <div role="alert" style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>{dpaErr}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setReading(false)} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer' }}>Close</button>
              <button onClick={accept} disabled={saving} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Accept agreement'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Privacy notice for parents</div>
        <button onClick={copy} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: accent.hex, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, margin: 0, lineHeight: 1.55, maxHeight: 220, overflowY: 'auto' }}>{notice}</pre>
      <p style={{ fontSize: 11, color: T.text3, marginTop: 8 }}>A starting template — adapt it to your academy and have it reviewed before publishing. Not legal advice.</p>
    </div>
  )
}
