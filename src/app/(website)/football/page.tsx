'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Users, Target, Zap, BarChart3, Mic, Monitor, Layers, Award, Lock, Plug, Star, ChevronRight } from 'lucide-react'

const RED = '#C0392B'
const GOLD = '#F1C40F'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const STATS = [
  { value: '15+', label: 'Departments' },
  { value: '45+', label: 'Quick Actions' },
  { value: 'GPS', label: 'Catapult & STATSports' },
  { value: 'RBAC', label: 'Role-Based Access' },
  { value: 'AI', label: 'Powered Insights' },
]

const FEATURES = [
  { icon: '📡', title: 'GPS & Wearables', badge: 'Industry First', badgeColor: RED,
    headline: 'Live Player Load Data on Your Dashboard',
    bullets: ['Direct integration with Catapult and STATSports', 'Session load, high-speed distance, sprint count', 'Player readiness scores updated after every session', 'Red flag alerts for overload or injury risk', 'Historical trends and load management charts'],
  },
  { icon: '🏛️', title: 'Board Suite', badge: 'Board Level Intelligence', badgeColor: GOLD,
    headline: 'Run Your Club Like a Business',
    bullets: ['Confidential board notes and meeting minutes', 'PSR/FFP dashboard with financial headroom calculator', 'Transfer budget tracking — spent, committed, remaining', 'Revenue vs expenditure reporting', 'Confidential transfer strategy documents', 'Role-gated: Chairman, CEO, and DoF access only'],
  },
  { icon: '🌅', title: 'Morning Roundup', badge: null, badgeColor: '',
    headline: 'Your Club, First Thing Every Morning',
    bullets: ['Agent messages, board communications, media enquiries', 'Unified inbox across Outlook, Gmail and Slack', 'Voice briefing — hear your club summary hands-free', 'AI-powered priority sorting and urgent flagging', 'One-tap actions: reply, forward, schedule meeting'],
  },
  { icon: '👥', title: 'Squad Management', badge: null, badgeColor: '',
    headline: 'Know Your Squad Inside Out',
    bullets: ['Player profiles with availability, fitness and form', 'GPS readiness scores integrated per player', 'Injury tracker with return-to-play timelines', 'Squad planner with contract expiry alerts', 'Academy pipeline with promotion candidates'],
  },
  { icon: '🔄', title: 'Transfer Hub', badge: null, badgeColor: '',
    headline: 'Your Entire Transfer Operation in One Place',
    bullets: ['Target tracking and scouting pipeline', 'Agent relationship management with contact log', 'Budget allocation by position priority', 'Confidential offload pipeline', 'PSR/FFP impact calculator per signing'],
  },
  { icon: '📋', title: 'Tactics Viewer', badge: null, badgeColor: '',
    headline: 'Visualise Your Game Plan',
    bullets: ['Interactive SVG pitch with clickable positions', 'Multiple formation templates (4-3-3, 3-5-2, etc.)', 'Save and compare tactical setups', 'Share with coaching staff digitally', 'Set piece routines with movement arrows'],
  },
  { icon: '🏟️', title: 'Match Day', badge: null, badgeColor: '',
    headline: 'Everything You Need on Match Day',
    bullets: ['Team sheet builder with drag-and-drop', 'Live match notes and tactical adjustments', 'Half-time data review with GPS stats', 'Post-match analysis and player ratings', 'Press conference prep with AI briefing notes'],
  },
  { icon: '📰', title: 'Media & PR', badge: null, badgeColor: '',
    headline: "Control Your Club's Narrative",
    bullets: ['Press conference prep with AI-generated talking points', 'Likely media questions with suggested responses', 'Social media content calendar', 'Media request inbox and approval workflow', 'Confidential: manager briefing notes'],
  },
  { icon: '⭐', title: 'Academy', badge: null, badgeColor: '',
    headline: "Develop Tomorrow's Stars",
    bullets: ['Academy player tracking across age groups', 'Development pathway management', 'U21 and U18 squad integration', 'Promotion pipeline to first team', 'Scout reports linked to academy targets'],
  },
  { icon: '🔐', title: 'Role-Based Access', badge: null, badgeColor: '',
    headline: 'The Right Information for the Right People',
    bullets: ['Chairman sees everything including financials', 'Head Coach sees squad, tactics, training — not finances', 'Scouts see scouting pipeline only', 'One platform, multiple permission levels', 'Role switcher for testing different views'],
  },
  { icon: '🔌', title: 'Integrations', badge: null, badgeColor: '',
    headline: 'Connects With Your Existing Tools',
    bullets: ['Catapult & STATSports GPS wearables', 'Microsoft Outlook & Gmail', 'Microsoft Teams & Slack', 'Google Calendar & Outlook Calendar', 'Xero, QuickBooks and accounting platforms'],
  },
  { icon: '🏛️', title: 'Board Suite', badge: 'Executive', badgeColor: GOLD,
    headline: '5-Tab Executive Dashboard',
    bullets: ['Overview, Finance, Squad & Performance, Governance, Facilities', 'Chairman-level intelligence across the entire club', 'Financial headroom and PSR/FFP compliance', 'Facility management and stadium roadmaps', 'Role-gated access for board members only'],
  },
  { icon: '📅', title: 'Club Planner', badge: null, badgeColor: '',
    headline: 'Strategic Planning at Every Horizon',
    bullets: ['1-year, 3-year, 5-year and 10-year strategic plans', 'KPIs and transfer budgets per planning horizon', 'Stadium roadmaps and infrastructure timelines', 'Decade P&L projections', 'Board-level strategy documents'],
  },
  { icon: '🧠', title: 'Club Intelligence', badge: null, badgeColor: '',
    headline: '8 Role-Based Views as Compact Pill Tabs',
    bullets: ['Director of Football', 'Chairman/CEO', 'Head Coach', 'Head of Medical', 'Head of Recruitment', 'Academy Director', 'Head of Analysis', 'Commercial Director'],
  },
  { icon: '📊', title: 'Performance Analytics', badge: null, badgeColor: '',
    headline: 'Deep Performance Data Visualisations',
    bullets: ['League position trend chart', 'Goals For/Against bars', 'Squad analytics — age, nationality, contract donuts', 'Form heatmap across last 20 games', 'Season-on-season comparison tools'],
  },
  { icon: '⚽', title: 'Interactive Tactics Pitch', badge: 'Industry First', badgeColor: RED,
    headline: 'FIFA-Style Player Cards on Pitch',
    bullets: ['Click-to-swap player positions', 'Formation switcher: 4-2-3-1, 4-3-3, 3-5-2, 4-4-2', 'Bench squad panel with drag-and-drop', 'Fullscreen, Print, and Share options', 'FIFA-style player cards with ratings and stats'],
  },
  { icon: '🔍', title: 'Recruitment Pipeline', badge: null, badgeColor: '',
    headline: 'Your Entire Scouting Operation',
    bullets: ['Scouting targets table with status badges', 'Summer budget tracker with progress bar', 'Agent contact log and relationship management', 'Position priority rankings', 'Shortlist comparison tools'],
  },
  { icon: '🎯', title: 'Set Pieces Library', badge: null, badgeColor: '',
    headline: 'Full Routine Cards with SVG Pitch Diagrams',
    bullets: ['Corner, free kick, and throw-in routines', '2-per-row grid layout for easy browsing', 'SVG pitch diagrams with movement arrows', 'Fullscreen, Print, and Share per routine', 'Coaching staff collaboration tools'],
  },
]

const TESTIMONIALS = [
  { quote: 'Lumio has completely changed how our board operates. The PSR dashboard alone has saved us thousands in consultancy fees.', name: 'James Whitworth', role: 'CEO', club: 'Championship Club' },
  { quote: 'The morning roundup means I walk into the training ground knowing exactly what needs my attention. Game changer.', name: 'Mark Stevens', role: 'Head Coach', club: 'League One Club' },
  { quote: 'Having GPS data, squad management and transfer tracking in one platform is something we\'ve needed for years.', name: 'Sarah Collins', role: 'Director of Football', club: 'League Two Club' },
]

const PRICING = [
  { tier: 'Academy', desc: 'Youth development and academy tracking', features: ['Academy player profiles', 'Development pathways', 'U18/U21 squad management', 'Basic reporting'] },
  { tier: 'First Team', desc: 'Complete first team operations', features: ['Everything in Academy', 'Squad management & GPS', 'Tactics viewer & match day', 'Transfer hub', 'Media & PR tools'], highlight: true },
  { tier: 'Full Club', desc: 'Enterprise platform for the entire club', features: ['Everything in First Team', 'Board Suite with PSR/FFP', 'Financial integration', 'Multi-department access', 'Dedicated account manager'] },
]

// ─── Role Showcase Data ──────────────────────────────────────────────────────

const ROLES = [
  { id: 'dof', emoji: '🏟️', label: 'Director of Football',
    features: [
      { name: 'Transfer Pipeline Manager', points: ['Active targets tracked — position, value, agent, status', 'Window countdown — days, hours, minutes', 'Budget dashboard — spent, committed, remaining', 'Work permit tracker — post-Brexit requirements', 'Agent contact log — last contact, next action', 'Bid workflow — configure → submit → track'], outcome: 'Never miss a transfer deadline. Every target tracked, every agent logged, every deadline visible.' },
      { name: 'Contract Expiry Tracker', points: ['Visual timeline of all contract end dates', 'Priority renewals flagged in red', 'Agent involved for each player', 'Wage budget impact of renewal', 'Board approval workflow', 'Release clause tracker'], outcome: 'See exactly which contracts need attention — today, this month, this season.' },
      { name: 'Squad Planner (2-season)', points: ['Current squad with contract status', 'Next season projection — who leaves, who stays', 'Position gaps highlighted automatically', 'Academy pipeline integrated', 'Hypothetical targets added to plan', 'Export to board as visual report'], outcome: 'Plan two seasons ahead. Know exactly which positions need filling and when.' },
      { name: 'AI Morning Briefing', points: ['Squad fitness summary', 'Transfer window updates', 'Contract alerts', 'Agent messages', 'Academy highlights', 'Board items for today'], outcome: 'Everything you need to know — read aloud in 60 seconds every morning.' },
      { name: 'Board Report Generator', points: ['Select report type and period', 'AI compiles data across all departments', 'Financial summary auto-included', 'Transfer activity summarised', 'Squad performance metrics', 'Export as PDF or presentation'], outcome: 'Board-ready reports generated in seconds, not days.' },
      { name: 'PSR / FFP Dashboard', points: ['3-year rolling loss calculated automatically', 'Allowable deductions tracked', 'What-if calculator for transfers', 'Year-end projection updated live', 'Wage/revenue ratio monitored', 'Board-ready compliance report'], outcome: 'Know your PSR position every day. Never risk a points deduction.' },
    ],
  },
  { id: 'coach', emoji: '🧠', label: 'Head Coach',
    features: [
      { name: 'Team Sheet Builder', points: ['Drag-and-drop formation builder', 'Availability filter — injured, suspended, doubtful', 'GPS readiness scores per player', 'Save and compare multiple line-ups', 'Share with staff instantly', 'Voice command — "Build me a team sheet"'], outcome: 'Pick your best team with full confidence. Fitness, form and tactics — all in one view.' },
      { name: 'Tactics Board', points: ['Interactive pitch with drag-and-drop', 'Multiple formation templates', 'Draw movement arrows and zones', 'Save and compare tactical setups', 'Share with coaching team digitally', 'Print for dressing room'], outcome: 'Visualise your game plan. Share it with one click.' },
      { name: 'Training Planner', points: ['Weekly training calendar', 'GPS load per player tracked', 'Session templates for tactical, technical, fitness', 'Recovery group management', 'Share plan with medical team', 'Adjust based on upcoming fixtures'], outcome: 'Plan training around matches, load and fitness — not guesswork.' },
      { name: 'Match Analysis', points: ['Post-match performance breakdown', 'Key events timeline', 'Player ratings with data backing', 'Half-time and full-time notes', 'Opposition comparison', 'Share insights with staff'], outcome: 'Review every match with data. Make better decisions next time.' },
      { name: 'Player Dynamics', points: ['Dressing room mood tracker', 'Leadership group visibility', 'Clique detection alerts', 'One-to-one meeting log', 'Culture health score', 'Weekly dynamics summary'], outcome: 'Manage the room. Know what\'s happening before it becomes a problem.' },
      { name: 'Opposition Scout Report', points: ['Auto-loaded next opponent data', 'Formation and key players', 'Strengths and weaknesses', 'Set piece threats flagged', 'Last 5 results analysed', 'Suggested tactical approach'], outcome: 'Know your opponent better than they know themselves.' },
    ],
  },
  { id: 'medical', emoji: '🏥', label: 'Medical',
    features: [
      { name: 'Injury Tracker', points: ['Current injuries with expected return dates', 'GPS ACWR scores — flag overload before injury', 'Return-to-play protocol steps', 'Treatment log per player', 'Integration with Catapult & STATSports', 'Alert when player exceeds safe load threshold'], outcome: 'Reduce injuries. Manage return-to-play with confidence. GPS data built in.' },
      { name: 'Return-to-Play Planner', points: ['Step-by-step rehab protocol', 'Daily progress tracking', 'Medical sign-off required at each stage', 'GPS metrics integrated for clearance', 'Notification when player passes threshold', 'Automatic squad status update'], outcome: 'Every return-to-play managed safely. No player rushed back.' },
      { name: 'GPS Load Monitor', points: ['Live session load data', 'Weekly load trends per player', 'ACWR calculation automated', 'Red/amber/green thresholds', 'Comparison to squad average', 'Historical load charts'], outcome: 'Prevent injuries before they happen. GPS data at your fingertips.' },
      { name: 'Medical Notes', points: ['Confidential player medical records', 'Treatment history', 'Medication tracking', 'Scan results storage', 'Referral management', 'GDPR compliant'], outcome: 'Every medical note secure. Every treatment logged.' },
      { name: 'DBS & Certifications', points: ['Staff DBS check tracking', 'First aid certification dates', 'Safeguarding training records', 'Renewal reminders', 'Compliance dashboard', 'Export for audits'], outcome: 'Never miss a renewal. Every certification tracked.' },
      { name: 'Physio Dashboard', points: ['Treatment schedule for today', 'Player queue management', 'Notes per session', 'Recovery protocol tracking', 'Injury recurrence alerts', 'Workload balance across physio team'], outcome: 'Manage your treatment list efficiently. Every session documented.' },
    ],
  },
  { id: 'recruitment', emoji: '🔍', label: 'Recruitment',
    features: [
      { name: 'Scouting Pipeline', points: ['Targets tracked by position, age, value, nationality', 'Scout report submission and review', 'Agent contact and commission log', 'Trial scheduling and feedback', 'Video room for match footage review', 'PSR impact calculator per target'], outcome: 'Build your squad intelligently. Every target, every report, every agent — tracked.' },
      { name: 'Target Watchlist', points: ['Priority targets with status', 'Contract situation tracked', 'Alternative options per position', 'Value trend over time', 'Availability windows flagged', 'Quick share to DoF'], outcome: 'Your shortlist, always up to date. Never lose track of a target.' },
      { name: 'Agent Directory', points: ['Agent database with contact details', 'Past dealings and commission history', 'Players represented', 'Relationship notes', 'Last contact date', 'Meeting log'], outcome: 'Know every agent. Track every relationship.' },
      { name: 'Trial Manager', points: ['Trial scheduling', 'Training session allocation', 'Feedback forms from coaches', 'Medical clearance tracking', 'Decision workflow', 'Parent/agent communication log'], outcome: 'Run trials properly. Every trialist tracked from arrival to decision.' },
      { name: 'Video Room', points: ['Upload match and training footage', 'Tag key moments', 'Share clips with staff', 'Build highlight reels per player', 'Opposition footage library', 'Scout from anywhere'], outcome: 'All your footage in one place. Tag, share, decide.' },
      { name: 'Scout Reports', points: ['Standardised report template', 'Star rating system', 'Position-specific criteria', 'Photo and video attachment', 'Comparison to current squad', 'Recommendation workflow'], outcome: 'Professional scouting reports. Consistent, thorough, shareable.' },
    ],
  },
  { id: 'academy', emoji: '🎓', label: 'Academy',
    features: [
      { name: 'Academy Squad Tracker', points: ['U18/U21 squad management', 'Development milestone tracking', 'First team promotion pipeline', 'Match reports per age group', 'GPS load monitoring for young players', 'Parent communication portal'], outcome: 'Develop tomorrow\'s first team. Track every player from U9 to the bench.' },
      { name: 'Development Pathway', points: ['Individual development plans', 'Skill milestone tracking', 'Coach assessment forms', 'Progress reports for parents', 'Season objectives per player', 'Annual review scheduling'], outcome: 'Every young player on a clear pathway. Progress visible to everyone.' },
      { name: 'Promotion Pipeline', points: ['First team readiness assessment', 'Training with first team scheduling', 'Head Coach recommendations', 'Physical development metrics', 'Mental readiness evaluation', 'Contract status alerts'], outcome: 'Know which academy players are ready. Promote with confidence.' },
      { name: 'U21 Match Reports', points: ['Match report templates', 'Performance ratings per player', 'Key event logging', 'Opposition notes', 'Attendance tracking', 'Season statistics dashboard'], outcome: 'Every youth match documented. Scouts and coaches aligned.' },
      { name: 'Parent Portal', points: ['Match schedule visibility', 'Transport information', 'Welfare check-ins', 'Development progress access', 'Consent form management', 'Communication log'], outcome: 'Keep parents informed and engaged. Build trust with families.' },
      { name: 'Academy Analytics', points: ['Conversion rate by age group', 'Scholarship success metrics', 'Category compliance dashboard', 'EPPP audit preparation', 'Cost per player analysis', 'Benchmark against top academies'], outcome: 'Run your academy with data. Prove its value to the board.' },
    ],
  },
  { id: 'analysis', emoji: '📊', label: 'Analysis',
    features: [
      { name: 'Match Analytics', points: ['Post-match performance breakdown', 'Player rating and contribution scores', 'GPS heat maps per player', 'Opposition shape and pattern analysis', 'Set piece catalogue — attacking and defending', 'Season trend lines per metric'], outcome: 'Turn data into decisions. Every match analysed. Every pattern spotted.' },
      { name: 'Performance Trends', points: ['Player form over time', 'Fitness trend charts', 'Comparison to squad average', 'Seasonal peaks and troughs identified', 'Impact of training load on performance', 'Export for coaching presentations'], outcome: 'See the trends others miss. Data that makes a difference.' },
      { name: 'Opposition Analysis', points: ['Next opponent auto-loaded', 'Formation and system analysis', 'Key player profiles', 'Defensive and attacking patterns', 'Set piece threats', 'Last 5 matches breakdown'], outcome: 'Prepare for every opponent with comprehensive intelligence.' },
      { name: 'Set Piece Library', points: ['Corner routines — attacking and defending', 'Free kick playbook', 'Throw-in routines', 'Visual SVG pitch diagrams', 'Success rate tracking per routine', 'Share on tablet in dressing room'], outcome: 'Set pieces win games. Yours are planned, drilled and tracked.' },
      { name: 'GPS Heat Maps', points: ['Player positional data visualised', 'Session vs match comparison', 'Team shape analysis', 'Running lanes and zones', 'Sprint locations mapped', 'Share with coaching team'], outcome: 'See where your players actually play. Not where you think they play.' },
      { name: 'Video Tagging', points: ['Tag key moments in footage', 'Build clip sequences', 'Share individual player clips', 'Opposition tactical clips', 'Integration with analysis software', 'Searchable tag database'], outcome: 'Find any moment, any match, any player — in seconds.' },
    ],
  },
  { id: 'finance', emoji: '💰', label: 'Finance & PSR',
    features: [
      { name: 'PSR/FFP Dashboard', points: ['Real-time PSR headroom calculation', 'Wage bill vs revenue ratio', 'Player amortisation schedule', 'Transfer spend vs budget remaining', 'Revenue streams — matchday, broadcast, commercial', 'Automatic board report generation'], outcome: 'Stay PSR compliant. Know your numbers before the window opens.' },
      { name: 'Wage Bill Tracker', points: ['Total wage bill breakdown', 'Per player cost', 'Bonus and appearance fee tracking', 'Image rights payments', 'Projection for next season', 'Comparison to league averages'], outcome: 'Control your biggest expense. Every pound accounted for.' },
      { name: 'Transfer Budget Manager', points: ['Total budget set by board', 'Committed spend tracked', 'Remaining budget calculated', 'What-if scenarios for targets', 'Sell-to-buy impact modelling', 'Real-time during window'], outcome: 'Spend smart. Know exactly what you can afford.' },
      { name: 'Player Amortisation', points: ['Transfer fee spread calculation', 'Remaining book value per player', 'Impact of selling early or late', 'Multi-year contract amortisation', 'PSR impact per player', 'Visual amortisation charts'], outcome: 'Understand the true cost of every player. Not just the fee.' },
      { name: 'Revenue Dashboard', points: ['Matchday revenue tracking', 'Commercial income summary', 'Broadcast revenue allocation', 'Sponsorship income', 'Merchandise sales', 'Year-on-year comparison'], outcome: 'See all your revenue in one place. Drive growth where it matters.' },
      { name: 'Board Financial Report', points: ['One-click financial summary', 'P&L by department', 'Cash flow projection', 'Variance analysis', 'Board-ready formatting', 'Export as PDF'], outcome: 'Board reports in one click. Not one week.' },
    ],
  },
  { id: 'dynamics', emoji: '⚡', label: 'Dynamics',
    features: [
      { name: 'Dressing Room Monitor', points: ['Anonymous player sentiment tracking', 'Leadership group assignments', 'Clique and faction detection', 'Mentor pairing for new signings', 'Culture health score', 'Weekly dynamics report for Head Coach'], outcome: 'Manage what you can\'t see. Build a winning culture from the inside out.' },
      { name: 'Player Mood Tracker', points: ['Weekly mood check-ins', 'Trend analysis per player', 'Red flag alerts for concerning patterns', 'Comparison to performance data', 'Confidential — coach eyes only', 'Integration with medical welfare'], outcome: 'Catch problems early. Support players before they struggle.' },
      { name: 'Leadership Groups', points: ['Define leadership group', 'Assign captaincy responsibilities', 'Track leadership actions', 'Mentoring assignments', 'New signing integration plan', 'Culture ambassador programme'], outcome: 'Build leaders on and off the pitch. Structure your culture.' },
      { name: 'Clique Detection', points: ['Social mapping of squad', 'Faction identification', 'Integration risk for new signings', 'Language group visibility', 'Nationality group dynamics', 'Alert when cliques form'], outcome: 'See the invisible dynamics. Act before cliques become problems.' },
      { name: 'Mentor Assignments', points: ['Assign mentors to new signings', 'Track mentoring meetings', 'Integration milestone checklist', 'Feedback from both parties', 'Success metrics', 'Cultural orientation programme'], outcome: 'Every new signing settles faster. Mentoring that works.' },
      { name: 'Culture Report', points: ['Monthly culture health score', 'Player engagement metrics', 'Training attitude assessment', 'Community involvement tracking', 'Values alignment scoring', 'Board culture summary'], outcome: 'Measure your culture. Report it to the board. Build something lasting.' },
    ],
  },
]

function RoleShowcase() {
  const [activeRole, setActiveRole] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const role = ROLES[activeRole]
  const feature = role.features[activeFeature]

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black mb-2">Everything your club needs</h2>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Click a role. See exactly what Lumio Pro Club does for them.</p>
      </div>

      {/* Role tabs — flex-wrap, no scrollbar */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {ROLES.map((r, i) => (
          <button key={r.id} onClick={() => { setActiveRole(i); setActiveFeature(0) }}
            className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
            style={{ backgroundColor: activeRole === i ? RED : CARD, color: activeRole === i ? '#F9FAFB' : '#9CA3AF', border: activeRole === i ? `1px solid ${RED}` : `1px solid ${BORDER}` }}>
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      {/* Feature panel */}
      <div className="flex flex-col lg:flex-row gap-4 rounded-2xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        {/* Left — feature list */}
        <div className="lg:w-1/3 p-4 space-y-1" style={{ borderRight: `1px solid ${BORDER}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#4B5563' }}>{role.label} tools</p>
          {role.features.map((f, i) => (
            <button key={f.name} onClick={() => setActiveFeature(i)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: activeFeature === i ? `${RED}20` : 'transparent', color: activeFeature === i ? '#F9FAFB' : '#9CA3AF', borderLeft: activeFeature === i ? `3px solid ${RED}` : '3px solid transparent' }}>
              {f.name}
            </button>
          ))}
        </div>

        {/* Right — feature detail */}
        <div className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-black" style={{ color: '#F9FAFB' }}>{feature.name}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${RED}20`, color: RED, border: `1px solid ${RED}40` }}>
              {role.label}
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B5563' }}>What it does</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {feature.points.map((p, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}` }}>
                <span className="flex items-center justify-center rounded-full shrink-0 text-[10px] font-bold" style={{ width: 20, height: 20, backgroundColor: `${RED}20`, color: RED }}>{i + 1}</span>
                <span className="text-xs" style={{ color: '#D1D5DB', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#0D9488' }}>Outcome</p>
            <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>{feature.outcome}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function FootballPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#F9FAFB' }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG}, #1a0a0a)` }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, ${RED}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${GOLD}20 0%, transparent 50%)` }} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: `${RED}20`, border: `1px solid ${RED}40` }}>
            <span className="text-sm font-bold" style={{ color: RED }}>⚽</span>
            <span className="text-xs font-semibold" style={{ color: RED }}>Built for Championship & League Football</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            The Complete Club<br />Management Platform
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
            From the boardroom to the training pitch — everything your club needs in one place
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book-demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: RED, color: '#F9FAFB', textDecoration: 'none' }}>
              Request a Demo <ArrowRight size={18} />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', textDecoration: 'none' }}>
              See All Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-center gap-8 md:gap-16">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black" style={{ color: GOLD }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Role Tabs ───────────────────────────────────────────────────── */}
      <RoleShowcase />

      {/* ── GPS Integration Hero Section ──────────────────────────────── */}
      <section id="gps" className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, #1a0808, ${BG})` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 30% 40%, ${RED}60 0%, transparent 50%)` }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Text side */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>
                <span className="text-xs font-black tracking-wider" style={{ color: GOLD }}>INDUSTRY FIRST</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">Game-Changing GPS Integration</h2>
              <p className="text-lg mb-8" style={{ color: '#9CA3AF' }}>Connect Catapult &amp; STATSports directly into your club dashboard</p>

              <div className="space-y-4">
                {[
                  { icon: '\u{1F3C3}', label: 'Real-time player load monitoring', desc: 'Track every sprint, acceleration and deceleration from training and match day' },
                  { icon: '\u{2764}\u{FE0F}', label: 'Injury risk prediction', desc: 'ACWR scoring flags players at risk before injuries happen' },
                  { icon: '\u{1F4CA}', label: 'Squad readiness dashboard', desc: "Instant traffic light view of who\u2019s ready to play" },
                  { icon: '\u{26BD}', label: 'Match vs training comparison', desc: 'See how players perform when it matters most' },
                  { icon: '\u{1F517}', label: 'Direct API connection', desc: 'Catapult OpenField and STATSports Sonra connect in one click' },
                  { icon: '\u{1F4C1}', label: 'CSV upload fallback', desc: 'Manually export from your GPS platform and upload directly' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{item.label}</p>
                      <p className="text-sm" style={{ color: '#9CA3AF' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/football#gps" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: RED, color: '#F9FAFB', textDecoration: 'none' }}>
                  See GPS Integration <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Mock GPS Dashboard Visual */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1a0a0a', border: `1px solid ${RED}30` }}>
                {/* Dashboard header */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${RED}20` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RED }} />
                    <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>GPS Dashboard</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>LIVE</span>
                </div>

                {/* Player rows */}
                <div className="px-5 py-4 space-y-3">
                  {[
                    { name: 'J. Smith', load: 847, dist: '11.2km', hsr: '1.8km', status: 'green' },
                    { name: 'R. Johnson', load: 923, dist: '10.8km', hsr: '2.1km', status: 'amber' },
                    { name: 'D. Williams', load: 1102, dist: '12.4km', hsr: '2.6km', status: 'red' },
                    { name: 'T. Brown', load: 689, dist: '9.1km', hsr: '1.4km', status: 'green' },
                    { name: 'M. Davies', load: 756, dist: '10.0km', hsr: '1.6km', status: 'green' },
                  ].map(player => (
                    <div key={player.name} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: player.status === 'green' ? '#22C55E' : player.status === 'amber' ? '#F59E0B' : '#EF4444' }} />
                      <span className="text-xs font-semibold w-24 truncate" style={{ color: '#F9FAFB' }}>{player.name}</span>
                      <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>Load</p>
                          <p className="text-xs font-bold" style={{ color: player.load > 1000 ? '#EF4444' : '#F9FAFB' }}>{player.load}</p>
                        </div>
                        <div>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>Distance</p>
                          <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{player.dist}</p>
                        </div>
                        <div>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>HSR</p>
                          <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{player.hsr}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer stats */}
                <div className="px-5 py-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: `1px solid ${RED}20`, backgroundColor: 'rgba(192,57,43,0.05)' }}>
                  <div>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>Avg Load</p>
                    <p className="text-sm font-black" style={{ color: GOLD }}>863</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>At Risk</p>
                    <p className="text-sm font-black" style={{ color: '#EF4444' }}>1</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>Squad Ready</p>
                    <p className="text-sm font-black" style={{ color: '#22C55E' }}>4/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        {FEATURES.map((f, i) => (
          <div key={f.title} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{f.icon}</span>
                <h2 className="text-2xl font-black">{f.title}</h2>
                {f.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${f.badgeColor}20`, color: f.badgeColor, border: `1px solid ${f.badgeColor}40` }}>
                    {f.badge}
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold mb-4" style={{ color: '#9CA3AF' }}>{f.headline}</p>
              <ul className="space-y-2">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <ChevronRight size={14} className="shrink-0 mt-0.5" style={{ color: RED }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual placeholder */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl p-8 flex items-center justify-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, minHeight: 280, background: `linear-gradient(135deg, ${CARD}, ${i % 2 === 0 ? `${RED}08` : `${GOLD}08`})` }}>
                <div className="text-center">
                  <span className="text-6xl block mb-3">{f.icon}</span>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>{f.title}</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5563' }}>Interactive preview coming soon</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0D0E14' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Trusted by Professional Clubs Across the EFL</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>See how clubs are using Lumio to transform their operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={GOLD} style={{ color: GOLD }} />)}
                </div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#D1D5DB' }}>&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{t.role} — {t.club}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/book-demo" className="text-sm font-semibold" style={{ color: RED, textDecoration: 'underline' }}>
              Request a case study →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-2">Pricing Tailored to Your Club</h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>All plans include onboarding support and a dedicated account manager</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map(p => (
            <div key={p.tier} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${RED}` : `1px solid ${BORDER}` }}>
              {p.highlight && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full self-start mb-3" style={{ backgroundColor: `${RED}20`, color: RED }}>Most Popular</span>}
              <h3 className="text-xl font-black mb-1">{p.tier}</h3>
              <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{p.desc}</p>
              <ul className="space-y-2 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#D1D5DB' }}>
                    <ChevronRight size={12} className="shrink-0 mt-0.5" style={{ color: RED }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/book-demo" className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: p.highlight ? RED : 'rgba(255,255,255,0.05)', color: '#F9FAFB', border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                Request Pricing <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${RED}15, ${GOLD}08)` }}>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Transform How Your Club Operates?</h2>
          <p className="text-lg mb-8" style={{ color: '#9CA3AF' }}>Join the clubs already using Lumio Pro Club</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book-demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: RED, color: '#F9FAFB', textDecoration: 'none' }}>
              Book a Demo <ArrowRight size={18} />
            </Link>
            <a href="#" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', textDecoration: 'none' }}>
              Download Feature Overview
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: '#4B5563' }}>&copy; {new Date().getFullYear()} Lumio Ltd. All rights reserved. · <Link href="/privacy" style={{ color: '#4B5563' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#4B5563' }}>Terms</Link></p>
      </footer>
    </div>
  )
}
