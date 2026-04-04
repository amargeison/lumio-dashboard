import type { EnrichmentResult } from './types'
import { buildEnrichmentSystemPrompt } from './aria'

export { buildEnrichmentSystemPrompt }
export type { EnrichmentResult }

/**
 * Enriches a contact by calling the Anthropic API with ARIA's enrichment prompt.
 * Intended to be called from an API route that has access to the Anthropic SDK.
 */
export async function enrichContact(
  name: string,
  email: string | null,
  company: string | null,
  role: string | null,
): Promise<EnrichmentResult> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })

  const userPrompt = [
    `Name: ${name}`,
    email ? `Email: ${email}` : null,
    company ? `Company: ${company}` : null,
    role ? `Role: ${role}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: buildEnrichmentSystemPrompt(),
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const result: EnrichmentResult = JSON.parse(text)
    return result
  } catch {
    throw new Error(`Failed to parse enrichment response: ${text.slice(0, 200)}`)
  }
}
