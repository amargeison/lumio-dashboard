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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'monday').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Monday not connected', connected: false }, { status: 404 })

  const apiUrl = 'https://api.monday.com/v2'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.access_token}` }

  try {
    const today = new Date().toISOString().split('T')[0]

    const query = `{
      boards (limit: 100, state: active) {
        id name
        items_page (limit: 500) {
          items {
            id
            column_values { id type text }
          }
        }
      }
    }`

    const res = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify({ query }) })
    const json = res.ok ? await res.json() : { data: { boards: [] } }

    const boards = json.data?.boards || []
    let totalItems = 0
    let inProgress = 0
    let overdue = 0

    for (const board of boards) {
      const items = board.items_page?.items || []
      totalItems += items.length
      for (const item of items) {
        const cols = item.column_values || []
        const statusCol = cols.find((c: any) => c.type === 'status' || c.id === 'status')
        const dateCol = cols.find((c: any) => c.type === 'date' || c.id === 'date')
        if (statusCol?.text && /working|in progress|doing/i.test(statusCol.text)) inProgress++
        if (dateCol?.text && dateCol.text < today && statusCol?.text && !/done|complete/i.test(statusCol.text)) overdue++
      }
    }

    return NextResponse.json({
      connected: true, provider: 'monday',
      active_boards: boards.length,
      total_items: totalItems,
      in_progress: inProgress,
      overdue,
    })
  } catch (err) {
    console.error('[monday/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Monday data', connected: true }, { status: 502 })
  }
}
