import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Default ElevenLabs voice — "Dallin" (positive, inspiring & clear)
const VOICE_ID = 'alFofuDn3cOwyoz1i44T'
const MODEL_ID = 'eleven_turbo_v2_5'
const TRIAL_DAILY_LIMIT = 5

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 500 })
  }

  try {
    const { text, voice, voice_id } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    if (text.length > 500) {
      return NextResponse.json({ error: 'Text too long — max 500 characters' }, { status: 400 })
    }

    // Check if caller is trial — enforce daily limit
    const demoToken = req.headers.get('x-demo-token')
    const workspaceToken = req.headers.get('x-workspace-token')

    if (demoToken && !workspaceToken) {
      // Trial user — check daily usage
      const supabase = getSupabase()
      const { data: session } = await supabase
        .from('demo_sessions')
        .select('tenant_id')
        .eq('token', demoToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (session) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { count } = await supabase
          .from('email_log')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', session.tenant_id)
          .eq('email_type', 'tts_usage')
          .gte('sent_at', todayStart.toISOString())

        if ((count ?? 0) >= TRIAL_DAILY_LIMIT) {
          return NextResponse.json({
            error: 'Daily limit reached — upgrade to Lumio for unlimited voice',
            limit_reached: true,
          }, { status: 429 })
        }

        // Log this usage
        await supabase.from('email_log').insert({
          workspace_id: session.tenant_id,
          email_type: 'tts_usage',
          recipient: 'tts',
        })
      }
    }
    // Paid users (workspaceToken) — no limit

    const voiceId = voice_id || voice || VOICE_ID

    console.log('[TTS] API key present:', !!process.env.ELEVENLABS_API_KEY, '| key prefix:', process.env.ELEVENLABS_API_KEY?.slice(0, 8))

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text().catch(() => 'Unknown error')
      console.error('[TTS] ElevenLabs error:', response.status, err)
      return NextResponse.json({ error: 'TTS failed', detail: err, status: response.status }, { status: 500 })
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[TTS] error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
