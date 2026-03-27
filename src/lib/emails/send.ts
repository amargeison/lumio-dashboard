/**
 * Wrapper around Resend that suppresses emails on non-production environments.
 * On dev/preview: logs the email to console instead of sending.
 * On production: sends normally via Resend.
 */

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production' || process.env.NODE_ENV === 'production'

export async function sendEmail(params: {
  from: string
  to: string[]
  subject: string
  html: string
}) {
  if (!IS_PRODUCTION) {
    console.log(`[EMAIL SUPPRESSED — dev mode] To: ${params.to.join(', ')} | Subject: ${params.subject}`)
    return { data: { id: 'dev-suppressed' }, error: null }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send(params)
}
