'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Printer, Copy, Check, Eye, Edit3 } from 'lucide-react'
import {
  buildReportFromTemplate,
  estimateReadingTime,
  renderSectionAsText,
  type BuiltSection,
  type ReportTemplate,
  type MatchReportData,
} from '@/lib/match-report-builder'
import { usePDFExport } from '@/lib/pdf-export'
import PDFHeader from '@/components/football/pdf/PDFHeader'
import PDFMatchReport from '@/components/football/pdf/PDFMatchReport'

interface SquadPlayer { id?: string; name: string; position: string }
interface FixtureLike { opponent?: string; date?: string; venue?: string; competition?: string; result?: string }

interface Props {
  clubId: string | null
  clubName: string
  lastResult?: FixtureLike | null
  squad?: SquadPlayer[]
  leaguePosition?: number | null
  isDemo?: boolean
}

interface HistoryReport {
  id: string
  match_date: string
  opponent: string
  venue: string
  our_score: number
  opponent_score: number
  approved: boolean
  published_at: string | null
  word_count: number | null
  template_id: string | null
  report_data: any
  edited_content: any
  football_report_templates?: { template_name: string } | null
}

const FORMATIONS = ['4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3','5-3-2','4-1-4-1']

export default function MatchReportBuilder({ clubId, clubName, lastResult, squad = [], leaguePosition, isDemo }: Props) {
  const { exportPDF, isExporting: pdfExporting } = usePDFExport()
  const [view, setView] = useState<'builder' | 'history'>('builder')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [competition, setCompetition] = useState('EFL League One')
  const [venue, setVenue] = useState<'Home' | 'Away'>('Home')
  const [ourScore, setOurScore] = useState('0')
  const [opponentScore, setOpponentScore] = useState('0')
  const [ourFormation, setOurFormation] = useState('4-3-3')
  const [opponentFormation, setOpponentFormation] = useState('Unknown')
  const [scorers, setScorers] = useState<string[]>([])
  const [assisters, setAssisters] = useState<string[]>([])
  const [yellowCards, setYellowCards] = useState<string[]>([])
  const [redCards, setRedCards] = useState<string[]>([])
  const [manOfTheMatch, setManOfTheMatch] = useState('')
  const [attendance, setAttendance] = useState('')
  const [notes, setNotes] = useState('')

  // Generated report
  const [generating, setGenerating] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [reportData, setReportData] = useState<MatchReportData | null>(null)
  const [builtSections, setBuiltSections] = useState<BuiltSection[]>([])
  const [approved, setApproved] = useState(false)
  const [published, setPublished] = useState(false)
  const [version, setVersion] = useState(1)
  const [copied, setCopied] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [publishTargets, setPublishTargets] = useState<Record<string, boolean>>({ board: true, media: false, website: false })

  // Pre-fill from demo / lastResult
  useEffect(() => {
    if (isDemo) {
      setOpponent(lastResult?.opponent ?? 'Stockport County')
      setVenue((lastResult?.venue?.toLowerCase().startsWith('a') ? 'Away' : 'Away') as 'Away')
      setOurScore('1'); setOpponentScore('2')
      setCompetition('EFL League One')
      setMatchDate(lastResult?.date ?? new Date().toISOString().slice(0, 10))
      setNotes('Frustrating away loss — set-piece weakness exposed.')
    } else if (lastResult) {
      setOpponent(lastResult.opponent ?? '')
      setMatchDate(lastResult.date ?? '')
      setCompetition(lastResult.competition ?? 'EFL League One')
      setVenue(lastResult.venue?.toLowerCase().startsWith('a') ? 'Away' : 'Home')
    }
  }, [isDemo, lastResult])

  // Load templates + history
  async function loadTemplates() {
    if (!clubId) return
    try {
      // Templates aren't exposed via a dedicated endpoint — read via the GET match-reports join (or fall back).
      // For simplicity, fetch history and pluck templates from joined data; also fetch reports.
      const res = await fetch(`/api/football/match-reports?clubId=${clubId}`)
      const json = await res.json()
      if (res.ok) {
        setHistory(json.reports ?? [])
      }
    } catch { /* ignore */ }
  }
  async function loadTemplatesDirect() {
    if (!clubId) return
    try {
      const res = await fetch(`/api/football/match-reports?clubId=${clubId}`)
      void res
    } catch { /* ignore */ }
  }
  void loadTemplatesDirect

  // Templates: since there is no dedicated GET, read via supabase REST is overkill.
  // We embed a minimal hardcoded fallback list of the seeded 3 names in case templates can't be loaded —
  // these get replaced once the user generates a report and the API returns builtSections.
  useEffect(() => {
    if (!clubId) return
    setTemplates([
      { id: 'tmpl-board',    template_name: 'Board Match Report', template_type: 'Board Report',
        sections: [
          { id: 'narrative', title: 'Match Narrative',  type: 'narrative',     enabled: true, order: 1 },
          { id: 'stats',     title: 'Key Statistics',   type: 'stats_table',   enabled: true, order: 2 },
          { id: 'ratings',   title: 'Player Ratings',   type: 'player_ratings',enabled: true, order: 3 },
          { id: 'timeline',  title: 'Key Moments',      type: 'timeline',      enabled: true, order: 4 },
          { id: 'quote',     title: 'Manager Quote',    type: 'quote',         enabled: true, order: 5 },
        ],
      },
      { id: 'tmpl-media',    template_name: 'Media Press Release', template_type: 'Media Release',
        sections: [
          { id: 'narrative', title: 'Match Report',     type: 'narrative',         enabled: true, order: 1 },
          { id: 'quote',     title: 'Manager Reaction', type: 'quote',             enabled: true, order: 2 },
          { id: 'image',     title: 'Match Photo',      type: 'image_placeholder', enabled: true, order: 3 },
        ],
      },
      { id: 'tmpl-internal', template_name: 'Internal Summary', template_type: 'Internal Summary',
        sections: [
          { id: 'stats',     title: 'Statistics',           type: 'stats_table',   enabled: true, order: 1 },
          { id: 'ratings',   title: 'Performance Ratings', type: 'player_ratings', enabled: true, order: 2 },
          { id: 'narrative', title: 'Coach Notes',         type: 'narrative',      enabled: true, order: 3 },
        ],
      },
    ])
    setSelectedTemplateId('tmpl-board')
    loadTemplates()
  }, [clubId])

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId) ?? null, [templates, selectedTemplateId])

  async function handleGenerate() {
    if (!clubId || !opponent) { setError('Opponent required'); return }
    setError(null)
    setGenerating(true)
    setApproved(false)
    setPublished(false)
    try {
      const res = await fetch('/api/football/match-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId, clubName,
          opponent,
          matchDate: matchDate || null,
          competition,
          venue,
          ourScore: parseInt(ourScore, 10) || 0,
          opponentScore: parseInt(opponentScore, 10) || 0,
          ourFormation,
          opponentFormation: opponentFormation === 'Unknown' ? null : opponentFormation,
          scorers, assisters, yellowCards, redCards,
          manOfTheMatch: manOfTheMatch || null,
          attendanceNumber: attendance ? parseInt(attendance, 10) : null,
          leaguePosition: leaguePosition ?? null,
          notes,
          templateId: selectedTemplateId,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.report) {
        setError(json.error ?? 'Failed to generate')
      } else {
        setReportId(json.reportId ?? null)
        setReportData(json.report)
        // Re-build locally with selected template (server result may use template lookup by id, which our mock IDs don't match)
        if (selectedTemplate) {
          const built = buildReportFromTemplate(selectedTemplate, json.report, clubName)
          setBuiltSections(built.sections)
        } else if (json.builtSections) {
          setBuiltSections(json.builtSections)
        }
        setVersion(1)
        loadTemplates()
      }
    } catch {
      setError('Network error')
    } finally {
      setGenerating(false)
    }
  }

  function updateSection(sectionId: string, content: any) {
    setBuiltSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, content } : s))
  }

  async function approveReport() {
    if (!reportId) return
    try {
      const res = await fetch(`/api/ai/post-match/${reportId}/approve`, { method: 'PATCH' })
      if (res.ok) setApproved(true)
    } catch { /* ignore */ }
  }

  async function publishReport() {
    if (!reportId) return
    const targets = Object.entries(publishTargets).filter(([, v]) => v).map(([k]) => k)
    try {
      const res = await fetch(`/api/football/match-reports/${reportId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishTo: targets }),
      })
      if (res.ok) {
        setPublished(true)
        setShowPublish(false)
      }
    } catch { /* ignore */ }
  }

  async function saveEdits() {
    if (!reportId) return
    try {
      const res = await fetch(`/api/football/match-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editedContent: builtSections }),
      })
      const json = await res.json()
      if (res.ok) setVersion(json.version ?? version + 1)
    } catch { /* ignore */ }
  }

  function copyAll() {
    const text = builtSections.map(renderSectionAsText).filter(Boolean).join('\n')
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const wordCount = useMemo(() => {
    let n = 0
    for (const s of builtSections) {
      const c = s.content
      if (typeof c === 'string') n += c.split(/\s+/).filter(Boolean).length
      else if (Array.isArray(c)) for (const i of c) n += String(typeof i === 'string' ? i : Object.values(i).join(' ')).split(/\s+/).filter(Boolean).length
    }
    return n
  }, [builtSections])

  const status: 'Draft' | 'Approved' | 'Published' = published ? 'Published' : approved ? 'Approved' : 'Draft'
  const statusColor = status === 'Published' ? '#A855F7' : status === 'Approved' ? '#22C55E' : '#6B7280'

  return (
    <div className="space-y-4">
      {/* Top tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {([
            { id: 'builder' as const, label: '📄 Builder' },
            { id: 'history' as const, label: '📚 History' },
          ]).map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{
                backgroundColor: view === t.id ? '#7C3AED' : '#111318',
                color: view === t.id ? '#fff' : '#9CA3AF',
                border: '1px solid #1F2937',
              }}>{t.label}</button>
          ))}
        </div>
        {view === 'builder' && reportData && (
          <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: `${statusColor}33`, color: statusColor }}>
            {status}
          </span>
        )}
      </div>

      {view === 'history' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-sm font-bold">Recent Match Reports</h3>
          </div>
          {history.length === 0 ? (
            <p className="px-5 py-8 text-xs text-center" style={{ color: '#6B7280' }}>No reports yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Date','Opponent','Result','Template','Status','Words','Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-2" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((r) => {
                  const result = r.our_score > r.opponent_score ? 'W' : r.our_score < r.opponent_score ? 'L' : 'D'
                  const rc = result === 'W' ? '#22C55E' : result === 'L' ? '#EF4444' : '#F59E0B'
                  const st = r.published_at ? 'Published' : r.approved ? 'Approved' : 'Draft'
                  const sc = st === 'Published' ? '#A855F7' : st === 'Approved' ? '#22C55E' : '#6B7280'
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1F2937' }}>
                      <td className="px-4 py-2" style={{ color: '#9CA3AF' }}>{r.match_date}</td>
                      <td className="px-4 py-2 font-medium" style={{ color: '#F9FAFB' }}>{r.opponent}</td>
                      <td className="px-4 py-2"><span className="font-bold" style={{ color: rc }}>{result} {r.our_score}-{r.opponent_score}</span></td>
                      <td className="px-4 py-2" style={{ color: '#9CA3AF' }}>{r.football_report_templates?.template_name ?? '—'}</td>
                      <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${sc}33`, color: sc }}>{st}</span></td>
                      <td className="px-4 py-2" style={{ color: '#9CA3AF' }}>{r.word_count ?? '—'}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setReportData(r.report_data)
                            setBuiltSections(Array.isArray(r.edited_content) ? r.edited_content : [])
                            setReportId(r.id)
                            setApproved(!!r.approved)
                            setPublished(!!r.published_at)
                            setView('builder')
                          }}
                          className="text-[10px] px-2 py-1 rounded mr-1"
                          style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
                        >View</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="pdf-content" id="pdf-match-content" aria-hidden="true">
        <PDFHeader clubName={clubName} reportTitle="Match Report" reportSubtitle={opponent ? `vs ${opponent}` : undefined} />
        <PDFMatchReport report={reportData} clubName={clubName} opponent={opponent} ourScore={parseInt(ourScore, 10) || 0} opponentScore={parseInt(opponentScore, 10) || 0} competition={competition} venue={venue} date={matchDate} />
        <div className="pdf-footer"><span>Powered by Lumio · lumiosports.com</span><span>Confidential — {clubName} internal use</span><span>{new Date().toLocaleDateString('en-GB')}</span></div>
      </div>
      {view === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* LEFT: form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <h3 className="text-xs font-bold mb-3" style={{ color: '#A78BFA' }}>📄 Match Report Builder</h3>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{clubName} {opponent ? `· ${opponent}` : ''} {ourScore}–{opponentScore}</p>
              {isDemo && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>⚡ Live demo</span>}
            </div>

            <Section title="Match Info">
              <Field label="Opponent"><input value={opponent} onChange={(e) => setOpponent(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Date"><input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Competition"><input value={competition} onChange={(e) => setCompetition(e.target.value)} className={inputCls} /></Field>
              </div>
              <Field label="Venue">
                <div className="flex gap-2">
                  {(['Home','Away'] as const).map((v) => (
                    <button key={v} onClick={() => setVenue(v)} className="flex-1 text-xs py-1.5 rounded"
                      style={{ backgroundColor: venue === v ? '#7C3AED' : '#07080F', border: '1px solid #1F2937', color: venue === v ? '#fff' : '#9CA3AF' }}>{v}</button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Our Goals"><input type="number" value={ourScore} onChange={(e) => setOurScore(e.target.value)} className={inputCls} /></Field>
                <Field label="Opponent Goals"><input type="number" value={opponentScore} onChange={(e) => setOpponentScore(e.target.value)} className={inputCls} /></Field>
              </div>
            </Section>

            <Section title="Formations">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Our">
                  <select value={ourFormation} onChange={(e) => setOurFormation(e.target.value)} className={inputCls}>
                    {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Opponent">
                  <select value={opponentFormation} onChange={(e) => setOpponentFormation(e.target.value)} className={inputCls}>
                    <option>Unknown</option>
                    {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Match Events">
              <ChipInput label="Scorers" values={scorers} onChange={setScorers} />
              <ChipInput label="Assists" values={assisters} onChange={setAssisters} />
              <Field label="Man of the Match"><input value={manOfTheMatch} onChange={(e) => setManOfTheMatch(e.target.value)} className={inputCls} /></Field>
              <Field label="Attendance"><input type="number" value={attendance} onChange={(e) => setAttendance(e.target.value)} className={inputCls} /></Field>
            </Section>

            <Section title="Discipline">
              <ChipInput label="Yellow Cards" values={yellowCards} onChange={setYellowCards} />
              <ChipInput label="Red Cards" values={redCards} onChange={setRedCards} />
            </Section>

            <Section title="Notes">
              <p className="text-[10px] mb-1" style={{ color: '#6B7280' }}>These inform the AI tone and narrative</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
            </Section>

            <Section title="Template">
              <div className="space-y-2">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplateId(t.id)} className="w-full text-left p-3 rounded-lg"
                    style={{ backgroundColor: selectedTemplateId === t.id ? 'rgba(124,58,237,0.15)' : '#07080F', border: `1px solid ${selectedTemplateId === t.id ? '#7C3AED' : '#1F2937'}` }}>
                    <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{t.template_name}</p>
                    <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{t.sections.map((s) => s.title).join(' · ')}</p>
                  </button>
                ))}
              </div>
            </Section>

            <button onClick={handleGenerate} disabled={generating || !opponent} className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
              {generating ? 'Generating...' : reportData ? 'Regenerate Report' : 'Generate Report'}
            </button>
            {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
          </div>

          {/* RIGHT: preview */}
          <div className="lg:col-span-3 space-y-3">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: '#9CA3AF' }}>
                <span>📝 {wordCount} words</span>
                <span>⏱ {estimateReadingTime(wordCount)}</span>
                <span>v{version}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={copyAll} disabled={builtSections.length === 0} className="text-[10px] px-2 py-1.5 rounded flex items-center gap-1 disabled:opacity-40" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>
                  {copied ? <Check size={10} /> : <Copy size={10} />} Copy All
                </button>
                <button onClick={saveEdits} disabled={!reportId} className="text-[10px] px-2 py-1.5 rounded disabled:opacity-40" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>Save Edits</button>
                <button onClick={approveReport} disabled={!reportId || approved} className="text-[10px] px-2 py-1.5 rounded font-semibold disabled:opacity-60" style={{ backgroundColor: approved ? '#22C55E' : 'rgba(34,197,94,0.2)', color: approved ? '#000' : '#22C55E' }}>
                  {approved ? '✓ Approved' : 'Approve'}
                </button>
                <div className="relative">
                  <button onClick={() => setShowPublish((v) => !v)} disabled={!reportId} className="text-[10px] px-2 py-1.5 rounded font-semibold disabled:opacity-40" style={{ backgroundColor: '#A855F7', color: '#fff' }}>
                    {published ? '✓ Published' : 'Publish ▾'}
                  </button>
                  {showPublish && (
                    <div className="absolute right-0 mt-1 p-2 rounded-lg z-20" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', minWidth: 140 }}>
                      {(['board','media','website'] as const).map((t) => (
                        <label key={t} className="flex items-center gap-2 text-xs py-1" style={{ color: '#F9FAFB' }}>
                          <input type="checkbox" checked={!!publishTargets[t]} onChange={(e) => setPublishTargets((p) => ({ ...p, [t]: e.target.checked }))} />
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </label>
                      ))}
                      <button onClick={publishReport} className="w-full mt-1 text-[10px] py-1 rounded font-semibold" style={{ backgroundColor: '#A855F7', color: '#fff' }}>Publish</button>
                    </div>
                  )}
                </div>
                <button onClick={() => exportPDF('match', `${clubName} vs ${opponent} Match Report.pdf`)} disabled={pdfExporting} className="text-[10px] px-2 py-1.5 rounded flex items-center gap-1 disabled:opacity-50" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                  <Printer size={10} /> {pdfExporting ? '...' : '📄 PDF'}
                </button>
              </div>
            </div>

            {/* Sections */}
            {builtSections.length === 0 ? (
              <div className="rounded-xl p-10 text-center space-y-3" style={{ backgroundColor: '#111318', border: '1px dashed #1F2937' }}>
                {selectedTemplate?.sections.map((s) => (
                  <div key={s.id} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <p className="text-[10px] uppercase font-bold" style={{ color: '#6B7280' }}>{s.type}</p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.title}</p>
                  </div>
                ))}
                <p className="text-xs" style={{ color: '#6B7280' }}>Generate Report to populate →</p>
              </div>
            ) : (
              builtSections.map((s) => (
                <SectionCard key={s.id} section={s} onChange={(c) => updateSection(s.id, c)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full px-2 py-1.5 rounded text-xs'
function inputStyle() { return { backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' } }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#6B7280' }}>{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{label}</label>
      <div className="mt-0.5" style={inputStyle()}>{React.cloneElement(children as React.ReactElement<any>, { style: inputStyle() })}</div>
    </div>
  )
}

function ChipInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <div>
      <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{label}</label>
      <div className="mt-0.5 flex flex-wrap gap-1 p-1.5 rounded" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', minHeight: 32 }}>
        {values.map((v, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-[10px]" style={{ color: '#9CA3AF' }}>×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault()
              onChange([...values, draft.trim()])
              setDraft('')
            }
          }}
          placeholder="Type + Enter"
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: '#F9FAFB', minWidth: 80 }}
        />
      </div>
    </div>
  )
}

function SectionCard({ section, onChange }: { section: BuiltSection; onChange: (c: any) => void }) {
  if (!section.enabled) return null
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase" style={{ color: '#A78BFA' }}>{section.title}</h4>
        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{section.type}</span>
      </div>

      {section.type === 'narrative' && (
        <textarea
          value={typeof section.content === 'string' ? section.content : ''}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="w-full px-2 py-1.5 rounded text-xs font-mono"
          style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#D1D5DB' }}
        />
      )}

      {section.type === 'stats_table' && Array.isArray(section.content) && (
        <table className="w-full text-xs">
          <tbody>
            {(section.content as { label: string; value: string }[]).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                <td className="py-1.5" style={{ color: '#9CA3AF' }}>{r.label}</td>
                <td className="py-1.5 text-right font-bold" style={{ color: '#F9FAFB' }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section.type === 'player_ratings' && Array.isArray(section.content) && (
        <div className="space-y-2">
          {(section.content as any[]).map((p, i) => (
            <div key={i} className="rounded-lg p-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{p.name} <span className="text-[10px]" style={{ color: '#9CA3AF' }}>({p.position})</span></p>
                <input type="range" min={1} max={10} step={0.1} value={p.rating} onChange={(e) => {
                  const next = (section.content as any[]).map((x, j) => j === i ? { ...x, rating: parseFloat(e.target.value) } : x)
                  onChange(next)
                }} />
                <span className="text-xs font-bold" style={{ color: '#F1C40F' }}>{Number(p.rating).toFixed(1)}</span>
              </div>
              <textarea value={p.comment} onChange={(e) => {
                const next = (section.content as any[]).map((x, j) => j === i ? { ...x, comment: e.target.value } : x)
                onChange(next)
              }} rows={2} className="mt-1 w-full text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#D1D5DB' }} />
            </div>
          ))}
        </div>
      )}

      {section.type === 'timeline' && Array.isArray(section.content) && (
        <ul className="space-y-1">
          {(section.content as any[]).map((m, i) => (
            <li key={i} className="text-xs flex items-start gap-2">
              <span className="font-bold" style={{ color: '#F1C40F', minWidth: 30 }}>{m.minute}'</span>
              <input value={`${m.type}: ${m.description} (${m.player})`} onChange={(e) => {
                const next = [...(section.content as any[])]
                next[i] = { ...m, description: e.target.value }
                onChange(next)
              }} className="flex-1 bg-transparent" style={{ color: '#D1D5DB' }} />
            </li>
          ))}
        </ul>
      )}

      {section.type === 'quote' && (
        <blockquote className="border-l-2 pl-3 italic text-sm" style={{ borderColor: '#7C3AED', color: '#D1D5DB' }}>
          <textarea value={typeof section.content === 'string' ? section.content : ''} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full bg-transparent outline-none italic" style={{ color: '#D1D5DB' }} />
        </blockquote>
      )}

      {section.type === 'image_placeholder' && (
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#0A0B10', border: '1px dashed #1F2937', color: '#6B7280' }}>
          📷 Add match photo (upload coming soon)
        </div>
      )}
    </div>
  )
}
