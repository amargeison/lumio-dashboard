// Impact Leads: cross-org isolation and the three routes, end to end.
//
// Proves an HQ can't read or change another org's leads, that browser sessions
// can't write hook tokens, and that the import, hook and inbound routes keep rows
// in the right org. Sets up two throwaway orgs and HQ logins, runs as those users
// against a running app, then deletes everything. Touches no real org.
//
// Run:  BASE=http://localhost:3000 node scripts/impact-leads-security-test.mjs
// Env comes from .env.local. The rate-limit check runs only against localhost,
// because it makes 121 requests.

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

// lead-actions.ts uses extensionless imports, which node can't resolve alone.
registerHooks({
  resolve(spec, ctx, next) {
    const base = spec.startsWith('./') && ctx.parentURL?.includes('/src/') ? fileURLToPath(new URL(spec, ctx.parentURL)) : null
    return base && existsSync(`${base}.ts`) ? next(pathToFileURL(`${base}.ts`).href, ctx) : next(spec, ctx)
  },
})
const { fundedPlan, markSchoolFunded, partnerWithNewSchool, partnerWithSchool, recordFunding } = await import('../src/lib/impact/lead-actions.ts')
const { adjustStock, issuePack, loadPacks, receiveStock, recordPayment, returnItem, saveBooklet, saveItem, setChildSize } = await import('../src/lib/impact/pack-actions.ts')

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '') }
} catch { /* ignore */ }

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '')
if (!SB || !KEY || !ANON) { console.error('Missing Supabase env'); process.exit(2) }

const admin = createClient(SB, KEY, { auth: { persistSession: false } })
const anon = createClient(SB, ANON, { auth: { persistSession: false } })
const tag = `sectest-${Date.now()}`
let pass = 0, fail = 0
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name, detail) } }

// A real HQ session for a throwaway user: no password, and generateLink sends no email.
async function hq(letter) {
  const email = `${tag}_${letter}@lumio.test`
  const { data: { user }, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  const slug = `${tag}-${letter}`
  const profile = await admin.from('sports_profiles').upsert({ id: user.id, sport: 'impact', display_name: slug, portal_slug: slug })
  if (profile.error) throw profile.error
  const org = await admin.from('impact_orgs').insert({ slug, hq_id: user.id, settings: { org: slug } })
  if (org.error) throw org.error
  const jar = new Map()
  const db = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: all => all.forEach(c => jar.set(c.name, c.value)) } })
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkError) throw linkError
  const { error: otpError } = await db.auth.verifyOtp({ email, token: link.properties.email_otp, type: 'email' })
  if (otpError) throw otpError
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  const api = (path, init = {}) => fetch(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', cookie: cookie(), ...init.headers } })
  return { id: user.id, slug, db, api }
}

// A signed-in login with no org of its own: an invited coach or parent.
async function person(letter) {
  const email = `${tag}_${letter}@lumio.test`
  const { data: { user }, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  made.push({ id: user.id })
  const jar = new Map()
  const db = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: all => all.forEach(c => jar.set(c.name, c.value)) } })
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const { error: otpError } = await db.auth.verifyOtp({ email, token: link.properties.email_otp, type: 'email' })
  if (otpError) throw otpError
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  return { id: user.id, email, db, api: (path, init = {}) => fetch(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', cookie: cookie(), ...init.headers } }) }
}

const made = []
async function main() {
  const A = await hq('a'); made.push(A)
  const B = await hq('b'); made.push(B)

  console.log('\nRLS on impact_leads and impact_lead_events:')
  const { data: lead, error } = await A.db.from('impact_leads').insert({ hq_id: A.id, name: 'Lead A', pipeline: 'schools' }).select('id').single()
  ok('A can add its own lead', !error && lead, error?.message)
  const ev = await A.db.from('impact_lead_events').insert({ hq_id: A.id, lead_id: lead.id, kind: 'created' })
  ok('A can add its own event', !ev.error, ev.error?.message)
  ok('A reads its lead', (await A.db.from('impact_leads').select('id')).data?.length === 1)
  ok('B reads none of A’s leads', (await B.db.from('impact_leads').select('id')).data?.length === 0)
  ok('B reads none of A’s events', (await B.db.from('impact_lead_events').select('id')).data?.length === 0)
  ok('B can’t read A’s lead by id', (await B.db.from('impact_leads').select('id').eq('id', lead.id)).data?.length === 0)
  ok('anon reads nothing', (await anon.from('impact_leads').select('id')).data?.length === 0)
  ok('B can’t change A’s lead', (await B.db.from('impact_leads').update({ name: 'Hacked' }).eq('id', lead.id).select('id')).data?.length === 0)
  ok('B can’t delete A’s lead', (await B.db.from('impact_leads').delete().eq('id', lead.id).select('id')).data?.length === 0)
  ok('B can’t write a lead into A', !!(await B.db.from('impact_leads').insert({ hq_id: A.id, name: 'Planted' })).error)
  ok('B can’t write an event into A', !!(await B.db.from('impact_lead_events').insert({ hq_id: A.id, lead_id: lead.id, kind: 'note' })).error)
  ok('anon can’t add a lead', !!(await anon.from('impact_leads').insert({ hq_id: A.id, name: 'Planted' })).error)
  ok('A’s lead is untouched', (await admin.from('impact_leads').select('name').eq('id', lead.id).single()).data?.name === 'Lead A')

  console.log('\nImport route:')
  ok('signed out is refused', (await fetch(`${BASE}/api/impact/leads/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"rows":[{"name":"x"}]}' })).status === 401)
  const imported = await A.api('/api/impact/leads/import', { method: 'POST', body: JSON.stringify({ pipeline: 'funders', rows: [{ org_name: 'Fund One', amount: '£1,000', stage: 'Proposal sent', next_action_at: '2026-01-01' }, { notes: 'no name' }] }) })
  const body = await imported.json()
  ok('A’s rows come in, and the empty one is skipped', imported.status === 200 && body.added === 1 && body.skipped === 1, JSON.stringify(body))
  const row = (await admin.from('impact_leads').select('hq_id, pipeline, stage, amount_pence, next_action_at').eq('org_name', 'Fund One').eq('hq_id', A.id).maybeSingle()).data
  ok('the row is A’s, with stage, amount and follow-up', row?.pipeline === 'funders' && row?.stage === 'Proposal sent' && row?.amount_pence === 100000 && row?.next_action_at === '2026-01-01', JSON.stringify(row))
  ok('B can’t see it', (await B.db.from('impact_leads').select('id').eq('org_name', 'Fund One')).data?.length === 0)

  console.log('\nHook route and table:')
  ok('signed out is refused', (await fetch(`${BASE}/api/impact/leads/hook`)).status === 401)
  const none = await (await A.api('/api/impact/leads/hook')).json()
  ok('no address to start with', none.url === null, JSON.stringify(none))
  const hook = await (await A.api('/api/impact/leads/hook', { method: 'POST', body: '{}' })).json()
  ok('A gets an address', /\/api\/impact\/leads\/in\/[\w-]{16,}$/.test(hook.url || ''), JSON.stringify(hook))
  const again = await (await A.api('/api/impact/leads/hook', { method: 'POST', body: '{}' })).json()
  ok('asking again keeps the same address', again.url === hook.url)
  const inbound = `${BASE}${new URL(hook.url).pathname}`
  const token = inbound.split('/').pop()
  ok('A reads its own token', (await A.db.from('impact_lead_hooks').select('token')).data?.length === 1)
  ok('B reads no token', (await B.db.from('impact_lead_hooks').select('token')).data?.length === 0)
  ok('anon reads no token', (await anon.from('impact_lead_hooks').select('token')).data?.length === 0)
  ok('a session can’t change its token', !!(await A.db.from('impact_lead_hooks').update({ token: 'chosen-by-the-browser-1' }).eq('hq_id', A.id)).error)
  ok('a session can’t add a token', !!(await B.db.from('impact_lead_hooks').insert({ hq_id: B.id, token: 'chosen-by-the-browser-2' })).error)

  console.log('\nInbound route:')
  ok('a known address answers a GET', (await fetch(inbound)).status === 200)
  ok('an unknown address is a 404', (await fetch(`${BASE}/api/impact/leads/in/${'x'.repeat(24)}`, { method: 'POST', body: '{}' })).status === 404)
  ok('a malformed token is a 404', (await fetch(`${BASE}/api/impact/leads/in/short`)).status === 404)
  const post = payload => fetch(inbound, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json())
  const first = await post({ field_data: [{ name: 'full_name', values: ['Jo Hale'] }, { name: 'email', values: ['jo@school.example'] }, { name: 'school_name', values: ['Fernhill Primary'] }, { name: 'job_title', values: ['Headteacher'] }], campaign_name: 'Autumn schools' })
  ok('a Meta-shaped lead arrives', first.created === 1, JSON.stringify(first))
  const landed = (await admin.from('impact_leads').select('id, hq_id, stage, source, org_name, for_name').eq('email', 'jo@school.example').eq('hq_id', A.id).maybeSingle()).data
  ok('it’s at Enquired in A, with organisation and role', landed?.stage === 'Enquired' && landed?.source === 'Meta ad' && landed?.org_name === 'Fernhill Primary' && landed?.for_name === 'Headteacher', JSON.stringify(landed))
  ok('it has its history', (await admin.from('impact_lead_events').select('kind').eq('lead_id', landed?.id)).data?.[0]?.kind === 'created')
  const twice = await post({ full_name: 'Jo Hale', email: 'jo@school.example', message: 'Any news?' })
  ok('the same person again adds a note, not a card', twice.updated === 1 && twice.created === 0, JSON.stringify(twice))
  ok('B sees none of it', (await B.db.from('impact_leads').select('id')).data?.length === 0)
  const rotated = await (await A.api('/api/impact/leads/hook', { method: 'POST', body: '{"rotate":true}' })).json()
  ok('rotating gives a new address', rotated.url && rotated.url !== hook.url)
  ok('the old address stops working', (await fetch(inbound)).status === 404)

  console.log('\nWinning a lead, against the real tables:')
  const partnerLead = { name: 'Ama Bell', org_name: 'Bramblewood Primary', for_name: 'Headteacher', email: 'ama@b.example', phone: '0121 000' }
  const schoolId = await partnerWithNewSchool(A.db, A.id, partnerLead)
  const school = (await admin.from('tp_schools').select('hq_id, name, status, head_name, contact_email, contact_phone').eq('id', schoolId).single()).data
  ok('Partnered creates a confirmed school in A', school?.hq_id === A.id && school?.status === 'confirmed' && school?.head_name === 'Ama Bell' && school?.contact_email === 'ama@b.example' && school?.contact_phone === '0121 000', JSON.stringify(school))
  const enquiry = (await A.db.from('tp_schools').insert({ hq_id: A.id, name: 'Linked Primary', status: 'enquiry' }).select('id').single()).data
  await partnerWithSchool(A.db, A.id, { ...partnerLead, for_name: 'PE lead' }, enquiry.id)
  const linked = (await admin.from('tp_schools').select('status, pe_lead_name').eq('id', enquiry.id).single()).data
  ok('Partnered links an existing school and confirms it', linked?.status === 'confirmed' && linked?.pe_lead_name === 'Ama Bell', JSON.stringify(linked))
  let refused = false
  try { await partnerWithSchool(B.db, B.id, partnerLead, schoolId) } catch { refused = true }
  ok('B can’t link A’s school', refused)
  const funder = { name: 'Helen Cross', org_name: 'Wrenfield Fund', email: 'h@w.example', amount_pence: 500000, school_id: schoolId, campaign_id: null }
  const offer = fundedPlan(funder, [])
  const madeId = await recordFunding(A.db, A.id, funder, offer, '2026-11-05')
  const camp = (await admin.from('tp_fundraising_campaigns').select('hq_id, school_id, target_pence, status').eq('id', madeId).single()).data
  ok('Funded makes a campaign at target = amount', camp?.hq_id === A.id && camp?.school_id === schoolId && camp?.target_pence === 500000 && camp?.status === 'complete', JSON.stringify(camp))
  const plan = fundedPlan({ ...funder, amount_pence: 12300 }, [{ id: madeId, school_id: schoolId, status: 'complete' }])
  ok('the next funder uses that campaign', plan.kind === 'donate' && plan.campaignId === madeId)
  await recordFunding(A.db, A.id, { ...funder, amount_pence: 12300 }, plan, '2026-11-05')
  const gifts = (await admin.from('tp_donations').select('amount_pence, method, donor_name, donated_on').eq('campaign_id', madeId).order('amount_pence')).data
  ok('both donations are recorded, by organisation, as bank payments', gifts?.length === 2 && gifts.every(g => g.method === 'bank' && g.donor_name === 'Wrenfield Fund' && g.donated_on === '2026-11-05') && gifts[1].amount_pence === 500000, JSON.stringify(gifts))
  const fundraising = (await A.db.from('tp_schools').insert({ hq_id: A.id, name: 'Fundraising Primary', status: 'fundraising' }).select('id').single()).data
  const programme = (status) => ({ hq_id: A.id, school_id: fundraising.id, term_label: `Test ${status}`, status })
  const added = await A.db.from('tp_programmes').insert(['fundraising', 'planned', 'running', 'complete'].map(programme))
  ok('A can add programmes', !added.error, added.error?.message)
  await markSchoolFunded(A.db, A.id, fundraising.id, 'Wrenfield Fund')
  const after = (await admin.from('tp_programmes').select('term_label, status').eq('school_id', fundraising.id).order('term_label')).data
  ok('fundraising and planned programmes are confirmed; running and complete are not', after?.find(p => p.term_label === 'Test fundraising')?.status === 'confirmed' && after?.find(p => p.term_label === 'Test planned')?.status === 'confirmed' && after?.find(p => p.term_label === 'Test running')?.status === 'running' && after?.find(p => p.term_label === 'Test complete')?.status === 'complete', JSON.stringify(after))
  const marked = (await admin.from('tp_schools').select('status, funding_source').eq('id', fundraising.id).single()).data
  ok('marking funded confirms the school and records the funder', marked?.status === 'confirmed' && marked?.funding_source === 'Wrenfield Fund', JSON.stringify(marked))
  const budgeted = (await A.db.from('tp_schools').insert({ hq_id: A.id, name: 'Budgeted Primary', status: 'fundraising', funding_source: 'School budget' }).select('id').single()).data
  await markSchoolFunded(A.db, A.id, budgeted.id, 'Wrenfield Fund')
  const kept = (await admin.from('tp_schools').select('status, funding_source').eq('id', budgeted.id).single()).data
  ok('a funding source already set is kept', kept?.status === 'confirmed' && kept?.funding_source === 'School budget', JSON.stringify(kept))
  let blocked = false
  try { await markSchoolFunded(B.db, B.id, fundraising.id, 'Planted') } catch { blocked = true }
  ok('B can’t mark A’s school', blocked)
  ok('B reads none of A’s donations', (await B.db.from('tp_donations').select('id')).data?.length === 0)

  console.log('\nWelcome packs, against the real tables:')
  const draft = extra => ({ name: 'Ball', kind: 'included', price_pence: null, has_sizes: false, sizes: [], low_stock: 2, unit_cost_pence: null, sort: 0, active: true, ...extra })
  await saveItem(A.db, A.id, null, draft({ name: 'T-shirt', has_sizes: true, sizes: ['7-8', '9-10'] }))
  await saveItem(A.db, A.id, null, draft({ sort: 1 }))
  await saveItem(A.db, A.id, null, draft({ name: 'Racket', kind: 'paid', price_pence: 1000, sort: 2 }))
  let pk = await loadPacks(A.db)
  const [shirt, ball, racket] = ['T-shirt', 'Ball', 'Racket'].map(n => pk.items.find(i => i.name === n))
  ok('items saved and read back', !!(shirt && ball && racket))
  const kid = async name => (await admin.from('tp_children').insert({ hq_id: A.id, name }).select('id').single()).data.id
  const [c1, c2] = [await kid('Pack One'), await kid('Pack Two')]
  const bKid = (await admin.from('tp_children').insert({ hq_id: B.id, name: 'Other Org' }).select('id').single()).data.id
  const issueErr = async (db, child, lines) => { try { await issuePack(db, child, lines); return null } catch (e) { return e.message } }
  ok('0 stock blocks issuing, by name', await issueErr(A.db, c1, [{ item_id: shirt.id, size: '9-10' }]) === 'No T-shirt 9-10 in stock — receive stock first')
  await receiveStock(A.db, A.id, shirt.id, '9-10', 5, 'Delivery')
  await receiveStock(A.db, A.id, ball.id, null, 3, '')
  await receiveStock(A.db, A.id, racket.id, null, 2, '')
  ok('a paid item can’t be issued without a payment', /No payment recorded for Racket/.test(await issueErr(A.db, c1, [{ item_id: racket.id, size: null }])))
  ok('a failure issues nothing at all', (await issueErr(A.db, c1, [{ item_id: ball.id, size: null }, { item_id: racket.id, size: null }])) !== null && (await loadPacks(A.db)).issues.length === 0)
  ok('sizes save', await setChildSize(A.db, A.id, c1, shirt.id, '9-10').then(() => true, () => false))
  ok('the pack issues', await issuePack(A.db, c1, [{ item_id: shirt.id, size: '9-10' }, { item_id: ball.id, size: null }]) === 2)
  ok('the same item twice is blocked', /already has a T-shirt/.test(await issueErr(A.db, c1, [{ item_id: shirt.id, size: '9-10' }])))
  await recordPayment(A.db, A.id, { childId: c1, itemId: racket.id, amountPence: 1000, method: 'cash', reference: '', paidAt: '2026-11-01' })
  ok('a paid item issues once paid', await issuePack(A.db, c1, [{ item_id: racket.id, size: null }]) === 1)
  ok('another child’s payment doesn’t count', /No payment recorded/.test(await issueErr(A.db, c2, [{ item_id: racket.id, size: null }])))
  await adjustStock(A.db, A.id, ball.id, null, -1, 'One split')
  let adjust = ''
  try { await adjustStock(A.db, A.id, ball.id, null, -99, 'Count') } catch (e) { adjust = e.message }
  ok('stock can’t go below zero', adjust === 'That would take the stock below zero.', adjust)
  const moves = (await admin.from('tp_pack_stock_moves').select('item_id, size, delta').eq('hq_id', A.id)).data
  const qty = (await admin.from('tp_pack_stock').select('item_id, size, qty').eq('hq_id', A.id)).data
  ok('every stock line equals the sum of its moves', qty.length === 3 && qty.every(l => l.qty === moves.filter(m => m.item_id === l.item_id && (m.size ?? '') === (l.size ?? '')).reduce((n, m) => n + m.delta, 0)), JSON.stringify(qty))
  ok('a browser session can’t write qty', !!(await A.db.from('tp_pack_stock').update({ qty: 999 }).eq('hq_id', A.id).select('id')).error)
  ok('a browser session can’t insert an issue', !!(await A.db.from('tp_pack_issues').insert({ hq_id: A.id, child_id: c2, item_id: ball.id })).error)
  ok('a browser session can’t record an issued move', !!(await A.db.from('tp_pack_stock_moves').insert({ hq_id: A.id, item_id: ball.id, delta: -1, reason: 'issued' })).error)
  await saveBooklet(A.db, A.id, { title: 'Booklet', intro: '', weeks: [], stickers: [] })
  for (const t of ['tp_pack_items', 'tp_pack_sizes', 'tp_pack_stock', 'tp_pack_stock_moves', 'tp_pack_issues', 'tp_pack_payments', 'tp_booklet']) {
    ok(`B reads none of A’s ${t}`, (await B.db.from(t).select('hq_id')).data?.length === 0)
    ok(`anon reads none of ${t}`, (await anon.from(t).select('hq_id')).data?.length === 0)
  }
  ok('B can’t issue to A’s child', /could not be found/.test(await issueErr(B.db, c2, [{ item_id: ball.id, size: null }])))
  ok('B can’t issue A’s item to its own child', /could not be found/.test(await issueErr(B.db, bKid, [{ item_id: ball.id, size: null }])))
  ok('B can’t receive onto A’s item', !!(await B.db.from('tp_pack_stock_moves').insert({ hq_id: B.id, item_id: ball.id, delta: 5, reason: 'received' })).error)
  ok('B can’t pay for A’s item', !!(await B.db.from('tp_pack_payments').insert({ hq_id: B.id, child_id: bKid, item_id: racket.id, amount_pence: 100, method: 'cash' })).error)
  ok('B can’t change A’s item', (await B.db.from('tp_pack_items').update({ name: 'x' }).eq('id', ball.id).select('id')).data?.length === 0)
  ok('anon can’t call the function', !!(await anon.rpc('impact_issue_pack', { p_child: c2, p_lines: [{ item_id: ball.id }] })).error)

  console.log('\nReturns, against the real tables:')
  const lineQty = async (item, size) => (await admin.from('tp_pack_stock').select('qty').eq('item_id', item).eq('hq_id', A.id).filter('size', size ? 'eq' : 'is', size ?? 'null').maybeSingle()).data?.qty ?? 0
  const giveBack = opts => returnItem(A.db, { childId: c1, note: '', reissue: false, size: null, ...opts }).then(() => null, e => e.message)
  await receiveStock(A.db, A.id, shirt.id, '7-8', 2, '')
  const nineTen = await lineQty(shirt.id, '9-10')
  ok('a size swap moves one each way', await giveBack({ itemId: shirt.id, reason: 'too_small', reissue: true, size: '7-8' }) === null && await lineQty(shirt.id, '9-10') === nineTen + 1 && await lineQty(shirt.id, '7-8') === 1)
  ok('other needs a note', /Add a note/.test(await giveBack({ itemId: ball.id, reason: 'other' })))
  ok('B can’t return for A’s child', await returnItem(B.db, { childId: c1, itemId: ball.id, reason: 'too_small', note: '', reissue: false, size: null }).then(() => false, e => /could not be found/.test(e.message)))
  ok('anon can’t call it', !!(await anon.rpc('impact_return_item', { p_child: c1, p_item: ball.id, p_reason: 'damaged' })).error)
  const ballBefore = await lineQty(ball.id, null)
  ok('damaged and replaced writes it off', await giveBack({ itemId: ball.id, reason: 'damaged', reissue: true }) === null)
  ok('stock falls by the replacement only', await lineQty(ball.id, null) === ballBefore - 1)
  ok('the login is recorded on the issue', (await admin.from('tp_pack_issues').select('issued_by_user').eq('child_id', c1).eq('item_id', ball.id).order('issued_at', { ascending: false }).limit(1).single()).data?.issued_by_user === A.id)
  const finalMoves = (await admin.from('tp_pack_stock_moves').select('item_id, size, delta').eq('hq_id', A.id)).data
  const finalQty = (await admin.from('tp_pack_stock').select('item_id, size, qty').eq('hq_id', A.id)).data
  ok('stock still equals the sum of moves', finalQty.every(l => l.qty === finalMoves.filter(m => m.item_id === l.item_id && (m.size ?? '') === (l.size ?? '')).reduce((n, m) => n + m.delta, 0)), `${nineTen}`)

  await logins(A, B)

  if (/localhost|127\.0\.0\.1/.test(BASE)) {
    console.log('\nRate limit:')
    let status = 0
    for (let i = 0; i < 121; i++) status = (await fetch(`${BASE}/api/impact/leads/in/ratelimit${token.slice(0, 10)}xxxx`, { method: 'POST', body: '{}' })).status
    ok('the 121st request in an hour is a 429', status === 429, String(status))
  }
}

// Coaches, parents and invites: who can read what, as real sessions over the API.
async function logins(A, B) {
  console.log('\nLogins:')
  const one = async (t, row) => { const r = await admin.from(t).insert(row).select('id').single(); if (r.error) throw new Error(`${t}: ${r.error.message}`); return r.data.id }
  const hq = A.id
  const school = await one('tp_schools', { hq_id: hq, name: `${tag} one`, notes: 'HQ ONLY' }), school2 = await one('tp_schools', { hq_id: hq, name: `${tag} two` })
  const staff = await one('tp_staff', { hq_id: hq, name: 'Coach One', email: `${tag}_coach@lumio.test`, notes: 'HQ ONLY' }), staff2 = await one('tp_staff', { hq_id: hq, name: 'Coach Two' })
  const prog = await one('tp_programmes', { hq_id: hq, school_id: school, term_label: 'One', lead_staff_id: staff, notes: 'HQ ONLY' }), prog2 = await one('tp_programmes', { hq_id: hq, school_id: school2, term_label: 'Two', lead_staff_id: staff2 })
  const fam = await one('tp_families', { hq_id: hq, guardian_name: 'Fam One', email: `${tag}_parent@lumio.test`, phone: '07700', notes: 'HQ ONLY', consent_photo: true }), fam2 = await one('tp_families', { hq_id: hq, guardian_name: 'Fam Two', notes: 'HQ ONLY' })
  const kid = await one('tp_children', { hq_id: hq, name: 'Kid One', family_id: fam, school_id: school, programme_id: prog, medical_notes: 'Asthma', send: true, fsm: true, pupil_premium: true, notes: 'HQ ONLY', photo_consent: true })
  const kid2 = await one('tp_children', { hq_id: hq, name: 'Kid Two', family_id: fam2, school_id: school2, programme_id: prog2, notes: 'HQ ONLY' })
  const venue = await one('tp_venues', { hq_id: hq, name: `${tag} rec`, notes: 'HQ ONLY', access_notes: 'Gate code' }), venue2 = await one('tp_venues', { hq_id: hq, name: `${tag} park` })
  const ses = await one('tp_sessions', { hq_id: hq, programme_id: prog, session_date: '2026-10-01', lead_staff_id: staff, venue_id: venue, notes: 'HQ ONLY' }), ses2 = await one('tp_sessions', { hq_id: hq, programme_id: prog2, session_date: '2026-10-02', lead_staff_id: staff2, venue_id: venue2 })
  await one('tp_attendance', { hq_id: hq, session_id: ses2, child_id: kid2 })
  await one('impact_leads', { hq_id: hq, name: 'Lead' })
  const item = await one('tp_pack_items', { hq_id: hq, name: `${tag} ball` })
  await one('tp_pack_stock_moves', { hq_id: hq, item_id: item, delta: 3, reason: 'received' })
  const racket = await one('tp_pack_items', { hq_id: hq, name: `${tag} racket`, kind: 'paid', price_pence: 2500 })
  await one('tp_pack_stock_moves', { hq_id: hq, item_id: racket, delta: 3, reason: 'received' })
  await one('tp_pack_payments', { hq_id: hq, child_id: kid, item_id: racket, amount_pence: 2500, method: 'cash' })
  await one('tp_pack_payments', { hq_id: hq, child_id: kid2, item_id: item, amount_pence: 100, method: 'cash' }).catch(() => {})

  const coach = await person('coach'), parent = await person('parent'), gone = await person('gone')
  const join = (who, role, target) => one('impact_members', { user_id: who.id, hq_id: hq, role, ...target, invited_email: who.email, accepted_at: new Date().toISOString() })
  await join(coach, 'coach', { staff_id: staff }); await join(parent, 'parent', { family_id: fam })
  const goneId = await join(gone, 'parent', { family_id: fam })
  const rows = async (who, t) => (await who.db.from(t).select('*')).data ?? []
  const coachView = !!(await coach.db.rpc('impact_coach_home', { p_hq: hq })).data?.programmes

  ok('coach can’t read another programme’s child', !(await rows(coach, 'tp_children')).some(c => c.id === kid2))
  ok('coach can’t read another programme’s session', !(await rows(coach, 'tp_sessions')).some(s => s.id === ses2))
  if (coachView) {
    ok('coach reads no child row directly', (await rows(coach, 'tp_children')).length === 0)
    ok('coach reads no family row directly', (await rows(coach, 'tp_families')).length === 0)
    ok('coach reads no session or school row directly', (await rows(coach, 'tp_sessions')).length + (await rows(coach, 'tp_schools')).length === 0)
    const home = (await coach.db.rpc('impact_coach_home', { p_hq: hq })).data, raw = JSON.stringify(home)
    ok('coach home: medical and SEND for their child', home.children[0]?.medical_notes === 'Asthma' && home.children[0]?.send === true, raw)
    ok('coach home: their session and school', home.sessions.some(s => s.id === ses) && home.schools.some(s => s.id === school), raw)
    ok('coach home: no notes, FSM or pupil premium', !/HQ ONLY|fsm|pupil_premium|"notes"/.test(raw), raw)
    ok('coach home: paid is yes/no, no amounts', home.paid.some(p => p.child_id === kid && p.item_id === racket) && !/amount|2500/.test(raw), raw)
    ok('coach reads no programme, venue or staff row directly', (await rows(coach, 'tp_programmes')).length + (await rows(coach, 'tp_venues')).length + (await rows(coach, 'tp_staff')).length === 0)
    ok('coach home: their programme and venue, not another', home.programmes.map(p => p.id).join() === prog && home.venues.map(v => v.id).join() === venue, raw)
    ok('coach home: venue access notes stay', home.venues[0]?.access_notes === 'Gate code', raw)
    ok('coach adds a QR check-in at their venue', !(await coach.db.from('tp_qr_checkins').insert({ hq_id: hq, tp_venue_id: venue, session_date: '2026-10-01', children_count: 1 })).error)
    ok('coach can’t add one at another venue', !!(await coach.db.from('tp_qr_checkins').insert({ hq_id: hq, tp_venue_id: venue2, session_date: '2026-10-01', children_count: 1 })).error)
    ok('coach issues a paid item once it’s paid', (await coach.db.rpc('impact_issue_pack', { p_child: kid, p_lines: [{ item_id: racket }], p_session: ses })).data === 1)
    ok('coach records a return for their own child', !(await coach.db.rpc('impact_return_item', { p_child: kid, p_item: racket, p_reason: 'too_small' })).error)
    ok('coach can’t record a return for another child', !!(await coach.db.rpc('impact_return_item', { p_child: kid2, p_item: item, p_reason: 'too_small' })).error)
    const both = await one('impact_members', { user_id: coach.id, hq_id: hq, role: 'parent', family_id: fam2, invited_email: coach.email, accepted_at: new Date().toISOString() })
    ok('one login can be a coach and a parent', (await coach.db.rpc('impact_parent_home')).data?.[0]?.id === fam2 && (await coach.db.rpc('impact_coach_home', { p_hq: hq })).data?.children?.length === 1)
    await admin.from('impact_members').delete().eq('id', both)
    ok('coach home: no child outside their programmes', !raw.includes(kid2), raw)
    ok('coach home: no family email', !raw.includes('_parent@lumio.test'), raw)
    ok('coach marks their register', !(await coach.db.from('tp_attendance').upsert({ hq_id: hq, session_id: ses, child_id: kid, present: true, via: 'register' }, { onConflict: 'session_id,child_id' })).error)
    ok('coach can’t mark another child', !!(await coach.db.from('tp_attendance').insert({ hq_id: hq, session_id: ses, child_id: kid2 })).error)
    ok('another org’s id gives the coach nothing', (await coach.db.rpc('impact_coach_home', { p_hq: B.id })).data?.children?.length === 0)
    const schoolLogin = await person('school')
    await join(schoolLogin, 'school', { school_id: school })
    ok('school login reads no programme row directly', (await rows(schoolLogin, 'tp_programmes')).length === 0)
    const schoolHome = await schoolLogin.db.rpc('impact_school_home')
    if (schoolHome.error) console.log('  – 231 not applied: school home checks skipped')
    else {
      const sraw = JSON.stringify(schoolHome.data)
      ok('school login gets its own school and programme', schoolHome.data.schools.map(s => s.id).join() === school && schoolHome.data.programmes.map(p => p.id).join() === prog, sraw)
      ok('school home has no notes', !sraw.includes('HQ ONLY') && !('notes' in schoolHome.data.schools[0]), sraw)
      ok('school login reads no school row directly', (await rows(schoolLogin, 'tp_schools')).length === 0)
      ok('a coach gets an empty school home', (await coach.db.rpc('impact_school_home')).data?.schools?.length === 0)
    }
  } else console.log('  – 230 not applied: coach view checks skipped')
  ok('coach issues to their own child', (await coach.db.rpc('impact_issue_pack', { p_child: kid, p_lines: [{ item_id: item }], p_session: ses })).data === 1)
  ok('coach can’t issue to another child', !!(await coach.db.rpc('impact_issue_pack', { p_child: kid2, p_lines: [{ item_id: item }] })).error)
  ok('parent reads no child or family row directly', (await rows(parent, 'tp_children')).length + (await rows(parent, 'tp_families')).length === 0)
  const home = (await parent.db.rpc('impact_parent_home')).data
  ok('parent gets their own family only', home?.length === 1 && home[0].id === fam && !JSON.stringify(home).includes(kid2) && !JSON.stringify(home).includes('HQ ONLY'))
  ok('parent can’t change another family', !!(await parent.db.rpc('impact_parent_update_family', { p_family: fam2, p_email: 'x@x.test', p_phone: null, p_emergency_contact: null, p_consent_data: true, p_consent_photo: true, p_opt_in_email: true, p_opt_in_sms: true, p_opt_in_app: true })).error)
  for (const [who, label] of [[coach, 'coach'], [parent, 'parent']]) {
    ok(`${label} reads no leads`, (await rows(who, 'impact_leads')).length === 0)
    ok(`${label} can’t save settings`, !(await who.db.from('impact_orgs').update({ settings: {} }).eq('hq_id', hq).select('slug')).data?.length)
    ok(`${label} can’t reach the invite route`, [401, 403].includes((await who.api('/api/impact/invite', { method: 'POST', body: '{}' })).status))
    ok(`${label} can’t reach the members route`, [401, 403].includes((await who.api('/api/impact/members', { method: 'POST', body: '{}' })).status))
  }
  ok('coach reads no payment rows', (await rows(coach, 'tp_pack_payments')).length === 0)
  ok('parent reads no other family’s payments', !(await rows(parent, 'tp_pack_payments')).some(p => p.child_id === kid2))
  const b = await admin.from('impact_members').update({ revoked_at: new Date().toISOString() }).eq('id', goneId); if (b.error) throw b.error
  const seen = []
  for (const t of ['tp_children', 'tp_families', 'tp_sessions', 'tp_attendance', 'tp_schools', 'tp_programmes', 'tp_pack_items', 'tp_pack_issues', 'tp_pack_payments', 'impact_messages', 'impact_leads', 'tp_booklet']) if ((await rows(gone, t)).length) seen.push(t)
  ok('a revoked member reads nothing', seen.length === 0, seen.join())
  ok('a revoked member’s home is empty', (await gone.db.rpc('impact_parent_home')).data?.length === 0)
  ok('anon can’t reach the invite route', (await fetch(`${BASE}/api/impact/invite`, { method: 'POST', body: '{}' })).status === 401)
  ok('anon can’t accept an invite', (await fetch(`${BASE}/api/impact/invite/accept`, { method: 'POST', body: '{"token":"x"}' })).status === 401)

  const invited = await A.api('/api/impact/invite', { method: 'POST', body: JSON.stringify({ role: 'parent', targetId: fam2 }) })
  if (invited.status === 503) { console.log('  – invites are off here: send checks skipped'); ok('with invites off, nothing was created', ((await admin.from('impact_invites').select('id').eq('hq_id', hq)).data ?? []).length === 0); return }

  console.log('\nInvites (dry run, nothing sent):')
  ok('no email on the family is refused', invited.status === 400)
  const bAttempt = await B.api('/api/impact/invite', { method: 'POST', body: JSON.stringify({ role: 'coach', targetId: staff }) })
  ok('another org can’t invite your coach', bAttempt.status === 404, bAttempt.status)
  const stranger = await person('coach2'); await admin.from('tp_staff').update({ email: stranger.email }).eq('id', staff2)
  const send = async () => (await (await A.api('/api/impact/invite', { method: 'POST', body: JSON.stringify({ role: 'coach', targetId: staff2 }) })).json()).link
  const first = await send(), link = await send()
  const tok = u => new URL(u).searchParams.get('invite')
  const accept = (who, t) => who.api('/api/impact/invite/accept', { method: 'POST', body: JSON.stringify({ token: t }) })
  ok('the link prefills the address', new URL(link).searchParams.get('email') === stranger.email && new URL(link).pathname === '/sports-login')
  ok('the token isn’t stored', !((await admin.from('impact_invites').select('token_hash').eq('hq_id', hq)).data ?? []).some(r => r.token_hash === tok(link)))
  ok('a resent invite cancels the old link', (await accept(stranger, tok(first))).status === 400)
  ok('another login can’t use it', (await accept(coach, tok(link))).status === 400)
  const joined = await accept(stranger, tok(link)), joinedBody = await joined.json()
  ok('the right login gets a membership and the slug', joined.status === 200 && joinedBody.role === 'coach' && joinedBody.slug === A.slug, JSON.stringify(joinedBody))
  ok('single use', (await accept(stranger, tok(link))).status === 400)
  await admin.from('impact_invites').update({ expires_at: '2020-01-01' }).eq('hq_id', hq)
  ok('already a coach is refused a new invite', (await A.api('/api/impact/invite', { method: 'POST', body: JSON.stringify({ role: 'coach', targetId: staff2 }) })).status === 409)
  const mine = (await admin.from('impact_members').select('id').eq('user_id', stranger.id).single()).data
  ok('another org can’t revoke your member', (await B.api('/api/impact/members', { method: 'POST', body: JSON.stringify({ action: 'revoke', memberId: mine.id }) })).status === 404)
  ok('the HQ can revoke', (await A.api('/api/impact/members', { method: 'POST', body: JSON.stringify({ action: 'revoke', memberId: mine.id }) })).status === 200)
  ok('revoked at once', (await rows(stranger, 'tp_attendance')).length === 0 && (await rows(stranger, 'tp_programmes')).length === 0)
  const expired = await one('impact_invites', { hq_id: hq, role: 'parent', family_id: fam, email: stranger.email, token_hash: 'x'.repeat(64), expires_at: '2020-01-01' })
  ok('an expired token is refused', !!(await stranger.db.rpc('impact_accept_invite', { p_token_hash: 'x'.repeat(64) })).error, expired)
  const fill = Array.from({ length: 50 }, (_, i) => ({ hq_id: hq, role: 'parent', family_id: fam, email: 'x@lumio.test', token_hash: `limit-${tag}-${i}`, revoked_at: new Date().toISOString() }))
  await admin.from('impact_invites').insert(fill)
  await admin.from('tp_families').update({ email: `${tag}_fam2@lumio.test` }).eq('id', fam2)
  ok('the 51st invite in an hour is refused', (await A.api('/api/impact/invite', { method: 'POST', body: JSON.stringify({ role: 'parent', targetId: fam2 }) })).status === 429)
}

try { await main() } catch (e) { fail++; console.error('  ✗ FAIL: stopped early:', e.message ?? e) }
finally {
  for (const u of made) {
    await admin.from('impact_orgs').delete().eq('hq_id', u.id)
    await admin.from('sports_profiles').delete().eq('id', u.id)
    await admin.auth.admin.deleteUser(u.id)
  }
  const left = await admin.from('impact_orgs').select('slug').like('slug', `${tag}%`)
  console.log(`\n${pass} passed, ${fail} failed. Throwaway orgs left: ${left.data?.length ?? 'unknown'}`)
}
process.exit(fail ? 1 : 0)
