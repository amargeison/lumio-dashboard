import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['salesforce'])
  if (!tokenData) return NextResponse.json({ error: 'Salesforce not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token, extras } = tokenData
  const instanceUrl = (extras as Record<string, unknown>)?.instance_url as string || (extras as Record<string, unknown>)?.profile_name as string || ''
  if (!instanceUrl) return NextResponse.json({ error: 'Salesforce instance URL not configured', code: 'CONFIG_MISSING' }, { status: 400 })

  const headers = { Authorization: `Bearer ${access_token}` }
  const q = (soql: string) => `${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(soql)}`

  try {
    const [oppsRes, leadsRes, tasksRes] = await Promise.all([
      fetch(q('SELECT Id,Name,Amount,StageName FROM Opportunity WHERE IsClosed=false ORDER BY CreatedDate DESC LIMIT 10'), { headers }),
      fetch(q('SELECT Id,Name FROM Lead WHERE IsConverted=false AND CreatedDate=THIS_WEEK'), { headers }),
      fetch(q("SELECT Id,Subject FROM Task WHERE Status!='Completed' AND ActivityDate<=TODAY"), { headers }),
    ])

    if (oppsRes.status === 401) { await flagTokenExpired(businessId, ['salesforce']); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 }) }

    const oppsData = oppsRes.ok ? await oppsRes.json() : { records: [], totalSize: 0 }
    const leadsData = leadsRes.ok ? await leadsRes.json() : { totalSize: 0 }
    const tasksData = tasksRes.ok ? await tasksRes.json() : { totalSize: 0 }

    const opps = (oppsData.records || []) as { Amount: number }[]

    return NextResponse.json({
      provider: 'salesforce',
      openDeals: oppsData.totalSize || opps.length,
      pipelineValue: opps.reduce((s, o) => s + (o.Amount || 0), 0),
      newContactsThisWeek: leadsData.totalSize || 0,
      overdueTasks: tasksData.totalSize || 0,
    })
  } catch (err) { console.error('[salesforce/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
