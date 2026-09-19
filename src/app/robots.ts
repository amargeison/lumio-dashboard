import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { isSportsHost } from '@/lib/config/hosts'

// Both products are served by the same Next app from two domains, so the
// crawl policy has to branch on host rather than live in a static
// public/robots.txt, which would answer for both.
//
// No Sitemap: line — there is no sitemap route in this app, and pointing at a
// missing one is worse than omitting it. No wildcard patterns either: the
// explicit prefixes below cover the same ground and parse everywhere.
//
// Note this file stops crawling, not indexing: a URL linked from elsewhere can
// still show as a bare result. Authentication is what protects the dashboards;
// these rules keep them out of crawl in the first place.

// Sign-in, admin and machine endpoints, plus the seeded demo workspaces, which
// sit behind an email gate and duplicate the marketing pages' content.
const SHARED = [
  '/login',
  '/signup',
  '/auth/',
  '/dev-login',
  '/admin/',
  '/api/',
  '/portal/',
  '/demo/',
]

// lumiosports.com. Unmatched paths 404 here (see src/app/[slug]/layout.tsx),
// so there is no tenant surface to keep out — only the sports sign-in flows and
// the two demos that are not for search: the coach demo and the partner-facing
// Impact workspace.
const SPORTS_ONLY = [
  '/sports-login',
  '/sports-signup',
  '/sports-admin/',
  '/tennis/coach/demo',
  '/impact/tenproject',
]

// lumiocms.com. The workspace catch-all is live here, so the department routes
// it serves are kept out of crawl. These are (dashboard) routes, not marketing
// ones — /pricing, /about, /product, /blog and /home stay crawlable.
//
// A tenant's own URLs take the form /<slug>/<dept>, and robots.txt cannot
// enumerate arbitrary slugs without a wildcard, so those rest on auth.
const BUSINESS_ONLY = [
  '/overview',
  '/hr',
  '/accounts',
  '/sales',
  '/crm',
  '/marketing',
  '/operations',
  '/it',
  '/insights',
  '/school-office',
  '/workflows',
  '/strategy',
  '/trials',
  '/partners',
  '/support',
  '/success',
  '/settings',
  '/projects',
  '/onboarding',
  '/directors',
  '/dfe',
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const sports = isSportsHost((await headers()).get('host'))
  return {
    rules: {
      userAgent: '*',
      disallow: [...SHARED, ...(sports ? SPORTS_ONLY : BUSINESS_ONLY)].sort(),
    },
  }
}
