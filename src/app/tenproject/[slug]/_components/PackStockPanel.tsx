'use client'

// Welcome-pack stock on the Equipment tab. Quantities are never typed in: every
// change is a move, and the database keeps the total.

import React, { useState } from 'react'
import { Boxes, PackagePlus } from 'lucide-react'
import { Card, EmptyState, Modal, Pill, SectionTitle, buttonPrimary, buttonSecondary, formField, formLabel } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { currentHq } from '@/lib/impact/org-scope'
import { adjustStock, receiveStock } from '@/lib/impact/pack-actions'
import { lineLabel, restockList, stockLines, type StockLine } from '@/lib/impact/packs'
import { sb, usePackAccess } from './PackIssue'

const REASON: Record<string, string> = { received: 'Received', issued: 'Issued', adjusted: 'Adjusted', returned: 'Returned' }
const small: React.CSSProperties = { ...buttonSecondary, padding: '5px 9px', fontSize: 11 }

function StockDialog({ line, mode, onClose }: { line: StockLine; mode: 'receive' | 'adjust'; onClose: () => void }) {
  const { reload } = usePackAccess()
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function save() {
    setBusy(true); setErr('')
    try {
      const db = sb(), hq = await currentHq(db), n = Number(qty)
      if (mode === 'receive') await receiveStock(db, hq, line.item.id, line.size, n, note)
      else await adjustStock(db, hq, line.item.id, line.size, n, note)
      reload(); onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'That could not be saved.'); setBusy(false) }
  }
  return (
    <Modal title={`${mode === 'receive' ? 'Receive stock' : 'Adjust stock'}: ${lineLabel(line.item, line.size)}`} onClose={onClose}>
      <div style={{ fontSize: 12.5, color: '#6B6560', marginBottom: 10 }}>{line.qty} on hand now.</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <label><span style={formLabel}>{mode === 'receive' ? 'How many came in' : 'Change, such as -2 or 3'}</span><input value={qty} onChange={e => setQty(e.target.value)} inputMode="numeric" style={formField} /></label>
        <label><span style={formLabel}>{mode === 'receive' ? 'Note (optional)' : 'Why (required)'}</span><input value={note} onChange={e => setNote(e.target.value)} placeholder={mode === 'receive' ? 'e.g. Delivery from supplier' : 'e.g. Stock count, 2 damaged'} style={formField} /></label>
      </div>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={buttonSecondary}>Cancel</button>
        <button onClick={save} disabled={busy} style={buttonPrimary}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>
  )
}

export default function PackStockPanel() {
  const { on, ready, packs, canEdit } = usePackAccess()
  const [open, setOpen] = useState<{ line: StockLine; mode: 'receive' | 'adjust' } | null>(null)
  if (!on) return null
  if (!ready) return <Card><EmptyState compact icon={Boxes} title="No welcome pack yet" sub="Set up your pack in Settings → Welcome pack, and its stock will appear here." /></Card>
  const lines = stockLines(packs), restock = restockList(packs)
  const itemName = (id: string) => packs.items.find(i => i.id === id)?.name ?? 'Item'
  const th: React.CSSProperties = { padding: '5px 8px 5px 0', whiteSpace: 'nowrap' }
  return (<>
    <Card>
      <SectionTitle sub="Every change is a logged move, so the total can’t drift"><Boxes size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Welcome-pack stock</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: TP_DARK }}>
          <thead><tr style={{ textAlign: 'left', color: '#8A847E', fontSize: 10.5 }}><th style={th}>Item</th><th style={th}>Size</th><th style={th}>On hand</th><th style={th}></th><th style={th}></th></tr></thead>
          <tbody>
            {lines.map(l => (
              <tr key={`${l.item.id}-${l.size}`} style={{ borderTop: '1px solid #F0EBE5' }}>
                <td style={{ padding: '8px 8px 8px 0', fontWeight: 800 }}>{l.item.name}</td>
                <td style={{ paddingRight: 8 }}>{l.size ?? '—'}</td>
                <td style={{ paddingRight: 8, fontWeight: 800 }}>{l.qty}</td>
                <td style={{ paddingRight: 8 }}>{l.low && <Pill tone="red">LOW</Pill>}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{canEdit && <>
                  <button onClick={() => setOpen({ line: l, mode: 'receive' })} style={{ ...small, marginRight: 6 }}><PackagePlus size={12} /> Receive stock</button>
                  <button onClick={() => setOpen({ line: l, mode: 'adjust' })} style={small}>Adjust</button>
                </>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Card>
      <SectionTitle sub="At or below the low-stock level, and how many reach twice that level">Restock list</SectionTitle>
      {restock.length === 0 ? <div style={{ fontSize: 12.5, color: '#6B6560' }}>Nothing to reorder.</div> : (
        <div style={{ display: 'grid', gap: 6 }}>
          {restock.map(l => <div key={`${l.item.id}-${l.size}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: TP_DARK, gap: 10 }}><span style={{ fontWeight: 800 }}>{lineLabel(l.item, l.size)}</span><span>{l.qty} left · order {l.short}</span></div>)}
        </div>
      )}
    </Card>
    <Card>
      <SectionTitle sub="The last 50 changes">Stock movements</SectionTitle>
      {packs.moves.length === 0 ? <div style={{ fontSize: 12.5, color: '#6B6560' }}>No stock moved yet.</div> : (
        <div style={{ display: 'grid', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
          {packs.moves.map(m => (
            <div key={m.id} style={{ display: 'flex', gap: 10, fontSize: 12, color: TP_DARK, flexWrap: 'wrap' }}>
              <span style={{ color: '#8A847E', minWidth: 74 }}>{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })}</span>
              <span style={{ fontWeight: 800, minWidth: 34 }}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
              <span>{itemName(m.item_id)}{m.size ? ` ${m.size}` : ''} · {REASON[m.reason] ?? m.reason}{m.note ? ` · ${m.note}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
    {open && <StockDialog line={open.line} mode={open.mode} onClose={() => setOpen(null)} />}
  </>)
}
