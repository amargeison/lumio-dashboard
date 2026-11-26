'use client'

// Settings → Import data for /impact portals — how an organisation gets its own
// data in, on its own. Through the shared, product-agnostic engine
// (src/lib/import-engine) with Impact's schema:
//   1. Download the template (the main way): tabs on the template are read here
//      directly, no AI (src/lib/impact/import-template).
//   2. Any other layout: each tab is mapped by the AI from a sample
//      (/api/impact/import/map) and every row mapped here; PDFs, Word, photos and
//      tabs the mapping can't handle are read by the AI (/api/impact/import). The
//      per-org daily AI cap applies (import-engine/guard).
//   → tidied (twins split, contacts and community rows routed, households from
//     guardians) and de-duplicated (import-tidy)
//   → "What will happen" (/api/impact/import/plan, review): per table, new /
//     updated / skipped / needs review, with the first rows of each and what each
//     matched. Nothing is written.
//   → "Import N records" (plan, commit): written as one import that Settings →
//     Data → Import history can undo.
// Limits: 10 MB and 5,000 rows per file. Only the org's HQ (or a Lumio admin
// acting for it) can import; everyone else sees the card read-only.

import React, { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Lock, Download, Sparkles, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { impactFetch } from '@/lib/impact/org-scope'
import { readWorkbook, sheetSample, sheetChunks, SPREADSHEET_RE } from '@/lib/import-engine/read-workbook'
import type { SheetPlan, Rec } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_CATEGORIES, IMPACT_SAVE_ORDER, IMPACT_CATEGORY_LABEL, type ImpactImportCategory } from '@/lib/impact/import-schema'
import { emptyFound, finalise, type Found } from '@/lib/impact/import-tidy'
import { downloadTemplate } from '@/lib/impact/import-template'
import { splitTabs, applyPlans } from '@/lib/impact/import-read'
import { readPackColumns } from '@/lib/impact/packs'
import { recordLabel, MAX_IMPORT_ROWS, MAX_IMPORT_BYTES, type PlanTable, type Action } from '@/lib/impact/import-plan'

const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xlsm,.xlsb,.xls,.ods,.docx,.pdf,.png,.jpg,.jpeg,.webp'
const MAX_CHUNKS = 40
const PARALLEL = 6

const log = (stage: string, extra: Record<string, unknown> = {}) => console.info('[impact-import]', stage, extra)

/** Plain English for any failed call — never a blank failure. */
async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  let res: Response
  try {
    res = await impactFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('Lumio couldn’t be reached — check your connection and try again. Nothing was saved.')
  }
  const data = await res.json().catch(() => ({})) as Record<string, unknown>
  if (!res.ok) {
    log('request failed', { url, status: res.status, error: data?.error })
    const err = new Error(typeof data?.error === 'string' ? data.error
      : res.status === 413 ? 'That file is too big for one import (10 MB and 5,000 rows at most).'
      : res.status === 401 ? 'You’ve been signed out. Sign in again and retry.'
      : `Lumio didn’t answer properly (error ${res.status}). Nothing was saved — please try again.`) as Error & { data?: Record<string, unknown> }
    err.data = data
    throw err
  }
  return data
}

function merge(into: Found, extracted: Partial<Record<ImpactImportCategory, Rec[]>>) {
  for (const c of IMPACT_IMPORT_CATEGORIES) if (extracted[c]?.length) into[c].push(...extracted[c]!)
}

const ACTION_WORD: Record<Action, string> = { new: 'new', updated: 'updated', skipped: 'skipped', review: 'needs review' }
const ACTION_TONE: Record<Action, string> = { new: '#187A3C', updated: '#1F5FA8', skipped: '#8A847E', review: '#9A6A0B' }
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`
const n = (x: number) => x.toLocaleString('en-GB')

type Review = { tables: PlanTable[]; writes: number; records: number; key: string }

export default function ImportCard() {
  const { org, packs } = useImpact()
  const [phase, setPhase] = useState<'idle' | 'reading' | 'checking' | 'review' | 'saving' | 'done'>('idle')
  const [progress, setProgress] = useState('')
  const [fileName, setFileName] = useState('')
  const [found, setFound] = useState<Found>(emptyFound())
  const [pick, setPick] = useState<Record<string, boolean>>({})
  const [skip, setSkip] = useState<Set<Rec>>(new Set())
  const [notes, setNotes] = useState<string[]>([])
  const [aiUsed, setAiUsed] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [stale, setStale] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Review | null>(null)
  if (!org) return null
  const canImport = org.canEdit

  async function readFile(f: File, into: Found, skipped: string[], usedAi: { v: boolean }) {
    if (SPREADSHEET_RE.test(f.name)) {
      const raw = await readWorkbook(f)
      if (!raw.length) throw new Error(`${f.name} looks empty — there’s nothing on any tab.`)
      // Template tabs map themselves (their Notes and example rows dropped); only the rest go to the AI.
      const { plans, sheets, forAi, rows } = splitTabs(raw)
      log('read file', { file: f.name, tabs: sheets.length, templateTabs: plans.length, aiTabs: forAi.length, rows })
      if (rows > MAX_IMPORT_ROWS) throw new Error(`${f.name} has ${n(rows)} rows. One import takes up to ${n(MAX_IMPORT_ROWS)} — split it into smaller files.`)
      for (let i = 0; i < forAi.length; i += 8) {
        usedAi.v = true
        setProgress(`Working out what the tabs in ${f.name} hold…`)
        const batch = forAi.slice(i, i + 8)
        const { plans: p } = await postJson('/api/impact/import/map', { fileName: f.name, sheets: batch.map(s => ({ name: s.name, sample: sheetSample(s) })) })
        plans.push(...(p as SheetPlan<ImpactImportCategory>[]))
      }
      const leftover = applyPlans(sheets, plans, into, skipped)
      const chunks = leftover.flatMap(s => sheetChunks(s).map(text => ({ text, label: `${f.name} — ${s.name}` }))).slice(0, MAX_CHUNKS)
      for (let i = 0; i < chunks.length; i += PARALLEL) {
        usedAi.v = true
        setProgress(`Reading ${f.name} (${Math.min(i + PARALLEL, chunks.length)} of ${chunks.length})…`)
        const parts = await Promise.all(chunks.slice(i, i + PARALLEL).map(c => postJson('/api/impact/import', c)))
        for (const r of parts) merge(into, (r.extracted || {}) as Partial<Record<ImpactImportCategory, Rec[]>>)
      }
      return
    }
    usedAi.v = true
    setProgress(`Reading ${f.name}…`)
    const fd = new FormData()
    fd.append('file', f)
    let res: Response
    try { res = await impactFetch('/api/impact/import', { method: 'POST', body: fd }) } catch { throw new Error('Lumio couldn’t be reached — check your connection and try again.') }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || `${f.name} couldn’t be read (error ${res.status}). Try saving it as a spreadsheet, or use the template.`)
    merge(into, data.extracted || {})
    if (data.truncated) skipped.push(`${f.name} was long — only the first part was read.`)
  }

  const chosen = (f: Found = found, p = pick, s = skip) =>
    Object.fromEntries(IMPACT_SAVE_ORDER.map(c => [c, p[c] === false ? [] : f[c].filter(r => !s.has(r)).map(r => { const { _review: _r, ...rest } = r; void _r; return rest })]))

  async function check(f: Found = found, p = pick, s = skip) {
    setPhase('checking'); setError(null); setProgress('Checking against what’s already in Lumio…')
    try {
      const r = await postJson('/api/impact/import/plan', { mode: 'review', fileName, records: chosen(f, p, s) }) as unknown as Review
      log('reviewed', { writes: r.writes, records: r.records })
      setReview(r); setStale(false); setPhase('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The file couldn’t be checked. Nothing was saved.'); setPhase(review ? 'review' : 'idle')
    } finally { setProgress('') }
  }

  async function onFile(list: FileList | null) {
    const f = list?.[0]
    if (!f || !canImport) return
    setError(null); setDone(null); setReview(null); setFileName(f.name)
    if (!new RegExp(`(${ACCEPT.split(',').map(e => e.replace('.', '\\.')).join('|')})$`, 'i').test(f.name)) { setError(`${f.name} isn’t a file type Lumio can read. Use Excel, CSV, PDF, Word or a photo.`); return }
    if (!f.size) { setError(`${f.name} is empty.`); return }
    if (f.size > MAX_IMPORT_BYTES) { setError(`${f.name} is ${mb(f.size)}. One import takes files up to 10 MB — save it without pictures, or split it into smaller files.`); return }
    setPhase('reading')
    const into = emptyFound()
    const skipped: string[] = []
    const usedAi = { v: false }
    try {
      await readFile(f, into, skipped, usedAi)
      const all = finalise(into)
      for (const r of all.children) {
        const issues = readPackColumns(r, packs?.items ?? []).issues
        if (issues.length) r._review = [...((r._review as string[] | undefined) ?? []), ...issues]
      }
      const total = IMPACT_SAVE_ORDER.reduce((x, c) => x + all[c].length, 0)
      log('records found', { file: f.name, total, ai: usedAi.v })
      if (!total) throw new Error(`Nothing that could be imported was found in ${f.name}. Check it has a heading row, or start from the template.`)
      if (total > MAX_IMPORT_ROWS) throw new Error(`${f.name} holds ${n(total)} records. One import takes up to ${n(MAX_IMPORT_ROWS)} — split it into smaller files.`)
      const p = Object.fromEntries(IMPACT_SAVE_ORDER.map(c => [c, true]))
      setFound(all); setNotes(skipped.slice(0, 8)); setAiUsed(usedAi.v); setPick(p); setSkip(new Set())
      await check(all, p, new Set())
    } catch (e) {
      log('read failed', { file: f.name, error: e instanceof Error ? e.message : String(e) })
      setError(e instanceof Error ? e.message : `${f.name} couldn’t be read.`); setPhase('idle')
    } finally { setProgress('') }
  }

  async function commit() {
    if (!review) return
    setPhase('saving'); setError(null); setProgress(`Importing ${n(review.writes)} records…`)
    try {
      const r = await postJson('/api/impact/import/plan', { mode: 'commit', fileName, key: review.key, records: chosen() }) as unknown as Review
      log('imported', { writes: r.writes })
      setDone(r); setPhase('done')
      window.dispatchEvent(new Event('impact-import-changed'))
    } catch (e) {
      const data = (e as Error & { data?: Record<string, unknown> }).data
      if (data?.changed) { setReview(data as unknown as Review); setStale(false) }
      if (data?.importId) window.dispatchEvent(new Event('impact-import-changed'))
      setError(e instanceof Error ? e.message : 'The import failed. Nothing was saved.'); setPhase('review')
    } finally { setProgress('') }
  }

  const reset = () => { setPhase('idle'); setFound(emptyFound()); setReview(null); setDone(null); setError(null) }
  const flagged = IMPACT_SAVE_ORDER.flatMap(c => found[c].filter(r => Array.isArray(r._review) && (r._review as string[]).length).map(r => ({ c, r })))
  const btn = (primary: boolean, on = true) => ({ background: primary ? (on ? TP_RED : '#D9D3CC') : '#fff', color: primary ? '#fff' : TP_DARK, border: primary ? 'none' : '1px solid #E7E2DC', borderRadius: 9, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: on ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 6 } as const)
  const busy = phase === 'reading' || phase === 'checking' || phase === 'saving'

  const tableView = (r: Review) => (
    <div style={{ display: 'grid', gap: 8 }}>
      {r.tables.map(t => {
        const isOpen = !!open[t.key]
        return (
          <div key={t.key} style={{ background: '#F7F5F2', borderRadius: 10, padding: '9px 11px' }}>
            <button onClick={() => setOpen(o => ({ ...o, [t.key]: !isOpen }))} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', flexWrap: 'wrap' }}>
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <span style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK, minWidth: 140 }}>{t.label}</span>
              {(['new', 'updated', 'skipped', 'review'] as Action[]).map(a => (
                <span key={a} style={{ fontSize: 11, fontWeight: 800, color: t.counts[a] ? ACTION_TONE[a] : '#C4BEB8' }}>{n(t.counts[a])} {ACTION_WORD[a]}</span>
              ))}
            </button>
            {isOpen && (['new', 'updated', 'skipped', 'review'] as Action[]).filter(a => t.rows[a].length).map(a => (
              <div key={a} style={{ marginTop: 7, marginLeft: 21 }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: ACTION_TONE[a], textTransform: 'uppercase', letterSpacing: 0.3 }}>{ACTION_WORD[a]}{t.counts[a] > t.rows[a].length ? ` — first ${t.rows[a].length} of ${n(t.counts[a])}` : ''}</div>
                {t.rows[a].map((row, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: TP_DARK, marginTop: 3 }}>
                    <b>{row.label}</b>
                    {row.match && <span style={{ color: '#1F5FA8' }}> · {row.match}</span>}
                    {row.changes && <span style={{ color: '#6B6560' }}> · will update {row.changes.join(', ')}</span>}
                    {a === 'review' && <span style={{ color: '#6B6560' }}> · {row.writes ? 'will be imported' : 'won’t be imported'}</span>}
                    {(row.notes ?? []).map(m => <div key={m} style={{ fontSize: 10.5, color: '#6B5A2E', marginLeft: 8 }}>• {m}</div>)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )

  return (
    <Card>
      <SectionTitle sub="Schools, programmes, venues, coaches, volunteers, families, children, community families, registers, fundraising, feedback and staff CPD">
        <Upload size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Import data
      </SectionTitle>
      {!canImport && (
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 9, padding: '9px 11px', marginBottom: 10 }}>
          <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {org.readOnlyReason ?? 'Sign in as this organisation’s HQ to import data.'}
        </div>
      )}

      {(phase === 'idle' || phase === 'reading') && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: '#FBF3F2', border: '1px solid #F1D9D6', borderRadius: 12, padding: '12px 14px' }}>
            <button onClick={() => downloadTemplate()} style={{ ...btn(true), padding: '10px 16px', fontSize: 12.5 }}><Download size={14} /> Download the template</button>
            <div style={{ flex: 1, minWidth: 220, fontSize: 11.5, color: '#6B6560' }}>
              <b style={{ color: TP_DARK }}>Start here.</b> One tab per kind of record, with a note under every heading and an example row. Fill it in and upload it below — it’s read directly, with no AI.
            </div>
          </div>
          <label style={{ display: 'block', border: '1.5px dashed #D9D3CC', borderRadius: 12, padding: '16px 14px', textAlign: 'center', cursor: canImport && phase === 'idle' ? 'pointer' : 'default', background: '#FAFAF8', opacity: canImport ? 1 : 0.6 }}>
            <input type="file" accept={ACCEPT} disabled={!canImport || phase !== 'idle'} style={{ display: 'none' }} onChange={e => { onFile(e.target.files); e.target.value = '' }} />
            <FileSpreadsheet size={20} style={{ color: TP_RED, display: 'block', margin: '0 auto' }} />
            <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK, marginTop: 5 }}>{phase === 'reading' ? (progress || 'Reading…') : 'Upload your filled-in template — or any other file'}</div>
            <div style={{ fontSize: 11, color: '#8A847E', marginTop: 3 }}>
              <Sparkles size={10} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 3 }} />Other layouts, PDFs, Word and photos of lists are read by AI. Up to 10 MB and {n(MAX_IMPORT_ROWS)} rows. You’ll see what will happen before anything is saved.
            </div>
          </label>
        </div>
      )}

      {phase === 'checking' && <div style={{ fontSize: 12, color: '#6B6560', marginTop: 6 }}><RefreshCw size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />{progress || 'Checking…'}</div>}

      {error && <div role="alert" style={{ marginTop: 10, fontSize: 12, color: TP_RED, fontWeight: 700, background: '#FBF3F2', borderRadius: 9, padding: '9px 11px' }}><AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />{error}</div>}

      {(phase === 'review' || phase === 'saving') && review && (
        <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>What will happen</div>
            <div style={{ fontSize: 11, color: '#6B6560' }}>
              {fileName} · {aiUsed ? <><Sparkles size={11} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 3, color: TP_RED }} />read with AI — please check</> : <><CheckCircle size={11} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 3, color: '#187A3C' }} />read from the template, no AI used</>} · nothing has been saved yet
            </div>
          </div>
          {tableView(review)}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {IMPACT_SAVE_ORDER.filter(c => found[c].length).map(c => (
              <label key={c} style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 11, color: TP_DARK, background: '#fff', border: '1px solid #E7E2DC', borderRadius: 8, padding: '4px 8px' }}>
                <input type="checkbox" checked={pick[c] !== false} disabled={phase === 'saving'} onChange={e => { setPick(p => ({ ...p, [c]: e.target.checked })); setStale(true) }} />
                {IMPACT_CATEGORY_LABEL[c]} <Pill tone="red">{found[c].length}</Pill>
              </label>
            ))}
          </div>

          {flagged.length > 0 && (
            <div style={{ border: '1px solid #E8CD9A', background: '#FCF8EE', borderRadius: 11, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#9A6A0B', marginBottom: 6 }}>
                <AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />Check these {n(flagged.length)} {flagged.length === 1 ? 'row' : 'rows'}
              </div>
              <div style={{ fontSize: 10.5, color: '#6B5A2E', marginBottom: 8 }}>Nothing here was guessed: a value that couldn’t be read is kept in the record’s notes, not saved as data. Untick a row to leave it out.</div>
              <div style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {flagged.map(({ c, r }, i) => (
                  <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fff', borderRadius: 8, padding: '7px 9px' }}>
                    <input type="checkbox" checked={!skip.has(r)} disabled={phase === 'saving'} onChange={e => { setSkip(s => { const x = new Set(s); if (e.target.checked) x.delete(r); else x.add(r); return x }); setStale(true) }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK }}>{recordLabel(c, r) || '(no name)'} <span style={{ fontWeight: 600, color: '#8A847E' }}>· {IMPACT_CATEGORY_LABEL[c]}</span></div>
                      {(r._review as string[]).map(m => <div key={m} style={{ fontSize: 10.5, color: '#6B5A2E' }}>• {m}</div>)}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {notes.length > 0 && <div style={{ fontSize: 11, color: '#8A847E' }}>Left out while reading: {notes.join(' · ')}</div>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {stale
              ? <button onClick={() => check()} style={btn(true)}><RefreshCw size={13} /> Update what will happen</button>
              : <button onClick={commit} disabled={!review.writes || phase === 'saving'} style={btn(true, !!review.writes && phase !== 'saving')}>
                  {phase === 'saving' ? (progress || 'Importing…') : review.writes ? `Import ${n(review.writes)} record${review.writes === 1 ? '' : 's'}` : 'Nothing new to import'}
                </button>}
            <button onClick={reset} disabled={phase === 'saving'} style={btn(false)}>Start again</button>
            <span style={{ fontSize: 10.5, color: '#8A847E' }}>Every import can be undone from the import history below.</span>
          </div>
        </div>
      )}

      {phase === 'done' && done && (
        <div style={{ marginTop: 6, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#187A3C' }}><CheckCircle size={14} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />Imported {n(done.writes)} record{done.writes === 1 ? '' : 's'} from {fileName}</div>
          {tableView(done)}
          <div style={{ fontSize: 11, color: '#6B6560' }}>Changed your mind? Undo it from the import history below.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.location.reload()} style={btn(true)}>Show it in the portal</button>
            <button onClick={reset} style={btn(false)}>Import another file</button>
          </div>
        </div>
      )}
      {busy && phase !== 'checking' && phase !== 'reading' && <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 6 }}>Keep this page open until it finishes.</div>}
    </Card>
  )
}
