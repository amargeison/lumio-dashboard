'use client'

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { EQUIPMENT_INVENTORY, type KitStatus } from '../_lib/coach-data'
import { addEquipment } from '../_lib/equipment-store'

const STATUSES: { id: KitStatus; label: string }[] = [
  { id: 'good', label: 'In stock' }, { id: 'low', label: 'Running low' },
  { id: 'order', label: 'To order' }, { id: 'repair', label: 'Repair' },
]

export function AddEquipmentModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void }) {
  const [category, setCategory] = useState(EQUIPMENT_INVENTORY[0]?.category ?? '')
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [status, setStatus] = useState<KitStatus>('good')
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const label: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const canSave = name.trim().length > 0
  const save = () => {
    if (!canSave) return
    addEquipment({
      id: `kit-${Date.now()}`,
      category,
      name: name.trim(),
      qty: qty.trim() || '—',
      status,
      location: location.trim() || 'Main coaching bag',
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="wrench" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>Add kit item</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={input}>
              {EQUIPMENT_INVENTORY.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Item name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Throw-down lines" style={input} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value)} placeholder="×6 / 4 dozen" style={input} />
            </div>
            <div>
              <label style={label}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as KitStatus)} style={input}>{STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </div>
          </div>
          <div>
            <label style={label}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Main coaching bag" style={input} />
          </div>
          <div>
            <label style={label}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. reorder soon" style={input} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '10px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={14} stroke={2} /> Add item
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '10px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
