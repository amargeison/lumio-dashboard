// Telling two players with the same name apart, the same way on every screen.
//
// Each list had its own rule (age, parent, the day they were added) and each
// ran out: two "Sam Twin" with no parent, age or year group, added on the same
// day, came out with identical labels, so a coach choosing who a payment or a
// recording was for was choosing blind.
//
// The hint is what the coach knows them by — age, parent, year group, the day
// they were added. When two namesakes still read the same, they are numbered in
// the order they were added ("no. 1 of 2"), which never changes and never
// matches. A player whose name nobody shares gets no hint at all.

export type Nameable = {
  id: string
  name?: string | null
  age?: number | string | null
  parent_name?: string | null
  year_group?: string | null
  created_at?: string | null
}

const key = (name?: string | null) => String(name ?? '').trim().toLowerCase()

const added = (iso?: string | null) => {
  const t = iso ? new Date(iso) : null
  return t && !isNaN(t.getTime()) ? `added ${t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })}` : ''
}

/** Player id → the words that tell them apart ('' when nobody shares the name). */
export function tellApartHints(players: Nameable[]): Map<string, string> {
  const groups = new Map<string, Nameable[]>()
  for (const p of players) { const k = key(p.name); groups.set(k, [...(groups.get(k) || []), p]) }
  const out = new Map<string, string>()
  for (const group of groups.values()) {
    if (group.length < 2) { out.set(group[0].id, ''); continue }
    // Oldest first, so the numbers stay put as players are added.
    const inOrder = [...group].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')) || a.id.localeCompare(b.id))
    const base = new Map(inOrder.map(p => [p.id, [p.age ? `age ${p.age}` : '', p.parent_name ? `parent ${String(p.parent_name).trim()}` : ''].filter(Boolean).join(', ') || String(p.year_group || '').trim() || added(p.created_at)]))
    const seen = new Map<string, number>()
    for (const h of base.values()) seen.set(h.toLowerCase(), (seen.get(h.toLowerCase()) || 0) + 1)
    inOrder.forEach((p, i) => {
      const h = base.get(p.id) || ''
      const unique = !!h && seen.get(h.toLowerCase()) === 1
      out.set(p.id, unique ? h : [h, `no. ${i + 1} of ${inOrder.length}`].filter(Boolean).join(', '))
    })
  }
  return out
}

/** "Sam Twin (age 9, parent Jo)" for a shared name; just the name otherwise. */
export function playerLabels(players: Nameable[]): Map<string, string> {
  const hints = tellApartHints(players)
  return new Map(players.map(p => [p.id, hints.get(p.id) ? `${p.name} (${hints.get(p.id)})` : String(p.name ?? '')]))
}
