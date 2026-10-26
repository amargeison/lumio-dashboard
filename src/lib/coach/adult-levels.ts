// Adult levels: the academy's own ladder for adult players, with a short video
// and a pass checklist for each level (pure — no database, no browser).
//
// The junior colour ladder is Lumio's and fixed. Adults are different: every
// coach describes them their own way, so the levels are the academy's to name
// and edit. Six starter levels are offered to begin from. Each level has a
// video the coach hosts on YouTube or Vimeo (an unlisted link is fine) — Lumio
// stores the link, never the video, so there is no storage cost.

export type CheckItem = { id: string; text: string }
export type AdultLevel = { id: string; position: number; name: string; summary?: string | null; video_url?: string | null; checklist: CheckItem[] }
export type AdultPass = { id?: string; player_id: string; level_id: string; item_id: string; passed_on?: string | null }

export const MAX_ITEMS = 30

const item = (id: string, text: string): CheckItem => ({ id, text })

/** Where a coach starts from. Every word can be changed. */
export const STARTER_LEVELS: { name: string; summary: string; checklist: CheckItem[] }[] = [
  { name: 'Starter', summary: 'Getting the ball over the net and knowing the score.', checklist: [
    item('s1', 'Ready position and a split-step as the ball is hit'),
    item('s2', 'Forehand rally of 5 from a feed'),
    item('s3', 'Backhand rally of 5 from a feed'),
    item('s4', 'Gets a serve in, 3 out of 5'),
    item('s5', 'Scores a game correctly'),
  ] },
  { name: 'Improver', summary: 'Rallying from the baseline and starting points properly.', checklist: [
    item('i1', '10 cross-court forehands in a row'),
    item('i2', '10 cross-court backhands in a row'),
    item('i3', 'Overarm serve in, 6 out of 10'),
    item('i4', 'Forehand and backhand volley from a feed'),
    item('i5', 'Plays a full set with the right scoring and change of ends'),
  ] },
  { name: 'Club', summary: 'Holding your own in club doubles.', checklist: [
    item('c1', 'Rallies 15 balls landing past the service line'),
    item('c2', 'Second serve with spin, 7 out of 10'),
    item('c3', 'Return of serve back deep, 6 out of 10'),
    item('c4', 'Knows where to stand serving and receiving in doubles'),
    item('c5', 'Approaches and volleys to finish a point'),
  ] },
  { name: 'Club+', summary: 'Controlling the rally and playing the score.', checklist: [
    item('p1', 'Changes direction down the line from a cross-court rally'),
    item('p2', 'Slice backhand to defend and reset'),
    item('p3', 'First serve to a chosen target, 5 out of 10'),
    item('p4', 'Overhead from a lob'),
    item('p5', 'Plays a tie-break with the right serving order'),
  ] },
  { name: 'Team', summary: 'Reliable under pressure in league and team tennis.', checklist: [
    item('t1', 'Kick or slice second serve to the backhand, 7 out of 10'),
    item('t2', 'Doubles return at the server’s feet'),
    item('t3', 'Serve and volley'),
    item('t4', 'Builds a point with a plan (a pattern they choose)'),
    item('t5', 'Wins a game of pressure points (30–30 starts)'),
  ] },
  { name: 'Advanced', summary: 'Competing at county level and beyond.', checklist: [
    item('a1', 'Heavy topspin and a flat drive on demand'),
    item('a2', 'Variety: drop shot, lob and short angle'),
    item('a3', 'Over 65% of first serves in across a set'),
    item('a4', 'Turns defence into attack'),
    item('a5', 'A match plan for an opponent they know'),
  ] },
]

/** The checklist as typed (one item per line), keeping the id of any item whose words did not change. */
export function checklistFrom(lines: string, before: CheckItem[] = []): CheckItem[] {
  const used = new Set<string>()
  const out: CheckItem[] = []
  let n = 0
  for (const raw of lines.split('\n')) {
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, 200)
    if (!text) continue
    const same = before.find(b => b.text === text && !used.has(b.id))
    let id = same?.id
    while (!id || used.has(id)) id = `x${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`
    used.add(id)
    out.push({ id, text })
    if (out.length >= MAX_ITEMS) break
  }
  return out
}

/** Whatever is saved, made safe to show. */
export function tidyChecklist(raw: unknown): CheckItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(r => ({ id: String((r as CheckItem)?.id ?? '').slice(0, 60), text: String((r as CheckItem)?.text ?? '').trim().slice(0, 200) }))
    .filter(r => r.id && r.text).slice(0, MAX_ITEMS)
}

/**
 * A YouTube or Vimeo link, as a player that can sit on the page. Anything else
 * is refused: the address becomes a frame on the family's page, so only these
 * two hosts, only over https, and only a video id that looks like one.
 */
export function videoEmbed(url: unknown): { provider: 'youtube' | 'vimeo'; embed: string; watch: string } | null {
  const raw = String(url ?? '').trim()
  if (!/^https:\/\//i.test(raw) || raw.length > 400 || /\s/.test(raw)) return null
  let u: URL
  try { u = new URL(raw) } catch { return null }
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, '')
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = u.pathname === '/watch' ? u.searchParams.get('v')
      : (u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/) || [])[1]
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: 'youtube', embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`, watch: `https://www.youtube.com/watch?v=${id}` } : null
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0]
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: 'youtube', embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`, watch: `https://www.youtube.com/watch?v=${id}` } : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    // vimeo.com/123456789, vimeo.com/123456789/abcdef1234 (unlisted), player.vimeo.com/video/123456789?h=abcdef1234
    const m = u.pathname.match(/^\/(?:video\/)?(\d{6,12})(?:\/([0-9a-f]{6,20}))?\/?$/i)
    if (!m) return null
    const hash = m[2] || u.searchParams.get('h') || ''
    if (hash && !/^[0-9a-f]{6,20}$/i.test(hash)) return null
    return { provider: 'vimeo', embed: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ''}`, watch: `https://vimeo.com/${m[1]}${hash ? `/${hash}` : ''}` }
  }
  return null
}

export const VIDEO_HELP = 'Paste a YouTube or Vimeo link. Upload the video there as unlisted if you would rather it was not public.'

/** How far a player is through a level's checklist. */
export function levelProgress(level: Pick<AdultLevel, 'id' | 'checklist'>, passes: AdultPass[], playerId: string) {
  const items = tidyChecklist(level.checklist)
  const passed = new Set(passes.filter(p => p.player_id === playerId && p.level_id === level.id).map(p => p.item_id))
  const done = items.filter(i => passed.has(i.id)).length
  return { done, total: items.length, ready: items.length > 0 && done === items.length, passed }
}

export const ordered = <L extends Pick<AdultLevel, 'position' | 'name'>>(levels: L[]): L[] =>
  [...levels].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))

/** Is this an adult player? Their category, or their age. */
export const isAdultPlayer = (p: { category?: string | null; age?: number | null; adult_level_id?: string | null }) =>
  !!p.adult_level_id || /adult/i.test(String(p.category || '')) || (Number(p.age) || 0) >= 18
