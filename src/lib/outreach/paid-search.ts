// Finding contacts — the PAID half.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ Everything in this file costs money each time it runs.                   │
// │                                                                          │
// │ It must only ever be reached from a button an admin has just pressed.    │
// │ It is not imported by any cron route, is never run on a timer, and the   │
// │ API route that calls it refuses unless the request carries the admin's   │
// │ explicit confirmation. Do not call these functions from anywhere else.   │
// └──────────────────────────────────────────────────────────────────────────┘
//
// What it does: asks Claude, with its web search tool, the two questions the
// free steps cannot answer — "what is this organisation's website?" and "which
// organisations match this description?". Reading the website for an email is
// then done by the free code in prospect.ts, so the paid part stays as small
// as it can be.
//
// Every call is written to outreach_spend with what it actually cost, and the
// monthly limit in Settings is checked before each one.

import Anthropic from '@anthropic-ai/sdk'
import { db, type Segment } from '@/lib/outreach/core'
import { confirmOnRegister, emailsOn, getPage, lookUpFree, nameWords, publicUrl, type Prospect } from '@/lib/outreach/prospect'

export const paidSearchReady = () => !!process.env.ANTHROPIC_API_KEY
const MODEL = () => process.env.OUTREACH_SEARCH_MODEL || 'claude-sonnet-4-6'
// US dollars per million tokens [input, output]. Used to record what a call
// cost; the bill itself comes from Anthropic.
const PRICE: Record<string, [number, number]> = { 'claude-sonnet-4-6': [3, 15], 'claude-sonnet-4-5': [3, 15], 'claude-haiku-4-5': [1, 5], 'claude-sonnet-5': [2, 10] }
const PER_SEARCH = 0.01                                   // $10 per 1,000 searches
/** Used for the estimate shown before the button is pressed, until there is real history. */
export const GUESS_LOOKUP_USD = 0.06
export const GUESS_DISCOVER_USD = 0.4

type Usage = { input_tokens?: number | null; output_tokens?: number | null; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null; server_tool_use?: { web_search_requests?: number | null } | null }
function costOf(model: string, u: Usage) {
  const [pin, pout] = PRICE[Object.keys(PRICE).find(k => model.startsWith(k)) || ''] || [3, 15]
  const input = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0)
  const output = u.output_tokens || 0
  const searches = u.server_tool_use?.web_search_requests || 0
  return { input, output, searches, usd: Math.round((input * pin / 1e6 + output * pout / 1e6 + searches * PER_SEARCH) * 10000) / 10000 }
}

/** This calendar month's paid-search spend and the limit, in US dollars. */
export async function spendThisMonth() {
  const sb = db()
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0)
  const [{ data: rows }, { data: s }] = await Promise.all([
    sb.from('outreach_spend').select('kind, cost_usd').gte('created_at', start.toISOString()).limit(20000),
    sb.from('outreach_settings').select('search_cap_usd').eq('id', 1).maybeSingle(),
  ])
  const list = (rows || []) as { kind: string; cost_usd: number | string }[]
  const sum = (k?: string) => list.filter(r => !k || r.kind === k).reduce((n, r) => n + Number(r.cost_usd || 0), 0)
  const lookups = list.filter(r => r.kind === 'lookup'), discovers = list.filter(r => r.kind === 'discover')
  return {
    spent: Math.round(sum() * 100) / 100,
    cap: Number(s?.search_cap_usd ?? 20),
    // What one of each has really been costing, once there are a few to go on.
    perLookup: lookups.length >= 5 ? sum('lookup') / lookups.length : GUESS_LOOKUP_USD,
    perDiscover: discovers.length >= 2 ? sum('discover') / discovers.length : GUESS_DISCOVER_USD,
  }
}

async function ask(kind: 'lookup' | 'discover', prompt: string, searches: number, maxTokens: number, note: string): Promise<string> {
  const model = MODEL()
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await client.messages.create({
    model, max_tokens: maxTokens,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: searches, user_location: { type: 'approximate', country: 'GB' } }],
    messages: [{ role: 'user', content: prompt }],
  })
  const c = costOf(model, res.usage as Usage)
  // Recorded whatever the answer turns out to be — the search has been paid for.
  await db().from('outreach_spend').insert({ kind, searches: c.searches, input_tokens: c.input, output_tokens: c.output, cost_usd: c.usd, note: note.slice(0, 200) })
  return res.content.map(b => b.type === 'text' ? b.text : '').join('')
}

const jsonIn = (text: string, open: '{' | '['): unknown => {
  const close = open === '{' ? '}' : ']'
  const a = text.indexOf(open), b = text.lastIndexOf(close)
  if (a < 0 || b <= a) return null
  try { return JSON.parse(text.slice(a, b + 1)) } catch { return null }
}

/**
 * PAID. One web search for one organisation's website, then the free reader
 * looks on that site for the contact email.
 *
 * An email is only accepted as "found" when our own server has seen it on the
 * organisation's pages. One the search merely suggests is kept as "unsure" for
 * a person to accept or throw away — a made-up address must never reach the
 * send list.
 */
export async function paidLookup(p: Prospect): Promise<{ state: Prospect['state']; email: string | null; website: string | null }> {
  const text = await ask('lookup', [
    `Find the official website of this UK organisation and, if it publishes one, its public contact email address.`,
    `Organisation: ${p.org_name}${p.town ? `, ${p.town}` : ''}${p.company_number ? ` (Companies House number ${p.company_number})` : ''}.`,
    p.website ? `Its website is believed to be ${p.website} — confirm it, and look for the email there or elsewhere on the web.` : '',
    p.source ? `How we came across it: ${p.source}.` : '',
    `Rules: only its OWN website — not a directory, social network, Companies House, or a listing site. Only an email the organisation itself publishes for enquiries. If you are not sure the site belongs to this exact organisation, say null. Never guess or construct an email address.`,
    `Reply with JSON only: {"website": "https://…" or null, "email": "…" or null, "email_seen_at": "the page URL where that email appears" or null}`,
  ].filter(Boolean).join('\n'), 1, 400, p.org_name)
  const ans = (jsonIn(text, '{') || {}) as { website?: unknown; email?: unknown; email_seen_at?: unknown }
  const site = typeof ans.website === 'string' && await publicUrl(ans.website) ? new URL(/^https?:/i.test(ans.website) ? ans.website : `https://${ans.website}`).origin : null
  const suggested = typeof ans.email === 'string' ? (ans.email.trim().toLowerCase().match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/) || [])[0] || null : null

  // Free from here on: read their site ourselves.
  const free = site ? await lookUpFree({ ...p, website: site }).catch(() => ({ website: site, email: null as string | null })) : { website: null, email: null }
  if (free.email) return { state: 'found', email: free.email, website: free.website }
  if (suggested) {
    // Did the page it named really show that address?
    const where = typeof ans.email_seen_at === 'string' ? await getPage(ans.email_seen_at) : null
    const host = site ? new URL(site).hostname : where ? new URL(where.url).hostname : ''
    if (where && emailsOn(where.html, host).includes(suggested)) return { state: 'found', email: suggested, website: site }
    return { state: 'unsure', email: suggested, website: site }
  }
  return { state: 'nothing', email: null, website: site }
}

/** PAID. Run paid look-ups over a few prospects, stopping at the monthly limit. */
export async function paidLookupBatch(o: { size: number; ids?: string[] }) {
  const sb = db()
  let q = sb.from('outreach_prospects').select('*').eq('state', 'no_email').eq('searched_paid', false).order('created_at').limit(Math.max(1, Math.min(4, o.size)))
  if (o.ids?.length) q = q.in('id', o.ids.slice(0, 500))
  const { data } = await q
  const batch = (data || []) as Prospect[]
  const money = await spendThisMonth()
  if (money.cap <= 0) return { done: 0, found: 0, unsure: 0, left: 0, stopped: 'Paid search is switched off (the monthly limit is $0).' }
  if (money.spent + money.perLookup * batch.length > money.cap) {
    return { done: 0, found: 0, unsure: 0, left: batch.length, stopped: `The monthly paid-search limit of $${money.cap.toFixed(2)} has been reached ($${money.spent.toFixed(2)} spent). Raise it in the box below if you want to carry on.` }
  }
  let found = 0, unsure = 0
  await Promise.all(batch.map(async p => {
    // Marked first, so a prospect is never paid for twice even if this run dies half way.
    await sb.from('outreach_prospects').update({ searched_paid: true }).eq('id', p.id)
    const r = await paidLookup(p).catch(e => { console.error('[outreach/paid] lookup', p.org_name, e); return null })
    if (!r) return
    if (r.state === 'found') found++
    if (r.state === 'unsure') unsure++
    await sb.from('outreach_prospects').update({
      state: r.state, email: r.email, website: r.website || p.website, updated_at: new Date().toISOString(),
      notes: r.state === 'unsure' ? 'Email suggested by web search — not seen on their website. Check before using.' : p.notes,
    }).eq('id', p.id)
  }))
  let left = sb.from('outreach_prospects').select('id', { count: 'exact', head: true }).eq('state', 'no_email').eq('searched_paid', false)
  if (o.ids?.length) left = left.in('id', o.ids.slice(0, 500))
  const { count } = await left
  return { done: batch.length, found, unsure, left: count ?? 0, stopped: '' }
}

/**
 * PAID. Search the web for organisations matching a description and add the new
 * ones as prospects. Each is then checked against Companies House (free): on
 * the register → confirmed as a company; not on it → kept, but it will be HELD
 * when added, because a club that is not a company may not be cold emailed.
 */
export async function paidDiscover(o: { description: string; segment: Segment; count: number }) {
  const want = Math.max(3, Math.min(25, Math.round(o.count) || 15))
  const money = await spendThisMonth()
  if (money.cap <= 0) throw new Error('Paid search is switched off (the monthly limit is $0).')
  if (money.spent + money.perDiscover > money.cap) throw new Error(`The monthly paid-search limit of $${money.cap.toFixed(2)} has been reached ($${money.spent.toFixed(2)} spent).`)
  const sb = db()
  const [{ data: have }, { data: contacts }] = await Promise.all([
    sb.from('outreach_prospects').select('org_name').limit(50000),
    sb.from('outreach_contacts').select('org_name').limit(50000),
  ])
  const key = (n: unknown) => nameWords(String(n ?? '')).join(' ')
  const seen = new Set([...(have || []), ...(contacts || [])].map(r => key(r.org_name)).filter(Boolean))
  const text = await ask('discover', [
    `Search the web for organisations in the United Kingdom matching this description:`,
    `"${o.description.replace(/\s+/g, ' ').trim().slice(0, 400)}"`,
    `List up to ${want} real organisations — companies, clubs, academies, charities, operators. NOT individual people, NOT directories or governing bodies.`,
    seen.size ? `Skip any of these, which we already have: ${[...seen].slice(0, 150).join('; ')}.` : '',
    `Reply with JSON only: [{"name": "the organisation's name as it trades", "website": "https://…" or null, "town": "…" or null}]`,
  ].filter(Boolean).join('\n'), 4, 1800, o.description)
  const list = (Array.isArray(jsonIn(text, '[')) ? jsonIn(text, '[') : []) as { name?: unknown; website?: unknown; town?: unknown }[]
  const rows: Record<string, unknown>[] = []
  let already = 0
  for (const it of list.slice(0, want)) {
    const name = String(it.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 200)
    if (!name || !key(name)) continue
    if (seen.has(key(name))) { already++; continue }
    seen.add(key(name))
    const reg = await confirmOnRegister(name).catch(() => null)
    const site = typeof it.website === 'string' && await publicUrl(it.website) ? new URL(/^https?:/i.test(it.website) ? it.website : `https://${it.website}`).origin : null
    rows.push({
      org_name: name, company_number: reg?.company_number ?? null, legal_form: reg?.form ?? 'Unknown', corporate_ok: !!reg?.corporate,
      town: reg?.town || (typeof it.town === 'string' ? it.town.trim().slice(0, 80) : null) || null, district: reg?.district ?? null,
      segment: o.segment, website: site, source: `Web search: “${o.description.replace(/\s+/g, ' ').trim().slice(0, 80)}”`,
    })
  }
  let added = 0
  for (const r of rows) {
    // One at a time: a company number we already hold must not sink the rest.
    const { error } = await sb.from('outreach_prospects').insert(r)
    if (!error) added++
  }
  return { added, already, onRegister: rows.filter(r => r.corporate_ok).length }
}
