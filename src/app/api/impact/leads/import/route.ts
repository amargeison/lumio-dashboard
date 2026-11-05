import { NextRequest, NextResponse } from 'next/server'
import { impactHq } from '@/lib/impact/import-auth'
import { IMPORT_MAX } from '@/lib/impact/leads'
import { insertLeads } from '@/lib/impact/lead-actions'

export const runtime = 'nodejs'

// Bringing a spreadsheet of leads in, in one go. The browser reads the file and
// matches its columns (HQ checks the match); this writes the rows as the signed-in
// user, so RLS keeps them in that org.
// POST { pipeline, rows: [{ name, org_name?, for_name?, email?, phone?, stage?, notes?, source?, contact_method?, list?, created?, next_action_at?, amount? }] }

export async function POST(req: NextRequest) {
  const who = await impactHq('import leads')
  if (who instanceof NextResponse) return who
  const b = (await req.json().catch(() => ({}))) as { pipeline?: string; rows?: Record<string, unknown>[] }
  const pipeline = b.pipeline === 'funders' ? 'funders' : 'schools'
  const rows = Array.isArray(b.rows) ? b.rows.slice(0, IMPORT_MAX) : []
  if (!rows.length) return NextResponse.json({ error: 'There are no rows to bring in.' }, { status: 400 })
  const { added, skipped, error } = await insertLeads(who.db, who.user.id, pipeline, rows)
  if (error) return NextResponse.json({ error: `Stopped after ${added} rows: ${error}`, added }, { status: 400 })
  if (!added) return NextResponse.json({ error: 'None of the rows had a name, organisation, email or phone.' }, { status: 400 })
  return NextResponse.json({ ok: true, added, skipped })
}
