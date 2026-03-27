import { emailLayout } from './layout'

export function otpEmail({ name, code }: { name: string; code: string }) {
  return emailLayout({
    preheader: `Your Lumio sign-in code: ${code}`,
    body: `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Your Lumio sign-in code</h1>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
  Hi ${name}, enter this 6-digit code to sign in to your Lumio workspace. It expires in 10 minutes.
</p>

<div style="background:rgba(124,58,237,0.12);border:2px solid #7c3aed;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:rgba(255,255,255,0.4);text-transform:uppercase;">Your code</p>
  <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:0.3em;color:#ffffff;font-variant-numeric:tabular-nums;">${code}</p>
</div>

<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;">
  If you didn&rsquo;t request this, you can safely ignore this email.
</p>`,
  })
}
