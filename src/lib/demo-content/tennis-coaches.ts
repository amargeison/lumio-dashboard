// ─── INVENTED TENNIS COACH ROSTER ─────────────────────────────────────────
// 12 fictional coaches used by the Tennis Coach Finder. All names are
// invented (no real coach surnames). Used by the wizard's results step in
// place of live /api/ai/tennis web-search calls.

export type TennisCoach = {
  id: string
  name: string
  nickname?: string
  speciality:
    | 'Serve Coach'
    | 'Return Specialist'
    | 'Mental Game'
    | 'Clay Conversion'
    | 'Junior→Pro Transition'
    | 'Strategy/Tactics'
    | 'Fitness+Movement'
    | 'Tour Coach'
    | 'Stroke Biomechanics'
  bio: string
  yearsExperience: number
  dayRate: number
  location: string
  availability: string
  languages: string[]
  tourHistory?: string
  rating: number
}

export const TENNIS_COACHES: TennisCoach[] = [
  {
    id: 'tc-01',
    name: 'Marco Theron',
    nickname: 'The Architect',
    speciality: 'Serve Coach',
    bio: 'Built the serves of three top-30 ATP players over the last decade. Slow-motion video, pronation drills, kinematic chain breakdowns — Marco is the man if your second serve is leaking points.',
    yearsExperience: 22,
    dayRate: 1800,
    location: 'Bisham Abbey National Centre, UK',
    availability: 'Weekdays 9-4, blocks of 5+ days preferred',
    languages: ['English', 'Afrikaans'],
    tourHistory: 'Ex-ATP #112, 8yr pro',
    rating: 4.9,
  },
  {
    id: 'tc-02',
    name: 'Helena Sokolova',
    speciality: 'Return Specialist',
    bio: 'Built her career around the return of serve as her own ATP weapon, now teaches it. Specialises in reading toss, anticipation cues and the second-serve attack pattern.',
    yearsExperience: 14,
    dayRate: 1200,
    location: 'Prague Tennis Academy, Czechia',
    availability: 'Mon-Thu in-person, Fri remote video review',
    languages: ['English', 'Czech', 'Russian'],
    tourHistory: 'Ex-WTA #44, 11yr pro',
    rating: 4.8,
  },
  {
    id: 'tc-03',
    name: 'Dr Ravi Pillai',
    nickname: 'The Surgeon',
    speciality: 'Mental Game',
    bio: 'Sports psychologist with eight years on the WTA tour. PhD in performance psychology, works with players on tiebreak composure, momentum management, and post-loss recovery.',
    yearsExperience: 18,
    dayRate: 950,
    location: 'London + remote sessions',
    availability: 'Remote video weekly retainer; in-person tournament weeks',
    languages: ['English', 'Hindi', 'French'],
    rating: 4.9,
  },
  {
    id: 'tc-04',
    name: 'Pablo Sarmiento',
    speciality: 'Clay Conversion',
    bio: 'Spanish clay specialist who turns hard-court grinders into clay-court threats. Topspin, slide footwork, point-construction in long rallies — built around the European clay swing.',
    yearsExperience: 19,
    dayRate: 1500,
    location: 'Barcelona Academy, Spain',
    availability: 'Touring, follows the clay swing Apr-Jun',
    languages: ['Spanish', 'English', 'Catalan'],
    tourHistory: 'Ex-ATP #67, 14yr pro',
    rating: 4.7,
  },
  {
    id: 'tc-05',
    name: 'Anya Brennan',
    speciality: 'Junior→Pro Transition',
    bio: 'Twelve years guiding junior champions through the messy first three years of pro tennis. Schedule design, ranking ladder navigation, financial setup, agent selection.',
    yearsExperience: 16,
    dayRate: 1100,
    location: 'LTA National Tennis Centre, Roehampton',
    availability: 'Weekdays in-person; weekend video calls',
    languages: ['English'],
    rating: 4.8,
  },
  {
    id: 'tc-06',
    name: 'Yannis Kostopoulos',
    nickname: 'The Tactician',
    speciality: 'Strategy/Tactics',
    bio: 'Match-prep tactician. Opponent breakdown video sessions, court-positioning drills, point-by-point game-plan construction. Quiet courtside presence, deeply analytical.',
    yearsExperience: 21,
    dayRate: 1650,
    location: 'Athens + travels with players to majors',
    availability: 'Tournament weeks, on retainer for slam blocks',
    languages: ['Greek', 'English', 'German'],
    tourHistory: 'Ex-coach to two top-20 ATP players',
    rating: 4.9,
  },
  {
    id: 'tc-07',
    name: 'Jamal Adeyemi',
    speciality: 'Fitness+Movement',
    bio: 'S&C coach turned movement specialist. Court coverage, recovery protocols, GPS-load management. Worked across rugby and tennis at elite level.',
    yearsExperience: 13,
    dayRate: 850,
    location: 'Loughborough High Performance Centre',
    availability: 'Mon-Sat, residential blocks of 2-6 weeks',
    languages: ['English'],
    rating: 4.7,
  },
  {
    id: 'tc-08',
    name: 'Lukas Wendel',
    speciality: 'Tour Coach',
    bio: 'Full-time travelling head coach. Has been on tour with three top-100 players over the last decade. Day-to-day match prep, recovery, sponsor balance, pressroom navigation.',
    yearsExperience: 20,
    dayRate: 2400,
    location: 'Touring (35+ weeks/year on tour)',
    availability: 'Annual contract, 35-week tour commitment',
    languages: ['German', 'English', 'French'],
    tourHistory: 'Ex-ATP #88, 9yr pro',
    rating: 4.8,
  },
  {
    id: 'tc-09',
    name: 'Carmen Vega',
    speciality: 'Stroke Biomechanics',
    bio: 'Movement-science academic crossed over to coaching. Forehand grip-path, racquet-head speed, contact-point alignment — diagnoses the small inefficiencies that compound across a five-set match.',
    yearsExperience: 15,
    dayRate: 1350,
    location: 'Madrid + Caja Mágica residency Apr-Jun',
    availability: 'Weekdays 8-3, weekend video reviews',
    languages: ['Spanish', 'English'],
    rating: 4.8,
  },
  {
    id: 'tc-10',
    name: 'Gareth Hollings',
    speciality: 'Mental Game',
    bio: 'Pre-match routines, in-match anchoring, tilt recovery. Practical, no-nonsense — comes from county cricket then crossed into tennis. Works in 60-90 minute slots, lots of homework between sessions.',
    yearsExperience: 11,
    dayRate: 600,
    location: 'Manchester + remote',
    availability: 'Evenings and weekends',
    languages: ['English'],
    rating: 4.6,
  },
  {
    id: 'tc-11',
    name: 'Wei-Lin Chow',
    nickname: 'The Net Architect',
    speciality: 'Strategy/Tactics',
    bio: 'Net-game and transition specialist. Approach shots, first-volley positioning, swinging volleys. Brought a generation of Asian tour players forward to the net.',
    yearsExperience: 17,
    dayRate: 1100,
    location: 'Singapore Tennis Academy',
    availability: 'Mon-Fri, 4-week residential blocks',
    languages: ['Mandarin', 'English'],
    tourHistory: 'Ex-coach for 3 top-50 doubles teams',
    rating: 4.8,
  },
  {
    id: 'tc-12',
    name: 'Tomas Ekström',
    speciality: 'Serve Coach',
    bio: 'Serve mechanics specialist with a Scandinavian patience. High-speed video analysis, wrist-snap timing, kinetic-chain sequencing. Two-week intensive blocks, no quick fixes.',
    yearsExperience: 23,
    dayRate: 1700,
    location: 'Stockholm Royal Tennis Hall',
    availability: 'Two-week intensive blocks, 8 per year',
    languages: ['Swedish', 'English', 'German'],
    tourHistory: 'Ex-ATP #94, 12yr pro',
    rating: 4.9,
  },
]
