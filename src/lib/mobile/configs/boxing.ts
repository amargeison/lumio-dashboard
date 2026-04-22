// Demo data for the boxing mobile portal (/boxing/demo + /boxing/boxing-demo).
// Persona: Marcus Cole. Headshot lives at /public/marcus_cole.jpg.
//
// This is the one sport where the match is explicitly "future, not today":
// fight night is 48 days away. `timeLabelTint: 'amber'` pulses amber instead
// of green on the match-card time pill.
import type { SportMobileConfig } from '../types'

export const boxingMobileConfig: SportMobileConfig = {
  sport: 'boxing',
  sportEmoji: '🥊',
  personaName: 'Marcus Cole',
  personaInitials: 'MC',
  personaPhotoUrl: '/marcus_cole.jpg',
  teamLogoUrl: '/cole_boxing_camp_crest.svg',
  headerSubtitle: 'BOXING · COLE CAMP 22/70',
  dateLabelSuffix: 'DAY 22/70',
  quote: { text: 'Everyone has a plan until they get punched in the mouth.', author: 'MIKE TYSON' },
  heroStats: [
    { label: 'WBC',  value: '#6',     tint: 'violet' },
    { label: 'WBA',  value: '#9',     tint: 'violet' },
    { label: 'Rec',  value: '22-1',   tint: 'white'  },
    { label: 'Best', value: '#5 WBO', tint: 'yellow' },
  ],
  weather: { icon: '🌧️', temp: '12°', city: 'London' },
  clocks: [
    { city: 'LON', tz: 'Europe/London' },
    { city: 'NYC', tz: 'America/New_York' },
    { city: 'LAS', tz: 'America/Los_Angeles' },
  ],
  quickActions: [
    { id: 'sendmessage', icon: '📨', label: 'Send Message' },
    { id: 'fightprep',   icon: '🥊', label: 'Fight Prep AI',  hot: true },
    { id: 'sparring',    icon: '🥋', label: 'Log Sparring' },
    { id: 'weight',      icon: '⚖️', label: 'Weight Check' },
    { id: 'cut',         icon: '💧', label: 'Cut Protocol' },
    { id: 'press',       icon: '📣', label: 'Press Statement', hot: true },
    { id: 'purse',       icon: '💰', label: 'Purse Sim' },
    { id: 'medical',     icon: '🏥', label: 'Medical Log' },
  ],
  allActionsCount: 8,
  match: {
    timeLabel: 'Fight Night 48d',
    timeLabelTint: 'amber',
    eventLabel: 'Meridian Sports PPV',
    roundLabel: 'PPV',
    metaLabel: '12 rounds · WBC mandatory',
    player:   { name: 'Marcus',    initials: 'MC', rank: 'WBC #6', photoUrl: '/marcus_cole.jpg' },
    opponent: { name: 'M. Stoyan', initials: 'MS', rank: 'WBC #3', photoUrl: '/m-stoyan.jpg' },
    primaryButtonLabel: 'Fight Prep AI',
    secondaryButtonLabel: 'Scout',
    primaryButtonTarget: 'matchprep',
    secondaryButtonTarget: 'opscout',
  },
  schedule: [
    { id: 'b1', time: '06:00', label: 'Roadwork — 8km + hill sprints' },
    { id: 'b2', time: '11:00', label: 'Sparring 8rds — Darnell Hughes', highlight: true },
    { id: 'b3', time: '15:00', label: 'Strength — upper body power' },
    { id: 'b4', time: '16:30', label: 'Film study — Stoyan last 3 fights' },
    { id: 'b5', time: '18:00', label: 'Physio — shoulder mobility + ice bath' },
  ],
  venue: {
    eyebrow: 'FIGHT NIGHT VENUE — 48 DAYS',
    name: 'Millennium Dome, London',
    conditionsLine: 'Meridian Sports PPV · Doors open 18:00 on fight night',
    rows: [
      { label: 'Walk-on',  value: '22:00 fight night' },
      { label: 'Prize W',  value: '£1.2M',    tint: 'green' },
      { label: 'Prize L',  value: '£360,000' },
      { label: 'TV',       value: 'Meridian Sports PPV' },
    ],
  },
  aiSummary: {
    items: [
      { icon: '🥊', text: 'Fight 48 days away — M. Stoyan (WBC #3) at Millennium Dome. Camp day 22/70. On track for power peak.' },
      { icon: '⚖️', text: 'Weight 96.4kg → 90.7kg target. Daily cut: 0.12kg/day. Log today before 09:00.' },
      { icon: '🏕️', text: 'Sparring 8 rds vs Darnell Hughes at 11:00 — southpaw rounds to prep for Stoyan. Jim Bevan flagged right hand rewrap — book Dr Mitchell 09:00.' },
      { icon: '🤝', text: 'Meridian Sports interview prep today — talking points needed by 14:00. Apex Performance camp video content outstanding from March.' },
      { icon: '✈️', text: 'Millennium Dome fight week hotel confirmed — Canary Wharf Marriott, 4 nights. Corner team flights booked BA LHR→LCY.' },
    ],
    briefingText: "Good morning, Marcus. Camp day 22 of 70. Fight 48 days out against Stoyan at the Millennium Dome. Weight is 96.4, target 90.7 — on track. Sparring at 11am against Darnell, southpaw rounds. Right hand rewrap flagged by Jim — see Dr Mitchell at 9. Meridian Sports interview prep due by 2pm.",
  },
  performanceIntel: {
    timestampLabel: 'AI · 07:45',
    body: 'Sparring power output up {hl} vs season avg — right-hand compression landing 12% deeper on body shots in last 3 sessions.',
    highlight: '8%',
    target: 'performance',
  },
  sponsorAlert: {
    dueLabel: 'Due 14:00',
    message: 'Meridian Sports interview prep past due — 3 talking points needed on the wire before 14:00.',
    target: 'sponsorships',
  },
  roundupChannels: [
    {
      id: 'sms', label: 'SMS', icon: '📲', count: 2, color: 'rgb(14, 165, 233)',
      demoMessages: [
        { sender: 'Jim (trainer)',    timestamp: '7:04 today', body: 'Darnell Hughes confirmed for 11:00 sparring — 8 rounds southpaw. Wrap the right hand lighter today, Dr Mitchell confirmed the move.' },
        { sender: 'Strength & Cond.', timestamp: '6:42 today', body: 'Upper body power session re-scheduled to 15:00. Load down 8% from last week — deload block ends Sunday.' },
      ],
    },
    {
      id: 'whatsapp', label: 'WhatsApp', icon: '💬', count: 3, color: 'rgb(37, 211, 102)',
      demoMessages: [
        { sender: 'Camp chat',       timestamp: '7:10 today', body: 'Jim: Stoyan film loaded to the share — look at his third-round tendencies, he fades right after minute six.' },
        { sender: 'Danny (promoter)', timestamp: '6:22 today', body: "PPV undercard announced today — you're locked in as headline. Press lines drop 10am." },
        { sender: 'Family 💛',       timestamp: '5:55 today', body: 'Mum: ticket allocation for fight night received. 12 seats ringside. Love you xx' },
      ],
    },
    {
      id: 'email', label: 'Email', icon: '✉️', count: 5, color: 'rgb(99, 102, 241)',
      demoMessages: [
        { sender: 'Meridian Sports Press', timestamp: '6:50 today', body: 'Fight week schedule draft attached. Press tour starts day minus 12 — London → Las Vegas → New York.' },
        { sender: 'WBC Mandatory Office',  timestamp: '6:25 today', body: 'Mandatory defence paperwork received. Purse bid window opens day minus 20.' },
        { sender: 'Titan Promotions',      timestamp: '6:04 today', body: 'Purse structure confirmed — £1.2M W / £360k L / £150k per PPV 50,000 bracket.' },
        { sender: 'Cleto Reyes',           timestamp: 'Yesterday',  body: 'Fight-night gloves shipped — 14oz, walnut leather, custom stitching.' },
        { sender: 'Nutrition team',        timestamp: 'Yesterday',  body: 'Cut week meal plan v2 — 48 days, carb cycle every 4 days.' },
      ],
    },
    {
      id: 'manager', label: 'Manager', icon: '✉', count: 2, color: 'rgb(168, 85, 247)',
      demoMessages: [
        { sender: 'Danny Walsh (manager)', timestamp: '9:22 today', body: 'Purse bid tomorrow — Titan Promotions want to lock at £1.2M. Competitor bid from Matchroom rumoured at £1.35M.' },
        { sender: 'Danny Walsh (manager)', timestamp: 'Yesterday',   body: "Camp content deal with Apex Performance — £40k to film behind-the-scenes. Needs your sign-off." },
      ],
    },
    {
      id: 'promoter', label: 'Promoter', icon: '⚡', count: 3, color: 'rgb(245, 158, 11)', urgent: 1,
      demoMessages: [
        { sender: 'Titan Promotions', timestamp: '8:47 today', body: 'URGENT: Press conference call time moved to 10:00 (30 min earlier). Confirm receipt.' },
        { sender: 'Titan Promotions', timestamp: 'Yesterday',   body: 'PPV undercard finalised — 3 title fights below yours. Meridian cross-promo locked.' },
        { sender: 'Meridian Sports',  timestamp: '2 days ago',  body: 'Fight-week promo slots allocated — you have 5 media hits day minus 5.' },
      ],
    },
    {
      id: 'sponsor', label: 'Media & Sponsor', icon: '◉', count: 4, color: 'rgb(96, 165, 250)',
      demoMessages: [
        { sender: 'Apex Performance',       timestamp: '11:08 today', body: 'Camp content shoot scheduled for 14:00. Kit + backdrop prepped. Penalty clause applies.' },
        { sender: 'Meridian Sports Press',  timestamp: '7:44 today',  body: 'Fight-week interview request — 15 minutes post-sparring today.' },
        { sender: 'Cleto Reyes Comms',      timestamp: 'Yesterday',   body: 'Two Instagram posts outstanding from March.' },
        { sender: 'Ring Magazine',          timestamp: '2 days ago',  body: 'Cover story slot for July — the rivalry with Stoyan.' },
      ],
    },
    {
      id: 'physio', label: 'Physio & Medical', icon: '✚', count: 1, color: 'rgb(239, 68, 68)', urgent: 1,
      demoMessages: [
        { sender: 'Dr Mitchell (physio)', timestamp: '10:21 today', body: 'URGENT: Right-hand rewrap needed before sparring — 15 min earlier than usual. See me at 09:00.' },
      ],
    },
    {
      id: 'trainer', label: 'Trainer', icon: '◆', count: 2, color: 'rgb(16, 185, 129)',
      demoMessages: [
        { sender: 'Jim Bevan (trainer)', timestamp: '6:50 today',  body: "Stoyan's last 3 fights — he fades at round 6. We want to push the pace after round 4." },
        { sender: 'Jim Bevan (trainer)', timestamp: 'Yesterday',   body: 'Camp plan week 5 — deload into the first sparring block. Load down 8%.' },
      ],
    },
    {
      id: 'purse', label: 'Purse', icon: '$', count: 1, color: 'rgb(34, 211, 238)',
      demoMessages: [
        { sender: 'Titan Finance', timestamp: 'Yesterday', body: 'Signing bonus cleared — £150k net wired. Purse settlement 14 days after fight.' },
      ],
    },
    {
      id: 'travel', label: 'Travel & Logistics', icon: '✈', count: 2, color: 'rgb(236, 72, 153)',
      demoMessages: [
        { sender: 'Travel Desk', timestamp: '8:12 today',  body: 'Fight-week accommodation — Canary Wharf Marriott confirmed 4 nights.' },
        { sender: 'Travel Desk', timestamp: 'Yesterday',    body: 'Corner team flights booked BA LHR→LCY.' },
      ],
    },
    {
      id: 'mandatory', label: 'Mandatory', icon: '★', count: 2, color: 'rgb(217, 70, 239)',
      demoMessages: [
        { sender: 'WBC Mandatory', timestamp: 'Yesterday',  body: "Stoyan's mandatory challenger paperwork received. Purse bid window opens day -20." },
        { sender: 'WBC Mandatory', timestamp: '3 days ago', body: 'Mandatory defence timeline confirmed — 48 days.' },
      ],
    },
  ],
  training: {
    headerSubtitle: 'Camp day 22/70 · Last sparring: Yesterday · 78% intensity',
    recovery:    { score: '78/100', hrv: '61ms', restingHr: '46bpm', sleep: '7.6h' },
    performance: {
      subtitle: 'Last 3 sparring · Pro record 22-1',
      stats: [
        { label: 'Power%',  value: '92 ▲8' },
        { label: 'KO rate', value: '82%' },
        { label: 'Last',    value: 'W · 8 rds' },
      ],
    },
    practice: {
      subtitle: 'Today 11:00 · Sparring 8rds · Southpaw focus',
      rows: [
        { label: 'Partner', value: 'Darnell Hughes' },
        { label: 'Trainer', value: 'Jim Bevan' },
        { label: 'Focus',   value: 'Round 6+ pressure' },
      ],
    },
    gps: {
      subtitle: 'Yesterday · HR-zone training',
      rows: [
        { label: 'Zone 4+',  value: '42 min' },
        { label: 'Avg HR',   value: '148 bpm' },
        { label: 'Peak HR',  value: '178 bpm' },
      ],
    },
    video: {
      subtitle: 'Last clip: Yesterday · Sparring breakdown',
      rows: [
        { label: 'Library',   value: '19 clips' },
        { label: 'Pending',   value: '6 to review' },
        { label: 'AI tagged', value: 'All clips' },
      ],
    },
    nutrition: {
      subtitle: 'Cut week · 5.7kg to go',
      rows: [
        { label: 'Current',  value: '96.4kg' },
        { label: 'Target',   value: '90.7kg' },
        { label: 'Daily cut', value: '0.12kg/day' },
      ],
    },
    mental: {
      subtitle: 'Next session: tonight 20:00',
      rows: [
        { label: 'Coach',  value: 'Dr. Paul Reid' },
        { label: 'Format', value: 'In-person · 60 min' },
        { label: 'Focus',  value: 'Visualisation + round 6' },
      ],
    },
    equipment: {
      subtitle: 'Active fight-week setup',
      rows: [
        { label: 'Gloves',   value: 'Cleto Reyes (14oz)' },
        { label: 'Wraps',    value: 'Everlast' },
        { label: 'Headguard', value: 'Rival RHG100' },
      ],
    },
  },
}
