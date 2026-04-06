import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey }
    })

    const data = await res.json()
    const voices = (data.voices || []).map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      gender: v.labels?.gender,
      accent: v.labels?.accent,
      use_case: v.labels?.['use case'],
    }))

    return NextResponse.json({ count: voices.length, voices, status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch voices', detail: String(err) }, { status: 500 })
  }
}
