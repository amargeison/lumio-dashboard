'use client'

// AI bulk import — upload a CSV / Excel / PDF / image of players, coaches,
// courts, camps, equipment or payments; Claude works out what's what; preview
// and import into the right modules. Renders as an inline card (Settings) and
// inside the onboarding wizard.

import { useRef, useState } from 'react'
import { invalidateCoachTable, type CoachTable } from '../_lib/coach-db'

type ThemeTokens = { text: string; text2: string; text3: string; panel: string; panel2: string; border: string; btnText: string; isDark: boolean }
type AccentTokens = { hex: string; dim: string }

const CATEGORIES: { key: string; table: CoachTable; label: string }[] = [
  { key: 'players', table: 'coach_players', label: 'Players' },
  { key: 'staff', table: 'coach_staff', label: 'Coaches & staff' },
  { key: 'courts', table: 'coach_courts', label: 'Courts' },
  { key: 'camps', table: 'coach_camps', label: 'Training camps' },
  { key: 'equipment', table: 'coach_equipment', label: 'Equipment' },
  { key: 'payments', table: 'coach_payments', label: 'Payments' },
  { key: 'resources', table: 'coach_resources', label: 'Resources' },
]
const labelField: Record<string, string> = { players: 'name', staff: 'name', courts: 'name', camps: 'name', equipment: 'item', payments: 'player_name', resources: 'title' }
// Blank starter spreadsheet (players / coaches / courts / camps / equipment /
// payments tabs) for coaches who don't have their own records to upload yet.
// The same file is linked from onboarding and emailed on "Set it up for me".
export const IMPORT_TEMPLATE_URL = '/templates/lumio-coach-import-template.xlsx'
// Whitelist of columns per table — guards against unexpected AI keys breaking inserts.
// (The server applies the same list again: /api/coach/import/save.)
const FIELDS: Record<string, string[]> = {
  players: ['name', 'category', 'age', 'parent_name', 'racket_stage', 'goal', 'level', 'email', 'phone', 'notes'],
  staff: ['name', 'role', 'email', 'phone', 'qualifications', 'notes'],
  courts: ['name', 'surface', 'location', 'hours', 'status', 'notes'],
  camps: ['name', 'start_date', 'end_date', 'capacity', 'price', 'location', 'notes'],
  equipment: ['item', 'category', 'quantity', 'status', 'notes'],
  payments: ['player_name', 'item', 'amount', 'status', 'due_date', 'notes'],
  resources: ['title', 'type', 'url', 'category', 'notes'],
}

// Up to ten files in one go — a coach's players, coaches and camps usually live
// in separate spreadsheets, and asking for them one at a time (with a full
// import between each) was the slowest part of onboarding.
const MAX_FILES = 10
const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xls,.docx,.pdf,.png,.jpg,.jpeg,.webp'

type FileState = { name: string; state: 'waiting' | 'reading' | 'done' | 'failed'; found?: number; error?: string }

export function CoachImport({ T, accent, onImported }: { T: ThemeTokens; accent: AccentTokens; onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'reading' | 'preview' | 'importing' | 'done'>('idle')
  const [files, setFiles] = useState<FileState[]>([])
  const [extracted, setExtracted] = useState<Record<string, Record<string, unknown>[]>>({})
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [err, setErr] = useState('')
  const [result, setResult] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const readOne = async (f: File): Promise<Record<string, Record<string, unknown>[]>> => {
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch('/api/coach/import', { method: 'POST', body: fd })
    // Read as text first so a non-JSON response (timeout / proxy error page)
    // surfaces a real message instead of a cryptic "Unexpected token <".
    const raw = await res.text()
    let data: { error?: string; extracted?: Record<string, Record<string, unknown>[]> } = {}
    try { data = raw ? JSON.parse(raw) : {} } catch { /* non-JSON response */ }
    if (!res.ok) throw new Error(data.error || (raw ? raw.slice(0, 200) : `Import failed (HTTP ${res.status})`))
    return data.extracted || {}
  }

  const onFiles = async (list: FileList | File[]) => {
    const all = Array.from(list)
    if (!all.length) return
    const chosen = all.slice(0, MAX_FILES)
    setErr(all.length > MAX_FILES ? `Up to ${MAX_FILES} files at a time — the first ${MAX_FILES} are being read.` : '')
    setResult(''); setStatus('reading')
    setFiles(chosen.map(f => ({ name: f.name, state: 'waiting' })))
    // One at a time: each file is its own AI read, and ten at once would trip
    // the rate limit and time out together.
    const merged: Record<string, Record<string, unknown>[]> = {}
    for (let i = 0; i < chosen.length; i++) {
      setFiles(fs => fs.map((x, j) => j === i ? { ...x, state: 'reading' } : x))
      try {
        const ex = await readOne(chosen[i])
        let found = 0
        for (const c of CATEGORIES) {
          const rows = Array.isArray(ex[c.key]) ? ex[c.key] : []
          if (rows.length) { merged[c.key] = [...(merged[c.key] || []), ...rows]; found += rows.length }
        }
        setFiles(fs => fs.map((x, j) => j === i ? { ...x, state: 'done', found } : x))
      } catch (e) {
        setFiles(fs => fs.map((x, j) => j === i ? { ...x, state: 'failed', error: e instanceof Error ? e.message : 'Could not read this file' } : x))
      }
    }
    setExtracted(merged)
    setPicked(Object.fromEntries(CATEGORIES.map(c => [c.key, (merged[c.key]?.length ?? 0) > 0])))
    const any = CATEGORIES.some(c => (merged[c.key]?.length ?? 0) > 0)
    if (!any) setErr(e => e || 'We could not find any records in those files.')
    setStatus(any ? 'preview' : 'idle')
    if (fileRef.current) fileRef.current.value = ''
  }

  const totalFound = CATEGORIES.reduce((s, c) => s + (extracted[c.key]?.length ?? 0), 0)
  const totalSelected = CATEGORIES.reduce((s, c) => s + (picked[c.key] ? (extracted[c.key]?.length ?? 0) : 0), 0)

  const doImport = async () => {
    setStatus('importing'); setErr('')
    let inserted = 0
    const failures: string[] = []
    for (const c of CATEGORIES) {
      if (!picked[c.key] || !(extracted[c.key]?.length)) continue
      const allowed = FIELDS[c.key]
      const rows = (extracted[c.key] || []).map(row => {
        const clean: Record<string, unknown> = {}
        for (const k of allowed) if (row[k] !== undefined && row[k] !== null && row[k] !== '') clean[k] = row[k]
        return clean
      }).filter(r => Object.keys(r).length)
      try {
        const res = await fetch('/api/coach/import/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: c.key, rows }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `Could not save ${c.label.toLowerCase()}`)
        inserted += Number(data.inserted) || 0
        invalidateCoachTable(c.table)
        setPicked(p => ({ ...p, [c.key]: false }))
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `Could not save ${c.label.toLowerCase()}`)
      }
    }
    if (failures.length) {
      setErr(failures.join(' · ') + (inserted ? ` (${inserted} other record${inserted === 1 ? '' : 's'} saved)` : ''))
      setStatus('preview')
      if (inserted) onImported?.()
      return
    }
    setResult(`Imported ${inserted} record${inserted === 1 ? '' : 's'} ✓`)
    setStatus('done')
    onImported?.()
  }

  const reset = () => { setExtracted({}); setPicked({}); setFiles([]); setStatus('idle'); setErr(''); setResult(''); if (fileRef.current) fileRef.current.value = '' }

  const fileList = files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '0 0 12px' }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, color: T.text2 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name}</span>
          <span style={{ flex: 'none', color: f.state === 'failed' ? '#EF4444' : f.state === 'done' ? '#22C55E' : T.text3 }} title={f.error}>
            {f.state === 'waiting' ? 'Waiting…' : f.state === 'reading' ? 'Reading…' : f.state === 'done' ? `${f.found} found` : 'Could not read'}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
      <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Import from files ✨</h3>
      <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Upload spreadsheets, PDFs or photos of your players, coaches, camps, courts, equipment or payments — up to {MAX_FILES} at once. The AI sorts them and adds them for you. CSV, Excel, PDF and images all work.</p>

      <input ref={fileRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.length) onFiles(e.target.files) }} />

      {(status === 'idle' || status === 'reading') && (
        <div>
          {status === 'reading' && fileList}
          <button onClick={() => fileRef.current?.click()} disabled={status === 'reading'}
            onDragOver={e => { e.preventDefault(); if (status === 'idle') setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (status === 'idle' && e.dataTransfer.files?.length) onFiles(e.dataTransfer.files) }}
            style={{ padding: '16px 18px', borderRadius: 10, border: `1px dashed ${accent.hex}`, background: dragOver ? accent.hex + '33' : accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            {status === 'reading'
              ? `Reading ${Math.min(files.filter(f => f.state === 'done' || f.state === 'failed').length + 1, files.length)} of ${files.length}…`
              : `⬆ Choose files or drop them here (up to ${MAX_FILES})`}
          </button>
          <p style={{ fontSize: 12, color: T.text3, margin: '10px 0 0', textAlign: 'center' }}>
            No records to upload yet?{' '}
            <a href={IMPORT_TEMPLATE_URL} download style={{ color: accent.hex, fontWeight: 600, textDecoration: 'none' }}>Download the Lumio template ⤓</a>
            {' '}— fill it in and upload it here.
          </p>
        </div>
      )}

      {status === 'preview' && (
        <div>
          {fileList}
          <p style={{ fontSize: 12.5, color: T.text2, margin: '0 0 12px' }}>Found <b style={{ color: T.text }}>{totalFound}</b> record{totalFound === 1 ? '' : 's'}. Pick what to import:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {CATEGORIES.filter(c => (extracted[c.key]?.length ?? 0) > 0).map(c => {
              const rows = extracted[c.key] || []
              return (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!picked[c.key]} onChange={e => setPicked(p => ({ ...p, [c.key]: e.target.checked }))} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.label} <span style={{ color: accent.hex }}>· {rows.length}</span></div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rows.slice(0, 6).map(r => r[labelField[c.key]]).filter(Boolean).join(', ')}</div>
                  </div>
                </label>
              )
            })}
          </div>
          {err && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 10px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={doImport} disabled={totalSelected === 0} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: totalSelected === 0 ? 0.5 : 1 }}>Import {totalSelected} record{totalSelected === 1 ? '' : 's'}</button>
            <button onClick={reset} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {status === 'importing' && <p style={{ fontSize: 13, color: T.text3 }}>Importing…</p>}

      {status === 'done' && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', margin: '0 0 12px' }}>{result}</p>
          <button onClick={reset} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Import more files</button>
        </div>
      )}

      {err && status === 'idle' && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</p>}
    </div>
  )
}
