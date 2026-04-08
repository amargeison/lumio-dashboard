'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Upload, Check, AlertCircle, Plus, Trash2 } from 'lucide-react'
import {
  parseSquadCSV,
  parseContractsCSV,
  parseFixturesCSV,
  type ParsedSquadRow,
  type ParsedContractRow,
  type ParsedFixtureRow,
} from '@/lib/club-import-parser'
import {
  generateSquadTemplate,
  generateContractsTemplate,
  generateFixturesTemplate,
  downloadCSV,
} from '@/lib/csv-templates'

interface DBFootballClub {
  id?: string
  name?: string
  short_name?: string | null
  league?: string | null
  primary_colour?: string | null
  secondary_colour?: string | null
  logo_url?: string | null
  team_id_api_football?: number | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  clubId: string | null
  clubName: string
  dbClub: DBFootballClub | null
  onComplete: () => void
}

const STEPS = [
  { id: 1, label: 'Club Info', key: 'club_info' },
  { id: 2, label: 'Squad', key: 'squad' },
  { id: 3, label: 'Contracts', key: 'contracts' },
  { id: 4, label: 'Fixtures', key: 'fixtures' },
  { id: 5, label: 'Review', key: 'review' },
  { id: 6, label: 'Complete', key: 'complete' },
] as const

const LEAGUES = ['Premier League','EFL Championship','EFL League One','EFL League Two','National League','National League North','National League South','Other Non-League']
const POSITIONS = ['GK','DEF','MID','FWD']

export default function ClubImportWizard({ isOpen, onClose, clubId, clubName, dbClub, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  // Step 1
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [homeGround, setHomeGround] = useState('')
  const [league, setLeague] = useState('EFL League One')
  const [primaryColour, setPrimaryColour] = useState('#003DA5')
  const [secondaryColour, setSecondaryColour] = useState('#F1C40F')
  const [website, setWebsite] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Step 2
  const [squadMode, setSquadMode] = useState<'csv' | 'manual'>('csv')
  const [squadRows, setSquadRows] = useState<ParsedSquadRow[]>([])
  const [squadResult, setSquadResult] = useState<{ succeeded: number; failed: number } | null>(null)

  // Step 3
  const [contractMode, setContractMode] = useState<'csv' | 'manual'>('csv')
  const [contractRows, setContractRows] = useState<ParsedContractRow[]>([])
  const [contractResult, setContractResult] = useState<{ succeeded: number; failed: number } | null>(null)

  // Step 4
  const [fixtureMode, setFixtureMode] = useState<'csv' | 'manual'>('csv')
  const [fixtureRows, setFixtureRows] = useState<ParsedFixtureRow[]>([])
  const [fixtureResult, setFixtureResult] = useState<{ succeeded: number; failed: number } | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Init: pre-fill from dbClub + start session
  useEffect(() => {
    if (!isOpen) return
    if (dbClub) {
      setName(dbClub.name ?? '')
      setShortName(dbClub.short_name ?? '')
      setLeague(dbClub.league ?? 'EFL League One')
      setPrimaryColour(dbClub.primary_colour ?? '#003DA5')
      setSecondaryColour(dbClub.secondary_colour ?? '#F1C40F')
      setLogoUrl(dbClub.logo_url ?? null)
    } else {
      setName(clubName)
    }
    if (clubId && !sessionId) {
      fetch('/api/football/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId }),
      }).then((r) => r.json()).then((j) => {
        if (j?.sessionId) {
          setSessionId(j.sessionId)
          setStep(j.session?.current_step ?? 1)
          setCompletedSteps(new Set(j.session?.steps_completed ?? []))
        }
      }).catch(() => {})
    }
  }, [isOpen, dbClub, clubId])

  async function patchSession(currentStep: number, stepCompleted?: string) {
    if (!sessionId) return
    try {
      await fetch('/api/football/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, currentStep, stepCompleted }),
      })
    } catch { /* ignore */ }
  }

  async function importRows(importType: string, method: 'csv' | 'manual', rows: any[]): Promise<{ succeeded: number; failed: number } | null> {
    if (!clubId || !sessionId) { setError('Session not ready'); return null }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/football/onboarding/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, sessionId, importType, method, rows }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Import failed')
        return null
      }
      return { succeeded: json.rowsSucceeded ?? 0, failed: json.rowsFailed ?? 0 }
    } catch {
      setError('Network error')
      return null
    } finally {
      setBusy(false)
    }
  }

  // Step 1 handler
  async function saveClubInfo() {
    const result = await importRows('club_info', 'manual', [{
      name, shortName, league, primaryColour, secondaryColour, logoUrl,
    }])
    if (result !== null) {
      const next = new Set(completedSteps); next.add('club_info'); setCompletedSteps(next)
      patchSession(2, 'club_info')
      setStep(2)
    }
  }

  // CSV file readers
  function handleSquadFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseSquadCSV(text)
      if (!parsed) { setError('Could not parse CSV — check headers'); return }
      setSquadRows(parsed)
      setError(null)
    }
    reader.readAsText(file)
  }
  function handleContractFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseContractsCSV(reader.result as string)
      if (!parsed) { setError('Could not parse CSV'); return }
      setContractRows(parsed)
      setError(null)
    }
    reader.readAsText(file)
  }
  function handleFixtureFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseFixturesCSV(reader.result as string)
      if (!parsed) { setError('Could not parse CSV'); return }
      setFixtureRows(parsed)
      setError(null)
    }
    reader.readAsText(file)
  }

  function handleLogoFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function importValidSquad() {
    const valid = squadRows.filter((r) => r.errors.length === 0)
    const result = await importRows('squad', squadMode, valid)
    if (result) {
      setSquadResult(result)
      const next = new Set(completedSteps); next.add('squad'); setCompletedSteps(next)
      patchSession(3, 'squad')
      setStep(3)
    }
  }

  async function importValidContracts() {
    const valid = contractRows.filter((r) => r.errors.length === 0)
    const result = await importRows('contracts', contractMode, valid)
    if (result) {
      setContractResult(result)
      const next = new Set(completedSteps); next.add('contracts'); setCompletedSteps(next)
      patchSession(4, 'contracts')
      setStep(4)
    }
  }

  async function importValidFixtures() {
    const valid = fixtureRows.filter((r) => r.errors.length === 0)
    const result = await importRows('fixtures', fixtureMode, valid)
    if (result) {
      setFixtureResult(result)
      const next = new Set(completedSteps); next.add('fixtures'); setCompletedSteps(next)
      patchSession(5, 'fixtures')
      setStep(5)
    }
  }

  async function syncFromAPIFootball() {
    setError('Sync requires API-Football integration — coming soon for unconfigured clubs')
  }

  async function completeWizard() {
    await patchSession(6, 'review')
    setStep(6)
  }

  function skipStep(targetStep: number, key: string) {
    patchSession(targetStep, key)
    setStep(targetStep)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
        {/* Header + close */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#0B0D14', borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold">📥 Club Data Import</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><X size={16} /></button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((s, i) => {
              const isCompleted = completedSteps.has(s.key) || step > s.id
              const isActive = step === s.id
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: isCompleted ? '#22C55E' : isActive ? '#7C3AED' : '#1F2937',
                        color: isCompleted || isActive ? '#fff' : '#6B7280',
                      }}>
                      {isCompleted ? <Check size={14} /> : s.id}
                    </div>
                    <span className="text-[10px]" style={{ color: isActive ? '#A78BFA' : '#6B7280' }}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-2" style={{ backgroundColor: isCompleted ? '#22C55E' : '#1F2937' }} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-12">
          {error && <p className="mb-3 text-xs" style={{ color: '#EF4444' }}>{error}</p>}

          {/* STEP 1: CLUB INFO */}
          {step === 1 && (
            <Card title="Tell us about your club">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Club name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputSty} /></Field>
                <Field label="Short name (max 4 chars)"><input maxLength={4} value={shortName} onChange={(e) => setShortName(e.target.value)} className={inputCls} style={inputSty} /></Field>
                <Field label="Home ground"><input value={homeGround} onChange={(e) => setHomeGround(e.target.value)} className={inputCls} style={inputSty} /></Field>
                <Field label="League">
                  <select value={league} onChange={(e) => setLeague(e.target.value)} className={inputCls} style={inputSty}>
                    {LEAGUES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Primary colour"><input type="color" value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} className="w-full h-9 rounded" style={inputSty} /></Field>
                <Field label="Secondary colour"><input type="color" value={secondaryColour} onChange={(e) => setSecondaryColour(e.target.value)} className="w-full h-9 rounded" style={inputSty} /></Field>
                <Field label="Website"><input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} style={inputSty} /></Field>
                <Field label="Founded year"><input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} className={inputCls} style={inputSty} /></Field>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#9CA3AF' }}>Club logo</p>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <span className="text-xs" style={{ color: '#6B7280' }}>No logo</span>}
                  </div>
                  <label className="text-xs px-3 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: '#1F2937' }}>
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} />
                  </label>
                </div>
              </div>
              <button onClick={saveClubInfo} disabled={busy || !clubId} className="mt-4 w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                {busy ? 'Saving...' : 'Save & Continue →'}
              </button>
              {!clubId && <p className="mt-2 text-[10px] text-center" style={{ color: '#F59E0B' }}>No club id — connect a club to enable saving</p>}
            </Card>
          )}

          {/* STEP 2: SQUAD */}
          {step === 2 && (
            <Card title="Import your squad">
              <ModeToggle mode={squadMode} onChange={setSquadMode} />
              {squadMode === 'csv' ? (
                <div className="space-y-3">
                  <DropZone onFile={handleSquadFile} accept=".csv" label="Drop your squad CSV here, or click to browse" />
                  <button onClick={() => downloadCSV('squad-template.csv', generateSquadTemplate())} className="text-xs underline" style={{ color: '#A78BFA' }}>↓ Download squad template</button>
                  {squadRows.length > 0 && <SquadPreview rows={squadRows} />}
                  {squadRows.length > 0 && (
                    <button onClick={importValidSquad} disabled={busy} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                      Import {squadRows.filter((r) => r.errors.length === 0).length} Valid Players
                    </button>
                  )}
                </div>
              ) : (
                <ManualSquadEditor rows={squadRows} setRows={setSquadRows} onSave={importValidSquad} busy={busy} />
              )}
              <div className="text-center mt-3"><button onClick={() => skipStep(3, 'squad')} className="text-xs" style={{ color: '#6B7280' }}>Skip for now →</button></div>
            </Card>
          )}

          {/* STEP 3: CONTRACTS */}
          {step === 3 && (
            <Card title="Import player contracts">
              <ModeToggle mode={contractMode} onChange={setContractMode} />
              {contractMode === 'csv' ? (
                <div className="space-y-3">
                  <DropZone onFile={handleContractFile} accept=".csv" label="Drop your contracts CSV here" />
                  <button onClick={() => downloadCSV('contracts-template.csv', generateContractsTemplate())} className="text-xs underline" style={{ color: '#A78BFA' }}>↓ Download contracts template</button>
                  {contractRows.length > 0 && <ContractPreview rows={contractRows} squadNames={squadRows.map((r) => r.name)} />}
                  {contractRows.length > 0 && (
                    <button onClick={importValidContracts} disabled={busy} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                      Import {contractRows.filter((r) => r.errors.length === 0).length} Valid Contracts
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#6B7280' }}>Manual contract entry — please use CSV mode for now.</p>
              )}
              <div className="text-center mt-3"><button onClick={() => skipStep(4, 'contracts')} className="text-xs" style={{ color: '#6B7280' }}>Skip for now →</button></div>
            </Card>
          )}

          {/* STEP 4: FIXTURES */}
          {step === 4 && (
            <Card title="Import your fixture list">
              <ModeToggle mode={fixtureMode} onChange={setFixtureMode} />
              {fixtureMode === 'csv' ? (
                <div className="space-y-3">
                  <DropZone onFile={handleFixtureFile} accept=".csv" label="Drop your fixtures CSV here" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => downloadCSV('fixtures-template.csv', generateFixturesTemplate())} className="text-xs underline" style={{ color: '#A78BFA' }}>↓ Download fixtures template</button>
                    {dbClub?.team_id_api_football && (
                      <button onClick={syncFromAPIFootball} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#1F2937', color: '#A78BFA' }}>⚡ Sync from API-Football</button>
                    )}
                  </div>
                  {fixtureRows.length > 0 && <FixturePreview rows={fixtureRows} />}
                  {fixtureRows.length > 0 && (
                    <button onClick={importValidFixtures} disabled={busy} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                      Import {fixtureRows.filter((r) => r.errors.length === 0).length} Valid Fixtures
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#6B7280' }}>Manual fixture entry — please use CSV mode for now.</p>
              )}
              <div className="text-center mt-3"><button onClick={() => skipStep(5, 'fixtures')} className="text-xs" style={{ color: '#6B7280' }}>Skip for now →</button></div>
            </Card>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <Card title="Review your import">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Club Info', completed: completedSteps.has('club_info'), count: null },
                  { label: 'Squad', completed: completedSteps.has('squad'), count: squadResult?.succeeded ?? 0, failed: squadResult?.failed ?? 0 },
                  { label: 'Contracts', completed: completedSteps.has('contracts'), count: contractResult?.succeeded ?? 0, failed: contractResult?.failed ?? 0 },
                  { label: 'Fixtures', completed: completedSteps.has('fixtures'), count: fixtureResult?.succeeded ?? 0, failed: fixtureResult?.failed ?? 0 },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>{c.label}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: c.completed ? '#22C55E' : '#6B7280' }}>
                      {c.completed ? '✅' : '⬜'} {c.count !== null ? `${c.count} imported` : 'Complete'}
                      {c.failed ? <span className="ml-2 text-[10px]" style={{ color: '#F59E0B' }}>⚠️ {c.failed} failed</span> : null}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={completeWizard} disabled={busy} className="mt-5 w-full py-4 rounded-xl text-sm font-bold disabled:opacity-50" style={{ backgroundColor: '#22C55E', color: '#000' }}>
                Complete Import
              </button>
            </Card>
          )}

          {/* STEP 6: COMPLETE */}
          {step === 6 && (
            <Card title="">
              <div className="text-center py-6">
                <p className="text-3xl mb-3">🎉</p>
                <h3 className="text-lg font-bold">Your club is set up!</h3>
                <ul className="mt-4 text-sm space-y-1 inline-block text-left" style={{ color: '#9CA3AF' }}>
                  <li>{completedSteps.has('club_info') ? '✅' : '⬜'} Club profile updated</li>
                  <li>{completedSteps.has('squad') ? '✅' : '⬜'} {squadResult?.succeeded ?? 0} players imported</li>
                  <li>{completedSteps.has('contracts') ? '✅' : '⬜'} {contractResult?.succeeded ?? 0} contracts linked</li>
                  <li>{completedSteps.has('fixtures') ? '✅' : '⬜'} {fixtureResult?.succeeded ?? 0} fixtures loaded</li>
                </ul>
                <button onClick={onComplete} className="mt-6 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                  Go to Dashboard →
                </button>
              </div>
            </Card>
          )}

          {/* Navigation */}
          {step > 1 && step < 6 && (
            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(step - 1)} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}>← Back</button>
              <span className="text-[10px]" style={{ color: '#6B7280' }}>Step {step} of 6</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-2 py-1.5 rounded text-xs'
const inputSty: React.CSSProperties = { backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {title && <h3 className="text-sm font-bold mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{label}</label>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: 'csv' | 'manual'; onChange: (m: 'csv' | 'manual') => void }) {
  return (
    <div className="flex gap-2 mb-4">
      {(['csv','manual'] as const).map((m) => (
        <button key={m} onClick={() => onChange(m)} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-1"
          style={{ backgroundColor: mode === m ? '#7C3AED' : '#07080F', border: '1px solid #1F2937', color: mode === m ? '#fff' : '#9CA3AF' }}>
          {m === 'csv' ? 'Upload CSV' : 'Enter Manually'}
        </button>
      ))}
    </div>
  )
}

function DropZone({ onFile, accept, label }: { onFile: (f: File) => void; accept: string; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
      }}
      className="rounded-xl p-8 text-center cursor-pointer"
      style={{ backgroundColor: '#0A0B10', border: `2px dashed ${dragOver ? '#7C3AED' : '#1F2937'}` }}
    >
      <Upload size={20} className="mx-auto mb-2" style={{ color: '#A78BFA' }} />
      <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </div>
  )
}

function SquadPreview({ rows }: { rows: ParsedSquadRow[] }) {
  const valid = rows.filter((r) => r.errors.length === 0).length
  const errs = rows.length - valid
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: errs > 0 ? '#F59E0B' : '#22C55E' }}>
        {valid} valid · {errs > 0 ? `${errs} errors — fix or skip` : '0 errors'}
      </p>
      <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937', color: '#6B7280' }}>
              {['#','Name','Pos','DOB','Nation','Status','Errors'].map((h) => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ backgroundColor: r.errors.length > 0 ? 'rgba(239,68,68,0.08)' : 'transparent', borderBottom: '1px solid #1F2937' }}>
                <td className="px-2 py-1" style={{ color: '#6B7280' }}>{r.rowIndex}</td>
                <td className="px-2 py-1" style={{ color: '#F9FAFB' }}>{r.name || '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.position ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.dateOfBirth ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.nationality ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.status}</td>
                <td className="px-2 py-1" style={{ color: '#EF4444' }}>{r.errors.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ContractPreview({ rows, squadNames }: { rows: ParsedContractRow[]; squadNames: string[] }) {
  return (
    <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ borderBottom: '1px solid #1F2937', color: '#6B7280' }}>
            {['Match','Name','Start','End','Wage','Release'].map((h) => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const matched = squadNames.includes(r.playerName)
            return (
              <tr key={i} style={{ backgroundColor: r.errors.length > 0 ? 'rgba(239,68,68,0.08)' : 'transparent', borderBottom: '1px solid #1F2937' }}>
                <td className="px-2 py-1">{matched ? <Check size={12} style={{ color: '#22C55E' }} /> : <AlertCircle size={12} style={{ color: '#F59E0B' }} />}</td>
                <td className="px-2 py-1" style={{ color: '#F9FAFB' }}>{r.playerName}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.startDate ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.endDate ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.weeklyWage ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.releaseClause ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FixturePreview({ rows }: { rows: ParsedFixtureRow[] }) {
  return (
    <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ borderBottom: '1px solid #1F2937', color: '#6B7280' }}>
            {['Opponent','Date','Venue','Comp','Result'].map((h) => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const played = r.resultHome != null && r.resultAway != null
            return (
              <tr key={i} style={{ backgroundColor: r.errors.length > 0 ? 'rgba(239,68,68,0.08)' : 'transparent', borderBottom: '1px solid #1F2937' }}>
                <td className="px-2 py-1" style={{ color: '#F9FAFB' }}>{r.opponent}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.kickoffTime ? new Date(r.kickoffTime).toLocaleString() : '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.venue ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{r.competition ?? '—'}</td>
                <td className="px-2 py-1" style={{ color: '#9CA3AF' }}>{played ? `${r.resultHome}-${r.resultAway}` : 'Upcoming'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ManualSquadEditor({ rows, setRows, onSave, busy }: { rows: ParsedSquadRow[]; setRows: (r: ParsedSquadRow[]) => void; onSave: () => void; busy: boolean }) {
  function addRow() {
    setRows([...rows, { name: '', position: null, squadNumber: null, dateOfBirth: null, nationality: null, status: 'fit', photoUrl: null, rowIndex: rows.length + 2, errors: [] }])
  }
  function update(i: number, patch: Partial<ParsedSquadRow>) {
    const next = rows.slice(); next[i] = { ...next[i], ...patch }; setRows(next)
  }
  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937', color: '#6B7280' }}>
              {['Name','Pos','#','DOB','Nation',''].map((h) => <th key={h} className="text-left px-2 py-1.5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                <td className="px-1 py-1"><input value={r.name} onChange={(e) => update(i, { name: e.target.value })} className="w-full px-1 py-0.5 rounded" style={inputSty} /></td>
                <td className="px-1 py-1">
                  <select value={r.position ?? ''} onChange={(e) => update(i, { position: (e.target.value || null) as any })} className="w-full px-1 py-0.5 rounded" style={inputSty}>
                    <option value="">—</option>
                    {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-1 py-1"><input type="number" value={r.squadNumber ?? ''} onChange={(e) => update(i, { squadNumber: parseInt(e.target.value) || null })} className="w-12 px-1 py-0.5 rounded" style={inputSty} /></td>
                <td className="px-1 py-1"><input type="date" value={r.dateOfBirth ?? ''} onChange={(e) => update(i, { dateOfBirth: e.target.value || null })} className="px-1 py-0.5 rounded" style={inputSty} /></td>
                <td className="px-1 py-1"><input value={r.nationality ?? ''} onChange={(e) => update(i, { nationality: e.target.value || null })} className="w-full px-1 py-0.5 rounded" style={inputSty} /></td>
                <td className="px-1 py-1"><button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="p-1 rounded" style={{ color: '#EF4444' }}><Trash2 size={10} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="text-xs px-3 py-1.5 rounded flex items-center gap-1" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}><Plus size={10} /> Add Player</button>
      <button onClick={onSave} disabled={busy || rows.length === 0} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>Save All Players</button>
    </div>
  )
}
