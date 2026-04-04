import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['xero'])
  if (!tokenData) return NextResponse.json({ error: 'Xero not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token, extras } = tokenData
  const tenantId = (extras as Record<string, unknown>)?.xero_tenant_id as string || ''
  const headers: Record<string, string> = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }
  if (tenantId) headers['Xero-Tenant-Id'] = tenantId

  try {
    const [recRes, payRes] = await Promise.all([
      fetch('https://api.xero.com/api.xro/2.0/Invoices?Statuses=AUTHORISED,OVERDUE&where=Type%3D%3D%22ACCREC%22', { headers }),
      fetch('https://api.xero.com/api.xro/2.0/Invoices?Statuses=AUTHORISED,OVERDUE&where=Type%3D%3D%22ACCPAY%22', { headers }),
    ])

    if (recRes.status === 401 || payRes.status === 401) {
      await flagTokenExpired(businessId, ['xero'])
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    const recData = recRes.ok ? await recRes.json() : { Invoices: [] }
    const payData = payRes.ok ? await payRes.json() : { Invoices: [] }
    const receivables = (recData.Invoices || []) as { AmountDue: number; Status: string }[]
    const payables = (payData.Invoices || []) as { AmountDue: number; Status: string }[]

    return NextResponse.json({
      provider: 'xero',
      outstanding: receivables.reduce((s, i) => s + (i.AmountDue || 0), 0),
      billsDue: payables.reduce((s, i) => s + (i.AmountDue || 0), 0),
      overdueCount: receivables.filter(i => i.Status === 'OVERDUE').length + payables.filter(i => i.Status === 'OVERDUE').length,
      invoiceCount: receivables.length, billCount: payables.length,
    })
  } catch (err) { console.error('[xero/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
