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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'notion').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Notion not connected', connected: false }, { status: 404 })

  const baseUrl = 'https://api.notion.com/v1'
  const headers: Record<string, string> = {
    Authorization: `Bearer ${creds.access_token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }

  try {
    const [searchRes, dbRes] = await Promise.all([
      fetch(`${baseUrl}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { property: 'object', value: 'page' }, sort: { direction: 'descending', timestamp: 'last_edited_time' }, page_size: 50 }),
      }).then(r => r.ok ? r.json() : { results: [] }),
      fetch(`${baseUrl}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 100 }),
      }).then(r => r.ok ? r.json() : { results: [] }),
    ])

    const pages = Array.isArray(searchRes.results) ? searchRes.results : []
    const databases = Array.isArray(dbRes.results) ? dbRes.results : []

    // Count pages that have a checkbox property marked incomplete (heuristic for open tasks)
    const openTasks = pages.filter((p: any) => {
      const props = p.properties || {}
      for (const key of Object.keys(props)) {
        const prop = props[key]
        if (prop.type === 'checkbox' && prop.checkbox === false) return true
        if (prop.type === 'status' && prop.status?.name && !/done|complete/i.test(prop.status.name)) return true
      }
      return false
    })

    return NextResponse.json({
      connected: true, provider: 'notion',
      recent_pages: pages.length,
      open_tasks: openTasks.length,
      databases_count: databases.length,
    })
  } catch (err) {
    console.error('[notion/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Notion data', connected: true }, { status: 502 })
  }
}
