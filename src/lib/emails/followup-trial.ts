import { emailLayout } from './layout'

export function followupTrialEmail({ name, slug, portalType }: { name: string; slug: string; portalType?: 'business' | 'schools' }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumiocms.com'
  const workspaceUrl = portalType === 'schools' ? `${appUrl}/schools/${slug}` : `${appUrl}/demo/${slug}`
  const isSchool = portalType === 'schools'

  return emailLayout(`
    <div style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <p style="color:#F9FAFB;font-size:16px;margin:0 0 16px;">Hi ${name},</p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${isSchool
          ? 'I noticed you signed up for Lumio Schools a couple of days ago — have you had a chance to explore your workspace?'
          : `Just checking in — you created your Lumio workspace a couple of days ago. Have you had a chance to look around?`
        }
      </p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 16px;">
        ${isSchool
          ? 'Your demo workspace has everything pre-loaded — safeguarding, attendance, SEND, timetabling, and more. It takes about 3 minutes to see what it can do for your school.'
          : 'Your trial workspace is fully set up with demo data across every department — CRM, HR, finance, operations, and AI-powered insights. Takes about 3 minutes to see the full picture.'
        }
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${workspaceUrl}" style="display:inline-block;padding:12px 32px;background-color:#0D9488;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Open your workspace →
        </a>
      </div>
      <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:16px 0 0;">
        If you have any questions or want a quick walkthrough, just reply to this email — I read every one.
      </p>
      <p style="color:#6B7280;font-size:13px;margin:16px 0 0;">
        Arron<br/>
        <span style="color:#4B5563;">Founder, Lumio</span>
      </p>
    </div>
  `)
}
