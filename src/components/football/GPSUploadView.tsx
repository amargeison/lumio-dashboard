'use client'

import { useState, useRef, useEffect } from 'react'
import { detectFormat } from '@/lib/gps-parser'
import type { ACWRResult } from '@/lib/acwr-calculator'

const C = {
  bg: '#07080F',
  card: '#111318',
  border: '#1F2937',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  yellow: '#F1C40F',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
}

type Stage = 'upload' | 'processing' | 'results'
type SessionType = 'Training' | 'Match' | 'Recovery'

const DEMO_NAMES = [
  'Marcus Browne', 'Mathew Stevens', 'Jamie Torres', 'Dele Adeyemi', 'Ryan Mills',
  'Tom Fletcher', 'Josh Henderson', 'Kai Nakamura', 'Tom Phillips', 'Ben Campbell',
  'Ryan Correia', 'Jack Williams', 'Lucas Santos', 'Marcus Cole', 'Connor Hughes',
  'Sam Bugiel', 'Liam Brennan', 'Rhys Okonkwo', 'Aaron Pierre', 'Owen Goodman',
  'Ethan Chislett',
]

function buildDemoResults(): ACWRResult[] {
  const arr: ACWRResult[] = []
  // 15 Low
  for (let i = 0; i < 15; i++) {
    const ratio = 0.9 + Math.random() * 0.35
    arr.push({
      playerName: DEMO_NAMES[i],
      acuteLoad: Math.round((600 + Math.random() * 250) * 100) / 100,
      chronicLoad: Math.round((550 + Math.random() * 200) * 100) / 100,
      acwrRatio: Math.round(ratio * 100) / 100,
      riskLevel: 'Low',
      flagged: false,
    })
  }
  // 3 Moderate
  for (let i = 15; i < 18; i++) {
    const ratio = 1.35 + Math.random() * 0.1
    arr.push({
      playerName: DEMO_NAMES[i],
      acuteLoad: Math.round((780 + Math.random() * 100) * 100) / 100,
      chronicLoad: Math.round((570 + Math.random() * 60) * 100) / 100,
      acwrRatio: Math.round(ratio * 100) / 100,
      riskLevel: 'Moderate',
      flagged: true,
    })
  }
  // 2 High
  for (let i = 18; i < 20; i++) {
    const ratio = 1.6 + Math.random() * 0.3
    arr.push({
      playerName: DEMO_NAMES[i],
      acuteLoad: Math.round((900 + Math.random() * 80) * 100) / 100,
      chronicLoad: Math.round((540 + Math.random() * 40) * 100) / 100,
      acwrRatio: Math.round(ratio * 100) / 100,
      riskLevel: 'High',
      flagged: true,
    })
  }
  // 1 Very High
  arr.push({
    playerName: DEMO_NAMES[20],
    acuteLoad: 1080,
    chronicLoad: 490,
    acwrRatio: 2.2,
    riskLevel: 'Very High',
    flagged: true,
  })
  return arr
}

function riskColor(r: ACWRResult['riskLevel']): string {
  switch (r) {
    case 'Undertraining': return C.blue
    case 'Low': return C.green
    case 'Moderate': return C.amber
    case 'High': return C.red
    case 'Very High': return C.red
  }
}

function RiskBadge({ level }: { level: ACWRResult['riskLevel'] }) {
  const color = riskColor(level)
  const pulsing = level === 'Very High'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${pulsing ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {level}
    </span>
  )
}

export default function GPSUploadView({ clubId, isDemo = false }: { clubId?: string | null; isDemo?: boolean }) {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [detected, setDetected] = useState<'Lumio' | 'Generic' | 'Unknown' | null>(null)
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [sessionType, setSessionType] = useState<SessionType>('Training')
  const [processingStep, setProcessingStep] = useState(0)
  const [results, setResults] = useState<ACWRResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Demo mode pre-populate
  useEffect(() => {
    if (isDemo && results.length === 0) {
      setResults(buildDemoResults())
      setStage('results')
    }
  }, [isDemo, results.length])

  async function handleFile(f: File) {
    setError(null)
    setFile(f)
    try {
      const text = await f.text()
      const firstLine = text.split(/\r?\n/)[0] || ''
      const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      setDetected(detectFormat(headers))
    } catch {
      setDetected('Unknown')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.name.toLowerCase().endsWith('.csv')) handleFile(f)
  }

  async function handleUpload() {
    if (!file || !clubId) {
      setError(!clubId ? 'No club selected' : 'No file chosen')
      return
    }
    setStage('processing')
    setProcessingStep(0)
    const stepTimer = setInterval(() => setProcessingStep((s) => Math.min(s + 1, 2)), 600)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('clubId', clubId)
      fd.append('sessionType', sessionType)

      const res = await fetch('/api/football/upload-gps', { method: 'POST', body: fd })
      const json = await res.json()
      clearInterval(stepTimer)

      if (!res.ok || !json.success) {
        setError(json.error || 'Upload failed')
        setStage('upload')
        return
      }

      setResults(Array.isArray(json.results) ? json.results : [])
      setStage('results')
    } catch (err) {
      clearInterval(stepTimer)
      setError('Upload failed')
      setStage('upload')
    }
  }

  function reset() {
    setFile(null)
    setDetected(null)
    setResults([])
    setError(null)
    setStage('upload')
  }

  function downloadCSV() {
    const lines = [
      'Player,Acute,Chronic,ACWR,Risk,Flagged',
      ...results.map((r) => `"${r.playerName}",${r.acuteLoad},${r.chronicLoad},${r.acwrRatio},${r.riskLevel},${r.flagged}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `acwr-report-${sessionDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── STAGE 1: Upload ───────────────────────────────────────────────────────
  if (stage === 'upload') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold" style={{ color: C.text }}>Upload GPS Session</h3>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Lumio GPS CSV exports (standard format).</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{
            backgroundColor: isDragging ? 'rgba(0,61,165,0.10)' : C.card,
            border: `2px dashed ${isDragging ? '#3B82F6' : C.border}`,
          }}
        >
          <div className="text-4xl mb-2">📁</div>
          <div className="text-sm font-semibold" style={{ color: C.text }}>
            {file ? file.name : 'Drop CSV here or click to browse'}
          </div>
          <div className="text-xs mt-1" style={{ color: C.muted }}>.csv files only</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>

        {file && detected && (
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{
                backgroundColor: detected === 'Unknown' ? `${C.amber}22` : 'rgba(0,61,165,0.15)',
                color: detected === 'Unknown' ? C.amber : C.yellow,
                border: `1px solid ${detected === 'Unknown' ? C.amber : 'rgba(0,61,165,0.3)'}`,
              }}
            >
              📡 {detected} {detected !== 'Unknown' ? 'detected' : 'format'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: C.muted }}>Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: C.muted }}>Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}
            >
              <option>Training</option>
              <option>Match</option>
              <option>Recovery</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: C.red, border: `1px solid ${C.red}55` }}>
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#003DA5', color: C.yellow, opacity: file ? 1 : 0.5 }}
        >
          Upload &amp; Calculate ACWR
        </button>
      </div>
    )
  }

  // ─── STAGE 2: Processing ───────────────────────────────────────────────────
  if (stage === 'processing') {
    const messages = ['Parsing GPS data...', 'Calculating ACWR scores...', 'Saving to database...']
    return (
      <div className="rounded-xl p-12 flex flex-col items-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="w-10 h-10 border-2 rounded-full animate-spin mb-4" style={{ borderColor: C.border, borderTopColor: C.blue }} />
        <div className="text-sm" style={{ color: C.text }}>{messages[processingStep]}</div>
      </div>
    )
  }

  // ─── STAGE 3: Results ──────────────────────────────────────────────────────
  const flaggedCount = results.filter((r) => r.flagged).length
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div>
          <div className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Session processed</div>
          <div className="text-lg font-bold mt-0.5" style={{ color: C.text }}>
            {results.length} players · <span style={{ color: flaggedCount > 0 ? C.red : C.green }}>{flaggedCount} flagged</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}>
            Download Report
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#003DA5', color: C.yellow }}>
            Upload Another
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left p-3">Player</th>
              <th className="text-right p-3">Load (AU)</th>
              <th className="text-right p-3">Acute</th>
              <th className="text-right p-3">Chronic</th>
              <th className="text-right p-3">ACWR</th>
              <th className="text-right p-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: r.flagged && (r.riskLevel === 'High' || r.riskLevel === 'Very High') ? 'rgba(239,68,68,0.05)' : undefined,
                }}
              >
                <td className="p-3 font-medium" style={{ color: C.text }}>{r.playerName}</td>
                <td className="p-3 text-right" style={{ color: C.muted }}>{Math.round(r.acuteLoad)}</td>
                <td className="p-3 text-right" style={{ color: C.muted }}>{r.acuteLoad}</td>
                <td className="p-3 text-right" style={{ color: C.muted }}>{r.chronicLoad}</td>
                <td className="p-3 text-right font-bold" style={{ color: C.text }}>{r.acwrRatio.toFixed(2)}</td>
                <td className="p-3 text-right"><RiskBadge level={r.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
