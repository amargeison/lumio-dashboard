import { createClient } from '@supabase/supabase-js'

const getServiceClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function trackSportsEvent(
  userId: string | null,
  sport: string,
  event_type: 'ai_call' | 'quick_action' | 'page_view' | 'login' | 'settings_change',
  event_name: string,
  metadata?: Record<string, unknown>
) {
  try {
    await getServiceClient().from('sports_events').insert({
      user_id: userId,
      sport,
      event_type,
      event_name,
      metadata: metadata || {}
    })
  } catch {
    // Non-fatal — table may not exist yet
  }
}

export async function trackSportsLogin(
  userId: string | null,
  sport: string,
  ip_address?: string,
  user_agent?: string
) {
  try {
    await getServiceClient().from('sports_logins').insert({
      user_id: userId,
      sport,
      ip_address: ip_address || null,
      user_agent: user_agent || null
    })
  } catch {
    // Non-fatal — table may not exist yet
  }
}
