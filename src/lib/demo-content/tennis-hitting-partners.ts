// ─── INVENTED TENNIS HITTING PARTNERS ─────────────────────────────────────
// 10 fictional practice partners used by the Tennis Player Directory's
// Hitting Partners tab. All names invented. Used in place of live AI search.

export type HittingPartner = {
  id: string
  name: string
  level: 'ATP Tour' | 'Challenger' | 'Former ATP' | 'College D1' | 'NTRP 5.5+'
  preferredSurface: 'Hard' | 'Clay' | 'Grass' | 'Indoor'
  sessionRate: number
  location: string
  // Fictional city coords (lat, lng) used for distance calculation when the
  // user grants geolocation. Cities are real European tennis hubs.
  cityCoords: [number, number]
  distanceKm: number
  availability: string[]
  handedness: 'Right' | 'Left'
  bestShot: string
  careerHighRank?: number
  lastPlayed?: string
}

export const TENNIS_HITTING_PARTNERS: HittingPartner[] = [
  {
    id: 'hp-01',
    name: 'Daniel Valverde',
    level: 'Former ATP',
    preferredSurface: 'Hard',
    sessionRate: 180,
    location: 'Roehampton, London',
    cityCoords: [51.4501, -0.2400],
    distanceKm: 8,
    availability: ['Mon AM', 'Mon PM', 'Wed AM', 'Thu AM', 'Fri PM', 'Sat AM'],
    handedness: 'Right',
    bestShot: 'Heavy first serve, 200+ km/h',
    careerHighRank: 142,
    lastPlayed: '4 days ago',
  },
  {
    id: 'hp-02',
    name: 'Sasha Petrović',
    level: 'Challenger',
    preferredSurface: 'Clay',
    sessionRate: 240,
    location: 'Wimbledon, London',
    cityCoords: [51.4214, -0.2065],
    distanceKm: 12,
    availability: ['Tue PM', 'Wed PM', 'Thu PM', 'Sat AM', 'Sat PM'],
    handedness: 'Left',
    bestShot: 'Whippy left-handed forehand, top spin',
    careerHighRank: 218,
    lastPlayed: '2 weeks ago',
  },
  {
    id: 'hp-03',
    name: 'Owen Brackley',
    level: 'College D1',
    preferredSurface: 'Hard',
    sessionRate: 95,
    location: 'Surbiton, Surrey',
    cityCoords: [51.3925, -0.3035],
    distanceKm: 16,
    availability: ['Mon AM', 'Tue AM', 'Wed AM', 'Thu AM', 'Fri AM'],
    handedness: 'Right',
    bestShot: 'Two-handed backhand down the line',
    careerHighRank: undefined,
    lastPlayed: 'Yesterday',
  },
  {
    id: 'hp-04',
    name: 'Anastasia Vellini',
    level: 'ATP Tour',
    preferredSurface: 'Indoor',
    sessionRate: 320,
    location: 'Bisham Abbey, Berkshire',
    cityCoords: [51.5615, -0.7765],
    distanceKm: 47,
    availability: ['Sat PM', 'Sun AM', 'Sun PM'],
    handedness: 'Right',
    bestShot: 'Flat backhand cross-court at full pace',
    careerHighRank: 89,
    lastPlayed: '6 days ago',
  },
  {
    id: 'hp-05',
    name: 'Marcus Tindall',
    level: 'NTRP 5.5+',
    preferredSurface: 'Hard',
    sessionRate: 65,
    location: 'Putney, London',
    cityCoords: [51.4612, -0.2168],
    distanceKm: 6,
    availability: ['Mon PM', 'Tue PM', 'Wed PM', 'Thu PM', 'Fri PM', 'Sat AM', 'Sun AM'],
    handedness: 'Right',
    bestShot: 'Solid all-court game, willing pusher',
    lastPlayed: 'Today',
  },
  {
    id: 'hp-06',
    name: 'Jakub Holicek',
    level: 'Former ATP',
    preferredSurface: 'Clay',
    sessionRate: 200,
    location: 'Reading, Berkshire',
    cityCoords: [51.4543, -0.9781],
    distanceKm: 64,
    availability: ['Tue AM', 'Thu AM', 'Sat AM', 'Sat PM'],
    handedness: 'Right',
    bestShot: 'Loaded backhand slice, low-slung approach',
    careerHighRank: 165,
    lastPlayed: '11 days ago',
  },
  {
    id: 'hp-07',
    name: 'Imogen Carling',
    level: 'College D1',
    preferredSurface: 'Hard',
    sessionRate: 110,
    location: 'Hampstead, London',
    cityCoords: [51.5604, -0.1781],
    distanceKm: 14,
    availability: ['Wed AM', 'Wed PM', 'Sat AM', 'Sun AM'],
    handedness: 'Right',
    bestShot: 'Flat forehand inside-out',
    lastPlayed: '3 days ago',
  },
  {
    id: 'hp-08',
    name: 'Theo Marchand',
    level: 'Challenger',
    preferredSurface: 'Hard',
    sessionRate: 220,
    location: 'Brighton',
    cityCoords: [50.8225, -0.1372],
    distanceKm: 78,
    availability: ['Mon PM', 'Tue PM', 'Fri AM', 'Sat AM'],
    handedness: 'Right',
    bestShot: 'Heavy topspin forehand, high-net play',
    careerHighRank: 254,
    lastPlayed: '5 days ago',
  },
  {
    id: 'hp-09',
    name: 'Mira Solberg',
    level: 'ATP Tour',
    preferredSurface: 'Grass',
    sessionRate: 290,
    location: 'Eastbourne, East Sussex',
    cityCoords: [50.7681, 0.2826],
    distanceKm: 71,
    availability: ['Wed AM', 'Thu AM', 'Fri AM', 'Sun PM'],
    handedness: 'Right',
    bestShot: 'Sliced backhand approach, net rusher',
    careerHighRank: 96,
    lastPlayed: '8 days ago',
  },
  {
    id: 'hp-10',
    name: 'Elliot Thurston',
    level: 'NTRP 5.5+',
    preferredSurface: 'Indoor',
    sessionRate: 75,
    location: 'Kingston upon Thames',
    cityCoords: [51.4123, -0.3007],
    distanceKm: 13,
    availability: ['Mon AM', 'Tue PM', 'Wed PM', 'Thu PM', 'Sat PM'],
    handedness: 'Left',
    bestShot: 'Clean two-handed backhand, neutral baseliner',
    lastPlayed: '2 days ago',
  },
]

// Haversine distance in km between two [lat, lng] points.
export function distanceKmBetween(a: [number, number], b: [number, number]): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}
