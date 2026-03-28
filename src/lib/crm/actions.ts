'use server'

import { createClient } from '@supabase/supabase-js'
import type { CRMContact, CRMDeal, CRMActivity, ARIAInsight, PipelineStage } from './types'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function getCRMData(tenantId: string) {
  const supabase = getSupabase()

  try {
    const [contactsRes, dealsRes, activitiesRes, insightsRes, stagesRes] = await Promise.all([
      supabase
        .from('crm_contacts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('aria_score', { ascending: false }),
      supabase
        .from('crm_deals')
        .select('*, stage:crm_pipeline_stages(name, color), contact:crm_contacts(name), company:crm_companies(name)')
        .eq('tenant_id', tenantId)
        .order('value', { ascending: false }),
      supabase
        .from('crm_activities')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('crm_aria_insights')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('position', { ascending: true }),
    ])

    if (contactsRes.error) throw contactsRes.error
    if (dealsRes.error) throw dealsRes.error
    if (activitiesRes.error) throw activitiesRes.error
    if (insightsRes.error) throw insightsRes.error
    if (stagesRes.error) throw stagesRes.error

    // Flatten joined fields on deals
    const deals: CRMDeal[] = (dealsRes.data || []).map((d: any) => ({
      ...d,
      stage_name: d.stage?.name ?? null,
      stage_color: d.stage?.color ?? null,
      contact_name: d.contact?.name ?? null,
      company_name: d.company?.name ?? null,
      stage: undefined,
      contact: undefined,
      company: undefined,
    }))

    return {
      contacts: (contactsRes.data || []) as CRMContact[],
      deals,
      activities: (activitiesRes.data || []) as CRMActivity[],
      insights: (insightsRes.data || []) as ARIAInsight[],
      stages: (stagesRes.data || []) as PipelineStage[],
    }
  } catch (error) {
    console.error('[CRM] getCRMData error:', error)
    throw error
  }
}

export async function createContact(tenantId: string, data: Partial<CRMContact>) {
  const supabase = getSupabase()

  try {
    const initials = (data.name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .insert({
        tenant_id: tenantId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role || null,
        company_name: data.company_name || null,
        company_id: data.company_id || null,
        linkedin_url: data.linkedin_url || null,
        twitter_handle: data.twitter_handle || null,
        location: data.location || null,
        bio: data.bio || null,
        avatar_initials: initials,
        avatar_color: data.avatar_color || '#6B7280',
        aria_score: data.aria_score ?? 50,
        email_status: data.email_status || 'unverified',
        linkedin_status: data.linkedin_status || 'unknown',
        company_status: data.company_status || 'unknown',
        tags: data.tags || [],
        deal_value: data.deal_value ?? 0,
        buying_signals: data.buying_signals || [],
        enrichment_data: data.enrichment_data || {},
      })
      .select()
      .single()

    if (error) throw error
    return contact as CRMContact
  } catch (error) {
    console.error('[CRM] createContact error:', error)
    throw error
  }
}

export async function updateContact(id: string, data: Partial<CRMContact>) {
  const supabase = getSupabase()

  try {
    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return contact as CRMContact
  } catch (error) {
    console.error('[CRM] updateContact error:', error)
    throw error
  }
}

export async function createDeal(tenantId: string, data: Partial<CRMDeal>) {
  const supabase = getSupabase()

  try {
    const { data: deal, error } = await supabase
      .from('crm_deals')
      .insert({
        tenant_id: tenantId,
        title: data.title,
        value: data.value ?? 0,
        stage_id: data.stage_id || null,
        contact_id: data.contact_id || null,
        company_id: data.company_id || null,
        owner_id: data.owner_id || null,
        aria_score: data.aria_score ?? 50,
        engagement_score: data.engagement_score ?? 50,
        stakeholder_score: data.stakeholder_score ?? 50,
        momentum_score: data.momentum_score ?? 50,
        risk_score: data.risk_score ?? 0,
        days_in_stage: data.days_in_stage ?? 0,
        expected_close_date: data.expected_close_date || null,
        closed_at: data.closed_at || null,
        won: data.won ?? null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return deal as CRMDeal
  } catch (error) {
    console.error('[CRM] createDeal error:', error)
    throw error
  }
}

export async function updateDealStage(dealId: string, stageId: string) {
  const supabase = getSupabase()

  try {
    // Fetch the deal to get tenant_id for the activity log
    const { data: existingDeal, error: fetchError } = await supabase
      .from('crm_deals')
      .select('tenant_id, title, stage_id')
      .eq('id', dealId)
      .single()

    if (fetchError) throw fetchError

    // Get the new stage name for the activity log
    const { data: newStage, error: stageError } = await supabase
      .from('crm_pipeline_stages')
      .select('name')
      .eq('id', stageId)
      .single()

    if (stageError) throw stageError

    // Update the deal
    const { data: deal, error: updateError } = await supabase
      .from('crm_deals')
      .update({
        stage_id: stageId,
        days_in_stage: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
      .select()
      .single()

    if (updateError) throw updateError

    // Log the stage change as an activity
    await supabase.from('crm_activities').insert({
      tenant_id: existingDeal.tenant_id,
      deal_id: dealId,
      type: 'note',
      title: `Deal moved to ${newStage.name}`,
      body: `"${existingDeal.title}" was moved to the ${newStage.name} stage.`,
      metadata: { previous_stage_id: existingDeal.stage_id, new_stage_id: stageId },
    })

    return deal as CRMDeal
  } catch (error) {
    console.error('[CRM] updateDealStage error:', error)
    throw error
  }
}

export async function logActivity(tenantId: string, data: Partial<CRMActivity>) {
  const supabase = getSupabase()

  try {
    const { data: activity, error } = await supabase
      .from('crm_activities')
      .insert({
        tenant_id: tenantId,
        deal_id: data.deal_id || null,
        contact_id: data.contact_id || null,
        type: data.type || 'note',
        title: data.title || '',
        body: data.body || null,
        metadata: data.metadata || {},
        created_by: data.created_by || null,
      })
      .select()
      .single()

    if (error) throw error
    return activity as CRMActivity
  } catch (error) {
    console.error('[CRM] logActivity error:', error)
    throw error
  }
}

export async function seedDemoData(tenantId: string) {
  const supabase = getSupabase()

  try {
    // ── 1. Clear existing demo data for this tenant ──
    await Promise.all([
      supabase.from('crm_activities').delete().eq('tenant_id', tenantId),
      supabase.from('crm_aria_insights').delete().eq('tenant_id', tenantId),
      supabase.from('crm_deals').delete().eq('tenant_id', tenantId),
    ])
    // Contacts and stages after deals are cleared (FK constraints)
    await Promise.all([
      supabase.from('crm_contacts').delete().eq('tenant_id', tenantId),
      supabase.from('crm_pipeline_stages').delete().eq('tenant_id', tenantId),
    ])

    // ── 2. Pipeline stages ──
    const stageDefinitions = [
      { name: 'Lead', position: 0, color: '#6B7299' },
      { name: 'Qualified', position: 1, color: '#8B5CF6' },
      { name: 'Proposal', position: 2, color: '#14B8A6' },
      { name: 'Negotiation', position: 3, color: '#22D3EE' },
      { name: 'Closed Won', position: 4, color: '#10B981' },
      { name: 'Closed Lost', position: 5, color: '#EF4444' },
    ]

    const { data: stages, error: stagesError } = await supabase
      .from('crm_pipeline_stages')
      .insert(stageDefinitions.map(s => ({ ...s, tenant_id: tenantId })))
      .select()

    if (stagesError) throw stagesError

    const stageMap = new Map<string, string>()
    for (const stage of stages!) {
      stageMap.set(stage.name, stage.id)
    }

    // ── 3. Contacts ──
    const now = new Date().toISOString()
    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

    const contactDefinitions = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@axontech.io',
        role: 'VP Sales',
        company_name: 'Axon Technologies',
        avatar_initials: 'SC',
        avatar_color: '#8B5CF6',
        aria_score: 94,
        email_status: 'live' as const,
        linkedin_status: 'found' as const,
        company_status: 'confirmed' as const,
        tags: ['Hot Lead', 'Enterprise'],
        deal_value: 182000,
        buying_signals: ['Company raised Series C last month', 'Posted about AI CRM tools 3 days ago'],
        last_contacted_at: daysAgo(1),
      },
      {
        name: 'Marcus Webb',
        email: 'marcus@meridiangroup.co',
        role: 'CEO',
        company_name: 'Meridian Group',
        avatar_initials: 'MW',
        avatar_color: '#0D9488',
        aria_score: 87,
        email_status: 'live' as const,
        linkedin_status: 'found' as const,
        company_status: 'confirmed' as const,
        tags: ['Decision Maker'],
        deal_value: 94500,
        buying_signals: ['Hiring 3 sales roles right now'],
        last_contacted_at: daysAgo(3),
      },
      {
        name: 'Priya Nair',
        email: 'priya.nair@fluxcore.io',
        role: 'Head of Ops',
        company_name: 'FluxCore Ltd',
        avatar_initials: 'PN',
        avatar_color: '#22D3EE',
        aria_score: 72,
        email_status: 'live' as const,
        linkedin_status: 'unknown' as const,
        company_status: 'unknown' as const,
        tags: ['Warm', 'Growth'],
        deal_value: 67200,
        buying_signals: ['Viewed your LinkedIn profile 5 days ago'],
        last_contacted_at: daysAgo(5),
      },
      {
        name: 'James Harlow',
        email: 'j.harlow@vertexsys.com',
        role: 'CTO',
        company_name: 'Vertex Systems',
        avatar_initials: 'JH',
        avatar_color: '#EF4444',
        aria_score: 91,
        email_status: 'live' as const,
        linkedin_status: 'found' as const,
        company_status: 'warning' as const,
        tags: ['Hot Lead', 'Technical'],
        deal_value: 231000,
        buying_signals: ['\u26A0 LinkedIn shows \'Open to new roles\'', 'Opened proposal 4\u00D7 in 48h'],
        last_contacted_at: daysAgo(2),
      },
      {
        name: 'Elena Voss',
        email: 'elena.voss@crestlinecap.com',
        role: 'Finance Director',
        company_name: 'Crestline Capital',
        avatar_initials: 'EV',
        avatar_color: '#F59E0B',
        aria_score: 48,
        email_status: 'warning' as const,
        linkedin_status: 'unknown' as const,
        company_status: 'warning' as const,
        tags: ['Cold', 'Enterprise'],
        deal_value: 148000,
        buying_signals: ['\u26A0 Email soft bounce', '\u26A0 LinkedIn title updated \u2014 possible role change', '31 days no engagement'],
        last_contacted_at: daysAgo(31),
      },
      {
        name: 'Tom Rashid',
        email: 'tom@helixdigital.co',
        role: 'Product Director',
        company_name: 'Helix Digital',
        avatar_initials: 'TR',
        avatar_color: '#10B981',
        aria_score: 78,
        email_status: 'live' as const,
        linkedin_status: 'found' as const,
        company_status: 'confirmed' as const,
        tags: ['Warm', 'SMB'],
        deal_value: 52400,
        buying_signals: ['Replied within 2h consistently', 'Company featured in TechCrunch'],
        last_contacted_at: daysAgo(4),
      },
    ]

    const { data: contacts, error: contactsError } = await supabase
      .from('crm_contacts')
      .insert(contactDefinitions.map(c => ({ ...c, tenant_id: tenantId, enrichment_data: {} })))
      .select()

    if (contactsError) throw contactsError

    const contactMap = new Map<string, string>()
    for (const contact of contacts!) {
      contactMap.set(contact.name, contact.id)
    }

    // ── 4. Deals ──
    const dealDefinitions = [
      {
        title: 'Axon Technologies \u2014 Enterprise Suite',
        value: 182000,
        stage: 'Negotiation',
        contact: 'Sarah Chen',
        aria_score: 94,
        days_in_stage: 5,
        engagement_score: 90,
        stakeholder_score: 85,
        momentum_score: 80,
        risk_score: 5,
        won: null as boolean | null,
      },
      {
        title: 'Meridian Group \u2014 Pro Plan',
        value: 94500,
        stage: 'Proposal',
        contact: 'Marcus Webb',
        aria_score: 87,
        days_in_stage: 8,
        engagement_score: 80,
        stakeholder_score: 75,
        momentum_score: 70,
        risk_score: 10,
        won: null as boolean | null,
      },
      {
        title: 'FluxCore Ltd \u2014 Growth Package',
        value: 67200,
        stage: 'Qualified',
        contact: 'Priya Nair',
        aria_score: 72,
        days_in_stage: 12,
        engagement_score: 65,
        stakeholder_score: 60,
        momentum_score: 60,
        risk_score: 15,
        won: null as boolean | null,
      },
      {
        title: 'Vertex Systems \u2014 Technical Integration',
        value: 231000,
        stage: 'Proposal',
        contact: 'James Harlow',
        aria_score: 91,
        days_in_stage: 3,
        engagement_score: 88,
        stakeholder_score: 80,
        momentum_score: 92,
        risk_score: 8,
        won: null as boolean | null,
      },
      {
        title: 'Crestline Capital \u2014 Enterprise',
        value: 148000,
        stage: 'Lead',
        contact: 'Elena Voss',
        aria_score: 48,
        days_in_stage: 31,
        engagement_score: 20,
        stakeholder_score: 40,
        momentum_score: 10,
        risk_score: 60,
        won: null as boolean | null,
      },
      {
        title: 'Helix Digital \u2014 SMB Suite',
        value: 52400,
        stage: 'Qualified',
        contact: 'Tom Rashid',
        aria_score: 78,
        days_in_stage: 7,
        engagement_score: 75,
        stakeholder_score: 65,
        momentum_score: 75,
        risk_score: 10,
        won: null as boolean | null,
      },
      {
        title: 'Axon Technologies \u2014 Data Migration',
        value: 45000,
        stage: 'Closed Won',
        contact: 'Sarah Chen',
        aria_score: 96,
        days_in_stage: 0,
        engagement_score: 95,
        stakeholder_score: 90,
        momentum_score: 95,
        risk_score: 0,
        won: true,
        closed_at: daysAgo(10),
      },
      {
        title: 'FluxCore Ltd \u2014 Pilot',
        value: 12000,
        stage: 'Closed Lost',
        contact: 'Priya Nair',
        aria_score: 35,
        days_in_stage: 0,
        engagement_score: 15,
        stakeholder_score: 30,
        momentum_score: 10,
        risk_score: 80,
        won: false,
        closed_at: daysAgo(20),
      },
    ]

    const { data: deals, error: dealsError } = await supabase
      .from('crm_deals')
      .insert(
        dealDefinitions.map(d => ({
          tenant_id: tenantId,
          title: d.title,
          value: d.value,
          stage_id: stageMap.get(d.stage) || null,
          contact_id: contactMap.get(d.contact) || null,
          aria_score: d.aria_score,
          days_in_stage: d.days_in_stage,
          engagement_score: d.engagement_score,
          stakeholder_score: d.stakeholder_score,
          momentum_score: d.momentum_score,
          risk_score: d.risk_score,
          won: d.won,
          closed_at: (d as any).closed_at || null,
        }))
      )
      .select()

    if (dealsError) throw dealsError

    const dealMap = new Map<string, string>()
    for (const deal of deals!) {
      dealMap.set(deal.title, deal.id)
    }

    // ── 5. Activities ──
    const activityDefinitions = [
      {
        deal_id: dealMap.get('Axon Technologies \u2014 Enterprise Suite'),
        contact_id: contactMap.get('Sarah Chen'),
        type: 'call' as const,
        title: 'Discovery call with Sarah Chen',
        body: 'Discussed enterprise requirements. Sarah confirmed budget approval for Q1.',
        created_at: daysAgo(1),
      },
      {
        deal_id: dealMap.get('Vertex Systems \u2014 Technical Integration'),
        contact_id: contactMap.get('James Harlow'),
        type: 'email' as const,
        title: 'Proposal sent to James Harlow',
        body: 'Sent revised technical integration proposal with updated pricing.',
        created_at: daysAgo(2),
      },
      {
        deal_id: dealMap.get('Meridian Group \u2014 Pro Plan'),
        contact_id: contactMap.get('Marcus Webb'),
        type: 'meeting' as const,
        title: 'Demo meeting with Meridian Group',
        body: 'Full product demo. Marcus interested in Pro Plan features.',
        created_at: daysAgo(3),
      },
      {
        deal_id: dealMap.get('Helix Digital \u2014 SMB Suite'),
        contact_id: contactMap.get('Tom Rashid'),
        type: 'email' as const,
        title: 'Follow-up email to Tom Rashid',
        body: 'Sent case study and ROI calculator.',
        created_at: daysAgo(4),
      },
      {
        deal_id: dealMap.get('Crestline Capital \u2014 Enterprise'),
        contact_id: contactMap.get('Elena Voss'),
        type: 'note' as const,
        title: 'Elena Voss \u2014 no response',
        body: 'Third follow-up with no reply. Email may be bouncing. Consider alternative contact.',
        created_at: daysAgo(10),
      },
    ]

    const { error: activitiesError } = await supabase
      .from('crm_activities')
      .insert(activityDefinitions.map(a => ({ ...a, tenant_id: tenantId, metadata: {} })))

    if (activitiesError) throw activitiesError

    // ── 6. ARIA Insights ──
    const insightDefinitions = [
      {
        deal_id: dealMap.get('Axon Technologies \u2014 Enterprise Suite'),
        contact_id: contactMap.get('Sarah Chen'),
        type: 'signal' as const,
        title: 'Sarah Chen opened the proposal 4 times in the last 48 hours',
        description: 'High engagement signal. Consider scheduling a closing call this week.',
        action_label: 'Schedule call',
        deal_value: 182000,
      },
      {
        deal_id: dealMap.get('Vertex Systems \u2014 Technical Integration'),
        contact_id: contactMap.get('James Harlow'),
        type: 'warning' as const,
        title: 'James Harlow\'s LinkedIn shows "Open to new roles"',
        description: 'Your champion may be leaving Vertex Systems. Identify a backup stakeholder immediately.',
        action_label: 'Find backup contact',
        deal_value: 231000,
      },
      {
        deal_id: dealMap.get('Crestline Capital \u2014 Enterprise'),
        contact_id: contactMap.get('Elena Voss'),
        type: 'warning' as const,
        title: 'Crestline Capital deal stalled for 31 days',
        description: 'No engagement from Elena Voss in over a month. Email showing soft bounce. This deal is at serious risk.',
        action_label: 'Re-engage or archive',
        deal_value: 148000,
      },
      {
        deal_id: dealMap.get('Meridian Group \u2014 Pro Plan'),
        contact_id: contactMap.get('Marcus Webb'),
        type: 'tip' as const,
        title: 'Meridian Group is hiring 3 sales roles',
        description: 'Growth signal detected. Marcus may need CRM tooling for incoming team members \u2014 great upsell opportunity.',
        action_label: 'Pitch expansion',
        deal_value: 94500,
      },
    ]

    const { error: insightsError } = await supabase
      .from('crm_aria_insights')
      .insert(insightDefinitions.map(i => ({ ...i, tenant_id: tenantId, dismissed: false })))

    if (insightsError) throw insightsError

    return { success: true, counts: { contacts: 6, stages: 6, deals: 8, activities: 5, insights: 4 } }
  } catch (error) {
    console.error('[CRM] seedDemoData error:', error)
    throw error
  }
}
