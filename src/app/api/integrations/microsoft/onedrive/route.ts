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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'microsoft').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Microsoft not connected', connected: false }, { status: 404 })

  const headers = { Authorization: `Bearer ${creds.access_token}` }
  const graphUrl = 'https://graph.microsoft.com/v1.0'

  try {
    const [recentRes, sharedRes] = await Promise.all([
      fetch(`${graphUrl}/me/drive/recent?$top=20&$select=id,name,file,lastModifiedDateTime,webUrl`, { headers }).then(r => r.ok ? r.json() : { value: [] }),
      fetch(`${graphUrl}/me/drive/sharedWithMe?$top=20&$select=id,name,file,lastModifiedDateTime,webUrl`, { headers }).then(r => r.ok ? r.json() : { value: [] }),
    ])

    const recentFiles = (recentRes.value || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mime_type: f.file?.mimeType || 'unknown',
      modified_time: f.lastModifiedDateTime,
      url: f.webUrl,
    }))

    const sharedFiles = (sharedRes.value || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mime_type: f.file?.mimeType || 'unknown',
      modified_time: f.lastModifiedDateTime,
      url: f.webUrl,
    }))

    return NextResponse.json({
      connected: true, provider: 'onedrive',
      recent_files: recentFiles,
      shared_files: sharedFiles,
    })
  } catch (err) {
    console.error('[microsoft/onedrive]', err)
    return NextResponse.json({ error: 'Failed to fetch OneDrive data', connected: true }, { status: 502 })
  }
}
