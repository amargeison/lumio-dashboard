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

  const { data: creds } = await supabase.from('integration_tokens').select('access_token, refresh_token').eq('business_id', session.business_id).eq('provider', 'trello').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Trello not connected', connected: false }, { status: 404 })

  // Trello uses key + token auth; access_token stores the token, refresh_token stores the API key
  const apiKey = creds.refresh_token || ''
  const apiToken = creds.access_token
  const baseUrl = 'https://api.trello.com/1'
  const auth = `key=${apiKey}&token=${apiToken}`

  try {
    const today = new Date().toISOString().split('T')[0]

    const [boardsRes, cardsRes] = await Promise.all([
      fetch(`${baseUrl}/members/me/boards?filter=open&fields=name&${auth}`).then(r => r.ok ? r.json() : []),
      fetch(`${baseUrl}/members/me/cards?filter=open&fields=due,dueComplete&${auth}`).then(r => r.ok ? r.json() : []),
    ])

    const boards = Array.isArray(boardsRes) ? boardsRes : []
    const cards = Array.isArray(cardsRes) ? cardsRes : []

    const overdueCards = cards.filter((c: any) => c.due && !c.dueComplete && c.due.split('T')[0] < today)
    const dueToday = cards.filter((c: any) => c.due && !c.dueComplete && c.due.split('T')[0] === today)

    return NextResponse.json({
      connected: true, provider: 'trello',
      open_boards: boards.length,
      my_cards: cards.length,
      overdue_cards: overdueCards.length,
      due_today: dueToday.length,
    })
  } catch (err) {
    console.error('[trello/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Trello data', connected: true }, { status: 502 })
  }
}
