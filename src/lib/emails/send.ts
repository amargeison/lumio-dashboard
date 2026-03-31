/**
 * Wrapper around Resend that suppresses emails on non-production environments.
 * On dev/preview without RESEND_API_KEY: logs the email to console instead of sending.
 * On production OR when RESEND_API_KEY is set: sends normally via Resend.
 */

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production' || process.env.NODE_ENV === 'production'
const HAS_RESEND_KEY = !!process.env.RESEND_API_KEY

export async function sendEmail(params: {
  from: string
  to: string[]
  subject: string
  html: string
}) {
  // Send if production OR if RESEND_API_KEY is explicitly set (allows dev/preview sending)
  if (!IS_PRODUCTION && !HAS_RESEND_KEY) {
    console.log(`[EMAIL SUPPRESSED — dev mode, no RESEND_API_KEY] To: ${params.to.join(', ')} | Subject: ${params.subject}`)
    return { data: { id: 'dev-suppressed' }, error: null }
  }

  if (!HAS_RESEND_KEY) {
    console.log(`[EMAIL SKIPPED — no RESEND_API_KEY] To: ${params.to.join(', ')} | Subject: ${params.subject}`)
    return { data: { id: 'no-key' }, error: null }
  }

  console.log(`[EMAIL SENDING] To: ${params.to.join(', ')} | Subject: ${params.subject}`)
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send(params)
}
