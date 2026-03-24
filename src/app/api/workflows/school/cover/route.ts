import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPPLY_DAY_RATE = 180 // £ per day — default estimate if no agency rate set

function daysBetween(start: string, end: string): number {
  const s = new Date(start), e = new Date(end)
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    absent_staff,
    cover_start_date,
    cover_end_date,
    classes,
    cover_type,
    agency_name,
    special_reqs,
  } = body as {
    absent_staff: string
    cover_start_date: string
    cover_end_date: string
    classes: string[]
    cover_type: string
    agency_name?: string
    special_reqs?: string
  }

  if (!absent_staff || !cover_start_date || !cover_end_date || !classes?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let savedId: string | null = null
  let assignedTo: string | null = null
  let internalFound = false
  const days = daysBetween(cover_start_date, cover_end_date)
  const estimatedCost = days * (cover_type === 'Supply Agency' ? SUPPLY_DAY_RATE : 95)

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check internal cover pool for available staff
    const { data: poolData } = await supabase
      .from('school_cover_pool')
      .select('staff_name, role, day_rate')
      .eq('available', true)
      .limit(5)

    if (poolData && poolData.length > 0 && cover_type !== 'Supply Agency') {
      assignedTo = (poolData[0] as { staff_name: string }).staff_name
      internalFound = true
    }

    const { data, error } = await supabase
      .from('school_cover_bookings')
      .insert({
        absent_staff,
        cover_start_date,
        cover_end_date,
        classes,
        cover_type: internalFound ? 'Internal' : cover_type,
        agency_name: internalFound ? null : (agency_name ?? null),
        assigned_to: assignedTo,
        special_reqs: special_reqs ?? null,
        estimated_cost: estimatedCost,
        status: 'Pending',
        n8n_fired: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[school/cover] Supabase insert error:', error)
    } else {
      savedId = data?.id ?? null
    }
  }

  // Fire n8n webhook only if no internal cover found (or explicitly requesting supply)
  const webhookUrl = process.env.N8N_SUPPLY_COVER_WEBHOOK_URL
  const fireWebhook = !internalFound && !!webhookUrl

  if (fireWebhook && webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedId,
          absent_staff,
          cover_start_date,
          cover_end_date,
          classes,
          cover_type,
          agency_name,
          special_reqs,
          estimated_cost: estimatedCost,
          days,
        }),
      })
    } catch (err) {
      console.error('[school/cover] Webhook error:', err)
    }
  }

  return NextResponse.json({
    status: 'booked',
    id: savedId,
    internal_cover_found: internalFound,
    assigned_to: assignedTo,
    supply_agency_contacted: fireWebhook,
    estimated_cost: estimatedCost,
    days,
  })
}
