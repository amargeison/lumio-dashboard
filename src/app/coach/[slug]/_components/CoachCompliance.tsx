'use client'

// GDPR / compliance panel — Data Processing Agreement acceptance + a privacy
// notice template the coach can share with parents.

import { useState } from 'react'
import { useCoachProfile, saveCoachProfile, useCoachTable, dbList, dbInsert, dbUpdate } from '../_lib/coach-db'

type ThemeTokens = { text: string; text2: string; text3: string; panel: string; panel2: string; border: string; btnText: string; isDark: boolean }
type AccentTokens = { hex: string; dim: string }

const PRIVACY_TEMPLATE = (academy: string) => `PRIVACY NOTICE — ${academy || 'Tennis Academy'}

What we collect: your child's name, age, contact details, parent/guardian details, coaching progress, attendance, payments and — with your consent — photos/video and medical/emergency information.

Why: to coach your child, run sessions and camps, track progress, manage payments and keep them safe. Our lawful basis is your consent (and, where applicable, our agreement with you).

Photos & video: we only capture footage of children whose parent/guardian has given photo/video consent. You can withdraw consent at any time.

Who sees it: ${academy || 'the academy'} coaching staff. Our software is provided by Lumio, who process the data on our behalf under a data processing agreement and do not use it for anything else.

Retention: we keep records only as long as your child trains with us, plus the period required by law, then delete them.

Your rights: you can ask to see, correct, export or delete your child's data at any time — just contact us.`

export function CoachCompliance({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const profile = useCoachProfile()
  const submissions = useCoachTable<any>('coach_consent_submissions')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const accepted = !!profile.dpa_accepted_at

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

  const pending = submissions.rows.filter(s => s.status !== 'applied')
  const applySubmission = async (sub: any) => {
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
    setSaving(true)
    try { await saveCoachProfile({ dpa_accepted_at: new Date().toISOString() }); profile.reload() } finally { setSaving(false) }
  }
  const notice = PRIVACY_TEMPLATE(profile.brand_name || '')
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
      <div style={{ background: T.panel2, border: `1px solid ${accepted ? 'rgba(34,197,94,0.4)' : T.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Data Processing Agreement</div>
        <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.5, margin: '6px 0 10px' }}>
          You are the data controller; Lumio is your data processor and only processes this data to run your portal. Accepting confirms you agree to those terms.
        </p>
        {accepted ? (
          <div style={{ fontSize: 12.5, color: '#22C55E', fontWeight: 600 }}>✓ Accepted {new Date(profile.dpa_accepted_at!).toLocaleDateString('en-GB')}</div>
        ) : (
          <button onClick={accept} disabled={saving} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Accept agreement'}</button>
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
