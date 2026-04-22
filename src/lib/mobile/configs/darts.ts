// Demo data for the darts mobile portal (/darts/demo + /darts/darts-demo).
// Persona: Jake Morrison, PDC European Championship R1 tonight.
import type { SportMobileConfig } from '../types'

export const dartsMobileConfig: SportMobileConfig = {
  sport: 'darts',
  sportEmoji: '🎯',
  personaName: 'Jake Morrison',
  personaInitials: 'JM',
  personaPhotoUrl: '/jake_morrison.jpg',
  teamLogoUrl: '/morrison_darts_logo.svg',
  headerSubtitle: 'DARTS · EUROPEAN CH.',
  dateLabelSuffix: 'R1',
  quote: { text: "You'll miss 100% of the shots you don't take.", author: 'PHIL TAYLOR' },
  heroStats: [
    { label: 'PDC',   value: '#19',   tint: 'violet' },
    { label: 'Avg',   value: '97.8',  tint: 'white'  },
    { label: 'CO%',   value: '42.3',  tint: 'violet' },
    { label: 'Best',  value: '#12',   tint: 'yellow' },
  ],
  weather: { icon: '☁️', temp: '8°', city: 'Dortmund' },
  clocks: [
    { city: 'LON', tz: 'Europe/London' },
    { city: 'BER', tz: 'Europe/Berlin' },
    { city: 'NYC', tz: 'America/New_York' },
  ],
  quickActions: [
    { id: 'sendmessage', icon: '📨', label: 'Send Message' },
    { id: 'matchprep',   icon: '🎯', label: 'Match Prep AI',   hot: true },
    { id: 'logpractice', icon: '📝', label: 'Log Practice' },
    { id: 'walkon',      icon: '🎵', label: 'Walk-on Cue' },
    { id: 'bookoche',    icon: '🪃', label: 'Book Oche' },
    { id: 'sponsor',     icon: '📱', label: 'Sponsor Post',    hot: true },
    { id: 'ranksim',     icon: '📊', label: 'Ranking Sim' },
    { id: 'flight',      icon: '✈️', label: 'Flight Order' },
  ],
  allActionsCount: 8,
  match: {
    timeLabel: 'Tonight 20:00',
    timeLabelTint: 'green',
    eventLabel: 'PDC European Ch.',
    roundLabel: 'R1',
    metaLabel: 'Best of 11 · H2H 4–4',
    player:   { name: 'Jake',       initials: 'JM', rank: 'PDC #19', photoUrl: '/jake_morrison.jpg' },
    opponent: { name: 'D. Merrick', initials: 'DM', rank: 'PDC #7',  photoUrl: '/d-merrick.jpg' },
    primaryButtonLabel: 'Match Prep AI',
    secondaryButtonLabel: 'Scout',
    primaryButtonTarget: 'matchprep',
    secondaryButtonTarget: 'opponentintel',
  },
  schedule: [
    { id: 'd1', time: '09:00', label: 'AI Morning Briefing' },
    { id: 'd2', time: '10:00', label: 'Practice — D16 checkout' },
    { id: 'd3', time: '12:00', label: 'Vanta Sports content shoot' },
    { id: 'd4', time: '14:00', label: 'Physio — shoulder & elbow' },
    { id: 'd5', time: '16:30', label: 'Pre-match warm-up routine' },
    { id: 'd6', time: '20:00', label: 'Match vs D. Merrick — R1', highlight: true },
    { id: 'd7', time: '22:30', label: 'Post-match media' },
  ],
  venue: {
    eyebrow: "TONIGHT'S VENUE",
    name: 'Westfalenhallen, Dortmund',
    conditionsLine: '14°C · Overcast · Doors open 18:00',
    rows: [
      { label: 'Walk-on',  value: '20:00' },
      { label: 'Prize W',  value: '£110,000', tint: 'green' },
      { label: 'Prize L',  value: '£30,000' },
      { label: 'TV',       value: 'Northbridge Sport Darts' },
    ],
  },
  aiSummary: {
    items: [
      { icon: '🎯', text: 'Tonight vs D. Merrick (PDC #7) — 20:00 Westfalenhallen. H2H 4–4. His checkout 39.8% vs yours 42.3%. Start strong on opening leg.' },
      { icon: '📬', text: '2 urgent messages: Crown Wagers ambassador offer via agent (£85k/yr) + Vanta Sports flagging content deadline for 12:00 shoot.' },
      { icon: '📅', text: 'Today: Practice 10:00 (D16 checkout) → Vanta Sports shoot 12:00 → Physio 14:00 → Warm-up 16:30 → Match 20:00 → Post-match media 22:30.' },
      { icon: '🤝', text: 'Vanta Sports content shoot at 12:00 — contract obligation with penalty clause. Kit and backdrop prepped last night.' },
      { icon: '✈️', text: 'Prague Open flights selling fast — save £80+ booking now. Return flight to Gatwick confirmed 23:30 via Düsseldorf.' },
    ],
    briefingText: "Good morning, Jake. Match tonight against D. Merrick at 8pm in Dortmund. Head-to-head four-all. Your checkout at 42.3% is ahead of his 39.8%. Start strong. Two urgent messages on the ambassador offer and the Vanta Sports shoot at noon. Physio at 2pm, warm-up at 4:30, match at 8. Prague Open flights filling up.",
  },
  performanceIntel: {
    timestampLabel: 'AI · 12:58',
    body: '3-dart avg up to {hl} this week — above season avg (97.8). D16 checkout 48% in last 20 practice sessions.',
    highlight: '99.2',
    target: 'performance',
  },
  sponsorAlert: {
    dueLabel: 'Due 12:00',
    message: 'Vanta Sports Darts content past due — shoot at 12:00, kit photo + tagline needed on the wire before 13:30.',
    target: 'sponsorship',
  },
  roundupChannels: [
    {
      id: 'sms', label: 'SMS', icon: '📲', count: 2, color: 'rgb(14, 165, 233)',
      demoMessages: [
        { sender: 'Jim (manager)', timestamp: '9:04 today', body: 'Crown Wagers want to do a walk-on film this week — agent tried to call. Ring him when you get a minute.' },
        { sender: 'Travel desk',   timestamp: '8:42 today', body: 'Driver at hotel 18:30. Entry via loading bay to dodge the autograph queue — security will wave you through.' },
      ],
    },
    {
      id: 'whatsapp', label: 'WhatsApp', icon: '💬', count: 4, color: 'rgb(37, 211, 102)',
      demoMessages: [
        { sender: 'Team chat',     timestamp: '9:10 today', body: 'Jim: gameplan doc up — Merrick leaks 20s off the 180 hunt in first 3 visits. Play percentage.' },
        { sender: 'Danny Walsh',   timestamp: '8:22 today', body: "Promoter's rung — wants you on the Premier League shortlist for next season. Smile and nod." },
        { sender: 'Family 💛',      timestamp: '7:55 today', body: 'Mum: flight into DTM landing 15:40. Stand 3. Good luck love xx' },
        { sender: 'Ricky (practice)', timestamp: '7:40 today', body: 'Oche at hotel booked 10–11. Bring the 22g set. No Vanta Sports kit today — camera crew\'s at the venue.' },
      ],
    },
    {
      id: 'email', label: 'Email', icon: '✉️', count: 6, color: 'rgb(99, 102, 241)',
      demoMessages: [
        { sender: 'PDC European Ch.',     timestamp: '8:50 today', body: 'Media schedule and walk-on protocol attached. Arrive by 18:30 for the VIP welcome.' },
        { sender: 'PDC Player Services',  timestamp: '8:25 today', body: 'Order of Merit update — you gained 2 places after Prague. Full points sheet attached.' },
        { sender: 'Crown Wagers',         timestamp: '8:04 today', body: 'Ambassador terms reviewed. £85k/yr + bonus structure on televised finals — agent has the comparator.' },
        { sender: 'Scolia',               timestamp: '7:48 today', body: 'Your Scolia board firmware 4.7 is available. One-click update before next practice.' },
        { sender: 'Nutrition team',       timestamp: 'Yesterday',  body: 'Match-day fuel plan — eat at 17:00, light carbs, no caffeine past 18:30.' },
        { sender: 'Target Darts',         timestamp: '2 days ago', body: 'Pro-Ultra flights in the new shade — limited run, 200 sets. Claim before Friday.' },
      ],
    },
    {
      id: 'manager', label: 'Manager', icon: '✉', count: 2, color: 'rgb(168, 85, 247)',
      demoMessages: [
        { sender: 'Jim (manager)', timestamp: '9:22 today', body: 'Crown Wagers want a call by Thursday. £85k/yr base + televised-final bonuses. Competitor interest from Kindred.' },
        { sender: 'Jim (manager)', timestamp: 'Yesterday',   body: 'PDC Premier League shortlist due end of season — need a top-16 finish to lock this in.' },
      ],
    },
    {
      id: 'tournament', label: 'Tournament', icon: '⚡', count: 3, color: 'rgb(245, 158, 11)', urgent: 1,
      demoMessages: [
        { sender: 'PDC Tournament Desk', timestamp: '8:47 today', body: 'URGENT: Stage call time moved to 19:45 (15 min earlier). Confirm receipt so broadcast can update.' },
        { sender: 'PDC Tournament Desk', timestamp: 'Yesterday',   body: 'Media accreditation for your coach confirmed — collect at gate B.' },
        { sender: 'Prague Open',         timestamp: '2 days ago',  body: 'Wildcard confirmation for Prague Open — deadline Friday 5pm.' },
      ],
    },
    {
      id: 'sponsor', label: 'Media & Sponsor', icon: '◉', count: 4, color: 'rgb(96, 165, 250)',
      demoMessages: [
        { sender: 'Vanta Sports Darts', timestamp: '11:08 today', body: 'Shoot at 12:00 — need match-day shirt + Vanta Sports flights in frame. Penalty clause if we miss the noon window.' },
        { sender: 'Meridian Sport Press', timestamp: '7:44 today',  body: 'Post-match interview request — 5 minutes max. One question on the Merrick H2H, one on Premier League hopes.' },
        { sender: 'Vanta Sports Comms',  timestamp: 'Yesterday',    body: 'Two Instagram posts outstanding from March.' },
        { sender: 'Darts Weekly',        timestamp: '2 days ago',   body: 'Cover story for July — want to do the Merrick rivalry piece.' },
      ],
    },
    {
      id: 'physio', label: 'Physio & Medical', icon: '✚', count: 1, color: 'rgb(239, 68, 68)', urgent: 1,
      demoMessages: [
        { sender: 'Dr Mitchell (physio)', timestamp: '10:21 today', body: 'URGENT: Right elbow flagged yellow on today\'s scan — manageable but I want strapping at 16:30 and ice pre-match.' },
      ],
    },
    {
      id: 'coach', label: 'Coach', icon: '◆', count: 2, color: 'rgb(16, 185, 129)',
      demoMessages: [
        { sender: 'Jim Bevan (coach)', timestamp: '6:50 today',  body: "Merrick's last 5 matches — he opens with T20, T20, T19 nine times out of ten. Mirror it." },
        { sender: 'Jim Bevan (coach)', timestamp: 'Yesterday',   body: 'Practice plan for Prague Open attached — D16, T19 pressure drills + match-speed walkthrough.' },
      ],
    },
    {
      id: 'prize', label: 'Prize Money', icon: '$', count: 1, color: 'rgb(34, 211, 238)',
      demoMessages: [
        { sender: 'PDC Finance', timestamp: 'Yesterday', body: 'Prague prize money cleared — €14,200 net wired.' },
      ],
    },
    {
      id: 'travel', label: 'Travel & Logistics', icon: '✈', count: 2, color: 'rgb(236, 72, 153)',
      demoMessages: [
        { sender: 'Travel Desk', timestamp: '8:12 today', body: 'Return flight to Gatwick via Düsseldorf 23:30. Car to airport ringfenced post-match.' },
        { sender: 'Travel Desk', timestamp: 'Yesterday',   body: 'Prague Open hotel options attached — preferred hotels filling up fast.' },
      ],
    },
    {
      id: 'walkon', label: 'Walk-on', icon: '★', count: 2, color: 'rgb(217, 70, 239)',
      demoMessages: [
        { sender: 'Stage Manager', timestamp: 'Yesterday', body: 'Walk-on cue for tonight uploaded — standard Jake Morrison intro + pyro + crowd meter. 90 seconds max.' },
        { sender: 'Stage Manager', timestamp: '3 days ago', body: 'New walk-on suggestion for the Premier League launch — sample attached.' },
      ],
    },
  ],
  training: {
    headerSubtitle: 'Last practice: Yesterday 17:30 · 72% intensity',
    recovery:    { score: '79/100', hrv: '64ms', restingHr: '52bpm', sleep: '6.8h' },
    performance: {
      subtitle: 'Last 5 matches · PDC Tour',
      stats: [
        { label: '3-dart',   value: '97.8' },
        { label: 'CO%',      value: '42.3 ▲3' },
        { label: 'Leg W%',   value: '58% ▲6' },
      ],
    },
    practice: {
      subtitle: 'Tonight 16:30 · Hotel oche · Pre-match routine',
      rows: [
        { label: 'Coach',  value: 'Jim Bevan' },
        { label: 'Format', value: 'D16 ladder + 180 hunt' },
        { label: 'Length', value: '60 min' },
      ],
    },
    // Darts doesn't have a natural GPS-session equivalent — explicit null
    // tells the shared training hub to skip the card entirely.
    gps: null,
    video: {
      subtitle: 'Last clip: Yesterday · Finishing breakdown',
      rows: [
        { label: 'Library',   value: '23 clips' },
        { label: 'Pending',   value: '4 to review' },
        { label: 'AI tagged', value: 'All clips' },
      ],
    },
    nutrition: {
      subtitle: 'Match-day plan · tonight',
      rows: [
        { label: 'Pre-match',   value: 'Light carbs @ 17:00' },
        { label: 'Hydration',   value: '1.5L target' },
        { label: 'Caffeine',    value: 'Cut off 18:30' },
      ],
    },
    mental: {
      subtitle: 'Next session: Sunday 10:00',
      rows: [
        { label: 'Coach',     value: 'Dr. Paul Reid' },
        { label: 'Format',    value: 'Remote · 45 min' },
        { label: 'Focus',     value: 'Checkout pressure' },
      ],
    },
    equipment: {
      subtitle: 'Active match-day setup',
      rows: [
        { label: 'Barrels',  value: 'Target Swiss Point 22g' },
        { label: 'Flights',  value: 'Pro-Ultra (std)' },
        { label: 'Shafts',   value: 'Ninja (M)' },
      ],
    },
  },
}
