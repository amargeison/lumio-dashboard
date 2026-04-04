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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'google').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Google not connected', connected: false }, { status: 404 })

  const headers = { Authorization: `Bearer ${creds.access_token}` }

  try {
    const [recentRes, sharedRes] = await Promise.all([
      fetch('https://www.googleapis.com/drive/v3/files?orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)', { headers }).then(r => r.ok ? r.json() : { files: [] }),
      fetch('https://www.googleapis.com/drive/v3/files?q=sharedWithMe=true&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)', { headers }).then(r => r.ok ? r.json() : { files: [] }),
    ])

    const recentFiles = (recentRes.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      modified_time: f.modifiedTime,
      url: f.webViewLink,
      icon: f.iconLink,
    }))

    const sharedFiles = (sharedRes.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      modified_time: f.modifiedTime,
      url: f.webViewLink,
      icon: f.iconLink,
    }))

    return NextResponse.json({
      connected: true, provider: 'google_drive',
      recent_files: recentFiles,
      shared_files: sharedFiles,
    })
  } catch (err) {
    console.error('[google/drive]', err)
    return NextResponse.json({ error: 'Failed to fetch Google Drive data', connected: true }, { status: 502 })
  }
}
