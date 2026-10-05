import type { NextConfig } from 'next'

// PWA: hand-rolled at /public/sw.js (registered by src/components/PwaInstaller.tsx).
// next-pwa was removed because it's incompatible with Next 16 + Turbopack — its
// last release predates Next 14 and it overwrites /public/sw.js during build.

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nrrympsgxsadiemzqwci.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  redirects: async () => [
    // Canonical coach demo URL is the tennis-scoped /tennis/coach/demo (served by
    // the re-export route src/app/tennis/coach/[slug]/page.tsx — a redirect runs
    // before filesystem routing but `source` is an EXACT match, so the manifest
    // sub-path /coach/demo/m/... is untouched). The bare /coach/demo still works,
    // redirecting here, so existing links / old PWA installs don't break.
    { source: '/coach/demo', destination: '/tennis/coach/demo', permanent: false },
    { source: '/sales-crm', destination: '/sales', permanent: true },
    { source: '/crm/:path*', destination: 'https://app.lumiocms.com/crm/:path*', permanent: false, has: [{ type: 'host', value: 'lumiocms.com' }] },
    { source: '/demo/football/:slug', destination: '/football/pro/:slug', permanent: true },
    { source: '/demo/football-amateur/:slug', destination: '/football/grassroots/:slug', permanent: true },
    { source: '/football/nonleague/:slug', destination: '/nonleague/:slug', permanent: true },
    { source: '/football/grassroots/:slug', destination: '/grassroots/:slug', permanent: true },
    // The sports pricing page is retired: its nav entry and every in-app link
    // are gone, but inbound links and bookmarks still exist, so send them to
    // /sports rather than a 404. Temporary (307) on purpose — the page file is
    // still in the tree while we confirm nothing points at it; make this
    // permanent when the file is deleted.
    { source: '/pricing-sports', destination: '/sports', permanent: false },
    // /join was a "Choose your sport" sign-up grid pushing
    // /sports-signup?sport=<id> for ten demo-only sports, under a "Founding
    // Member — Free for 3 months · No card needed · 20 spots remaining"
    // banner. Nothing in src/ linked to it, but it was live and indexable, so
    // the page is deleted and inbound links land on the demo index instead.
    // Temporary (307) to match /pricing-sports.
    { source: '/join', destination: '/sports/try-demo', permanent: false },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
      ],
    },
    // The catch-all above keeps PAGES and /api answers out of every cache: a
    // page names the build files it needs, so a stored page after a release
    // asks for files that no longer exist, and an API answer belongs to whoever
    // is signed in. But it also covered the build files themselves, and Next
    // only applies its own "keep for ever" header when nothing else has set
    // one — so every script was downloaded again on every page view, and the
    // installed app's service worker (which rightly refuses to keep anything
    // marked no-store) held nothing: with no signal, opening a module replaced
    // the whole app with "This page couldn't load".
    //
    // Build files carry a fingerprint of their contents in their name, so a
    // stored copy can never be out of date; a release ships new names, and the
    // (never-stored) page asks for those. Production builds only: in
    // development the names do NOT change when the code does.
    ...(process.env.NODE_ENV === 'production' ? [{
      source: '/_next/static/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }] : []),
    // Logos, icons and other images served from /public (top level and
    // /icons). Their names do not change, so they are kept for a day rather
    // than for ever — a 600 KB logo was fetched again on every page view.
    {
      source: '/:file([^/]+\\.(?:png|jpg|jpeg|webp|svg|ico|gif))',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
    },
    {
      source: '/icons/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
    },
    // Pre-shrunk marketing images. Everything else is no-store (above), which
    // also covers /public — so a logo was re-downloaded on every page view.
    // This folder is safe to cache hard: a changed image gets a new filename.
    {
      source: '/opt/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    // Allow service worker to be served (with its own short TTL so SW updates propagate quickly)
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],
}

export default nextConfig
