import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['pipedrive'])
  if (!tokenData) return NextResponse.json({ error: 'Pipedrive not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  // Pipedrive uses API token — stored in access_token
  const apiToken = tokenData.access_token
  const base = 'https://api.pipedrive.com/v1'

  try {
    const [dealsRes, personsRes, activitiesRes] = await Promise.all([
      fetch(`${base}/deals?status=open&limit=10&api_token=${apiToken}`),
      fetch(`${base}/persons?limit=5&sort=add_time DESC&api_token=${apiToken}`),
      fetch(`${base}/activities?done=0&limit=10&api_token=${apiToken}`),
    ])

    if (dealsRes.status === 401) { await flagTokenExpired(businessId, ['pipedrive']); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 }) }

    const dealsData = dealsRes.ok ? await dealsRes.json() : { data: [] }
    const personsData = personsRes.ok ? await personsRes.json() : { data: [] }
    const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { data: [] }

    const deals = (dealsData.data || []) as { value: number }[]
    const activities = (activitiesData.data || []) as { due_date: string }[]
    const today = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      provider: 'pipedrive',
      openDeals: deals.length,
      pipelineValue: deals.reduce((s, d) => s + (d.value || 0), 0),
      newContactsThisWeek: (personsData.data || []).length,
      overdueTasks: activities.filter(a => a.due_date && a.due_date < today).length,
    })
  } catch (err) { console.error('[pipedrive/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
