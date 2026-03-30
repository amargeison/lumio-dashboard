'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Loader2, Star, Heart, Shield, MapPin, Clock, Users, Target, Activity, AlertCircle, CheckCircle2, FileText, DollarSign, Eye, Video, Clipboard, Trophy, Calendar, Phone, MessageSquare, Briefcase, GraduationCap, Newspaper, TrendingUp, BarChart3, ArrowUpDown } from 'lucide-react'

// ─── Shared Constants ───────────────────────────────────────────────────────

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }
const PRIMARY = '#C0392B'
const DARK = '#922B21'
const GOLD = '#FBBF24'

const SQUAD_NAMES = ['James Walker','Liam Burton','Callum Henderson','Diego Martinez','Marcus Cole','Jake Phillips','Tyrone Campbell','Nathan Brooks','Ryan Thompson','Kai Nakamura','Ben Gallagher','Omar Hassan','Ethan Price','Mateo Silva',"Sean O'Brien",'Jayden Clarke','Rafa Correia','Daniel Foster','Lucas Santos','Tommy Richards','Aiden Murphy','Kwame Asante','Luka Petrovic','Charlie Bennett','Isaac Mensah']
const INJURED_PLAYERS = ['Diego Martinez',"Sean O'Brien",'Lucas Santos']
const FIXTURES_LIST = ['Riverside United (H) — Sat 4 Apr, 15:00','Northgate City (A) — Tue 7 Apr, 19:45','Crestwood Athletic (A) — Sat 11 Apr, 15:00']
const ACADEMY_NAMES = ['Josh Collins','Alfie Morgan','Rhys Okonkwo','Elijah Shaw']
const TRANSFER_TARGETS = ['Yannick Diallo','Tiago Ferreira','Andrei Popescu']
const SCOUTS = ['Mark Evans','Carlos Mendes','Jan Bakker','Tom Wilson']
const POSITIONS = ['GK','CB','RB','LB','CM','CAM','LW','RW','ST']

// ─── Field Types ────────────────────────────────────────────────────────────

type FieldDef =
  | { type: 'select'; key: string; label: string; options: string[] }
  | { type: 'input'; key: string; label: string; placeholder?: string }
  | { type: 'textarea'; key: string; label: string; placeholder?: string }
  | { type: 'date'; key: string; label: string }
  | { type: 'number'; key: string; label: string; defaultVal?: number }
  | { type: 'toggle'; key: string; label: string; defaultVal?: boolean }
  | { type: 'multi-select'; key: string; label: string; options: string[] }

// ─── Action Definitions ─────────────────────────────────────────────────────

interface ActionDef {
  title: string
  emoji: string
  subtitle: string
  steps: [string, string, string, string]
  fields: FieldDef[]
  loadingMessage: string
  loadingSteps: [string, string, string, string]
  resultRenderer: string
  actions: { label: string; primary?: boolean }[]
}

const ACTIONS: Record<string, ActionDef> = {
  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  'log-injury': {
    title: 'Log Injury', emoji: '🏥', subtitle: 'Record and assess player injury',
    steps: ['Configure', 'Assess', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: SQUAD_NAMES },
      { type: 'select', key: 'injuryType', label: 'Injury Type', options: ['Muscle','Ligament','Bone','Concussion','Illness','Other'] },
      { type: 'input', key: 'bodyPart', label: 'Body Part', placeholder: 'e.g. Right hamstring' },
      { type: 'select', key: 'severity', label: 'Severity', options: ['Minor','Moderate','Serious'] },
      { type: 'date', key: 'dateOfInjury', label: 'Date of Injury' },
      { type: 'select', key: 'mechanism', label: 'Mechanism', options: ['Training','Match','Other'] },
    ],
    loadingMessage: 'Logging injury and assessing recovery timeline...',
    loadingSteps: ['Recording injury details', 'Analysing injury severity', 'Calculating estimated return date', 'Checking fixture impact'],
    resultRenderer: 'log-injury',
    actions: ['Confirm & Log', 'Notify Physio', 'Notify Manager', 'Update Availability'].map(l => ({ label: l })),
  },
  'scout-report': {
    title: 'Scout Report', emoji: '🔍', subtitle: 'AI-generated scouting assessment',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'playerName', label: 'Player Name', placeholder: 'e.g. Yannick Diallo' },
      { type: 'input', key: 'club', label: 'Club', placeholder: 'e.g. KRC Genk' },
      { type: 'select', key: 'position', label: 'Position', options: POSITIONS },
      { type: 'date', key: 'matchDate', label: 'Match Watched' },
      { type: 'input', key: 'opponent', label: 'Opponent', placeholder: 'e.g. Club Brugge' },
      { type: 'input', key: 'competition', label: 'Competition', placeholder: 'e.g. Belgian Pro League' },
      { type: 'select', key: 'scout', label: 'Scout', options: SCOUTS },
    ],
    loadingMessage: 'Writing scout report...',
    loadingSteps: ['Compiling match observations', 'Generating technical assessment', 'Analysing tactical intelligence', 'Preparing recommendation'],
    resultRenderer: 'scout-report',
    actions: ['Save to Database', 'Share with DoF', 'Add to Target List', 'Schedule Follow-up'].map(l => ({ label: l })),
  },
  'transfer-update': {
    title: 'Transfer Update', emoji: '🔄', subtitle: 'Log transfer pipeline activity',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: [...TRANSFER_TARGETS, 'Other (enter below)'] },
      { type: 'select', key: 'updateType', label: 'Update Type', options: ['New Enquiry','Bid Submitted','Counter Offer','Medical Booked','Deal Agreed','Deal Collapsed','Loan Agreed'] },
      { type: 'textarea', key: 'details', label: 'Update Details', placeholder: 'What happened?' },
      { type: 'input', key: 'agentName', label: 'Agent Name', placeholder: 'e.g. Stellar Group' },
      { type: 'input', key: 'fee', label: 'Fee Discussed (£)', placeholder: 'e.g. 1,800,000' },
    ],
    loadingMessage: 'Updating transfer record...',
    loadingSteps: ['Recording update', 'Building timeline', 'Calculating next steps', 'Logging to pipeline'],
    resultRenderer: 'transfer-update',
    actions: ['Update Pipeline', 'Notify Board', 'Set Reminder', 'Generate Board Email'].map(l => ({ label: l })),
  },
  'team-sheet': {
    title: 'Team Sheet', emoji: '📋', subtitle: 'AI-suggested starting XI and formation',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'match', label: 'Match', options: FIXTURES_LIST },
      { type: 'select', key: 'formation', label: 'Formation', options: ['4-3-3','4-2-3-1','3-5-2','4-4-2','5-3-2','3-4-3'] },
      { type: 'toggle', key: 'includeSubs', label: 'Include Substitutes', defaultVal: true },
    ],
    loadingMessage: 'Building team sheet from available squad...',
    loadingSteps: ['Checking player availability', 'Analysing form and fitness', 'Selecting optimal XI', 'Arranging substitutes'],
    resultRenderer: 'team-sheet',
    actions: ['Confirm Team Sheet', 'Share with Staff', 'Share with Media', 'Print', 'Save to Record'].map(l => ({ label: l })),
  },
  'board-report': {
    title: 'Board Report', emoji: '📊', subtitle: 'AI-generated board report',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'reportType', label: 'Report Type', options: ['Monthly Update','Transfer Window Summary','Season Review','Financial Performance','Academy Update'] },
      { type: 'date', key: 'periodStart', label: 'Period Start' },
      { type: 'date', key: 'periodEnd', label: 'Period End' },
      { type: 'multi-select', key: 'sections', label: 'Sections', options: ['Results','Transfers','Finance','Medical','Academy','Commercial'] },
    ],
    loadingMessage: 'Generating board report...',
    loadingSteps: ['Pulling performance data', 'Analysing financial metrics', 'Compiling transfer activity', 'Writing executive summary'],
    resultRenderer: 'board-report',
    actions: ['Download PDF', 'Email to Board', 'Save to Documents', 'Schedule Next Report'].map(l => ({ label: l })),
  },
  'match-prep': {
    title: 'Match Prep', emoji: '⚽', subtitle: 'Opposition analysis and match planning',
    steps: ['Configure', 'Research', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'match', label: 'Upcoming Match', options: FIXTURES_LIST },
      { type: 'input', key: 'opposition', label: 'Opposition Club', placeholder: 'e.g. Riverside United' },
      { type: 'select', key: 'competition', label: 'Competition', options: ['League','FA Cup','League Cup','Friendly'] },
      { type: 'multi-select', key: 'focus', label: 'Focus Areas', options: ['Set Pieces','Pressing','Build Up','Transitions','Individual Threats'] },
    ],
    loadingMessage: 'Analysing opposition and preparing match plan...',
    loadingSteps: ['Scanning opposition data', 'Analysing tactical patterns', 'Identifying key threats', 'Building match plan'],
    resultRenderer: 'match-prep',
    actions: ['Save Match Prep', 'Share with Staff', 'Add to Video Session', 'Print for Meeting'].map(l => ({ label: l })),
  },
  // ── FIRST TEAM ───────────────────────────────────────────────────────────
  'training-plan': {
    title: 'Training Plan', emoji: '🏃', subtitle: 'AI training session builder',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'sessionType', label: 'Session Type', options: ['Tactical','Technical','Physical','Recovery','Set Pieces','Match Prep'] },
      { type: 'date', key: 'date', label: 'Date' },
      { type: 'select', key: 'duration', label: 'Duration', options: ['60 min','75 min','90 min','120 min'] },
      { type: 'textarea', key: 'focus', label: 'Focus', placeholder: 'e.g. Pressing triggers for Saturday' },
      { type: 'select', key: 'players', label: 'Players', options: ['All Squad','First Team','Reserve Group','Recovery Group'] },
    ],
    loadingMessage: 'Building training session plan...',
    loadingSteps: ['Designing warmup', 'Planning main drills', 'Structuring set pieces', 'Preparing cooldown'],
    resultRenderer: 'training-plan',
    actions: ['Save Plan', 'Share with Staff', 'Add to Calendar', 'Print Session Cards'].map(l => ({ label: l })),
  },
  'player-ratings': {
    title: 'Player Ratings', emoji: '⭐', subtitle: 'Post-match performance ratings',
    steps: ['Configure', 'Rate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'match', label: 'Match', options: FIXTURES_LIST },
      { type: 'toggle', key: 'rateAll', label: 'Rate All Players', defaultVal: true },
    ],
    loadingMessage: 'Preparing rating forms...',
    loadingSteps: ['Loading match data', 'Pulling player stats', 'Generating rating forms', 'Setting baselines'],
    resultRenderer: 'player-ratings',
    actions: ['Save Ratings', 'Flag Underperformers', 'Generate Report'].map(l => ({ label: l })),
  },
  'match-report': {
    title: 'Match Report', emoji: '📝', subtitle: 'AI-written match report',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'match', label: 'Match', options: FIXTURES_LIST },
      { type: 'multi-select', key: 'sections', label: 'Include Sections', options: ['Goals','Cards','Substitutions','Key Moments','Stats'] },
    ],
    loadingMessage: 'Writing match report...',
    loadingSteps: ['Compiling match events', 'Analysing key moments', 'Generating narrative', 'Adding statistics'],
    resultRenderer: 'match-report',
    actions: ['Save Report', 'Publish to Website', 'Send to Media', 'Share with Board'].map(l => ({ label: l })),
  },
  'set-pieces': {
    title: 'Set Pieces', emoji: '🎯', subtitle: 'Set piece playbook and diagrams',
    steps: ['Configure', 'Load', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'type', label: 'Type', options: ['Corners','Free Kicks','Penalties','Throw-ins','Goal Kicks'] },
      { type: 'select', key: 'situation', label: 'Situation', options: ['Attacking','Defensive','Both'] },
    ],
    loadingMessage: 'Loading set piece playbook...',
    loadingSteps: ['Loading attacking routines', 'Loading defensive setups', 'Calculating success rates', 'Preparing diagrams'],
    resultRenderer: 'set-pieces',
    actions: ['Save to Playbook', 'Assign to Training', 'Share with Squad'].map(l => ({ label: l })),
  },
  'recovery-session': {
    title: 'Recovery Session', emoji: '💆', subtitle: 'Post-match recovery protocol',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'date', key: 'date', label: 'Date' },
      { type: 'select', key: 'players', label: 'Players', options: ['All Squad','Starters Only','Specific Group'] },
      { type: 'select', key: 'sessionType', label: 'Session Type', options: ['Active Recovery','Ice Bath','Pool Session','Light Gym','Rest Day'] },
    ],
    loadingMessage: 'Building recovery protocol...',
    loadingSteps: ['Analysing match load data', 'Identifying high-load players', 'Building individual protocols', 'Setting recovery targets'],
    resultRenderer: 'recovery-session',
    actions: ['Save Plan', 'Notify Players', 'Notify Physio', 'Schedule Follow-up'].map(l => ({ label: l })),
  },
  // ── MEDICAL ──────────────────────────────────────────────────────────────
  'return-to-play': {
    title: 'Return to Play', emoji: '🔙', subtitle: 'Rehabilitation protocol generator',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: INJURED_PLAYERS },
      { type: 'select', key: 'phase', label: 'Current Phase', options: ['Acute','Rehab','Gym','Pitch','Training','Full Training','Match Ready'] },
      { type: 'input', key: 'nextMilestone', label: 'Next Milestone', placeholder: 'e.g. Light jogging' },
      { type: 'date', key: 'targetReturn', label: 'Target Return Date' },
    ],
    loadingMessage: 'Generating return to play protocol...',
    loadingSteps: ['Assessing injury profile', 'Building weekly programme', 'Setting clearance criteria', 'Scheduling milestones'],
    resultRenderer: 'return-to-play',
    actions: ['Save Protocol', 'Share with Physio', 'Notify Manager', 'Set Reminders'].map(l => ({ label: l })),
  },
  'load-report': {
    title: 'GPS Load Report', emoji: '📡', subtitle: 'Player load and fitness monitoring',
    steps: ['Configure', 'Compile', 'Results', 'Action'],
    fields: [
      { type: 'date', key: 'dateStart', label: 'Date Range Start' },
      { type: 'date', key: 'dateEnd', label: 'Date Range End' },
      { type: 'select', key: 'players', label: 'Players', options: ['All','First Team','Specific'] },
      { type: 'multi-select', key: 'metrics', label: 'Metrics', options: ['Distance','High Speed Running','Sprint Count','Max Speed','Acceleration'] },
    ],
    loadingMessage: 'Compiling GPS load data...',
    loadingSteps: ['Pulling GPS data', 'Calculating load metrics', 'Comparing to baselines', 'Generating risk assessment'],
    resultRenderer: 'load-report',
    actions: ['Save Report', 'Share with Staff', 'Flag Concerns'].map(l => ({ label: l })),
  },
  'screen-player': {
    title: 'Screen Player', emoji: '🩺', subtitle: 'Medical screening checklist',
    steps: ['Configure', 'Prepare', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'playerName', label: 'Player Name', placeholder: 'e.g. Yannick Diallo' },
      { type: 'select', key: 'screenType', label: 'Screening Type', options: ['Pre-signing Medical','Pre-season Baseline','Return from Injury','Cardiac Screening','Concussion Assessment'] },
      { type: 'date', key: 'date', label: 'Date' },
    ],
    loadingMessage: 'Preparing screening checklist...',
    loadingSteps: ['Loading screening protocol', 'Generating assessment forms', 'Preparing medical checklist', 'Setting pass criteria'],
    resultRenderer: 'screen-player',
    actions: ['Save Results', 'Generate Certificate', 'Flag Concerns', 'Update Medical File'].map(l => ({ label: l })),
  },
  'medical-clearance': {
    title: 'Medical Clearance', emoji: '✅', subtitle: 'Fitness clearance assessment',
    steps: ['Configure', 'Review', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: INJURED_PLAYERS },
      { type: 'select', key: 'clearanceType', label: 'Clearance Type', options: ['Training','Modified Training','Full Contact','Match'] },
    ],
    loadingMessage: 'Reviewing medical status...',
    loadingSteps: ['Pulling medical records', 'Assessing current status', 'Checking outstanding concerns', 'Generating recommendation'],
    resultRenderer: 'medical-clearance',
    actions: ['Issue Clearance', 'Notify Manager', 'Update Availability', 'Log in Record'].map(l => ({ label: l })),
  },
  // ── SCOUTING ─────────────────────────────────────────────────────────────
  'add-target': {
    title: 'Add Target', emoji: '🎯', subtitle: 'Add player to scouting target list',
    steps: ['Configure', 'Research', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'playerName', label: 'Player Name', placeholder: 'e.g. Sander de Vries' },
      { type: 'select', key: 'position', label: 'Position', options: POSITIONS },
      { type: 'input', key: 'club', label: 'Current Club', placeholder: 'e.g. Ajax' },
      { type: 'number', key: 'age', label: 'Age', defaultVal: 22 },
      { type: 'input', key: 'nationality', label: 'Nationality', placeholder: 'e.g. Netherlands' },
      { type: 'input', key: 'marketValue', label: 'Market Value (£)', placeholder: 'e.g. 900,000' },
      { type: 'select', key: 'source', label: 'How Identified', options: ['Scout Report','Agent Tip','Data Analysis','Manager Request'] },
    ],
    loadingMessage: 'Adding to target list and pulling data...',
    loadingSteps: ['Creating player profile', 'Searching databases', 'Assessing priority', 'Assigning scouts'],
    resultRenderer: 'add-target',
    actions: ['Add to List', 'Assign Scout', 'Set Review Date', 'Notify DoF'].map(l => ({ label: l })),
  },
  'agent-contact': {
    title: 'Agent Contact', emoji: '📱', subtitle: 'Log agent communication',
    steps: ['Configure', 'Log', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'agentName', label: 'Agent Name', placeholder: 'e.g. Stellar Group' },
      { type: 'select', key: 'player', label: 'Player', options: [...TRANSFER_TARGETS, 'Other'] },
      { type: 'select', key: 'contactType', label: 'Contact Type', options: ['Call','Meeting','Email','WhatsApp'] },
      { type: 'textarea', key: 'purpose', label: 'Purpose', placeholder: 'Reason for contact' },
      { type: 'textarea', key: 'outcome', label: 'Outcome', placeholder: 'What was discussed/agreed' },
    ],
    loadingMessage: 'Logging agent contact...',
    loadingSteps: ['Recording contact', 'Updating timeline', 'Setting follow-ups', 'Notifying stakeholders'],
    resultRenderer: 'agent-contact',
    actions: ['Save to Log', 'Set Reminder', 'Notify DoF'].map(l => ({ label: l })),
  },
  'shadow-squad': {
    title: 'Shadow Squad', emoji: '👥', subtitle: 'AI-built replacement squad',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'multi-select', key: 'positions', label: 'Positions to Fill', options: POSITIONS },
      { type: 'input', key: 'budgetPerPos', label: 'Budget Per Position (£)', placeholder: 'e.g. 1,500,000' },
      { type: 'select', key: 'ageRange', label: 'Age Range', options: ['18-23','21-26','24-30','Any'] },
    ],
    loadingMessage: 'Building shadow squad from target list...',
    loadingSteps: ['Matching targets to positions', 'Comparing stats', 'Assessing value', 'Building visual layout'],
    resultRenderer: 'shadow-squad',
    actions: ['Save Shadow Squad', 'Present to Board', 'Export PDF'].map(l => ({ label: l })),
  },
  'video-analysis': {
    title: 'Video Analysis', emoji: '🎬', subtitle: 'Video analysis session planner',
    steps: ['Configure', 'Prepare', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'subject', label: 'Subject (Player or Team)', placeholder: 'e.g. Rafa Correia' },
      { type: 'select', key: 'match', label: 'Match / Period', options: FIXTURES_LIST },
      { type: 'select', key: 'focus', label: 'Focus', options: ['Technical','Tactical','Physical','Set Pieces'] },
    ],
    loadingMessage: 'Preparing video analysis session...',
    loadingSteps: ['Loading match footage index', 'Identifying key moments', 'Building clip categories', 'Preparing analysis template'],
    resultRenderer: 'video-analysis',
    actions: ['Save Session', 'Book Video Room', 'Assign Analyst'].map(l => ({ label: l })),
  },
  'market-value': {
    title: 'Market Value', emoji: '💰', subtitle: 'Player valuation calculator',
    steps: ['Configure', 'Calculate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: [...SQUAD_NAMES, ...TRANSFER_TARGETS] },
      { type: 'select', key: 'reason', label: 'Reason', options: ['Sale','Loan','Contract Negotiation','Insurance'] },
      { type: 'date', key: 'date', label: 'Date' },
    ],
    loadingMessage: 'Calculating market value...',
    loadingSteps: ['Pulling market data', 'Analysing age trajectory', 'Checking comparable transfers', 'Adjusting for form'],
    resultRenderer: 'market-value',
    actions: ['Save Valuation', 'Share with DoF', 'Add to Contract File'].map(l => ({ label: l })),
  },
  // ── ACADEMY ──────────────────────────────────────────────────────────────
  'development-plan': {
    title: 'Development Plan', emoji: '📈', subtitle: 'Personalised player development',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: ACADEMY_NAMES },
      { type: 'select', key: 'ageGroup', label: 'Age Group', options: ['U18','U21','U23'] },
      { type: 'select', key: 'position', label: 'Position', options: POSITIONS },
      { type: 'multi-select', key: 'focusAreas', label: 'Focus Areas', options: ['Technical','Tactical','Physical','Mental','Education'] },
    ],
    loadingMessage: 'Building personalised development plan...',
    loadingSteps: ['Assessing current ability', 'Setting development targets', 'Planning weekly activities', 'Scheduling reviews'],
    resultRenderer: 'development-plan',
    actions: ['Save Plan', 'Share with Player', 'Assign Coach', 'Set Review Date'].map(l => ({ label: l })),
  },
  'trial-player': {
    title: 'Trial Player', emoji: '🧪', subtitle: 'Set up trial programme',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'playerName', label: 'Player Name', placeholder: 'Full name' },
      { type: 'number', key: 'age', label: 'Age', defaultVal: 16 },
      { type: 'select', key: 'position', label: 'Position', options: POSITIONS },
      { type: 'input', key: 'currentClub', label: 'Current Club', placeholder: 'Or enter "Open Trial"' },
      { type: 'date', key: 'trialStart', label: 'Trial Start' },
      { type: 'date', key: 'trialEnd', label: 'Trial End' },
      { type: 'input', key: 'recommendedBy', label: 'Recommended By', placeholder: 'e.g. Scout / Agent' },
      { type: 'input', key: 'contact', label: 'Contact Details', placeholder: 'Phone or email' },
    ],
    loadingMessage: 'Setting up trial programme...',
    loadingSteps: ['Creating trial record', 'Building session schedule', 'Preparing assessment criteria', 'Notifying coaches'],
    resultRenderer: 'trial-player',
    actions: ['Save Record', 'Notify Coaches', 'Add to Tracker', 'Set Deadline'].map(l => ({ label: l })),
  },
  'eppp-report': {
    title: 'EPPP Report', emoji: '📋', subtitle: 'EPPP compliance reporting',
    steps: ['Configure', 'Compile', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'category', label: 'Category', options: ['U9-U12','U13-U16','U17-U21','U22-U23'] },
      { type: 'date', key: 'periodStart', label: 'Period Start' },
      { type: 'date', key: 'periodEnd', label: 'Period End' },
      { type: 'multi-select', key: 'sections', label: 'Sections', options: ['Coaching Hours','Education','Welfare','Medical','Facilities','Development'] },
    ],
    loadingMessage: 'Compiling EPPP compliance data...',
    loadingSteps: ['Auditing coaching hours', 'Checking education compliance', 'Reviewing welfare records', 'Assessing facilities'],
    resultRenderer: 'eppp-report',
    actions: ['Save Report', 'Submit to PL', 'Notify Academy Manager', 'Set Next Date'].map(l => ({ label: l })),
  },
  'pathway-review': {
    title: 'Pathway Review', emoji: '🛤️', subtitle: 'Player pathway assessment',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: ACADEMY_NAMES },
      { type: 'select', key: 'ageGroup', label: 'Current Age Group', options: ['U18','U21','U23'] },
      { type: 'select', key: 'reviewType', label: 'Review Type', options: ['6-month','Annual','Contract Decision'] },
    ],
    loadingMessage: 'Preparing pathway review...',
    loadingSteps: ['Pulling development data', 'Compiling coach assessments', 'Analysing progression', 'Generating recommendation'],
    resultRenderer: 'pathway-review',
    actions: ['Save Review', 'Notify Parents', 'Update Plan', 'Action Decision'].map(l => ({ label: l })),
  },
  'release-decision': {
    title: 'Release Decision', emoji: '📤', subtitle: 'Player release documentation',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: ACADEMY_NAMES },
      { type: 'select', key: 'reason', label: 'Reason', options: ['Performance','Budget','Surplus','Mutual'] },
      { type: 'input', key: 'noticePeriod', label: 'Notice Period', placeholder: 'e.g. 28 days' },
      { type: 'multi-select', key: 'nextSteps', label: 'Next Steps Offered', options: ['Trial Elsewhere','Agent Introduction','Reference Letter'] },
    ],
    loadingMessage: 'Preparing release documentation...',
    loadingSteps: ['Compiling player history', 'Drafting release letter', 'Preparing FA notification', 'Building exit pack'],
    resultRenderer: 'release-decision',
    actions: ['Confirm Release', 'Generate Letter', 'Notify FA', 'Arrange Exit Meeting'].map(l => ({ label: l })),
  },
  // ── TRANSFERS ────────────────────────────────────────────────────────────
  'submit-bid': {
    title: 'Submit Bid', emoji: '💷', subtitle: 'Formal bid preparation',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: TRANSFER_TARGETS },
      { type: 'input', key: 'bidAmount', label: 'Bid Amount (£)', placeholder: 'e.g. 1,800,000' },
      { type: 'select', key: 'bidType', label: 'Bid Type', options: ['Permanent','Loan','Loan with Option to Buy'] },
      { type: 'select', key: 'paymentStructure', label: 'Payment Structure', options: ['Up Front','Instalments','Sell-on Clause %'] },
      { type: 'date', key: 'deadline', label: 'Deadline' },
      { type: 'textarea', key: 'message', label: 'Message to Selling Club', placeholder: 'Draft message...' },
    ],
    loadingMessage: 'Preparing bid documentation...',
    loadingSteps: ['Drafting bid terms', 'Calculating payment schedule', 'Preparing conditions', 'Generating bid letter'],
    resultRenderer: 'submit-bid',
    actions: ['Submit Bid', 'Notify Board', 'Set Deadline Reminder', 'Prepare Counter Scenario'].map(l => ({ label: l })),
  },
  'loan-out': {
    title: 'Loan Out', emoji: '↗️', subtitle: 'Loan agreement preparation',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: SQUAD_NAMES },
      { type: 'select', key: 'loanType', label: 'Loan Type', options: ['Season','January-June','Emergency'] },
      { type: 'textarea', key: 'targetClubs', label: 'Target Clubs', placeholder: 'e.g. Millfield Town, Ashford FC' },
      { type: 'select', key: 'minLevel', label: 'Min League Level', options: ['Premier League','Championship','League One','League Two','National League'] },
      { type: 'input', key: 'wageContrib', label: 'Wage Contribution (%)', placeholder: 'e.g. 50' },
      { type: 'input', key: 'loanFee', label: 'Loan Fee (£)', placeholder: 'e.g. 50,000' },
      { type: 'toggle', key: 'recallClause', label: 'Recall Clause', defaultVal: true },
    ],
    loadingMessage: 'Finding loan options...',
    loadingSteps: ['Assessing player profile', 'Matching club requirements', 'Building loan terms', 'Preparing agreement'],
    resultRenderer: 'loan-out',
    actions: ['Agree Loan', 'Notify FA', 'Update Registration', 'Set Monitoring'].map(l => ({ label: l })),
  },
  'transfer-report': {
    title: 'Transfer Report', emoji: '📊', subtitle: 'Transfer window summary',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'window', label: 'Window', options: ['Current','Summer 2025','January 2026'] },
      { type: 'select', key: 'reportType', label: 'Report Type', options: ['Summary','Board Update','Detailed'] },
    ],
    loadingMessage: 'Compiling transfer window report...',
    loadingSteps: ['Listing ins and outs', 'Calculating fees', 'Assessing squad impact', 'Generating analysis'],
    resultRenderer: 'transfer-report',
    actions: ['Save Report', 'Email to Board', 'Archive'].map(l => ({ label: l })),
  },
  // ── CONTRACTS ─────────────────────────────────────────────────────────────
  'new-contract': {
    title: 'New Contract', emoji: '📝', subtitle: 'Draft contract terms',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: SQUAD_NAMES },
      { type: 'select', key: 'contractType', label: 'Contract Type', options: ['Professional','Scholar','Amateur'] },
      { type: 'date', key: 'startDate', label: 'Start Date' },
      { type: 'date', key: 'endDate', label: 'End Date' },
      { type: 'input', key: 'weeklyWage', label: 'Weekly Wage (£)', placeholder: 'e.g. 5,000' },
      { type: 'input', key: 'signingFee', label: 'Signing Fee (£)', placeholder: 'e.g. 25,000' },
      { type: 'input', key: 'appearanceBonus', label: 'Appearance Bonus (£)', placeholder: 'e.g. 500' },
      { type: 'input', key: 'goalBonus', label: 'Goal Bonus (£)', placeholder: 'e.g. 1,000' },
      { type: 'input', key: 'agent', label: 'Agent', placeholder: 'Agent name' },
      { type: 'input', key: 'agentFee', label: 'Agent Fee (£)', placeholder: 'e.g. 50,000' },
    ],
    loadingMessage: 'Drafting contract terms...',
    loadingSteps: ['Calculating wage impact', 'Comparing to squad', 'Building heads of terms', 'Preparing summary'],
    resultRenderer: 'new-contract',
    actions: ['Save to Database', 'Notify Agent', 'Schedule Signing', 'Update Budget'].map(l => ({ label: l })),
  },
  'renewal': {
    title: 'Contract Renewal', emoji: '🔄', subtitle: 'Renewal proposal builder',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: SQUAD_NAMES },
      { type: 'input', key: 'currentWage', label: 'Current Wage (£/wk)', placeholder: 'e.g. 3,500' },
      { type: 'input', key: 'proposedWage', label: 'Proposed Wage (£/wk)', placeholder: 'e.g. 5,000' },
      { type: 'select', key: 'proposedLength', label: 'Proposed Length', options: ['1 year','2 years','3 years','4 years','5 years'] },
      { type: 'textarea', key: 'bonuses', label: 'Bonuses', placeholder: 'Appearance, goals, clean sheets...' },
      { type: 'select', key: 'priority', label: 'Priority', options: ['Must Keep','Important','Standard','Low Priority'] },
    ],
    loadingMessage: 'Preparing renewal proposal...',
    loadingSteps: ['Comparing current terms', 'Assessing market value', 'Checking comparable deals', 'Building negotiation strategy'],
    resultRenderer: 'renewal',
    actions: ['Make Offer', 'Log in System', 'Notify Agent', 'Set Deadline'].map(l => ({ label: l })),
  },
  'release': {
    title: 'Release Player', emoji: '📤', subtitle: 'Release documentation',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: SQUAD_NAMES },
      { type: 'select', key: 'releaseType', label: 'Release Type', options: ['End of Contract','Mutual Termination','Loan Recall'] },
      { type: 'date', key: 'effectiveDate', label: 'Effective Date' },
      { type: 'input', key: 'settlement', label: 'Settlement (£)', placeholder: 'If applicable' },
      { type: 'toggle', key: 'prepareStatement', label: 'Prepare Statement', defaultVal: false },
    ],
    loadingMessage: 'Preparing release documentation...',
    loadingSteps: ['Calculating obligations', 'Checking FA requirements', 'Drafting documentation', 'Preparing statement'],
    resultRenderer: 'release',
    actions: ['Confirm Release', 'Notify FA', 'Update Budget', 'Release Statement'].map(l => ({ label: l })),
  },
  // ── OPERATIONS ───────────────────────────────────────────────────────────
  'fa-registration': {
    title: 'FA Registration', emoji: '🏴', subtitle: 'Player registration checklist',
    steps: ['Configure', 'Check', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'player', label: 'Player', options: SQUAD_NAMES },
      { type: 'select', key: 'regType', label: 'Registration Type', options: ['New','Transfer','Loan','International Clearance'] },
      { type: 'select', key: 'competition', label: 'Competition', options: ['Premier League','EFL','FA Cup','Both'] },
      { type: 'date', key: 'deadline', label: 'Deadline' },
    ],
    loadingMessage: 'Checking registration requirements...',
    loadingSteps: ['Loading requirements', 'Checking documents', 'Estimating processing time', 'Assessing deadline'],
    resultRenderer: 'fa-registration',
    actions: ['Submit Registration', 'Track Status', 'Set Reminder', 'Notify DoF'].map(l => ({ label: l })),
  },
  'travel-booking': {
    title: 'Travel Booking', emoji: '✈️', subtitle: 'Travel logistics planner',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'tripType', label: 'Trip Type', options: ['Away Match','Training Camp','Pre-season','International Duty'] },
      { type: 'input', key: 'destination', label: 'Destination', placeholder: 'e.g. Northgate' },
      { type: 'date', key: 'departure', label: 'Departure Date' },
      { type: 'date', key: 'return', label: 'Return Date' },
      { type: 'number', key: 'partySize', label: 'Party Size', defaultVal: 25 },
      { type: 'input', key: 'budget', label: 'Budget (£)', placeholder: 'e.g. 5,000' },
    ],
    loadingMessage: 'Arranging travel logistics...',
    loadingSteps: ['Searching transport options', 'Finding accommodation', 'Estimating costs', 'Building itinerary'],
    resultRenderer: 'travel-booking',
    actions: ['Confirm Bookings', 'Notify Squad', 'Create Itinerary', 'Share with Ops'].map(l => ({ label: l })),
  },
  'compliance-check': {
    title: 'Compliance Check', emoji: '✅', subtitle: 'Regulatory compliance audit',
    steps: ['Configure', 'Check', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'checkType', label: 'Check Type', options: ['FFP/PSR','Squad Registration','Work Permits','DBS','Safeguarding','Licensing'] },
      { type: 'date', key: 'deadline', label: 'Deadline' },
      { type: 'input', key: 'officer', label: 'Responsible Officer', placeholder: 'e.g. Sarah Johnson' },
    ],
    loadingMessage: 'Running compliance check...',
    loadingSteps: ['Auditing records', 'Checking deadlines', 'Identifying gaps', 'Generating report'],
    resultRenderer: 'compliance-check',
    actions: ['Save Report', 'Assign Actions', 'Set Reminders', 'Notify Staff'].map(l => ({ label: l })),
  },
  // ── COMMERCIAL ───────────────────────────────────────────────────────────
  'sponsor-report': {
    title: 'Sponsor Report', emoji: '🤝', subtitle: 'Sponsor performance report',
    steps: ['Configure', 'Compile', 'Results', 'Action'],
    fields: [
      { type: 'input', key: 'sponsorName', label: 'Sponsor Name', placeholder: 'e.g. Oakridge Motors' },
      { type: 'date', key: 'periodStart', label: 'Report Period Start' },
      { type: 'date', key: 'periodEnd', label: 'Report Period End' },
      { type: 'multi-select', key: 'sections', label: 'Sections', options: ['Exposure','Deliverables','Social','Hospitality','ROI'] },
    ],
    loadingMessage: 'Compiling sponsor report...',
    loadingSteps: ['Calculating exposure', 'Auditing deliverables', 'Pulling social data', 'Estimating ROI'],
    resultRenderer: 'sponsor-report',
    actions: ['Send to Sponsor', 'Save to Records', 'Schedule Renewal'].map(l => ({ label: l })),
  },
  'social-post': {
    title: 'Social Post', emoji: '📱', subtitle: 'AI social media content',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'platform', label: 'Platform', options: ['Twitter/X','Instagram','Facebook','TikTok','LinkedIn'] },
      { type: 'select', key: 'contentType', label: 'Content Type', options: ['Match Result','Squad Update','Sponsor Content','Community','Transfer News'] },
      { type: 'select', key: 'tone', label: 'Tone', options: ['Official','Casual','Excited','Professional'] },
    ],
    loadingMessage: 'Writing post...',
    loadingSteps: ['Analysing audience', 'Generating copy', 'Suggesting hashtags', 'Selecting posting time'],
    resultRenderer: 'social-post',
    actions: ['Schedule Post', 'Post Now', 'Edit & Save', 'Track Engagement'].map(l => ({ label: l })),
  },
  // ── MEDIA & COMMS ────────────────────────────────────────────────────────
  'press-conference': {
    title: 'Press Conference Prep', emoji: '🎤', subtitle: 'AI press conference briefing',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'type', label: 'Type', options: ['Pre-match','Post-match','Transfer','General'] },
      { type: 'input', key: 'context', label: 'Match or Context', placeholder: 'e.g. vs Riverside United (H)' },
      { type: 'input', key: 'managerName', label: 'Manager Name', placeholder: 'Gaffer' },
      { type: 'textarea', key: 'topics', label: 'Key Topics Expected', placeholder: 'What will journalists ask about?' },
    ],
    loadingMessage: 'Preparing press conference brief...',
    loadingSteps: ['Anticipating questions', 'Drafting responses', 'Identifying sensitive topics', 'Building key messages'],
    resultRenderer: 'press-conference',
    actions: ['Save Pack', 'Share with Manager', 'Print', 'Save to Records'].map(l => ({ label: l })),
  },
  'club-statement': {
    title: 'Club Statement', emoji: '📰', subtitle: 'Official statement drafter',
    steps: ['Configure', 'Generate', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'statementType', label: 'Statement Type', options: ['Transfer Confirmed','Player Departure','Management Change','Incident Response','General'] },
      { type: 'textarea', key: 'keyFacts', label: 'Key Facts', placeholder: 'Main points to include...' },
      { type: 'select', key: 'tone', label: 'Tone', options: ['Official','Warm','Urgent'] },
    ],
    loadingMessage: 'Drafting club statement...',
    loadingSteps: ['Structuring statement', 'Writing opening', 'Adding key facts', 'Preparing closing'],
    resultRenderer: 'club-statement',
    actions: ['Approve & Publish', 'Get Approval', 'Send to Media', 'Post on Social'].map(l => ({ label: l })),
  },
  'interview-request': {
    title: 'Interview Request', emoji: '🎙️', subtitle: 'Media request handler',
    steps: ['Configure', 'Review', 'Results', 'Action'],
    fields: [
      { type: 'select', key: 'person', label: 'Person Requested', options: [...SQUAD_NAMES, 'Manager'] },
      { type: 'select', key: 'outlet', label: 'Outlet', options: ['BBC','Sky Sports','ITV','TalkSport','Local Media','Online','Print','Other'] },
      { type: 'input', key: 'topic', label: 'Topic', placeholder: 'e.g. Season form and transfer plans' },
      { type: 'date', key: 'dateRequested', label: 'Date Requested' },
      { type: 'select', key: 'duration', label: 'Duration', options: ['5 min','10 min','15 min','30 min'] },
      { type: 'select', key: 'format', label: 'Format', options: ['In Person','Phone','Video'] },
    ],
    loadingMessage: 'Reviewing request...',
    loadingSteps: ['Assessing outlet', 'Checking topic sensitivity', 'Reviewing availability', 'Preparing recommendation'],
    resultRenderer: 'interview-request',
    actions: ['Approve', 'Decline', 'Conditional', 'Add to Schedule'].map(l => ({ label: l })),
  },
}

// ─── Result Renderers ───────────────────────────────────────────────────────

function RatingBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 8 ? '#22C55E' : value >= 6 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-16 text-right" style={{ color: '#9CA3AF' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-8" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  )
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  return <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${color}1a`, color, border: `1px solid ${color}33` }}>{status}</span>
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
      <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#4B5563' }}>{title}</p>
      {children}
    </div>
  )
}

function BulletList({ items, color = '#9CA3AF' }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs" style={{ color }}>
          <span style={{ color: PRIMARY }}>•</span> {item}
        </li>
      ))}
    </ul>
  )
}

function TimelineEntry({ time, title, detail, color }: { time: string; title: string; detail: string; color: string }) {
  return (
    <div className="flex gap-3 pb-3" style={{ borderLeft: `2px solid ${color}`, marginLeft: 4, paddingLeft: 12 }}>
      <div>
        <span className="text-[10px] font-mono" style={{ color: '#6B7280' }}>{time}</span>
        <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>{detail}</p>
      </div>
    </div>
  )
}

function TrafficLight({ player, load, status }: { player: string; load: string; status: 'green' | 'amber' | 'red' }) {
  const colors = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
      <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{player}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: '#6B7280' }}>{load}</span>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[status] }} />
      </div>
    </div>
  )
}

function ComplianceRow({ item, status, notes }: { item: string; status: 'Complete' | 'Pending' | 'Overdue'; notes: string }) {
  const color = status === 'Complete' ? '#22C55E' : status === 'Pending' ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex-1">
        <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{item}</p>
        <p className="text-[10px]" style={{ color: '#6B7280' }}>{notes}</p>
      </div>
      <StatusBadge status={status} color={color} />
    </div>
  )
}

function renderResults(id: string, _vals: Record<string, string>) {
  switch (id) {
    case 'log-injury':
      return (
        <div className="space-y-4">
          <ResultCard title="Injury Summary">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{_vals.player || 'Diego Martinez'}</span>
                <StatusBadge status={_vals.severity || 'Moderate'} color={(_vals.severity === 'Serious') ? '#EF4444' : (_vals.severity === 'Minor') ? '#22C55E' : '#F59E0B'} />
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{_vals.injuryType || 'Muscle'} — {_vals.bodyPart || 'Right hamstring'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Mechanism: {_vals.mechanism || 'Training'}</p>
            </div>
          </ResultCard>
          <ResultCard title="AI Assessment">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Estimated Return</span>
                <span className="text-sm font-bold" style={{ color: GOLD }}>21 Apr 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Recovery Timeline</span>
                <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>3-4 weeks</span>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Recommended Treatment</p>
                <p className="text-xs" style={{ color: '#F9FAFB' }}>Rest 48hrs, progressive rehab from Day 3, physio 3x weekly</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#EF4444' }}>Matches Missed</p>
                <BulletList items={['Riverside United (H) — 4 Apr', 'Northgate City (A) — 7 Apr', 'Crestwood Athletic (A) — 11 Apr']} color="#FCA5A5" />
              </div>
            </div>
          </ResultCard>
        </div>
      )

    case 'scout-report':
      return (
        <div className="space-y-4">
          <ResultCard title="Player Assessment">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{_vals.playerName || 'Yannick Diallo'}</span>
                <p className="text-xs" style={{ color: '#6B7280' }}>{_vals.club || 'KRC Genk'} · {_vals.position || 'LB'} · Watched: {_vals.matchDate || '25 Mar 2026'}</p>
              </div>
              <StatusBadge status="Monitor" color="#F59E0B" />
            </div>
            <div className="space-y-2 mb-4">
              <RatingBar label="Technical" value={7.5} />
              <RatingBar label="Physical" value={8.0} />
              <RatingBar label="Tactical" value={7.0} />
              <RatingBar label="Mental" value={7.5} />
              <RatingBar label="Overall" value={7.5} />
            </div>
          </ResultCard>
          <ResultCard title="Key Strengths">
            <BulletList items={['Exceptional 1v1 defensive ability — won 78% of duels in match', 'Strong overlapping runs — created 3 chances from left channel', 'Excellent recovery pace — clocked top speed of 34.2 km/h']} color="#22C55E" />
          </ResultCard>
          <ResultCard title="Areas of Concern">
            <BulletList items={['Weak on crosses from deep — only 2/7 found their target', 'Positional discipline drops when pressing high']} color="#EF4444" />
          </ResultCard>
          <ResultCard title="Comparable Players">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Similar profile to young Kyle Walker — athletic, aggressive, room to improve end product</p>
          </ResultCard>
        </div>
      )

    case 'transfer-update':
      return (
        <div className="space-y-4">
          <ResultCard title="Transfer Timeline">
            <div className="space-y-0">
              <TimelineEntry time="30 Mar 2026" title={_vals.updateType || 'Counter Offer'} detail={_vals.details || 'Genk countered at £2.1m with 15% sell-on clause'} color={PRIMARY} />
              <TimelineEntry time="28 Mar 2026" title="Bid Submitted" detail="Initial bid of £1.8m submitted to KRC Genk" color="#22C55E" />
              <TimelineEntry time="25 Mar 2026" title="Scout Report Filed" detail="Mark Evans filed positive scout report — rated A" color="#3B82F6" />
              <TimelineEntry time="20 Mar 2026" title="Target Added" detail="Added to target list following Belgian Pro League scouting trip" color="#6B7280" />
            </div>
          </ResultCard>
          <ResultCard title="Current Status">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>Status</span>
              <StatusBadge status="Negotiating" color="#F59E0B" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>Next Action</span>
              <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Respond to counter offer — push to £1.9m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Deadline</span>
              <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Window closes 10 Apr</span>
            </div>
          </ResultCard>
        </div>
      )

    case 'team-sheet':
      return (
        <div className="space-y-4">
          <ResultCard title={`Starting XI — ${_vals.formation || '4-2-3-1'}`}>
            <div className="space-y-1">
              {[
                { pos: 'GK', name: 'James Walker', note: '' },
                { pos: 'RB', name: 'Callum Henderson', note: '' },
                { pos: 'CB', name: 'Marcus Cole', note: '' },
                { pos: 'CB', name: 'Jake Phillips', note: '' },
                { pos: 'LB', name: 'Tyrone Campbell', note: '' },
                { pos: 'CDM', name: 'Kai Nakamura', note: '' },
                { pos: 'CDM', name: 'Ben Gallagher', note: '' },
                { pos: 'RAM', name: 'Rafa Correia', note: '' },
                { pos: 'CAM', name: 'Ethan Price', note: '' },
                { pos: 'LAM', name: 'Jayden Clarke', note: '' },
                { pos: 'ST', name: 'Tommy Richards', note: '' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-8" style={{ color: PRIMARY }}>{p.pos}</span>
                    <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{p.name}</span>
                  </div>
                  {p.note && <span className="text-[10px]" style={{ color: '#F59E0B' }}>{p.note}</span>}
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Unavailable">
            <BulletList items={['Diego Martinez — Injured (hamstring)', "Sean O'Brien — Injured (ankle)", 'Lucas Santos — Injured (knee)', 'Ryan Thompson — Suspended']} color="#EF4444" />
          </ResultCard>
          <ResultCard title="Substitutes">
            <BulletList items={['Liam Burton (GK)', 'Luka Petrovic (CB)', 'Nathan Brooks (LB)', 'Omar Hassan (CM)', 'Mateo Silva (CAM) ⚠️ Modified', 'Daniel Foster (RW)', 'Aiden Murphy (ST)']} />
          </ResultCard>
        </div>
      )

    case 'board-report':
      return (
        <div className="space-y-4">
          <ResultCard title="Executive Summary">
            <p className="text-xs leading-relaxed" style={{ color: '#F9FAFB' }}>
              The club remains in a strong competitive position, sitting 3rd in the league with 17 wins from 28 matches. Transfer activity has been focused on strengthening the left-back position, with a bid submitted for Yannick Diallo (KRC Genk). The wage bill stands at 62% of revenue, marginally above the board target of 60%. Academy output continues to impress with Josh Collins emerging as a genuine first-team prospect.
            </p>
          </ResultCard>
          <ResultCard title="Key Metrics">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'League Position', value: '3rd', color: '#22C55E' },
                { label: 'Win Rate', value: '62%', color: '#22C55E' },
                { label: 'Transfer Budget', value: '£4.2m', color: '#3B82F6' },
                { label: 'Net Spend', value: '£0', color: '#22C55E' },
                { label: 'Wage/Revenue', value: '62%', color: '#F59E0B' },
                { label: 'Injuries (Current)', value: '3', color: '#EF4444' },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{m.label}</span>
                  <span className="text-xs font-bold" style={{ color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Recommendations">
            <BulletList items={[
              'Prioritise Diallo signing before window closes (10 Apr)',
              'Address wage/revenue ratio before Martinez and Thompson renewals',
              'Promote Josh Collins to first-team bench for remaining fixtures',
              'Schedule board update on academy EPPP compliance before season end',
            ]} color="#FCA5A5" />
          </ResultCard>
        </div>
      )

    case 'match-prep':
      return (
        <div className="space-y-4">
          <ResultCard title="Opposition Analysis — Riverside United">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Formation</span>
                <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>4-4-2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Form (Last 5)</span>
                <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>W D L W D</span>
              </div>
            </div>
          </ResultCard>
          <ResultCard title="Key Players">
            <BulletList items={['#9 Jake Morrison (ST) — 14 goals, strong in the air, targets our left side', '#7 Callum Wood (RW) — Pacey, likes to cut inside, danger on set pieces', '#4 Dan Mitchell (CB) — Organiser, weak turning on the ball']} />
          </ResultCard>
          <ResultCard title="Strengths & Weaknesses">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#22C55E' }}>Strengths</p>
                <BulletList items={['Strong in aerial duels (62% win rate)', 'Effective long throw routine', 'Compact defensive shape']} color="#22C55E" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: '#EF4444' }}>Weaknesses</p>
                <BulletList items={['Vulnerable to high press (34% TO rate)', 'Slow in transition', 'Full-backs push high']} color="#EF4444" />
              </div>
            </div>
          </ResultCard>
          <ResultCard title="Recommended Approach">
            <p className="text-xs" style={{ color: '#F9FAFB' }}>Press high early, exploit space behind full-backs. Use Correia's pace on the right. Avoid aerial contests in midfield. Target Dan Mitchell with quick passing combinations.</p>
          </ResultCard>
          <ResultCard title="Key Individual Battles">
            <BulletList items={['Campbell (LB) vs Wood (RW) — pace vs pace', 'Nakamura (CM) vs Morrison (ST) — tracking runs at set pieces', 'Correia (RW) vs Davies (LB) — 1v1 on the counter']} />
          </ResultCard>
        </div>
      )

    case 'training-plan':
      return (
        <div className="space-y-4">
          {[
            { time: '09:00 — 09:15', name: 'Warmup', desc: 'Dynamic stretching, passing patterns in boxes. Focus on movement off the ball.', equipment: 'Cones, bibs', coaching: 'Sharp passing, body open' },
            { time: '09:15 — 09:35', name: 'Main Block 1 — Pressing Triggers', desc: '11v11 positional play. Pressing triggered by backward pass or heavy touch. Teams rotate.', equipment: 'Full pitch, bibs, goals', coaching: 'Timing of press, cover shadow, cutback awareness' },
            { time: '09:35 — 09:55', name: 'Main Block 2 — Build Up Play', desc: 'Playing out from the back against 4-man press. GK starts, build through thirds.', equipment: 'Half pitch, mannequins, cones', coaching: 'GK distribution, angles of support, progressive passing' },
            { time: '09:55 — 10:10', name: 'Set Pieces / Finishing', desc: 'Corner routines (near post, far post, short). Free kick positioning for Saturday.', equipment: 'Full pitch, goals', coaching: 'Movement patterns, timing of runs' },
            { time: '10:10 — 10:20', name: 'Cooldown', desc: 'Light jog, static stretching, individual meetings with coaching staff.', equipment: 'None', coaching: 'Recovery focus' },
          ].map((block, i) => (
            <ResultCard key={i} title={block.time}>
              <p className="text-xs font-bold mb-1" style={{ color: '#F9FAFB' }}>{block.name}</p>
              <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{block.desc}</p>
              <div className="flex gap-4">
                <span className="text-[10px]" style={{ color: '#6B7280' }}>Equipment: {block.equipment}</span>
                <span className="text-[10px]" style={{ color: GOLD }}>Coaching: {block.coaching}</span>
              </div>
            </ResultCard>
          ))}
        </div>
      )

    case 'player-ratings':
      return (
        <div className="space-y-4">
          <ResultCard title="Match Summary">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Team Average</span><span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>7.2</span></div>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Season Average</span><span className="text-sm font-bold" style={{ color: '#9CA3AF' }}>6.9</span></div>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Highest Rated</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>Rafa Correia — 8.5</span></div>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Lowest Rated</span><span className="text-xs font-bold" style={{ color: '#EF4444' }}>Nathan Brooks — 5.5</span></div>
            </div>
          </ResultCard>
          <ResultCard title="Individual Ratings">
            {[
              { name: 'Rafa Correia', perf: 8.5, effort: 9, tact: 8, tech: 8.5 },
              { name: 'Kai Nakamura', perf: 8, effort: 8.5, tact: 8, tech: 7.5 },
              { name: 'Tommy Richards', perf: 7.5, effort: 8, tact: 7, tech: 7 },
              { name: 'Marcus Cole', perf: 7, effort: 7.5, tact: 7.5, tech: 6.5 },
              { name: 'Nathan Brooks', perf: 5.5, effort: 6, tact: 5, tech: 5.5 },
            ].map((p, i) => (
              <div key={i} className="py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.name}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[{ l: 'Perf', v: p.perf }, { l: 'Effort', v: p.effort }, { l: 'Tactical', v: p.tact }, { l: 'Technical', v: p.tech }].map(r => (
                    <div key={r.l} className="text-center">
                      <span className="text-[10px]" style={{ color: '#6B7280' }}>{r.l}</span>
                      <p className="text-xs font-bold" style={{ color: r.v >= 7 ? '#22C55E' : r.v >= 6 ? '#F59E0B' : '#EF4444' }}>{r.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ResultCard>
        </div>
      )

    case 'match-report':
      return (
        <div className="space-y-4">
          <ResultCard title="Oakridge Edge Past Riverside in Thrilling Contest">
            <p className="text-xs leading-relaxed mb-3" style={{ color: '#F9FAFB' }}>
              Oakridge FC secured a vital three points with a 2-1 victory over Riverside United in front of 8,100 at The Oakridge Arena. Tommy Richards opened the scoring on 23 minutes before Rafa Correia doubled the advantage with a superb solo effort. Jake Morrison pulled one back for the visitors but Oakridge held firm for a deserved win.
            </p>
            <div className="space-y-1 mb-3">
              <p className="text-xs font-semibold" style={{ color: GOLD }}>Goals</p>
              <BulletList items={["23' Tommy Richards (Correia assist)", "58' Rafa Correia (solo run)", "71' Jake Morrison (header from corner)"]} />
            </div>
          </ResultCard>
          <ResultCard title="Match Stats">
            <div className="grid grid-cols-3 gap-0 text-center">
              {[
                { home: '62%', label: 'Possession', away: '38%' },
                { home: '15', label: 'Shots', away: '8' },
                { home: '6', label: 'On Target', away: '3' },
                { home: '7', label: 'Corners', away: '4' },
                { home: '1', label: 'Yellow Cards', away: '3' },
              ].map((s, i) => (
                <div key={i} className="col-span-3 grid grid-cols-3 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                  <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{s.home}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{s.label}</span>
                  <span className="text-xs font-bold" style={{ color: '#EF4444' }}>{s.away}</span>
                </div>
              ))}
            </div>
          </ResultCard>
        </div>
      )

    case 'set-pieces':
      return (
        <div className="space-y-4">
          {[
            { name: 'Near Post Flick', type: 'Corner — Attacking', desc: 'In-swinging corner to near post. Cole attacks front post, flicks on for Richards at back post. Nakamura lurks edge of area.', signal: '"Short!" then back to full delivery', success: '22% conversion (2/9)' },
            { name: 'Training Ground', type: 'Corner — Short', desc: 'Short corner to Correia, lays off to Price on edge of box. Price delivers to back post for Cole.', signal: 'Two players go short', success: '33% conversion (1/3)' },
            { name: 'Zonal Block', type: 'Corner — Defensive', desc: 'Back 4 hold positions, 3 zonally at near/mid/far post. 2 man-mark their biggest aerial threats. Walker commands 6-yard box.', signal: 'Walker calls "ZONE!"', success: '91% clean sheets from corners' },
          ].map((sp, i) => (
            <ResultCard key={i} title={sp.type}>
              <p className="text-xs font-bold mb-1" style={{ color: '#F9FAFB' }}>{sp.name}</p>
              <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{sp.desc}</p>
              <div className="flex items-center gap-4">
                <span className="text-[10px]" style={{ color: GOLD }}>Signal: {sp.signal}</span>
                <span className="text-[10px]" style={{ color: '#22C55E' }}>Success: {sp.success}</span>
              </div>
            </ResultCard>
          ))}
        </div>
      )

    case 'recovery-session':
      return (
        <div className="space-y-4">
          <ResultCard title="Recovery Protocol">
            {[
              { player: 'Rafa Correia', load: 'High (11.2km)', protocol: 'Ice bath + pool session', note: 'Highest distance covered' },
              { player: 'Tommy Richards', load: 'High (10.8km)', protocol: 'Ice bath + light gym', note: '2 goals — high output' },
              { player: 'Kai Nakamura', load: 'Medium (9.4km)', protocol: 'Active recovery jog', note: 'Standard recovery' },
              { player: 'Ethan Price', load: 'Medium (8.9km)', protocol: 'Active recovery + stretching', note: 'Minor fatigue reported' },
              { player: 'Mateo Silva', load: 'Low (6.2km)', protocol: 'Pool session only', note: 'Modified — still on return protocol' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{p.player}</p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>{p.note}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: p.load.startsWith('High') ? '#EF4444' : p.load.startsWith('Medium') ? '#F59E0B' : '#22C55E' }}>{p.load}</p>
                  <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{p.protocol}</p>
                </div>
              </div>
            ))}
          </ResultCard>
        </div>
      )

    case 'return-to-play':
      return (
        <div className="space-y-4">
          <ResultCard title={`Return to Play — ${_vals.player || 'Diego Martinez'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: '#6B7280' }}>Current Phase</span>
              <StatusBadge status={_vals.phase || 'Rehab'} color="#F59E0B" />
            </div>
          </ResultCard>
          {[
            { week: 'Week 1', activities: 'Pool sessions, static bike, upper body gym. No running.', target: 'Pain-free movement', criteria: 'Full ROM achieved' },
            { week: 'Week 2', activities: 'Light jogging on grass, progressive resistance. Dynamic stretching.', target: '70% max speed', criteria: 'No pain during jogging' },
            { week: 'Week 3', activities: 'Running drills, change of direction, non-contact training with squad.', target: '85% max speed', criteria: 'Complete training without reaction' },
            { week: 'Week 4', activities: 'Full training, contact drills, match simulation. Fitness test.', target: '100% match fitness', criteria: 'Pass fitness test, medical sign-off' },
          ].map((w, i) => (
            <ResultCard key={i} title={w.week}>
              <p className="text-xs mb-1" style={{ color: '#F9FAFB' }}>{w.activities}</p>
              <div className="flex gap-4">
                <span className="text-[10px]" style={{ color: GOLD }}>Target: {w.target}</span>
                <span className="text-[10px]" style={{ color: '#22C55E' }}>Clearance: {w.criteria}</span>
              </div>
            </ResultCard>
          ))}
        </div>
      )

    case 'load-report':
      return (
        <div className="space-y-4">
          <ResultCard title="GPS Load Summary">
            <div className="space-y-0">
              <TrafficLight player="Rafa Correia" load="11.2km avg / 10.1km baseline" status="red" />
              <TrafficLight player="Tommy Richards" load="10.8km avg / 9.8km baseline" status="amber" />
              <TrafficLight player="Kai Nakamura" load="9.4km avg / 9.6km baseline" status="green" />
              <TrafficLight player="Ben Gallagher" load="9.1km avg / 9.3km baseline" status="green" />
              <TrafficLight player="Nathan Brooks" load="7.2km avg / 8.8km baseline" status="amber" />
            </div>
          </ResultCard>
          <ResultCard title="Recommendations">
            <BulletList items={[
              'Correia: overload risk — reduce training load this week, consider rotation',
              'Richards: approaching threshold — monitor closely, active recovery recommended',
              'Brooks: underperforming baseline — fitness assessment needed',
            ]} color="#FCA5A5" />
          </ResultCard>
        </div>
      )

    case 'screen-player':
      return (
        <div className="space-y-4">
          <ResultCard title={`Screening — ${_vals.playerName || 'Yannick Diallo'}`}>
            <ComplianceRow item="Cardiac Screening (ECG/Echo)" status="Complete" notes="No abnormalities detected" />
            <ComplianceRow item="Musculoskeletal Assessment" status="Complete" notes="Full ROM, no concerns" />
            <ComplianceRow item="Blood Tests (Full Panel)" status="Pending" notes="Results expected within 48 hours" />
            <ComplianceRow item="MRI Imaging (Both Knees)" status="Pending" notes="Scheduled for tomorrow 10am" />
            <ComplianceRow item="Dental Check" status="Complete" notes="Minor treatment recommended" />
            <ComplianceRow item="Vision Assessment" status="Complete" notes="20/20 — no issues" />
          </ResultCard>
        </div>
      )

    case 'medical-clearance':
      return (
        <div className="space-y-4">
          <ResultCard title={`Medical Status — ${_vals.player || 'Lucas Santos'}`}>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Injury</span><span className="text-xs" style={{ color: '#F9FAFB' }}>Knee cartilage irritation</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Days Since Injury</span><span className="text-xs" style={{ color: '#F9FAFB' }}>18 days</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Assessments</span><span className="text-xs" style={{ color: '#22C55E' }}>3/3 completed</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Outstanding</span><span className="text-xs" style={{ color: '#F9FAFB' }}>None</span></div>
            </div>
          </ResultCard>
          <ResultCard title="Clearance Recommendation">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Recommendation for: {_vals.clearanceType || 'Training'}</span>
              <StatusBadge status="Cleared" color="#22C55E" />
            </div>
            <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Player has completed all rehabilitation milestones. Cleared for full training with monitoring. Re-assess after 48 hours of full contact.</p>
          </ResultCard>
        </div>
      )

    case 'add-target':
      return (
        <div className="space-y-4">
          <ResultCard title="Player Profile">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{_vals.playerName || 'Sander de Vries'}</span>
                <StatusBadge status="Priority B" color="#3B82F6" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Position', v: _vals.position || 'CM' },
                  { l: 'Club', v: _vals.club || 'Ajax' },
                  { l: 'Age', v: _vals.age || '22' },
                  { l: 'Nationality', v: _vals.nationality || 'Netherlands' },
                  { l: 'Market Value', v: `£${_vals.marketValue || '900,000'}` },
                  { l: 'Source', v: _vals.source || 'Scout Report' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between">
                    <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                    <span className="text-xs" style={{ color: '#F9FAFB' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </ResultCard>
          <ResultCard title="Next Steps">
            <BulletList items={['Assign Mark Evans for initial scouting report', 'Schedule video analysis of last 3 matches', 'Set review date: 2 weeks from now']} />
          </ResultCard>
        </div>
      )

    case 'agent-contact':
      return (
        <div className="space-y-4">
          <ResultCard title="Contact Log Entry">
            <div className="space-y-2">
              {[
                { l: 'Date', v: '30 Mar 2026, 14:30' },
                { l: 'Agent', v: _vals.agentName || 'Stellar Group' },
                { l: 'Player', v: _vals.player || 'Yannick Diallo' },
                { l: 'Type', v: _vals.contactType || 'Call' },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold mt-2" style={{ color: '#9CA3AF' }}>Summary</p>
                <p className="text-xs" style={{ color: '#F9FAFB' }}>{_vals.outcome || 'Agent confirmed player is open to move. Personal terms unlikely to be an issue. Wants 3-year deal minimum.'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Next Steps</p>
                <p className="text-xs" style={{ color: '#F9FAFB' }}>Follow up after club responds to bid. Agent expects call by Thursday.</p>
              </div>
            </div>
          </ResultCard>
        </div>
      )

    case 'shadow-squad':
      return (
        <div className="space-y-4">
          {[
            { pos: 'LB', current: 'Tyrone Campbell', target: 'Yannick Diallo', currentStats: 'Age 26 · 2 assists · 6.9 avg', targetStats: 'Age 22 · 4 assists · 7.3 avg', suit: 92 },
            { pos: 'CM', current: 'Ryan Thompson', target: 'Tiago Ferreira', currentStats: 'Age 29 · 3 goals · 7.1 avg', targetStats: 'Age 24 · 2 goals · 7.4 avg', suit: 87 },
            { pos: 'CB', current: 'Diego Martinez', target: 'Andrei Popescu', currentStats: 'Age 30 · Contract Jun 2025', targetStats: 'Age 23 · 2 goals · £900k', suit: 78 },
          ].map((c, i) => (
            <ResultCard key={i} title={c.pos}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-[10px] uppercase" style={{ color: '#6B7280' }}>Current</p>
                  <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{c.current}</p>
                  <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{c.currentStats}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: `${PRIMARY}0d`, border: `1px solid ${PRIMARY}33` }}>
                  <p className="text-[10px] uppercase" style={{ color: PRIMARY }}>Target</p>
                  <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{c.target}</p>
                  <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{c.targetStats}</p>
                  <span className="text-[10px] font-bold" style={{ color: '#22C55E' }}>{c.suit}% fit</span>
                </div>
              </div>
            </ResultCard>
          ))}
        </div>
      )

    case 'video-analysis':
      return (
        <div className="space-y-4">
          <ResultCard title="Analysis Session Plan">
            <div className="space-y-2">
              {[
                { cat: 'Attacking Runs', clips: 8, focus: 'Movement off the ball, timing of runs into channels' },
                { cat: 'Defensive Work', clips: 5, focus: 'Pressing triggers, recovery runs, 1v1 defending' },
                { cat: 'Set Pieces', clips: 4, focus: 'Corner positioning, free kick runs, penalty box movement' },
                { cat: 'Key Moments', clips: 3, focus: 'Goals, assists, decisive actions, errors' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{c.cat}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{c.focus}</p>
                  </div>
                  <span className="text-xs" style={{ color: PRIMARY }}>{c.clips} clips</span>
                </div>
              ))}
            </div>
          </ResultCard>
        </div>
      )

    case 'market-value':
      return (
        <div className="space-y-4">
          <ResultCard title={`Valuation — ${_vals.player || 'Rafa Correia'}`}>
            <div className="text-center py-3 mb-3" style={{ backgroundColor: `${PRIMARY}0d`, borderRadius: 8 }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>Estimated Value Range</p>
              <p className="text-xl font-black" style={{ color: GOLD }}>£1.6m — £2.2m</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Recommended asking price: £2.0m</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Age Impact</span><span className="text-xs" style={{ color: '#22C55E' }}>+15% (peak age trajectory)</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Contract Length</span><span className="text-xs" style={{ color: '#F59E0B' }}>-5% (2 years remaining)</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Recent Form</span><span className="text-xs" style={{ color: '#22C55E' }}>+10% (above season average)</span></div>
            </div>
          </ResultCard>
          <ResultCard title="Comparable Transfers">
            <BulletList items={['Similar LW — £1.8m (Championship, Age 24, Jan 2026)', 'Similar RW — £2.1m (League One to Championship, Age 23, Aug 2025)', 'Similar winger — £1.5m (Portuguese 2nd div to EFL, Age 25, Jan 2026)']} />
          </ResultCard>
        </div>
      )

    case 'development-plan':
      return (
        <div className="space-y-4">
          <ResultCard title={`Development Plan — ${_vals.player || 'Josh Collins'}`}>
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>12-week personalised development programme</p>
          </ResultCard>
          {[
            { phase: 'Phase 1 (Wk 1-3)', obj: 'Technical Foundation', focus: 'First touch under pressure, finishing from crosses, movement in the box', target: 'Score in 60%+ of training games' },
            { phase: 'Phase 2 (Wk 4-6)', obj: 'Tactical Awareness', focus: 'Pressing from the front, hold-up play, link-up combinations', target: 'Complete tactical test with 80%+ score' },
            { phase: 'Phase 3 (Wk 7-9)', obj: 'Physical Development', focus: 'Sprint endurance, aerial strength, body conditioning', target: 'Hit GPS benchmarks for first-team level' },
            { phase: 'Phase 4 (Wk 10-12)', obj: 'Match Integration', focus: 'First-team training sessions, bench inclusion, mentoring from senior players', target: 'Named in 2+ matchday squads' },
          ].map((p, i) => (
            <ResultCard key={i} title={p.phase}>
              <p className="text-xs font-bold mb-1" style={{ color: GOLD }}>{p.obj}</p>
              <p className="text-xs mb-1" style={{ color: '#F9FAFB' }}>{p.focus}</p>
              <p className="text-[10px]" style={{ color: '#22C55E' }}>Target: {p.target}</p>
            </ResultCard>
          ))}
        </div>
      )

    case 'trial-player':
      return (
        <div className="space-y-4">
          <ResultCard title="Trial Schedule">
            <BulletList items={['Day 1: U21 training session — technical assessment', 'Day 2: U18 match (if available) — game assessment', 'Day 3: First-team training observation — temperament check']} />
          </ResultCard>
          <ResultCard title="Assessment Criteria">
            <ComplianceRow item="Technical Ability" status="Pending" notes="First touch, passing range, finishing" />
            <ComplianceRow item="Physical Attributes" status="Pending" notes="Speed, strength, endurance" />
            <ComplianceRow item="Tactical Intelligence" status="Pending" notes="Positioning, movement, decision making" />
            <ComplianceRow item="Attitude & Character" status="Pending" notes="Work rate, communication, coachability" />
            <ComplianceRow item="Injury History Check" status="Pending" notes="Medical screening if progressing" />
          </ResultCard>
          <ResultCard title="Verdict Deadline">
            <p className="text-xs" style={{ color: '#F9FAFB' }}>Decision required by end of trial period. Report to Academy Director.</p>
          </ResultCard>
        </div>
      )

    case 'eppp-report':
      return (
        <div className="space-y-4">
          <ResultCard title="EPPP Compliance Dashboard">
            <ComplianceRow item="Coaching Hours" status="Complete" notes="Target: 12hrs/wk — Delivered: 13.5hrs/wk (112%)" />
            <ComplianceRow item="Education Compliance" status="Complete" notes="All scholars meeting 16hrs education requirement" />
            <ComplianceRow item="Welfare & Safeguarding" status="Complete" notes="All DBS checks current, welfare officer in place" />
            <ComplianceRow item="Medical Provision" status="Pending" notes="Cardiac screening due for U16 cohort by end April" />
            <ComplianceRow item="Facilities" status="Complete" notes="Category 2 standards met across all areas" />
            <ComplianceRow item="Player Development" status="Pending" notes="2 individual development plans need updating" />
          </ResultCard>
          <ResultCard title="Overall Compliance">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Compliance Rate</span>
              <span className="text-sm font-bold" style={{ color: '#22C55E' }}>87%</span>
            </div>
          </ResultCard>
        </div>
      )

    case 'pathway-review':
      return (
        <div className="space-y-4">
          <ResultCard title={`Pathway Review — ${_vals.player || 'Josh Collins'}`}>
            <div className="space-y-2 mb-3">
              <RatingBar label="Technical" value={7.8} />
              <RatingBar label="Tactical" value={6.5} />
              <RatingBar label="Physical" value={8.2} />
              <RatingBar label="Mental" value={7.0} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>First-Team Probability</span>
              <span className="text-sm font-bold" style={{ color: '#22C55E' }}>35%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Recommendation</span>
              <StatusBadge status="Retain & Develop" color="#22C55E" />
            </div>
          </ResultCard>
          <ResultCard title="Coach Comments">
            <p className="text-xs" style={{ color: '#F9FAFB' }}>&quot;Josh has made excellent progress this season. His goal-scoring record at U21 level is outstanding. Needs to improve hold-up play and tactical discipline to make the step up. Recommend first-team training exposure.&quot;</p>
          </ResultCard>
        </div>
      )

    case 'release-decision':
      return (
        <div className="space-y-4">
          <ResultCard title={`Release Summary — ${_vals.player || 'Elijah Shaw'}`}>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Tenure</span><span className="text-xs" style={{ color: '#F9FAFB' }}>2 years</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Reason</span><span className="text-xs" style={{ color: '#F9FAFB' }}>{_vals.reason || 'Surplus'}</span></div>
            </div>
          </ResultCard>
          <ResultCard title="Development Highlights">
            <BulletList items={['7 assists in U18 appearances — pace and direct running', 'Represented club at regional showcase events', 'Good attitude and professionalism throughout']} />
          </ResultCard>
          <ResultCard title="Release Letter (Draft)">
            <p className="text-xs italic" style={{ color: '#9CA3AF' }}>&quot;Dear [Player], We would like to thank you for your dedication during your time at Oakridge FC. After careful consideration, we have decided not to offer a renewed contract. We wish you every success in your future career and will provide a full reference to any interested clubs...&quot;</p>
          </ResultCard>
        </div>
      )

    case 'submit-bid':
      return (
        <div className="space-y-4">
          <ResultCard title="Bid Summary">
            <div className="space-y-2">
              {[
                { l: 'Player', v: _vals.player || 'Yannick Diallo' },
                { l: 'Bid Amount', v: `£${_vals.bidAmount || '1,900,000'}` },
                { l: 'Type', v: _vals.bidType || 'Permanent' },
                { l: 'Payment', v: _vals.paymentStructure || 'Instalments' },
                { l: 'Deadline', v: _vals.deadline || '8 Apr 2026' },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Payment Schedule">
            <BulletList items={['£1.2m on completion', '£400k after 20 appearances', '£300k promotion bonus', '10% sell-on clause']} />
          </ResultCard>
        </div>
      )

    case 'loan-out':
      return (
        <div className="space-y-4">
          <ResultCard title={`Loan Summary — ${_vals.player || 'Jayden Clarke'}`}>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>3 clubs identified as suitable loan destinations</p>
          </ResultCard>
          {[
            { club: 'Millfield Town', level: 'League One', suit: '88%', notes: 'Regular starter guaranteed, plays attacking football' },
            { club: 'Ashford FC', level: 'League One', suit: '82%', notes: 'Good development record, played last loan well' },
            { club: 'Lakeside United', level: 'Championship', suit: '71%', notes: 'Higher level but may not start regularly' },
          ].map((c, i) => (
            <ResultCard key={i} title={c.club}>
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color: '#6B7280' }}>{c.level}</span>
                <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{c.suit} match</span>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{c.notes}</p>
            </ResultCard>
          ))}
        </div>
      )

    case 'transfer-report':
      return (
        <div className="space-y-4">
          <ResultCard title="Transfer Window Summary">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Arrivals', v: '0', c: '#3B82F6' }, { l: 'Departures', v: '0', c: '#EF4444' },
                { l: 'Total Spent', v: '£0', c: '#F59E0B' }, { l: 'Total Received', v: '£0', c: '#22C55E' },
                { l: 'Net Spend', v: '£0', c: '#F9FAFB' }, { l: 'Budget Remaining', v: '£4.2m', c: '#22C55E' },
              ].map(m => (
                <div key={m.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{m.l}</span>
                  <span className="text-xs font-bold" style={{ color: m.c }}>{m.v}</span>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Active Negotiations">
            <BulletList items={['Yannick Diallo (LB) — Bid submitted, counter received at £2.1m', 'Tiago Ferreira (CM) — Watching, video analysis complete']} />
          </ResultCard>
          <ResultCard title="Positions Still Needed">
            <BulletList items={['Left Back — Priority (Martinez cover needed)', 'Centre Midfielder — Desirable (Thompson contract expiring)']} color="#FCA5A5" />
          </ResultCard>
        </div>
      )

    case 'new-contract':
      return (
        <div className="space-y-4">
          <ResultCard title="Contract Summary">
            <div className="space-y-2">
              {[
                { l: 'Player', v: _vals.player || 'Tommy Richards' },
                { l: 'Type', v: _vals.contractType || 'Professional' },
                { l: 'Weekly Wage', v: `£${_vals.weeklyWage || '5,000'}` },
                { l: 'Duration', v: `${_vals.startDate || 'Jul 2026'} — ${_vals.endDate || 'Jun 2030'}` },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Wage Budget Impact">
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>Budget Used</span>
              <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>4.2% of remaining</span>
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Comparable: Ethan Price (£4,500/wk), Daniel Foster (£3,800/wk)</p>
          </ResultCard>
        </div>
      )

    case 'renewal':
      return (
        <div className="space-y-4">
          <ResultCard title={`Renewal Proposal — ${_vals.player || 'Marcus Cole'}`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-[10px] uppercase" style={{ color: '#6B7280' }}>Current</p>
                <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>£{_vals.currentWage || '3,500'}/wk</p>
                <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Expires Jun 2028</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: `${PRIMARY}0d`, border: `1px solid ${PRIMARY}33` }}>
                <p className="text-[10px] uppercase" style={{ color: PRIMARY }}>Proposed</p>
                <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>£{_vals.proposedWage || '5,000'}/wk</p>
                <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{_vals.proposedLength || '3 years'}</p>
              </div>
            </div>
          </ResultCard>
          <ResultCard title="Risk Assessment">
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>Risk of Losing</span>
              <StatusBadge status="Medium" color="#F59E0B" />
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Player has 2 years remaining but has attracted interest from Championship clubs. Recommend securing renewal before summer window.</p>
          </ResultCard>
        </div>
      )

    case 'release':
      return (
        <div className="space-y-4">
          <ResultCard title={`Release — ${_vals.player || 'Aiden Murphy'}`}>
            <div className="space-y-2">
              {[
                { l: 'Release Type', v: _vals.releaseType || 'End of Contract' },
                { l: 'Effective Date', v: _vals.effectiveDate || '30 Jun 2026' },
                { l: 'Settlement', v: _vals.settlement ? `£${_vals.settlement}` : 'N/A' },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="FA Requirements">
            <ComplianceRow item="FA Notification (Form H)" status="Pending" notes="Must be submitted within 7 days" />
            <ComplianceRow item="Final Wage Payment" status="Pending" notes="Calculate pro-rata and bonuses" />
            <ComplianceRow item="Registration Cancellation" status="Pending" notes="Remove from squad list" />
          </ResultCard>
        </div>
      )

    case 'fa-registration':
      return (
        <div className="space-y-4">
          <ResultCard title="Registration Checklist">
            <ComplianceRow item="Player Contract (signed)" status="Complete" notes="Original held by club secretary" />
            <ComplianceRow item="International Transfer Certificate" status="Pending" notes="Requested from selling club's FA" />
            <ComplianceRow item="Work Permit / GBE" status="Complete" notes="GBE points: 18 (threshold: 15)" />
            <ComplianceRow item="Medical Report" status="Pending" notes="Pre-signing medical scheduled" />
            <ComplianceRow item="Passport / ID Verification" status="Complete" notes="Verified and copied" />
            <ComplianceRow item="Bank Details Form" status="Pending" notes="Awaiting from player" />
          </ResultCard>
          <ResultCard title="Processing">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Estimated Processing</span>
              <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>3-5 working days</span>
            </div>
          </ResultCard>
        </div>
      )

    case 'travel-booking':
      return (
        <div className="space-y-4">
          <ResultCard title="Transport Recommendation">
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>Recommended</span>
              <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Team Coach — £1,200</span>
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Journey time: 1hr 45min. Depart 11:30, arrive 13:15.</p>
          </ResultCard>
          <ResultCard title="Hotel Options">
            {[
              { name: 'Northgate Marriott', cost: '£120/night', rating: '4.5★' },
              { name: 'Premier Inn Northgate', cost: '£75/night', rating: '4.0★' },
              { name: 'Holiday Inn Express', cost: '£85/night', rating: '4.2★' },
            ].map((h, i) => (
              <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <span className="text-xs" style={{ color: '#F9FAFB' }}>{h.name}</span>
                <div className="flex gap-3">
                  <span className="text-xs font-bold" style={{ color: '#22C55E' }}>{h.cost}</span>
                  <span className="text-xs" style={{ color: GOLD }}>{h.rating}</span>
                </div>
              </div>
            ))}
          </ResultCard>
          <ResultCard title="Estimated Total">
            <span className="text-sm font-bold" style={{ color: GOLD }}>£4,950 (coach + hotel for 25)</span>
          </ResultCard>
        </div>
      )

    case 'compliance-check':
      return (
        <div className="space-y-4">
          <ResultCard title={`${_vals.checkType || 'FFP/PSR'} Compliance`}>
            <ComplianceRow item="Revenue Reporting" status="Complete" notes="Q3 figures submitted on time" />
            <ComplianceRow item="Wage Ratio Declaration" status="Pending" notes="62% — above 60% target, needs attention" />
            <ComplianceRow item="Transfer Fee Documentation" status="Complete" notes="All fees properly documented" />
            <ComplianceRow item="Academy Investment Credit" status="Complete" notes="£180k academy spend qualifies for credit" />
            <ComplianceRow item="Annual Accounts Filing" status="Overdue" notes="Due 15 Mar — submit immediately" />
          </ResultCard>
        </div>
      )

    case 'sponsor-report':
      return (
        <div className="space-y-4">
          <ResultCard title={`Sponsor Report — ${_vals.sponsorName || 'Oakridge Motors'}`}>
            <div className="space-y-2">
              {[
                { l: 'Brand Exposure', v: '2.4M impressions', c: '#3B82F6' },
                { l: 'Deliverables', v: '8/10 completed', c: '#22C55E' },
                { l: 'Social Mentions', v: '1,200', c: '#8B5CF6' },
                { l: 'Hospitality Events', v: '3 delivered', c: '#F59E0B' },
                { l: 'Estimated ROI', v: '£180k', c: '#22C55E' },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs font-bold" style={{ color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </ResultCard>
        </div>
      )

    case 'social-post':
      return (
        <div className="space-y-4">
          <ResultCard title="Generated Post">
            <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#F9FAFB' }}>
                ⚽ FULL TIME: Oakridge FC 2-1 Riverside United{'\n\n'}
                A battling performance from the lads! Tommy Richards and Rafa Correia with the goals as we move up to 3rd in the table. 💪{'\n\n'}
                👏 Man of the Match: Rafa Correia{'\n\n'}
                Next up: Northgate City away on Tuesday. Let&apos;s keep this momentum going! 🔴
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Suggested Image</span><span className="text-xs" style={{ color: '#F9FAFB' }}>Correia celebration photo</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Optimal Time</span><span className="text-xs font-bold" style={{ color: GOLD }}>18:30 — peak engagement</span></div>
            </div>
          </ResultCard>
          <ResultCard title="Hashtags">
            <p className="text-xs" style={{ color: '#3B82F6' }}>#OakridgeFC #COYR #MatchDay #EFL #WeAreOakridge</p>
          </ResultCard>
        </div>
      )

    case 'press-conference':
      return (
        <div className="space-y-4">
          <ResultCard title="Likely Questions">
            {[
              { q: 'How do you assess the performance today?', a: 'Solid. The lads executed the game plan well...' },
              { q: 'Any update on the Diallo transfer?', a: 'I won\'t comment on ongoing negotiations...' },
              { q: 'Is Thompson\'s suspension a big loss?', a: 'We have quality in that position. Nakamura is ready...' },
              { q: 'When do you expect Martinez back?', a: 'He\'s progressing well. Mid-April is the target...' },
              { q: 'Josh Collins scored a hat-trick for U21s — first team soon?', a: 'He\'s an exciting talent. We\'re monitoring his development closely...' },
              { q: 'Are you happy with the squad depth?', a: 'We\'re looking to add in the window but I trust this group...' },
              { q: 'What\'s your assessment of Riverside as opposition?', a: 'Strong team, well organised. We need to be at our best...' },
              { q: 'Any other injury concerns?', a: 'Silva is on modified training. Everyone else is fit and available...' },
            ].map((item, i) => (
              <div key={i} className="py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{item.q}</p>
                <p className="text-xs italic" style={{ color: '#9CA3AF' }}>{item.a}</p>
              </div>
            ))}
          </ResultCard>
          <ResultCard title="Topics to Avoid">
            <BulletList items={['Board disagreements over transfer budget', 'Thompson disciplinary details']} color="#EF4444" />
          </ResultCard>
          <ResultCard title="Key Messages to Land">
            <BulletList items={['Team is in good form and confident', 'Academy producing quality players', 'Transfer business is ongoing but won\'t be rushed']} color="#22C55E" />
          </ResultCard>
        </div>
      )

    case 'club-statement':
      return (
        <div className="space-y-4">
          <ResultCard title="Draft Statement">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#111318', border: '1px solid #374151' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#F9FAFB' }}>OAKRIDGE FC — OFFICIAL STATEMENT</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#F9FAFB' }}>
                Oakridge Football Club can confirm that [key facts as entered].
              </p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#9CA3AF' }}>
                The club would like to thank all parties involved and looks forward to [appropriate closing based on statement type].
              </p>
              <p className="text-xs italic" style={{ color: '#6B7280' }}>
                [Manager Name] said: &quot;[Quote placeholder — to be completed by manager]&quot;
              </p>
            </div>
          </ResultCard>
        </div>
      )

    case 'interview-request':
      return (
        <div className="space-y-4">
          <ResultCard title="Request Summary">
            <div className="space-y-2">
              {[
                { l: 'Outlet', v: _vals.outlet || 'BBC' },
                { l: 'Person', v: _vals.person || 'Manager' },
                { l: 'Topic', v: _vals.topic || 'Season form' },
                { l: 'Duration', v: _vals.duration || '15 min' },
                { l: 'Format', v: _vals.format || 'In Person' },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{r.l}</span>
                  <span className="text-xs" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Assessment">
            <div className="flex justify-between mb-2">
              <span className="text-xs" style={{ color: '#6B7280' }}>Recommendation</span>
              <StatusBadge status="Approve" color="#22C55E" />
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>BBC is a trusted outlet. Topic is low-sensitivity. Recommend approval with standard media guidelines.</p>
          </ResultCard>
        </div>
      )

    default:
      return (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Results generated successfully.</p>
        </div>
      )
  }
}

// ─── Toggle Component ───────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? PRIMARY : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

// ─── Main Modal Component ───────────────────────────────────────────────────

export default function FootballActionModal({ actionId, onClose, onToast }: { actionId: string; onClose: () => void; onToast: (msg: string) => void }) {
  const config = ACTIONS[actionId]
  const [step, setStep] = useState(0)
  const [vals, setVals] = useState<Record<string, string>>({})
  const [multiVals, setMultiVals] = useState<Record<string, string[]>>({})
  const [toggleVals, setToggleVals] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    config?.fields.forEach(f => { if (f.type === 'toggle') init[f.key] = f.defaultVal ?? false })
    return init
  })
  const [progress, setProgress] = useState(0)

  // Auto-advance from step 1 (loading) to step 2 (results)
  useEffect(() => {
    if (step !== 1) return
    setProgress(0)
    const steps = [
      { delay: 800, progress: 25 },
      { delay: 1600, progress: 50 },
      { delay: 2400, progress: 75 },
      { delay: 3200, progress: 100 },
    ]
    const timers = steps.map(s => setTimeout(() => setProgress(s.progress), s.delay))
    const done = setTimeout(() => setStep(2), 3500)
    return () => { timers.forEach(clearTimeout); clearTimeout(done) }
  }, [step])

  if (!config) return null

  function handleAction(label: string) {
    onToast(`${label} — ${config.title} completed successfully`)
    onClose()
  }

  function updateVal(key: string, value: string) {
    setVals(v => ({ ...v, [key]: value }))
  }

  function toggleMulti(key: string, option: string) {
    setMultiVals(v => {
      const curr = v[key] || []
      return { ...v, [key]: curr.includes(option) ? curr.filter(o => o !== option) : [...curr, option] }
    })
  }

  // ── Render Field ──

  function renderField(field: FieldDef) {
    switch (field.type) {
      case 'select':
        return (
          <div key={field.key}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
            <select value={vals[field.key] || ''} onChange={e => updateVal(field.key, e.target.value)} style={S}>
              <option value="">Select...</option>
              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )
      case 'input':
        return (
          <div key={field.key}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
            <input value={vals[field.key] || ''} onChange={e => updateVal(field.key, e.target.value)} style={S} placeholder={field.placeholder} />
          </div>
        )
      case 'textarea':
        return (
          <div key={field.key} className="col-span-2">
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
            <textarea value={vals[field.key] || ''} onChange={e => updateVal(field.key, e.target.value)} style={S} rows={3} className="resize-none" placeholder={field.placeholder} />
          </div>
        )
      case 'date':
        return (
          <div key={field.key}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
            <input type="date" value={vals[field.key] || ''} onChange={e => updateVal(field.key, e.target.value)} style={S} />
          </div>
        )
      case 'number':
        return (
          <div key={field.key}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
            <div className="flex items-center gap-2">
              <button onClick={() => updateVal(field.key, String(Math.max(0, Number(vals[field.key] || field.defaultVal || 0) - 1)))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: 'none' }}>−</button>
              <span className="text-sm font-bold flex-1 text-center" style={{ color: '#F9FAFB' }}>{vals[field.key] || field.defaultVal || 0}</span>
              <button onClick={() => updateVal(field.key, String(Number(vals[field.key] || field.defaultVal || 0) + 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: 'none' }}>+</button>
            </div>
          </div>
        )
      case 'toggle':
        return (
          <div key={field.key} className="col-span-2 flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>{field.label}</span>
            <Toggle on={toggleVals[field.key] ?? field.defaultVal ?? false} onToggle={() => setToggleVals(v => ({ ...v, [field.key]: !(v[field.key] ?? field.defaultVal ?? false) }))} />
          </div>
        )
      case 'multi-select':
        return (
          <div key={field.key} className="col-span-2">
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{field.label}</label>
            <div className="flex flex-wrap gap-2">
              {field.options.map(o => {
                const selected = (multiVals[field.key] || []).includes(o)
                return (
                  <button key={o} onClick={() => toggleMulti(field.key, o)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: selected ? `${PRIMARY}1f` : '#0A0B10', color: selected ? PRIMARY : '#9CA3AF', border: selected ? `1px solid ${PRIMARY}33` : '1px solid #1F2937' }}>
                    {selected && <Check size={10} className="inline mr-1" />}{o}
                  </button>
                )
              })}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl flex flex-col" style={{ maxWidth: 680, maxHeight: '90vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.emoji}</span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{config.title}</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>{config.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {config.steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: i <= step ? PRIMARY : '#1F2937', color: i <= step ? '#F9FAFB' : '#6B7280' }}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: i <= step ? '#F9FAFB' : '#6B7280' }}>{s}</span>
              </div>
              {i < config.steps.length - 1 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: i < step ? PRIMARY : '#1F2937' }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 0 — Configure */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              {config.fields.map(f => renderField(f))}
            </div>
          )}

          {/* Step 1 — Loading */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={40} className="animate-spin mb-4" style={{ color: PRIMARY }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{config.loadingMessage}</h3>
              <div className="w-full max-w-xs space-y-2 mt-4">
                {config.loadingSteps.map((item, i) => {
                  const done = progress >= (i + 1) * 25
                  return (
                    <div key={item} className="flex items-center gap-2 text-left">
                      {done ? <Check size={14} style={{ color: PRIMARY }} /> : <div className="w-3.5 h-3.5 rounded-full border-2 animate-pulse" style={{ borderColor: '#374151' }} />}
                      <span className="text-xs" style={{ color: done ? PRIMARY : '#6B7280' }}>{item}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Results */}
          {step === 2 && renderResults(config.resultRenderer, vals)}

          {/* Step 3 — Actions */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Choose an action</p>
              <div className="grid grid-cols-2 gap-3">
                {config.actions.map((action, i) => (
                  <button key={i} onClick={() => handleAction(action.label)}
                    className="rounded-xl p-4 text-left transition-all hover:opacity-90"
                    style={{ backgroundColor: i === 0 ? DARK : '#0A0B10', border: i === 0 ? `1px solid ${PRIMARY}` : '1px solid #1F2937' }}>
                    <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {step > 0 && step !== 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#9CA3AF' }}>
              <ArrowLeft size={12} /> Back
            </button>
          ) : <div />}
          {step === 0 && (
            <button onClick={() => setStep(1)} className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: PRIMARY, color: '#F9FAFB' }}>
              {config.steps[1]} <ArrowRight size={14} />
            </button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(3)} className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: PRIMARY, color: '#F9FAFB' }}>
              Take Action <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
