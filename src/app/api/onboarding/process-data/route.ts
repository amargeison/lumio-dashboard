import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // For now: acknowledge receipt and return summary
    // Future: use Claude API to analyse files and route to departments
    const summary = files.map(f => `${f.name} (${(f.size / 1024).toFixed(0)} KB) — queued for processing`)

    return NextResponse.json({
      success: true,
      summary: [
        `${files.length} file${files.length > 1 ? 's' : ''} received`,
        ...summary,
        'Files will be analysed and sorted into the correct departments automatically.',
      ],
    })
  } catch (err) {
    console.error('[onboarding/process-data]', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
