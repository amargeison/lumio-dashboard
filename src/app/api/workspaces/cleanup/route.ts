import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Vercel Cron — runs daily at 3am UTC
// Also accepts POST with bearer token for manual/n8n triggers
export async function GET(req: NextRequest) {
  return handleCleanup(req)
}

export async function POST(req: NextRequest) {
  return handleCleanup(req)
}

async function handleCleanup(req: NextRequest) {
  const supabase = getSupabase()

  // Auth: Vercel sets CRON_SECRET automatically, or use CLEANUP_SECRET for manual calls
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.CLEANUP_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let cleaned = 0

  // Find expired trial workspaces
  const { data: expired } = await supabase
    .from('demo_tenants')
    .select('id, slug, owner_email, owner_name, company_name')
    .eq('workspace_type', 'trial')
    .eq('status', 'active')
    .lte('expires_at', now.toISOString())

  // Find soft-deleted workspaces past their deletion time
  const { data: softDeleted } = await supabase
    .from('demo_tenants')
    .select('id, slug')
    .eq('status', 'converted')
    .not('deleted_at', 'is', null)
    .lte('deleted_at', now.toISOString())

  const toClean = [
    ...(expired || []).map(t => ({ ...t, reason: 'expired' })),
    ...(softDeleted || []).map(t => ({ ...t, reason: 'soft_deleted' })),
  ]

  if (toClean.length > 0) {
    const ids = toClean.map(t => t.id)

    // Delete child records
    await supabase.from('demo_sessions').delete().in('tenant_id', ids)
    await supabase.from('demo_magic_links').delete().in('slug', toClean.map(t => t.slug))

    // Mark as deleted
    await supabase
      .from('demo_tenants')
      .update({ status: 'deleted', deleted_at: now.toISOString() })
      .in('id', ids)

    cleaned = toClean.length
  }

  return NextResponse.json({ success: true, cleaned, timestamp: now.toISOString() })
}
