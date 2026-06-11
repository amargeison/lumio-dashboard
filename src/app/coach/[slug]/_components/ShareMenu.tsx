'use client'

// Share sheet for a lesson summary — send the player-facing summary via email
// or WhatsApp, or copy it. Excludes the private coach note (player-facing).

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYER_CONTACTS, type Lesson } from '../_lib/coach-data'
import { getSettings } from '../_lib/settings-store'

function buildText(lesson: Lesson): string {
  const s = getSettings()
  const takeaways = lesson.takeaways.map(t => `• ${t}`).join('\n')
  const lines = [
    `Lesson summary — ${lesson.player} (${lesson.date})`,
    ``,
    `Focus: ${lesson.focus}`,
    ``,
    `Key takeaways:`,
    takeaways,
  ]
  if (s.shareHomework) lines.push('', `Homework: ${lesson.homework}`)
  if (s.shareNextFocus) lines.push('', `Next session: ${lesson.nextFocus}`)
  if (s.shareCoachNote) lines.push('', `Coach note: ${lesson.coachNote}`)
  lines.push('', `— ${s.coach}, ${s.academy}`)
  return lines.join('\n')
}

// UK numbers (07…) → international (447…) for wa.me
const toIntl = (phone: string) => phone.replace(/\D/g, '').replace(/^0/, '44')

export function LessonShareMenu({ T, accent, lesson, onClose }: { T: ThemeTokens; accent: AccentTokens; lesson: Lesson; onClose: () => void }) {
  const c = PLAYER_CONTACTS[lesson.playerId]
  const text = buildText(lesson)
  const email = c?.parentEmail ?? c?.playerEmail
  const phone = c?.parentPhone ?? c?.playerPhone
  const recipient = c?.parentName ? `${c.parentName} (${lesson.player}’s parent)` : lesson.player
  const subject = `Lesson summary — ${lesson.player} (${lesson.date})`
  const mailto = `mailto:${email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
  const wa = `https://wa.me/${phone ? toIntl(phone) : ''}?text=${encodeURIComponent(text)}`
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }) } catch { /* ignore */ }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="megaphone" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Share lesson summary</div>
            <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>To {recipient}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href={mailto} onClick={onClose}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: accent.dim, border: `1px solid ${accent.border}`, color: T.text }}>
              <Icon name="megaphone" size={17} stroke={1.7} style={{ color: accent.hex }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Email</div><div style={{ fontSize: 10.5, color: T.text3 }}>{email ?? 'Choose a recipient in your mail app'}</div></div>
              <span style={{ color: T.text3 }}>→</span>
            </a>

            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={onClose}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.4)', color: T.text }}>
              <span style={{ width: 17, textAlign: 'center', color: '#25D366', fontWeight: 800 }}>✆</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>WhatsApp</div><div style={{ fontSize: 10.5, color: T.text3 }}>{phone ? `Send to ${phone}` : 'Choose a contact in WhatsApp'}</div></div>
              <span style={{ color: T.text3 }}>→</span>
            </a>

            <button onClick={copy}
              style={{ appearance: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, cursor: 'pointer' }}>
              <Icon name={copied ? 'check' : 'note'} size={16} stroke={1.8} style={{ color: copied ? T.good : T.text2 }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{copied ? 'Copied to clipboard' : 'Copy summary text'}</div><div style={{ fontSize: 10.5, color: T.text3 }}>Paste anywhere</div></div>
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Preview</div>
            <pre style={{ margin: 0, fontFamily: FONT_MONO, fontSize: 10.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{text}</pre>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>Player-facing — the private coach note isn’t included.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
