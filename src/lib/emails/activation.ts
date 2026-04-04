import { emailLayout, ctaButton } from './layout'

export function activationEmail({ name, slug, token }: { name: string; slug: string; token: string }) {
  const activateUrl = `https://app.lumiocms.com/activate?token=${token}`
  const loginUrl = `app.lumiocms.com/${slug}`

  return emailLayout({
    preheader: 'Click to activate your Lumio account',
    body: `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#F9FAFB;">Welcome to Lumio, ${name}!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#9CA3AF;line-height:1.6;">
        Your workspace is ready. Click the button below to activate your account and start using Lumio.
      </p>

      ${ctaButton('Activate your account', activateUrl)}

      <p style="margin:0 0 24px;font-size:13px;color:#6B7280;">
        Your login URL: <a href="https://${loginUrl}" style="color:#0D9488;text-decoration:underline;">${loginUrl}</a>
      </p>

      <div style="background:#07080F;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #1F2937;">
        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#F9FAFB;">What happens next</p>
        <ul style="margin:0;padding:0 0 0 20px;color:#9CA3AF;font-size:13px;line-height:1.8;">
          <li>Your workspace is immediately available — explore dashboards, CRM, and workflows</li>
          <li>Invite your team from Settings so they can access their department views</li>
          <li>Connect your tools (Gmail, Slack, Xero) in Settings → Integrations to unlock automation</li>
        </ul>
      </div>

      <p style="margin:0;font-size:12px;color:#4B5563;">
        This activation link expires in 24 hours. If it expires, you can request a new one from your dashboard.
      </p>
    `,
  })
}
