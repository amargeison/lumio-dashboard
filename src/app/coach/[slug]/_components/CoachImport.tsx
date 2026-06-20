'use client'

// AI bulk import — upload a CSV / Excel / PDF / image of players, coaches,
// courts, camps, equipment or payments; Claude works out what's what; preview
// and import into the right modules. Renders as an inline card (Settings) and
// inside the onboarding wizard.

import { useRef, useState } from 'react'
import { dbInsert, type CoachTable } from '../_lib/coach-db'

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
// Whitelist of columns per table — guards against unexpected AI keys breaking inserts.
const FIELDS: Record<string, string[]> = {
  players: ['name', 'category', 'age', 'parent_name', 'racket_stage', 'goal', 'level', 'email', 'phone', 'notes'],
  staff: ['name', 'role', 'email', 'phone', 'qualifications', 'notes'],
  courts: ['name', 'surface', 'location', 'hours', 'status', 'notes'],
  camps: ['name', 'start_date', 'end_date', 'capacity', 'price', 'location', 'notes'],
  equipment: ['item', 'category', 'quantity', 'status', 'notes'],
  payments: ['player_name', 'item', 'amount', 'status', 'due_date', 'notes'],
  resources: ['title', 'type', 'url', 'category', 'notes'],
}

export function CoachImport({ T, accent, onImported }: { T: ThemeTokens; accent: AccentTokens; onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'reading' | 'preview' | 'importing' | 'done'>('idle')
  const [extracted, setExtracted] = useState<Record<string, any[]>>({})
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [err, setErr] = useState('')
  const [result, setResult] = useState('')

  const onFile = async (f: File) => {
    setErr(''); setResult(''); setStatus('reading')
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch('/api/coach/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      const ex = data.extracted || {}
      setExtracted(ex)
      setPicked(Object.fromEntries(CATEGORIES.map(c => [c.key, (ex[c.key]?.length ?? 0) > 0])))
      setStatus('preview')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Import failed'); setStatus('idle') }
  }

  const totalFound = CATEGORIES.reduce((s, c) => s + (extracted[c.key]?.length ?? 0), 0)
  const totalSelected = CATEGORIES.reduce((s, c) => s + (picked[c.key] ? (extracted[c.key]?.length ?? 0) : 0), 0)

  const doImport = async () => {
    setStatus('importing'); setErr('')
    let inserted = 0
    try {
      for (const c of CATEGORIES) {
        if (!picked[c.key]) continue
        const allowed = FIELDS[c.key]
        for (const row of extracted[c.key] || []) {
          const clean: Record<string, any> = {}
          for (const k of allowed) if (row[k] !== undefined && row[k] !== null && row[k] !== '') clean[k] = row[k]
          if (!Object.keys(clean).length) continue
          await dbInsert(c.table, clean)
          inserted++
        }
      }
      setResult(`Imported ${inserted} record${inserted === 1 ? '' : 's'} ✓`)
      setStatus('done')
      onImported?.()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Some records could not be imported'); setStatus('preview') }
  }

  const reset = () => { setExtracted({}); setPicked({}); setStatus('idle'); setErr(''); setResult(''); if (fileRef.current) fileRef.current.value = '' }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
      <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Import from a file ✨</h3>
      <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Upload a spreadsheet, PDF or photo of your players, coaches, camps, courts, equipment or payments — the AI sorts and adds them for you. CSV, Excel, PDF and images all work.</p>

      <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />

      {(status === 'idle' || status === 'reading') && (
        <button onClick={() => fileRef.current?.click()} disabled={status === 'reading'}
          style={{ padding: '11px 18px', borderRadius: 10, border: `1px dashed ${accent.hex}`, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
          {status === 'reading' ? 'Reading your file…' : '⬆ Choose a file to import'}
        </button>
      )}

      {status === 'preview' && (
        <div>
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
          <button onClick={reset} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Import another file</button>
        </div>
      )}

      {err && status === 'idle' && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</p>}
    </div>
  )
}
