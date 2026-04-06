import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'DEEPAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const inForm = await req.formData()
    const image = inForm.get('image') as File | null
    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    const outForm = new FormData()
    outForm.append('image', image, image.name || 'photo.jpg')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch('https://api.deepai.org/api/toonify', {
      method: 'POST',
      headers: { 'api-key': apiKey },
      body: outForm,
      signal: controller.signal,
    }).catch((err: unknown) => {
      throw err
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ success: false, error: `DeepAI returned ${res.status}: ${text.slice(0, 200)}` }, { status: 502 })
    }

    const data = await res.json() as { output_url?: string; err?: string }
    if (!data.output_url) {
      return NextResponse.json({ success: false, error: data.err || 'No output_url returned' }, { status: 502 })
    }

    return NextResponse.json({ success: true, cartoon_url: data.output_url })
  } catch (err) {
    const message = err instanceof Error
      ? (err.name === 'AbortError' ? 'DeepAI request timed out after 15s' : err.message)
      : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
