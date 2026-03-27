/**
 * Shared email layout wrapper for all Lumio emails.
 * Dark-themed, single column, max-width 600px, inline CSS.
 */

const LOGO_URL = 'https://lumiocms.com/lumio-logo-primary.png'

export function emailLayout({ body, preheader }: { body: string; preheader?: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lumio</title>
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#111318;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">

<!-- Logo header -->
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1f2937;">
  <img src="${LOGO_URL}" alt="Lumio" width="100" style="display:block;height:auto;border:0;" />
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;">
${body}
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 32px;border-top:1px solid #1f2937;">
  <p style="margin:0;font-size:12px;color:#4b5563;text-align:center;line-height:1.6;">
    Lumio Ltd &middot; <a href="https://lumiocms.com" style="color:#6b7280;text-decoration:underline;">lumiocms.com</a>
    &middot; <a href="https://lumiocms.com/unsubscribe" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a><br>
    UK GDPR compliant &middot; Data stored in London (AWS eu-west-2)
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export function ctaButton(text: string, href: string, color = '#0d9488') {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td align="center" style="border-radius:12px;background-color:${color};">
  <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${text}</a>
</td></tr>
</table>`
}
