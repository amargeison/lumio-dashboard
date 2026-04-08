import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const { data, error } = await supabase
      .from('football_match_reports')
      .select('*, football_report_templates(*)')
      .eq('id', reportId)
      .single()

    if (error || !data) {
      console.error('[match-report GET]', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ report: data })
  } catch (err) {
    console.error('[match-report GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'body required' }, { status: 400 })

    const { data: existing, error: getErr } = await supabase
      .from('football_match_reports')
      .select('edited_content, version')
      .eq('id', reportId)
      .single()
    if (getErr || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let newContent = existing.edited_content
    if (body.sectionId !== undefined && Array.isArray(newContent)) {
      newContent = newContent.map((s: any) => s.id === body.sectionId ? { ...s, content: body.content } : s)
    } else if (body.editedContent !== undefined) {
      newContent = body.editedContent
    }

    let wordCount = 0
    if (Array.isArray(newContent)) {
      for (const s of newContent) {
        const c = s?.content
        if (typeof c === 'string') wordCount += c.split(/\s+/).filter(Boolean).length
        else if (Array.isArray(c)) {
          for (const item of c) {
            const txt = typeof item === 'string' ? item : Object.values(item ?? {}).join(' ')
            wordCount += String(txt).split(/\s+/).filter(Boolean).length
          }
        }
      }
    }

    const { error: updErr } = await supabase
      .from('football_match_reports')
      .update({
        edited_content: newContent,
        word_count: wordCount,
        version: (existing.version ?? 1) + 1,
      })
      .eq('id', reportId)

    if (updErr) {
      console.error('[match-report PATCH]', updErr)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, wordCount, version: (existing.version ?? 1) + 1 })
  } catch (err) {
    console.error('[match-report PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
