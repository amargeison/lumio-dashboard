'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mic } from 'lucide-react'

// ─── Role Showcase Data ──────────────────────────────────────────────────────

const ROLES = [
  { id: 'dof', emoji: '👔', label: 'Director of Football',
    features: [
      { name: 'Transfer Pipeline Manager', steps: ['Active targets tracked — position, value, agent, status', 'Window countdown — days, hours, minutes', 'Budget dashboard — spent, committed, remaining', 'Work permit tracker — post-Brexit requirements', 'Agent contact log — last contact, next action', 'Bid workflow — configure → submit → track'], outcome: 'Never miss a transfer deadline. Every target tracked, every agent logged, every deadline visible.' },
      { name: 'Contract Expiry Tracker', steps: ['Visual timeline of all contract end dates', 'Priority renewals flagged in red', 'Agent involved for each player', 'Wage budget impact of renewal', 'Board approval workflow', 'Release clause tracker'], outcome: 'See exactly which contracts need attention — today, this month, this season.' },
      { name: 'Squad Planner (2-season)', steps: ['Current squad with contract status', 'Next season projection — who leaves, who stays', 'Position gaps highlighted automatically', 'Academy pipeline integrated', 'Hypothetical targets added to plan', 'Export to board as visual report'], outcome: 'Plan two seasons ahead. Know exactly which positions need filling and when.' },
      { name: 'AI Morning Briefing', steps: ['Squad fitness summary', 'Transfer window updates', 'Contract alerts', 'Agent messages', 'Academy highlights', 'Board items for today'], outcome: 'Everything you need to know — read aloud in 60 seconds every morning.' },
      { name: 'Board Report Generator', steps: ['Select report type and period', 'AI compiles data across all departments', 'Financial summary auto-included', 'Transfer activity summarised', 'Squad performance metrics', 'Export as PDF or presentation'], outcome: 'Board-ready reports generated in seconds, not days.' },
      { name: 'PSR / FFP Dashboard', steps: ['3-year rolling loss calculated automatically', 'Allowable deductions tracked', 'What-if calculator for transfers', 'Year-end projection updated live', 'Wage/revenue ratio monitored', 'Board-ready compliance report'], outcome: 'Know your PSR position every day. Never risk a points deduction.' },
    ],
  },
  { id: 'coach', emoji: '⚽', label: 'Head Coach',
    features: [
      { name: 'Match Prep Pack', steps: ['Select upcoming fixture', 'AI analyses opposition — formation, key threats, recent form', 'Generates full prep pack — tactical approach, set piece plan', 'Share with coaching staff instantly', 'Video session agenda auto-created', 'Talking points for team meeting generated'], outcome: 'Walk into every match with a complete preparation pack. Generated in 60 seconds.' },
      { name: 'Team Sheet Builder', steps: ['Drag and drop players into formation', 'Fitness status shown per player', 'Form rating displayed', 'Auto-suggest based on opposition', 'Save and share with staff', 'Print for dressing room'], outcome: 'Build your team sheet in seconds with full squad intelligence.' },
      { name: 'Training Planner', steps: ['Weekly training calendar', 'GPS load per player tracked', 'Session templates for tactical, technical, fitness', 'Recovery group management', 'Share plan with medical team', 'Adjust based on upcoming fixtures'], outcome: 'Plan training around matches, load and fitness — not guesswork.' },
      { name: 'Team Talks (AI)', steps: ['Select match situation (pre-match, half-time, post-match)', 'AI generates contextual talk based on form, opponent, score', 'Key messages highlighted', 'Player to single out suggested', 'Save to match record', 'Print for dugout clipboard'], outcome: 'AI-generated team talks tailored to every situation.' },
      { name: 'Opposition Analysis', steps: ['Next opponent auto-loaded', 'Their formation and key players', 'Strengths and weaknesses identified', 'Set piece threats flagged', 'Their last 5 results analysed', 'Suggested tactical approach'], outcome: 'Know your opponent better than they know themselves.' },
      { name: 'Set Piece Creator', steps: ['Visual pitch editor', 'Drag players to positions', 'Draw movement arrows', 'Save corner/free kick routines', 'Share with players on tablet', 'Review success rate per routine'], outcome: 'Design, save and drill set pieces with a visual builder.' },
    ],
  },
  { id: 'medical', emoji: '🏥', label: 'Medical',
    features: [
      { name: 'GPS Load Monitor', steps: ['GPS data ingested from Catapult/STATSports', 'Training load calculated per player', 'Traffic light system — red/amber/green', 'Overload alerts flagged before injury', '4-week rolling average comparison', 'Report shared with coach automatically'], outcome: 'Reduce soft tissue injuries by monitoring load before players break down.' },
      { name: 'Injury Tracker', steps: ['Log injury with body part, type, severity', 'Treatment phase tracked (acute → rehab → return)', 'Expected return date set and monitored', 'Matches missed counter', 'Physio assignment', 'Insurance and cost tracking'], outcome: 'Every injury logged, tracked and resolved systematically.' },
      { name: 'Return to Play Protocol', steps: ['Structured return phases', 'Medical clearance at each gate', 'Coach updated on return timeline', 'Match fitness assessment', 'First match back flagged for monitoring', 'Full audit trail'], outcome: 'Structured, safe return to play — no more rushing players back.' },
      { name: 'Wellness Check-ins', steps: ['Daily wellness form sent to players', 'Sleep, mood, soreness, fatigue scored', 'Trends tracked over time', 'Red flags surfaced to medical team', 'Individual and squad averages', 'Pre-match readiness score'], outcome: 'Catch fatigue, stress and illness before it becomes an injury.' },
      { name: 'Medical Clearance', steps: ['Pre-match fitness test logged', 'Doctor sign-off required', 'Player status updated across all views', 'Coach notified automatically', 'Match day squad updated', 'Full medical audit trail'], outcome: 'Clear, documented medical decisions for every match.' },
      { name: 'Screening Manager', steps: ['Pre-season cardiac screening', 'Musculoskeletal assessments', 'Baseline fitness tests', 'Results stored securely', 'Annual comparison', 'Compliance reporting'], outcome: 'Complete screening records — always ready for inspection.' },
    ],
  },
  { id: 'recruitment', emoji: '🔭', label: 'Recruitment',
    features: [
      { name: 'Shadow Squad Builder', steps: ['Select positions to strengthen', 'Match targets from database to positions', 'Side-by-side: current player vs target', 'Budget impact calculated automatically', 'Present to board as visual squad plan', 'Save and update as window progresses'], outcome: 'Show the board exactly what the squad looks like with each target signed.' },
      { name: 'Target List Manager', steps: ['Full target database with ratings', 'Filter by position, age, value, nationality', 'Scout assignment per target', 'Status tracking (monitoring → shortlisted → bid)', 'Video analysis links', 'Market value trends'], outcome: 'Your entire recruitment pipeline in one view.' },
      { name: 'Scout Network', steps: ['All scouts — location, territory, schedule', 'Reports submitted tracked', 'Top recommendation highlighted', 'Match attendance logged', 'Expense tracking', 'Performance metrics per scout'], outcome: 'Deploy scouts intelligently. Track every report and recommendation.' },
      { name: 'Agent Intelligence', steps: ['All agents in one contact database', 'Players they represent', 'Active conversations logged', 'Meeting notes saved', 'Commission terms tracked', 'Alert when agent contacts rival clubs'], outcome: 'Know every agent, every conversation, every deal on the table.' },
      { name: 'Market Value Tracker', steps: ['Transfermarkt integration placeholder', 'Value trends for all targets', 'Contract status monitored', 'Competing club interest flagged', 'Price comparison by position', 'Best value recommendations'], outcome: 'Buy smart. Know exactly what every player is worth.' },
      { name: 'Offload Pipeline', steps: ['Players available for transfer listed', 'Asking price and minimum fee set', 'Enquiries tracked', 'Agent appointed for marketing', 'AI suggests interested clubs', 'Loan vs permanent options'], outcome: 'Move players on efficiently. Every enquiry tracked.' },
    ],
  },
  { id: 'academy', emoji: '🎓', label: 'Academy',
    features: [
      { name: 'EPPP Compliance', steps: ['All EPPP requirements in one dashboard', 'Coaching hours — actual vs required', 'Education compliance tracked', 'Welfare checks scheduled and logged', 'Facilities compliance — inspection dates', 'Submit to Premier League / EFL directly'], outcome: 'Never fail an EPPP audit. Every requirement tracked, every deadline met.' },
      { name: 'Development Plans', steps: ['Individual development plan per player', 'Technical, tactical, physical, psychological goals', 'Progress tracked monthly', 'Coach assessments logged', 'Parent meetings recorded', 'Pathway decisions documented'], outcome: 'Every young player has a clear, tracked development pathway.' },
      { name: 'Mentoring Programme', steps: ['Pair senior players with academy prospects', 'Set focus area and goals', 'Track development impact', 'Relationship quality monitored', 'Duration and review dates', 'Impact on player attributes measured'], outcome: 'Structured mentoring that develops young players faster.' },
      { name: 'Pathway Tracker', steps: ['All academy players rated on pathway scale', 'First Team Ready / Pathway / Developing / Released', 'Timeline to first team estimated', 'Loan recommendations for development', 'Position-specific development milestones', 'Coach and parent aligned on expectations'], outcome: 'Know exactly who is ready for the first team and when.' },
      { name: 'Trial Management', steps: ['Trial player registration', 'Assessment criteria set', 'Multiple assessors score independently', 'Video clips attached', 'Verdict: sign / release / extend trial', 'Parent communication logged'], outcome: 'Professional, fair and documented trial processes.' },
      { name: 'Release Decisions', steps: ['Players approaching contract decisions listed', 'Development rating and trajectory', 'Coach recommendation', 'Parent meeting scheduled', 'Scholarship offer or release letter', 'Pastoral support for released players'], outcome: 'Handle the hardest decisions in football with care and process.' },
    ],
  },
  { id: 'analysis', emoji: '📊', label: 'Analysis',
    features: [
      { name: 'Interactive Tactics Viewer', steps: ['Select any recent match', 'Interactive SVG pitch — click any player for stats', 'Formation shown with positions and squad numbers', 'Switch between heat map, pass map, annotations', 'Season formation summary — win rate per shape', 'Export for team meeting presentation'], outcome: 'Click on any match, any player, any formation. The data is all there.' },
      { name: 'xG Dashboard', steps: ['Season xG for and against tracked', 'Per-match xG breakdown', 'Expected vs actual goals comparison', 'Chance quality analysis', 'Trend over season visualised', 'Share with coaching staff'], outcome: 'Understand your attacking and defensive performance beyond the scoreline.' },
      { name: 'Set Piece Analysis', steps: ['Corners scored and conceded', 'Free kick success rate', 'Penalty record', 'Delivery zones tracked', 'Defensive set piece vulnerabilities', 'Opposition set piece threats for next match'], outcome: 'Set pieces win and lose matches. Know exactly where you stand.' },
      { name: 'Pressing Metrics', steps: ['PPDA tracked per match', 'High turnover rate', 'Press success by area of pitch', 'Player-level pressing intensity', 'Comparison with Championship average', 'Impact on results analysed'], outcome: 'Measure your press. Refine your approach. Win the ball higher.' },
      { name: 'Formation Performance', steps: ['Win rate by formation', 'Goals scored and conceded per shape', 'xG difference by formation', 'Best formation vs different opponent styles', 'Player performance in each formation', 'Recommended formation for next match'], outcome: 'Data-driven formation decisions. Not gut feeling.' },
      { name: 'Player Analytics', steps: ['Individual player dashboards', 'Progressive carries, key passes, duels won', 'Aerial win %, tackle success', 'Pressing intensity per player', 'Season trend graphs', 'Benchmark against Championship averages'], outcome: 'Deep individual analytics for every player in your squad.' },
    ],
  },
  { id: 'finance', emoji: '💰', label: 'Finance & PSR',
    features: [
      { name: 'PSR Dashboard', steps: ['3-year rolling loss calculated automatically', 'Allowable deductions tracked (academy, women\'s, infrastructure)', 'Current PSR position: Safe / Monitor / At Risk', 'Year-end projection updated in real time', 'What-if calculator — drag slider to model transfer impact', 'Board-ready PSR report generated in one click'], outcome: 'Know your PSR position every single day. Never get a points deduction.' },
      { name: 'Wage Budget Tracker', steps: ['Weekly wage bill — actual vs budget', 'Wage/revenue ratio monitored', 'Highest earner identified', 'Headroom for new signings calculated', 'Bonus payments projected', 'Comparison with Championship average'], outcome: 'Control your biggest cost. No surprises on wage day.' },
      { name: 'Revenue Dashboard', steps: ['Match day, broadcasting, commercial, transfer revenue', 'Actual vs budget vs last season', 'Variance analysis', 'Revenue forecast to year end', 'Department-level cost tracking', 'Board financial summary'], outcome: 'Complete financial visibility. Revenue, costs, projections — all in one place.' },
      { name: 'What-If Calculator', steps: ['Set purchase amount (slider)', 'Set sale amount (slider)', 'PSR position updates in real time', 'Wage impact shown', 'Revenue impact projected', 'Safe / Monitor / Breach status shown'], outcome: 'Model any transfer before you commit. Know the financial impact instantly.' },
      { name: 'Transfer Fee Schedule', steps: ['Instalment payments tracked', 'Amounts due per window', 'Cash flow impact', 'Sell-on clauses monitored', 'Agent fee commitments', 'Total exposure calculated'], outcome: 'Know exactly what you owe and when. No cash flow surprises.' },
      { name: 'Board Financial Pack', steps: ['Select report period', 'AI compiles financial data', 'Revenue vs budget included', 'PSR position highlighted', 'Wage analysis auto-generated', 'Export as board-ready PDF'], outcome: 'Financial reporting for the board — generated in seconds.' },
    ],
  },
  { id: 'dynamics', emoji: '🧠', label: 'Dynamics',
    features: [
      { name: 'Dressing Room Atmosphere', steps: ['Overall atmosphere score — 0 to 100', 'Four pillars: Cohesion, Trust, Playing Time, Training', 'Individual player happiness — 6 dimensions', 'High risk players flagged automatically', 'Social groups mapped — who influences who', 'Team meeting agenda generated by AI'], outcome: 'Know when your dressing room is about to explode — before it does.' },
      { name: 'Player Happiness Tracker', steps: ['Every player scored across 6 dimensions', 'Morale, training, playing time, contract, form, overall', 'Traffic light system per player', 'Risk level: High / Medium / Low', 'Trend over time tracked', 'Intervention recommendations'], outcome: 'Unhappy players cost you points. Know who needs attention.' },
      { name: 'Squad Hierarchy', steps: ['4-tier pyramid: Leaders, Influential, Core, Fringe', 'Identify who drives the culture', 'New signing integration status', 'Natural leaders vs appointed captains', 'Influence mapping across social groups', 'Succession planning for leadership'], outcome: 'Understand your squad dynamics at every level.' },
      { name: 'Code of Conduct', steps: ['Set season rules and punishments', 'Disciplinary log maintained', 'Fines tracked and collected', 'Appeal process documented', 'Consistency across squad ensured', 'Season review generated'], outcome: 'Clear, fair, consistent discipline. Documented and defensible.' },
      { name: 'Team Talks (AI)', steps: ['Select situation: pre-match, half-time, post-match', 'AI generates talk based on form, opponent, score', 'Key messages highlighted', 'Players to praise or address suggested', 'Body language guidance included', 'Save talk to match record'], outcome: 'AI-generated team talks for every situation your manager faces.' },
      { name: 'Social Groups', steps: ['Map social clusters within the squad', 'Identify group leaders and influencers', 'New signing: which group will they join?', 'Cross-group cohesion score', 'Potential conflict zones flagged', 'Integration plan for transfers'], outcome: 'Every squad has social groups. Lumio maps them so you can manage them.' },
    ],
  },
]

const VOICE_COMMANDS = [
  { category: 'Matchday', commands: ['"Who\'s fit for Saturday?"', '"Flag Mensah as match day doubt"', '"What time is kick off?"', '"Build me a team sheet"'] },
  { category: 'Transfers', commands: ['"What\'s our transfer budget?"', '"Any agent messages today?"', '"How many days until the window closes?"', '"Show me the target list"'] },
  { category: 'Management', commands: ['"Log injury for Webb"', '"Book the video analysis room"', '"Generate the board report"', '"Show academy highlights"'] },
]

const DEPARTMENTS = [
  { emoji: '⚽', name: 'First Team', desc: 'Squad, training, form and match prep' },
  { emoji: '🏥', name: 'Medical', desc: 'Injuries, GPS, wellness and screening' },
  { emoji: '🔭', name: 'Scouting', desc: 'Targets, scouts, agents and market intel' },
  { emoji: '🎓', name: 'Academy', desc: 'Youth development, EPPP and pathways' },
  { emoji: '💸', name: 'Transfers', desc: 'Pipeline, bids, window and budget' },
  { emoji: '📋', name: 'Contracts', desc: 'Expiries, wages, renewals and agents' },
  { emoji: '📊', name: 'Analysis', desc: 'Tactics, xG, formations and set pieces' },
  { emoji: '🏟️', name: 'Operations', desc: 'Registration, travel and compliance' },
  { emoji: '💰', name: 'Finance & PSR', desc: 'Revenue, wages, FFP and forecasting' },
  { emoji: '📣', name: 'Media & PR', desc: 'Press, social, interviews and statements' },
  { emoji: '📱', name: 'Social Media', desc: 'Followers, sentiment and content calendar' },
  { emoji: '🧠', name: 'Player Dynamics', desc: 'Morale, happiness, hierarchy and discipline' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FootballLandingPage() {
  const [activeRole, setActiveRole] = useState('dof')
  const [activeFeature, setActiveFeature] = useState(0)

  const role = ROLES.find(r => r.id === activeRole)!
  const feature = role.features[activeFeature]

  return (
    <div style={{ backgroundColor: '#07080F' }}>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden py-28 text-center" style={{ background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 40%, #1a0505 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #C0392B 0%, transparent 50%), radial-gradient(circle at 70% 30%, #F1C40F 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8" style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#E74C3C', border: '1px solid rgba(192,57,43,0.3)' }}>⚽ Lumio Pro Club — Now Live</div>
          <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            The connected operating system for<br />professional football clubs
          </h1>
          <p className="text-xl md:text-2xl font-bold mb-6" style={{ color: '#F1C40F' }}>From the training ground to the boardroom.</p>
          <p className="text-lg mx-auto mb-10" style={{ color: '#9CA3AF', maxWidth: 640, lineHeight: 1.7 }}>
            Squad management, scouting, transfers, medical, academy, analysis, player dynamics and operations — unified in one AI-powered platform. Voice-controlled. Board-ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link href="/demo/football/oakridge-fc" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#C0392B', color: '#F9FAFB' }}>Try the demo <ArrowRight size={16} /></Link>
            <Link href="https://calendly.com/lumiocms/pro-club" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>Book a demo</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: '#9CA3AF' }}>
            <span>⚽ 15 departments</span><span>🎙️ 30+ voice commands</span><span>🤖 AI-powered briefings</span>
          </div>
        </div>
      </section>

      {/* ═══ ROLE-BASED SHOWCASE ═══ */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3" style={{ color: '#F9FAFB' }}>Everything your club needs</h2>
            <p className="text-base" style={{ color: '#9CA3AF' }}>Click a role. See exactly what Lumio Pro Club does for them.</p>
          </div>
          {/* Role tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => { setActiveRole(r.id); setActiveFeature(0) }}
                className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{ backgroundColor: activeRole === r.id ? '#C0392B' : '#111318', color: activeRole === r.id ? '#F9FAFB' : '#9CA3AF', border: activeRole === r.id ? 'none' : '1px solid #1F2937' }}>
                {r.emoji} {r.label}
              </button>
            ))}
          </div>
          {/* Feature panel */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            {/* Left sidebar */}
            <div className="space-y-1">
              {role.features.map((f, i) => (
                <button key={f.name} onClick={() => setActiveFeature(i)}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ backgroundColor: activeFeature === i ? 'rgba(192,57,43,0.12)' : 'transparent', color: activeFeature === i ? '#E74C3C' : '#9CA3AF', borderLeft: activeFeature === i ? '3px solid #C0392B' : '3px solid transparent' }}>
                  {f.name}
                </button>
              ))}
            </div>
            {/* Right panel */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{feature.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#E74C3C' }}>{role.label}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>What it does</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {feature.steps.map((s, i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-3" style={{ backgroundColor: '#0A0B10' }}>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(192,57,43,0.2)', color: '#E74C3C' }}>{i + 1}</div>
                    <p className="text-xs" style={{ color: '#D1D5DB', lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#0D9488' }}>OUTCOME</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{feature.outcome}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VOICE COMMANDS ═══ */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3" style={{ color: '#F9FAFB' }}>Voice-controlled. Hands-free.</h2>
            <p className="text-base" style={{ color: '#9CA3AF' }}>30+ commands built for football. Say it. Lumio does it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VOICE_COMMANDS.map(col => (
              <div key={col.category}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#C0392B' }}>{col.category}</p>
                <div className="space-y-3">
                  {col.commands.map(cmd => (
                    <div key={cmd} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <Mic size={14} style={{ color: '#C0392B', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: '#F1C40F' }}>{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI MORNING BRIEFING ═══ */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-4" style={{ color: '#F9FAFB' }}>Your morning briefing. Every morning.</h2>
              <p className="text-base mb-6" style={{ color: '#9CA3AF', lineHeight: 1.8 }}>
                Before you step onto the training ground, Lumio reads you everything you need to know. Squad availability. Transfer updates. Contract alerts. Academy highlights. Board items. All in 60 seconds.
              </p>
              <Link href="/demo/football/oakridge-fc" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#F1C40F', color: '#0A0B10' }}>Listen to sample →</Link>
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '2px solid #C0392B' }}>
              <p className="text-xs font-bold mb-4" style={{ color: '#C0392B' }}>🎙️ AI Morning Briefing — Monday 30 Mar, 08:00</p>
              <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                Good morning. Squad availability: 21 fit, 3 injured, 1 suspended. Training at 10am — 23 available.<br /><br />
                Transfer window: 11 days remaining — Diallo bid still pending, agent called twice.<br /><br />
                Contract alert: Tyler James expires June — no offer made. Board approval needed this week.<br /><br />
                Academy: U21s beat Sheffield Wednesday 3-1 last night — Thompson hat-trick.<br /><br />
                Board meeting Thursday 2pm — financial report required.<br /><br />
                Press conference today 2pm — AI prep notes ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEPARTMENT GRID ═══ */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>Every department. Connected.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DEPARTMENTS.map(d => (
              <div key={d.name} className="rounded-2xl p-5 transition-all hover:border-[#C0392B]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-2xl block mb-3">{d.emoji}</span>
                <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{d.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING TIERS ═══ */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Built for every club in the EFL</h2>
          <p className="text-center text-base mb-12" style={{ color: '#9CA3AF' }}>One platform. Three tiers.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tier: '🥇 Championship', price: '£5,000', desc: 'Full platform. All 15 departments. PSR dashboard. Academy management. Transfer Room. AI briefings.' },
              { tier: '🥈 League One', price: '£2,500', desc: 'Core platform. First Team, Medical, Transfers, Contracts, Academy, Operations.' },
              { tier: '🥉 League Two / NL', price: '£999', desc: 'Essential platform. Squad management, medical, fixtures, scouting basics.' },
            ].map(t => (
              <div key={t.tier} className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111318', border: t.tier.includes('Championship') ? '2px solid #C0392B' : '1px solid #1F2937' }}>
                <p className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{t.tier}</p>
                <p className="text-3xl font-black mb-1" style={{ color: '#C0392B' }}>{t.price}<span className="text-sm" style={{ color: '#6B7280' }}>/mo</span></p>
                <p className="text-xs mt-3" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>{t.desc}</p>
                <Link href="/demo/football/oakridge-fc" className="block w-full mt-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#C0392B', color: '#F9FAFB' }}>Try free</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2d0a0a, #C0392B30, #2d0a0a)', borderTop: '1px solid #1F2937' }}>
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Ready to run your club smarter?</h2>
          <p className="text-base mb-10" style={{ color: '#9CA3AF' }}>Oakridge FC is already on Lumio. You&apos;re next.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo/football/oakridge-fc" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: '#C0392B', color: '#F9FAFB' }}>Try the demo free <ArrowRight size={18} /></Link>
            <Link href="https://calendly.com/lumiocms/pro-club" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>Book a walkthrough</Link>
          </div>
          <p className="text-xs mt-6" style={{ color: '#4B5563' }}>No contract. Cancel anytime. Championship pricing from £5,000/month.</p>
        </div>
      </section>
    </div>
  )
}
