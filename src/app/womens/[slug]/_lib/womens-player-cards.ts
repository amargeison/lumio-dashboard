// src/app/womens/[slug]/_lib/womens-player-cards.ts
//
// Player-card data for the Women's squad. Builds a rich, Football-Pro-style
// profile (performance, contract & value, wellbeing & load, attributes,
// injury history) for any squad player — DETERMINISTICALLY from the player's
// identity, so all 22 players get a card without hand-authoring each one.
//
// Known injuries / welfare states are applied as overrides so the card never
// contradicts the Medical / Squad Management views. Squad numbers come from
// the canonical dashboard roster (WOMENS_SQUAD) where available.

import { WOMENS_SQUAD } from './womens-dashboard-data'

export type CardInput = {
  name: string
  pos: string
  ageBand: string        // 'U24' | 'Senior (24+)'
  nationality: string    // e.g. '🇬🇧 England'
  welfare: string        // 'Available' | 'Maternity' | 'RTP' | 'ITC Pending'
  contract: string       // e.g. 'Jun 2027'
}

export type Injury = { type: string; date: string; games: string }

export type PlayerCard = {
  number: number
  age: number
  fitLabel: string
  fitTone: 'fit' | 'injured' | 'warn'
  rating: number
  goals: number
  assists: number
  form: number[]
  attrs: { PAC: number; SHO: number; PAS: number; DRI: number; DEF: number; PHY: number }
  marketValue: string
  wageBand: string
  agent: string
  appearances: number
  minutes: string
  signedFrom: string
  morale: number
  gpsLoad: number
  recovery: number
  injuries: Injury[]
}

// Deterministic 32-bit hash from a string → stable pseudo-randomness per name.
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}
// Pick an integer in [lo, hi] from a seed stream.
function pick(seed: number, k: number, lo: number, hi: number): number {
  const v = (Math.imul(seed ^ (k * 2654435761), 40503) >>> 0) / 0xffffffff
  return Math.round(lo + v * (hi - lo))
}

type Range = [number, number]
type Archetype = { PAC: Range; SHO: Range; PAS: Range; DRI: Range; DEF: Range; PHY: Range; goals: Range; assists: Range }

const ARCH: Record<string, Archetype> = {
  GK: { PAC: [42, 54], SHO: [16, 28], PAS: [48, 60], DRI: [28, 42], DEF: [26, 40], PHY: [60, 72], goals: [0, 0], assists: [0, 1] },
  CB: { PAC: [58, 72], SHO: [34, 50], PAS: [60, 72], DRI: [50, 62], DEF: [80, 90], PHY: [78, 88], goals: [0, 2], assists: [1, 3] },
  LB: { PAC: [78, 88], SHO: [44, 58], PAS: [68, 78], DRI: [70, 80], DEF: [70, 80], PHY: [72, 82], goals: [0, 2], assists: [3, 7] },
  RB: { PAC: [78, 88], SHO: [44, 58], PAS: [68, 78], DRI: [70, 80], DEF: [70, 80], PHY: [72, 82], goals: [0, 2], assists: [3, 7] },
  DM: { PAC: [60, 70], SHO: [50, 62], PAS: [78, 86], DRI: [68, 78], DEF: [76, 84], PHY: [76, 84], goals: [0, 3], assists: [2, 6] },
  CM: { PAC: [65, 75], SHO: [60, 72], PAS: [80, 88], DRI: [76, 84], DEF: [64, 74], PHY: [70, 80], goals: [2, 6], assists: [4, 9] },
  AM: { PAC: [72, 82], SHO: [70, 80], PAS: [80, 88], DRI: [82, 90], DEF: [45, 58], PHY: [64, 74], goals: [4, 9], assists: [5, 10] },
  LW: { PAC: [84, 92], SHO: [70, 80], PAS: [74, 82], DRI: [84, 92], DEF: [40, 52], PHY: [66, 76], goals: [4, 10], assists: [4, 9] },
  RW: { PAC: [84, 92], SHO: [70, 80], PAS: [74, 82], DRI: [84, 92], DEF: [40, 52], PHY: [66, 76], goals: [4, 10], assists: [4, 9] },
  ST: { PAC: [80, 88], SHO: [82, 90], PAS: [70, 80], DRI: [78, 86], DEF: [38, 50], PHY: [74, 84], goals: [8, 16], assists: [2, 6] },
}

const AGENTS = ['Stellar Group', 'Base Soccer', 'Unique Sports Mgmt', 'Wasserman', 'CAA Base', 'Self-represented']
const SIGNED = ['Academy', 'Free agent', 'Harfield Women', 'Northbridge Ladies', 'Westport City Women', 'Loan — made permanent']

// Known injuries / RTP — keep the card consistent with the Medical view.
const INJURY_OVERRIDE: Record<string, Injury[]> = {
  'Sophie Turner': [{ type: 'ACL reconstruction', date: 'Dec 2024', games: 'RTP Phase 3' }],
  'Megan Hughes': [{ type: 'Grade 2 hamstring', date: 'Mar 2026', games: '6 games' }],
  'Tilly Brooks': [{ type: 'Concussion (protocol)', date: 'Mar 2026', games: '2 games' }],
  'Sasha Davies': [{ type: 'Knee — meniscus rehab', date: 'Apr 2026', games: '8 games' }],
}

function gbp(n: number): string {
  if (n >= 1000) return '£' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 0) + 'k'
  return '£' + n
}

export function buildPlayerCard(p: CardInput): PlayerCard {
  const seed = hash(p.name)
  const a = ARCH[p.pos] ?? ARCH.CM
  const r = (k: number, [lo, hi]: Range) => pick(seed, k, lo, hi)

  const attrs = { PAC: r(1, a.PAC), SHO: r(2, a.SHO), PAS: r(3, a.PAS), DRI: r(4, a.DRI), DEF: r(5, a.DEF), PHY: r(6, a.PHY) }
  const number = WOMENS_SQUAD.find(s => s.name === p.name)?.num ?? r(7, [2, 39])
  const age = p.ageBand === 'U24' ? r(8, [18, 23]) : r(8, [24, 31])

  const injured = !!INJURY_OVERRIDE[p.name]
  const fitLabel =
    injured ? 'INJ'
    : p.welfare === 'RTP' ? 'RTP'
    : p.welfare === 'Maternity' ? 'MAT'
    : p.welfare === 'ITC Pending' ? 'ITC'
    : 'FIT'
  const fitTone: PlayerCard['fitTone'] = fitLabel === 'FIT' ? 'fit' : fitLabel === 'INJ' ? 'injured' : 'warn'

  const baseRating = r(9, [64, 78]) / 10              // 6.4 – 7.8
  const rating = Math.max(5.8, Math.min(8.4, baseRating))
  const form = [0, 1, 2, 3, 4].map(k => Math.max(5.5, Math.min(8.6, Math.round((rating * 10 + r(20 + k, [-9, 9])) ) / 10)))

  const onPitch = !injured && p.welfare !== 'Maternity'
  const goals = onPitch ? r(10, a.goals) : 0
  const assists = onPitch ? r(11, a.assists) : 0
  const appearances = onPitch ? r(12, [9, 26]) : r(12, [0, 6])
  const minutes = (appearances * r(13, [62, 90])).toLocaleString()

  // value scales with rating and youth; modest WSL 2 range.
  const val = Math.round((rating - 5.5) * 90 + (28 - age) * 6 + r(14, [10, 70]))
  const marketValue = gbp(Math.max(40, val) * 1000)
  const wageBand = '£' + (r(15, [9, 34]) * 100).toLocaleString('en-GB') + '/wk'

  const morale = injured ? r(16, [42, 55]) : p.welfare === 'RTP' ? r(16, [60, 72]) : r(16, [74, 90])
  const gpsLoad = injured || p.welfare === 'Maternity' ? r(17, [0, 35]) : r(17, [58, 92])
  const recovery = injured ? r(18, [55, 70]) : r(18, [78, 96])

  return {
    number, age, fitLabel, fitTone, rating, goals, assists, form, attrs,
    marketValue, wageBand,
    agent: AGENTS[seed % AGENTS.length],
    appearances, minutes,
    signedFrom: SIGNED[(seed >> 3) % SIGNED.length],
    morale, gpsLoad, recovery,
    injuries: INJURY_OVERRIDE[p.name] ?? [{ type: 'None recent', date: '—', games: '' }],
  }
}

