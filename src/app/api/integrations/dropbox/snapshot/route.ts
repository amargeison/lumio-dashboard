import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase.from('business_sessions').select('business_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'dropbox').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Dropbox not connected', connected: false }, { status: 404 })

  const headers = { Authorization: `Bearer ${creds.access_token}`, 'Content-Type': 'application/json' }

  try {
    const [listRes, usageRes] = await Promise.all([
      fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ path: '', recursive: false, limit: 100 }),
      }).then(r => r.ok ? r.json() : { entries: [] }),
      fetch('https://api.dropboxapi.com/2/users/get_space_usage', {
        method: 'POST',
        headers,
        body: '',
      }).then(r => r.ok ? r.json() : null),
    ])

    const entries = listRes.entries || []
    const files = entries.filter((e: any) => e['.tag'] === 'file')

    // Sort by server_modified descending to get recent files
    const sorted = files.sort((a: any, b: any) => {
      const da = a.server_modified || ''
      const db = b.server_modified || ''
      return db.localeCompare(da)
    })

    const recentFiles = sorted.slice(0, 20).map((f: any) => ({
      id: f.id,
      name: f.name,
      modified_time: f.server_modified,
      size: f.size,
      path: f.path_display,
    }))

    const storageUsed = usageRes?.used || 0

    return NextResponse.json({
      connected: true, provider: 'dropbox',
      recent_files: recentFiles,
      total_files: files.length,
      storage_used: storageUsed,
    })
  } catch (err) {
    console.error('[dropbox/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Dropbox data', connected: true }, { status: 502 })
  }
}
