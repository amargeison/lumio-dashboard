// Finding contacts — the FREE half.
//
// Everything in this file costs nothing to run:
//   1. Companies House's public register: which companies exist with "tennis"
//      (or "padel", or whatever is asked for) in their name.
//   2. The organisation's own website: guess its address from its name, check
//      the page really is theirs, and read the contact email they publish.
//
// Nothing here calls a paid service. The paid web search lives in
// paid-search.ts and only ever runs when an admin presses its button.
//
// What is collected is what a business publishes about itself for people to
// get in touch: its name, its website and a contact email. Not officers, not
// home addresses, not anything about individuals.

import dns from 'node:dns/promises'
import net from 'node:net'
import { db, looksCorporate, SEGMENTS, type Segment } from '@/lib/outreach/core'

export type Prospect = {
  id: string; org_name: string; company_number: string | null; legal_form: string | null; corporate_ok: boolean
  town: string | null; district: string | null; segment: Segment; website: string | null; email: string | null
  state: 'new' | 'no_email' | 'unsure' | 'found' | 'nothing' | 'added' | 'dismissed'
  searched_paid: boolean; source: string | null; notes: string | null; created_at: string
}

export const toSeg = (v: unknown): Segment => (SEGMENTS as readonly string[]).includes(String(v)) ? v as Segment : 'academy'
const tidy = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

// ── Which kind of organisation is it? ────────────────────────────────────────
// Worked out twice, both times for free. First from the name and the activity
// code the company gave the register ("Anytown Lawn Tennis Club" is a venue
// whatever else is true). Then again from the words on its own website, which
// is the better evidence: a site that talks about membership and booking a
// court is a club; one that says "about me" and "I coach" is one person.
// Neither is certain, so the list lets a person change it with one click.
const FIRST_NAMES = new Set(('aaron adam adrian aidan alan alex alexander alfie ali alice alison amanda amy andrew andy angela anna anne anthony arthur ashley barry becky ben benjamin beth bill billy bob brad bradley brian callum cameron carl carol caroline catherine charlie charlotte chloe chris christian christine christopher claire clare colin connor craig dale dan daniel danny darren dave david dean debbie dominic donna doug duncan dylan ed eddie edward eleanor elizabeth ellie emily emma eric ethan fiona frank fred gareth gary gavin gemma geoff george georgia gerry glen gordon grace graham grant greg hannah harry hayley heather helen henry holly ian isaac isabel jack jackie jacob jade jake james jamie jane janet jason jay jean jeff jen jennifer jenny jeremy jess jessica jill jim jo joanna joanne joe joel john jon jonathan jonny jordan joseph josh joshua judy julia julian julie justin karen karl kate katherine kathryn katie keith kelly ken kerry kevin kieran kim kirsty kyle laura lauren lee leigh leon lewis liam linda lisa liz louis louise lucy luke lynn marc marcus margaret maria marie mark martin mary matt matthew max megan mel melanie michael michelle mick mike mo mohammed molly natalie nathan neil niall nick nicola nicholas nigel noah oliver olivia ollie oscar owen patrick paul paula pete peter phil philip rachel rebecca rhys richard rick rob robert robin roger ron ross roy ruth ryan sally sam samantha samuel sandra sara sarah scott sean shane sharon shaun simon sophie stefan steph stephanie stephen steve steven stuart sue susan suzanne terry thomas tim tina toby tom tommy tony tracey tracy trevor vicky victoria wayne will william zoe').split(' '))
const VENUE_NAME = /\b(club|clubs|lawn tennis|ltc|tc|tennis cent(re|er)|sports? cent(re|er)|racquets?|rackets|squash|leisure|parks?|country club|recreation|sports? ground|sports? association|community association|village hall|courts?)\b/
const ACADEMY_NAME = /\b(academy|academies|school|schools|coaching|coaches|performance|development|programmes?|foundation|institute|excellence|camps?|education|training|pro|elite)\b/
const GENERIC_NAME = /^(tennis|padel|pickleball|coaching|coach|services|service|sport|sports|fitness|pro|and|uk|international|solutions|consulting|consultancy|enterprises|associates)$/

/** A first guess from the name and the register's activity (SIC) codes. */
export function segmentFromName(name: string, sic: string[] = []): Segment {
  const words = nameWords(name)
  const text = ' ' + words.join(' ') + ' '
  if (VENUE_NAME.test(text)) return 'venue'
  // "Sam Marland Tennis Ltd": a person's name and nothing else that describes
  // an organisation is one coach trading through a company.
  const own = words.filter(w => !GENERIC_NAME.test(w))
  const personal = own.length >= 2 && own.length <= 3 && FIRST_NAMES.has(own[0]) && own.every(w => /^[a-z]+$/.test(w))
  if (personal && !/\b(academy|academies|school|schools|foundation|institute|camps?)\b/.test(text)) return 'coach'
  if (ACADEMY_NAME.test(text)) return 'academy'
  if (sic.some(c => /^931[12]/.test(c))) return 'venue'              // sports facilities; sports clubs
  return 'academy'
}

const count = (text: string, re: RegExp) => Math.min(4, (text.match(re) || []).length)
/** A better guess from the words on their own website; null when the page does not settle it. */
export function segmentFromPage(html: string): Segment | null {
  const t = textOf(html).slice(0, 60_000)
  const venue = count(t, /\b(membership|become a member|join (the|our) club|members'? area|book a court|court booking|court hire|clubhouse|club house|committee|floodlit|our courts|\d+ courts|pay and play|club championships?|social tennis|club night|league teams?)\b/g)
  const academy = count(t, /\b(our coaches|coaching team|our team|meet the team|head coach|academy|squads?|performance program(me)?s?|holiday camps?|schools? program(me)?s?|term dates|junior program(me)?s?|group (lessons|coaching|sessions)|coaches at|venues)\b/g)
  const coach = count(t, /\b(about me|my coaching|i am a|i'm a|i have (been )?coach|i offer|i provide|lessons? with me|contact me|my name is|book (a lesson )?with me|i coach|my experience|my qualifications)\b/g)
  const top = Math.max(venue, academy, coach)
  if (top < 2) return null
  const second = [venue, academy, coach].sort((a, b) => b - a)[1]
  if (top - second < 1) return null
  return top === coach ? 'coach' : top === venue ? 'venue' : 'academy'
}

// ── Companies House ──────────────────────────────────────────────────────────
// The register is free to query with a free API key (COMPANIES_HOUSE_API_KEY).
export const companiesHouseReady = () => !!process.env.COMPANIES_HOUSE_API_KEY

async function ch(path: string): Promise<Record<string, unknown> | null> {
  const key = process.env.COMPANIES_HOUSE_API_KEY
  if (!key) throw new Error('Companies House is not set up on the server (COMPANIES_HOUSE_API_KEY).')
  const res = await fetch(`https://api.company-information.service.gov.uk${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` }, signal: AbortSignal.timeout(20_000),
  })
  if (res.status === 404) return null                       // the register's way of saying "no results"
  if (res.status === 401) throw new Error('Companies House refused the API key.')
  if (res.status === 429) throw new Error('Companies House is asking us to slow down — try again in a few minutes.')
  if (!res.ok) throw new Error(`Companies House returned ${res.status}.`)
  return await res.json() as Record<string, unknown>
}

/** Register type → the words we show, and whether it is a corporate body. */
export function legalFormOf(type: string, subtype?: string): { form: string; corporate: boolean } {
  const t = String(type || '').toLowerCase(), s = String(subtype || '').toLowerCase()
  if (s.includes('community-interest')) return { form: 'CIC', corporate: true }
  if (t === 'ltd') return { form: 'Ltd', corporate: true }
  if (t.startsWith('private-limited-guarant')) return { form: 'Ltd by guarantee', corporate: true }
  if (t === 'plc') return { form: 'PLC', corporate: true }
  if (t === 'llp') return { form: 'LLP', corporate: true }
  if (t.includes('charitable-incorporated')) return { form: 'CIO (charity)', corporate: true }
  if (t.includes('registered-society') || t.includes('industrial-and-provident')) return { form: 'Registered society', corporate: true }
  if (t === 'scottish-partnership') return { form: 'Scottish partnership', corporate: true }
  if (t.includes('unlimited')) return { form: 'Unlimited company', corporate: true }
  // An English limited partnership is not a corporate body, and anything we do
  // not recognise is held back for a person to decide.
  if (t === 'limited-partnership') return { form: 'Limited partnership', corporate: false }
  return { form: t ? t.replace(/-/g, ' ') : 'Unknown', corporate: false }
}

type ChItem = { company_name?: string; company_number?: string; company_type?: string; company_subtype?: string; company_status?: string; sic_codes?: string[]; registered_office_address?: { locality?: string; postal_code?: string } }
const districtOf = (postcode?: string) => (String(postcode || '').toUpperCase().match(/^([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}$/) || [])[1] || null
/** "ELITE TENNIS LIMITED" → "Elite Tennis Limited". */
const titleCase = (s: string) => s === s.toUpperCase()
  ? s.toLowerCase().replace(/\b([a-z])/g, m => m.toUpperCase()).replace(/\b(Ltd|Llp|Cic|Plc|Uk|Lta|Fc|Tc|Ltc)\b/g, m => m.toUpperCase()).replace(/\bLTD\b/g, 'Ltd')
  : s

/**
 * Companies on the register whose name contains the words given.
 * Adds the ones we have not seen before as prospects. Free.
 */
export async function findCompanies(o: { words: string; exclude?: string; location?: string; segment: Segment | 'auto'; max: number }) {
  const words = tidy(o.words, 80)
  if (words.length < 3) throw new Error('Give at least one word the company name should contain, e.g. “tennis”.')
  const max = Math.max(1, Math.min(500, Math.round(o.max) || 100))
  const sb = db()
  const [{ data: have }, { data: contacts }] = await Promise.all([
    sb.from('outreach_prospects').select('company_number, org_name').limit(50000),
    sb.from('outreach_contacts').select('org_name').limit(50000),
  ])
  const key = (n: unknown) => nameWords(String(n ?? '')).join(' ')
  const seenNumbers = new Set((have || []).map(p => p.company_number as string).filter(Boolean))
  const seenNames = new Set([...(have || []), ...(contacts || [])].map(p => key(p.org_name)).filter(Boolean))
  const not = tidy(o.exclude, 200).toLowerCase().split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 1)

  const rows: Record<string, unknown>[] = []
  let matched = 0, already = 0, excluded = 0
  // The register hands back up to 5,000 at a time; page through until we have
  // enough NEW ones, so a second press carries on where the first stopped.
  for (let start = 0; start < 5000 && rows.length < max; start += 500) {
    const q = new URLSearchParams({ company_name_includes: words, company_status: 'active', size: '500', start_index: String(start) })
    if (tidy(o.location)) q.set('location', tidy(o.location, 60))
    const page = await ch(`/advanced-search/companies?${q}`)
    const items = ((page?.items as ChItem[]) || [])
    if (!items.length) break
    for (const it of items) {
      matched++
      const name = tidy(it.company_name), number = tidy(it.company_number, 20)
      if (!name || !number) continue
      const lower = name.toLowerCase()
      if (not.some(w => lower.includes(w))) { excluded++; continue }
      if (seenNumbers.has(number) || seenNames.has(key(name))) { already++; continue }
      seenNumbers.add(number); seenNames.add(key(name))
      const lf = legalFormOf(String(it.company_type || ''), it.company_subtype)
      const sic = (Array.isArray(it.sic_codes) ? it.sic_codes : []).map(c => String(c).replace(/\D/g, '')).filter(Boolean).slice(0, 4)
      rows.push({
        org_name: titleCase(name), company_number: number, legal_form: lf.form, corporate_ok: lf.corporate,
        town: tidy(it.registered_office_address?.locality, 80) ? titleCase(tidy(it.registered_office_address?.locality, 80)) : null,
        district: districtOf(it.registered_office_address?.postal_code),
        segment: o.segment === 'auto' ? segmentFromName(name, sic) : o.segment,
        notes: sic.length ? `SIC ${sic.join(', ')}` : null,
        source: `Companies House: “${words}”${tidy(o.location) ? ` in ${tidy(o.location, 60)}` : ''}`,
      })
      if (rows.length >= max) break
    }
    if (items.length < 500) break
  }
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from('outreach_prospects').upsert(rows.slice(i, i + 500), { onConflict: 'company_number', ignoreDuplicates: true })
    if (error) throw new Error(error.message)
  }
  return { added: rows.length, matched, already, excluded }
}

/** Is this organisation on the register under (near enough) this name? Free. */
export async function confirmOnRegister(name: string): Promise<{ company_number: string; form: string; corporate: boolean; town: string | null; district: string | null } | null> {
  if (!companiesHouseReady()) return null
  const want = nameWords(name).join(' ')
  if (!want) return null
  const page = await ch(`/search/companies?q=${encodeURIComponent(tidy(name, 120))}&items_per_page=8`).catch(() => null)
  type Hit = { title?: string; company_number?: string; company_type?: string; company_status?: string; address?: { locality?: string; postal_code?: string } }
  const hit = ((page?.items as Hit[]) || []).find(h => h.company_status === 'active' && nameWords(String(h.title || '')).join(' ') === want)
  if (!hit?.company_number) return null
  const lf = legalFormOf(String(hit.company_type || ''))
  return { company_number: hit.company_number, form: lf.form, corporate: lf.corporate, town: tidy(hit.address?.locality, 80) || null, district: districtOf(hit.address?.postal_code) }
}

// ── The organisation's own website ───────────────────────────────────────────
const LEGAL_WORDS = /^(ltd|limited|llp|plc|cic|cio|co|company|the|uk|and|of|gb|group|holdings)$/
/** The words that make the name this organisation's own. */
export function nameWords(name: string): string[] {
  return name.toLowerCase().replace(/&/g, ' and ').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(w => w && !LEGAL_WORDS.test(w))
}

/**
 * Likely web addresses for a name, most likely first.
 *
 * A company's registered name is its formal one — "Bracknell Lawn Tennis Club
 * Limited" — and its web address is what people call it: bracknellltc.co.uk,
 * bracknelltennis.co.uk. So as well as the name run together, this tries the
 * usual shortenings. Guessing is safe because a guess is never trusted: the
 * page at that address still has to show it belongs to this organisation.
 */
export function guessDomains(name: string): string[] {
  const words = nameWords(name)
  const stems = new Set<string>()
  const add = (ws: string[]) => { const j = ws.join(''); if (j.length >= 6 && j.length <= 40) stems.add(j) }
  add(words)
  const text = ' ' + words.join(' ') + ' '
  const swap = (from: string, to: string) => { if (text.includes(` ${from} `)) add(text.replace(` ${from} `, ` ${to} `).trim().split(' ').filter(Boolean)) }
  swap('lawn tennis club', 'ltc'); swap('lawn tennis club', 'tennis club'); swap('lawn tennis club', 'tennis')
  swap('lawn tennis and croquet club', 'ltcc'); swap('tennis club', 'tc'); swap('tennis club', 'tennis')
  swap('lawn tennis', 'tennis')
  swap('tennis squash club', 'tennis'); swap('squash tennis club', 'tennis'); swap('tennis racquet club', 'tennis'); swap('tennis racquets club', 'tennis'); swap('tennis academy', 'tennis'); swap('tennis coaching', 'tennis')
  // "Boom Tennis Coaching Ltd" trades at boomtennis.co.uk.
  if (words.length >= 3 && /^(coaching|academy|club|services|centre|center|school|foundation|group|company)$/.test(words[words.length - 1])) add(words.slice(0, -1))
  const out: string[] = []
  const list = [...stems].slice(0, 5)
  for (const tld of ['.co.uk', '.org.uk', '.com', '.uk']) for (const stem of list) out.push(stem + tld)
  if (words.length > 1 && words.join('-').length <= 45) out.push(`${words.join('-')}.co.uk`)
  return [...new Set(out)]
}

const isPrivateIp = (ip: string) => {
  if (net.isIPv6(ip)) return /^(::1?$|f[cd]|fe80|::ffff:)/i.test(ip)
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224 || (a === 100 && b >= 64 && b <= 127)
}
/** A public http(s) address — never something inside our own network. */
export async function publicUrl(raw: string): Promise<URL | null> {
  let u: URL
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) } catch { return null }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null
  const host = u.hostname.toLowerCase()
  if (!host.includes('.') || net.isIP(host) || /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid)$/.test(host)) return null
  if (u.port && !['80', '443'].includes(u.port)) return null
  try {
    // resolve4/6 rather than lookup: they do not queue behind Node's four
    // lookup threads, which matters when twenty guesses are checked at once.
    const found = await Promise.race([
      dns.resolve4(host).catch(() => dns.resolve6(host)),
      new Promise<never>((_r, rej) => setTimeout(() => rej(new Error('dns timeout')), 6000)),
    ])
    if (!found.length || found.some(a => isPrivateIp(a))) return null
  } catch { return null }
  return u
}

// Says plainly who is asking, in the form websites expect from an honest robot.
const UA = 'Mozilla/5.0 (compatible; LumioOutreach/1.0; +https://lumiosports.com)'
/**
 * Fetch one public web page as text, saying why when it cannot. Follows a few
 * redirects, checking each hop.
 */
export async function getPageWhy(raw: string): Promise<{ url: string; html: string } | { fail: string }> {
  let target = raw
  for (let hop = 0; hop < 4; hop++) {
    const u = await publicUrl(target)
    if (!u) return { fail: 'no such address' }
    let res: Response
    try {
      res = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(9000), headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-GB,en;q=0.8' } })
    } catch (e) {
      const cause = (e as { cause?: { code?: string } })?.cause?.code
      return { fail: (e as Error)?.name === 'TimeoutError' ? 'timed out' : cause || 'could not connect' }
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return { fail: `redirect with nowhere to go (${res.status})` }
      try { target = new URL(loc, u).toString() } catch { return { fail: 'bad redirect' } }
      continue
    }
    if (!res.ok) return { fail: res.status === 403 || res.status === 429 ? `refused us (${res.status})` : `error ${res.status}` }
    if (!/html|text\/plain/i.test(res.headers.get('content-type') || 'text/html')) return { fail: 'not a web page' }
    // Read at most ~1.5MB. Site-builder pages (Wix, Squarespace) are routinely
    // 800KB of scripts with the contact email somewhere in the middle.
    const reader = res.body?.getReader()
    if (!reader) return { fail: 'empty response' }
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value); size += value.length
        if (size > 1_500_000) { await reader.cancel().catch(() => { /* ignore */ }); break }
      }
    } catch { if (!chunks.length) return { fail: 'connection dropped' } }
    return { url: u.toString(), html: Buffer.concat(chunks).toString('utf8') }
  }
  return { fail: 'too many redirects' }
}
export async function getPage(raw: string): Promise<{ url: string; html: string } | null> {
  const r = await getPageWhy(raw)
  return 'fail' in r ? null : r
}

const textOf = (html: string) => html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;|&apos;/g, "'").replace(/\s+/g, ' ').toLowerCase()

const PARKED = /domain (is|may be) for sale|buy this domain|this domain (name )?(is|has been) (parked|registered)|domain parking|hugedomains|sedo\.com|dan\.com|afternic|parkingcrew|website coming soon|site is under construction|account (has been )?suspended|index of \//i

// A page that is a robot check rather than the site: "Just a moment…", a
// CAPTCHA, a hosting firewall. It arrives with a normal "200 OK", so it has to
// be recognised by what it says. We do not try to get past these. (Deliberately
// NOT matched: the word "captcha" or Cloudflare's script path, which sit on
// plenty of ordinary pages with a contact form.)
const CHALLENGE = /<title>\s*(just a moment|attention required|access denied|bot verification|verifying you are human|security check|one moment|please wait|robot check|403 forbidden|blocked)|checking your browser|enable javascript and cookies to continue|imunify360|sgcaptcha|ddos protection by/i

/** Where a "this site lives over there" stub points: a meta refresh, a full-page frame, or a script redirect. */
export function stubTarget(html: string, base: string): string | null {
  if (html.length > 6000) return null                                   // a real page, not a stub
  const m = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>\s]+)/i)
    || html.match(/<i?frame[^>]+src=["']([^"']+)["']/i)
    || html.match(/(?:window\.|document\.|top\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i)
    || html.match(/location\.replace\(\s*["']([^"']+)["']/i)
  if (!m) return null
  try { const u = new URL(m[1].replace(/&amp;/g, '&'), base); return /^https?:$/.test(u.protocol) && u.toString() !== base ? u.toString() : null } catch { return null }
}

/** A few words on what a rejected page actually was, for the list. */
function describe(html: string): string {
  const title = (html.match(/<title[^>]*>([^<]{0,80})/i)?.[1] || '').replace(/\s+/g, ' ').trim()
  if (PARKED.test(html.slice(0, 60_000))) return 'parked or for sale'
  if (CHALLENGE.test(html.slice(0, 20_000))) return `a robot check, not the site${title ? ` (“${title}”)` : ''}`
  return `not recognised as theirs${title ? ` (titled “${title}”)` : ' (no title)'}, ${html.length < 1000 ? `${html.length} bytes` : `${Math.round(html.length / 1000)}KB`}`
}

// Words that describe what an organisation does rather than which one it is.
const TOPIC_WORDS = /^(tennis|lawn|club|clubs|ltc|tc|coaching|coach|academy|school|centre|center|sports?|squash|racquets?|rackets|padel|pickleball|services|community|association|performance|training|fitness|leisure|foundation)$/

/** The page's words: visible text plus its title and description (site builders put little else in the HTML). */
function pageWords(html: string): string {
  const meta = [...html.matchAll(/<meta[^>]+(?:name|property)="(?:description|og:title|og:description|og:site_name)"[^>]*content="([^"]*)"/gi)].map(m => m[1]).join(' ')
  return `${textOf(html)} ${meta.toLowerCase()}`
}

/**
 * Does this page belong to the organisation with this name?
 *
 * `guess` is the address we tried, when we made it up from the name. That
 * matters, because the address is itself evidence: mptennis.co.uk IS "MP Tennis"
 * run together, even though the page calls itself "Matthew Perry Tennis" and
 * never prints the letters "MP". Demanding the registered name in the page's
 * text — the first version of this — threw away nearly every real match.
 *
 *   exact address   the whole name run together is the address → the page only
 *                   has to be a real site about the same thing (one of the
 *                   name's own words on it, e.g. "tennis")
 *   shortened one   bracknelltennis.co.uk for "Bracknell Lawn Tennis Club" →
 *                   the words that make the name theirs ("bracknell") must be
 *                   on the page too
 *
 * A parked or for-sale domain is never theirs, and a .com must also look British.
 */
export function pageIsTheirs(html: string, url: string, p: { org_name: string; town?: string | null; district?: string | null; company_number?: string | null }, guess?: string): boolean {
  if (PARKED.test(html.slice(0, 60_000)) || CHALLENGE.test(html.slice(0, 20_000))) return false
  const text = pageWords(html)
  if (text.trim().length < 40) return false                            // an empty shell or a redirect stub
  const words = nameWords(p.org_name)
  if (!words.length) return false
  const has = (ws: string[]) => ws.length > 0 && ws.every(w => new RegExp(`\\b${w}\\b`).test(text))
  const squashed = text.replace(/[^a-z0-9]+/g, '')

  // Clubs shorten themselves: "Bracknell Lawn Tennis Club" is "Bracknell LTC" on its own site.
  const short = words.join(' ').replace(/\blawn tennis club\b/, 'ltc').replace(/\btennis club\b/, 'tc').split(' ')
  const nolawn = words.filter(w => w !== 'lawn')
  const fullName = has(words) || squashed.includes(words.join('')) || (short.length < words.length && short.length >= 2 && has(short)) || (nolawn.length < words.length && nolawn.length >= 3 && has(nolawn))

  const stem = (guess || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').replace(/\.(co\.uk|org\.uk|com|uk|org)$/, '')
  const exactAddress = !!stem && (stem === words.join('') || stem === words.join('-'))
  const own = words.filter(w => !TOPIC_WORDS.test(w))                   // "bracknell", "hotshots"
  const topical = words.some(w => w.length >= 4 && new RegExp(`\\b${w}`).test(text))

  const named = fullName
    || (exactAddress && topical)
    || (!!stem && own.length > 0 && has(own) && topical)
  if (!named) return false
  if (p.company_number && text.includes(p.company_number.toLowerCase())) return true
  // A .uk address is British. A .com could be a company of the same name in
  // another country, so it must also look British.
  if (/\.uk$/i.test(new URL(url).hostname)) return true
  // "LTC" and "lawn tennis" are British usages in themselves; so are a UK
  // phone number, a link to a .uk site, and a ClubSpark booking page.
  return /\b[a-z]{1,2}\d[a-z\d]? ?\d[a-z]{2}\b/.test(text) || /\+44|united kingdom|\bengland\b|\bscotland\b|\bwales\b|\blta\b|\buk\b|£\s?\d|\bltc\b|lawn tennis|\b0\d{3,4}[ -]?\d{3}[ -]?\d{3,4}\b/.test(text)
    || /ltc$|lawntennis/.test(stem) || /https?:\/\/[a-z0-9.-]+\.uk[\/"']|clubspark/i.test(html.slice(0, 400_000))
    || (!!p.town && text.includes(p.town.toLowerCase())) || (!!p.district && text.includes(p.district.toLowerCase() + ' '))
}

const JUNK_DOMAIN = /(^|\.)(example\.(com|org|co\.uk)|domain\.com|email\.com|yourdomain\.[a-z.]+|sentry\.io|sentry-next\.wixpress\.com|wixpress\.com|wix\.com|squarespace\.com|godaddy\.com|schema\.org|w3\.org|google\.com|gstatic\.com|cloudflare\.com|jquery\.com|wordpress\.(com|org)|gravatar\.com|facebook\.com|instagram\.com|sentry\.wixpress\.com|clubspark\.(uk|net|com)|lta\.org\.uk)$/i
const JUNK_LOCAL = /^(you|your|name|email|user|username|someone|example|test|firstname|first\.last|noreply|no-reply|donotreply|do-not-reply|mailer-daemon|postmaster|abuse|privacy|dpo|webmaster|hostmaster|wordpress|u00[0-9a-f]{2}.*)$/i
const ROLE_LOCAL = /^(info|hello|contact|enquir|inquir|admin|office|coaching|coach|bookings?|reception|tennis|club|team|mail|secretary|manager|academy|membership|play|hi)\b/i

/** Cloudflare hides addresses as data-cfemail="hex"; the first byte is the key. */
function cfDecode(hex: string): string {
  try {
    const k = parseInt(hex.slice(0, 2), 16)
    let out = ''
    for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ k)
    return out
  } catch { return '' }
}

/** The public contact emails on a page, best first. */
export function emailsOn(html: string, siteHost: string): string[] {
  const found = new Map<string, number>()          // email → score
  const site = siteHost.toLowerCase().replace(/^www\./, '')
  const add = (raw: string, bonus = 0) => {
    const e = raw.trim().toLowerCase().replace(/^mailto:/, '').split('?')[0].replace(/[.,;:)\]>]+$/, '')
    const m = e.match(/^([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})$/)
    if (!m || e.length > 100) return
    const [, local, domain] = m
    if (JUNK_DOMAIN.test(domain) || JUNK_LOCAL.test(local)) return
    if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(domain) || /^\d+x\d*$/.test(local)) return   // "logo@2x.png"
    const score = bonus + (domain === site || domain.endsWith('.' + site) || site.endsWith('.' + domain) ? 4 : 0) + (ROLE_LOCAL.test(local) ? 2 : 0)
    found.set(e, Math.max(found.get(e) ?? -1, score))
  }
  const decoded = html.replace(/&#(\d+);/g, (_m, d: string) => String.fromCharCode(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCharCode(parseInt(h, 16))).replace(/%40/g, '@')
  for (const m of decoded.matchAll(/mailto:([^"'<>\s?]+)/gi)) add(m[1], 1)
  for (const m of decoded.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) add(cfDecode(m[1]), 1)
  for (const m of decoded.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) add(m[0])
  return [...found.entries()].sort((a, b) => b[1] - a[1]).map(([e]) => e)
}

/** Read a site's home page, then its contact / about pages, for a contact email. */
export async function emailFromSite(home: { url: string; html: string }): Promise<string | null> {
  const host = new URL(home.url).hostname
  const first = emailsOn(home.html, host)
  if (first.length) return first[0]
  const links = new Set<string>()
  for (const m of home.html.matchAll(/href="([^"#]+)"/gi)) {
    if (!/contact|get-in-touch|getintouch|about|find-us|enquir/i.test(m[1])) continue
    try { const u = new URL(m[1], home.url); if (u.hostname === host && /^https?:$/.test(u.protocol)) links.add(u.toString()) } catch { /* not a link */ }
    if (links.size >= 3) break
  }
  if (!links.size) { links.add(new URL('/contact', home.url).toString()); links.add(new URL('/contact-us', home.url).toString()) }
  for (const link of [...links].slice(0, 3)) {
    const page = await getPage(link)
    const got = page ? emailsOn(page.html, host) : []
    if (got.length) return got[0]
  }
  return null
}

/**
 * The free look for one prospect: use the website we already have, or guess it
 * from the name; confirm it is theirs; read the contact email from it.
 *
 * `why` says where it stopped, so a run that finds nothing can be told apart
 * from a run that is broken:
 *   no_site     none of the likely addresses has a website
 *   not_theirs  there is a website at that address, but it is somebody else's
 *   no_email    their website, with no email address published on it
 *   found       their website and an email
 */
export type FreeLook = { website: string | null; email: string | null; segment: Segment | null; why: 'found' | 'no_email' | 'not_theirs' | 'no_site'; detail?: string }
export async function lookUpFree(p: Pick<Prospect, 'org_name' | 'town' | 'district' | 'company_number' | 'website'>): Promise<FreeLook> {
  let tries = p.website ? [p.website] : guessDomains(p.org_name)
  const guessed = tries.length
  if (!p.website) {
    // Ask the name service about every guess at once (quick, and most do not
    // exist), then only fetch the few that are real addresses.
    const live = await Promise.all(tries.map(async t => (await publicUrl(t)) ? t : null))
    tries = live.filter((t): t is string => !!t).slice(0, 6)
  }
  let sawSomething = false
  const seen: string[] = []                 // what happened at each address, for the list
  for (const t of tries) {
    // Small clubs' sites are sometimes http-only, or have a broken certificate.
    let page = await getPageWhy(t)
    if ('fail' in page && !/^https?:/i.test(t)) { const plain = await getPageWhy(`http://${t}`); if (!('fail' in plain)) page = plain }
    if ('fail' in page) { seen.push(`${t}: ${page.fail}`); continue }
    sawSomething = true
    // A club's own address is often just a signpost to where its site really
    // lives (a ClubSpark page, a Facebook page). Follow the signpost once: the
    // owner of the address chose where it points, so that page is theirs.
    const onward = p.website ? null : stubTarget(page.html, page.url)
    if (onward) {
      const there = await getPageWhy(onward)
      if (!('fail' in there) && !PARKED.test(there.html.slice(0, 60_000)) && !CHALLENGE.test(there.html.slice(0, 20_000)) && pageIsTheirs(there.html, 'https://x.uk/', p, t)) {
        const email = await emailFromSite(there)
        return { website: there.url.replace(/[?#].*$/, ''), email, segment: segmentFromPage(there.html), why: email ? 'found' : 'no_email' }
      }
    }
    // A website someone gave us is taken as theirs unless it is plainly a
    // parked page; a guessed one has to prove it.
    if (p.website ? PARKED.test(page.html.slice(0, 60_000)) : !pageIsTheirs(page.html, page.url, p, t)) { seen.push(`${t}: ${describe(page.html)}`); continue }
    const site = new URL(page.url).origin
    const email = await emailFromSite(page)
    return { website: site, email, segment: segmentFromPage(page.html), why: email ? 'found' : 'no_email' }
  }
  return {
    website: p.website || null, email: null, segment: null, why: sawSomething ? 'not_theirs' : 'no_site',
    detail: p.website ? seen.join('; ') : seen.length ? seen.slice(0, 4).join('; ') : `none of ${guessed} likely addresses exists`,
  }
}

const WHY_NOTE: Record<FreeLook['why'], string> = {
  found: '', no_email: 'Their website has no email address on it.',
  not_theirs: 'Found a website, but not theirs',
  no_site: 'No website found',
}

/**
 * Can this server load a web page at all? Checked before each batch, because
 * the alternative is what happened the first time: six hundred prospects
 * quietly marked "nothing found" when the looking itself was what had failed.
 */
async function canBrowse(): Promise<string | null> {
  let last = 'unknown'
  // Two well-known sites, so one of them being down is not mistaken for us being offline.
  for (const probe of ['https://example.com/', 'https://www.gov.uk/']) {
    const r = await getPageWhy(probe)
    if (!('fail' in r)) return null
    last = r.fail
  }
  return last
}

/** Run the free look over the next few prospects that have not had one. */
export async function freeLookBatch(size = 6) {
  const sb = db()
  const { data } = await sb.from('outreach_prospects').select('*').eq('state', 'new').order('created_at').order('id').limit(Math.max(1, Math.min(10, size)))
  const batch = (data || []) as Prospect[]
  if (batch.length) {
    const blocked = await canBrowse()
    if (blocked) throw new Error(`The server could not load a test web page (${blocked}), so nothing was looked up and nothing has been marked. This is a server network problem, not a problem with the list.`)
  }
  const tally = { found: 0, no_email: 0, not_theirs: 0, no_site: 0 }
  await Promise.all(batch.map(async p => {
    const r = await lookUpFree(p).catch((): FreeLook => ({ website: p.website, email: null, segment: null, why: 'no_site' }))
    tally[r.why]++
    const sic = (p.notes || '').match(/^SIC [\d, ]+/)?.[0] || ''
    await sb.from('outreach_prospects').update({
      website: r.website, email: r.email, state: r.email ? 'found' : 'no_email', updated_at: new Date().toISOString(),
      // What their own site says they are beats what their name suggests.
      ...(r.segment ? { segment: r.segment } : {}),
      notes: [sic, [WHY_NOTE[r.why], r.detail].filter(Boolean).join(' — ')].filter(Boolean).join(' · ').slice(0, 600) || null,
    }).eq('id', p.id).eq('state', 'new')
  }))
  const { count } = await sb.from('outreach_prospects').select('id', { count: 'exact', head: true }).eq('state', 'new')
  return { checked: batch.length, found: tally.found, tally, left: count ?? 0 }
}

/** Work out again, from the name and activity code, which kind each waiting prospect is. Free. */
export async function resortProspects() {
  const sb = db()
  const { data } = await sb.from('outreach_prospects').select('id, org_name, segment, notes').in('state', ['new', 'no_email', 'nothing']).limit(20000)
  const moves: Record<Segment, string[]> = { academy: [], venue: [], coach: [] }
  for (const p of (data || []) as { id: string; org_name: string; segment: Segment; notes: string | null }[]) {
    const sic = ((p.notes || '').match(/^SIC ([\d, ]+)/)?.[1] || '').split(/[, ]+/).filter(Boolean)
    const seg = segmentFromName(p.org_name, sic)
    if (seg !== p.segment) moves[seg].push(p.id)
  }
  for (const seg of SEGMENTS) for (let i = 0; i < moves[seg].length; i += 300) {
    await sb.from('outreach_prospects').update({ segment: seg, updated_at: new Date().toISOString() }).in('id', moves[seg].slice(i, i + 300))
  }
  return { moved: moves.academy.length + moves.venue.length + moves.coach.length, total: (data || []).length }
}

/** Give the ones the free look found nothing for another go (after the look-up has been improved). Free. */
export async function retryFree() {
  const { data, error } = await db().from('outreach_prospects').update({ state: 'new', updated_at: new Date().toISOString() }).eq('state', 'no_email').eq('searched_paid', false).is('email', null).select('id')
  if (error) throw new Error(error.message)
  return { reset: (data || []).length }
}

/**
 * Prospects with an email become outreach contacts — under exactly the rules a
 * spreadsheet import follows: nobody twice, nobody who unsubscribed or bounced,
 * and anything not confirmed as a company is added HELD, not ready to send.
 */
export async function addProspects(ids?: string[]) {
  const sb = db()
  let q = sb.from('outreach_prospects').select('*').eq('state', 'found').not('email', 'is', null).limit(5000)
  if (ids?.length) q = q.in('id', ids.slice(0, 5000))
  const { data } = await q
  const list = (data || []) as Prospect[]
  if (!list.length) return { added: 0, held: 0, dupes: 0, suppressed: 0 }
  const [{ data: supp }, { data: have }] = await Promise.all([
    sb.from('outreach_suppressions').select('email'),
    sb.from('outreach_contacts').select('email').limit(50000),
  ])
  const blocked = new Set((supp || []).map(s => s.email as string))
  const existing = new Set((have || []).map(s => String(s.email).toLowerCase()))
  const rows: Record<string, unknown>[] = [], done: string[] = [], skipped: string[] = []
  let held = 0, dupes = 0, suppressed = 0
  for (const p of list) {
    const email = String(p.email).trim().toLowerCase()
    if (blocked.has(email)) { suppressed++; skipped.push(p.id); continue }
    if (existing.has(email)) { dupes++; done.push(p.id); continue }
    existing.add(email)
    const ok = p.corporate_ok && (!!p.company_number || looksCorporate(p.legal_form))
    if (!ok) held++
    rows.push({
      email, org_name: p.org_name, segment: toSeg(p.segment), legal_form: p.legal_form, corporate_ok: ok, basis: 'b2b',
      website: p.website, source: p.source, notes: p.company_number ? `Companies House ${p.company_number}` : null,
    })
    done.push(p.id)
  }
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from('outreach_contacts').insert(rows.slice(i, i + 500))
    if (error) throw new Error(error.message)
  }
  const now = new Date().toISOString()
  for (let i = 0; i < done.length; i += 300) await sb.from('outreach_prospects').update({ state: 'added', updated_at: now }).in('id', done.slice(i, i + 300))
  for (let i = 0; i < skipped.length; i += 300) await sb.from('outreach_prospects').update({ state: 'dismissed', notes: 'Unsubscribed or bounced before', updated_at: now }).in('id', skipped.slice(i, i + 300))
  return { added: rows.length, held, dupes, suppressed }
}
