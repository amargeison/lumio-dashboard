// Server component wrapper for the marketing chrome. Reads the `Host` header
// at request time and passes `initialIsSportsHost` down to WebsiteChrome, so
// the SSR output already reflects the correct branding — no client-side
// hostname detection, no ~200ms business-header flash on lumiosports.com.
//
// WebsiteChrome is still a Client Component (it owns useState for the mobile
// nav, scrolled background, modals, beta banner, etc.). We just hoist the
// host read out of the client so it happens server-side.
import { headers } from 'next/headers'
import WebsiteChrome from './WebsiteChrome'

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const host = h.get('host') ?? ''
  const initialIsSportsHost = host.includes('lumiosports')
  return <WebsiteChrome initialIsSportsHost={initialIsSportsHost}>{children}</WebsiteChrome>
}
