// The origin to put in links that leave the server — Stripe return URLs, OAuth
// redirects, emailed links.
//
// Behind nginx, Next resolves the request URL against the internal bind address,
// so `new URL(req.url).origin` can come back as http://0.0.0.0:3000. That is fine
// for a redirect the browser never sees and fatal for a Stripe success_url, which
// is where the parent lands after paying. Prefer the configured public base and
// only fall back to the request when it is genuinely absent.
const PRIVATE = /^https?:\/\/(0\.0\.0\.0|127\.0\.0\.1|localhost|\[::1?\])(:|$)/i

export function publicSiteOrigin(fallback: string): string {
  const configured = (process.env.PUBLIC_SITE_URL || process.env.OAUTH_REDIRECT_BASE || '').trim().replace(/\/+$/, '')
  if (configured) return configured
  // No configured base. In development the request origin IS the real one, so use
  // it; in production a private origin means the deploy is missing OAUTH_REDIRECT_BASE
  // and a loud log beats a silently broken payment link.
  if (PRIVATE.test(fallback) && process.env.NODE_ENV === 'production') {
    console.error('[public-origin] request origin is internal (%s) and no PUBLIC_SITE_URL/OAUTH_REDIRECT_BASE is set — outbound links will be wrong.', fallback)
  }
  return fallback.replace(/\/+$/, '')
}
