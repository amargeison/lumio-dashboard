// ─── Media & Content — Static Demo Data ──────────────────────────────────────
// Single source of truth for the Media & Content module across all sports.
// Golf (James Harrington) is the reference implementation.
// Other sports use TODO_DATA until their content is written in a follow-up pass.
//
// Rules:
//  - Session-only interactivity (useState in the component) — nothing here is
//    mutated at runtime; the component seeds its React state from this.
//  - Invented brands only. See Media_Content_Module_Handoff.md.
//  - No real-person names except where already in the sport's demo persona.

export type SocialPlatform = 'instagram' | 'x' | 'tiktok' | 'youtube' | 'facebook';

export type SocialPostMedia = {
  type: 'image' | 'video';
  // Accepts any valid <img>/<video> src — data URLs (compose-uploaded) or
  // relative public/ paths (e.g. '/golf_range.jpg' for seeded demo posts).
  dataUrl: string;
  name: string;
  // Optional poster frame URL — used as the <video poster> when dataUrl is a
  // stand-in that doesn't decode as video (e.g. picsum jpg for a demo post).
  // Real uploaded videos can omit this; the browser derives a frame.
  poster?: string;
};

export type SocialPost = {
  id: string;
  platforms: SocialPlatform[];
  scheduledFor: string;   // human-readable, e.g. 'Today 14:00', 'Tomorrow 09:30', 'Wed 09:00'
  bucket: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek';
  caption: string;
  hashtags: string[];
  status: 'scheduled' | 'draft' | 'published' | 'needs-approval';
  media?: SocialPostMedia[];
};

export type SponsorObligation = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
};

export type Sponsor = {
  id: string;
  name: string;
  initials: string;
  colour: string;            // Tailwind-safe hex
  contractValue: string;     // display string, e.g. 'GBP 45,000/yr + bonuses'
  contractDuration: string;  // e.g. '3-yr deal · renews Dec 2026'
  monthlyValue: string;      // e.g. '£3.8k/mo'
  obligations: SponsorObligation[];
  nextDeadline: string;      // e.g. 'Instagram post due Fri 18 Apr'
};

export type PressMention = {
  id: string;
  outlet: string;
  headline: string;
  date: string;
  author: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  excerpt: string;
};

export type InterviewFormat = 'in-person' | 'phone' | 'video' | 'written';
export type InterviewPrepStatus = 'not-started' | 'in-progress' | 'ready';

export type Interview = {
  id: string;
  outlet: string;
  journalist: string;
  datetime: string;            // e.g. 'Thu 24 Apr · 14:00'
  format: InterviewFormat;
  prepStatus: InterviewPrepStatus;
  topics: string[];
  talkingPoints: string[];
  topicsToAvoid: string[];
  keyStats: string[];
};

export type MediaContentStats = {
  social:   { scheduledLabel: string; drafts: number; pending: number; reach: string };
  sponsors: { active: number; obligationsThisMonth: number; overdue: number; monthlyValue: string };
  press:    { mentionsThisWeek: number; sentiment: string; topOutlet: string; pendingRequests: number };
  followers: {
    x:         { current: string; lastMonth: string };
    instagram: { current: string; lastMonth: string };
    tiktok:    { current: string; lastMonth: string };
    youtube:   { current: string; lastMonth: string };
  };
  // Mention velocity sparkline: 7 values, oldest → newest
  mentionVelocity: number[];
  // Sentiment donut values: positive, neutral, negative (any scale)
  sentimentSplit: { positive: number; neutral: number; negative: number };
};

export type MediaContentData = {
  stats: MediaContentStats;
  social: SocialPost[];
  sponsors: Sponsor[];
  press: PressMention[];
  interviews: Interview[];
};

// ─── TODO placeholder used by sports whose content hasn't been written yet ────
const TODO_DATA: MediaContentData = {
  stats: {
    social:   { scheduledLabel: 'TODO', drafts: 0, pending: 0, reach: 'TODO' },
    sponsors: { active: 0, obligationsThisMonth: 0, overdue: 0, monthlyValue: 'TODO' },
    press:    { mentionsThisWeek: 0, sentiment: 'TODO', topOutlet: 'TODO', pendingRequests: 0 },
    followers: {
      x:         { current: 'TODO', lastMonth: 'TODO' },
      instagram: { current: 'TODO', lastMonth: 'TODO' },
      tiktok:    { current: 'TODO', lastMonth: 'TODO' },
      youtube:   { current: 'TODO', lastMonth: 'TODO' },
    },
    mentionVelocity: [0, 0, 0, 0, 0, 0, 0],
    sentimentSplit: { positive: 0, neutral: 0, negative: 0 },
  },
  social: [
    {
      id: 'todo-1',
      platforms: ['instagram'],
      scheduledFor: 'TODO',
      bucket: 'today',
      caption: 'TODO: write a draft caption for this sport.',
      hashtags: [],
      status: 'draft',
    },
  ],
  sponsors: [
    {
      id: 'todo-sponsor-1',
      name: 'TODO Sponsor',
      initials: 'TS',
      colour: '#64748b',
      contractValue: 'TODO',
      contractDuration: 'TODO',
      monthlyValue: 'TODO',
      obligations: [
        { id: 'todo-o1', text: 'TODO: first obligation for this sport', done: false },
        { id: 'todo-o2', text: 'TODO: second obligation for this sport', done: false },
      ],
      nextDeadline: 'TODO',
    },
  ],
  press: [
    {
      id: 'todo-press-1',
      outlet: 'TODO Outlet',
      headline: 'TODO: headline for this sport',
      date: 'TODO',
      author: 'TODO',
      sentiment: 'neutral',
      excerpt: 'TODO: write a short press excerpt for this sport.',
    },
  ],
  interviews: [
    {
      id: 'todo-int-1',
      outlet: 'TODO Outlet',
      journalist: 'TODO Journalist',
      datetime: 'TODO',
      format: 'video',
      prepStatus: 'not-started',
      topics: ['TODO topic'],
      talkingPoints: [],
      topicsToAvoid: [],
      keyStats: [],
    },
  ],
};

// ─── GOLF — James Harrington (reference implementation) ──────────────────────
const GOLF: MediaContentData = {
  stats: {
    social:   { scheduledLabel: '12 this week', drafts: 3, pending: 2, reach: '2.4M last 7d' },
    sponsors: { active: 4, obligationsThisMonth: 7, overdue: 1, monthlyValue: '£21.7k/mo' },
    press:    { mentionsThisWeek: 23, sentiment: '87% positive', topOutlet: 'Fairway Quarterly', pendingRequests: 1 },
    followers: {
      x:         { current: '182K', lastMonth: '181K' },
      instagram: { current: '247K', lastMonth: '239K' },
      tiktok:    { current: '94K',  lastMonth: '82K' },
      youtube:   { current: '31K',  lastMonth: '30.2K' },
    },
    mentionVelocity: [2, 3, 1, 5, 4, 6, 2],
    sentimentSplit: { positive: 17, neutral: 4, negative: 2 },
  },

  social: [
    {
      id: 'gs-1',
      platforms: ['instagram', 'x'],
      scheduledFor: 'Today 14:00',
      bucket: 'today',
      caption: 'Final prep day before Halden Motors International Open. Course is running fast — feeling dialled in after a long block with Vanta Sports irons.',
      hashtags: ['HaldenMotorsOpen', 'RoadToDubai', 'VantaSports'],
      status: 'scheduled',
      media: [
        { type: 'image', dataUrl: 'https://picsum.photos/seed/harrington-course-prep/800/800',  name: 'Course walk — 18th green' },
        { type: 'image', dataUrl: 'https://picsum.photos/seed/harrington-range-setup/800/800', name: 'Range setup' },
      ],
    },
    {
      id: 'gs-2',
      platforms: ['instagram'],
      scheduledFor: 'Today 18:30',
      bucket: 'today',
      caption: 'Range work in Munich. Numbers don\'t lie — 4.82 pts average coming off three solid weeks on the DP World Tour.',
      hashtags: ['Munich', 'DPWorldTour'],
      status: 'needs-approval',
    },
    {
      id: 'gs-3',
      platforms: ['tiktok'],
      scheduledFor: 'Tomorrow 09:00',
      bucket: 'tomorrow',
      caption: '60-second driver fitting walkthrough with the Vanta Sports team — new shaft spec for Munich conditions.',
      hashtags: ['GolfTok', 'VantaSports', 'Clubfitting'],
      status: 'scheduled',
      // Stand-in — swap for a real .mp4 in public/ when available
      // Poster = same image; dataUrl stays as stand-in until a real .mp4 lands.
      media: [
        {
          type: 'video',
          dataUrl: 'https://picsum.photos/seed/harrington-driver-fitting/800/800',
          poster:  'https://picsum.photos/seed/harrington-driver-fitting/800/800',
          name: 'Driver fitting — 60-sec clip',
        },
      ],
    },
    {
      id: 'gs-4',
      platforms: ['x'],
      scheduledFor: 'Tomorrow 12:00',
      bucket: 'tomorrow',
      caption: 'Pro-am draw out. Looking forward to playing with our Halden Motors hosts tomorrow.',
      hashtags: ['HaldenMotors', 'ProAm'],
      status: 'draft',
    },
    {
      id: 'gs-5',
      platforms: ['instagram', 'facebook'],
      scheduledFor: 'Wed 08:30',
      bucket: 'thisWeek',
      caption: 'Round 1 tee time confirmed — 08:40 with Martinez and Halvorsen. Let\'s go.',
      hashtags: ['HaldenMotorsOpen'],
      status: 'scheduled',
    },
    {
      id: 'gs-6',
      platforms: ['instagram'],
      scheduledFor: 'Wed 19:00',
      bucket: 'thisWeek',
      caption: 'Post-round reset. Caddie Gareth and I going over the front nine — greens are firmer than Tuesday\'s practice round.',
      hashtags: ['Caddie', 'HaldenMotorsOpen'],
      status: 'draft',
      media: [
        { type: 'image', dataUrl: 'https://picsum.photos/seed/harrington-caddie-debrief/800/800', name: 'Caddie debrief — Gareth + front nine' },
      ],
    },
    {
      id: 'gs-7',
      platforms: ['youtube'],
      scheduledFor: 'Fri 17:00',
      bucket: 'thisWeek',
      caption: 'Weekly vlog drop: life on the DP World Tour, Munich edition. Meridian Watches GMT on the wrist, thanks to the crew.',
      hashtags: ['DPWorldTour', 'MeridianWatches'],
      status: 'needs-approval',
    },
    {
      id: 'gs-8',
      platforms: ['instagram', 'x'],
      scheduledFor: 'Sun 20:00',
      bucket: 'thisWeek',
      caption: 'Whatever happens Sunday — the fans in Munich have been unbelievable. Thank you.',
      hashtags: ['ThankYou', 'Munich'],
      status: 'scheduled',
    },
    {
      id: 'gs-9',
      platforms: ['instagram'],
      scheduledFor: 'Mon 10:00',
      bucket: 'nextWeek',
      caption: 'Back in the gym. Race to Dubai #43 — plenty of work to do, plenty of tournaments left.',
      hashtags: ['RoadToDubai', 'Work'],
      status: 'draft',
    },
    {
      id: 'gs-10',
      platforms: ['x', 'facebook'],
      scheduledFor: 'Tue 14:00',
      bucket: 'nextWeek',
      caption: 'Quick AMA later this week — drop your questions below. Nothing off limits (except my putting stats from February).',
      hashtags: ['AMA'],
      status: 'scheduled',
    },
  ],

  sponsors: [
    {
      id: 'sp-vanta',
      name: 'Vanta Sports',
      initials: 'VS',
      colour: '#0ea5e9',
      contractValue: 'GBP 45,000/yr + win bonuses',
      contractDuration: '3-yr deal · renews Dec 2027',
      monthlyValue: '£3.8k/mo',
      obligations: [
        { id: 'vs-1', text: 'Use Vanta Sports irons + wedges in all official events', done: true },
        { id: 'vs-2', text: '2 Instagram mentions per month', done: true },
        { id: 'vs-3', text: 'Appear in 1 campaign shoot per year', done: true },
        { id: 'vs-4', text: 'Driver fitting TikTok — due Fri 18 Apr', done: false, dueDate: 'Fri 18 Apr' },
      ],
      nextDeadline: 'Driver fitting TikTok — Fri 18 Apr',
    },
    {
      id: 'sp-apex',
      name: 'Apex Performance',
      initials: 'AP',
      colour: '#f59e0b',
      contractValue: 'GBP 65,000/yr',
      contractDuration: '2-yr apparel deal · ends Oct 2026',
      monthlyValue: '£5.4k/mo',
      obligations: [
        { id: 'ap-1', text: 'Wear Apex Performance kit on course — all DP World Tour events', done: true },
        { id: 'ap-2', text: '4 Instagram posts per month', done: false, dueDate: '3/4 done this month' },
        { id: 'ap-3', text: 'Attend 1 brand event per quarter', done: true },
        { id: 'ap-4', text: 'Logo visible in 2 tournament photos per event', done: true },
        { id: 'ap-5', text: 'Feature in Spring ‘26 campaign — submit availability', done: false, dueDate: 'Mon 21 Apr' },
      ],
      nextDeadline: '4th Instagram post this month — by Sun',
    },
    {
      id: 'sp-meridian',
      name: 'Meridian Watches',
      initials: 'MW',
      colour: '#16a34a',
      contractValue: 'GBP 120,000/yr (cash + watch allocation)',
      contractDuration: '4-yr ambassador deal · renews Mar 2029',
      monthlyValue: '£10k/mo',
      obligations: [
        { id: 'mw-1', text: 'Wear Meridian Watches piece in all press conferences', done: true },
        { id: 'mw-2', text: 'Appear in 2 campaigns per year', done: true },
        { id: 'mw-3', text: 'Submit monthly Race to Dubai ranking report to Meridian marketing', done: false, dueDate: 'Mon 21 Apr (overdue)' },
        { id: 'mw-4', text: 'One ambassador event per quarter', done: true },
      ],
      nextDeadline: 'Monthly ranking report — Mon 21 Apr (OVERDUE)',
    },
    {
      id: 'sp-northbridge',
      name: 'Northbridge Financial',
      initials: 'NF',
      colour: '#6366f1',
      contractValue: 'GBP 30,000/yr (platform partnership)',
      contractDuration: '1-yr deal · renews Jan 2027',
      monthlyValue: '£2.5k/mo',
      obligations: [
        { id: 'nf-1', text: 'Northbridge Financial logo visible on bag at all events', done: true },
        { id: 'nf-2', text: 'Mention Northbridge platform in 1 interview per quarter', done: true },
        { id: 'nf-3', text: 'Attend 1 Northbridge client day per year', done: false, dueDate: 'Q3 2026' },
      ],
      nextDeadline: 'Client day — Q3 2026',
    },
  ],

  press: [
    {
      id: 'p-1',
      outlet: 'Fairway Quarterly',
      headline: 'Harrington finds his groove at #43 — can he crack the Race to Dubai top 30?',
      date: 'Wed 16 Apr',
      author: 'Rachel Donoghue',
      sentiment: 'positive',
      excerpt: 'Three consecutive top-20 finishes and a 4.82 strokes-gained average tell the story: James Harrington is quietly becoming one of the most consistent iron players on the DP World Tour.',
    },
    {
      id: 'p-2',
      outlet: 'The Green Network',
      headline: 'Munich preview: the five players with the most to gain at Halden Motors International Open',
      date: 'Tue 15 Apr',
      author: 'Marcus Pentland',
      sentiment: 'positive',
      excerpt: 'Harrington, world #87, arrives in Munich with genuine momentum. A strong week pushes him inside the Race to Dubai top 35 with seven events still to play.',
    },
    {
      id: 'p-3',
      outlet: 'European Tour Insider',
      headline: 'Harrington\'s Vanta Sports iron switch: early numbers are promising',
      date: 'Mon 14 Apr',
      author: 'Sam Oakeley',
      sentiment: 'positive',
      excerpt: 'Ball-striking data from TrackMan suggests the mid-iron upgrade has added a measurable half-club of stopping power — exactly what he\'ll need on Munich\'s firm greens.',
    },
    {
      id: 'p-4',
      outlet: 'Capital Herald',
      headline: 'British golfer Harrington among favourites for Munich cut',
      date: 'Sun 13 Apr',
      author: 'Liam Trench',
      sentiment: 'neutral',
      excerpt: 'Harrington, currently 43rd in the Race to Dubai, has made 11 of his last 12 cuts. A quiet, methodical operator — but one bookmakers are increasingly tracking.',
    },
    {
      id: 'p-5',
      outlet: 'Northbridge Sport Online',
      headline: '"Not panicking, not celebrating" — Harrington on his best stretch in two years',
      date: 'Fri 11 Apr',
      author: 'Clare Mensah',
      sentiment: 'positive',
      excerpt: '"I\'ve had stretches that felt better and produced less. And I\'ve had stretches that felt worse and paid more. My job is to stay process-heavy and let the numbers do what they do."',
    },
    {
      id: 'p-6',
      outlet: 'The Dispatch Sport',
      headline: 'Is Harrington still a bit too cautious off the tee? One columnist thinks so',
      date: 'Thu 10 Apr',
      author: 'Dan Pryce',
      sentiment: 'negative',
      excerpt: 'The numbers look good, but strokes-gained off-the-tee is still his relative weakness. At some point he\'ll need to trust the driver on tight Munich par-4s, or 43rd is as high as this year goes.',
    },
    {
      id: 'p-7',
      outlet: 'Fairway Quarterly',
      headline: 'Meridian Watches extends ambassador roster — Harrington named in 2026 campaign',
      date: 'Wed 9 Apr',
      author: 'Rachel Donoghue',
      sentiment: 'positive',
      excerpt: 'The luxury watchmaker\'s spring campaign leans heavily on James Harrington\'s story — a reliable, under-the-radar tour pro who\'s graduated to the full ambassador roster.',
    },
  ],

  interviews: [
    {
      id: 'i-1',
      outlet: 'Fairway Quarterly',
      journalist: 'Rachel Donoghue',
      datetime: 'Thu 24 Apr · 14:00',
      format: 'in-person',
      prepStatus: 'ready',
      topics: ['Race to Dubai #43', 'Munich course conditions', 'Vanta Sports iron switch'],
      talkingPoints: [
        'Three consecutive top-20 finishes — process, not outcome talk.',
        'The iron switch added half a club of stopping power on firm greens.',
        'Race to Dubai #43 — goal is top 30 by end of summer swing.',
        'Caddie Gareth has been instrumental reading these European greens.',
      ],
      topicsToAvoid: [
        'Other tour pros by name (no comparisons on record).',
        'Specific prize-money figures — deflect to "proud of the form".',
      ],
      keyStats: [
        'Strokes-gained approach: +0.82 (top 15 on tour last 10 events)',
        '11 of last 12 cuts made',
        '4.82 pts avg on DP World Tour',
      ],
    },
    {
      id: 'i-2',
      outlet: 'European Tour Insider',
      journalist: 'Sam Oakeley',
      datetime: 'Fri 25 Apr · 11:30',
      format: 'video',
      prepStatus: 'in-progress',
      topics: ['Halden Motors International Open weekend preview', 'Equipment', 'Munich finish form'],
      talkingPoints: [
        'Course suits my ball flight — lower, controlled trajectory.',
        'Vanta Sports iron setup is still being fine-tuned — one more session Wed.',
      ],
      topicsToAvoid: [],
      keyStats: [
        'Career-best finish in Munich: T12 (2024)',
      ],
    },
    {
      id: 'i-3',
      outlet: 'Northbridge Sport Online',
      journalist: 'Clare Mensah',
      datetime: 'Tue 29 Apr · 09:00',
      format: 'phone',
      prepStatus: 'not-started',
      topics: ['Race to Dubai push', 'Spring schedule'],
      talkingPoints: [],
      topicsToAvoid: [],
      keyStats: [],
    },
    {
      id: 'i-4',
      outlet: 'The Green Network',
      journalist: 'Marcus Pentland',
      datetime: 'Written submission · due Thu 1 May',
      format: 'written',
      prepStatus: 'not-started',
      topics: ['10-question Q&A — personal'],
      talkingPoints: [],
      topicsToAvoid: [],
      keyStats: [],
    },
  ],
};

// ─── Index ───────────────────────────────────────────────────────────────────
export const MEDIA_CONTENT: Record<string, MediaContentData> = {
  golf: GOLF,
  tennis: TODO_DATA,
  darts: TODO_DATA,
  boxing: TODO_DATA,
  cricket: TODO_DATA,
  rugby: TODO_DATA,
  'football-pro': TODO_DATA,
  'football-non-league': TODO_DATA,
  'football-grassroots': TODO_DATA,
  womens: TODO_DATA,
};

export function getMediaContent(sport: string): MediaContentData {
  return MEDIA_CONTENT[sport] ?? TODO_DATA;
}
