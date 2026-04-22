// Demo data for the tennis mobile portal (/tennis/demo + /tennis/tennis-demo).
// Extracted from the original inline MobileTennisHome so the same data feeds
// the shared MobileSportHome component. Content mirrors the desktop portal's
// demo persona (Alex Rivera, Monte-Carlo Masters R16) — see darts/golf/boxing
// configs for the other three sports.
import type { SportMobileConfig } from '../types'

export const tennisMobileConfig: SportMobileConfig = {
  sport: 'tennis',
  sportEmoji: '🎾',
  personaName: 'Alex Rivera',
  personaInitials: 'AR',
  personaPhotoUrl: '/alex_rivera.jpg',
  teamLogoUrl: '/lumio_tennis_club_crest.svg',
  headerSubtitle: 'TENNIS · MONTE-CARLO',
  dateLabelSuffix: 'R16',
  quote: { text: 'The harder you work, the harder it is to surrender.', author: 'VINCE LOMBARDI' },
  heroStats: [
    { label: 'ATP',    value: '#67',    tint: 'violet' },
    { label: 'Race',   value: '#54',    tint: 'violet' },
    { label: 'Points', value: '1,847',  tint: 'white'  },
    { label: 'Best',   value: '#44',    tint: 'yellow' },
  ],
  weather: { icon: '☀️', temp: '13°', city: 'Monaco' },
  clocks: [
    { city: 'LON', tz: 'Europe/London' },
    { city: 'DXB', tz: 'Asia/Dubai'    },
    { city: 'TOK', tz: 'Asia/Tokyo'    },
  ],
  quickActions: [
    { id: 'sendmessage',   icon: '📨',  label: 'Send Message' },
    { id: 'socialmedia',   icon: '📱',  label: 'Social Media',        hot: true },
    { id: 'flights',       icon: '✈️',  label: 'Smart Flights',       hot: true },
    { id: 'hotel',         icon: '🏨',  label: 'Find Hotel' },
    { id: 'matchprep',     icon: '🎾',  label: 'Match Prep AI',       hot: true },
    { id: 'practicecourt', icon: '🏟️', label: 'Book Practice Court' },
    { id: 'warmup',        icon: '⏱️',  label: 'Warm-up Timer' },
    { id: 'sponsor',       icon: '📱',  label: 'Sponsor Post' },
    { id: 'press',         icon: '📣',  label: 'Press Statement' },
    { id: 'ranking',       icon: '📊',  label: 'Ranking Simulator' },
    { id: 'wildcard',      icon: '🎯',  label: 'Wildcard Request' },
    { id: 'agentbrief',    icon: '💼',  label: 'Agent Brief',         hot: true },
    { id: 'entries',       icon: '🏆',  label: 'Entry Manager' },
    { id: 'injury',        icon: '💊',  label: 'Log Injury' },
    { id: 'expense',       icon: '🧾',  label: 'Log Expense' },
    { id: 'strings',       icon: '🎵',  label: 'String Order' },
    { id: 'visa',          icon: '🌍',  label: 'Visa Check' },
    { id: 'notes',         icon: '📝',  label: 'Match Notes' },
  ],
  allActionsCount: 18,
  match: {
    timeLabel: 'Today 13:00',
    timeLabelTint: 'green',
    eventLabel: 'ATP Monte-Carlo',
    roundLabel: 'R16',
    metaLabel: 'Clay · H2H 3–1',
    player:   { name: 'Alex',      initials: 'AR', rank: 'ATP #67', photoUrl: '/alex_rivera.jpg' },
    opponent: { name: 'C. Vega',   initials: 'CV', rank: 'ATP #34', photoUrl: '/opponents/c-vega.jpg' },
    primaryButtonLabel: 'Match Prep AI',
    secondaryButtonLabel: 'Tactics',
    primaryButtonTarget: 'matchprep',
    secondaryButtonTarget: 'scout',
  },
  schedule: [
    { id: 's1', time: '07:30', label: 'AI Morning Briefing' },
    { id: 's2', time: '08:30', label: 'Physio — right shoulder' },
    { id: 's3', time: '10:00', label: 'Practice — serve patterns' },
    { id: 's4', time: '11:45', label: 'Stringing with Carlos' },
    { id: 's5', time: '13:00', label: 'Match vs C. Vega', highlight: true },
    { id: 's6', time: '15:30', label: 'Post-match physio' },
    { id: 's7', time: '17:00', label: 'Coach debrief' },
  ],
  venue: {
    eyebrow: "TODAY'S VENUE",
    name: 'Monte-Carlo Country Club',
    conditionsLine: '18°C · Sunny · Court 4 open 10:00',
    rows: [
      { label: 'Match',   value: '13:00' },
      { label: 'Court',   value: 'Court 4 · Clay' },
      { label: 'Prize W', value: '£342,000', tint: 'green' },
      { label: 'Prize L', value: '£57,000' },
      { label: 'TV',      value: 'Apex Tennis Network' },
    ],
  },
  aiSummary: {
    items: [
      { icon: '🎾', text: 'Match today vs C. Vega — 13:00 Court 4. Clay. H2H 3–1 in your favour. Kick serve to his backhand on deuce court.' },
      { icon: '📬', text: '2 urgent messages: Tournament Desk moved your court time 30 min (confirm receipt) + Physio flagged shoulder inflammation — see Dr Lee at 12:30.' },
      { icon: '📅', text: 'Today: Practice 10:00 (serve patterns) → Stringing 11:45 → Match 13:00 → Physio 15:30 → Coach debrief 17:00.' },
      { icon: '🤝', text: 'Apex Performance post due today — Carlos needs kit photo before 12:00. Reply to agent about Meridian Watches renewal this week.' },
      { icon: '✈️', text: 'Madrid hotel confirmed (NH Eurobuilding, 26 Apr). Roland-Garros apartment deposit due 1 May — travel desk waiting.' },
    ],
    briefingText: 'Good morning, Alex. Match today against C. Vega at one PM on Court 4, Monte-Carlo. Clay court, head-to-head three to one in your favour. Kick serve to his backhand on the deuce court. Two urgent messages from the tournament desk and physio. Sponsor content due before noon. Madrid and Roland-Garros travel confirmed.',
  },
  performanceIntel: {
    timestampLabel: 'AI · 12:58',
    body: 'Serve % up to {hl} in last 5 matches — above season avg (65%). Clay kick serve landing 12cm deeper.',
    highlight: '84%',
    target: 'performance',
  },
  sponsorAlert: {
    dueLabel: 'Due 12:00',
    message: 'Meridian Watches content past due — Carlos needs kit photo before 12:00.',
    target: 'sponsorship',
  },
  roundupChannels: [
    {
      id: 'sms', label: 'SMS', icon: '📲', count: 3, color: 'rgb(14, 165, 233)',
      demoMessages: [
        { sender: 'Carlos',       timestamp: '8:55 today', body: 'Courts 3 + 4 open from 11:00 if you want to warm up away from the show courts. Bring the new frames — I want to feel the 23.5kg tension off the ground before we talk match plan.' },
        { sender: 'Travel desk',  timestamp: '8:31 today', body: 'Driver confirmed at hotel 10:45. Plate MC-7142. Back exit to avoid press. Traffic clear on Boulevard Princesse Charlotte — 9 minutes to the club.' },
        { sender: 'Dr Sarah Lee', timestamp: '8:06 today', body: "Don't forget ice 12:45 before strapping. Your window is tight — I want 20 minutes on the shoulder, not 10. Come straight to treatment room B after warm-up." },
      ],
    },
    {
      id: 'whatsapp', label: 'WhatsApp', icon: '💬', count: 5, color: 'rgb(37, 211, 102)',
      demoMessages: [
        { sender: 'Team chat',    timestamp: '9:03 today', body: 'Carlos: gameplan doc updated on the shared drive — read before warm-up please.' },
        { sender: 'James Wright', timestamp: '8:40 today', body: "Hamburg agent called back. He'll take the wildcard fee offer. Confirm before 5pm." },
        { sender: 'Family 💛',    timestamp: '7:58 today', body: 'Mum: landing Nice 14:10 Sunday. Proud of you. Good luck today xxx' },
        { sender: 'Tom Ellis',    timestamp: '7:41 today', body: 'Two frames strung at 23.5kg, one at 24. Bag at the locker by 11:30.' },
        { sender: 'Ben Parker',   timestamp: '7:20 today', body: "Good luck vs Vega — he's been shanking the BH DTL all clay. Catch up in Halle?" },
      ],
    },
    {
      id: 'email', label: 'Email', icon: '✉️', count: 8, color: 'rgb(99, 102, 241)',
      demoMessages: [
        { sender: 'Monte-Carlo Press Office', timestamp: '8:50 today', body: 'Post-match press schedule attached. Slot 3 if you win, slot 1 if you lose. 15 min cap.' },
        { sender: 'ATP Player Services',      timestamp: '8:25 today', body: 'April ranking bulletin — your projected points with/without QF result enclosed.' },
        { sender: 'Meridian Watches',         timestamp: '8:04 today', body: 'Renewal term sheet + comparator decks attached. Aiming for a yes by EOW.' },
        { sender: 'Paul Reid (accountant)',   timestamp: '7:48 today', body: 'Q1 VAT return filed. Monaco prize allocation note attached — review when you can.' },
        { sender: 'Fairmont Monte Carlo',     timestamp: '7:30 today', body: 'Checkout extended to Sunday 13:00 at no charge. Late-stay vouchers enclosed.' },
        { sender: 'Nutrition team',           timestamp: 'Yesterday',  body: 'Pre-match meal plan v3 — 3 hours before first serve.' },
        { sender: 'Roland-Garros Entry',      timestamp: 'Yesterday',  body: 'Main draw entry confirmed. Direct acceptance, seed band 33–48.' },
        { sender: 'Fan-club newsletter',      timestamp: '2 days ago', body: 'May mailout: 2 signed posters promised. Send a high-res match photo for the cover.' },
      ],
    },
    {
      id: 'agent', label: 'Agent', icon: '✉', count: 2, color: 'rgb(168, 85, 247)',
      demoMessages: [
        { sender: 'James Wright (Agent)', timestamp: '9:32 today',  body: 'Meridian Watches renewal terms came back — 3-year deal at £120k/yr + bonuses. Need your call by Friday.' },
        { sender: 'James Wright (Agent)', timestamp: 'Yesterday',    body: 'Hamburg 500 wildcard offer is on the table — director needs an answer in 24 hours.' },
      ],
    },
    {
      id: 'tournament', label: 'Tournament', icon: '⚡', count: 3, color: 'rgb(245, 158, 11)', urgent: 1,
      demoMessages: [
        { sender: 'ATP Tournament Desk', timestamp: '8:47 today', body: 'Court 4 time moved 30 minutes earlier — your QF is now 13:00 sharp.' },
        { sender: 'Roland-Garros Entry', timestamp: 'Yesterday',  body: 'Direct entry confirmed for the main draw.' },
        { sender: 'Madrid Open Logistics', timestamp: '2 days ago', body: 'Practice court allocation for Madrid published.' },
      ],
    },
    {
      id: 'sponsor', label: 'Media & Sponsor', icon: '◉', count: 4, color: 'rgb(96, 165, 250)',
      demoMessages: [
        { sender: 'Carlos (Apex Performance)', timestamp: '11:08 today', body: 'Need that match-day kit photo before 12:00 today — content goes live at 13:30.' },
        { sender: 'Meridian Sport Press',       timestamp: '7:44 today',  body: 'Quick post-match interview request after today\'s match — 5 minutes max.' },
        { sender: 'Vanta Sports Comms',         timestamp: 'Yesterday',    body: 'Two Instagram posts outstanding from March.' },
        { sender: 'Tour Pulse Magazine',        timestamp: '2 days ago',   body: 'Cover story slot for July issue is yours if you want it.' },
      ],
    },
    {
      id: 'physio', label: 'Physio & Medical', icon: '✚', count: 1, color: 'rgb(239, 68, 68)', urgent: 1,
      demoMessages: [
        { sender: 'Dr Lee (Physio)', timestamp: '10:21 today', body: 'Right shoulder shows minor inflammation flag — see you at 12:30 before warm-up.' },
      ],
    },
    {
      id: 'coach', label: 'Coach', icon: '◆', count: 2, color: 'rgb(16, 185, 129)',
      demoMessages: [
        { sender: 'Marco (Head Coach)', timestamp: '6:50 today',  body: "Vega's last 5 clay matches uploaded. He's leaking second-serve returns to the deuce side." },
        { sender: 'Marco (Head Coach)', timestamp: 'Yesterday',   body: 'Practice plan for Madrid attached — 60 min serve patterns, 45 min cross-court rallies.' },
      ],
    },
    {
      id: 'prize', label: 'Prize Money', icon: '$', count: 1, color: 'rgb(34, 211, 238)',
      demoMessages: [
        { sender: 'ATP Finance', timestamp: 'Yesterday', body: 'Brighton ATP 250 prize money cleared — €38,400 net wired to your London account.' },
      ],
    },
    {
      id: 'travel', label: 'Travel & Logistics', icon: '✈', count: 3, color: 'rgb(236, 72, 153)',
      demoMessages: [
        { sender: 'Travel Desk', timestamp: '8:12 today',  body: 'Roland-Garros apartment owner needs deposit by 1 May.' },
        { sender: 'Travel Desk', timestamp: 'Yesterday',    body: 'Madrid hotel confirmed — NH Eurobuilding, 26 Apr–4 May.' },
        { sender: 'Travel Desk', timestamp: '3 days ago',   body: 'Visa for the US Open swing — paperwork submitted to embassy.' },
      ],
    },
    {
      id: 'wildcard', label: 'Wildcard', icon: '★', count: 2, color: 'rgb(217, 70, 239)',
      demoMessages: [
        { sender: 'ATP Entry', timestamp: 'Yesterday',  body: 'Hamburg 500 wildcard offer — tournament director needs your answer today.' },
        { sender: 'ATP Entry', timestamp: '3 days ago', body: 'Winston-Salem application submitted on your behalf.' },
      ],
    },
  ],
  training: {
    headerSubtitle: 'Last practice: Yesterday 16:00 · 78% intensity',
    recovery:    { score: '82/100', hrv: '68ms', restingHr: '48bpm', sleep: '7.2h' },
    performance: {
      subtitle: 'Last 5 matches · ATP Tour',
      stats: [
        { label: 'Form',   value: '3W–2L' },
        { label: 'Serve%', value: '68% ▲4' },
        { label: 'Last',   value: 'W 6–3 6–4' },
      ],
    },
    practice: {
      subtitle: '10:00 · Court 3 · Serve patterns',
      rows: [
        { label: 'Coach',  value: 'Marco Bianchi' },
        { label: 'Focus',  value: 'Kick serve to backhand' },
        { label: 'Length', value: '90 min' },
      ],
    },
    gps: {
      subtitle: 'Yesterday · Court 4',
      rows: [
        { label: 'Distance', value: '4.2km' },
        { label: 'Sprints',  value: '34' },
        { label: 'Avg HR',   value: '142 bpm' },
      ],
    },
    video: {
      subtitle: 'Last clip: Yesterday · Forehand analysis',
      rows: [
        { label: 'Library',   value: '47 clips' },
        { label: 'Pending',   value: '23 to review' },
        { label: 'AI tagged', value: 'All clips' },
      ],
    },
    nutrition: {
      subtitle: 'Match-day plan · today',
      rows: [
        { label: 'Pre-match',   value: 'High-carb @ 10:00' },
        { label: 'Hydration',   value: '2.1L target' },
        { label: 'Supplements', value: '3 scheduled' },
      ],
    },
    mental: {
      subtitle: 'Next session: tonight 21:00',
      rows: [
        { label: 'Coach',     value: 'Dr. Aisha Patel' },
        { label: 'Format',    value: 'Remote · 60 min' },
        { label: 'Last week', value: '2 sessions logged' },
      ],
    },
    equipment: {
      subtitle: 'Active match-day setup',
      rows: [
        { label: 'Racket',  value: 'Wilson Pro Staff RF97' },
        { label: 'Strings', value: 'Luxilon ALU Power 16L' },
        { label: 'Tension', value: '24kg' },
      ],
    },
  },
}
