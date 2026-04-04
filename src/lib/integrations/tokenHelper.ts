import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function getBusinessId(wsToken: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('business_sessions')
    .select('business_id')
    .eq('token', wsToken)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data?.business_id || null
}

export async function getIntegrationToken(
  businessId: string,
  providerVariants: string[],
): Promise<{ access_token: string; refresh_token: string | null; extras: Record<string, unknown> } | null> {
  const { data } = await getSupabase()
    .from('integration_tokens')
    .select('*')
    .eq('business_id', businessId)
    .in('provider', providerVariants)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.access_token) return null
  return { access_token: data.access_token, refresh_token: data.refresh_token, extras: data }
}

export async function flagTokenExpired(businessId: string, providerVariants: string[]) {
  await getSupabase()
    .from('integration_tokens')
    .update({ expires_at: new Date(0).toISOString() })
    .eq('business_id', businessId)
    .in('provider', providerVariants)
}
