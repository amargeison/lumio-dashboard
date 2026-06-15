'use client'

// Men's Pro — Academy & Player Pathway. Mirrors the women's Academy view
// (overview / U18 / U21 / pathway tabs, GPS load chart, promotion pipeline,
// compliance audit, loan candidates) with men's EPPP / EFL data and blue
// accent. Demo only. Fictional players; EPPP/EFL/PSR are factual refs.

import { useState } from 'react'

const SH = ({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-white flex items-center gap-2"><span>{icon}</span>{title}</h2>
    <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
  </div>
)

const STAT_MAP: Record<string, { border: string; text: string }> = {
  blue:   { border: 'border-blue-600/30',   text: 'text-blue-300' },
  purple: { border: 'border-purple-600/30', text: 'text-purple-300' },
  green:  { border: 'border-green-600/30',  text: 'text-green-300' },
  amber:  { border: 'border-amber-600/30',  text: 'text-amber-300' },
  teal:   { border: 'border-teal-600/30',   text: 'text-teal-300' },
}
const Stat = ({ label, value, sub, color = 'blue' }: { label: string; value: string; sub: string; color?: string }) => {
  const c = STAT_MAP[color] ?? STAT_MAP.blue
  return (
    <div className={`bg-[#0D1117] border ${c.border} rounded-xl p-4`}>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className={`text-xs font-semibold mt-0.5 ${c.text}`}>{label}</div>
      <div className="text-[10px] text-gray-500 mt-1">{sub}</div>
    </div>
  )
}

export default function FootballAcademyView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'u18' | 'u21' | 'pathway'>('overview')
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

  const u18Players = [
    { id: 1,  name: 'Charlie Whitlock', age: 17, pos: 'CB',  gpsAvg: 71, devRating: 5, potential: 'Elite',  scholarshipYr: 2, appearances: 14, goals: 1,  assists: 2,  notes: 'Fast-track candidate. Composure on the ball exceptional for age. Nominated for U21 step-up May 2026.' },
    { id: 2,  name: 'Reggie Hart',      age: 17, pos: 'FW',  gpsAvg: 64, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 12, goals: 7,  assists: 3,  notes: 'Training with first team Fridays. Clinical finisher. Needs work on press contribution.' },
    { id: 3,  name: 'Finlay Webb',      age: 16, pos: 'CM',  gpsAvg: 58, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 9,  goals: 1,  assists: 4,  notes: 'Good technical base. Decision-making in tight spaces developing well.' },
    { id: 4,  name: 'Oscar Lane',       age: 15, pos: 'GK',  gpsAvg: 55, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 11, goals: 0,  assists: 0,  notes: 'Strong shot-stopper. Distribution improving. Youngest GK in the U18s.' },
    { id: 5,  name: 'Sonny Ashworth',   age: 17, pos: 'LB',  gpsAvg: 62, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 13, goals: 0,  assists: 6,  notes: 'Best delivery from wide areas in the academy. Registered scholar.' },
    { id: 6,  name: 'Rio Bashir',       age: 16, pos: 'DM',  gpsAvg: 60, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 8,  goals: 0,  assists: 1,  notes: 'Reads the game well. Physical development needed before first-team consideration.' },
    { id: 7,  name: 'Cole Duffy',       age: 17, pos: 'RW',  gpsAvg: 67, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 10, goals: 4,  assists: 5,  notes: 'Explosive in transition. Lumio Scout flagged as one of the top U18 wingers in the EFL region.' },
    { id: 8,  name: 'Aaron Regan',      age: 15, pos: 'CB',  gpsAvg: 52, devRating: 2, potential: 'Develop',scholarshipYr: 1, appearances: 5,  goals: 0,  assists: 0,  notes: 'Early-stage development. Good attitude. Needs a full season of U18 exposure.' },
    { id: 9,  name: 'Zane Mensah',      age: 16, pos: 'AM',  gpsAvg: 63, devRating: 4, potential: 'High',   scholarshipYr: 1, appearances: 11, goals: 3,  assists: 7,  notes: 'Creative. Sets the academy U18 assists record this season. Eye for a pass beyond his years.' },
    { id: 10, name: 'Lewis Holt',       age: 17, pos: 'FW',  gpsAvg: 59, devRating: 3, potential: 'Medium', scholarshipYr: 2, appearances: 10, goals: 5,  assists: 1,  notes: 'Hard-working press forward. Goals-to-shot ratio good. Needs to add pace.' },
    { id: 11, name: 'Ollie Devine',     age: 16, pos: 'RB',  gpsAvg: 57, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 7,  goals: 0,  assists: 2,  notes: 'Energetic full-back. Defensive positioning developing well. Strong attitude in training.' },
    { id: 12, name: 'Max Yates',        age: 17, pos: 'CM',  gpsAvg: 61, devRating: 3, potential: 'Medium', scholarshipYr: 2, appearances: 12, goals: 2,  assists: 3,  notes: 'Tidy in possession. Needs to add tempo to his passing under pressure.' },
    { id: 13, name: 'Sid Ford',         age: 15, pos: 'FW',  gpsAvg: 54, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 6,  goals: 3,  assists: 1,  notes: 'Sharp movement in the box. Youngest forward in the U18s — one to watch.' },
    { id: 14, name: 'Robbie Mackay',    age: 16, pos: 'CB',  gpsAvg: 58, devRating: 3, potential: 'Medium', scholarshipYr: 1, appearances: 9,  goals: 0,  assists: 0,  notes: 'Composed centre-half. Good in the air. Building match minutes this season.' },
    { id: 15, name: 'Theo Bennett',     age: 17, pos: 'LW',  gpsAvg: 64, devRating: 4, potential: 'High',   scholarshipYr: 2, appearances: 11, goals: 5,  assists: 4,  notes: 'Direct winger with end product. Lumio Scout flagged for U21 step-up next season.' },
  ]

  const u21Players = [
    { id: 16, name: 'Danny Cross',    age: 20, pos: 'CM', gpsAvg: 78, devRating: 4, potential: 'High',   contract: 'Scholar → Pro offer pending', appearances: 18, goals: 3,  assists: 9,  firstTeamSessions: 12, notes: 'Training with the first team regularly. DoF view: ready for a development loan next window.' },
    { id: 17, name: 'Pavan Sadhu',    age: 19, pos: 'LB', gpsAvg: 74, devRating: 4, potential: 'High',   contract: 'Scholar — Year 2',            appearances: 16, goals: 1,  assists: 8,  firstTeamSessions: 6,  notes: "Technically outstanding. Overlapping full-back — fits Hartley's system perfectly." },
    { id: 18, name: 'Eli Moran',      age: 21, pos: 'GK', gpsAvg: 70, devRating: 3, potential: 'Medium', contract: 'Pro contract — Year 1',        appearances: 20, goals: 0,  assists: 0,  firstTeamSessions: 4,  notes: '3rd-choice GK. Loan move to League Two recommended for regular minutes.' },
    { id: 19, name: 'Marcus Vane',    age: 20, pos: 'FW', gpsAvg: 82, devRating: 5, potential: 'Elite',  contract: 'Scholar → Pro contract offer',  appearances: 17, goals: 14, assists: 4,  firstTeamSessions: 18, notes: 'Top scorer in the U21 PDL. First-team debut made Feb 2026. Elite potential — protect from external interest.' },
    { id: 20, name: 'Abe Thornton',   age: 19, pos: 'CB', gpsAvg: 72, devRating: 3, potential: 'Medium', contract: 'Scholar — Year 1',            appearances: 15, goals: 1,  assists: 2,  firstTeamSessions: 2,  notes: 'Solid defensively. Aerial strength above average for age. Needs more first-team exposure.' },
    { id: 21, name: 'Reece Farr',     age: 21, pos: 'RW', gpsAvg: 76, devRating: 4, potential: 'High',   contract: 'Pro contract — Year 1',        appearances: 19, goals: 6,  assists: 10, firstTeamSessions: 8,  notes: 'Winger with excellent delivery. Pushing for a first-team squad place next season.' },
    { id: 22, name: 'Toby Flynn',     age: 20, pos: 'DM', gpsAvg: 69, devRating: 3, potential: 'Medium', contract: 'Scholar — Year 2',            appearances: 14, goals: 0,  assists: 3,  firstTeamSessions: 3,  notes: 'Reads the game well. Lacks top-end pace. Potential loan candidate Summer 2026.' },
    { id: 23, name: 'Ed Doyle',       age: 19, pos: 'CB', gpsAvg: 73, devRating: 3, potential: 'Medium', contract: 'Scholar — Year 2',            appearances: 16, goals: 0,  assists: 1,  firstTeamSessions: 3,  notes: 'Dependable defender. Strong communicator. Building toward first-team training invites.' },
    { id: 24, name: 'Fraser Sutton',  age: 20, pos: 'AM', gpsAvg: 75, devRating: 4, potential: 'High',   contract: 'Pro contract — Year 1',        appearances: 18, goals: 5,  assists: 7,  firstTeamSessions: 7,  notes: 'Creative number 10. Set-piece delivery a real asset. Pushing for a first-team bench spot.' },
    { id: 25, name: 'Connor Pryce',   age: 21, pos: 'GK', gpsAvg: 68, devRating: 3, potential: 'Medium', contract: 'Scholar — Year 2',            appearances: 12, goals: 0,  assists: 0,  firstTeamSessions: 2,  notes: 'Reliable understudy. Loan to a League Two side recommended for regular minutes.' },
    { id: 26, name: 'Morgan Royce',   age: 19, pos: 'ST', gpsAvg: 77, devRating: 4, potential: 'High',   contract: 'Scholar → Pro offer pending', appearances: 17, goals: 11, assists: 3,  firstTeamSessions: 9,  notes: 'Prolific in the U21 PDL. Trains with the first team midweek. Ready for loan consideration.' },
  ]

  const potentialColor = (p: string) =>
    p === 'Elite'  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40' :
    p === 'High'   ? 'bg-purple-600/20 text-purple-300' :
    p === 'Medium' ? 'bg-teal-600/20 text-teal-300' :
                     'bg-gray-800 text-gray-500'

  const devStars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

  const allPlayers = [...u18Players, ...u21Players]
  const selectedP  = selectedPlayer !== null ? allPlayers.find(p => p.id === selectedPlayer) : null

  const pathwaySteps = [
    { stage: 'U9–U16 YDP',       label: 'Youth Development Phase',               desc: 'EPPP-registered academy. Education & welfare officer. Safeguarding. Parent consent.' },
    { stage: 'U16 Scholar',      label: 'Scholarship Agreement',                 desc: 'Two-year scholarship. Weekly allowance. BTEC education programme. ISP development plan filed.' },
    { stage: 'U18 Academy',      label: 'U18 Professional Development League',    desc: 'U18 PDL. GPS profiling begins. Monthly development reviews.' },
    { stage: 'U21 PDP',          label: 'U21 Squad / Development Loan',           desc: 'Professional Development Phase. Premier League 2 / EFL Trophy minutes, or loan to a lower-league club.' },
    { stage: 'First Team Bridge',label: 'First Team Training Integration',        desc: 'Named in the first-team matchday squad. Senior contract offer triggered at this stage.' },
    { stage: 'First Team',       label: 'EFL First Team Contract',                desc: 'Full professional contract. PSR-compliant registration. EFL/PFA welfare protections apply.' },
  ]

  return (
    <div>
      <SH title="Academy & Player Pathway" subtitle="EPPP Category 2 · U18 · U21 · First Team Bridge" icon="🎓" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Academy Players" value="40"  sub="U18: 15 · U21: 11 · Scholars: 28" color="blue"   />
        <Stat label="Elite Potential" value="2"   sub="Charlie Whitlock · Marcus Vane"   color="purple" />
        <Stat label="First Team Ready" value="3"  sub="Loan candidates this window"      color="green"  />
        <Stat label="EPPP Compliance"  value="87%" sub="3 criteria outstanding"          color="amber"  />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview',   icon: '📊' },
          { id: 'u18',      label: 'U18 Squad',  icon: '🌱' },
          { id: 'u21',      label: 'U21 Squad',  icon: '⬆️' },
          { id: 'pathway',  label: 'Pathway',    icon: '🛤️' },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as typeof activeTab); setSelectedPlayer(null) }}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">EPPP Category 2 Academy — Audit Compliance</h3>
              <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">87% compliant</span>
            </div>
            <div className="space-y-2">
              {[
                { item: 'Qualified coaching staff ratio met (EPPP Category 2)',               status: 'green' },
                { item: 'Safeguarding DBS checks up to date (all staff)',                    status: 'green' },
                { item: 'Education & welfare officer in post',                               status: 'green' },
                { item: 'Player ISP development plans filed (all registered players)',        status: 'green' },
                { item: 'Medical screening completed (all academy players)',                  status: 'green' },
                { item: 'Parent/guardian consent and registration forms complete',           status: 'green' },
                { item: 'Safeguarding policy reviewed and published (within 12 months)',     status: 'green' },
                { item: 'GPS profiling in place (U18 and above)',                            status: 'green' },
                { item: 'Dedicated academy physiotherapy provision (not shared)',            status: 'amber', note: 'Currently shared with first team — standalone required by Aug 2026' },
                { item: 'Strength & conditioning coach dedicated to U18',                    status: 'amber', note: 'Recruitment underway — target start Jun 2026' },
                { item: 'Mental health practitioner dedicated to academy',                    status: 'red',   note: 'URGENT — EPPP audit requirement by Jun 2026. Board sign-off needed by 30 Apr.' },
              ].map((r, i) => (
                <div key={i} className={`flex items-start gap-2.5 py-2 border-b border-gray-800/50 last:border-0 ${r.status === 'red' ? 'bg-red-600/5 rounded px-2 -mx-2' : ''}`}>
                  <span className={`mt-0.5 flex-shrink-0 text-sm ${r.status === 'green' ? 'text-green-400' : r.status === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>
                    {r.status === 'green' ? '✓' : r.status === 'amber' ? '⚠' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-300">{r.item}</span>
                    {r.note && <p className={`text-[10px] mt-0.5 ${r.status === 'red' ? 'text-red-400' : 'text-amber-400'}`}>{r.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-1">GPS Load Profile — Academy vs First Team</h3>
            <p className="text-xs text-gray-500 mb-4">Average daily GPS load (AU) by squad. First team benchmark shown as dashed line.</p>
            {(() => {
              const W = 560, H = 160, padL = 40, padR = 16, padT = 16, padB = 36
              const innerW = W - padL - padR, innerH = H - padT - padB, maxGPS = 100, firstTeamAvg = 88
              const groups = [
                { label: 'U15', avg: 50, color: '#6B7280' }, { label: 'U16', avg: 58, color: '#8B5CF6' },
                { label: 'U17', avg: 64, color: '#3B82F6' }, { label: 'U18', avg: 63, color: '#0D9488' },
                { label: 'U21', avg: 77, color: '#60A5FA' }, { label: '1st', avg: 88, color: '#22C55E' },
              ]
              const barW = (innerW / groups.length) * 0.55, barGap = innerW / groups.length
              const ftY = padT + innerH - (firstTeamAvg / maxGPS) * innerH
              return (
                <svg viewBox={`0 0 ${W} ${H}`} width="100%">
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                  {[0, 25, 50, 75, 100].map((v, i) => <text key={i} x={padL - 6} y={padT + innerH - (v / maxGPS) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
                  <line x1={padL} x2={W - padR} y1={ftY} y2={ftY} stroke="#22C55E" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                  <text x={W - padR + 2} y={ftY + 3} fontSize="8" fill="#22C55E">1st avg</text>
                  {groups.map((g, i) => {
                    const barH = (g.avg / maxGPS) * innerH, x = padL + i * barGap + (barGap - barW) / 2
                    return (
                      <g key={g.label}>
                        <rect x={x} y={padT + innerH - barH} width={barW} height={barH} fill={g.color} opacity="0.8" rx="2" />
                        <text x={x + barW / 2} y={padT + innerH - barH - 4} fontSize="9" fill={g.color} textAnchor="middle" fontWeight="bold">{g.avg}</text>
                        <text x={x + barW / 2} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{g.label}</text>
                      </g>
                    )
                  })}
                </svg>
              )
            })()}
            <p className="text-[10px] text-gray-600 mt-2">GPS load increases progressively through the age groups. U21 squad operating at 88% of first-team avg — transition gap closing well.</p>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Promotion Pipeline — This Season</h3>
            <div className="space-y-3">
              {[
                { name: 'Marcus Vane',      from: 'U21', to: 'First Team',        status: 'Debut made Feb 2026',                 timing: 'Now',         color: 'green' },
                { name: 'Charlie Whitlock', from: 'U18', to: 'U21 / PDP',         status: 'Step-up nominated — pending Academy Mgr', timing: 'May 2026',  color: 'blue' },
                { name: 'Danny Cross',      from: 'U21', to: 'First Team Squad',  status: 'Pro offer pending — DoF decision',    timing: 'Summer 2026', color: 'blue' },
                { name: 'Reggie Hart',      from: 'U18', to: 'U21 / Friday train',status: 'Informal — no registration yet',      timing: 'Assess May',  color: 'amber' },
                { name: 'Eli Moran',        from: 'U21', to: 'Loan — League Two',  status: 'Loan recommended for minutes',        timing: 'Summer 2026', color: 'purple' },
              ].map((p, i) => (
                <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg border ${p.color === 'green' ? 'border-green-600/30 bg-green-600/5' : p.color === 'blue' ? 'border-blue-600/30 bg-blue-600/5' : p.color === 'amber' ? 'border-amber-600/30 bg-amber-600/5' : 'border-purple-600/30 bg-purple-600/5'}`}>
                  <div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-gray-500">{p.from} → {p.to}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${p.color === 'green' ? 'text-green-400' : p.color === 'blue' ? 'text-blue-400' : p.color === 'amber' ? 'text-amber-400' : 'text-purple-400'}`}>{p.status}</div>
                    <div className="text-[10px] text-gray-600">{p.timing}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Academy Goals (season)" value="44" sub="U18: 21 · U21: 23"    color="blue"   />
            <Stat label="Avg GPS Load — U21"     value="77" sub="AU/session"            color="teal"   />
            <Stat label="First Team Sessions"    value="53" sub="Academy players in FT" color="purple" />
            <Stat label="Scholar Contracts"      value="8"  sub="Active scholarships"   color="blue"   />
          </div>
        </div>
      )}

      {activeTab === 'u18' && (
        <div>
          {selectedP && selectedP.id <= 15 && (
            <div className="bg-[#0D1117] border border-blue-600/40 rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{selectedP.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor((selectedP as typeof u18Players[0]).potential)}`}>{(selectedP as typeof u18Players[0]).potential}</span>
                  </div>
                  <p className="text-xs text-gray-400">{selectedP.pos} · Age {selectedP.age} · Scholar Year {(selectedP as typeof u18Players[0]).scholarshipYr}</p>
                </div>
                <button onClick={() => setSelectedPlayer(null)} className="text-gray-600 hover:text-gray-400 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {[
                  { v: selectedP.gpsAvg, l: 'GPS avg (AU)', c: 'text-blue-400' },
                  { v: devStars((selectedP as typeof u18Players[0]).devRating), l: 'Dev rating', c: 'text-amber-400' },
                  { v: selectedP.appearances, l: 'Appearances', c: 'text-white' },
                  { v: selectedP.goals, l: 'Goals', c: 'text-green-400' },
                  { v: selectedP.assists, l: 'Assists', c: 'text-blue-400' },
                ].map(s => (
                  <div key={s.l} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center">
                    <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>GPS load vs first-team benchmark (88 AU)</span><span className={selectedP.gpsAvg >= 75 ? 'text-green-400' : selectedP.gpsAvg >= 60 ? 'text-amber-400' : 'text-gray-500'}>{selectedP.gpsAvg} AU — {((selectedP.gpsAvg / 88) * 100).toFixed(0)}% of 1st team</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min((selectedP.gpsAvg / 88) * 100, 100)}%` }} /></div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedP.notes}</p>
            </div>
          )}
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">U18 Academy Squad</h3>
              <span className="text-[10px] text-gray-500">{u18Players.length} players · EPPP registered</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider">
                <th className="text-left p-3">Player</th><th className="text-center p-3">Age</th><th className="text-center p-3">Pos</th><th className="text-center p-3">Scholar Yr</th><th className="text-center p-3">GPS avg</th><th className="text-center p-3">Dev rating</th><th className="text-center p-3">Apps</th><th className="text-center p-3">G</th><th className="text-center p-3">A</th><th className="text-left p-3">Potential</th><th className="p-3"></th>
              </tr></thead>
              <tbody>
                {u18Players.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPlayer(selectedPlayer === p.id ? null : p.id)} className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedPlayer === p.id ? 'bg-blue-600/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-3 text-gray-200 font-medium text-xs">{p.name}</td>
                    <td className="p-3 text-center text-xs text-gray-400">{p.age}</td>
                    <td className="p-3 text-center"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{p.pos}</span></td>
                    <td className="p-3 text-center text-xs text-gray-400">Yr {p.scholarshipYr}</td>
                    <td className="p-3 text-center"><span className={`text-xs font-bold ${p.gpsAvg >= 68 ? 'text-green-400' : p.gpsAvg >= 58 ? 'text-amber-400' : 'text-gray-500'}`}>{p.gpsAvg}</span></td>
                    <td className="p-3 text-center text-xs text-amber-400">{devStars(p.devRating)}</td>
                    <td className="p-3 text-center text-xs text-gray-300">{p.appearances}</td>
                    <td className="p-3 text-center text-xs text-green-400 font-bold">{p.goals}</td>
                    <td className="p-3 text-center text-xs text-blue-400 font-bold">{p.assists}</td>
                    <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor(p.potential)}`}>{p.potential}</span></td>
                    <td className="p-3 text-gray-600 text-xs">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-gray-800 text-[10px] text-gray-600">Click any player to expand GPS and development profile</div>
          </div>
        </div>
      )}

      {activeTab === 'u21' && (
        <div>
          {selectedP && selectedP.id >= 16 && (
            <div className="bg-[#0D1117] border border-blue-600/40 rounded-xl p-5 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{selectedP.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor((selectedP as typeof u21Players[0]).potential)}`}>{(selectedP as typeof u21Players[0]).potential}</span>
                  </div>
                  <p className="text-xs text-gray-400">{selectedP.pos} · Age {selectedP.age} · {(selectedP as typeof u21Players[0]).contract}</p>
                </div>
                <button onClick={() => setSelectedPlayer(null)} className="text-gray-600 hover:text-gray-400 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                {[
                  { v: selectedP.gpsAvg, l: 'GPS avg (AU)', c: 'text-blue-400' },
                  { v: selectedP.appearances, l: 'Appearances', c: 'text-white' },
                  { v: selectedP.goals, l: 'Goals', c: 'text-green-400' },
                  { v: selectedP.assists, l: 'Assists', c: 'text-blue-400' },
                  { v: (selectedP as typeof u21Players[0]).firstTeamSessions, l: '1st team sessions', c: 'text-purple-400' },
                ].map(s => (
                  <div key={s.l} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2.5 text-center">
                    <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-gray-500">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>GPS load vs first-team benchmark (88 AU)</span><span className={selectedP.gpsAvg >= 78 ? 'text-green-400' : 'text-amber-400'}>{selectedP.gpsAvg} AU — {((selectedP.gpsAvg / 88) * 100).toFixed(0)}% of 1st team</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min((selectedP.gpsAvg / 88) * 100, 100)}%` }} /></div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedP.notes}</p>
            </div>
          )}
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">U21 Development Squad</h3>
              <span className="text-[10px] text-gray-500">{u21Players.length} players</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-[10px] border-b border-gray-800 bg-gray-900/30 uppercase tracking-wider">
                <th className="text-left p-3">Player</th><th className="text-center p-3">Age</th><th className="text-center p-3">Pos</th><th className="text-center p-3">GPS avg</th><th className="text-center p-3">Apps</th><th className="text-center p-3">G</th><th className="text-center p-3">A</th><th className="text-center p-3">1st Team</th><th className="text-left p-3">Contract</th><th className="text-left p-3">Potential</th><th className="p-3"></th>
              </tr></thead>
              <tbody>
                {u21Players.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPlayer(selectedPlayer === p.id ? null : p.id)} className={`border-b border-gray-800/50 cursor-pointer transition-colors ${selectedPlayer === p.id ? 'bg-blue-600/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-3 text-gray-200 font-medium text-xs">{p.name}</td>
                    <td className="p-3 text-center text-xs text-gray-400">{p.age}</td>
                    <td className="p-3 text-center"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{p.pos}</span></td>
                    <td className="p-3 text-center"><span className={`text-xs font-bold ${p.gpsAvg >= 78 ? 'text-green-400' : p.gpsAvg >= 68 ? 'text-amber-400' : 'text-gray-500'}`}>{p.gpsAvg}</span></td>
                    <td className="p-3 text-center text-xs text-gray-300">{p.appearances}</td>
                    <td className="p-3 text-center text-xs text-green-400 font-bold">{p.goals}</td>
                    <td className="p-3 text-center text-xs text-blue-400 font-bold">{p.assists}</td>
                    <td className="p-3 text-center text-xs text-purple-400 font-medium">{p.firstTeamSessions}</td>
                    <td className="p-3 text-[10px] text-gray-400">{p.contract}</td>
                    <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${potentialColor(p.potential)}`}>{p.potential}</span></td>
                    <td className="p-3 text-gray-600 text-xs">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-gray-800 text-[10px] text-gray-600">Click any player to expand GPS and development profile</div>
          </div>
        </div>
      )}

      {activeTab === 'pathway' && (
        <div className="space-y-6">
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-5">Player Development Pathway — Oakridge FC Academy</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-800" />
              {pathwaySteps.map((step, i) => {
                const isActive = i >= 2 && i <= 4
                const colors = ['border-gray-600 bg-gray-800','border-gray-600 bg-gray-800','border-teal-500 bg-teal-500/20','border-blue-500 bg-blue-500/20','border-indigo-500 bg-indigo-500/20','border-green-500 bg-green-500/20']
                const labelColors = ['text-gray-400','text-gray-400','text-teal-400','text-blue-400','text-indigo-400','text-green-400']
                return (
                  <div key={i} className="flex gap-5 mb-6 pl-12 relative">
                    <div className={`absolute left-3 top-0.5 w-5 h-5 rounded-full border-2 ${colors[i]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold ${labelColors[i]}`}>{step.stage}</span>
                        {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400">Active</span>}
                      </div>
                      <div className="text-sm font-semibold text-white mb-1">{step.label}</div>
                      <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">EFL Loan Regulations — Men&apos;s Football</h3>
            <div className="space-y-2">
              {[
                'Players under 21 can be loaned between EFL / Premier League clubs (domestic loan)',
                'Maximum of 8 domestic loan players per club; no more than 4 from any one club',
                "Player must be eligible for the loan club's competition (registration, FFP/PSR)",
                'Loan period: minimum 28 days (short-term) up to a full season (long-term)',
                'Parent club may insert a recall clause (typically the January window)',
                'Player cannot play against the parent club unless the loan agreement permits',
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-gray-800/50 last:border-0">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-300">{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Current Loan Candidates</h3>
            <div className="space-y-3">
              {[
                { name: 'Charlie Whitlock', squad: 'U18 → U21 / Loan', status: 'Nominated', detail: 'CB · Age 17 · GPS 71 AU · Elite potential. Development loan to a League One/Two club recommended from May 2026.', action: 'Academy Mgr approval needed', color: 'blue' },
                { name: 'Eli Moran', squad: 'U21 → Loan', status: 'Recommended', detail: 'GK · Age 21 · 3rd-choice. Loan to League Two recommended for 2026/27 for regular minutes.', action: 'Summer window — target clubs identified', color: 'purple' },
                { name: 'Toby Flynn', squad: 'U21 → Loan', status: 'Under review', detail: 'DM · Age 20 · Lacks top-end pace for the Championship but technically sound. Loan candidate Summer 2026.', action: 'Review post-season', color: 'amber' },
              ].map((c, i) => (
                <div key={i} className={`rounded-xl p-4 border ${c.color === 'blue' ? 'border-blue-600/30 bg-blue-600/5' : c.color === 'purple' ? 'border-purple-600/30 bg-purple-600/5' : 'border-amber-600/30 bg-amber-600/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      <span className="text-[10px] text-gray-500">{c.squad}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.color === 'blue' ? 'bg-blue-600/20 text-blue-400' : c.color === 'purple' ? 'bg-purple-600/20 text-purple-400' : 'bg-amber-600/20 text-amber-400'}`}>{c.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{c.detail}</p>
                  <p className={`text-[10px] font-medium ${c.color === 'blue' ? 'text-blue-400' : c.color === 'purple' ? 'text-purple-400' : 'text-amber-400'}`}>→ {c.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
