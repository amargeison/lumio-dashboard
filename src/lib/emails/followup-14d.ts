import { emailLayout } from './layout'

export function followup14dEmail({ name, slug, companyName, portalType }: { name: string; slug: string; companyName?: string; portalType?: 'business' | 'schools' }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumiocms.com'
  const workspaceUrl = portalType === 'schools' ? `${appUrl}/schools/${slug}` : `${appUrl}/demo/${slug}`
  const isSchool = portalType === 'schools'

  return emailLayout(`
    <div style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px;">Hi ${name},</p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your ${isSchool ? (companyName || 'school') : 'Lumio'} workspace trial has ended — but your data is still there.
      </p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${isSchool
          ? 'If you need more time to evaluate, or want to show your SLT, I can extend your trial — just reply to this email.'
          : 'If you ran out of time, or want to show your team, I can extend your trial — just reply to this email.'
        }
      </p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${isSchool
          ? 'Or if you\'re ready to go live, upgrading takes 2 minutes and your demo data carries over:'
          : 'Or if you\'re ready, upgrading takes 2 minutes and everything you set up carries over:'
        }
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${workspaceUrl}" style="display:inline-block;padding:12px 32px;background-color:#7C3AED;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Reactivate workspace →
        </a>
      </div>
      <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:16px 0 0;">
        No pressure — if Lumio isn't right for you, no hard feelings. But if timing was the issue, just say the word.
      </p>
      <p style="color:#6B7280;font-size:13px;margin:16px 0 0;">
        Arron<br/>
        <span style="color:#4B5563;">Founder, Lumio</span>
      </p>
    </div>
  `)
}
