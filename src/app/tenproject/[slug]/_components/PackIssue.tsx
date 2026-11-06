'use client'

// Issuing welcome packs and recording payments. Nothing here assumes who is using
// it: the caller passes an actor, so the same pieces mount in the HQ's school and
// family views now and for a signed-in coach later. Stock, payment and repeat
// rules are enforced by the database; the sentences it raises are shown as they are.

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Gift, PoundSterling } from 'lucide-react'
import { Card, Modal, Pill, SectionTitle, buttonPrimary, buttonSecondary, formField, formLabel } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { moduleOn } from '@/lib/impact/org'
import { currentHq } from '@/lib/impact/org-scope'
import { isoToday, longDate } from '@/lib/impact/compliance'
import { issuePack, recordPayment, returnItem, setChildSize } from '@/lib/impact/pack-actions'
import { EMPTY_PACKS, PAYMENT_METHODS, RETURN_REASONS, bulkPlan, canReissue, currentIssue, hasPack, includedItems, issueLines, lineLabel, paidItems, paymentFor, pounds, returnableItems, schoolPacks, sizeFor, type ChildRef, type PackItem } from '@/lib/impact/packs'

export const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const MUTED = '#6B6560', GREEN = '#187A3C'
const problem = (e: unknown, fallback: string) => e instanceof Error ? e.message : fallback
const day = (iso: string) => longDate(iso.slice(0, 10))

/** Who is issuing. A coach is their own record; an HQ acting on a cohort's behalf falls back to its lead coach. */
export type PackActor = { role: 'hq' | 'coach'; staffId: string | null; leadStaffId?: string | null }
const HQ_ACTOR: PackActor = { role: 'hq', staffId: null }
export const issuedByFor = (a: PackActor) => a.role === 'coach' ? a.staffId : a.leadStaffId ?? null

export function usePackAccess() {
  const ctx = useImpact()
  const on = !!ctx.packs && moduleOn(ctx.org?.settings, 'packs')
  const packs = ctx.packs ?? EMPTY_PACKS
  return { on, packs, ready: on && packs.items.some(i => i.active), canEdit: !!ctx.org?.canEdit, reload: () => ctx.reload?.() }
}

const small: React.CSSProperties = { ...buttonSecondary, padding: '5px 9px', fontSize: 11 }

// ── One child ───────────────────────────────────────────────────────────────
export function IssuePackDialog({ child, actor, sessionId, onClose }: { child: ChildRef; actor: PackActor; sessionId?: string | null; onClose: () => void }) {
  const { packs, reload } = usePackAccess()
  const lines = issueLines(packs, child.id)
  const [ticked, setTicked] = useState(() => new Set(lines.filter(l => l.ticked).map(l => l.item.id)))
  const [sizes, setSizes] = useState<Record<string, string>>(() => Object.fromEntries(lines.map(l => [l.item.id, l.size ?? ''])))
  const [paying, setPaying] = useState<PackItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const toggle = (id: string) => setTicked(t => { const n = new Set(t); if (n.has(id)) n.delete(id); else n.add(id); return n })

  async function confirm() {
    const chosen = lines.filter(l => ticked.has(l.item.id) && l.canIssue)
    const noSize = chosen.find(l => l.item.has_sizes && !sizes[l.item.id])
    if (noSize) { setErr(`Choose a size for ${noSize.item.name}.`); return }
    setBusy(true); setErr('')
    try {
      const db = sb(), hq = await currentHq(db)
      for (const l of chosen) if (l.item.has_sizes && sizes[l.item.id] !== l.size) await setChildSize(db, hq, child.id, l.item.id, sizes[l.item.id])
      await issuePack(db, child.id, chosen.map(l => ({ item_id: l.item.id, size: l.item.has_sizes ? sizes[l.item.id] : null })), { sessionId, issuedBy: issuedByFor(actor) })
      reload(); onClose()
    } catch (e) { setErr(problem(e, 'The pack could not be issued.')); setBusy(false) }
  }

  const count = lines.filter(l => ticked.has(l.item.id) && l.canIssue).length
  return (
    <Modal title={`Issue welcome pack: ${child.name}`} onClose={onClose}>
      <div style={{ display: 'grid', gap: 8 }}>
        {lines.map(l => (
          <div key={l.item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F5F2', borderRadius: 9, padding: '9px 11px', flexWrap: 'wrap' }}>
            <input type="checkbox" aria-label={l.item.name} checked={ticked.has(l.item.id) && l.canIssue} disabled={!l.canIssue} onChange={() => toggle(l.item.id)} />
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{l.item.name}</div>
              <div style={{ fontSize: 10.5, color: MUTED }}>{l.issued ? `Issued ${day(l.issued.issued_at)}${l.issued.size ? ` · ${l.issued.size}` : ''}` : l.why ?? (l.paid ? `Paid ${day(l.paid.paid_at)}` : 'Included')}</div>
            </div>
            {l.item.has_sizes && l.canIssue && (
              <select aria-label={`${l.item.name} size`} value={sizes[l.item.id]} onChange={e => setSizes(s => ({ ...s, [l.item.id]: e.target.value }))} style={{ ...formField, width: 'auto' }}>
                <option value="">Size…</option>{l.item.sizes.map(s => <option key={s}>{s}</option>)}
              </select>
            )}
            {l.item.kind === 'paid' && !l.paid && !l.issued && <button onClick={() => setPaying(l.item)} style={small}>Record payment</button>}
          </div>
        ))}
      </div>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={buttonSecondary}>Cancel</button>
        <button onClick={confirm} disabled={busy || !count} style={{ ...buttonPrimary, opacity: busy || !count ? 0.6 : 1 }}>{busy ? 'Issuing…' : `Issue ${count} item${count === 1 ? '' : 's'}`}</button>
      </div>
      {paying && <PaymentDialog child={child} item={paying} onClose={() => setPaying(null)} />}
    </Modal>
  )
}

export function IssuePackButton({ child, actor = HQ_ACTOR, sessionId }: { child: ChildRef; actor?: PackActor; sessionId?: string | null }) {
  const { ready, canEdit } = usePackAccess()
  const [open, setOpen] = useState(false)
  if (!ready || !canEdit) return null
  return (<>
    <button onClick={() => setOpen(true)} style={small}><Gift size={12} /> Issue welcome pack</button>
    {open && <IssuePackDialog child={child} actor={actor} sessionId={sessionId} onClose={() => setOpen(false)} />}
  </>)
}

// ── Returns ─────────────────────────────────────────────────────────────────
export function ReturnDialog({ child, actor, onClose }: { child: ChildRef; actor: PackActor; onClose: () => void }) {
  const { packs, reload } = usePackAccess()
  const held = returnableItems(packs, child.id)
  const [itemId, setItemId] = useState(held[0]?.item.id ?? '')
  const [reason, setReason] = useState<string>(RETURN_REASONS[0].id)
  const [note, setNote] = useState('')
  const line = held.find(h => h.item.id === itemId)
  const otherSize = line?.item.sizes.find(s => s !== line.issue.size)
  const [size, setSize] = useState(otherSize ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!line) return null
  const restocks = RETURN_REASONS.find(r => r.id === reason)?.restocks ?? true
  const newSize = line.item.has_sizes ? size || null : null
  const inStock = canReissue(packs, line.item, newSize, { size: line.issue.size, restocks })

  async function run(reissue: boolean) {
    setBusy(true); setErr('')
    try {
      await returnItem(sb(), { childId: child.id, itemId: line!.item.id, reason, note, reissue, size: newSize, issuedBy: issuedByFor(actor) })
      reload(); onClose()
    } catch (e) { setErr(problem(e, 'The return could not be saved.')); setBusy(false) }
  }
  return (
    <Modal title={`Return: ${child.name}`} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <label><span style={formLabel}>Item</span>
          <select value={itemId} onChange={e => { setItemId(e.target.value); setSize(held.find(h => h.item.id === e.target.value)?.item.sizes.find(s => s !== held.find(h => h.item.id === e.target.value)?.issue.size) ?? '') }} style={formField}>
            {held.map(h => <option key={h.item.id} value={h.item.id}>{lineLabel(h.item, h.issue.size)}</option>)}
          </select>
        </label>
        <label><span style={formLabel}>Why</span><select value={reason} onChange={e => setReason(e.target.value)} style={formField}>{RETURN_REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
        {line.item.has_sizes && <label><span style={formLabel}>New size, for a swap</span><select aria-label="New size" value={size} onChange={e => setSize(e.target.value)} style={formField}>{line.item.sizes.map(s => <option key={s}>{s}</option>)}</select></label>}
      </div>
      <label style={{ display: 'block', marginTop: 10 }}><span style={formLabel}>{reason === 'other' ? 'Note (required)' : 'Note (optional)'}</span><input value={note} onChange={e => setNote(e.target.value)} style={formField} /></label>
      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 8 }}>{restocks ? 'This goes back into stock.' : 'This is written off, not put back into stock.'}</div>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={onClose} style={buttonSecondary}>Cancel</button>
        <button onClick={() => run(false)} disabled={busy} style={buttonSecondary}>Return</button>
        <button onClick={() => run(true)} disabled={busy || !inStock} title={inStock ? undefined : 'None in stock'} style={{ ...buttonPrimary, opacity: busy || !inStock ? 0.6 : 1 }}>
          {busy ? 'Saving…' : !inStock ? `No ${lineLabel(line.item, newSize)} in stock` : line.item.has_sizes ? `Return and re-issue in ${size}` : 'Return and replace'}
        </button>
      </div>
    </Modal>
  )
}

export function ReturnButton({ child, actor = HQ_ACTOR }: { child: ChildRef; actor?: PackActor }) {
  const { ready, canEdit, packs } = usePackAccess()
  const [open, setOpen] = useState(false)
  if (!ready || !canEdit || !returnableItems(packs, child.id).length) return null
  return (<>
    <button onClick={() => setOpen(true)} style={small}>Return</button>
    {open && <ReturnDialog child={child} actor={actor} onClose={() => setOpen(false)} />}
  </>)
}

// ── Payments ────────────────────────────────────────────────────────────────
export function PaymentDialog({ child, item, onClose }: { child: ChildRef; item: PackItem; onClose: () => void }) {
  const { reload } = usePackAccess()
  const [amount, setAmount] = useState(String((item.price_pence ?? 0) / 100))
  const [method, setMethod] = useState<string>('cash')
  const [reference, setReference] = useState('')
  const [paidAt, setPaidAt] = useState(isoToday())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function save() {
    setBusy(true); setErr('')
    try {
      const db = sb()
      await recordPayment(db, await currentHq(db), { childId: child.id, itemId: item.id, amountPence: Math.round(Number(amount) * 100), method, reference, paidAt })
      reload(); onClose()
    } catch (e) { setErr(problem(e, 'The payment could not be saved.')); setBusy(false) }
  }
  return (
    <Modal title={`Record payment: ${item.name} for ${child.name}`} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <label><span style={formLabel}>Amount (£)</span><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" style={formField} /></label>
        <label><span style={formLabel}>Method</span><select value={method} onChange={e => setMethod(e.target.value)} style={formField}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}</select></label>
        <label><span style={formLabel}>Date</span><input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Reference (optional)</span><input value={reference} onChange={e => setReference(e.target.value)} style={formField} /></label>
      </div>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={buttonSecondary}>Cancel</button>
        <button onClick={save} disabled={busy} style={buttonPrimary}>{busy ? 'Saving…' : 'Record payment'}</button>
      </div>
    </Modal>
  )
}

// ── Everyone on a register ──────────────────────────────────────────────────
export function BulkIssue({ children, actor = HQ_ACTOR, sessionId }: { children: ChildRef[]; actor?: PackActor; sessionId?: string | null }) {
  const { ready, canEdit, packs, reload } = usePackAccess()
  const [busy, setBusy] = useState(false)
  const [sure, setSure] = useState(false)
  const [report, setReport] = useState<{ done: number; failed: { name: string; why: string }[] } | null>(null)
  const [sizing, setSizing] = useState<ChildRef | null>(null)
  if (!ready || !canEdit) return null
  const { ready: go, blocked } = bulkPlan(packs, children)
  if (!go.length && !blocked.length && !report) return null

  async function run() {
    setBusy(true); setSure(false)
    const db = sb(), failed: { name: string; why: string }[] = []
    let done = 0
    // One child at a time: one child's problem mustn't undo anyone else's pack.
    for (const { child, lines } of go) {
      try { await issuePack(db, child.id, lines, { sessionId, issuedBy: issuedByFor(actor) }); done++ } catch (e) { failed.push({ name: child.name, why: problem(e, 'Not issued') }) }
    }
    setReport({ done, failed }); setBusy(false); reload()
  }

  return (
    <div style={{ marginTop: 12, background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', display: 'grid', gap: 8 }}>
      {go.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => sure ? run() : setSure(true)} disabled={busy} style={buttonPrimary}>
            <Gift size={13} /> {busy ? 'Issuing…' : sure ? `Yes, issue ${go.length} pack${go.length === 1 ? '' : 's'}` : `Issue packs to ${go.length} ${go.length === 1 ? 'child' : 'children'}`}
          </button>
          {sure && <button onClick={() => setSure(false)} style={buttonSecondary}>Cancel</button>}
        </div>
      )}
      {blocked.length > 0 && (
        <div style={{ fontSize: 11.5, color: TP_DARK }}>
          <strong>Blocked until a size is set:</strong>{' '}
          {blocked.map(b => <button key={b.child.id} onClick={() => setSizing(b.child)} style={{ ...small, margin: '2px 4px 2px 0' }}>{b.child.name}</button>)}
        </div>
      )}
      {report && <div role="status" style={{ fontSize: 12, color: GREEN }}>✓ {report.done} pack{report.done === 1 ? '' : 's'} issued.</div>}
      {report?.failed.map(f => <div key={f.name} role="alert" style={{ fontSize: 12, color: TP_RED }}>{f.name}: {f.why}</div>)}
      {sizing && <IssuePackDialog child={sizing} actor={actor} sessionId={sessionId} onClose={() => setSizing(null)} />}
    </div>
  )
}

// ── School page ─────────────────────────────────────────────────────────────
/** Everyone a pack could go to. The demo has no people rows, so it names its own. */
export function usePackChildren(): (ChildRef & { schoolId?: string | null })[] {
  const { people, packChildren } = useImpact()
  return people ? [...people.families.flatMap(f => f.children), ...people.unlinkedChildren].map(c => ({ id: c.id, name: c.name, schoolId: c.schoolId })) : packChildren ?? []
}
const useSchoolChildren = (schoolId: string): ChildRef[] => usePackChildren().filter(c => c.schoolId === schoolId)

export function SchoolPackLine({ schoolId }: { schoolId: string }) {
  const { ready, packs } = usePackAccess()
  const children = useSchoolChildren(schoolId)
  if (!ready || !children.length || !includedItems(packs).length) return null
  const s = schoolPacks(packs, children)
  return <div style={{ fontSize: 11.5, fontWeight: 700, color: TP_DARK, marginTop: 6 }}>Packs {s.done}/{s.total}</div>
}

export function SchoolPacks({ schoolId }: { schoolId: string }) {
  const { ready, packs } = usePackAccess()
  const children = useSchoolChildren(schoolId)
  if (!ready || !children.length) return null
  const s = schoolPacks(packs, children)
  return (
    <Card>
      <SectionTitle><Gift size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Welcome packs</SectionTitle>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, fontWeight: 800, color: TP_DARK }}>
        <span>Welcome packs: {s.done} of {s.total} {s.total === 1 ? 'child' : 'children'}</span>
        {s.paid.map(p => <span key={p.item.id}>{p.item.name}s: {p.paid} paid · {p.issued} issued</span>)}
      </div>
      {s.waiting.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ ...formLabel, marginBottom: 6 }}>Still to receive one</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {s.waiting.map(c => <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 12.5, color: TP_DARK }}>{c.name}<IssuePackButton child={c} /></div>)}
          </div>
        </div>
      )}
      {s.done + s.paid.reduce((n, p) => n + p.issued, 0) > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ ...formLabel, marginBottom: 6 }}>Have items</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {children.filter(c => returnableItems(packs, c.id).length).map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 12.5, color: TP_DARK }}>
                <span>{c.name} <span style={{ color: MUTED, fontSize: 11 }}>{returnableItems(packs, c.id).map(h => lineLabel(h.item, h.issue.size)).join(', ')}</span></span>
                <ReturnButton child={c} />
              </div>
            ))}
          </div>
        </div>
      )}
      <BulkIssue children={children} />
    </Card>
  )
}

// ── Family view ─────────────────────────────────────────────────────────────
export function ChildPackSummary({ child }: { child: ChildRef }) {
  const { ready, packs, canEdit } = usePackAccess()
  const [paying, setPaying] = useState<PackItem | null>(null)
  if (!ready) return null
  const issuesOf = includedItems(packs).map(i => currentIssue(packs, child.id, i.id)).filter(i => i !== null)
  const whole = hasPack(packs, child.id)
  const latest = issuesOf.map(i => i.issued_at).sort().pop()
  const size = includedItems(packs).filter(i => i.has_sizes).map(i => currentIssue(packs, child.id, i.id)?.size ?? sizeFor(packs, child.id, i.id)).find(Boolean)
  return (
    <div style={{ marginTop: 6, borderTop: '1px solid #E7E2DC', paddingTop: 6, display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 10.5, color: MUTED }}>
        <span>
          <Gift size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
          {whole && latest ? `Pack issued ${day(latest)}` : issuesOf.length ? `Pack part issued (${issuesOf.length} of ${includedItems(packs).length})` : 'Pack not issued yet'}
          {size ? ` · ${size}` : ''}
        </span>
        <span style={{ display: 'inline-flex', gap: 5 }}>{!whole && <IssuePackButton child={child} />}<ReturnButton child={child} /></span>
      </div>
      {paidItems(packs).map(item => {
        const paid = paymentFor(packs, child.id, item.id), issued = currentIssue(packs, child.id, item.id)
        return (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: 10.5, color: MUTED }}>
            <span><PoundSterling size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />{item.name}: {paid ? `paid ${pounds(paid.amount_pence)}${issued ? ` · issued ${day(issued.issued_at)}` : ' · not issued yet'}` : 'not paid'}</span>
            {!paid && canEdit && <button onClick={() => setPaying(item)} style={small}>Record payment</button>}
            {paid && !issued && <Pill tone="amber">TO ISSUE</Pill>}
          </div>
        )
      })}
      {paying && <PaymentDialog child={child} item={paying} onClose={() => setPaying(null)} />}
    </div>
  )
}
