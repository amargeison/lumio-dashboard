// Impact importer, end to end: review writes nothing, import stamps what it creates,
// a re-import updates instead of duplicating, undo deletes only what the import
// created, is blocked by anything added since and says what, and none of it crosses
// orgs. Uses the small Brackenmoor fixture (fictional) through the same reading code
// as the Import card, against a running app and the real database, as two throwaway
// orgs that are deleted at the end. Touches no real org.
//
// Run:  BASE=http://localhost:3077 node scripts/impact-import-test.mjs
//   AI=1          also run the AI path: the fixture's own headings, mapped by the real
//                 AI through /api/impact/import/map (two small calls, counted against
//                 the org's daily import cap)
//   RECORD_AI=1   with AI=1, save the AI's plans to tests/fixtures/ for the unit tests

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFileSync, writeFileSync } from 'node:fs'
import * as F from '../tests/impact/brackenmoor.mjs'

const { sheetSample } = await import('../src/lib/import-engine/read-workbook.ts')

try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '') }
} catch { /* ignore */ }
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '')
if (!SB || !KEY || !ANON) { console.error('Missing Supabase env'); process.exit(2) }

const admin = createClient(SB, KEY, { auth: { persistSession: false } })
const tag = `imptest-${Date.now()}`
let pass = 0, fail = 0
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name, detail) } }
const made = []

async function hq(letter) {
  const email = `${tag}_${letter}@lumio.test`
  const { data: { user }, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  made.push(user.id)
  const slug = `${tag}-${letter}`
  const profile = await admin.from('sports_profiles').upsert({ id: user.id, sport: 'impact', display_name: slug, portal_slug: slug })
  if (profile.error) throw profile.error
  const org = await admin.from('impact_orgs').insert({ slug, hq_id: user.id, settings: { org: slug } })
  if (org.error) throw org.error
  const jar = new Map()
  const db = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: all => all.forEach(c => jar.set(c.name, c.value)) } })
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const { error: otpError } = await db.auth.verifyOtp({ email, token: link.properties.email_otp, type: 'email' })
  if (otpError) throw otpError
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  const call = async (path, body, org = user.id) => {
    const res = await fetch(`${BASE}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', cookie: cookie(), 'x-impact-hq': org }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: res.status, body: await res.json().catch(() => ({})) }
  }
  const upload = async file => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`${BASE}/api/impact/import`, { method: 'POST', headers: { cookie: cookie(), 'x-impact-hq': user.id }, body: fd })
    return { status: res.status, body: await res.json().catch(() => ({})) }
  }
  return { id: user.id, db, call, upload }
}

const rows = async (hqId, table, filter = q => q) => (await filter(admin.from(table).select('*').eq('hq_id', hqId))).data ?? []
const counts = r => Object.fromEntries((r.body.tables ?? []).map(t => [t.key, t.counts]))

async function main() {
  const A = await hq('a'), B = await hq('b')
  const sheets = await F.fixtureSheets()
  const records = F.payload(F.readRecords(await F.readWorkbook(await F.workbookFile(F.asTemplate(sheets), 'Brackenmoor template.xlsx'))).found)

  console.log('\nTemplate path — review writes nothing:')
  // A school A already has, without a postcode: the import should match and update it, not add one.
  const pre = await admin.from('tp_schools').insert({ hq_id: A.id, name: 'Willowbank Primary', status: 'confirmed' }).select('id').single()
  const r1 = await A.call('/api/impact/import/plan', { mode: 'review', fileName: 'Brackenmoor template.xlsx', records })
  ok('review answers', r1.status === 200, JSON.stringify(r1.body).slice(0, 300))
  ok('… per table: schools 5 new + 1 matched existing', JSON.stringify(counts(r1).schools) === JSON.stringify({ new: 5, updated: 1, skipped: 0, review: 0 }), JSON.stringify(counts(r1).schools))
  ok('… children 12 new, registers 24 new', counts(r1).children?.new === 12 && counts(r1).registers?.new === 24)
  ok('… the matched row says so', r1.body.tables?.find(t => t.key === 'schools')?.rows.updated[0]?.match === 'Matches an existing record (name — postcode added)')
  ok('… and nothing was written', (await rows(A.id, 'tp_children')).length === 0 && (await rows(A.id, 'impact_imports')).length === 0 && (await rows(A.id, 'tp_schools')).length === 1)

  console.log('\nImport:')
  const stale = await A.call('/api/impact/import/plan', { mode: 'commit', fileName: 'x', records, key: 'not-the-reviewed-one' })
  ok('a commit that doesn’t match the reviewed plan is refused', stale.status === 409 && stale.body.changed === true)
  ok('… and wrote nothing', (await rows(A.id, 'tp_children')).length === 0 && (await rows(A.id, 'impact_imports')).length === 0)
  const c1 = await A.call('/api/impact/import/plan', { mode: 'commit', fileName: 'Brackenmoor template.xlsx', records, key: r1.body.key })
  ok('import succeeds', c1.status === 200 && c1.body.ok, JSON.stringify(c1.body).slice(0, 300))
  const I1 = c1.body.importId
  const kids = await rows(A.id, 'tp_children')
  ok('12 children, every one stamped with the import', kids.length === 12 && kids.every(k => k.import_batch_id === I1))
  const schools = await rows(A.id, 'tp_schools')
  const willow = schools.find(s => s.id === pre.data.id)
  ok('6 schools: the existing one updated (postcode added) and NOT stamped', schools.length === 6 && willow.postcode === 'BK1 4PL' && willow.import_batch_id === null && schools.filter(s => s.import_batch_id === I1).length === 5)
  ok('24 register entries and 4 sessions, stamped', (await rows(A.id, 'tp_attendance', q => q.eq('import_batch_id', I1))).length === 24 && (await rows(A.id, 'tp_sessions', q => q.eq('import_batch_id', I1))).length === 4)
  const [imp] = await rows(A.id, 'impact_imports')
  ok('history row: finished, counts kept, a fingerprint per created row', !!imp?.finished_at && imp.counts.summary.children.new === 12 && Object.keys(imp.counts.fp.tp_children ?? {}).length === 12 && !imp.counts.fp.tp_schools?.[pre.data.id])

  console.log('\nDuplicates:')
  const r2 = await A.call('/api/impact/import/plan', { mode: 'review', fileName: 'again.xlsx', records })
  ok('the same file again: nothing new, nothing to change', r2.status === 200 && r2.body.writes === 0 && counts(r2).children?.skipped === 12 && counts(r2).families?.skipped === 12)
  const c2 = await A.call('/api/impact/import/plan', { mode: 'commit', fileName: 'again.xlsx', records, key: r2.body.key })
  ok('… importing it is refused in plain English, and adds nothing', c2.status === 400 && /nothing new or changed/i.test(c2.body.error) && (await rows(A.id, 'tp_children')).length === 12)
  const edited = structuredClone(records)
  edited.families.find(f => f.email === 'sarah.reilly@example.com').phone = '07700 900998'
  const r3 = await A.call('/api/impact/import/plan', { mode: 'review', fileName: 'new phone.xlsx', records: edited })
  ok('a changed phone: 1 family updated, the rest skipped', JSON.stringify(counts(r3).families) === JSON.stringify({ new: 0, updated: 1, skipped: 11, review: 0 }) && r3.body.writes === 1)
  const c3 = await A.call('/api/impact/import/plan', { mode: 'commit', fileName: 'new phone.xlsx', records: edited, key: r3.body.key })
  const I2 = c3.body.importId
  const sarah = (await rows(A.id, 'tp_families', q => q.eq('email', 'sarah.reilly@example.com')))
  ok('… updated in place: one family, new phone, still stamped by the first import', c3.status === 200 && sarah.length === 1 && sarah[0].phone === '07700 900998' && sarah[0].import_batch_id === I1)

  console.log('\nCross-org and stamping:')
  ok('signed out: the history is refused', (await fetch(`${BASE}/api/impact/import/history`)).status === 401)
  ok('another org can’t see the import', !((await B.call('/api/impact/import/history')).body.imports ?? []).some(i => i.id === I1))
  ok('… can’t check or undo it through the route', (await B.call('/api/impact/import/history', { id: I1, action: 'check' })).status === 404 && (await B.call('/api/impact/import/history', { id: I1, action: 'undo' })).status === 404)
  ok('… can’t act in A by naming it', (await B.call('/api/impact/import/plan', { mode: 'review', records }, A.id)).status === 403 && (await B.call('/api/impact/import/history', undefined, A.id)).status === 403)
  ok('… can’t call undo directly', !!(await B.db.rpc('impact_undo_import', { p_import: I1, p_check: true })).error)
  ok('… can’t read A’s history rows', ((await B.db.from('impact_imports').select('id').eq('id', I1)).data ?? []).length === 0)
  ok('… can’t stamp its own rows with A’s import', !!(await B.db.from('tp_schools').insert({ hq_id: B.id, name: 'Sneaky', import_batch_id: I1 })).error)
  const manualSession = await A.db.from('tp_sessions').insert({ hq_id: A.id, kind: 'weekend', session_date: '2026-10-10' }).select('id').single()
  const ezra = kids.find(k => k.name === 'Ezra Mbeki')
  const manualReg = await A.db.from('tp_attendance').insert({ hq_id: A.id, session_id: manualSession.data.id, child_id: ezra.id, present: true, via: 'register' }).select('id').single()
  ok('A’s own register entry, added by hand, is not stamped', !manualReg.error && (await rows(A.id, 'tp_attendance', q => q.eq('id', manualReg.data.id)))[0]?.import_batch_id === null, manualReg.error?.message)
  ok('… and can’t be stamped afterwards (so an undo can never delete it)', !!(await A.db.from('tp_attendance').update({ import_batch_id: I1 }).eq('id', manualReg.data.id)).error)
  ok('history rows can’t be deleted, or marked undone by hand', (await A.db.from('impact_imports').delete().eq('id', I1).select('id')).data?.length !== 1 && !!(await A.db.from('impact_imports').update({ undone_at: new Date().toISOString() }).eq('id', I1)).error)

  console.log('\nUndo:')
  await A.db.from('tp_children').update({ year_group: 'Y5' }).eq('id', ezra.id).eq('hq_id', A.id)
  const chk = await A.call('/api/impact/import/history', { id: I1, action: 'check' })
  ok('check: the rows the import created, with counts', chk.status === 200 && chk.body.total === 5 + 3 + 3 + 4 + 12 + 6 + 12 + 1 + 8 + 4 + 24, JSON.stringify(chk.body).slice(0, 400))
  ok('… how many were edited since: Ezra, and Sarah’s family (the later import changed it)', chk.body.editedTotal === 2 && chk.body.edited.some(e => e.label === '1 child') && chk.body.edited.some(e => e.label === '1 family'), JSON.stringify(chk.body.edited))
  ok('… blocked by the register entry added by hand, named', chk.body.ok === false && chk.body.blocked.length === 1 && /1 register entry not from this import points at children it added \(Ezra Mbeki\)/.test(chk.body.blocked[0].line), JSON.stringify(chk.body.blocked))
  const blocked = await A.call('/api/impact/import/history', { id: I1, action: 'undo' })
  ok('undo while blocked: refused, nothing deleted', blocked.status === 409 && (await rows(A.id, 'tp_children')).length === 12)
  await A.db.from('tp_attendance').delete().eq('id', manualReg.data.id)
  const chk2 = await A.call('/api/impact/import/history', { id: I1, action: 'check' })
  ok('with that removed, undo is allowed', chk2.body.ok === true && chk2.body.blocked.length === 0)
  const undo = await A.call('/api/impact/import/history', { id: I1, action: 'undo' })
  ok('undo deletes what the import created', undo.status === 200 && undo.body.ok && (await rows(A.id, 'tp_children')).length === 0 && (await rows(A.id, 'tp_families')).length === 0 && (await rows(A.id, 'tp_attendance')).length === 0)
  const after = await rows(A.id, 'tp_schools')
  ok('… and leaves what it only updated: the school that was already there, postcode and all', after.length === 1 && after[0].id === pre.data.id && after[0].postcode === 'BK1 4PL')
  ok('… and the session added by hand', (await rows(A.id, 'tp_sessions')).map(s => s.id).join() === manualSession.data.id)
  const hist = (await A.call('/api/impact/import/history')).body.imports
  ok('history shows it undone, and the update-only import with nothing to delete', !!hist.find(i => i.id === I1)?.undone_at && (await A.call('/api/impact/import/history', { id: I2, action: 'check' })).body.total === 0)
  ok('undoing twice is refused', (await A.call('/api/impact/import/history', { id: I1, action: 'undo' })).status === 409)

  console.log('\nLimits and errors:')
  const tooMany = await A.call('/api/impact/import/plan', { mode: 'review', records: { children: new Array(5001).fill({ name: 'Too Many' }) } })
  ok('5,001 records refused, in plain English', tooMany.status === 413 && /up to 5,000/.test(tooMany.body.error))
  // Refused before any AI call is made.
  const bigRes = await A.upload(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' }))
  ok('a file over 10 MB is refused with a message, before any AI read', bigRes.status === 413 && /up to 10 MB/.test(bigRes.body.error ?? ''), `${bigRes.status} ${JSON.stringify(bigRes.body)}`)
  const empty = await A.call('/api/impact/import/plan', { mode: 'review' })
  ok('a request with nothing in it gets a message, not a blank failure', empty.status === 400 && typeof empty.body.error === 'string' && empty.body.error.length > 10)

  if (process.env.AI === '1') {
    console.log('\nAI path (real AI calls):')
    const plans = []
    const tabs = F.splitTabs(sheets).forAi
    for (let i = 0; i < tabs.length; i += 8) {
      const r = await A.call('/api/impact/import/map', { fileName: 'Brackenmoor_import_test_small.xlsx', sheets: tabs.slice(i, i + 8).map(s => ({ name: s.name, sample: sheetSample(s) })) })
      ok(`map call ${i / 8 + 1} answers`, r.status === 200, JSON.stringify(r.body).slice(0, 300))
      plans.push(...(r.body.plans ?? []))
    }
    console.log('    ', plans.map(p => `${p.sheet} → ${p.category}${p.confidence !== 'high' ? ` (${p.confidence})` : ''}`).join(' · '))
    if (process.env.RECORD_AI === '1') {
      writeFileSync(F.AI_PLANS, JSON.stringify({ note: 'Plans the AI returned for Brackenmoor_import_test_small.xlsx via /api/impact/import/map, recorded by scripts/impact-import-test.mjs AI=1 RECORD_AI=1.', recorded: new Date().toISOString().slice(0, 10), plans }, null, 2) + '\n')
      console.log('    saved', F.AI_PLANS)
    }
    const read = F.readRecords(sheets, plans)
    const r = await A.call('/api/impact/import/plan', { mode: 'review', fileName: 'Brackenmoor_import_test_small.xlsx', records: F.payload(read.found) })
    const c = counts(r)
    console.log('    ', Object.entries(c).map(([k, v]) => `${k} ${v.new}/${v.updated}/${v.skipped}/${v.review}`).join(' · '))
    ok('AI path: 12 children, 12 families, 6 schools (one already there), 24 register entries', c.children?.new + c.children?.review === 12 && c.families?.new === 12 && c.schools?.new + c.schools?.updated + c.schools?.skipped === 6 && c.registers?.new === 24, JSON.stringify(c))
    ok('AI path: no tab left for a row-by-row read', read.leftover.length === 0, read.leftover.join())
  }
}

try { await main() } catch (e) { fail++; console.error('  ✗ FAIL: stopped early:', e.stack ?? e) }
finally {
  for (const id of made) {
    await admin.from('impact_orgs').delete().eq('hq_id', id)
    await admin.from('sports_profiles').delete().eq('id', id)
    await admin.auth.admin.deleteUser(id)
  }
  const left = await admin.from('impact_orgs').select('slug').like('slug', `${tag}%`)
  const rowsLeft = made.length ? (await admin.from('tp_children').select('id').in('hq_id', made)).data?.length : 0
  console.log(`\n${pass} passed, ${fail} failed. Throwaway orgs left: ${left.data?.length ?? 'unknown'}, rows left: ${rowsLeft ?? 'unknown'}`)
}
process.exit(fail ? 1 : 0)
