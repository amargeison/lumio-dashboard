#!/usr/bin/env node
// Apply migration 087_sports_auth.sql to the Supabase project.
//
// Credential precedence:
//   1. DATABASE_URL / POSTGRES_URL / POSTGRES_URL_NON_POOLING  → uses `pg`
//   2. SUPABASE_ACCESS_TOKEN (Management API personal token)   → uses fetch
//   3. (fallback) prints manual instructions for the SQL editor
//
// Run from repo root:  node scripts/apply-sports-auth-migration.mjs

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const envFile = resolve(repoRoot, '.env.local')
const sqlFile = resolve(repoRoot, 'supabase/migrations/087_sports_auth.sql')
const PROJECT_REF = 'nrrympsgxsadiemzqwci'

// ── Parse .env.local (no dotenv dependency) ──────────────────────────────
function loadEnv(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

const env = { ...loadEnv(envFile), ...process.env }
const sql = readFileSync(sqlFile, 'utf8')

const dbUrl = env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_URL_NON_POOLING
const accessToken = env.SUPABASE_ACCESS_TOKEN

function printManualInstructions(reason) {
  console.error('')
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('  CANNOT APPLY MIGRATION AUTOMATICALLY')
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('')
  console.error(`Reason: ${reason}`)
  console.error('')
  console.error('To apply this migration manually:')
  console.error('')
  console.error(`  1. Open https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
  console.error('  2. Paste the contents of:')
  console.error('       supabase/migrations/087_sports_auth.sql')
  console.error('  3. Click "Run".')
  console.error('')
  console.error('To enable automatic application in future runs, add ONE of:')
  console.error('  • DATABASE_URL=postgresql://...   (direct connection string)')
  console.error('  • SUPABASE_ACCESS_TOKEN=sbp_...   (personal access token)')
  console.error('to your .env.local')
  console.error('')
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('')
}

async function applyViaPg() {
  let pg
  try {
    pg = await import('pg')
  } catch {
    console.error('[apply] DATABASE_URL is set but `pg` is not installed.')
    console.error('       Run: npm install pg --save-dev')
    process.exit(2)
  }
  const { Client } = pg.default
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('[apply] Connected via pg. Executing migration...')
  await client.query(sql)
  const { rows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='sports_profiles'"
  )
  await client.end()
  if (rows.length === 0) throw new Error('sports_profiles table not found after migration')
  console.log('[apply] ✓ sports_profiles table exists. Migration applied.')
}

async function applyViaManagementApi() {
  console.log('[apply] Using Supabase Management API...')
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`[apply] HTTP ${res.status}: ${text}`)
    throw new Error(`Management API returned ${res.status}`)
  }
  console.log('[apply] ✓ Management API accepted query.')
  console.log('[apply] Response:', text.slice(0, 500))
}

async function main() {
  console.log('[apply] Migration: supabase/migrations/087_sports_auth.sql')
  console.log(`[apply] Project: ${PROJECT_REF}`)
  if (dbUrl) {
    try {
      await applyViaPg()
      console.log('[apply] DONE')
      return
    } catch (e) {
      console.error('[apply] pg path failed:', e.message)
      process.exit(1)
    }
  }
  if (accessToken) {
    try {
      await applyViaManagementApi()
      console.log('[apply] DONE')
      return
    } catch (e) {
      console.error('[apply] Management API path failed:', e.message)
      process.exit(1)
    }
  }
  printManualInstructions(
    'Neither DATABASE_URL nor SUPABASE_ACCESS_TOKEN found in .env.local. ' +
    'SUPABASE_SERVICE_ROLE_KEY alone CANNOT execute DDL via PostgREST.'
  )
  process.exit(3)
}

main().catch((e) => {
  console.error('[apply] Unexpected error:', e)
  process.exit(1)
})
