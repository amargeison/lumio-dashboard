// Canonical host checks, shared by the middleware and by server components that
// need to know which product a request is for.
//
// The sports domain and the business domain are served by the same Next app, so
// a route that is legitimate on one can be wrong on the other. Keeping the
// check in one place stops the two drifting apart.

/** Strips the port so the check works in local dev and behind a proxy. */
export function normaliseHost(host: string | null | undefined): string {
  return host?.replace(/:\d+$/, '') || ''
}

/** lumiosports.com and its www / app subdomains. */
export function isSportsHost(host: string | null | undefined): boolean {
  const h = normaliseHost(host)
  return h === 'lumiosports.com' || h === 'www.lumiosports.com' || h === 'app.lumiosports.com'
}
