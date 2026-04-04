import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['quickbooks'])
  if (!tokenData) return NextResponse.json({ error: 'QuickBooks not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token, extras } = tokenData
  const realmId = (extras as Record<string, unknown>)?.realm_id as string || ''
  if (!realmId) return NextResponse.json({ error: 'QuickBooks realm ID not configured', code: 'CONFIG_MISSING' }, { status: 400 })

  const base = process.env.QUICKBOOKS_SANDBOX === 'true' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com'
  const headers = { Authorization: `Bearer ${access_token}`, Accept: 'application/json' }

  try {
    const [invRes, billRes] = await Promise.all([
      fetch(`${base}/v3/company/${realmId}/query?query=${encodeURIComponent('SELECT * FROM Invoice WHERE Balance > 0')}`, { headers }),
      fetch(`${base}/v3/company/${realmId}/query?query=${encodeURIComponent("SELECT * FROM Bill WHERE Balance > '0'")}`, { headers }),
    ])

    if (invRes.status === 401 || billRes.status === 401) {
      await flagTokenExpired(businessId, ['quickbooks']); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    const invData = invRes.ok ? await invRes.json() : { QueryResponse: {} }
    const billData = billRes.ok ? await billRes.json() : { QueryResponse: {} }
    const invoices = (invData.QueryResponse?.Invoice || []) as { Balance: number; DueDate: string }[]
    const bills = (billData.QueryResponse?.Bill || []) as { Balance: number; DueDate: string }[]
    const today = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      provider: 'quickbooks',
      outstanding: invoices.reduce((s, i) => s + (i.Balance || 0), 0),
      billsDue: bills.reduce((s, i) => s + (i.Balance || 0), 0),
      overdueCount: invoices.filter(i => i.DueDate && i.DueDate < today).length + bills.filter(b => b.DueDate && b.DueDate < today).length,
      invoiceCount: invoices.length, billCount: bills.length,
    })
  } catch (err) { console.error('[quickbooks/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
