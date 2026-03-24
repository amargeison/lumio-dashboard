import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `You are an experienced UK primary/secondary school teacher with expertise in lesson planning and curriculum design. Your task is to generate appropriate cover work for a class when their usual teacher is absent.

Always structure your response as valid JSON with exactly these keys:
- cover_teacher_instructions: Clear step-by-step instructions for the cover teacher (what to do, how to manage the class, timing)
- pupil_task_sheet: The actual task/activity for pupils, written directly to the pupils as if on a printed sheet. Include clear objectives, instructions, and questions or tasks.
- extension_activities: 2-3 extension tasks for early finishers, appropriately challenging
- marking_guide: A simple guide so the cover teacher (or class teacher on return) can quickly mark or assess the work

Format each section clearly with headings. Keep language age-appropriate for the specified year group. Follow the UK national curriculum where relevant.`

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    teacher_name,
    absence_id,
    year_group,
    subject,
    topic,
    duration,
    instructions,
  } = body as {
    teacher_name: string
    absence_id?: string
    year_group: string
    subject: string
    topic: string
    duration: string
    instructions?: string
  }

  if (!teacher_name || !year_group || !subject || !topic) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const userMessage = `Please generate cover work for the following:

Teacher: ${teacher_name}
Year Group: ${year_group}
Subject: ${subject}
Topic/Unit: ${topic}
Duration: ${duration}${instructions ? `\nSpecial instructions: ${instructions}` : ''}

Generate appropriate, engaging cover work that a supply or cover teacher can deliver without specialist knowledge of the subject.`

  let generatedContent: {
    cover_teacher_instructions: string
    pupil_task_sheet: string
    extension_activities: string
    marking_guide: string
  } | null = null

  let promptTokens = 0
  let completionTokens = 0
  let rawDoc = ''

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[cover-work] Claude API error:', err)
      return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 502 })
    }

    const result = await response.json()
    rawDoc = result.content?.[0]?.text ?? ''
    promptTokens = result.usage?.input_tokens ?? 0
    completionTokens = result.usage?.output_tokens ?? 0

    // Parse JSON response from Claude
    const jsonMatch = rawDoc.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        generatedContent = JSON.parse(jsonMatch[0])
      } catch {
        // If JSON parse fails, store raw text
        generatedContent = {
          cover_teacher_instructions: rawDoc,
          pupil_task_sheet: '',
          extension_activities: '',
          marking_guide: '',
        }
      }
    } else {
      generatedContent = {
        cover_teacher_instructions: rawDoc,
        pupil_task_sheet: '',
        extension_activities: '',
        marking_guide: '',
      }
    }
  } catch (err) {
    console.error('[cover-work] Fetch error:', err)
    return NextResponse.json({ error: 'Failed to reach AI service.' }, { status: 502 })
  }

  // Save to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let savedId: string | null = null

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('school_cover_work')
      .insert({
        teacher_name,
        absence_id: absence_id ?? null,
        year_group,
        subject,
        topic,
        duration,
        instructions: instructions ?? null,
        generated_doc: rawDoc,
        cover_teacher_instructions: generatedContent?.cover_teacher_instructions ?? null,
        pupil_task_sheet: generatedContent?.pupil_task_sheet ?? null,
        extension_activities: generatedContent?.extension_activities ?? null,
        marking_guide: generatedContent?.marking_guide ?? null,
        model_used: 'claude-sonnet-4-6',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[cover-work] Supabase insert error:', error)
    } else {
      savedId = data?.id ?? null
    }
  }

  return NextResponse.json({
    status: 'generated',
    id: savedId,
    teacher_name,
    year_group,
    subject,
    topic,
    duration,
    cover_teacher_instructions: generatedContent?.cover_teacher_instructions ?? '',
    pupil_task_sheet: generatedContent?.pupil_task_sheet ?? '',
    extension_activities: generatedContent?.extension_activities ?? '',
    marking_guide: generatedContent?.marking_guide ?? '',
    tokens_used: promptTokens + completionTokens,
  })
}
