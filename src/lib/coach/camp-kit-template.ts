// The Lumio camp kit list, as a template rather than a document.
//
// A coach opening the Equipment tab should not be handed an empty textarea and
// asked to remember, in September, how many dozen balls a fourteen-day clay camp
// for sixteen gets through. Every quantity here is a rule against something the
// camp already knows — players, days, courts — so the list arrives scaled to the
// camp in front of them and they edit the handful of lines that are wrong.
//
// The numbers are deliberately conservative and come with their reasoning in the
// note, because a kit list you cannot argue with is a kit list you cannot trust.
// Everything is editable afterwards; none of this is enforced.

export type KitStatus = 'ready' | 'check' | 'order'

export type KitItem = { name: string; qty: string; note?: string; status: KitStatus }
export type KitCategory = { category: string; icon?: string; items: KitItem[] }

export type CampShape = {
  players: number
  days: number
  courts: number
  overseas?: boolean | null
  board?: string | null
  /** junior | adult | mixed — juniors need the smaller balls and more welfare. */
  audience?: string | null
}

type Rule = {
  name: string
  /** Quantity, worked out from the camp. Return '' to leave the item off. */
  qty: (c: CampShape) => string
  note?: (c: CampShape) => string | undefined
  /** Only include this item when the camp calls for it. */
  when?: (c: CampShape) => boolean
  status?: KitStatus
}

const per = (n: number, unit = '') => (c: CampShape) => `×${Math.max(1, Math.ceil(c.players * n))}${unit}`
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const TEMPLATE: { category: string; items: Rule[] }[] = [
  {
    category: 'On-court coaching',
    items: [
      { name: 'Ball hoppers / baskets', qty: c => `×${Math.max(2, c.courts)}`, note: () => 'One per court, plus a spare' },
      {
        name: 'Coaching balls — yellow',
        qty: c => plural(Math.max(4, Math.ceil(c.players * c.days * 0.25)), 'dozen', 'dozen'),
        note: c => `About ${Math.max(4, Math.ceil(c.players * c.days * 0.25))} dozen for ${c.players} players over ${c.days} days, allowing for attrition`,
      },
      {
        name: 'Coaching balls — green',
        qty: c => plural(Math.max(2, Math.ceil(c.players * 0.5)), 'dozen', 'dozen'),
        when: c => (c.audience || 'junior') !== 'adult',
        note: () => 'For the younger or transitioning players',
      },
      {
        name: 'Coaching balls — orange / red',
        qty: c => plural(Math.max(2, Math.ceil(c.players * 0.4)), 'dozen', 'dozen'),
        when: c => (c.audience || 'junior') === 'junior',
        note: () => 'For any younger campers',
        status: 'check',
      },
      { name: 'Throw-down lines', qty: c => `×${Math.max(2, c.courts)} sets`, note: () => 'A set per court' },
      { name: 'Target cones', qty: c => `×${Math.max(20, c.courts * 8)}`, note: () => 'Eight per court' },
      { name: 'Agility ladders', qty: c => `×${Math.max(2, Math.ceil(c.courts / 2))}` },
      { name: 'Mini-nets', qty: c => `×${Math.max(2, Math.ceil(c.courts / 2))}`, when: c => (c.audience || 'junior') === 'junior', status: 'order' },
      { name: 'Spare rackets', qty: c => `×${Math.max(2, Math.ceil(c.players / 4))}`, note: () => 'Loaner cover for breakages' },
      { name: 'Overgrips', qty: c => `×${Math.max(10, c.players * Math.min(5, c.days))}`, note: c => `About ${Math.min(5, c.days)} per player over the week` },
    ],
  },
  {
    category: 'Ball machine & power',
    items: [
      { name: 'Ball machine', qty: c => `×${Math.max(1, Math.floor(c.courts / 3))}` },
      { name: 'Remote + spare batteries', qty: c => `×${Math.max(1, Math.floor(c.courts / 3))}`, status: 'check' },
      { name: 'Extension leads (outdoor)', qty: c => `×${Math.max(2, Math.ceil(c.courts / 2))}` },
      { name: 'Machine ball stock', qty: c => plural(Math.max(3, Math.ceil(c.courts / 2)), 'dozen', 'dozen') },
      { name: 'Travel adaptors', qty: () => '×4', when: c => !!c.overseas, note: () => 'The machine and the chargers, not just the phones', status: 'order' },
    ],
  },
  {
    category: 'Tech & video',
    items: [
      { name: 'Camera + tripod', qty: c => `×${Math.max(1, Math.ceil(c.courts / 3))}` },
      { name: 'Tablet (instant replay)', qty: c => `×${Math.max(1, Math.ceil(c.courts / 2))}` },
      { name: 'Charging hub + cables', qty: () => '×1', status: 'check' },
      { name: 'SD cards / storage', qty: c => `×${Math.max(2, Math.ceil(c.days / 3))}`, note: () => 'Enough that nobody deletes footage on court' },
    ],
  },
  {
    category: 'Medical & welfare',
    items: [
      { name: 'First aid kit', qty: c => `×${Math.max(1, Math.ceil(c.courts / 4))}`, note: () => 'Blister plasters, strapping tape, ice packs, scissors' },
      { name: 'Ice packs + cool box', qty: () => '×1' },
      { name: 'Sun cream SPF50', qty: per(0.5), note: () => 'The thing everyone forgets to pack enough of', status: 'order' },
      { name: 'Electrolytes / hydration', qty: c => `${c.players * c.days} sachets`, note: () => 'One per player per day', status: 'order' },
      { name: 'Water station + cups', qty: c => `×${Math.max(1, Math.ceil(c.courts / 3))}` },
      { name: 'Spare water bottles', qty: c => `×${c.players + 2}`, note: () => 'One each plus two spares' },
    ],
  },
  {
    category: 'Player welcome pack',
    items: [
      { name: 'Camp t-shirt', qty: () => 'per camper', note: () => 'Confirm sizes from the booking form', status: 'order' },
      { name: 'Name badges / lanyards', qty: per(1), when: c => c.players >= 8 },
      { name: 'Printed player packs', qty: per(1), note: () => 'Printed from Player Packs once targets are set' },
      { name: 'Wristbands', qty: per(1), when: c => (c.audience || 'junior') === 'junior' },
      { name: 'Certificates', qty: per(1), note: () => 'Printed from Player Packs on the last day' },
    ],
  },
  {
    category: 'Admin & shade',
    items: [
      { name: 'Coaching whiteboard + pens', qty: c => `×${Math.max(1, Math.ceil(c.courts / 3))}` },
      { name: 'Run sheets (printed)', qty: c => `×${c.days}`, note: () => 'One per day — printed from the Itinerary tab' },
      { name: 'Rooming + arrivals list', qty: () => '×2', when: c => !!c.overseas || /board|resort|hotel/i.test(String(c.board || '')), note: () => 'One for you, one for the venue' },
      { name: 'Gazebo / shade', qty: c => `×${Math.max(1, Math.ceil(c.courts / 4))}` },
      { name: 'Medical + consent forms', qty: () => '×1 folder', note: () => 'Printed from Attendees before you travel' },
    ],
  },
]

/** Build the starting checklist for a camp. Everything is editable afterwards. */
export function buildCampKit(shape: CampShape): KitCategory[] {
  const c: CampShape = {
    players: Math.max(1, Number(shape.players) || 1),
    days: Math.max(1, Number(shape.days) || 1),
    courts: Math.max(1, Number(shape.courts) || 1),
    overseas: shape.overseas,
    board: shape.board,
    audience: shape.audience,
  }
  return TEMPLATE.map(cat => ({
    category: cat.category,
    items: cat.items
      .filter(r => (r.when ? r.when(c) : true))
      .map(r => {
        const qty = r.qty(c)
        return qty ? { name: r.name, qty, note: r.note?.(c), status: r.status || ('ready' as KitStatus) } : null
      })
      .filter(Boolean) as KitItem[],
  })).filter(cat => cat.items.length > 0)
}

/**
 * Lines of text that were already on the camp, kept rather than discarded.
 *
 * Camps designed before the checklist existed hold their kit as loose text, and
 * so does anything Lumio Coach suggests. Those lines go into a category of their
 * own instead of being parsed into quantities we would only be guessing at.
 */
export function foldLooseItems(existing: unknown): KitCategory | null {
  const lines: string[] = Array.isArray(existing)
    ? existing.map(x => String(x || '').trim()).filter(Boolean)
    : typeof existing === 'string'
      ? existing.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      : []
  if (!lines.length) return null
  return {
    category: 'From your list',
    items: lines.map(l => {
      // "Ball baskets x12 (one per court)" → name, qty, note. A best effort at
      // tidying, never a reason to drop a line the coach wrote.
      const m = /^(.*?)\s*[x×]\s*(\d[\d,]*)\s*(?:\((.*)\))?\s*$/i.exec(l)
      if (m) return { name: m[1].trim().replace(/[,\s]+$/, ''), qty: `×${m[2]}`, note: m[3]?.trim() || undefined, status: 'check' as KitStatus }
      return { name: l, qty: '', status: 'check' as KitStatus }
    }),
  }
}

export function kitReadyCount(kit: KitCategory[]): { ready: number; total: number } {
  let ready = 0, total = 0
  for (const c of kit) for (const i of c.items) { total++; if (i.status === 'ready') ready++ }
  return { ready, total }
}

export const KIT_STATUS_LABEL: Record<KitStatus, string> = { ready: 'READY', check: 'CHECK', order: 'TO ORDER' }
export const nextKitStatus = (s: KitStatus): KitStatus => (s === 'ready' ? 'check' : s === 'check' ? 'order' : 'ready')
