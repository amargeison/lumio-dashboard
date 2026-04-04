import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

interface ContactRow {
  first_name?: string
  last_name?: string
  email?: string
  company?: string
  phone?: string
  job_title?: string
  tags?: string
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  try {
    const { contacts } = await req.json() as { contacts: ContactRow[] }

    if (!Array.isArray(contacts) || !contacts.length) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    const rows = contacts
      .filter(c => c.first_name || c.email)
      .map(c => ({
        business_id: session.business_id,
        first_name: c.first_name?.trim() || null,
        last_name: c.last_name?.trim() || null,
        email: c.email?.trim().toLowerCase() || null,
        company: c.company?.trim() || null,
        phone: c.phone?.trim() || null,
        job_title: c.job_title?.trim() || null,
        tags: c.tags?.trim() || null,
      }))

    if (!rows.length) {
      return NextResponse.json({ error: 'No valid contacts (need First Name or Email)' }, { status: 400 })
    }

    const { error } = await supabase.from('workspace_contacts').insert(rows)

    if (error) {
      console.error('[workspace/import-contacts] Insert error:', error)
      return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: rows.length })
  } catch (err) {
    console.error('[workspace/import-contacts] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
