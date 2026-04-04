import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getWorkspaceSession } from '@/lib/auth/workspace-auth'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const session = await getWorkspaceSession(req)
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  const { business_id } = session

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const email = formData.get('email') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type — JPG, PNG or WebP only' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large — maximum 2MB' }, { status: 400 })

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
    const slug = email ? email.replace(/[^a-z0-9]/gi, '-') : `staff-${Date.now()}`
    const path = `${business_id}/${slug}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    // Ensure bucket exists (ignore error if already exists)
    await supabase.storage.createBucket('profile-photos', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, buffer, { upsert: true, contentType: file.type })
    if (uploadError) {
      console.error('[upload-profile-photo] Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed — please try again' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path)

    // Update workspace_staff with the photo URL
    if (email) {
      await supabase.from('workspace_staff').update({ profile_photo_url: publicUrl }).eq('business_id', business_id).eq('email', email)
        .then(({ error: dbErr }) => { if (dbErr) console.warn('[upload-profile-photo] DB update note:', dbErr.message) })
    }

    // Also save to auth user metadata so it persists across sessions
    if (email) {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers?.users?.find((u: { email?: string }) => u.email === email)
      if (authUser) {
        await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: { avatar_url: publicUrl }
        }).then(({ error: authErr }) => { if (authErr) console.warn('[upload-profile-photo] Auth metadata update note:', authErr.message) })
      }
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err) {
    console.error('[upload-profile-photo] Error:', err)
    return NextResponse.json({ error: 'Upload failed — please try again' }, { status: 500 })
  }
}
