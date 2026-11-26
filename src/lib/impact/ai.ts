'use client'

// Live-portal AI drafting for Lumio Impact. Demo mode never calls this — the
// views use their canned demo copy instead (same split as the Tennis portal:
// canned text when isDemoShell, /api/ai/<sport> when live).
//
// Every call names the org (impactFetch) and a feature, so /api/ai/impact can count it
// against that org's daily allowance. Over the allowance, the error says so in plain words.

import { impactFetch } from './org-scope'
import type { AngleId } from './ai-prompt'
import type { NewsletterSection } from './newsletter'

const strip = (t: string) => t
  .replace(/#{1,6}\s*/g, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/^\s*[-•*]\s+/gm, '')
  .trim()

export async function draftWithImpactAI(prompt: string, maxTokens = 400, feature: 'message' | 'social' | 'other' = 'message'): Promise<string> {
  const res = await impactFetch('/api/ai/impact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feature,
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: `${prompt}\n\nRespond in plain text only — no markdown, headings or bullet points.` }],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'AI unavailable')
  const text = Array.isArray(data?.content) ? data.content.map((c: { text?: string }) => c.text ?? '').join('') : ''
  if (!text) throw new Error('No draft returned')
  return strip(text)
}

export type NewsletterAiDraft = { subject?: string; preheader?: string; sections?: { headline: string; body: string }[]; headline?: string; body?: string }

/** A newsletter draft written from the org's own facts on the server. */
export async function draftNewsletter(angle: AngleId, target?: { index: number; current: NewsletterSection; others: string[] }, focusDate?: string | null): Promise<NewsletterAiDraft> {
  const res = await impactFetch('/api/ai/impact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature: 'newsletter', angle, focusDate: focusDate ?? null, target: target ? { kind: 'section', ...target } : { kind: 'all' } }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.draft) throw new Error(data?.error || 'AI unavailable')
  return data.draft as NewsletterAiDraft
}
