import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['sage'])
  if (!tokenData) return NextResponse.json({ error: 'Sage not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token } = tokenData
  const headers = { Authorization: `Bearer ${access_token}` }

  try {
    const [salesRes, purchRes] = await Promise.all([
      fetch('https://api.accounting.sage.com/v3.1/sales_invoices?attributes=total_amount,due_date,status&status=UNPAID', { headers }),
      fetch('https://api.accounting.sage.com/v3.1/purchase_invoices?attributes=total_amount,due_date,status&status=UNPAID', { headers }),
    ])

    if (salesRes.status === 401 || purchRes.status === 401) {
      await flagTokenExpired(businessId, ['sage']); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    const salesData = salesRes.ok ? await salesRes.json() : { $items: [] }
    const purchData = purchRes.ok ? await purchRes.json() : { $items: [] }
    const sales = (salesData.$items || []) as { total_amount: number; due_date: string; status: string }[]
    const purchases = (purchData.$items || []) as { total_amount: number; due_date: string; status: string }[]
    const today = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      provider: 'sage',
      outstanding: sales.reduce((s, i) => s + (i.total_amount || 0), 0),
      billsDue: purchases.reduce((s, i) => s + (i.total_amount || 0), 0),
      overdueCount: sales.filter(i => i.due_date && i.due_date < today).length + purchases.filter(i => i.due_date && i.due_date < today).length,
      invoiceCount: sales.length, billCount: purchases.length,
    })
  } catch (err) { console.error('[sage/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
