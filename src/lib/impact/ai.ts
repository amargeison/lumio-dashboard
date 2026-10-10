'use client'

// Live-portal AI drafting for Lumio Impact. Demo mode never calls this — the
// views use their canned demo copy instead (same split as the Tennis portal:
// canned text when isDemoShell, /api/ai/<sport> when live).

const strip = (t: string) => t
  .replace(/#{1,6}\s*/g, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/^\s*[-•*]\s+/gm, '')
  .trim()

export async function draftWithImpactAI(prompt: string, maxTokens = 400): Promise<string> {
  const res = await fetch('/api/ai/impact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: `${prompt}\n\nRespond in plain text only — no markdown, headings or bullet points.` }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'AI unavailable')
  const text = Array.isArray(data?.content) ? data.content.map((c: { text?: string }) => c.text ?? '').join('') : ''
  if (!text) throw new Error('No draft returned')
  return strip(text)
}
