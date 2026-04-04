import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['hubspot'])
  if (!tokenData) return NextResponse.json({ error: 'HubSpot not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token } = tokenData
  const headers = { Authorization: `Bearer ${access_token}` }

  try {
    const [dealsRes, contactsRes, tasksRes] = await Promise.all([
      fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=10&properties=dealname,amount,dealstage&sort=-createdate', { headers }),
      fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=5&sort=-createdate', { headers }),
      fetch('https://api.hubapi.com/crm/v3/objects/tasks?limit=10&properties=hs_task_status,hs_timestamp', { headers }),
    ])

    if (dealsRes.status === 401) { await flagTokenExpired(businessId, ['hubspot']); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 }) }

    const dealsData = dealsRes.ok ? await dealsRes.json() : { results: [] }
    const contactsData = contactsRes.ok ? await contactsRes.json() : { results: [], total: 0 }
    const tasksData = tasksRes.ok ? await tasksRes.json() : { results: [] }

    const deals = (dealsData.results || []) as { properties: { amount?: string } }[]
    const tasks = (tasksData.results || []) as { properties: { hs_task_status?: string } }[]
    const overdueTasks = tasks.filter(t => t.properties.hs_task_status === 'NOT_STARTED' || t.properties.hs_task_status === 'IN_PROGRESS')

    return NextResponse.json({
      provider: 'hubspot',
      openDeals: deals.length,
      pipelineValue: deals.reduce((s, d) => s + (parseFloat(d.properties.amount || '0') || 0), 0),
      newContactsThisWeek: contactsData.total || contactsData.results?.length || 0,
      overdueTasks: overdueTasks.length,
    })
  } catch (err) { console.error('[hubspot/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
