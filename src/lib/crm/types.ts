export interface CRMContact {
  id: string
  tenant_id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  company_name: string | null
  company_id: string | null
  linkedin_url: string | null
  twitter_handle: string | null
  location: string | null
  bio: string | null
  avatar_initials: string | null
  avatar_color: string | null
  aria_score: number
  email_status: 'live' | 'warning' | 'bounced' | 'unverified'
  linkedin_status: 'found' | 'not_found' | 'unknown'
  company_status: 'confirmed' | 'warning' | 'unknown'
  tags: string[]
  deal_value: number
  last_contacted_at: string | null
  enriched_at: string | null
  enrichment_data: Record<string, any>
  buying_signals: string[]
  created_at: string
  updated_at: string
}

export interface CRMCompany {
  id: string
  tenant_id: string
  name: string
  domain: string | null
  industry: string | null
  headcount_range: string | null
  revenue_estimate: string | null
  funded: boolean
  linkedin_url: string | null
  website: string | null
  location: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  tenant_id: string
  name: string
  position: number
  color: string
  created_at: string
}

export interface CRMDeal {
  id: string
  tenant_id: string
  title: string
  value: number
  stage_id: string | null
  contact_id: string | null
  company_id: string | null
  owner_id: string | null
  aria_score: number
  engagement_score: number
  stakeholder_score: number
  momentum_score: number
  risk_score: number
  days_in_stage: number
  last_activity_at: string | null
  expected_close_date: string | null
  closed_at: string | null
  won: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  stage_name?: string
  stage_color?: string
  contact_name?: string
  company_name?: string
}

export interface CRMActivity {
  id: string
  tenant_id: string
  deal_id: string | null
  contact_id: string | null
  type: 'call' | 'email' | 'note' | 'meeting' | 'task' | 'enrichment' | 'aria_alert'
  title: string
  body: string | null
  metadata: Record<string, any>
  created_by: string | null
  created_at: string
}

export interface ARIAInsight {
  id: string
  tenant_id: string
  deal_id: string | null
  contact_id: string | null
  type: 'warning' | 'info' | 'signal' | 'tip'
  title: string
  description: string
  action_label: string | null
  deal_value: number | null
  dismissed: boolean
  created_at: string
}

export interface CRMContext {
  userName: string
  contacts: CRMContact[]
  deals: CRMDeal[]
  totalPipelineValue: number
  winRate: number
  openDealsCount: number
}

export interface EnrichmentResult {
  bio: string
  location: string
  companySize: string
  companyRevenue: string
  linkedinUrl: string
  twitterHandle: string | null
  emailStatus: 'live' | 'warning'
  companyStatus: 'confirmed' | 'warning'
  enrichmentScore: number
  buyingSignals: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
