import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getWorkspaceSession } from '@/lib/auth/workspace-auth'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const session = await getWorkspaceSession(req)
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  const { business_id } = session
  const cookieStore = await cookies()
  const devPinActive = cookieStore.get('lumio_dev_access')?.value === '0717'

  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan, onboarding_complete, onboarding_completed, onboarded, demo_data_active, created_at')
    .eq('id', business_id)
    .single()

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Also look up the owner's avatar from workspace_staff or auth metadata
  let user_avatar_url: string | null = null
  if (business.owner_email) {
    const { data: staffRow } = await supabase
      .from('workspace_staff')
      .select('profile_photo_url')
      .eq('business_id', business_id)
      .eq('email', business.owner_email)
      .maybeSingle()
    if (staffRow?.profile_photo_url) {
      user_avatar_url = staffRow.profile_photo_url
    }

    if (!user_avatar_url) {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const authUser = users.find(u => u.email === business.owner_email)
      const fallbackAvatar = (authUser?.user_metadata?.avatar_url as string | undefined) ?? null
      if (fallbackAvatar) {
        user_avatar_url = fallbackAvatar
      }
    }
  }

  // Count workspace_staff rows for this business
  const { count: staff_count } = await supabase
    .from('workspace_staff')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business_id)

  return NextResponse.json({ ...business, user_avatar_url, staff_count: staff_count ?? 0, demo_data_active: devPinActive ? true : business.demo_data_active })
}
