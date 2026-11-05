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
const { fundedPlan, partnerWithNewSchool, partnerWithSchool, recordFunding } = await import('../src/lib/impact/lead-actions.ts')

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
  ok('B reads none of A’s donations', (await B.db.from('tp_donations').select('id')).data?.length === 0)

  if (/localhost|127\.0\.0\.1/.test(BASE)) {
    console.log('\nRate limit:')
    let status = 0
    for (let i = 0; i < 121; i++) status = (await fetch(`${BASE}/api/impact/leads/in/ratelimit${token.slice(0, 10)}xxxx`, { method: 'POST', body: '{}' })).status
    ok('the 121st request in an hour is a 429', status === 429, String(status))
  }
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
