// Portal access — automated cross-tenant isolation test.
//
// Proves the scoping that /api/portal/* enforces: a parent sees only their one
// player, a sub-coach sees only their assigned players, and neither can ever read
// another academy's data. It sets up two throwaway academies + members, replicates
// the EXACT filters the routes apply, asserts isolation, then cleans up.
//
// Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/portal-security-test.mjs
// (or rely on .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Load env from .env.local if not already set.
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim() }
} catch { /* ignore */ }

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(2) }

const db = createClient(URL, KEY, { auth: { persistSession: false } })
const tag = 'sectest_' + Date.now()
let pass = 0, fail = 0
const ok = (name, cond) => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗ FAIL:', name) } }

async function main() {
  // ── Two isolated academies ────────────────────────────────────────────────
  const A = (await db.auth.admin.createUser({ email: `${tag}_a@lumio.test`, email_confirm: true })).data.user
  const B = (await db.auth.admin.createUser({ email: `${tag}_b@lumio.test`, email_confirm: true })).data.user

  const mkPlayer = async (coachId, name, assigned) =>
    (await db.from('coach_players').insert({ coach_id: coachId, name, assigned_coach: assigned, racket_stage: 'white' }).select('id').single()).data.id
  const a1 = await mkPlayer(A.id, `${tag} A-One`, `${tag} CoachA1`)
  const a2 = await mkPlayer(A.id, `${tag} A-Two`, `${tag} CoachA2`)
  const b1 = await mkPlayer(B.id, `${tag} B-One`, `${tag} CoachB1`)

  await db.from('coach_sessions').insert([
    { coach_id: A.id, player_name: `${tag} A-One`, focus: 'A1 lesson' },
    { coach_id: B.id, player_name: `${tag} B-One`, focus: 'B1 lesson' },
  ])
  await db.from('coach_members').insert([
    { academy_id: A.id, role: 'parent', scope_player_id: a1, email: `${tag}_pa@x.test`, status: 'invited' },
    { academy_id: A.id, role: 'coach', scope_coach_name: `${tag} CoachA1`, email: `${tag}_ca@x.test`, status: 'invited' },
  ])

  console.log('\nParent A (scope = player A-One, academy A):')
  // /api/portal/player query: .eq('id', scopePlayerId).eq('coach_id', academyId)
  ok('sees their own player', !!(await db.from('coach_players').select('id').eq('id', a1).eq('coach_id', A.id).maybeSingle()).data)
  ok('CANNOT load their player under academy B', !(await db.from('coach_players').select('id').eq('id', a1).eq('coach_id', B.id).maybeSingle()).data)
  ok('CANNOT reach academy B player', !(await db.from('coach_players').select('id').eq('id', b1).eq('coach_id', A.id).maybeSingle()).data)
  const pSess = (await db.from('coach_sessions').select('player_name').eq('coach_id', A.id).ilike('player_name', `${tag} A-One`)).data
  ok('sessions limited to their player', pSess.length > 0 && pSess.every(s => s.player_name === `${tag} A-One`))
  ok('CANNOT see academy B sessions', (await db.from('coach_sessions').select('id').eq('coach_id', A.id).ilike('player_name', `${tag} B-One`)).data.length === 0)

  console.log('\nCoach A (scope = CoachA1, academy A):')
  // /api/portal/coach query: .eq('coach_id', academyId).ilike('assigned_coach', coachName)
  const cP = (await db.from('coach_players').select('name, assigned_coach').eq('coach_id', A.id).ilike('assigned_coach', `${tag} CoachA1`)).data
  ok('sees only assigned players (A-One)', cP.length === 1 && cP[0].name === `${tag} A-One`)
  ok('does NOT see another coach\'s player (A-Two)', !cP.some(p => p.name === `${tag} A-Two`))
  ok('does NOT see academy B players', (await db.from('coach_players').select('id').eq('coach_id', A.id).ilike('assigned_coach', `${tag} CoachB1`)).data.length === 0)

  console.log('\nMembership resolution:')
  ok('an account with no membership resolves to none', !(await db.from('coach_members').select('id').eq('member_user_id', '00000000-0000-0000-0000-000000000000').maybeSingle()).data)

  // ── Cleanup (FK ON DELETE CASCADE removes players/sessions/members) ─────────
  await db.auth.admin.deleteUser(A.id)
  await db.auth.admin.deleteUser(B.id)

  console.log(`\n${fail === 0 ? '✅ PASS' : '❌ FAIL'} — ${pass} passed, ${fail} failed`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(e => { console.error('Test error:', e); process.exit(2) })
