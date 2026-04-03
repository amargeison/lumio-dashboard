import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const DEV_BUSINESS_ID = 'eb9a4f02-bc0a-4b2b-8d19-dd724b5cbae0'
const DEV_PIN = '0717'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function getWorkspaceSession(req: Request): Promise<{ business_id: string } | null> {
  // Dev PIN bypass
  const cookieStore = await cookies()
  const devAccess = cookieStore.get('lumio_dev_access')
  if (devAccess?.value === DEV_PIN) {
    return { business_id: DEV_BUSINESS_ID }
  }

  // Normal session lookup
  const token = req.headers.get('x-workspace-token')
  if (!token) return null

  const supabase = getSupabase()
  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return session ?? null
}
