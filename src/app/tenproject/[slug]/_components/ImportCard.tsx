'use client'

// Settings → Import data ("Bulk import from a spreadsheet or photo") for /impact
// portals. Same pipeline as Tennis Coach's importer, through the shared,
// product-agnostic engine (src/lib/import-engine):
//   spreadsheets → opened in the browser → AI maps each tab from a sample
//                  (/api/impact/import/map) → every row mapped here
//   irregular tabs, PDFs, Word, photos, text → AI reads them
//                  (/api/impact/import, chunked for big tabs)
//   → de-duplicated → reviewed → saved (/api/impact/import/save), as the
//     signed-in HQ into tp_schools / tp_programmes (RLS hq_id = auth.uid()).
// Only the org's HQ can import; demo and visitors see it read-only.

import React, { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { readWorkbook, sheetSample, sheetChunks, SPREADSHEET_RE } from '@/lib/import-engine/read-workbook'
import { applyPlan, dedupeRecords, type SheetPlan, type Rec } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, IMPACT_IMPORT_CATEGORIES, IMPACT_CATEGORY_LABEL, type ImpactImportCategory } from '@/lib/impact/import-schema'

// The same file types Tennis Coach's importer takes.
const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xlsm,.xlsb,.xls,.ods,.docx,.pdf,.png,.jpg,.jpeg,.webp'
const MAX_FILES = 10
const MAX_CHUNKS = 40
const PARALLEL = 6
const SAVE_BATCH = 500

type Found = Record<ImpactImportCategory, Rec[]>
const empty = (): Found => ({ schools: [], programmes: [] })

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || (res.status === 413 ? 'That file is too big.' : 'Something went wrong.'))
  return data
}

function merge(into: Found, extracted: Partial<Record<ImpactImportCategory, Rec[]>>) {
  for (const c of IMPACT_IMPORT_CATEGORIES) if (extracted[c]?.length) into[c].push(...extracted[c]!)
}

export default function ImportCard() {
  const { org } = useImpact()
  const [phase, setPhase] = useState<'idle' | 'reading' | 'preview' | 'saving' | 'done'>('idle')
  const [progress, setProgress] = useState('')
  const [found, setFound] = useState<Found>(empty())
  const [pick, setPick] = useState<Record<ImpactImportCategory, boolean>>({ schools: true, programmes: true })
  const [notes, setNotes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string[]>([])
  if (!org) return null
  const canImport = org.canEdit

  async function readFile(f: File, into: Found, skipped: string[]) {
    if (SPREADSHEET_RE.test(f.name)) {
      const sheets = await readWorkbook(f)
      if (!sheets.length) throw new Error(`${f.name} looks empty.`)
      // Map tabs from samples (batched), then map every row here.
      const plans: SheetPlan<ImpactImportCategory>[] = []
      for (let i = 0; i < sheets.length; i += 8) {
        const batch = sheets.slice(i, i + 8)
        setProgress(`Reading the tabs in ${f.name}…`)
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
        if (got === 0) leftover.push(s)
      }
      // Tabs the mapping couldn't handle are read by the AI, piece by piece.
      const chunks = leftover.flatMap(s => sheetChunks(s).map(text => ({ text, label: `${f.name} — ${s.name}` }))).slice(0, MAX_CHUNKS)
      for (let i = 0; i < chunks.length; i += PARALLEL) {
        setProgress(`Reading ${f.name} (${Math.min(i + PARALLEL, chunks.length)} of ${chunks.length})…`)
        const parts = await Promise.all(chunks.slice(i, i + PARALLEL).map(c => postJson('/api/impact/import', c)))
        for (const r of parts) merge(into, r.extracted || {})
      }
      return
    }
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
    const into = empty()
    const skipped: string[] = []
    try {
      const files = [...list].slice(0, MAX_FILES)
      for (const f of files) {
        if (!new RegExp(`(${ACCEPT.split(',').map(e => e.replace('.', '\\.')).join('|')})$`, 'i').test(f.name)) throw new Error(`${f.name}: that file type isn’t supported.`)
        if (!f.size) throw new Error(`${f.name} is empty.`)
        await readFile(f, into, skipped)
      }
      for (const c of IMPACT_IMPORT_CATEGORIES) into[c] = dedupeRecords(IMPACT_IMPORT_SCHEMA, c, into[c])
      setFound(into); setNotes(skipped.slice(0, 8)); setPhase('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.'); setPhase('idle')
    } finally { setProgress('') }
  }

  async function save() {
    setPhase('saving'); setError(null)
    const lines: string[] = []
    try {
      // Schools first — programmes are linked to them by name.
      for (const c of IMPACT_IMPORT_CATEGORIES) {
        if (!pick[c] || !found[c].length) continue
        let inserted = 0, already = 0
        const noSchool = new Set<string>()
        for (let i = 0; i < found[c].length; i += SAVE_BATCH) {
          const r = await postJson('/api/impact/import/save', { category: c, rows: found[c].slice(i, i + SAVE_BATCH) })
          inserted += r.inserted || 0; already += r.already || 0
          for (const n of r.noSchool || []) noSchool.add(n)
        }
        lines.push(`${IMPACT_CATEGORY_LABEL[c]}: ${inserted} added${already ? `, ${already} already there` : ''}${noSchool.size ? ` — ${noSchool.size} left out (no matching school: ${[...noSchool].slice(0, 3).join(', ')}${noSchool.size > 3 ? '…' : ''})` : ''}`)
      }
      setResult(lines); setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Saving failed.'); setResult(lines); setPhase('preview')
    }
  }

  const total = IMPACT_IMPORT_CATEGORIES.reduce((n, c) => n + (pick[c] ? found[c].length : 0), 0)

  return (
    <Card>
      <SectionTitle sub="Bulk import from a spreadsheet or photo — schools and programmes from your existing lists">
        <Upload size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Import data
      </SectionTitle>
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
        <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          {IMPACT_IMPORT_CATEGORIES.map(c => (
            <label key={c} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F7F5F2', borderRadius: 10, padding: '10px 12px', opacity: found[c].length ? 1 : 0.55 }}>
              <input type="checkbox" checked={pick[c] && found[c].length > 0} disabled={!found[c].length || phase === 'saving'} onChange={e => setPick(p => ({ ...p, [c]: e.target.checked }))} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>{IMPACT_CATEGORY_LABEL[c]} <Pill tone={found[c].length ? 'red' : 'grey'}>{found[c].length}</Pill></div>
                <div style={{ fontSize: 11, color: '#6B6560', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {found[c].slice(0, 4).map(r => c === 'programmes' ? `${r.school_name} · ${r.term_label ?? ''}` : String(r.name)).join(' · ') || 'None found'}
                </div>
              </div>
            </label>
          ))}
          {notes.length > 0 && <div style={{ fontSize: 11, color: '#8A847E' }}>Left out: {notes.join(' · ')}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!total || phase === 'saving'} style={{ background: total ? TP_RED : '#D9D3CC', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: total ? 'pointer' : 'default' }}>
              {phase === 'saving' ? 'Importing…' : `Import ${total} record${total === 1 ? '' : 's'}`}
            </button>
            <button onClick={() => { setPhase('idle'); setFound(empty()) }} disabled={phase === 'saving'} style={{ background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Start again</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ marginTop: 4 }}>
          {result.map(l => <div key={l} style={{ fontSize: 12.5, color: TP_DARK, marginBottom: 4 }}><CheckCircle size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: '#187A3C' }} />{l}</div>)}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => window.location.reload()} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Show it in the portal</button>
            <button onClick={() => { setPhase('idle'); setFound(empty()); setResult([]) }} style={{ background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Import more</button>
          </div>
        </div>
      )}
    </Card>
  )
}
