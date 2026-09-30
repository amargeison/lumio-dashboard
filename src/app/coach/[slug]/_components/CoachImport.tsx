'use client'

// AI bulk import — upload a CSV / Excel / PDF / image of players, coaches,
// courts, camps, equipment or payments; Claude works out what's what; preview
// and import into the right modules. Renders as an inline card (Settings, the
// empty dashboard) and inside the onboarding wizard.
//
// What it found is kept per TAB, not per category, because that is the level
// at which a guess is right or wrong: a whole tab of clubs abroad is either
// camps or it is not. Anything the AI was not sure of is put to the coach as a
// question — "We think these are Training camps — Yes / No, they're… / Don't
// import" — before a single row is saved. A tidy-up pass then merges the same
// camp listed on every attendee's row into one camp.

import { useEffect, useRef, useState } from 'react'
import { invalidateCoachTable, type CoachTable } from '../_lib/coach-db'
import {
  applyPlan, cleanRecord, convertRecord, dedupeRecords, CATEGORY_LABEL, IMPORT_CATEGORIES, LABEL_FIELD,
  type ImportCategory, type SheetPlan,
} from '@/lib/coach/import-records'
import { readWorkbook, sheetSample, sheetChunks, SPREADSHEET_RE, type SheetData } from '@/lib/coach/read-workbook'

type ThemeTokens = { text: string; text2: string; text3: string; panel: string; panel2: string; border: string; btnText: string; isDark: boolean }
type AccentTokens = { hex: string; dim: string }
type Rec = Record<string, unknown>

const TABLE: Record<ImportCategory, CoachTable> = {
  players: 'coach_players', staff: 'coach_staff', courts: 'coach_courts', camps: 'coach_camps',
  equipment: 'coach_equipment', payments: 'coach_payments', resources: 'coach_resources',
}
// Blank starter spreadsheet (players / coaches / courts / camps / equipment /
// payments tabs) for coaches who don't have their own records to upload yet.
// The same file is linked from onboarding and emailed on "Set it up for me".
export const IMPORT_TEMPLATE_URL = '/templates/lumio-coach-import-template.xlsx'

// Up to ten files in one go — a coach's players, coaches and camps usually live
// in separate spreadsheets, and asking for them one at a time (with a full
// import between each) was the slowest part of onboarding.
const MAX_FILES = 10
const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xlsm,.xlsb,.xls,.ods,.docx,.pdf,.png,.jpg,.jpeg,.webp'
// A tab that is not one record per row is read by the AI in pieces. This caps
// how many pieces one file can take (about 280,000 characters of such tabs).
const MAX_CHUNKS = 40
// How many AI reads run at once — for the pieces, and for the tab mapping.
const PARALLEL = 6
const SAVE_BATCH = 500

type Confidence = 'high' | 'medium' | 'low'
/** Everything one tab (or one document) contributed to one category. */
type Group = {
  id: string
  file: string
  tab?: string
  category: ImportCategory        // what the AI said
  target: ImportCategory          // where it will go (the coach may change it)
  records: Rec[]
  confidence: Confidence
  reason?: string
  decision: 'pending' | 'yes' | 'skip'
}
type FileState = { name: string; state: 'waiting' | 'reading' | 'done' | 'failed'; found?: number; error?: string; detail?: string; note?: string }

/** Handed to a parent (the onboarding wizard, the Settings modal) while records are found but not imported. */
export type PendingImport = { count: number; run: () => Promise<boolean> }

let groupSeq = 0
const newGroup = (g: Omit<Group, 'id' | 'target' | 'decision'>): Group => ({
  ...g, id: `g${++groupSeq}`, target: g.category,
  records: dedupeRecords(g.category, g.records),
  decision: g.confidence === 'high' ? 'yes' : 'pending',
})

/**
 * Second opinions the AI cannot give itself, from the shape of what it found.
 * Only ever lowers confidence — a group is asked about, never silently moved.
 */
function sanityCheck(groups: Group[]): Group[] {
  const players = new Set(groups.filter(g => g.category === 'players').flatMap(g => g.records.map(r => String(r.name ?? '').trim().toLowerCase())).filter(Boolean))
  const firstNames = new Set([...players].map(n => n.split(' ')[0]))
  return groups.map(g => {
    const lower = (reason: string, to: Confidence = 'low'): Group =>
      g.confidence === 'high' || (g.confidence === 'medium' && to === 'low')
        ? { ...g, confidence: to, reason, decision: 'pending' }
        : g
    if (g.category === 'resources' && g.records.length >= 3 && !g.records.some(r => r.url)) {
      return lower('None of these has a link or a file — resources are drills, videos and documents. They may be places or camps.')
    }
    if (g.category === 'courts' && g.records.length > 25) {
      return lower(`That is ${g.records.length} courts — are these your own courts, or places you have been to?`, 'medium')
    }
    if (g.category === 'payments' && players.size && g.records.length >= 2) {
      const matches = g.records.filter(r => {
        const n = String(r.player_name ?? '').trim().toLowerCase()
        return players.has(n) || firstNames.has(n.split(' ')[0])
      }).length
      if (matches / g.records.length < 0.3) return lower('These names do not match your players — they may be costs the academy pays rather than payments from families.')
    }
    return g
  })
}

export function CoachImport({ T, accent, onImported, onPendingChange }: {
  T: ThemeTokens; accent: AccentTokens
  onImported?: () => void
  /** Told whenever there are records found but not yet imported, so a Continue/Close can ask first. */
  onPendingChange?: (p: PendingImport | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'reading' | 'preview' | 'importing' | 'done'>('idle')
  const [fileNote, setFileNote] = useState('')
  const [files, setFiles] = useState<FileState[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [picked, setPicked] = useState<Partial<Record<ImportCategory, boolean>>>({})
  const [err, setErr] = useState('')
  const [result, setResult] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [changing, setChanging] = useState<string | null>(null)

  const postJson = async <R,>(url: string, body: unknown): Promise<R> => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const raw = await res.text()
    let data: { error?: string } = {}
    try { data = raw ? JSON.parse(raw) : {} } catch { /* non-JSON response */ }
    if (!res.ok) throw new Error(data.error || (raw ? raw.slice(0, 200) : `Import failed (HTTP ${res.status})`))
    return data as R
  }

  const fromExtracted = (ex: Record<string, Rec[]> | undefined, file: string, tab: string | undefined, confidence: (c: ImportCategory) => Confidence, reason?: string): Group[] =>
    IMPORT_CATEGORIES.filter(c => Array.isArray(ex?.[c]) && ex![c].length)
      .map(c => newGroup({ file, tab, category: c, records: ex![c], confidence: confidence(c), reason }))

  // PDFs, Word files and photos: the file goes to the server and the AI reads it.
  const readDocument = async (f: File): Promise<{ groups: Group[]; note?: string }> => {
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch('/api/coach/import', { method: 'POST', body: fd })
    // Read as text first so a non-JSON response (timeout / proxy error page)
    // surfaces a real message instead of a cryptic "Unexpected token <".
    const raw = await res.text()
    let data: { error?: string; extracted?: Record<string, Rec[]>; truncated?: boolean } = {}
    try { data = raw ? JSON.parse(raw) : {} } catch { /* non-JSON response */ }
    if (!res.ok) throw new Error(data.error || (res.status === 413 ? 'That file is too big to upload — try a smaller PDF, or a spreadsheet.' : raw ? raw.slice(0, 200) : `Import failed (HTTP ${res.status})`))
    return { groups: fromExtracted(data.extracted, f.name, undefined, () => 'high'), note: data.truncated ? 'Long file — the last part may be missing' : undefined }
  }

  // Spreadsheets: opened here, every tab. The AI sees a sample of each tab and
  // says what the columns mean; the rows are turned into records in the
  // browser, so a workbook of any size costs one short AI call per few tabs.
  const readSpreadsheet = async (f: File, say: (d: string) => void): Promise<{ groups: Group[]; note?: string }> => {
    say('Opening…')
    let sheets: SheetData[]
    try { sheets = await readWorkbook(f) }
    catch { throw new Error('Could not open this spreadsheet. If it is password-protected, remove the password and try again.') }
    if (!sheets.length) throw new Error('This spreadsheet has no data in it.')

    // Group the tab samples so each AI call stays small.
    const samples = sheets.map(sh => ({ name: sh.name, sample: sheetSample(sh) }))
    const batches: typeof samples[] = []
    let cur: typeof samples = []; let size = 0
    for (const s of samples) {
      if (cur.length && (size + s.sample.length > 50000 || cur.length >= 8)) { batches.push(cur); cur = []; size = 0 }
      cur.push(s); size += s.sample.length
    }
    if (cur.length) batches.push(cur)

    // All batches at once, each tried twice: a tab that cannot be mapped falls
    // back to being read row by row, which is by far the slowest path.
    say(sheets.length === 1 ? 'Working out the columns…' : `Working out ${sheets.length} tabs…`)
    let mapFailed = 0
    const planSets = await Promise.all(batches.map(async b => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { plans: p } = await postJson<{ plans: SheetPlan[] }>('/api/coach/import/map', { fileName: f.name, sheets: b })
          return p || []
        } catch (e) { console.warn('[import] map', e) }
      }
      mapFailed += b.length
      return [] as SheetPlan[]
    }))
    const norm = (n: string) => n.trim().toLowerCase()
    const plans: SheetPlan[] = planSets.flat().map(p => {
      const real = sheets.find(sh => norm(sh.name) === norm(String(p.sheet || '')))
      return real ? { ...p, sheet: real.name } : p
    })

    const out: Group[] = []
    const toRead: SheetData[] = []
    let used = 0, skipped = 0
    for (const sh of sheets) {
      const mine = plans.filter(p => p.sheet === sh.name)
      if (!mine.length) { if (sh.rows.length > 1) toRead.push(sh); continue }
      if (mine.some(p => p.irregular)) { toRead.push(sh); continue }
      if (mine.every(p => p.category === 'skip')) { skipped++; continue }
      let n = 0
      for (const p of mine) {
        const conf: Confidence = p.confidence || 'medium'
        // The tab as a whole — typically the camp a tab of attendees is for.
        if (p.tab_record) {
          const { category, ...fields } = p.tab_record
          const rec = cleanRecord(category, fields)
          if (rec) { out.push(newGroup({ file: f.name, tab: sh.name, category, records: [rec], confidence: conf, reason: p.reason })); n++ }
        }
        if (p.category === 'skip') continue
        const recs = applyPlan(p, sh.rows)
        if (recs.length) { out.push(newGroup({ file: f.name, tab: sh.name, category: p.category, records: recs, confidence: conf, reason: p.reason })); n += recs.length }
      }
      // Mapped but nothing came out — read it properly rather than lose it.
      if (n) used++; else if (sh.rows.length > 1) toRead.push(sh)
    }

    // Tabs that are not one record per row: the AI reads them in pieces. What
    // comes back is collected per tab, and — apart from people — asked about.
    const pieces = toRead.flatMap(sh => sheetChunks(sh).map(text => ({ tab: sh.name, text })))
    const todo = pieces.slice(0, MAX_CHUNKS)
    const perTab = new Map<string, Record<string, Rec[]>>()
    let done = 0, failed = 0
    const worker = async () => {
      while (todo.length) {
        const piece = todo.shift()!
        say(`Reading “${piece.tab}” (${done + 1}/${Math.min(pieces.length, MAX_CHUNKS)})…`)
        try {
          const { extracted } = await postJson<{ extracted?: Record<string, Rec[]> }>('/api/coach/import', { text: piece.text, label: `${f.name} — ${piece.tab}` })
          const into = perTab.get(piece.tab) || {}
          for (const [c, rows] of Object.entries(extracted || {})) into[c] = [...(into[c] || []), ...rows]
          perTab.set(piece.tab, into)
        } catch (e) { failed++; console.warn('[import] piece', e) }
        done++
      }
    }
    await Promise.all(Array.from({ length: PARALLEL }, worker))
    for (const [tab, ex] of perTab) out.push(...fromExtracted(ex, f.name, tab, c => (c === 'players' || c === 'staff' ? 'high' : 'medium'), 'Read row by row from a tab without clear headings.'))
    used += toRead.length

    const notes: string[] = []
    if (sheets.length > 1) notes.push(`${used} of ${sheets.length} tabs used${skipped ? `, ${skipped} skipped` : ''}`)
    if (pieces.length > MAX_CHUNKS) notes.push('some very long tabs were only partly read')
    if (failed) notes.push(`${failed} part${failed === 1 ? '' : 's'} could not be read`)
    if (mapFailed) notes.push(`${mapFailed} tab${mapFailed === 1 ? '' : 's'} read the slow way`)
    return { groups: out, note: notes.join(' · ') || undefined }
  }

  const onFiles = async (list: FileList | File[]) => {
    const all = Array.from(list)
    if (!all.length) return
    const chosen = all.slice(0, MAX_FILES)
    setErr(all.length > MAX_FILES ? `Up to ${MAX_FILES} files at a time — the first ${MAX_FILES} are being read.` : '')
    setResult(''); setStatus('reading')
    setFiles(chosen.map(f => ({ name: f.name, state: 'waiting' })))
    // One file at a time: each is its own set of AI reads, and ten at once
    // would trip the rate limit and time out together.
    const found: Group[] = []
    for (let i = 0; i < chosen.length; i++) {
      const f = chosen[i]
      const say = (detail: string) => setFiles(fs => fs.map((x, j) => j === i ? { ...x, detail } : x))
      setFiles(fs => fs.map((x, j) => j === i ? { ...x, state: 'reading' } : x))
      try {
        const { groups: g, note } = SPREADSHEET_RE.test(f.name) ? await readSpreadsheet(f, say) : await readDocument(f)
        found.push(...g)
        const n = g.reduce((s, x) => s + x.records.length, 0)
        setFiles(fs => fs.map((x, j) => j === i ? { ...x, state: 'done', found: n, note, detail: undefined } : x))
      } catch (e) {
        setFiles(fs => fs.map((x, j) => j === i ? { ...x, state: 'failed', error: e instanceof Error ? e.message : 'Could not read this file', detail: undefined } : x))
      }
    }
    const checked = sanityCheck(found)
    setGroups(checked)
    setPicked(Object.fromEntries(IMPORT_CATEGORIES.map(c => [c, true])))
    const any = checked.some(g => g.records.length)
    if (!any) setErr(e => e || 'We could not find any records in those files.')
    setStatus(any ? 'preview' : 'idle')
    if (fileRef.current) fileRef.current.value = ''
  }

  // What will actually be saved: confirmed groups, moved to where the coach
  // said, merged across tabs so a camp on three tabs is still one camp.
  const finalRecords = (gs: Group[]): Partial<Record<ImportCategory, Rec[]>> => {
    const out: Partial<Record<ImportCategory, Rec[]>> = {}
    for (const g of gs) {
      if (g.decision !== 'yes') continue
      const recs = g.records.map(r => convertRecord(g.category, g.target, r)).filter((r): r is Rec => !!r)
      out[g.target] = [...(out[g.target] || []), ...recs]
    }
    for (const c of Object.keys(out) as ImportCategory[]) out[c] = dedupeRecords(c, out[c]!)
    return out
  }
  const final = finalRecords(groups)
  const toCheck = groups.filter(g => g.decision === 'pending')
  const totalSelected = IMPORT_CATEGORIES.reduce((s, c) => s + (picked[c] ? (final[c]?.length ?? 0) : 0), 0)

  const doImport = async (): Promise<boolean> => {
    setStatus('importing'); setErr('')
    let inserted = 0
    let needFiles = 0
    const failures: string[] = []
    const rowsByCat = finalRecords(groups)
    for (const c of IMPORT_CATEGORIES) {
      const rows = rowsByCat[c] || []
      if (!picked[c] || !rows.length) continue
      try {
        // Big imports go up in batches, so 3,000 players is six quick saves
        // rather than one request the server refuses.
        for (let b = 0; b < rows.length; b += SAVE_BATCH) {
          const res = await fetch('/api/coach/import/save', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: c, rows: rows.slice(b, b + SAVE_BATCH) }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.error || `Could not save ${CATEGORY_LABEL[c].toLowerCase()}`)
          inserted += Number(data.inserted) || 0
          needFiles += Number(data.needFiles) || 0
        }
        invalidateCoachTable(TABLE[c])
        setPicked(p => ({ ...p, [c]: false }))
      } catch (e) {
        failures.push(e instanceof Error ? e.message : `Could not save ${CATEGORY_LABEL[c].toLowerCase()}`)
      }
    }
    if (failures.length) {
      setErr(failures.join(' · ') + (inserted ? ` (${inserted} other record${inserted === 1 ? '' : 's'} saved)` : ''))
      setStatus('preview')
      if (inserted) onImported?.()
      return false
    }
    setResult(`Imported ${inserted} record${inserted === 1 ? '' : 's'} ✓`)
    // A spreadsheet carries the list of resources, not the files themselves.
    setFileNote(needFiles ? `${needFiles} resource${needFiles === 1 ? '' : 's'} came in without a working link. Open the Resource Centre and press “+ Add link” or “Upload file” on each card.` : '')
    setStatus('done')
    onImported?.()
    return true
  }

  // Tell the parent while there is something found but not imported, so its
  // Continue / Close can ask before walking away from it.
  const importRef = useRef(doImport)
  importRef.current = doImport
  useEffect(() => {
    if (!onPendingChange) return
    onPendingChange(status === 'preview' && (totalSelected > 0 || toCheck.length > 0)
      ? { count: totalSelected, run: () => importRef.current() }
      : null)
  }, [status, totalSelected, toCheck.length, onPendingChange])
  useEffect(() => () => { onPendingChange?.(null) }, [onPendingChange])

  const reset = () => { setGroups([]); setPicked({}); setFiles([]); setStatus('idle'); setErr(''); setResult(''); setChanging(null); if (fileRef.current) fileRef.current.value = '' }
  const decide = (id: string, patch: Partial<Group>) => { setGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g)); setChanging(null) }
  const reviewCategory = (c: ImportCategory) => setGroups(gs => gs.map(g => g.decision === 'yes' && g.target === c ? { ...g, decision: 'pending', reason: g.reason || 'You asked to check these again.' } : g))

  const names = (recs: Rec[], c: ImportCategory, n = 5) => recs.slice(0, n).map(r => r[LABEL_FIELD[c]]).filter(Boolean).join(', ')
  const pill = (bg: string, fg: string, border = 'transparent') => ({ padding: '6px 12px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: fg, fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const)

  const fileList = files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '0 0 12px' }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, color: T.text2 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name}</span>
          <span style={{ flex: 'none', maxWidth: '60%', textAlign: 'right', color: f.state === 'failed' ? '#EF4444' : f.state === 'done' ? '#22C55E' : T.text3 }} title={f.error || f.note}>
            {f.state === 'waiting' ? 'Waiting…' : f.state === 'reading' ? (f.detail || 'Reading…') : f.state === 'done' ? `${f.found} found${f.note ? ` · ${f.note}` : ''}` : (f.error || 'Could not read')}
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

          {/* ── Questions first: anything the AI was not sure of ─────────────── */}
          {toCheck.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.text }}>Please check {toCheck.length === 1 ? 'this' : `these ${toCheck.length}`}</div>
              <div style={{ fontSize: 12, color: T.text3, margin: '2px 0 10px' }}>We weren&apos;t sure what {toCheck.length === 1 ? 'it holds' : 'they hold'}. Nothing here is imported until you answer.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {toCheck.map(g => (
                  <div key={g.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{g.tab ? `“${g.tab}”` : g.file}</span>
                      <span style={{ fontSize: 11.5, color: T.text3 }}>{g.records.length} row{g.records.length === 1 ? '' : 's'}{g.tab ? ` · ${g.file}` : ''}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: T.text3, margin: '3px 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{names(g.records, g.category)}</div>
                    <div style={{ fontSize: 12.5, color: T.text2, marginBottom: 8 }}>
                      We think these are <strong style={{ color: T.text }}>{CATEGORY_LABEL[g.category]}</strong>{g.reason ? <span style={{ color: T.text3 }}> — {g.reason}</span> : null}
                    </div>
                    {changing === g.id ? (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: T.text2 }}>They&apos;re:</span>
                        {IMPORT_CATEGORIES.filter(c => c !== g.category).map(c => (
                          <button key={c} onClick={() => decide(g.id, { target: c, decision: 'yes' })} style={pill(T.panel2, T.text, T.border)}>{CATEGORY_LABEL[c]}</button>
                        ))}
                        <button onClick={() => setChanging(null)} style={pill('transparent', T.text3)}>Back</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => decide(g.id, { target: g.category, decision: 'yes' })} style={pill(accent.hex, T.btnText)}>Yes</button>
                        <button onClick={() => setChanging(g.id)} style={pill(T.panel2, T.text, T.border)}>No, they&apos;re…</button>
                        <button onClick={() => decide(g.id, { decision: 'skip' })} style={pill('transparent', T.text3, T.border)}>Don&apos;t import</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── What will be imported ───────────────────────────────────────── */}
          <p style={{ fontSize: 12.5, color: T.text2, margin: '0 0 12px' }}>Ready to import <b style={{ color: T.text }}>{totalSelected}</b> record{totalSelected === 1 ? '' : 's'}. Duplicates have been merged. Untick anything you don&apos;t want:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {IMPORT_CATEGORIES.filter(c => (final[c]?.length ?? 0) > 0).map(c => {
              const rows = final[c] || []
              const tabs = [...new Set(groups.filter(g => g.decision === 'yes' && g.target === c).map(g => g.tab || g.file))]
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                  <input type="checkbox" checked={!!picked[c]} onChange={e => setPicked(p => ({ ...p, [c]: e.target.checked }))} style={{ cursor: 'pointer' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{CATEGORY_LABEL[c]} <span style={{ color: accent.hex }}>· {rows.length}</span></div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{names(rows, c, 6)}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>From {tabs.slice(0, 3).join(', ')}{tabs.length > 3 ? ` +${tabs.length - 3} more` : ''}</div>
                  </div>
                  <button onClick={() => reviewCategory(c)} title="Not right? Put these back to check" style={{ ...pill('transparent', T.text3, T.border), padding: '4px 10px', fontWeight: 600 }}>Wrong?</button>
                </div>
              )
            })}
          </div>
          {err && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 10px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { void doImport() }} disabled={totalSelected === 0} style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 14, fontWeight: 800, cursor: totalSelected ? 'pointer' : 'default', opacity: totalSelected === 0 ? 0.5 : 1, boxShadow: totalSelected ? `0 6px 18px ${accent.hex}55` : 'none' }}>Import {totalSelected} record{totalSelected === 1 ? '' : 's'}</button>
            <button onClick={reset} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            {toCheck.length > 0 && <span style={{ fontSize: 11.5, color: '#B45309' }}>{toCheck.length} still to check above</span>}
          </div>
          <p style={{ fontSize: 11.5, color: T.text3, margin: '8px 0 0' }}>Nothing is saved until you press Import.</p>
        </div>
      )}

      {status === 'importing' && <p style={{ fontSize: 13, color: T.text3 }}>Importing…</p>}

      {status === 'done' && (
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', margin: '0 0 12px' }}>{result}</p>
          {fileNote && <p style={{ fontSize: 12.5, color: T.text2, margin: '-4px 0 12px', lineHeight: 1.55 }}>📎 {fileNote}</p>}
          <button onClick={reset} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Import more files</button>
        </div>
      )}

      {err && status === 'idle' && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</p>}
    </div>
  )
}

/**
 * "You haven't imported your data" — shown by a Continue or Close button while
 * records have been found but not saved. The easy thing to miss is the Import
 * button itself; this makes walking away a decision rather than an accident.
 */
export function ImportPendingDialog({ pending, onDone, onCancel }: {
  pending: PendingImport
  /** Carry on (after importing, or after choosing to skip). */
  onDone: () => void
  /** Stay where you are. */
  onCancel: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const importNow = async () => {
    setBusy(true); setFailed(false)
    const ok = await pending.run().catch(() => false)
    setBusy(false)
    if (ok) onDone(); else setFailed(true)
  }
  const btn = (primary: boolean) => ({ padding: '11px 18px', borderRadius: 10, border: primary ? 'none' : '1px solid #D1D5DB', background: primary ? '#111827' : '#fff', color: primary ? '#fff' : '#111827', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 } as const)
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(3,7,18,0.6)', display: 'grid', placeItems: 'center', padding: 16 }} onClick={() => { if (!busy) onCancel() }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', color: '#111827', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', fontFamily: 'inherit' }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>You haven&apos;t imported your data</div>
        <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.55, margin: '0 0 18px' }}>
          {pending.count > 0
            ? <>We found <strong>{pending.count} record{pending.count === 1 ? '' : 's'}</strong> in your files, but they aren&apos;t saved yet. Import them now?</>
            : <>Your files have been read, but there are questions to answer before anything can be imported.</>}
        </p>
        {failed && <p style={{ fontSize: 12.5, color: '#DC2626', margin: '-8px 0 12px' }}>Some records could not be saved — see the import box for details.</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {pending.count > 0
            ? <button onClick={importNow} disabled={busy} style={btn(true)}>{busy ? 'Importing…' : `Import ${pending.count} and continue`}</button>
            : <button onClick={onCancel} style={btn(true)}>Answer the questions</button>}
          <button onClick={() => { if (!busy) onDone() }} disabled={busy} style={btn(false)}>Continue without importing</button>
        </div>
        {pending.count > 0 && <button onClick={() => { if (!busy) onCancel() }} style={{ marginTop: 12, background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', padding: 0 }}>Go back and check first</button>}
      </div>
    </div>
  )
}
