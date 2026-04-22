// Demo data for the golf mobile portal (/golf/demo + /golf/golf-demo).
// Persona: James Halton, DP World Tour Halden Motors International R1.
import type { SportMobileConfig } from '../types'

export const golfMobileConfig: SportMobileConfig = {
  sport: 'golf',
  sportEmoji: '⛳',
  personaName: 'James Halton',
  personaInitials: 'JH',
  personaPhotoUrl: '/james_halton.jpg',
  teamLogoUrl: '/lumio_golf_club_crest.svg',
  headerSubtitle: "GOLF · HALDEN MOTORS INT'L",
  dateLabelSuffix: 'R1',
  quote: { text: 'The most important shot in golf is the next one.', author: 'BEN HOGAN' },
  heroStats: [
    { label: 'OWGR',  value: '#87',   tint: 'violet' },
    { label: 'Dubai', value: '#43',   tint: 'violet' },
    { label: 'YTD',   value: '£367k', tint: 'white'  },
    { label: 'Best',  value: '#61',   tint: 'yellow' },
  ],
  weather: { icon: '🌤️', temp: '14°', city: 'Munich' },
  clocks: [
    { city: 'LON', tz: 'Europe/London' },
    { city: 'MUC', tz: 'Europe/Berlin' },
    { city: 'NYC', tz: 'America/New_York' },
  ],
  quickActions: [
    { id: 'sendmessage',  icon: '📨', label: 'Send Message' },
    { id: 'roundprep',    icon: '⛳', label: 'Round Prep AI',    hot: true },
    { id: 'scorecard',    icon: '📝', label: 'Log Scorecard' },
    { id: 'yardage',      icon: '📐', label: 'Yardage Book' },
    { id: 'bookpractice', icon: '🏌️', label: 'Book Practice' },
    { id: 'press',        icon: '📣', label: 'Press Statement',  hot: true },
    { id: 'caddie',       icon: '🎒', label: 'Caddie Brief' },
    { id: 'equipment',    icon: '🔧', label: 'Equipment Check' },
  ],
  allActionsCount: 8,
  match: {
    timeLabel: 'Today 09:42',
    timeLabelTint: 'green',
    eventLabel: 'DP World Tour',
    roundLabel: 'R1',
    metaLabel: 'Course fit 8.1/10',
    player:   { name: 'James',   initials: 'JH', rank: 'OWGR #87',  photoUrl: '/james_halton.jpg' },
    opponent: { name: 'J. Kjaer', initials: 'JK', rank: 'OWGR #52', photoUrl: '/j-kjaer.jpg' },
    primaryButtonLabel: 'Round Prep AI',
    secondaryButtonLabel: 'Course Fit',
    primaryButtonTarget: 'matchprep',
    secondaryButtonTarget: 'coursefit',
  },
  schedule: [
    { id: 'g1', time: '07:00', label: 'Range session — 90 min' },
    { id: 'g2', time: '08:30', label: 'Caddie brief with Mick' },
    { id: 'g3', time: '09:42', label: 'R1 tee time — vs J. Kjaer group', highlight: true },
    { id: 'g4', time: '13:00', label: 'Physio — lower back treatment' },
    { id: 'g5', time: '15:00', label: 'Lumio GPS session review' },
    { id: 'g6', time: '17:00', label: 'Scottish Open entry deadline' },
    { id: 'g7', time: '18:00', label: 'Vanta Sports sponsor post — caption due' },
  ],
  venue: {
    eyebrow: "TODAY'S VENUE",
    name: 'Golfclub München Eichenried',
    conditionsLine: '22°C · 8mph W · Course open 06:30',
    rows: [
      { label: 'Tee time', value: '09:42 (R1)' },
      { label: 'Yardage',  value: '7,545 yd · Par 72' },
      { label: 'Prize W',  value: '£1.32M', tint: 'green' },
      { label: 'Prize L',  value: 'Cut line' },
      { label: 'TV',       value: 'Northbridge Sport' },
    ],
  },
  aiSummary: {
    items: [
      { icon: '⛳', text: 'R1 today at Golfclub München Eichenried — 09:42 tee with Kjaer group. Course fit 8.1/10. Pin positions favour draw off the tee on 1, 7 and 14.' },
      { icon: '📋', text: 'Mick updated hole 7 strategy — new wind data and pin position means 9-iron from the repositioned tee.' },
      { icon: '🤝', text: 'Vanta Sports post due 18:00 today — Carlos needs caption and round-day kit photo. Penalty clause applies if missed.' },
      { icon: '✈️', text: 'Scottish Open hotel prices rising — preferred rooms filling fast. Book today to lock in Renfield Hotel rate.' },
      { icon: '📊', text: 'OWGR #87 — 285 points defending this week. T20+ needed to hold. Race to Dubai #43.' },
    ],
    briefingText: "Good morning, James. Round one today at Eichenried, 9:42 tee time with Kjaer. Course fit 8.1 out of 10 — pin positions favour your draw off one, seven and fourteen. Caddie brief at 8:30, physio at 1pm. Vanta Sports post due by 6pm. Scottish Open hotels filling up. OWGR 87 holds at top-20 or better.",
  },
  performanceIntel: {
    timestampLabel: 'AI · 07:15',
    body: 'SG Approach up to {hl} this session — above season avg (+0.15). Wedges inside 130y averaging 14ft to hole.',
    highlight: '+0.41',
    target: 'performance',
  },
  sponsorAlert: {
    dueLabel: 'Due 18:00',
    message: 'Vanta Sports round-day post past due — Carlos needs caption + kit photo before 18:00.',
    target: 'sponsorship',
  },
  roundupChannels: [
    {
      id: 'sms', label: 'SMS', icon: '📲', count: 2, color: 'rgb(14, 165, 233)',
      demoMessages: [
        { sender: 'Mick (caddie)', timestamp: '6:55 today', body: "I'm on 9 for a final wind read. Pin sheet in the bag. 9-iron from the forward tee on 7 — repeat to make sure you've seen my note." },
        { sender: 'Travel desk',   timestamp: '6:32 today', body: 'Driver at the hotel 08:15. Direct to the caddie shack exit so you can walk straight to the range.' },
      ],
    },
    {
      id: 'whatsapp', label: 'WhatsApp', icon: '💬', count: 3, color: 'rgb(37, 211, 102)',
      demoMessages: [
        { sender: 'Team chat',       timestamp: '7:03 today', body: 'Mick: range spec up — draw bias to wedges, longer irons straight. Green speed 11.5 per stimp.' },
        { sender: 'Sarah Wright (agent)', timestamp: '6:40 today', body: 'Renewal call at 14:00 tomorrow — Vanta Sports counter ready. Can you do a 5-min pre-call post-round?' },
        { sender: 'Family 💛',       timestamp: '6:20 today', body: 'Dad: good luck today. Watching live from 09:30. Love you xxx' },
      ],
    },
    {
      id: 'email', label: 'Email', icon: '✉️', count: 5, color: 'rgb(99, 102, 241)',
      demoMessages: [
        { sender: 'DP World Tour',           timestamp: '6:50 today', body: 'Round 1 pairings and tee times confirmed. Media pen duties rotated — you are not on today.' },
        { sender: 'OWGR',                    timestamp: '6:25 today', body: 'Weekly ranking update — you held #87 (Brighton result posted). Points defending this week: 285.' },
        { sender: 'Vanta Sports',            timestamp: '6:04 today', body: 'Round-day post content template attached. Caption due by 18:00. Kit photo from the practice green works.' },
        { sender: 'Scottish Open accommodation', timestamp: 'Yesterday', body: 'Preferred hotels 70% booked — lock your rooms before Thursday.' },
        { sender: 'Nutrition team',          timestamp: 'Yesterday',    body: 'Round-day meal plan v2 — breakfast 06:30, mid-round snack every 6 holes.' },
      ],
    },
    {
      id: 'agent', label: 'Agent', icon: '✉', count: 2, color: 'rgb(168, 85, 247)',
      demoMessages: [
        { sender: 'Sarah Wright (Agent)', timestamp: '9:32 today', body: 'Vanta Sports renewal terms came back — 4-year deal at £95k/yr + bonus structure. Ready to talk after the round.' },
        { sender: 'Sarah Wright (Agent)', timestamp: 'Yesterday',   body: 'Scottish Open pro-am slots — two offers on the table. Need a decision by Friday.' },
      ],
    },
    {
      id: 'tournament', label: 'Tournament', icon: '⚡', count: 3, color: 'rgb(245, 158, 11)', urgent: 1,
      demoMessages: [
        { sender: 'DP World Tour Desk',  timestamp: '8:47 today', body: 'URGENT: Tee time confirmed 09:42 sharp. Please check in at caddie shack by 09:10.' },
        { sender: 'Halden Motors Desk',  timestamp: 'Yesterday',   body: 'Pro-am hospitality partner confirmed for tomorrow. Meet your group at 07:30.' },
        { sender: 'Scottish Open Entry', timestamp: '2 days ago', body: 'Entry confirmed — seed band 30–45. Bring photo ID for accreditation.' },
      ],
    },
    {
      id: 'sponsor', label: 'Media & Sponsor', icon: '◉', count: 4, color: 'rgb(96, 165, 250)',
      demoMessages: [
        { sender: 'Carlos (Vanta Sports)',  timestamp: '11:08 today', body: 'Need round-day kit photo by 18:00 — penalty clause if we miss the window.' },
        { sender: 'Northbridge Sport Press', timestamp: '7:44 today', body: 'Post-round interview request — 5 minutes max. One question on the Kjaer matchup, one on Scottish Open prep.' },
        { sender: 'Titleist Comms',          timestamp: 'Yesterday',   body: 'Two social posts outstanding from last week.' },
        { sender: 'Global Golf Magazine',    timestamp: '2 days ago',   body: 'Cover story slot for August — Race to Dubai feature.' },
      ],
    },
    {
      id: 'physio', label: 'Physio & Medical', icon: '✚', count: 1, color: 'rgb(239, 68, 68)', urgent: 1,
      demoMessages: [
        { sender: 'Dr Patel (physio)', timestamp: '10:21 today', body: 'Lower back load spiked 18% yesterday — 20 min mobility + heat before your round.' },
      ],
    },
    {
      id: 'coach', label: 'Coach', icon: '◆', count: 2, color: 'rgb(16, 185, 129)',
      demoMessages: [
        { sender: 'Dave (coach)', timestamp: '6:50 today',  body: "Kjaer's ball flight has dropped — he's missing right on back-nine pressure. Keep to your draw, let him chase." },
        { sender: 'Dave (coach)', timestamp: 'Yesterday',   body: 'Practice plan for Scottish Open — bunker work Monday, wedge yardages Tuesday.' },
      ],
    },
    {
      id: 'prize', label: 'Prize Money', icon: '$', count: 1, color: 'rgb(34, 211, 238)',
      demoMessages: [
        { sender: 'DP World Tour Finance', timestamp: 'Yesterday', body: 'Brighton prize money cleared — €18,400 net wired.' },
      ],
    },
    {
      id: 'travel', label: 'Travel & Logistics', icon: '✈', count: 2, color: 'rgb(236, 72, 153)',
      demoMessages: [
        { sender: 'Travel Desk', timestamp: '8:12 today',  body: 'Scottish Open flights locked — LHR → EDI Sunday evening.' },
        { sender: 'Travel Desk', timestamp: 'Yesterday',    body: 'Munich hotel extended to Sunday 13:00 at no charge.' },
      ],
    },
    {
      id: 'wildcard', label: 'Wildcard', icon: '★', count: 2, color: 'rgb(217, 70, 239)',
      demoMessages: [
        { sender: 'DP World Entry', timestamp: 'Yesterday',  body: 'Czech Masters wildcard — sponsor exemption available. Respond by Friday.' },
        { sender: 'DP World Entry', timestamp: '3 days ago', body: 'Italian Open application submitted — decision in 2 weeks.' },
      ],
    },
  ],
  training: {
    headerSubtitle: 'Last practice: Yesterday 17:00 · 82% intensity',
    recovery:    { score: '85/100', hrv: '72ms', restingHr: '49bpm', sleep: '7.4h' },
    performance: {
      subtitle: 'Last 5 events · DP World Tour',
      stats: [
        { label: 'SG Total', value: '+0.62' },
        { label: 'SG App',   value: '+0.41' },
        { label: 'Scoring',  value: '70.2' },
      ],
    },
    practice: {
      subtitle: '07:00 · Range · On-course walk at 08:30',
      rows: [
        { label: 'Caddie', value: 'Mick Sullivan' },
        { label: 'Focus',  value: 'Wedge yardages, 80–130y' },
        { label: 'Length', value: '90 min' },
      ],
    },
    gps: {
      subtitle: 'Yesterday · Swing session',
      rows: [
        { label: 'Shots tracked', value: '112' },
        { label: 'Avg speed',     value: '117 mph' },
        { label: 'Smash factor',  value: '1.48' },
      ],
    },
    video: {
      subtitle: 'Last clip: Yesterday · Swing breakdown',
      rows: [
        { label: 'Library',   value: '34 clips' },
        { label: 'Pending',   value: '8 to review' },
        { label: 'AI tagged', value: 'All clips' },
      ],
    },
    nutrition: {
      subtitle: 'Round-day plan · today',
      rows: [
        { label: 'Breakfast', value: '06:30 · Oats + berries' },
        { label: 'On-course', value: 'Bars every 6 holes' },
        { label: 'Hydration', value: '2.5L target' },
      ],
    },
    mental: {
      subtitle: 'Next session: tomorrow 20:00',
      rows: [
        { label: 'Coach',  value: 'Dr. Aisha Patel' },
        { label: 'Format', value: 'Remote · 60 min' },
        { label: 'Focus',  value: 'Pre-shot routine' },
      ],
    },
    equipment: {
      subtitle: 'Active setup',
      rows: [
        { label: 'Driver', value: 'TaylorMade Stealth 2 (9°)' },
        { label: 'Putter', value: 'Scotty Cameron Newport 2' },
        { label: 'Ball',   value: 'Titleist Pro V1x' },
      ],
    },
  },
}
