'use client'

// Settings → Data → Import history, for /impact portals. Every import, newest
// first, with "Undo this import". Undo deletes the rows that import CREATED and
// leaves rows it only updated as they are now. The dialog says, with counts, what
// will be deleted, how many of those rows have been edited since (they are still
// deleted), and what — if anything — is blocking it (/api/impact/import/history,
// backed by impact_undo_import in migration 236).

import React, { useCallback, useEffect, useState } from 'react'
import { History, Undo2, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { Card, SectionTitle } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { impactFetch } from '@/lib/impact/org-scope'

type Counts = Record<string, { label: string; new: number; updated: number; skipped: number; review: number }>
type Entry = { id: string; file_name: string; created_at: string; finished_at: string | null; undone_at: string | null; mine: boolean; summary: Counts | null }
type Line = { table: string; n: number; label: string }
type Check = { ok: boolean; total: number; deleted: Line[]; edited: Line[]; editedTotal: number; blocked: { line: string }[] }

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const n = (x: number) => x.toLocaleString('en-GB')

async function call(path: string, init?: RequestInit) {
  let res: Response
  try { res = await impactFetch(path, init) } catch { throw new Error('Lumio couldn’t be reached — check your connection and try again.') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(data?.error || `Lumio didn’t answer properly (error ${res.status}).`) as Error & { data?: unknown }; e.data = data; throw e }
  return data
}

function summaryLine(s: Counts | null) {
  if (!s) return ''
  const add = Object.values(s).reduce((x, t) => x + t.new, 0), upd = Object.values(s).reduce((x, t) => x + t.updated, 0)
  const parts = Object.values(s).filter(t => t.new || t.updated).slice(0, 4).map(t => `${t.label.toLowerCase()} ${n(t.new + t.updated)}`)
  return `${n(add)} added, ${n(upd)} updated${parts.length ? ` — ${parts.join(', ')}` : ''}`
}

export default function ImportHistoryCard() {
  const { org } = useImpact()
  const [list, setList] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ entry: Entry; check: Check | null; busy: boolean; error: string | null; done?: number } | null>(null)

  const load = useCallback(async () => {
    try { setList((await call('/api/impact/import/history')).imports); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'The import history couldn’t be loaded.') }
  }, [])
  useEffect(() => {
    if (!org?.canEdit) return
    load()
    window.addEventListener('impact-import-changed', load)
    return () => window.removeEventListener('impact-import-changed', load)
  }, [org?.canEdit, load])
  if (!org?.canEdit) return null

  async function openUndo(entry: Entry) {
    setDialog({ entry, check: null, busy: true, error: null })
    try {
      const check = await call('/api/impact/import/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: entry.id, action: 'check' }) }) as Check
      setDialog({ entry, check, busy: false, error: null })
    } catch (e) { setDialog({ entry, check: null, busy: false, error: e instanceof Error ? e.message : 'Undo couldn’t be checked.' }) }
  }
  async function undo() {
    if (!dialog?.check) return
    setDialog({ ...dialog, busy: true, error: null })
    try {
      const r = await call('/api/impact/import/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: dialog.entry.id, action: 'undo' }) })
      setDialog({ ...dialog, busy: false, done: r.total })
      load()
    } catch (e) {
      const data = (e as Error & { data?: { blocked?: { line: string }[] } }).data
      setDialog({ ...dialog, busy: false, error: e instanceof Error ? e.message : 'Undo failed.', check: data?.blocked ? { ...dialog.check, ok: false, blocked: data.blocked } : dialog.check })
    }
  }

  const btn = (primary: boolean, on = true) => ({ background: primary ? (on ? TP_RED : '#D9D3CC') : '#fff', color: primary ? '#fff' : TP_DARK, border: primary ? 'none' : '1px solid #E7E2DC', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: on ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 5 } as const)
  const c = dialog?.check

  return (
    <Card>
      <SectionTitle sub="Data — every import, and Undo">
        <History size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Import history
      </SectionTitle>
      {error && <div role="alert" style={{ fontSize: 12, color: TP_RED, fontWeight: 700 }}><AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />{error}</div>}
      {list && !list.length && <div style={{ fontSize: 12, color: '#8A847E' }}>No imports yet.</div>}
      {!list && !error && <div style={{ fontSize: 12, color: '#8A847E' }}>Loading…</div>}
      <div style={{ display: 'grid', gap: 7 }}>
        {(list ?? []).map(e => (
          <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#F7F5F2', borderRadius: 10, padding: '9px 11px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>{e.file_name}</div>
              <div style={{ fontSize: 10.5, color: '#6B6560' }}>
                {when(e.created_at)} · {e.mine ? 'by you' : 'by another HQ login'} · {summaryLine(e.summary)}
              </div>
              {e.undone_at && <div style={{ fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>Undone {when(e.undone_at)}</div>}
              {!e.undone_at && !e.finished_at && <div style={{ fontSize: 10.5, color: '#9A6A0B', fontWeight: 700 }}>Stopped part-way — undo it to remove what it added</div>}
            </div>
            {!e.undone_at && <button onClick={() => openUndo(e)} style={btn(false)}><Undo2 size={12} /> Undo this import</button>}
          </div>
        ))}
      </div>

      {dialog && (
        <div role="dialog" aria-modal="true" aria-label="Undo this import" style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,12,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', maxWidth: 520, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK }}>Undo “{dialog.entry.file_name}”?</div>
              <button onClick={() => setDialog(null)} aria-label="Close" style={{ all: 'unset', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            {dialog.done !== undefined ? (
              <>
                <div style={{ fontSize: 12.5, color: '#187A3C', fontWeight: 800 }}><CheckCircle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />Undone — {n(dialog.done)} record{dialog.done === 1 ? '' : 's'} deleted.</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={() => window.location.reload()} style={btn(true)}>Refresh the portal</button><button onClick={() => setDialog(null)} style={btn(false)}>Close</button></div>
              </>
            ) : !c ? (
              <div style={{ fontSize: 12, color: dialog.error ? TP_RED : '#6B6560' }}>{dialog.error ?? 'Checking what undo would do…'}</div>
            ) : (
              <div style={{ display: 'grid', gap: 10, fontSize: 12, color: TP_DARK }}>
                <div>
                  <b>{n(c.total)} record{c.total === 1 ? '' : 's'} this import created will be deleted</b>
                  {c.deleted.length > 0 && <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>{c.deleted.map(d => d.label).join(', ')}</div>}
                </div>
                <div>
                  {c.editedTotal
                    ? <><b style={{ color: '#9A6A0B' }}>{n(c.editedTotal)} of them {c.editedTotal === 1 ? 'has' : 'have'} been edited since the import — {c.editedTotal === 1 ? 'it' : 'they'} will still be deleted, edits included.</b><div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>{c.edited.map(d => d.label).join(', ')}</div></>
                    : <span style={{ color: '#6B6560' }}>None of them has been edited since the import.</span>}
                </div>
                <div style={{ color: '#6B6560' }}>Records this import <b>updated</b> rather than created are left as they are now.</div>
                {!c.ok && (
                  <div style={{ border: '1px solid #E8CD9A', background: '#FCF8EE', borderRadius: 10, padding: '9px 11px' }}>
                    <div style={{ fontWeight: 900, color: '#9A6A0B' }}><AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />Undo is blocked — {n(c.blocked.length)} thing{c.blocked.length === 1 ? '' : 's'} added since depend{c.blocked.length === 1 ? 's' : ''} on this import:</div>
                    {c.blocked.map(b => <div key={b.line} style={{ fontSize: 11.5, color: '#6B5A2E', marginTop: 3 }}>• {b.line}</div>)}
                    <div style={{ fontSize: 11, color: '#6B5A2E', marginTop: 5 }}>Remove or move those first, then try again. Nothing has been deleted.</div>
                  </div>
                )}
                {dialog.error && <div role="alert" style={{ color: TP_RED, fontWeight: 700 }}>{dialog.error}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={undo} disabled={!c.ok || dialog.busy || !c.total} style={btn(true, c.ok && !dialog.busy && !!c.total)}>{dialog.busy ? 'Undoing…' : `Delete ${n(c.total)} record${c.total === 1 ? '' : 's'}`}</button>
                  <button onClick={() => setDialog(null)} style={btn(false)}>Keep the import</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
