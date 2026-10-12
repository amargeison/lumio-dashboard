'use client'

// Settings → Import data ("Bulk import from a spreadsheet or photo") for /impact
// portals — how a new organisation gets EVERYTHING in at setup. Same pipeline as
// Tennis Coach's importer, through the shared, product-agnostic engine
// (src/lib/import-engine), with Impact's own schema and routes:
//   Lumio template tabs  → mapped directly, no AI (src/lib/impact/import-template)
//   other spreadsheets   → opened in the browser, each tab mapped by the AI from a
//                          sample (/api/impact/import/map), every row mapped here
//   irregular tabs, PDFs, Word, photos, text → read by the AI (/api/impact/import)
//   → tidied (twins split, contacts routed, households from guardians) and
//     de-duplicated (src/lib/impact/import-tidy) → anything that didn't read
//     cleanly is listed for review → saved in link order
//     (/api/impact/import/save) as the signed-in HQ into Impact's tp_* tables.
// Only the org's HQ can import; the demo and visitors see it read-only.

import React, { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Lock, Download, Sparkles } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { readWorkbook, sheetSample, sheetChunks, SPREADSHEET_RE } from '@/lib/import-engine/read-workbook'
import { applyPlan, type SheetPlan, type Rec } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, IMPACT_IMPORT_CATEGORIES, IMPACT_SAVE_ORDER, IMPACT_CATEGORY_LABEL, type ImpactImportCategory } from '@/lib/impact/import-schema'
import { emptyFound, finalise, type Found } from '@/lib/impact/import-tidy'
import { templatePlan, downloadTemplate } from '@/lib/impact/import-template'

// The same file types Tennis Coach's importer takes.
const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xlsm,.xlsb,.xls,.ods,.docx,.pdf,.png,.jpg,.jpeg,.webp'
const MAX_FILES = 10
const MAX_CHUNKS = 40
const PARALLEL = 6
const SAVE_BATCH = 500

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || (res.status === 413 ? 'That file is too big.' : 'Something went wrong.'))
  return data
}

function merge(into: Found, extracted: Partial<Record<ImpactImportCategory, Rec[]>>) {
  for (const c of IMPACT_IMPORT_CATEGORIES) if (extracted[c]?.length) into[c].push(...extracted[c]!)
}

const labelOf = (c: ImpactImportCategory, r: Rec) =>
  c === 'programmes' ? `${r.school_name} · ${r.term_label ?? ''}`
  : c === 'registers' ? `${r.child_name} · ${r.session_date ?? 'no date'}`
  : c === 'donations' ? `${r.donor_name} · ${typeof r.amount === 'number' ? `£${r.amount}` : 'no amount'}`
  : String(r[IMPACT_IMPORT_SCHEMA.labelField[c]] ?? '')

export default function ImportCard() {
  const { org } = useImpact()
  const [phase, setPhase] = useState<'idle' | 'reading' | 'preview' | 'saving' | 'done'>('idle')
  const [progress, setProgress] = useState('')
  const [found, setFound] = useState<Found>(emptyFound())
  const [pick, setPick] = useState<Record<string, boolean>>({})
  const [skip, setSkip] = useState<Set<Rec>>(new Set())
  const [notes, setNotes] = useState<string[]>([])
  const [aiUsed, setAiUsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ line: string; details: string[] }[]>([])
  if (!org) return null
  const canImport = org.canEdit

  async function readFile(f: File, into: Found, skipped: string[], usedAi: { v: boolean }) {
    if (SPREADSHEET_RE.test(f.name)) {
      const sheets = await readWorkbook(f)
      if (!sheets.length) throw new Error(`${f.name} looks empty.`)
      // Template tabs map themselves; only the rest are shown to the AI.
      const plans: SheetPlan<ImpactImportCategory>[] = []
      const forAi = []
      for (const s of sheets) { const p = templatePlan(s); if (p) plans.push(p); else if (!/^read ?me$/i.test(s.name)) forAi.push(s) }
      for (let i = 0; i < forAi.length; i += 8) {
        usedAi.v = true
        setProgress(`Reading the tabs in ${f.name}…`)
        const batch = forAi.slice(i, i + 8)
        const { plans: p } = await postJson('/api/impact/import/map', { fileName: f.name, sheets: batch.map(s => ({ name: s.name, sample: sheetSample(s) })) })
        plans.push(...(p as SheetPlan<ImpactImportCategory>[]))
      }
      const leftover = []
      for (const s of sheets) {
        const mine = plans.filter(p => p.sheet === s.name)
        let got = 0
        for (const p of mine) {
          if (p.category === 'skip') { got = -1; continue }
          if (p.irregular) continue
          const recs = applyPlan(IMPACT_IMPORT_SCHEMA, p, s.rows, s.banners, skipped)
          into[p.category].push(...recs)
          got += recs.length
        }
        if (got === 0 && mine.length) leftover.push(s)
      }
      // Tabs the mapping couldn't handle are read by the AI, piece by piece.
      const chunks = leftover.flatMap(s => sheetChunks(s).map(text => ({ text, label: `${f.name} — ${s.name}` }))).slice(0, MAX_CHUNKS)
      for (let i = 0; i < chunks.length; i += PARALLEL) {
        usedAi.v = true
        setProgress(`Reading ${f.name} (${Math.min(i + PARALLEL, chunks.length)} of ${chunks.length})…`)
        const parts = await Promise.all(chunks.slice(i, i + PARALLEL).map(c => postJson('/api/impact/import', c)))
        for (const r of parts) merge(into, r.extracted || {})
      }
      return
    }
    usedAi.v = true
    setProgress(`Reading ${f.name}…`)
    const fd = new FormData()
    fd.append('file', f)
    const res = await fetch('/api/impact/import', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || (res.status === 413 ? 'That file is too big.' : `Could not read ${f.name}.`))
    merge(into, data.extracted || {})
    if (data.truncated) skipped.push(`${f.name} was long — only the first part was read.`)
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length || !canImport) return
    setError(null); setResult([]); setPhase('reading')
    const into = emptyFound()
    const skipped: string[] = []
    const usedAi = { v: false }
    try {
      for (const f of [...list].slice(0, MAX_FILES)) {
        if (!new RegExp(`(${ACCEPT.split(',').map(e => e.replace('.', '\\.')).join('|')})$`, 'i').test(f.name)) throw new Error(`${f.name}: that file type isn’t supported.`)
        if (!f.size) throw new Error(`${f.name} is empty.`)
        await readFile(f, into, skipped, usedAi)
      }
      const done = finalise(into)
      setFound(done); setNotes(skipped.slice(0, 8)); setAiUsed(usedAi.v)
      setPick(Object.fromEntries(IMPACT_SAVE_ORDER.map(c => [c, true]))); setSkip(new Set())
      setPhase('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.'); setPhase('idle')
    } finally { setProgress('') }
  }

  async function save() {
    setPhase('saving'); setError(null)
    const lines: { line: string; details: string[] }[] = []
    try {
      for (const c of IMPACT_SAVE_ORDER) {
        const rows = found[c].filter(r => !skip.has(r))
        if (!pick[c] || !rows.length) continue
        let inserted = 0, already = 0, updated = 0
        const unmatched: Record<string, Set<string>> = {}
        for (let i = 0; i < rows.length; i += SAVE_BATCH) {
          setProgress(`Saving ${IMPACT_CATEGORY_LABEL[c].toLowerCase()}…`)
          const r = await postJson('/api/impact/import/save', { category: c, rows: rows.slice(i, i + SAVE_BATCH) })
          inserted += r.inserted || 0; already += r.already || 0; updated += r.updated || 0
          for (const [k, v] of Object.entries((r.unmatched || {}) as Record<string, string[]>)) for (const n of v) (unmatched[k] ||= new Set()).add(n)
        }
        lines.push({
          line: `${IMPACT_CATEGORY_LABEL[c]}: ${inserted} added${already ? `, ${already} already there` : ''}${updated ? `, ${updated} updated` : ''}`,
          details: Object.entries(unmatched).map(([k, v]) => `${k}: ${[...v].slice(0, 4).join(', ')}${v.size > 4 ? '…' : ''}`),
        })
      }
      setResult(lines); setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Saving failed.'); setResult(lines); setPhase('preview')
    } finally { setProgress('') }
  }

  const flagged = IMPACT_SAVE_ORDER.flatMap(c => found[c].filter(r => Array.isArray(r._review) && (r._review as string[]).length).map(r => ({ c, r })))
  const total = IMPACT_SAVE_ORDER.reduce((n, c) => n + (pick[c] ? found[c].filter(r => !skip.has(r)).length : 0), 0)
  const btn = (primary: boolean) => ({ background: primary ? TP_RED : '#fff', color: primary ? '#fff' : TP_DARK, border: primary ? 'none' : '1px solid #E7E2DC', borderRadius: 9, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer' } as const)

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="Bulk import from a spreadsheet or photo — schools, programmes, venues, coaches, volunteers, families, children, registers, fundraising and feedback">
          <Upload size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Import data
        </SectionTitle>
        <button onClick={() => downloadTemplate()} style={{ ...btn(false), display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 11.5 }}>
          <Download size={13} /> Download import template
        </button>
      </div>
      <div style={{ fontSize: 11, color: '#8A847E', marginBottom: 10 }}>
        Files laid out on the template import instantly with no AI. Anything else — your own spreadsheets, PDFs, photos of lists — is read by AI and shown to you before anything is saved.
      </div>
      {!canImport && (
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 9, padding: '9px 11px', marginBottom: 10 }}>
          <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {org.readOnlyReason ?? 'Sign in as this organisation’s HQ to import data.'}
        </div>
      )}

      {(phase === 'idle' || phase === 'reading') && (
        <label style={{ display: 'block', border: '1.5px dashed #D9D3CC', borderRadius: 12, padding: '18px 14px', textAlign: 'center', cursor: canImport && phase === 'idle' ? 'pointer' : 'default', background: '#FAFAF8', opacity: canImport ? 1 : 0.6 }}>
          <input type="file" multiple accept={ACCEPT} disabled={!canImport || phase !== 'idle'} style={{ display: 'none' }} onChange={e => { onFiles(e.target.files); e.target.value = '' }} />
          <FileSpreadsheet size={22} style={{ color: TP_RED }} />
          <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK, marginTop: 6 }}>{phase === 'reading' ? (progress || 'Reading…') : 'Choose files to import'}</div>
          <div style={{ fontSize: 11, color: '#8A847E', marginTop: 3 }}>Excel, CSV, Google Sheets export, PDF, Word or a photo of a list · up to {MAX_FILES} files</div>
        </label>
      )}

      {error && <div style={{ marginTop: 10, fontSize: 12, color: TP_RED, fontWeight: 700 }}><AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />{error}</div>}

      {(phase === 'preview' || phase === 'saving') && (
        <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
          <div style={{ fontSize: 11, color: '#6B6560' }}>
            {aiUsed ? <><Sparkles size={11} style={{ verticalAlign: '-1px', marginRight: 4, color: TP_RED }} />Read with AI — please check before importing.</> : <><CheckCircle size={11} style={{ verticalAlign: '-1px', marginRight: 4, color: '#187A3C' }} />Read from the template — no AI used.</>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {IMPACT_SAVE_ORDER.filter(c => found[c].length).map(c => (
              <label key={c} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#F7F5F2', borderRadius: 10, padding: '9px 11px' }}>
                <input type="checkbox" checked={!!pick[c]} disabled={phase === 'saving'} onChange={e => setPick(p => ({ ...p, [c]: e.target.checked }))} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>{IMPACT_CATEGORY_LABEL[c]} <Pill tone="red">{found[c].filter(r => !skip.has(r)).length}</Pill></div>
                  <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{found[c].slice(0, 4).map(r => labelOf(c, r)).join(' · ')}</div>
                </div>
              </label>
            ))}
          </div>
          {!IMPACT_SAVE_ORDER.some(c => found[c].length) && <div style={{ fontSize: 12, color: '#8A847E' }}>Nothing importable was found in those files.</div>}

          {flagged.length > 0 && (
            <div style={{ border: '1px solid #E8CD9A', background: '#FCF8EE', borderRadius: 11, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#9A6A0B', marginBottom: 6 }}>
                <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Needs review — {flagged.length} {flagged.length === 1 ? 'row' : 'rows'}
              </div>
              <div style={{ fontSize: 10.5, color: '#6B5A2E', marginBottom: 8 }}>Nothing here was guessed: values that couldn’t be read are kept in the record’s notes, not saved as data. Untick any row you don’t want imported.</div>
              <div style={{ display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {flagged.map(({ c, r }, i) => (
                  <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fff', borderRadius: 8, padding: '7px 9px' }}>
                    <input type="checkbox" checked={!skip.has(r)} disabled={phase === 'saving'} onChange={e => setSkip(s => { const n = new Set(s); if (e.target.checked) n.delete(r); else n.add(r); return n })} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK }}>{labelOf(c, r) || '(no name)'} <span style={{ fontWeight: 600, color: '#8A847E' }}>· {IMPACT_CATEGORY_LABEL[c]}</span></div>
                      {(r._review as string[]).map(m => <div key={m} style={{ fontSize: 10.5, color: '#6B5A2E' }}>• {m}</div>)}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {notes.length > 0 && <div style={{ fontSize: 11, color: '#8A847E' }}>Left out: {notes.join(' · ')}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={save} disabled={!total || phase === 'saving'} style={{ ...btn(true), background: total ? TP_RED : '#D9D3CC' }}>
              {phase === 'saving' ? (progress || 'Importing…') : `Import ${total} record${total === 1 ? '' : 's'}`}
            </button>
            <button onClick={() => { setPhase('idle'); setFound(emptyFound()) }} disabled={phase === 'saving'} style={btn(false)}>Start again</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ marginTop: 4 }}>
          {result.length === 0 && <div style={{ fontSize: 12.5, color: '#6B6560' }}>Nothing was selected to import.</div>}
          {result.map(l => (
            <div key={l.line} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12.5, color: TP_DARK }}><CheckCircle size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: '#187A3C' }} />{l.line}</div>
              {l.details.map(d => <div key={d} style={{ fontSize: 11, color: '#9A6A0B', marginLeft: 19 }}>{d}</div>)}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => window.location.reload()} style={btn(true)}>Show it in the portal</button>
            <button onClick={() => { setPhase('idle'); setFound(emptyFound()); setResult([]) }} style={btn(false)}>Import more</button>
          </div>
        </div>
      )}
    </Card>
  )
}
