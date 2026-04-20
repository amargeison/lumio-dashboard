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
    { source: '/sales-crm', destination: '/sales', permanent: true },
    { source: '/crm/:path*', destination: 'https://app.lumiocms.com/crm/:path*', permanent: false, has: [{ type: 'host', value: 'lumiocms.com' }] },
    { source: '/demo/football/:slug', destination: '/football/pro/:slug', permanent: true },
    { source: '/demo/football-amateur/:slug', destination: '/football/grassroots/:slug', permanent: true },
    { source: '/football/nonleague/:slug', destination: '/nonleague/:slug', permanent: true },
    { source: '/football/grassroots/:slug', destination: '/grassroots/:slug', permanent: true },
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
