import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getWorkspaceSession } from '@/lib/auth/workspace-auth'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const session = await getWorkspaceSession(req)
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  const { business_id } = session

  const { data: business } = await supabase
    .from('businesses')
    .select('slug')
    .eq('id', business_id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('logo') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // Validate
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })

  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
  if (!validTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'png'
  const path = `${business.slug}/logo.${ext}`

  // Upload to Supabase Storage (auto-create bucket if missing)
  const buffer = Buffer.from(await file.arrayBuffer())
  let { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  // If bucket doesn't exist, create it and retry
  if (uploadError && (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist') || (uploadError as any).statusCode === '404')) {
    console.log('[workspace/logo] Bucket not found, creating...')
    await supabase.storage.createBucket('logos', { public: true })
    const retry = await supabase.storage
      .from('logos')
      .upload(path, buffer, { contentType: file.type, upsert: true })
    uploadError = retry.error
  }

  if (uploadError) {
    console.error('[workspace/logo] Upload failed:', JSON.stringify(uploadError))
    return NextResponse.json({ error: 'Upload failed', detail: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
  const logoUrl = urlData.publicUrl

  // Save to businesses table
  const { error: updateError } = await supabase
    .from('businesses')
    .update({ logo_url: logoUrl })
    .eq('id', business_id)

  if (updateError) {
    console.error('[workspace/logo] Update failed:', updateError)
    return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 })
  }

  return NextResponse.json({ success: true, logo_url: logoUrl })
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabase()
  const session = await getWorkspaceSession(req)
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  const { business_id } = session

  await supabase
    .from('businesses')
    .update({ logo_url: null })
    .eq('id', business_id)

  return NextResponse.json({ success: true })
}
