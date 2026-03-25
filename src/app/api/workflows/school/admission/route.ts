import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { n8nWebhook } from '@/lib/n8n'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateAdmissionNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('school_pupils')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `ADM-${year}-${seq}`
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    first_name,
    last_name,
    preferred_name,
    date_of_birth,
    gender,
    ethnicity,
    home_language,
    nationality,
    year_group,
    class_name,
    start_date,
    previous_school,
    address_line1,
    address_line2,
    town_city,
    postcode,
    contact1_name,
    contact1_relation,
    contact1_phone,
    contact1_email,
    contact1_parental_responsibility,
    contact2_name,
    contact2_relation,
    contact2_phone,
    contact2_email,
    contact2_parental_responsibility,
    medical_conditions,
    medications,
    dietary_requirements,
    allergies,
    gp_name,
    gp_phone,
    has_send,
    send_details,
    is_lac,
    lac_details,
    has_eal,
    eal_language,
    eligible_fsm,
    pupil_premium,
  } = body as {
    first_name: string
    last_name: string
    preferred_name?: string
    date_of_birth: string
    gender?: string
    ethnicity?: string
    home_language?: string
    nationality?: string
    year_group: string
    class_name?: string
    start_date: string
    previous_school?: string
    address_line1?: string
    address_line2?: string
    town_city?: string
    postcode?: string
    contact1_name: string
    contact1_relation?: string
    contact1_phone?: string
    contact1_email?: string
    contact1_parental_responsibility?: boolean
    contact2_name?: string
    contact2_relation?: string
    contact2_phone?: string
    contact2_email?: string
    contact2_parental_responsibility?: boolean
    medical_conditions?: string
    medications?: string
    dietary_requirements?: string[]
    allergies?: string
    gp_name?: string
    gp_phone?: string
    has_send?: boolean
    send_details?: string
    is_lac?: boolean
    lac_details?: string
    has_eal?: boolean
    eal_language?: string
    eligible_fsm?: boolean
    pupil_premium?: boolean
  }

  if (!first_name || !last_name || !date_of_birth || !year_group || !start_date || !contact1_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let savedId: string | null = null
  let admissionNumber = `ADM-${new Date().getFullYear()}-001`

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    admissionNumber = await generateAdmissionNumber(supabase)

    const { data, error } = await supabase
      .from('school_pupils')
      .insert({
        first_name,
        last_name,
        preferred_name: preferred_name ?? null,
        date_of_birth,
        gender: gender ?? null,
        ethnicity: ethnicity ?? null,
        home_language: home_language ?? null,
        nationality: nationality ?? null,
        year_group,
        class_name: class_name ?? null,
        start_date,
        previous_school: previous_school ?? null,
        admission_number: admissionNumber,
        address_line1: address_line1 ?? null,
        address_line2: address_line2 ?? null,
        town_city: town_city ?? null,
        postcode: postcode ?? null,
        contact1_name,
        contact1_relation: contact1_relation ?? null,
        contact1_phone: contact1_phone ?? null,
        contact1_email: contact1_email ?? null,
        contact1_parental_responsibility: contact1_parental_responsibility ?? true,
        contact2_name: contact2_name ?? null,
        contact2_relation: contact2_relation ?? null,
        contact2_phone: contact2_phone ?? null,
        contact2_email: contact2_email ?? null,
        contact2_parental_responsibility: contact2_parental_responsibility ?? false,
        medical_conditions: medical_conditions ?? null,
        medications: medications ?? null,
        dietary_requirements: dietary_requirements ?? [],
        allergies: allergies ?? null,
        gp_name: gp_name ?? null,
        gp_phone: gp_phone ?? null,
        has_send: has_send ?? false,
        send_details: send_details ?? null,
        is_lac: is_lac ?? false,
        lac_details: lac_details ?? null,
        has_eal: has_eal ?? false,
        eal_language: eal_language ?? null,
        eligible_fsm: eligible_fsm ?? false,
        pupil_premium: pupil_premium ?? false,
        status: 'Pending',
        n8n_fired: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[school/admission] Supabase insert error:', error)
    } else {
      savedId = data?.id ?? null
    }
  }

  // Determine which notifications should fire
  const triggers = {
    welcome_email: !!(contact1_email || contact2_email),
    notify_class_teacher: !!class_name,
    notify_senco: has_send ?? false,
    notify_dsl: is_lac ?? false,
    notify_office_fsm: eligible_fsm ?? false,
    schedule_induction: true,
  }

  const webhookUrl = n8nWebhook('school-admission')
  const webhookPayload = {
    id: savedId,
    admission_number: admissionNumber,
    pupil_name: `${first_name} ${last_name}`,
    year_group,
    start_date,
    contact1_name,
    contact1_email,
    contact1_phone,
    has_send,
    is_lac,
    eligible_fsm,
    triggers,
  }

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    } catch (err) {
      console.error('[school/admission] Webhook error:', err)
    }
  }

  return NextResponse.json({
    status: 'admitted',
    id: savedId,
    admission_number: admissionNumber,
    pupil_name: `${first_name} ${last_name}`,
    year_group,
    start_date,
    triggers,
    webhook_fired: !!webhookUrl,
  })
}
