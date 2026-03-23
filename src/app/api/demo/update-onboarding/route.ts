import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { session_token, selected_departments } = await req.json() as {
      session_token: string
      selected_departments: string[]
    }

    if (!session_token) {
      return NextResponse.json({ error: 'Missing session_token' }, { status: 400 })
    }

    // Verify session exists and is not expired
    const { data: session, error: sessionError } = await supabase
      .from('demo_sessions')
      .select('id, expires_at')
      .eq('token', session_token)
      .maybeSingle()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const { error: updateError } = await supabase
      .from('demo_sessions')
      .update({
        onboarded: true,
        selected_departments: selected_departments ?? [],
      })
      .eq('id', session.id)

    if (updateError) {
      console.error('[demo/update-onboarding] update error:', updateError)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[demo/update-onboarding] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
