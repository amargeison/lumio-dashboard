import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { isSportsHost } from '@/lib/config/hosts'

// /[slug] is the business workspace dashboard — dev.lumiocms.com/lumio-dev and
// friends. It has no allowlist: any single-segment path the middleware has not
// already claimed renders it, so an unmatched URL used to answer 200 with the
// business shell on EVERY host, lumiosports.com included.
//
// On the sports domain that is wrong twice over: a sports visitor is shown a
// business product they did not ask for, and every junk URL under the domain is
// an indexable 200. Business hosts are untouched — the route is doing its job
// there.
export default async function WorkspaceSlugLayout({ children }: { children: React.ReactNode }) {
  if (isSportsHost((await headers()).get('host'))) notFound()
  return children
}
