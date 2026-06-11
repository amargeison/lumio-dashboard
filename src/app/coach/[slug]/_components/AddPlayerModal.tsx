'use client'

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { BELTS, type Player } from '../_lib/coach-data'
import { addPlayer } from '../_lib/roster-store'

export function AddPlayerModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [group, setGroup] = useState<'Junior' | 'Performance' | 'Adult'>('Junior')
  const [beltIndex, setBeltIndex] = useState(0)
  const [goal, setGoal] = useState('')
  const [parent, setParent] = useState('')

  const inputStyle: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const canSave = name.trim().length > 0
  const save = () => {
    if (!canSave) return
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'P'
    const player: Player = {
      id: `new-${Date.now()}`,
      name: name.trim(),
      initials,
      age: Number(age) || (group === 'Adult' ? 30 : 10),
      group,
      beltIndex,
      seed: Date.now() % 100,
      goal: goal.trim() || 'Set goals at first assessment',
      attendance: 100,
      nextSession: 'To be scheduled',
      parent: parent.trim() || undefined,
      status: 'green',
      trend: 'flat',
    }
    addPlayer(player)
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="people" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>Add player</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Full name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Olivia Hart" style={inputStyle} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Age</label>
              <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, ''))} placeholder="10" inputMode="numeric" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Group</label>
              <select value={group} onChange={e => setGroup(e.target.value as typeof group)} style={inputStyle}>
                <option value="Junior">Junior</option>
                <option value="Performance">Performance</option>
                <option value="Adult">Adult</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Starting belt</label>
            <select value={beltIndex} onChange={e => setBeltIndex(Number(e.target.value))} style={inputStyle}>
              {BELTS.map((b, i) => <option key={b.id} value={i}>{b.name} — {b.theme}</option>)}
            </select>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>Tip: send the welcome pack first — set the belt after their onboarding answers.</div>
          </div>
          <div>
            <label style={labelStyle}>Goal (optional)</label>
            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="What do they want to achieve?" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Parent / guardian (optional)</label>
            <input value={parent} onChange={e => setParent(e.target.value)} placeholder="For juniors" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '10px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={14} stroke={2} /> Add to roster
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '10px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
