/**
 * Wrapper around Resend that suppresses emails on non-production environments.
 * On dev/preview without RESEND_API_KEY: logs the email to console instead of sending.
 * On production OR when RESEND_API_KEY is set: sends normally via Resend.
 *
 * It also logs rejected sends. resend.emails.send() RESOLVES with { data, error }
 * rather than throwing, so a try/catch around a call site never fires and a
 * rejected send looks exactly like a successful one. That is how six senders
 * stayed dead for months. Logging here means a caller cannot forget it.
 */

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production' || process.env.NODE_ENV === 'production'
const HAS_RESEND_KEY = !!process.env.RESEND_API_KEY

/** Recipient domains only — a log should identify the send, not the person. */
function recipientDomains(to: string[]): string {
  const domains = [...new Set(to.map(addr => {
    const at = addr.lastIndexOf('@')
    return at === -1 ? 'unknown' : addr.slice(at)
  }))]
  return to.length > 1 ? `${to.length} × ${domains.join(', ')}` : domains.join(', ')
}

export async function sendEmail(params: {
  from: string
  to: string[]
  subject: string
  html: string
  scheduledAt?: string
  // Passed straight through to Resend. Needed wherever Lumio sends on someone
  // else's behalf — a coach's booking confirmation must let a parent reply to the
  // coach, not to a noreply address.
  replyTo?: string
  /**
   * Short identifier for the logs, e.g. 'schools/signup otp' or
   * 'demo/provision followup-48h'. Names which send failed without putting the
   * recipient's address in the log. Falls back to the subject when omitted.
   * Never forwarded to Resend.
   */
  context?: string
}) {
  const { context, ...mail } = params

  // Send if production OR if RESEND_API_KEY is explicitly set (allows dev/preview sending)
  if (!IS_PRODUCTION && !HAS_RESEND_KEY) {
    console.log(`[EMAIL SUPPRESSED — dev mode, no RESEND_API_KEY] To: ${mail.to.join(', ')} | Subject: ${mail.subject}`)
    return { data: { id: 'dev-suppressed' }, error: null }
  }

  if (!HAS_RESEND_KEY) {
    console.log(`[EMAIL SKIPPED — no RESEND_API_KEY] To: ${mail.to.join(', ')} | Subject: ${mail.subject}`)
    return { data: { id: 'no-key' }, error: null }
  }

  console.log(`[EMAIL SENDING] To: ${recipientDomains(mail.to)} | Subject: ${mail.subject}`)
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const result = await resend.emails.send(mail)

  if (result.error) {
    console.error(
      `[emails] send rejected — ${context || mail.subject} → ${recipientDomains(mail.to)}:`,
      result.error,
    )
  }

  return result
}
