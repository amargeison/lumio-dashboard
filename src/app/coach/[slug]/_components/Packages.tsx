'use client'

// Payments & Packages extras:
//  • OfferedPackages   — the coach's live price list with an Add-package modal
//  • PackageProgressModal — per-player session tick-boxes & notes for a package

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PACKAGE_TYPE_TO_KIT, type PackageOffer, type Package } from '../_lib/coach-data'
import {
  getOffers, addOffer, removeOffer, getProgress, setProgress, getNotes, setNotes, subscribe,
} from '../_lib/packages-store'

const perLabel = (p: PackageOffer['per']) => p === 'pack' ? 'per pack' : p === 'month' ? 'per month' : 'per term'

// ── Offered packages (price list) ──
export function OfferedPackages({ T, accent, density }: { T: ThemeTokens; accent: AccentTokens; density: Density }) {
  const [offers, setOffers] = useState<PackageOffer[]>([])
  const [addOpen, setAddOpen] = useState(false)
  useEffect(() => { const r = () => setOffers(getOffers()); r(); return subscribe(r) }, [])

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: density.pad + 2, marginBottom: density.gap }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Packages on offer</div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>Your price list — what players can buy. {offers.length} packages.</div>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="plus" size={14} stroke={2} /> Add package
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
        {offers.map(o => (
          <div key={o.id} style={{ position: 'relative', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, background: T.panel2 }}>
            <button onClick={() => removeOffer(o.id)} title="Remove" style={{ position: 'absolute', top: 8, right: 8, appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
            <div style={{ display: 'inline-block', fontSize: 9.5, fontWeight: 700, color: accent.hex, background: accent.dim, borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{o.type}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 8 }}>{o.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span className="tnum" style={{ fontSize: 22, fontWeight: 600, color: T.text }}>£{o.price}</span>
              <span style={{ fontSize: 11, color: T.text3 }}>{perLabel(o.per)} · {o.sessions} sessions</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{o.desc}</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {o.includes.map((inc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: T.text2 }}>
                  <Icon name="check" size={12} stroke={2.2} style={{ color: T.good, marginTop: 1, flexShrink: 0 }} /> {inc}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {addOpen && <AddPackageModal T={T} accent={accent} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

function AddPackageModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; onClose: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<PackageOffer['type']>('Private')
  const [sessions, setSessions] = useState('10')
  const [price, setPrice] = useState('')
  const [per, setPer] = useState<PackageOffer['per']>('pack')
  const [desc, setDesc] = useState('')
  const [includes, setIncludes] = useState('')
  const [equipment, setEquipment] = useState('')

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const lab: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }
  const Field = ({ label, children }: { label: string; children: ReactNode }) => (<div style={{ marginBottom: 12 }}><label style={lab}>{label}</label>{children}</div>)

  const canSave = name.trim().length > 0 && Number(price) > 0
  const save = () => {
    if (!canSave) return
    const offer: PackageOffer = {
      id: `of-new-${Date.now()}`, name: name.trim(), type,
      sessions: Number(sessions) || 1, price: Number(price) || 0, per,
      desc: desc.trim() || `${sessions} ${type.toLowerCase()} sessions.`,
      includes: includes.split('\n').map(s => s.trim()).filter(Boolean),
      equipment: equipment.split('\n').map(s => s.trim()).filter(Boolean),
    }
    addOffer(offer); onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="ticket" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>Add a package</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <Field label="Package name *"><input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 10-lesson private pack" autoFocus /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type"><select style={input} value={type} onChange={e => setType(e.target.value as PackageOffer['type'])}><option>Private</option><option>Group</option><option>Performance</option><option>Adult</option><option>Junior</option><option>Cardio</option></select></Field>
            <Field label="Sessions"><input style={input} inputMode="numeric" value={sessions} onChange={e => setSessions(e.target.value.replace(/\D/g, ''))} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Price (£) *"><input style={input} inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/[^\d]/g, ''))} placeholder="360" /></Field>
            <Field label="Billing"><select style={input} value={per} onChange={e => setPer(e.target.value as PackageOffer['per'])}><option value="pack">Per pack</option><option value="month">Per month</option><option value="term">Per term</option></select></Field>
          </div>
          <Field label="Description"><input style={input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="One line about this package" /></Field>
          <Field label="What's included (one per line)"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={4} value={includes} onChange={e => setIncludes(e.target.value)} placeholder={'10 × 60-min lessons\nRacket progress tracking\nLesson summaries'} /></Field>
          <Field label="Equipment needed per session (one per line)"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={equipment} onChange={e => setEquipment(e.target.value)} placeholder={'Ball basket (60+)\nCones ×8\nTarget hoops'} /></Field>
          <div style={{ fontSize: 10.5, color: T.text3, margin: '-6px 0 12px' }}>Added to <strong style={{ color: T.text2 }}>Equipment &amp; Kit → {PACKAGE_TYPE_TO_KIT[type]}</strong> so it&apos;s on the grab-and-go checklist.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={!canSave} style={{ flex: 1, appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Icon name="plus" size={14} stroke={2} /> Add package</button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '11px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Package progress (per-player session tick-boxes) ──
export function PackageProgressModal({ T, accent, pkg, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; pkg: Package; onClose: () => void }) {
  // Seed from stored progress, else first `used` sessions are complete.
  const seedProg = useMemo(() => getProgress(pkg.id) ?? Array.from({ length: pkg.total }, (_, i) => i < pkg.used), [pkg])
  const seedNotes = useMemo(() => getNotes(pkg.id) ?? Array.from({ length: pkg.total }, () => ''), [pkg])
  const [prog, setProg] = useState<boolean[]>(seedProg)
  const [notes, setNotesState] = useState<string[]>(seedNotes)

  const done = prog.filter(Boolean).length
  const pct = Math.round((done / pkg.total) * 100)

  const toggle = (i: number) => {
    const next = prog.map((v, idx) => idx === i ? !v : v)
    setProg(next); setProgress(pkg.id, next)
  }
  const editNote = (i: number, v: string) => {
    const next = notes.map((n, idx) => idx === i ? v : n)
    setNotesState(next); setNotes(pkg.id, next)
  }
  const markAllUpTo = (i: number) => {
    const next = prog.map((_, idx) => idx <= i)
    setProg(next); setProgress(pkg.id, next)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 540, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="ticket" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{pkg.player}</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{pkg.plan} · renews {pkg.renews}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.hover, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: done >= pkg.total ? T.good : accent.hex, transition: 'width 0.2s' }} />
            </div>
            <span className="tnum" style={{ fontSize: 12.5, fontWeight: 600, color: T.text2 }}>{done}/{pkg.total} used</span>
          </div>

          {/* session checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {prog.map((complete, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, border: `1px solid ${complete ? accent.border : T.border}`, background: complete ? accent.dim : T.panel2 }}>
                <button onClick={() => toggle(i)} style={{ appearance: 'none', flexShrink: 0, width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${complete ? accent.hex : T.border}`, background: complete ? accent.hex : 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  {complete && <Icon name="check" size={13} stroke={2.6} style={{ color: T.btnText }} />}
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: complete ? T.text : T.text2, width: 64, flexShrink: 0 }}>Session {i + 1}</span>
                <input value={notes[i] ?? ''} onChange={e => editNote(i, e.target.value)} placeholder="Add a note — focus, date, attendance…" style={{ flex: 1, appearance: 'none', background: 'transparent', border: 0, borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 12, padding: '4px 2px', fontFamily: FONT, outline: 'none' }} />
                <button onClick={() => markAllUpTo(i)} title="Mark all up to here complete" style={{ appearance: 'none', flexShrink: 0, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 6, fontSize: 10.5, padding: '3px 7px', cursor: 'pointer' }}>≤ here</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: T.text3 }}>Tick a session as it's delivered — the used count on the packages table updates automatically.</div>
          <button onClick={onClose} style={{ marginTop: 14, width: '100%', appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  )
}
