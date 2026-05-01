import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Triggered by VPS system cron (Hetzner) — runs daily at 3am UTC. See ops docs for crontab entry.
// Also accepts POST with bearer token for manual/n8n triggers
export async function GET(req: NextRequest) {
  return handleCleanup(req)
}

export async function POST(req: NextRequest) {
  return handleCleanup(req)
}

async function handleCleanup(req: NextRequest) {
  const supabase = getSupabase()

  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.CLEANUP_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let businessCleaned = 0
  let schoolCleaned = 0

  // ── Business trials (demo_tenants) ──
  const { data: expiredBiz } = await supabase
    .from('demo_tenants')
    .select('id, slug')
    .eq('workspace_type', 'trial')
    .eq('status', 'active')
    .lte('expires_at', now.toISOString())

  if (expiredBiz?.length) {
    const ids = expiredBiz.map(t => t.id)
    await supabase.from('demo_sessions').delete().in('tenant_id', ids)
    await supabase.from('demo_magic_links').delete().in('slug', expiredBiz.map(t => t.slug))
    await supabase.from('demo_tenants').update({ status: 'deleted', deleted_at: now.toISOString() }).in('id', ids)
    businessCleaned = expiredBiz.length
  }

  // ── School trials (schools) ──
  const { data: expiredSchools } = await supabase
    .from('schools')
    .select('id, slug')
    .eq('workspace_type', 'trial')
    .eq('active', true)
    .lte('trial_ends_at', now.toISOString())

  if (expiredSchools?.length) {
    const ids = expiredSchools.map(s => s.id)
    await supabase.from('school_magic_links').delete().in('school_id', ids)
    await supabase.from('school_users').delete().in('school_id', ids)
    await supabase.from('schools').update({ active: false, deleted_at: now.toISOString() }).in('id', ids)
    schoolCleaned = expiredSchools.length
  }

  return NextResponse.json({
    success: true,
    cleaned: { business: businessCleaned, schools: schoolCleaned },
    timestamp: now.toISOString(),
  })
}
